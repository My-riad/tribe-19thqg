import mongoose from 'mongoose'; // v6.0.0
import { MongoMemoryServer } from 'mongodb-memory-server'; // v8.0.0
import sinon from 'sinon'; // v15.0.0

import { deliveryService } from '../src/services/delivery.service';
import { Delivery, IDeliveryDocument } from '../src/models/delivery.model';
import { Notification, INotificationDocument } from '../src/models/notification.model';
import { fcmProvider } from '../src/providers/fcm.provider';
import { emailProvider } from '../src/providers/email.provider';
import { 
  DeliveryChannel, 
  NotificationStatus, 
  NotificationType,
  NotificationPriority
} from '../../shared/src/types/notification.types';

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer;

/**
 * Sets up an in-memory MongoDB database for testing
 */
async function setupTestDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log(`Connected to in-memory MongoDB at ${mongoUri}`);
}

/**
 * Tears down the in-memory MongoDB database after testing
 */
async function teardownTestDatabase(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Disconnected from in-memory MongoDB and stopped server');
}

/**
 * Clears all collections in the database between tests
 */
async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// Setup and teardown hooks
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await clearCollections();
});

/**
 * Creates a mock notification document for testing
 */
async function createMockNotification(overrides: Partial<INotificationDocument> = {}): Promise<INotificationDocument> {
  const defaults = {
    userId: new mongoose.Types.ObjectId().toString(),
    type: NotificationType.EVENT_REMINDER,
    title: 'Test Notification',
    body: 'This is a test notification',
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.PENDING,
    createdAt: new Date(),
    expiresAt: null,
    tribeId: null,
    eventId: null,
    actionUrl: null,
    imageUrl: null,
    metadata: null
  };

  const notification = new Notification({
    ...defaults,
    ...overrides
  });
  
  await notification.save();
  return notification;
}

/**
 * Creates a mock delivery document for testing
 */
async function createMockDelivery(
  notificationId: string,
  channel: DeliveryChannel,
  overrides: Partial<IDeliveryDocument> = {}
): Promise<IDeliveryDocument> {
  const delivery = await deliveryService.createDelivery(notificationId, channel);
  
  if (Object.keys(overrides).length > 0) {
    Object.assign(delivery, overrides);
    await delivery.save();
  }
  
  return delivery;
}

describe('Delivery Service', () => {
  test('should create a delivery record', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery record
    const delivery = await deliveryService.createDelivery(
      notification.id,
      DeliveryChannel.PUSH,
      { deviceTokens: ['test-token'] }
    );
    
    // Assertions
    expect(delivery).toBeDefined();
    expect(delivery.notificationId).toBe(notification.id);
    expect(delivery.channel).toBe(DeliveryChannel.PUSH);
    expect(delivery.status).toBe(NotificationStatus.PENDING);
    expect(delivery.metadata).toEqual({ deviceTokens: ['test-token'] });
    expect(delivery.retryCount).toBe(0);
    
    // Verify it was saved to the database
    const savedDelivery = await Delivery.findById(delivery.id);
    expect(savedDelivery).not.toBeNull();
  });

  test('should not create duplicate delivery records for the same notification and channel', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery record
    const delivery1 = await deliveryService.createDelivery(
      notification.id,
      DeliveryChannel.PUSH
    );
    
    // Try to create another delivery record for the same notification and channel
    const delivery2 = await deliveryService.createDelivery(
      notification.id,
      DeliveryChannel.PUSH
    );
    
    // Assertions
    expect(delivery1.id).toBe(delivery2.id);
    
    // Check that only one record exists in the database
    const deliveryCount = await Delivery.countDocuments({
      notificationId: notification.id,
      channel: DeliveryChannel.PUSH
    });
    expect(deliveryCount).toBe(1);
  });

  test('should update delivery status', async () => {
    // Create a mock notification and delivery
    const notification = await createMockNotification();
    const delivery = await createMockDelivery(notification.id, DeliveryChannel.PUSH);
    
    // Update status to SENT
    const updatedDelivery = await deliveryService.updateStatus(
      delivery.id,
      NotificationStatus.SENT
    );
    
    // Assertions
    expect(updatedDelivery.status).toBe(NotificationStatus.SENT);
    expect(updatedDelivery.sentAt).toBeInstanceOf(Date);
    
    // Update status to DELIVERED
    const deliveredDelivery = await deliveryService.updateStatus(
      delivery.id,
      NotificationStatus.DELIVERED
    );
    
    // Assertions
    expect(deliveredDelivery.status).toBe(NotificationStatus.DELIVERED);
    expect(deliveredDelivery.deliveredAt).toBeInstanceOf(Date);
  });

  test('should find deliveries by notification ID', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create multiple delivery records for different channels
    await createMockDelivery(notification.id, DeliveryChannel.PUSH);
    await createMockDelivery(notification.id, DeliveryChannel.EMAIL);
    await createMockDelivery(notification.id, DeliveryChannel.IN_APP);
    
    // Find deliveries by notification ID
    const deliveries = await deliveryService.findByNotification(notification.id);
    
    // Assertions
    expect(deliveries).toHaveLength(3);
    expect(deliveries[0].notificationId).toBe(notification.id);
    expect(deliveries[1].notificationId).toBe(notification.id);
    expect(deliveries[2].notificationId).toBe(notification.id);
  });

  test('should find delivery by notification ID and channel', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create multiple delivery records for different channels
    await createMockDelivery(notification.id, DeliveryChannel.PUSH);
    await createMockDelivery(notification.id, DeliveryChannel.EMAIL);
    
    // Find delivery by notification ID and channel
    const delivery = await deliveryService.findByNotificationAndChannel(
      notification.id,
      DeliveryChannel.EMAIL
    );
    
    // Assertions
    expect(delivery).not.toBeNull();
    expect(delivery?.notificationId).toBe(notification.id);
    expect(delivery?.channel).toBe(DeliveryChannel.EMAIL);
  });

  test('should mark deliveries as read', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create multiple delivery records
    await createMockDelivery(notification.id, DeliveryChannel.PUSH);
    await createMockDelivery(notification.id, DeliveryChannel.EMAIL);
    await createMockDelivery(notification.id, DeliveryChannel.IN_APP);
    
    // Mark deliveries as read
    const updatedCount = await deliveryService.markAsRead(notification.id);
    
    // Assertions
    expect(updatedCount).toBe(3);
    
    // Verify all deliveries were updated
    const deliveries = await deliveryService.findByNotification(notification.id);
    deliveries.forEach(delivery => {
      expect(delivery.status).toBe(NotificationStatus.READ);
      expect(delivery.readAt).toBeInstanceOf(Date);
    });
  });

  test('should retry failed deliveries', async () => {
    // Create mock notification and delivery records
    const notification = await createMockNotification();
    const pushDelivery = await createMockDelivery(
      notification.id, 
      DeliveryChannel.PUSH, 
      { status: NotificationStatus.FAILED, retryCount: 1 }
    );
    const emailDelivery = await createMockDelivery(
      notification.id, 
      DeliveryChannel.EMAIL, 
      { status: NotificationStatus.FAILED, retryCount: 0 }
    );
    
    // Stub the retry methods
    const fcmRetryStub = sinon.stub(fcmProvider, 'retry').resolves({
      ...pushDelivery.toObject(),
      status: NotificationStatus.SENT,
      sentAt: new Date()
    });
    
    const emailRetryStub = sinon.stub(emailProvider, 'retry').resolves({
      ...emailDelivery.toObject(),
      status: NotificationStatus.SENT,
      sentAt: new Date()
    });
    
    // Call retryFailedDeliveries
    const result = await deliveryService.retryFailedDeliveries();
    
    // Assertions
    expect(result.processed).toBeGreaterThan(0);
    expect(result.succeeded).toBeGreaterThan(0);
    
    // Verify retry methods were called
    expect(fcmRetryStub.called).toBeTruthy();
    expect(emailRetryStub.called).toBeTruthy();
    
    // Restore stubs
    fcmRetryStub.restore();
    emailRetryStub.restore();
  });

  test('should respect max retry attempts', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery record with max retry count
    const maxRetries = 3; // This should match the config in the service
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.PUSH, 
      { 
        status: NotificationStatus.FAILED, 
        retryCount: maxRetries // Already at max retries
      }
    );
    
    // Stub the fcmProvider.retry method to track if it's called
    const fcmRetryStub = sinon.stub(fcmProvider, 'retry');
    
    // Call retryFailedDeliveries
    const result = await deliveryService.retryFailedDeliveries();
    
    // Assertions
    expect(result.processed).toBe(0); // Should be 0 because this delivery should be filtered out due to max retries
    expect(fcmRetryStub.called).toBeFalsy(); // Should not be called
    
    // Restore stub
    fcmRetryStub.restore();
  });

  test('should handle retry failures', async () => {
    // Create a mock notification and delivery
    const notification = await createMockNotification();
    const delivery = await createMockDelivery(
      notification.id, 
      DeliveryChannel.PUSH, 
      { status: NotificationStatus.FAILED, retryCount: 1 }
    );
    
    // Stub the fcmProvider.retry method to simulate failure
    const fcmRetryStub = sinon.stub(fcmProvider, 'retry').rejects(new Error('Retry failed'));
    
    // Call retryFailedDeliveries
    const result = await deliveryService.retryFailedDeliveries();
    
    // Assertions
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    
    // Verify the delivery record was updated correctly
    const updatedDelivery = await Delivery.findById(delivery.id);
    expect(updatedDelivery?.status).toBe(NotificationStatus.FAILED);
    expect(updatedDelivery?.retryCount).toBeGreaterThan(1); // Should be incremented
    
    // Restore stub
    fcmRetryStub.restore();
  });
});

describe('Delivery Statistics', () => {
  test('should get delivery statistics for a date range', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create multiple delivery records with various statuses
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Create deliveries with different statuses
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.PUSH, 
      { status: NotificationStatus.SENT, sentAt: now }
    );
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.EMAIL, 
      { status: NotificationStatus.DELIVERED, sentAt: now, deliveredAt: now }
    );
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.IN_APP, 
      { status: NotificationStatus.READ, sentAt: now, deliveredAt: now, readAt: now }
    );
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.SMS, 
      { status: NotificationStatus.FAILED }
    );
    
    // Get statistics
    const stats = await deliveryService.getDeliveryStats(startDate, endDate);
    
    // Assertions
    expect(stats.total).toBe(4);
    expect(stats.sent).toBeGreaterThanOrEqual(3); // SENT, DELIVERED, and READ all count as "sent"
    expect(stats.delivered).toBeGreaterThanOrEqual(2); // DELIVERED and READ count as "delivered"
    expect(stats.read).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.pending).toBe(0);
    expect(stats.successRate).toBeGreaterThan(0);
  });

  test('should get delivery statistics by channel', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create delivery records for different channels
    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    // Create deliveries for different channels with different statuses
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.PUSH, 
      { status: NotificationStatus.SENT, sentAt: now }
    );
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.PUSH, 
      { status: NotificationStatus.FAILED }
    );
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.EMAIL, 
      { status: NotificationStatus.DELIVERED, sentAt: now, deliveredAt: now }
    );
    await createMockDelivery(
      notification.id, 
      DeliveryChannel.IN_APP, 
      { status: NotificationStatus.READ, sentAt: now, deliveredAt: now, readAt: now }
    );
    
    // Get statistics by channel
    const statsByChannel = await deliveryService.getDeliveryStatsByChannel(startDate, endDate);
    
    // Assertions
    expect(statsByChannel.length).toBeGreaterThan(0);
    
    // Find push channel stats
    const pushStats = statsByChannel.find(item => item.channel === DeliveryChannel.PUSH);
    expect(pushStats).toBeDefined();
    expect(pushStats?.stats.total).toBe(2);
    expect(pushStats?.stats.sent).toBe(1);
    expect(pushStats?.stats.failed).toBe(1);
    
    // Find email channel stats
    const emailStats = statsByChannel.find(item => item.channel === DeliveryChannel.EMAIL);
    expect(emailStats).toBeDefined();
    expect(emailStats?.stats.total).toBe(1);
    expect(emailStats?.stats.delivered).toBe(1);
  });

  test('should handle empty results for statistics', async () => {
    // Set date range where no deliveries exist
    const startDate = new Date('2000-01-01');
    const endDate = new Date('2000-01-02');
    
    // Get statistics for empty range
    const stats = await deliveryService.getDeliveryStats(startDate, endDate);
    
    // Assertions for empty statistics
    expect(stats.total).toBe(0);
    expect(stats.sent).toBe(0);
    expect(stats.delivered).toBe(0);
    expect(stats.read).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.successRate).toBe(0);
    
    // Get statistics by channel for empty range
    const statsByChannel = await deliveryService.getDeliveryStatsByChannel(startDate, endDate);
    
    // Assertions for empty channel statistics
    expect(statsByChannel).toBeInstanceOf(Array);
  });
});

describe('Delivery Cleanup', () => {
  test('should clean up old delivery records', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create delivery records with different timestamps
    const now = new Date();
    const oldDate = new Date(now.getTime() - (100 * 24 * 60 * 60 * 1000)); // 100 days old
    const recentDate = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)); // 5 days old
    
    // Mock the createdAt timestamps by directly manipulating the database
    const oldDelivery = await createMockDelivery(notification.id, DeliveryChannel.PUSH);
    await Delivery.updateOne(
      { _id: oldDelivery._id },
      { $set: { createdAt: oldDate } }
    );
    
    const recentDelivery = await createMockDelivery(notification.id, DeliveryChannel.EMAIL);
    await Delivery.updateOne(
      { _id: recentDelivery._id },
      { $set: { createdAt: recentDate } }
    );
    
    // Execute cleanup with 30-day retention
    const deletedCount = await deliveryService.cleanupOldDeliveries(30);
    
    // Assertions
    expect(deletedCount).toBe(1); // Only the old delivery should be deleted
    
    // Verify that the old delivery is gone and the recent one remains
    const oldDeliveryCheck = await Delivery.findById(oldDelivery._id);
    const recentDeliveryCheck = await Delivery.findById(recentDelivery._id);
    
    expect(oldDeliveryCheck).toBeNull();
    expect(recentDeliveryCheck).not.toBeNull();
  });

  test('should handle empty cleanup', async () => {
    // Call cleanup when no records match the criteria
    const deletedCount = await deliveryService.cleanupOldDeliveries(1);
    
    // Assertions
    expect(deletedCount).toBe(0);
  });
});

describe('Delivery Channel Handling', () => {
  test('should handle PUSH channel correctly', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery for PUSH channel
    const delivery = await createMockDelivery(notification.id, DeliveryChannel.PUSH);
    
    // Assertions
    expect(delivery.channel).toBe(DeliveryChannel.PUSH);
    
    // Test retry functionality
    const fcmRetryStub = sinon.stub(fcmProvider, 'retry').resolves({
      ...delivery.toObject(),
      status: NotificationStatus.SENT,
      sentAt: new Date()
    });
    
    // Mark delivery as failed for retry
    await deliveryService.updateStatus(
      delivery.id,
      NotificationStatus.FAILED,
      'Test error message'
    );
    
    // Call retry
    await deliveryService.retryFailedDeliveries();
    
    // Verify fcmProvider.retry was called
    expect(fcmRetryStub.called).toBeTruthy();
    
    // Restore stub
    fcmRetryStub.restore();
  });

  test('should handle EMAIL channel correctly', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery for EMAIL channel
    const delivery = await createMockDelivery(notification.id, DeliveryChannel.EMAIL);
    
    // Assertions
    expect(delivery.channel).toBe(DeliveryChannel.EMAIL);
    
    // Test retry functionality
    const emailRetryStub = sinon.stub(emailProvider, 'retry').resolves({
      ...delivery.toObject(),
      status: NotificationStatus.SENT,
      sentAt: new Date()
    });
    
    // Mark delivery as failed for retry
    await deliveryService.updateStatus(
      delivery.id,
      NotificationStatus.FAILED,
      'Test error message'
    );
    
    // Call retry
    await deliveryService.retryFailedDeliveries();
    
    // Verify emailProvider.retry was called
    expect(emailRetryStub.called).toBeTruthy();
    
    // Restore stub
    emailRetryStub.restore();
  });

  test('should handle IN_APP channel correctly', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery for IN_APP channel
    const delivery = await createMockDelivery(notification.id, DeliveryChannel.IN_APP);
    
    // Assertions
    expect(delivery.channel).toBe(DeliveryChannel.IN_APP);
    
    // Test status updates for IN_APP channel
    const updatedDelivery = await deliveryService.updateStatus(
      delivery.id,
      NotificationStatus.DELIVERED
    );
    
    expect(updatedDelivery.status).toBe(NotificationStatus.DELIVERED);
    expect(updatedDelivery.deliveredAt).toBeInstanceOf(Date);
  });

  test('should handle SMS channel correctly', async () => {
    // Create a mock notification
    const notification = await createMockNotification();
    
    // Create a delivery for SMS channel
    const delivery = await createMockDelivery(notification.id, DeliveryChannel.SMS);
    
    // Assertions
    expect(delivery.channel).toBe(DeliveryChannel.SMS);
    
    // Test status updates for SMS channel
    const updatedDelivery = await deliveryService.updateStatus(
      delivery.id,
      NotificationStatus.SENT
    );
    
    expect(updatedDelivery.status).toBe(NotificationStatus.SENT);
    expect(updatedDelivery.sentAt).toBeInstanceOf(Date);
  });
});