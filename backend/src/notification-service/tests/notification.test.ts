import mongoose from 'mongoose'; // v6.0.0
import { MongoMemoryServer } from 'mongodb-memory-server'; // v8.0.0
import sinon from 'sinon'; // v15.0.0
import { notificationService } from '../src/services/notification.service';
import { preferenceService } from '../src/services/preference.service';
import { deliveryService } from '../src/services/delivery.service';
import { Notification, INotificationDocument } from '../src/models/notification.model';
import { fcmProvider } from '../src/providers/fcm.provider';
import { emailProvider } from '../src/providers/email.provider';
import { notificationTemplates } from '../src/templates';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus,
  DeliveryChannel,
  ICreateNotificationDto 
} from '../../shared/src/types/notification.types';

// Define a test suite for the Notification Service
describe('Notification Service', () => {
  // Declare variables to hold the in-memory MongoDB server and spies
  let mongoServer: MongoMemoryServer;
  let fcmSendSpy: sinon.SinonSpy;
  let emailSendSpy: sinon.SinonSpy;

  // Function to set up the in-memory MongoDB database for testing
  const setupTestDatabase = async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected to ${mongoUri}`);
  };

  // Function to tear down the in-memory MongoDB database after testing
  const teardownTestDatabase = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('MongoDB disconnected and stopped');
  };

  // Function to clear all collections in the database between tests
  const clearCollections = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  };

  // Before all tests, set up the in-memory MongoDB database
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Before each test, clear all collections to ensure a clean state
  beforeEach(async () => {
    await clearCollections();
    fcmSendSpy = sinon.spy(fcmProvider, 'send');
    emailSendSpy = sinon.spy(emailProvider, 'send');
  });

  // After each test, restore the spies to their original state
  afterEach(() => {
    sinon.restore();
  });

  // After all tests, tear down the in-memory MongoDB database
  afterAll(async () => {
    await teardownTestDatabase();
  });

  // Helper function to create a mock notification document for testing
  const createMockNotification = async (overrides: Partial<ICreateNotificationDto> = {}): Promise<INotificationDocument> => {
    const notificationData: ICreateNotificationDto = {
      userId: 'testuserid',
      type: NotificationType.TRIBE_INVITATION,
      title: 'Test Notification',
      body: 'This is a test notification',
      priority: NotificationPriority.MEDIUM,
      expiresAt: new Date(Date.now() + 60000),
      tribeId: 'testtribeid',
      eventId: null,
      actionUrl: 'https://example.com',
      imageUrl: 'https://example.com/image.png',
      metadata: { key: 'value' },
      ...overrides,
    };
    return await notificationService.create(notificationData);
  };

  const createMockPreference = async (userId: string, notificationType: NotificationType, enabled: boolean, channels: DeliveryChannel[]) => {
    const preferenceData = {
      userId: userId,
      notificationType: notificationType,
      enabled: enabled,
      channels: channels
    };
    return await preferenceService.create(preferenceData);
  };

  // Test case: should create a notification
  it('should create a notification', async () => {
    const notificationData: ICreateNotificationDto = {
      userId: 'testuserid',
      type: NotificationType.TRIBE_INVITATION,
      title: 'Test Notification',
      body: 'This is a test notification',
      priority: NotificationPriority.MEDIUM,
      expiresAt: new Date(Date.now() + 60000),
      tribeId: 'testtribeid',
      eventId: null,
      actionUrl: 'https://example.com',
      imageUrl: 'https://example.com/image.png',
      metadata: { key: 'value' },
    };

    const notification = await notificationService.create(notificationData);

    expect(notification).toBeDefined();
    expect(notification.userId).toBe(notificationData.userId);
    expect(notification.type).toBe(notificationData.type);
    expect(notification.title).toBe(notificationData.title);
    expect(notification.body).toBe(notificationData.body);

    const savedNotification = await Notification.findById(notification.id);
    expect(savedNotification).toBeDefined();
    expect(savedNotification.userId).toBe(notificationData.userId);
  });

  it('should not create a notification if user has disabled that type', async () => {
    const userId = 'disableduserid';
    await createMockPreference(userId, NotificationType.TRIBE_INVITATION, false, []);

    const notificationData: ICreateNotificationDto = {
      userId: userId,
      type: NotificationType.TRIBE_INVITATION,
      title: 'Test Notification',
      body: 'This is a test notification',
      priority: NotificationPriority.MEDIUM,
      expiresAt: new Date(Date.now() + 60000),
      tribeId: 'testtribeid',
      eventId: null,
      actionUrl: 'https://example.com',
      imageUrl: 'https://example.com/image.png',
      metadata: { key: 'value' },
    };

    const notification = await notificationService.create(notificationData);

    expect(notification).toBeNull();

    const savedNotification = await Notification.findOne({ userId: userId, type: NotificationType.TRIBE_INVITATION });
    expect(savedNotification).toBeNull();
  });

  // Test case: should find a notification by ID
  it('should find a notification by ID', async () => {
    const notification = await createMockNotification();
    const foundNotification = await notificationService.findById(notification.id);

    expect(foundNotification).toBeDefined();
    expect(foundNotification.id).toBe(notification.id);
  });

  // Test case: should find notifications by user ID
  it('should find notifications by user ID', async () => {
    const userId = 'testuserid';
    await createMockNotification({ userId: userId, title: 'Notification 1' });
    await createMockNotification({ userId: userId, title: 'Notification 2' });

    const { notifications, total, page, limit } = await notificationService.findByUser(userId, { page: 1, limit: 10 });

    expect(notifications).toBeDefined();
    expect(notifications.length).toBe(2);
    expect(total).toBe(2);
    expect(page).toBe(1);
    expect(limit).toBe(10);
    expect(notifications[0].userId).toBe(userId);
    expect(notifications[1].userId).toBe(userId);
  });

  // Test case: should find unread notifications by user ID
  it('should find unread notifications by user ID', async () => {
    const userId = 'unreaduserid';
    await createMockNotification({ userId: userId, status: NotificationStatus.READ, title: 'Read Notification' });
    await createMockNotification({ userId: userId, status: NotificationStatus.PENDING, title: 'Unread Notification' });

    const { notifications, total, page, limit } = await notificationService.findUnreadByUser(userId, { page: 1, limit: 10 });

    expect(notifications).toBeDefined();
    expect(notifications.length).toBe(1);
    expect(total).toBe(1);
    expect(page).toBe(1);
    expect(limit).toBe(10);
    expect(notifications[0].userId).toBe(userId);
    expect(notifications[0].status).toBe(NotificationStatus.PENDING);
  });

  // Test case: should count unread notifications by user ID
  it('should count unread notifications by user ID', async () => {
    const userId = 'countuserid';
    await createMockNotification({ userId: userId, status: NotificationStatus.READ });
    await createMockNotification({ userId: userId, status: NotificationStatus.PENDING });
    await createMockNotification({ userId: userId, status: NotificationStatus.PENDING });

    const count = await notificationService.countUnreadByUser(userId);

    expect(count).toBe(2);
  });

  // Test case: should mark a notification as read
  it('should mark a notification as read', async () => {
    const notification = await createMockNotification({ status: NotificationStatus.PENDING });
    const updatedNotification = await notificationService.markAsRead(notification.id);

    expect(updatedNotification).toBeDefined();
    expect(updatedNotification.status).toBe(NotificationStatus.READ);
  });

  // Test case: should mark all notifications as read for a user
  it('should mark all notifications as read for a user', async () => {
    const userId = 'markalluserid';
    await createMockNotification({ userId: userId, status: NotificationStatus.PENDING });
    await createMockNotification({ userId: userId, status: NotificationStatus.PENDING });
    await createMockNotification({ userId: userId, status: NotificationStatus.PENDING });

    const count = await notificationService.markAllAsRead(userId);

    expect(count).toBe(3);

    const notifications = await Notification.find({ userId: userId });
    notifications.forEach(notification => {
      expect(notification.status).toBe(NotificationStatus.READ);
    });
  });

  // Test case: should delete a notification
  it('should delete a notification', async () => {
    const notification = await createMockNotification();
    const deleted = await notificationService.delete(notification.id);

    expect(deleted).toBe(true);

    const foundNotification = await Notification.findById(notification.id);
    expect(foundNotification).toBeNull();
  });

  describe('Notification Sending', () => {
    it('should send a notification through appropriate channels', async () => {
      const userId = 'senduserid';
      await createMockPreference(userId, NotificationType.TRIBE_INVITATION, true, [DeliveryChannel.PUSH, DeliveryChannel.EMAIL]);
      const notification = await createMockNotification({ userId: userId, type: NotificationType.TRIBE_INVITATION });

      await notificationService.send(notification);

      expect(fcmSendSpy.calledOnce).toBe(true);
      expect(emailSendSpy.calledOnce).toBe(true);

      const deliveries = await deliveryService.findByNotification(notification.id);
      expect(deliveries.length).toBe(2);
      expect(deliveries.some(d => d.channel === DeliveryChannel.PUSH)).toBe(true);
      expect(deliveries.some(d => d.channel === DeliveryChannel.EMAIL)).toBe(true);

      const updatedNotification = await Notification.findById(notification.id);
      expect(updatedNotification.status).toBe(NotificationStatus.SENT);
    });

    it('should not send a notification if disabled by user preferences', async () => {
      const userId = 'disabledsenduserid';
      await createMockPreference(userId, NotificationType.TRIBE_INVITATION, false, []);
      const notification = await createMockNotification({ userId: userId, type: NotificationType.TRIBE_INVITATION });

      await notificationService.send(notification);

      expect(fcmSendSpy.called).toBe(false);
      expect(emailSendSpy.called).toBe(false);

      const deliveries = await deliveryService.findByNotification(notification.id);
      expect(deliveries.length).toBe(0);

      const updatedNotification = await Notification.findById(notification.id);
      expect(updatedNotification.status).toBe(NotificationStatus.FAILED);
    });

    it('should send bulk notifications', async () => {
      const notificationData = [
        { userId: 'user1', type: NotificationType.TRIBE_INVITATION, title: 'Test 1', body: 'Body 1', priority: NotificationPriority.MEDIUM },
        { userId: 'user2', type: NotificationType.EVENT_REMINDER, title: 'Test 2', body: 'Body 2', priority: NotificationPriority.MEDIUM },
      ] as ICreateNotificationDto[];

      const sendSpy = sinon.spy(notificationService, 'send');

      const result = await notificationService.sendBulk(notificationData);

      expect(sendSpy.callCount).toBe(2);
      expect(result.created).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle failures in bulk sending', async () => {
      const notificationData = [
        { userId: 'user1', type: NotificationType.TRIBE_INVITATION, title: 'Test 1', body: 'Body 1', priority: NotificationPriority.MEDIUM },
        { userId: 'user2', type: NotificationType.EVENT_REMINDER, title: 'Test 2', body: 'Body 2', priority: NotificationPriority.MEDIUM },
      ] as ICreateNotificationDto[];

      sinon.stub(notificationService, 'send').throws(new Error('Failed to send'));

      const result = await notificationService.sendBulk(notificationData);

      expect(result.created).toBe(0);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(2);
    });
  });

  describe('Notification Templates', () => {
    it('should create a notification from a template', async () => {
      const templateName = 'testTemplate';
      const templateData = { name: 'Test User' };
      const userId = 'templateuserid';

      sinon.stub(notificationTemplates, templateName).returns({
        userId: userId,
        type: NotificationType.TRIBE_INVITATION,
        title: 'Test Template Notification',
        body: `Hello, ${templateData.name}!`,
        priority: NotificationPriority.MEDIUM,
      });

      const notification = await notificationService.createFromTemplate(templateName, templateData, userId);

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(userId);
      expect(notification.body).toBe(`Hello, ${templateData.name}!`);
    });

    it('should handle missing templates', async () => {
      const templateName = 'missingTemplate';
      const templateData = { name: 'Test User' };
      const userId = 'templateuserid';

      sinon.stub(notificationTemplates, templateName).returns(undefined);

      await expect(notificationService.createFromTemplate(templateName, templateData, userId)).rejects.toThrow();
    });

    it('should respect user preferences when creating from template', async () => {
      const templateName = 'testTemplate';
      const templateData = { name: 'Test User' };
      const userId = 'templateuserid';

      await createMockPreference(userId, NotificationType.TRIBE_INVITATION, false, []);

      sinon.stub(notificationTemplates, templateName).returns({
        userId: userId,
        type: NotificationType.TRIBE_INVITATION,
        title: 'Test Template Notification',
        body: `Hello, ${templateData.name}!`,
        priority: NotificationPriority.MEDIUM,
      });

      const notification = await notificationService.createFromTemplate(templateName, templateData, userId);

      expect(notification).toBeNull();
    });
  });

  describe('Notification Types', () => {
    it('should handle TRIBE_INVITATION notifications correctly', async () => {
      const notification = await createMockNotification({ type: NotificationType.TRIBE_INVITATION });
      expect(notification.type).toBe(NotificationType.TRIBE_INVITATION);
    });

    it('should handle EVENT_REMINDER notifications correctly', async () => {
      const notification = await createMockNotification({ type: NotificationType.EVENT_REMINDER });
      expect(notification.type).toBe(NotificationType.EVENT_REMINDER);
    });

    it('should handle AI_ENGAGEMENT_PROMPT notifications correctly', async () => {
      const notification = await createMockNotification({ type: NotificationType.AI_ENGAGEMENT_PROMPT });
      expect(notification.type).toBe(NotificationType.AI_ENGAGEMENT_PROMPT);
    });

    it('should handle ACHIEVEMENT_UNLOCKED notifications correctly', async () => {
      const notification = await createMockNotification({ type: NotificationType.ACHIEVEMENT_UNLOCKED });
      expect(notification.type).toBe(NotificationType.ACHIEVEMENT_UNLOCKED);
    });
  });
});