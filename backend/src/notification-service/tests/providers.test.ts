import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import sinon from 'sinon';
import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';

import { 
  EmailProvider, 
  emailProvider 
} from '../src/providers/email.provider';

import { 
  FCMProvider, 
  fcmProvider 
} from '../src/providers/fcm.provider';

import { 
  getProviderForChannel,
  sendNotification,
  sendBulkNotifications,
  retryDelivery,
  verifyProviders
} from '../src/providers';

import { 
  INotification, 
  NotificationType, 
  DeliveryChannel,
  NotificationStatus
} from '../../../shared/src/types/notification.types';

import { 
  IDeliveryDocument, 
  Delivery 
} from '../src/models/delivery.model';

import { notificationConfig } from '../src/config';

let mongoServer: MongoMemoryServer;

// Setup test database
async function setupTestDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('Connected to in-memory database');
}

// Teardown test database
async function teardownTestDatabase(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Disconnected from in-memory database');
}

// Clear collections between tests
async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('Cleared all collections');
}

// Create a mock notification for testing
function createMockNotification(overrides: Partial<INotification> = {}): INotification {
  return {
    id: overrides.id || new mongoose.Types.ObjectId().toString(),
    userId: overrides.userId || new mongoose.Types.ObjectId().toString(),
    type: overrides.type || NotificationType.EVENT_REMINDER,
    title: overrides.title || 'Test Notification',
    body: overrides.body || 'This is a test notification',
    priority: overrides.priority || 'MEDIUM' as any,
    status: overrides.status || 'PENDING' as any,
    createdAt: overrides.createdAt || new Date(),
    expiresAt: overrides.expiresAt || null,
    tribeId: overrides.tribeId || new mongoose.Types.ObjectId().toString(),
    eventId: overrides.eventId || null,
    actionUrl: overrides.actionUrl || 'https://tribe-app.com/events/123',
    imageUrl: overrides.imageUrl || null,
    metadata: overrides.metadata || { eventName: 'Test Event' }
  };
}

// Create a mock delivery document
function createMockDelivery(
  notificationId: string, 
  channel: DeliveryChannel, 
  status: NotificationStatus
): Partial<IDeliveryDocument> {
  return {
    notificationId,
    channel,
    status,
    sentAt: status === NotificationStatus.SENT ? new Date() : undefined,
    deliveredAt: status === NotificationStatus.DELIVERED ? new Date() : undefined,
    readAt: status === NotificationStatus.READ ? new Date() : undefined,
    errorMessage: status === NotificationStatus.FAILED ? 'Test error' : undefined,
    retryCount: 0,
    metadata: { test: 'metadata' }
  };
}

// Create a mock for nodemailer transport
function mockNodemailer(shouldSucceed: boolean) {
  return {
    sendMail: sinon.stub().callsFake((mailOptions) => {
      return new Promise((resolve, reject) => {
        if (shouldSucceed) {
          resolve({
            messageId: '<test-message-id@example.com>',
            response: '250 Message accepted'
          });
        } else {
          reject(new Error('Failed to send email'));
        }
      });
    }),
    verify: sinon.stub().resolves(true)
  };
}

// Create a mock for Firebase Admin SDK
function mockFirebaseAdmin(shouldSucceed: boolean) {
  return {
    initializeApp: sinon.stub(),
    apps: [{}], // Pretend Firebase is already initialized
    app: sinon.stub().returns({
      options: {
        credential: {
          getAccessToken: sinon.stub().resolves({
            access_token: 'mock-token'
          })
        }
      }
    }),
    messaging: sinon.stub().returns({
      send: sinon.stub().callsFake(() => {
        if (shouldSucceed) {
          return Promise.resolve('message-id-123');
        } else {
          return Promise.reject(new Error('Failed to send push notification'));
        }
      }),
      sendMulticast: sinon.stub().callsFake(() => {
        if (shouldSucceed) {
          return Promise.resolve({
            successCount: 2,
            failureCount: 0,
            responses: [
              { success: true, messageId: 'message-id-1' },
              { success: true, messageId: 'message-id-2' }
            ]
          });
        } else {
          return Promise.reject(new Error('Failed to send push notification'));
        }
      }),
      sendAll: sinon.stub().callsFake(() => {
        if (shouldSucceed) {
          return Promise.resolve({
            successCount: 2,
            failureCount: 0,
            responses: [
              { success: true, messageId: 'message-id-1' },
              { success: true, messageId: 'message-id-2' }
            ]
          });
        } else {
          return Promise.resolve({
            successCount: 0,
            failureCount: 2,
            responses: [
              { error: { code: 'messaging/invalid-token', message: 'Invalid token' } },
              { error: { code: 'messaging/invalid-token', message: 'Invalid token' } }
            ]
          });
        }
      })
    })
  };
}

// Set up and tear down for all tests
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Clear collections before each test
beforeEach(async () => {
  await clearCollections();
  
  // Reset sinon stubs
  sinon.restore();
});

describe('Email Provider', () => {
  test('should initialize with SMTP configuration', () => {
    // Mock nodemailer createTransport function
    const createTransportStub = sinon.stub(nodemailer, 'createTransport').returns(mockNodemailer(true) as any);
    
    // Create new email provider
    const provider = new EmailProvider();
    
    // Verify createTransport was called with correct SMTP config
    expect(createTransportStub.calledOnce).toBeTruthy();
    expect(provider).toHaveProperty('transporter');
  });

  test('should send an email notification', async () => {
    // Mock nodemailer transport
    const mockTransport = mockNodemailer(true);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Mock getUserEmailAddress to return a test email
    const getUserEmailAddressStub = sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ email: 'test@example.com' })
    } as any);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Call send method
    const result = await emailProvider.send(notification);
    
    // Verify email was sent with correct parameters
    expect(mockTransport.sendMail.calledOnce).toBeTruthy();
    expect(mockTransport.sendMail.firstCall.args[0]).toHaveProperty('to', 'test@example.com');
    expect(mockTransport.sendMail.firstCall.args[0]).toHaveProperty('subject');
    expect(mockTransport.sendMail.firstCall.args[0]).toHaveProperty('html');
    expect(mockTransport.sendMail.firstCall.args[0]).toHaveProperty('text');
    
    // Verify delivery document was created
    expect(result).toBeDefined();
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.channel).toBe(DeliveryChannel.EMAIL);
    expect(result.notificationId).toBe(notification.id);
  });

  test('should handle email sending failure', async () => {
    // Mock nodemailer transport with failure
    const mockTransport = mockNodemailer(false);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Mock getUserEmailAddress
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ email: 'test@example.com' })
    } as any);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Call send method
    const result = await emailProvider.send(notification);
    
    // Verify delivery document reflects failure
    expect(result).toBeDefined();
    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(result.channel).toBe(DeliveryChannel.EMAIL);
    expect(result.notificationId).toBe(notification.id);
    expect(result.metadata).toHaveProperty('error', 'Failed to send email');
  });

  test('should handle missing email address', async () => {
    // Mock nodemailer transport
    const mockTransport = mockNodemailer(true);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Mock getUserEmailAddress to return null
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves(null)
    } as any);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Call send method
    const result = await emailProvider.send(notification);
    
    // Verify delivery document reflects failure
    expect(result).toBeDefined();
    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(result.metadata).toHaveProperty('error', 'Failed to retrieve user email');
    
    // Verify sendMail was not called
    expect(mockTransport.sendMail.called).toBeFalsy();
  });

  test('should send bulk email notifications', async () => {
    // Mock nodemailer transport
    const mockTransport = mockNodemailer(true);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Mock getUserEmailAddress
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ email: 'test@example.com' })
    } as any);
    
    // Create mock notifications
    const notifications = [
      createMockNotification(),
      createMockNotification(),
      createMockNotification()
    ];
    
    // Call sendBulk method
    const results = await emailProvider.sendBulk(notifications);
    
    // Verify emails were sent
    expect(mockTransport.sendMail.callCount).toBe(3);
    
    // Verify delivery documents were created
    expect(results.length).toBe(3);
    expect(results[0].status).toBe(NotificationStatus.SENT);
    expect(results[1].status).toBe(NotificationStatus.SENT);
    expect(results[2].status).toBe(NotificationStatus.SENT);
  });

  test('should retry failed email delivery', async () => {
    // Mock nodemailer transport
    const mockTransport = mockNodemailer(true);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Create mock delivery document with FAILED status
    const notificationId = new mongoose.Types.ObjectId().toString();
    const deliveryData = createMockDelivery(notificationId, DeliveryChannel.EMAIL, NotificationStatus.FAILED);
    const delivery = new Delivery(deliveryData);
    await delivery.save();
    
    // Mock database query for notification
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves(createMockNotification({ id: notificationId }))
    } as any);
    
    // Call retry method
    const result = await emailProvider.retry(delivery);
    
    // Verify email was sent
    expect(mockTransport.sendMail.calledOnce).toBeTruthy();
    
    // Verify delivery document was updated
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.retryCount).toBe(1);
  });

  test('should not retry if max attempts exceeded', async () => {
    // Mock nodemailer transport
    const mockTransport = mockNodemailer(true);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Create mock delivery document with FAILED status and retry count exceeding max
    const notificationId = new mongoose.Types.ObjectId().toString();
    const deliveryData = createMockDelivery(notificationId, DeliveryChannel.EMAIL, NotificationStatus.FAILED);
    deliveryData.retryCount = notificationConfig.maxRetryAttempts;
    const delivery = new Delivery(deliveryData);
    await delivery.save();
    
    // Call retry method
    const result = await emailProvider.retry(delivery);
    
    // Verify email was not sent
    expect(mockTransport.sendMail.called).toBeFalsy();
    
    // Verify delivery document was not updated
    expect(result.status).toBe(NotificationStatus.FAILED);
  });

  test('should verify SMTP connection', async () => {
    // Mock nodemailer transport
    const mockTransport = mockNodemailer(true);
    sinon.stub(nodemailer, 'createTransport').returns(mockTransport as any);
    
    // Call verifyConnection method
    const result = await emailProvider.verifyConnection();
    
    // Verify connection was checked
    expect(mockTransport.verify.calledOnce).toBeTruthy();
    expect(result).toBe(true);
  });
});

describe('FCM Provider', () => {
  test('should initialize with Firebase configuration', () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'initializeApp').returns({} as any);
    sinon.stub(admin, 'apps').value([]);
    sinon.stub(admin, 'credential').value({
      cert: sinon.stub().returns({})
    });
    
    // Create new FCM provider
    const provider = new FCMProvider();
    
    // Verify Firebase was initialized
    expect(admin.initializeApp.calledOnce).toBeTruthy();
    expect(provider).toBeDefined();
  });

  test('should send a push notification', async () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'messaging').returns(firebaseStub.messaging());
    
    // Mock getUserDeviceTokens
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ deviceTokens: ['device-token-1', 'device-token-2'] })
    } as any);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Call send method
    const result = await fcmProvider.send(notification);
    
    // Verify push notification was sent
    expect(admin.messaging().sendAll.calledOnce).toBeTruthy();
    
    // Verify delivery document was created
    expect(result).toBeDefined();
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.channel).toBe(DeliveryChannel.PUSH);
    expect(result.notificationId).toBe(notification.id);
  });

  test('should handle push sending failure', async () => {
    // Mock Firebase Admin SDK with failure
    const firebaseStub = mockFirebaseAdmin(false);
    sinon.stub(admin, 'messaging').returns(firebaseStub.messaging());
    
    // Mock getUserDeviceTokens
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ deviceTokens: ['device-token-1', 'device-token-2'] })
    } as any);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Call send method
    const result = await fcmProvider.send(notification);
    
    // Verify delivery document reflects failure
    expect(result).toBeDefined();
    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(result.channel).toBe(DeliveryChannel.PUSH);
    expect(result.notificationId).toBe(notification.id);
  });

  test('should handle missing device tokens', async () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'messaging').returns(firebaseStub.messaging());
    
    // Mock getUserDeviceTokens to return empty array
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ deviceTokens: [] })
    } as any);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Call send method
    const result = await fcmProvider.send(notification);
    
    // Verify delivery document reflects failure
    expect(result).toBeDefined();
    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(result.metadata).toHaveProperty('errorMessage', 'No device tokens available');
    
    // Verify sendAll was not called
    expect(admin.messaging().sendAll.called).toBeFalsy();
  });

  test('should send bulk push notifications', async () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'messaging').returns(firebaseStub.messaging());
    
    // Mock getUserDeviceTokens
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().resolves({ deviceTokens: ['device-token-1', 'device-token-2'] })
    } as any);
    
    // Create mock notifications
    const notifications = [
      createMockNotification(),
      createMockNotification(),
      createMockNotification()
    ];
    
    // Call sendBulk method
    const results = await fcmProvider.sendBulk(notifications);
    
    // Verify push notifications were sent
    expect(admin.messaging().sendAll.callCount).toBe(3);
    
    // Verify delivery documents were created
    expect(results.length).toBe(3);
    expect(results[0].status).toBe(NotificationStatus.SENT);
    expect(results[1].status).toBe(NotificationStatus.SENT);
    expect(results[2].status).toBe(NotificationStatus.SENT);
  });

  test('should retry failed push delivery', async () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'messaging').returns(firebaseStub.messaging());
    
    // Create mock delivery document with FAILED status
    const notificationId = new mongoose.Types.ObjectId().toString();
    const deliveryData = createMockDelivery(notificationId, DeliveryChannel.PUSH, NotificationStatus.FAILED);
    const delivery = new Delivery(deliveryData);
    await delivery.save();
    
    // Mock database query for notification
    sinon.stub(mongoose.connection, 'collection').returns({
      findOne: sinon.stub().callsFake((query) => {
        if (query._id) {
          return Promise.resolve(createMockNotification({ id: notificationId }));
        } else {
          return Promise.resolve({ deviceTokens: ['device-token-1', 'device-token-2'] });
        }
      })
    } as any);
    
    // Call retry method
    const result = await fcmProvider.retry(delivery);
    
    // Verify push notification was sent
    expect(admin.messaging().sendAll.calledOnce).toBeTruthy();
    
    // Verify delivery document was updated
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(result.retryCount).toBe(1);
  });

  test('should not retry if max attempts exceeded', async () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'messaging').returns(firebaseStub.messaging());
    
    // Create mock delivery document with FAILED status and retry count exceeding max
    const notificationId = new mongoose.Types.ObjectId().toString();
    const deliveryData = createMockDelivery(notificationId, DeliveryChannel.PUSH, NotificationStatus.FAILED);
    deliveryData.retryCount = notificationConfig.maxRetryAttempts;
    const delivery = new Delivery(deliveryData);
    await delivery.save();
    
    // Call retry method
    const result = await fcmProvider.retry(delivery);
    
    // Verify push notification was not sent
    expect(admin.messaging().sendAll.called).toBeFalsy();
    
    // Verify delivery document was not updated
    expect(result.status).toBe(NotificationStatus.FAILED);
  });

  test('should verify Firebase connection', async () => {
    // Mock Firebase Admin SDK
    const firebaseStub = mockFirebaseAdmin(true);
    sinon.stub(admin, 'app').returns(firebaseStub.app());
    
    // Call verifyConnection method
    const result = await fcmProvider.verifyConnection();
    
    // Verify connection was checked
    expect(firebaseStub.app().options.credential.getAccessToken.calledOnce).toBeTruthy();
    expect(result).toBe(true);
  });
});

describe('Provider Selection', () => {
  test('should get correct provider for channel', () => {
    // Mock notificationConfig.enabledChannels
    sinon.stub(notificationConfig, 'enabledChannels').value([
      DeliveryChannel.EMAIL,
      DeliveryChannel.PUSH
    ]);
    
    // Test provider selection
    const emailProvider = getProviderForChannel(DeliveryChannel.EMAIL);
    const pushProvider = getProviderForChannel(DeliveryChannel.PUSH);
    const inAppProvider = getProviderForChannel(DeliveryChannel.IN_APP);
    
    expect(emailProvider).toBeInstanceOf(EmailProvider);
    expect(pushProvider).toBeInstanceOf(FCMProvider);
    expect(inAppProvider).toBeNull();
  });

  test('should send notification through correct channel', async () => {
    // Mock providers
    const emailSendStub = sinon.stub(emailProvider, 'send').resolves({} as any);
    const fcmSendStub = sinon.stub(fcmProvider, 'send').resolves({} as any);
    
    // Mock notificationConfig.enabledChannels
    sinon.stub(notificationConfig, 'enabledChannels').value([
      DeliveryChannel.EMAIL,
      DeliveryChannel.PUSH
    ]);
    
    // Create mock notification
    const notification = createMockNotification();
    
    // Send through different channels
    await sendNotification(notification, DeliveryChannel.EMAIL);
    await sendNotification(notification, DeliveryChannel.PUSH);
    
    // Verify correct provider was used
    expect(emailSendStub.calledOnce).toBeTruthy();
    expect(fcmSendStub.calledOnce).toBeTruthy();
  });

  test('should send bulk notifications through correct channel', async () => {
    // Mock providers
    const emailSendBulkStub = sinon.stub(emailProvider, 'sendBulk').resolves([]);
    const fcmSendBulkStub = sinon.stub(fcmProvider, 'sendBulk').resolves([]);
    
    // Mock notificationConfig.enabledChannels
    sinon.stub(notificationConfig, 'enabledChannels').value([
      DeliveryChannel.EMAIL,
      DeliveryChannel.PUSH
    ]);
    
    // Create mock notifications
    const notifications = [
      createMockNotification(),
      createMockNotification()
    ];
    
    // Send through different channels
    await sendBulkNotifications(notifications, DeliveryChannel.EMAIL);
    await sendBulkNotifications(notifications, DeliveryChannel.PUSH);
    
    // Verify correct provider was used
    expect(emailSendBulkStub.calledOnce).toBeTruthy();
    expect(fcmSendBulkStub.calledOnce).toBeTruthy();
  });

  test('should retry delivery through correct channel', async () => {
    // Mock providers
    const emailRetryStub = sinon.stub(emailProvider, 'retry').resolves({} as any);
    const fcmRetryStub = sinon.stub(fcmProvider, 'retry').resolves({} as any);
    
    // Mock notificationConfig.enabledChannels
    sinon.stub(notificationConfig, 'enabledChannels').value([
      DeliveryChannel.EMAIL,
      DeliveryChannel.PUSH
    ]);
    
    // Create mock delivery documents
    const emailDelivery = new Delivery(createMockDelivery(
      new mongoose.Types.ObjectId().toString(),
      DeliveryChannel.EMAIL,
      NotificationStatus.FAILED
    ));
    
    const pushDelivery = new Delivery(createMockDelivery(
      new mongoose.Types.ObjectId().toString(),
      DeliveryChannel.PUSH,
      NotificationStatus.FAILED
    ));
    
    // Retry deliveries
    await retryDelivery(emailDelivery);
    await retryDelivery(pushDelivery);
    
    // Verify correct provider was used
    expect(emailRetryStub.calledOnce).toBeTruthy();
    expect(fcmRetryStub.calledOnce).toBeTruthy();
  });

  test('should verify all enabled providers', async () => {
    // Mock providers
    const emailVerifyStub = sinon.stub(emailProvider, 'verifyConnection').resolves(true);
    const fcmVerifyStub = sinon.stub(fcmProvider, 'verifyConnection').resolves(true);
    
    // Mock notificationConfig.enabledChannels
    sinon.stub(notificationConfig, 'enabledChannels').value([
      DeliveryChannel.EMAIL,
      DeliveryChannel.PUSH
    ]);
    
    // Verify providers
    const results = await verifyProviders();
    
    // Verify verification methods were called
    expect(emailVerifyStub.calledOnce).toBeTruthy();
    expect(fcmVerifyStub.calledOnce).toBeTruthy();
    
    // Verify results
    expect(results[DeliveryChannel.EMAIL]).toBe(true);
    expect(results[DeliveryChannel.PUSH]).toBe(true);
    expect(results[DeliveryChannel.IN_APP]).toBe(false);
    expect(results[DeliveryChannel.SMS]).toBe(false);
  });
});