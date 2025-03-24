import mongoose from 'mongoose'; // ^6.9.0
import {
  Preference,
  IPreferenceDocument,
  getDefaultChannelsForType
} from '../models/preference.model';
import {
  NotificationType,
  DeliveryChannel,
  INotificationPreference,
  INotificationPreferenceUpdate
} from '../../../shared/src/types/notification.types';
import { validateCreatePreference } from '../validations/preference.validation';
import { logger } from '../../../shared/src/utils/logger.util';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Finds all notification preferences for a specific user
 * @param userId - The user's ID
 * @returns Array of preference documents for the user
 */
async function findByUser(userId: string): Promise<IPreferenceDocument[]> {
  logger.debug('Finding preferences for user', { userId });
  return Preference.findByUser(userId);
}

/**
 * Finds a specific notification preference by user and notification type
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @returns Preference document if found, null otherwise
 */
async function findByUserAndType(
  userId: string,
  notificationType: NotificationType
): Promise<IPreferenceDocument | null> {
  logger.debug('Finding preference by user and type', { userId, notificationType });
  return Preference.findByUserAndType(userId, notificationType);
}

/**
 * Checks if a specific notification type is enabled for a user
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @returns Whether the notification type is enabled
 */
async function isNotificationEnabled(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  logger.debug('Checking if notification is enabled', { userId, notificationType });
  return Preference.findEnabledByUserAndType(userId, notificationType);
}

/**
 * Gets the delivery channels for a specific notification type and user
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @returns Array of delivery channels
 */
async function getChannelsForUserAndType(
  userId: string,
  notificationType: NotificationType
): Promise<DeliveryChannel[]> {
  logger.debug('Getting channels for user and notification type', { userId, notificationType });
  return Preference.getChannelsForUserAndType(userId, notificationType);
}

/**
 * Creates a new notification preference
 * @param preferenceData - The preference data to create
 * @returns Newly created preference document
 */
async function createPreference(
  preferenceData: INotificationPreference
): Promise<IPreferenceDocument> {
  logger.debug('Creating new preference', { preferenceData });
  
  // Validate preference data
  validateCreatePreference(preferenceData);

  // Check if preference already exists for this user and notification type
  const existingPreference = await findByUserAndType(
    preferenceData.userId,
    preferenceData.notificationType
  );

  if (existingPreference) {
    throw ApiError.conflict(
      `Preference already exists for user ${preferenceData.userId} and notification type ${preferenceData.notificationType}`
    );
  }

  // If channels not provided, use default channels for the notification type
  if (!preferenceData.channels || preferenceData.channels.length === 0) {
    preferenceData.channels = getDefaultChannelsForType(preferenceData.notificationType);
  }

  // Create new preference
  const preference = new Preference({
    userId: preferenceData.userId,
    notificationType: preferenceData.notificationType,
    enabled: preferenceData.enabled !== undefined ? preferenceData.enabled : true,
    channels: preferenceData.channels
  });

  await preference.save();
  
  logger.info('Created new notification preference', {
    userId: preference.userId,
    notificationType: preference.notificationType,
    enabled: preference.enabled
  });
  
  return preference;
}

/**
 * Updates an existing notification preference
 * @param preferenceId - The ID of the preference to update
 * @param updateData - The data to update
 * @returns Updated preference document
 */
async function updatePreference(
  preferenceId: string,
  updateData: INotificationPreferenceUpdate
): Promise<IPreferenceDocument> {
  logger.debug('Updating preference', { preferenceId, updateData });
  
  // Find preference by ID
  const preference = await Preference.findById(preferenceId);
  
  if (!preference) {
    throw ApiError.notFound(`Preference with ID ${preferenceId} not found`);
  }
  
  // Update enabled status if provided
  if (updateData.enabled !== undefined) {
    preference.enabled = updateData.enabled;
  }
  
  // Update channels if provided
  if (updateData.channels && updateData.channels.length > 0) {
    preference.channels = updateData.channels;
  }
  
  await preference.save();
  
  logger.info('Updated notification preference', {
    preferenceId,
    userId: preference.userId,
    notificationType: preference.notificationType
  });
  
  return preference;
}

/**
 * Toggles the enabled status of a notification type for a user
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @param enabled - The new enabled status
 * @returns Updated preference document
 */
async function toggleNotificationType(
  userId: string,
  notificationType: NotificationType,
  enabled: boolean
): Promise<IPreferenceDocument> {
  logger.debug('Toggling notification type', { userId, notificationType, enabled });
  
  // Find preference by user ID and notification type
  let preference = await findByUserAndType(userId, notificationType);
  
  // If not found, create a new preference with default channels
  if (!preference) {
    preference = new Preference({
      userId,
      notificationType,
      enabled,
      channels: getDefaultChannelsForType(notificationType)
    });
  } else {
    // Update the enabled status
    preference.enabled = enabled;
  }
  
  await preference.save();
  
  logger.info('Toggled notification preference', {
    userId,
    notificationType,
    enabled
  });
  
  return preference;
}

/**
 * Updates the delivery channels for a notification type and user
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @param channels - The new delivery channels
 * @returns Updated preference document
 */
async function updateChannels(
  userId: string,
  notificationType: NotificationType,
  channels: DeliveryChannel[]
): Promise<IPreferenceDocument> {
  logger.debug('Updating channels for notification type', { userId, notificationType, channels });
  
  // Find preference by user ID and notification type
  let preference = await findByUserAndType(userId, notificationType);
  
  // If not found, create a new preference with provided channels
  if (!preference) {
    preference = new Preference({
      userId,
      notificationType,
      enabled: true,
      channels
    });
  } else {
    // Update the channels
    preference.channels = channels;
  }
  
  await preference.save();
  
  logger.info('Updated notification channels', {
    userId,
    notificationType,
    channels
  });
  
  return preference;
}

/**
 * Deletes a notification preference
 * @param preferenceId - The ID of the preference to delete
 * @returns Whether the deletion was successful
 */
async function deletePreference(preferenceId: string): Promise<boolean> {
  logger.debug('Deleting preference', { preferenceId });
  
  const result = await Preference.findByIdAndDelete(preferenceId);
  
  if (result) {
    logger.info('Deleted notification preference', { preferenceId });
    return true;
  }
  
  return false;
}

/**
 * Updates multiple notification preferences for a user in bulk
 * @param userId - The user's ID
 * @param preferencesData - Array of preference updates
 * @returns Array of updated preference documents
 */
async function bulkUpdatePreferences(
  userId: string,
  preferencesData: Array<{
    notificationType: NotificationType;
    enabled?: boolean;
    channels?: DeliveryChannel[];
  }>
): Promise<IPreferenceDocument[]> {
  logger.debug('Bulk updating preferences', { userId, preferencesCount: preferencesData.length });
  
  // Validate the bulk update data
  if (!preferencesData || !Array.isArray(preferencesData) || preferencesData.length === 0) {
    throw ApiError.badRequest('Invalid preferences data for bulk update');
  }
  
  const updatedPreferences: IPreferenceDocument[] = [];
  
  // Process each preference update
  for (const preferenceData of preferencesData) {
    // Find existing preference or create new one
    let preference = await findByUserAndType(userId, preferenceData.notificationType);
    
    if (!preference) {
      // Create new preference with default values
      preference = new Preference({
        userId,
        notificationType: preferenceData.notificationType,
        enabled: preferenceData.enabled !== undefined ? preferenceData.enabled : true,
        channels: preferenceData.channels || getDefaultChannelsForType(preferenceData.notificationType)
      });
    } else {
      // Update existing preference
      if (preferenceData.enabled !== undefined) {
        preference.enabled = preferenceData.enabled;
      }
      
      if (preferenceData.channels && preferenceData.channels.length > 0) {
        preference.channels = preferenceData.channels;
      }
    }
    
    await preference.save();
    updatedPreferences.push(preference);
  }
  
  logger.info('Bulk updated notification preferences', {
    userId,
    count: updatedPreferences.length
  });
  
  return updatedPreferences;
}

/**
 * Ensures a user has preferences for all notification types
 * @param userId - The user's ID
 * @returns Array of preference documents
 */
async function ensureUserPreferences(userId: string): Promise<IPreferenceDocument[]> {
  logger.debug('Ensuring user preferences exist', { userId });
  
  // Get all existing preferences for the user
  const existingPreferences = await findByUser(userId);
  
  // Get all notification types that exist
  const existingTypes = existingPreferences.map(pref => pref.notificationType);
  
  // Determine which notification types are missing
  const allNotificationTypes = Object.values(NotificationType);
  const missingTypes = allNotificationTypes.filter(type => !existingTypes.includes(type));
  
  // Create default preferences for missing types
  const newPreferences: IPreferenceDocument[] = [];
  
  for (const notificationType of missingTypes) {
    const preference = await Preference.createDefaultPreference(userId, notificationType);
    newPreferences.push(preference);
  }
  
  if (newPreferences.length > 0) {
    logger.info('Created default notification preferences for user', {
      userId,
      count: newPreferences.length
    });
  }
  
  return [...existingPreferences, ...newPreferences];
}

/**
 * Resets a user's notification preferences to default values
 * @param userId - The user's ID
 * @param notificationType - The type of notification
 * @returns Reset preference document
 */
async function resetToDefaults(
  userId: string,
  notificationType: NotificationType
): Promise<IPreferenceDocument> {
  logger.debug('Resetting preference to defaults', { userId, notificationType });
  
  // Find preference by user ID and notification type
  const preference = await findByUserAndType(userId, notificationType);
  
  // If found, delete it
  if (preference) {
    await Preference.findByIdAndDelete(preference._id);
  }
  
  // Create new preference with default values
  const newPreference = await Preference.createDefaultPreference(userId, notificationType);
  
  logger.info('Reset notification preference to defaults', {
    userId,
    notificationType
  });
  
  return newPreference;
}

/**
 * Service class for managing notification preferences in the Tribe platform
 */
class PreferenceService {
  /**
   * Finds all preferences for a user
   * @param userId - The user's ID
   * @returns Array of preference documents
   */
  async findByUser(userId: string): Promise<IPreferenceDocument[]> {
    return findByUser(userId);
  }
  
  /**
   * Finds a preference by user and notification type
   * @param userId - The user's ID
   * @param notificationType - The type of notification
   * @returns Preference document if found, null otherwise
   */
  async findByUserAndType(
    userId: string,
    notificationType: NotificationType
  ): Promise<IPreferenceDocument | null> {
    return findByUserAndType(userId, notificationType);
  }
  
  /**
   * Checks if a notification type is enabled for a user
   * @param userId - The user's ID
   * @param notificationType - The type of notification
   * @returns Whether the notification type is enabled
   */
  async isNotificationEnabled(
    userId: string,
    notificationType: NotificationType
  ): Promise<boolean> {
    return isNotificationEnabled(userId, notificationType);
  }
  
  /**
   * Gets delivery channels for a user and notification type
   * @param userId - The user's ID
   * @param notificationType - The type of notification
   * @returns Array of delivery channels
   */
  async getChannelsForUserAndType(
    userId: string,
    notificationType: NotificationType
  ): Promise<DeliveryChannel[]> {
    return getChannelsForUserAndType(userId, notificationType);
  }
  
  /**
   * Creates a new preference
   * @param preferenceData - The preference data to create
   * @returns Newly created preference document
   */
  async create(
    preferenceData: INotificationPreference
  ): Promise<IPreferenceDocument> {
    return createPreference(preferenceData);
  }
  
  /**
   * Updates a preference
   * @param preferenceId - The ID of the preference to update
   * @param updateData - The data to update
   * @returns Updated preference document
   */
  async update(
    preferenceId: string,
    updateData: INotificationPreferenceUpdate
  ): Promise<IPreferenceDocument> {
    return updatePreference(preferenceId, updateData);
  }
  
  /**
   * Toggles a notification type for a user
   * @param userId - The user's ID
   * @param notificationType - The type of notification
   * @param enabled - The new enabled status
   * @returns Updated preference document
   */
  async toggleNotificationType(
    userId: string,
    notificationType: NotificationType,
    enabled: boolean
  ): Promise<IPreferenceDocument> {
    return toggleNotificationType(userId, notificationType, enabled);
  }
  
  /**
   * Updates delivery channels for a notification type
   * @param userId - The user's ID
   * @param notificationType - The type of notification
   * @param channels - The new delivery channels
   * @returns Updated preference document
   */
  async updateChannels(
    userId: string,
    notificationType: NotificationType,
    channels: DeliveryChannel[]
  ): Promise<IPreferenceDocument> {
    return updateChannels(userId, notificationType, channels);
  }
  
  /**
   * Deletes a preference
   * @param preferenceId - The ID of the preference to delete
   * @returns Whether the deletion was successful
   */
  async delete(preferenceId: string): Promise<boolean> {
    return deletePreference(preferenceId);
  }
  
  /**
   * Updates multiple preferences for a user
   * @param userId - The user's ID
   * @param preferencesData - Array of preference updates
   * @returns Array of updated preference documents
   */
  async bulkUpdate(
    userId: string,
    preferencesData: Array<{
      notificationType: NotificationType;
      enabled?: boolean;
      channels?: DeliveryChannel[];
    }>
  ): Promise<IPreferenceDocument[]> {
    return bulkUpdatePreferences(userId, preferencesData);
  }
  
  /**
   * Ensures a user has all notification preferences
   * @param userId - The user's ID
   * @returns Array of preference documents
   */
  async ensureUserPreferences(userId: string): Promise<IPreferenceDocument[]> {
    return ensureUserPreferences(userId);
  }
  
  /**
   * Resets preferences to default values
   * @param userId - The user's ID
   * @param notificationType - The type of notification
   * @returns Reset preference document
   */
  async resetToDefaults(
    userId: string,
    notificationType: NotificationType
  ): Promise<IPreferenceDocument> {
    return resetToDefaults(userId, notificationType);
  }
}

// Create and export singleton instance of the preference service
export const preferenceService = new PreferenceService();