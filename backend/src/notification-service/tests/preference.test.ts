import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; // ^8.0.0
import { preferenceService } from '../src/services/preference.service';
import { Preference, IPreferenceDocument, getDefaultChannelsForType } from '../src/models/preference.model';
import { 
  NotificationType, 
  DeliveryChannel, 
  INotificationPreference
} from '../../shared/src/types/notification.types';

// MongoDB memory server instance
let mongoServer: MongoMemoryServer;

/**
 * Sets up an in-memory MongoDB database for testing
 */
async function setupTestDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('Connected to the in-memory database');
}

/**
 * Tears down the in-memory MongoDB database after testing
 */
async function teardownTestDatabase(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Disconnected from the in-memory database');
}

/**
 * Clears all collections in the database between tests
 */
async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log('Cleared all test collections');
}

/**
 * Creates a mock notification preference for testing
 */
async function createMockPreference(
  userId: string, 
  notificationType: NotificationType, 
  enabled: boolean = true, 
  channels: DeliveryChannel[] = [DeliveryChannel.IN_APP, DeliveryChannel.PUSH]
): Promise<IPreferenceDocument> {
  return preferenceService.create({
    userId,
    notificationType,
    enabled,
    channels
  });
}

// Setup before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Clean up after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

// Clean up between tests
beforeEach(async () => {
  await clearCollections();
});

describe('Preference Service', () => {
  test('should create a preference', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    const enabled = true;
    const channels = [DeliveryChannel.IN_APP, DeliveryChannel.PUSH];
    
    const preference = await preferenceService.create({
      userId,
      notificationType,
      enabled,
      channels
    });
    
    expect(preference).toBeDefined();
    expect(preference.userId).toBe(userId);
    expect(preference.notificationType).toBe(notificationType);
    expect(preference.enabled).toBe(enabled);
    expect(preference.channels).toEqual(channels);
    
    // Verify it was saved to DB
    const saved = await Preference.findById(preference.id);
    expect(saved).toBeDefined();
  });
  
  test('should not create duplicate preferences for the same user and notification type', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    // Create first preference
    await createMockPreference(userId, notificationType);
    
    // Attempt to create duplicate
    await expect(
      createMockPreference(userId, notificationType)
    ).rejects.toThrow();
    
    // Verify only one exists
    const preferences = await Preference.find({ userId, notificationType });
    expect(preferences.length).toBe(1);
  });
  
  test('should find a preference by user ID and notification type', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    await createMockPreference(userId, notificationType);
    
    const preference = await preferenceService.findByUserAndType(userId, notificationType);
    
    expect(preference).toBeDefined();
    expect(preference?.userId).toBe(userId);
    expect(preference?.notificationType).toBe(notificationType);
  });
  
  test('should find all preferences for a user', async () => {
    const userId = 'user123';
    
    await createMockPreference(userId, NotificationType.TRIBE_INVITATION);
    await createMockPreference(userId, NotificationType.EVENT_REMINDER);
    
    const preferences = await preferenceService.findByUser(userId);
    
    expect(preferences).toBeDefined();
    expect(preferences.length).toBe(2);
    expect(preferences[0].userId).toBe(userId);
    expect(preferences[1].userId).toBe(userId);
  });
  
  test('should check if a notification type is enabled', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    // Create with enabled=true
    await createMockPreference(userId, notificationType, true);
    
    // Check if enabled
    let isEnabled = await preferenceService.isNotificationEnabled(userId, notificationType);
    expect(isEnabled).toBe(true);
    
    // Update to disabled
    const preference = await preferenceService.findByUserAndType(userId, notificationType);
    await preferenceService.update(preference!.id, { enabled: false, channels: preference!.channels });
    
    // Check if still enabled
    isEnabled = await preferenceService.isNotificationEnabled(userId, notificationType);
    expect(isEnabled).toBe(false);
  });
  
  test('should get channels for a user and notification type', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    const channels = [DeliveryChannel.EMAIL, DeliveryChannel.SMS];
    
    await createMockPreference(userId, notificationType, true, channels);
    
    const result = await preferenceService.getChannelsForUserAndType(userId, notificationType);
    
    expect(result).toBeDefined();
    expect(result).toEqual(channels);
  });
  
  test('should return default channels when no preference exists', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    // No preference created, should return defaults
    const channels = await preferenceService.getChannelsForUserAndType(userId, notificationType);
    
    expect(channels).toBeDefined();
    expect(channels).toEqual(getDefaultChannelsForType(notificationType));
  });
  
  test('should update a preference', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    // Create preference
    const preference = await createMockPreference(userId, notificationType);
    
    // Update data
    const updateData = {
      enabled: false,
      channels: [DeliveryChannel.EMAIL]
    };
    
    // Update preference
    const updated = await preferenceService.update(preference.id, updateData);
    
    expect(updated).toBeDefined();
    expect(updated.enabled).toBe(updateData.enabled);
    expect(updated.channels).toEqual(updateData.channels);
    
    // Verify in DB
    const saved = await Preference.findById(preference.id);
    expect(saved?.enabled).toBe(updateData.enabled);
    expect(saved?.channels).toEqual(updateData.channels);
  });
  
  test('should toggle notification type enabled status', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    // Create with enabled=true
    await createMockPreference(userId, notificationType, true);
    
    // Toggle to false
    const toggled = await preferenceService.toggleNotificationType(userId, notificationType, false);
    
    expect(toggled).toBeDefined();
    expect(toggled.enabled).toBe(false);
    
    // Toggle back to true
    const toggledAgain = await preferenceService.toggleNotificationType(userId, notificationType, true);
    
    expect(toggledAgain).toBeDefined();
    expect(toggledAgain.enabled).toBe(true);
  });
  
  test('should update channels for a notification type', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    const initialChannels = [DeliveryChannel.IN_APP, DeliveryChannel.PUSH];
    const newChannels = [DeliveryChannel.EMAIL, DeliveryChannel.SMS];
    
    // Create preference
    await createMockPreference(userId, notificationType, true, initialChannels);
    
    // Update channels
    const updated = await preferenceService.updateChannels(userId, notificationType, newChannels);
    
    expect(updated).toBeDefined();
    expect(updated.channels).toEqual(newChannels);
    
    // Verify in DB
    const preference = await Preference.findOne({ userId, notificationType });
    expect(preference?.channels).toEqual(newChannels);
  });
  
  test('should delete a preference', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    
    // Create preference
    const preference = await createMockPreference(userId, notificationType);
    
    // Delete preference
    const deleted = await preferenceService.delete(preference.id);
    
    expect(deleted).toBe(true);
    
    // Verify it's gone
    const found = await Preference.findById(preference.id);
    expect(found).toBeNull();
  });
  
  test('should bulk update preferences', async () => {
    const userId = 'user123';
    
    // Create multiple preferences
    await createMockPreference(userId, NotificationType.TRIBE_INVITATION);
    await createMockPreference(userId, NotificationType.EVENT_REMINDER);
    
    // Bulk update data
    const bulkData = [
      {
        notificationType: NotificationType.TRIBE_INVITATION,
        enabled: false,
        channels: [DeliveryChannel.EMAIL]
      },
      {
        notificationType: NotificationType.EVENT_REMINDER,
        enabled: false,
        channels: [DeliveryChannel.SMS]
      }
    ];
    
    // Perform bulk update
    const updated = await preferenceService.bulkUpdate(userId, bulkData);
    
    expect(updated).toBeDefined();
    expect(updated.length).toBe(2);
    
    // Verify each update
    const preference1 = updated.find(p => p.notificationType === NotificationType.TRIBE_INVITATION);
    const preference2 = updated.find(p => p.notificationType === NotificationType.EVENT_REMINDER);
    
    expect(preference1?.enabled).toBe(false);
    expect(preference1?.channels).toEqual([DeliveryChannel.EMAIL]);
    
    expect(preference2?.enabled).toBe(false);
    expect(preference2?.channels).toEqual([DeliveryChannel.SMS]);
  });
  
  test('should ensure user has preferences for all notification types', async () => {
    const userId = 'user123';
    
    // Create just one preference
    await createMockPreference(userId, NotificationType.TRIBE_INVITATION);
    
    // Ensure all preferences exist
    const preferences = await preferenceService.ensureUserPreferences(userId);
    
    // Should have preferences for all notification types
    expect(preferences.length).toBe(Object.values(NotificationType).length);
    
    // Original one should be unchanged
    const original = preferences.find(p => p.notificationType === NotificationType.TRIBE_INVITATION);
    expect(original?.channels).toEqual([DeliveryChannel.IN_APP, DeliveryChannel.PUSH]);
    
    // New ones should have default values
    const newOne = preferences.find(p => p.notificationType === NotificationType.ACHIEVEMENT_UNLOCKED);
    expect(newOne?.enabled).toBe(true);
    expect(newOne?.channels).toEqual(getDefaultChannelsForType(NotificationType.ACHIEVEMENT_UNLOCKED));
  });
  
  test('should reset a preference to default values', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    const customChannels = [DeliveryChannel.SMS];
    
    // Create with custom values
    await createMockPreference(userId, notificationType, false, customChannels);
    
    // Reset to defaults
    const reset = await preferenceService.resetToDefaults(userId, notificationType);
    
    expect(reset).toBeDefined();
    expect(reset.enabled).toBe(true);
    expect(reset.channels).toEqual(getDefaultChannelsForType(notificationType));
  });
});

describe('Default Channel Configuration', () => {
  test('should return correct default channels for TRIBE_INVITATION', () => {
    const channels = getDefaultChannelsForType(NotificationType.TRIBE_INVITATION);
    expect(channels).toContain(DeliveryChannel.IN_APP);
    expect(channels).toContain(DeliveryChannel.PUSH);
    expect(channels).toContain(DeliveryChannel.EMAIL);
  });
  
  test('should return correct default channels for TRIBE_MATCH', () => {
    const channels = getDefaultChannelsForType(NotificationType.TRIBE_MATCH);
    expect(channels).toContain(DeliveryChannel.IN_APP);
    expect(channels).toContain(DeliveryChannel.PUSH);
    expect(channels).toContain(DeliveryChannel.EMAIL);
  });
  
  test('should return correct default channels for EVENT_REMINDER', () => {
    const channels = getDefaultChannelsForType(NotificationType.EVENT_REMINDER);
    expect(channels).toContain(DeliveryChannel.IN_APP);
    expect(channels).toContain(DeliveryChannel.PUSH);
    expect(channels).toContain(DeliveryChannel.EMAIL);
  });
  
  test('should return correct default channels for AI_ENGAGEMENT_PROMPT', () => {
    const channels = getDefaultChannelsForType(NotificationType.AI_ENGAGEMENT_PROMPT);
    expect(channels).toContain(DeliveryChannel.IN_APP);
    expect(channels).toContain(DeliveryChannel.PUSH);
    expect(channels).not.toContain(DeliveryChannel.EMAIL);
  });
  
  test('should return correct default channels for ACHIEVEMENT_UNLOCKED', () => {
    const channels = getDefaultChannelsForType(NotificationType.ACHIEVEMENT_UNLOCKED);
    expect(channels).toContain(DeliveryChannel.IN_APP);
    expect(channels).toContain(DeliveryChannel.PUSH);
    expect(channels).not.toContain(DeliveryChannel.EMAIL);
  });
});

describe('Error Handling', () => {
  test('should handle invalid notification types', async () => {
    const userId = 'user123';
    const invalidType = 'INVALID_TYPE';
    
    await expect(
      preferenceService.create({
        userId,
        notificationType: invalidType as NotificationType,
        enabled: true,
        channels: [DeliveryChannel.IN_APP]
      })
    ).rejects.toThrow();
  });
  
  test('should handle invalid delivery channels', async () => {
    const userId = 'user123';
    const notificationType = NotificationType.TRIBE_INVITATION;
    const invalidChannel = 'INVALID_CHANNEL';
    
    await expect(
      preferenceService.create({
        userId,
        notificationType,
        enabled: true,
        channels: [invalidChannel as DeliveryChannel]
      })
    ).rejects.toThrow();
  });
  
  test('should handle missing required fields', async () => {
    // Missing userId
    await expect(
      preferenceService.create({
        notificationType: NotificationType.TRIBE_INVITATION,
        enabled: true,
        channels: [DeliveryChannel.IN_APP]
      } as INotificationPreference)
    ).rejects.toThrow();
    
    // Missing notificationType
    await expect(
      preferenceService.create({
        userId: 'user123',
        enabled: true,
        channels: [DeliveryChannel.IN_APP]
      } as INotificationPreference)
    ).rejects.toThrow();
  });
  
  test('should handle preference not found errors', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    // Update non-existent preference
    await expect(
      preferenceService.update(nonExistentId, { 
        enabled: true, 
        channels: [DeliveryChannel.IN_APP] 
      })
    ).rejects.toThrow();
    
    // Delete non-existent preference
    const deleted = await preferenceService.delete(nonExistentId);
    expect(deleted).toBe(false);
  });
});