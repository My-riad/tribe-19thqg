import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { preferenceService } from '../services/preference.service';
import { 
  validateCreatePreference, 
  validateUpdatePreference, 
  validateGetPreferences, 
  validatePreferenceId, 
  validateBulkUpdatePreferences, 
  validateToggleNotificationType, 
  validateUpdateChannels 
} from '../validations/preference.validation';
import { NotificationType, DeliveryChannel } from '../../../shared/src/types/notification.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

/**
 * Retrieves all notification preferences for a user
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getUserPreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, notificationType } = req.query as { userId: string; notificationType?: NotificationType };
    
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    
    const preferences = await preferenceService.findByUser(userId);
    
    // If notificationType is provided, filter by type
    const filteredPreferences = notificationType
      ? preferences.filter(pref => pref.notificationType === notificationType)
      : preferences;
    
    logger.info('Retrieved user preferences', { userId, count: filteredPreferences.length });
    res.json(filteredPreferences);
  } catch (error) {
    logger.error('Error retrieving user preferences', error as Error);
    next(error);
  }
}

/**
 * Retrieves a specific notification preference by user and notification type
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function getUserPreferenceByType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, notificationType } = req.params as { userId: string; notificationType: NotificationType };
    
    let preference = await preferenceService.findByUserAndType(userId, notificationType as NotificationType);
    
    // If preference doesn't exist, create a default one
    if (!preference) {
      logger.info('Preference not found, creating default', { userId, notificationType });
      preference = await preferenceService.resetToDefaults(userId, notificationType as NotificationType);
    }
    
    res.json(preference);
  } catch (error) {
    logger.error('Error retrieving preference by type', error as Error);
    next(error);
  }
}

/**
 * Creates a new notification preference
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function createPreference(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const preferenceData = req.body;
    
    const newPreference = await preferenceService.create(preferenceData);
    
    logger.info('Created new preference', { 
      userId: newPreference.userId, 
      notificationType: newPreference.notificationType 
    });
    
    res.status(201).json(newPreference);
  } catch (error) {
    logger.error('Error creating preference', error as Error);
    next(error);
  }
}

/**
 * Updates an existing notification preference
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function updatePreference(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedPreference = await preferenceService.update(id, updateData);
    
    logger.info('Updated preference', { 
      id, 
      userId: updatedPreference.userId, 
      notificationType: updatedPreference.notificationType 
    });
    
    res.json(updatedPreference);
  } catch (error) {
    logger.error('Error updating preference', error as Error);
    next(error);
  }
}

/**
 * Deletes a notification preference
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function deletePreference(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const success = await preferenceService.delete(id);
    
    if (!success) {
      throw ApiError.notFound(`Preference with ID ${id} not found`);
    }
    
    logger.info('Deleted preference', { id });
    
    res.json({ message: 'Preference deleted successfully' });
  } catch (error) {
    logger.error('Error deleting preference', error as Error);
    next(error);
  }
}

/**
 * Updates multiple notification preferences for a user in bulk
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function bulkUpdatePreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, preferences } = req.body;
    
    if (!userId || !preferences || !Array.isArray(preferences)) {
      throw ApiError.badRequest('User ID and preferences array are required');
    }
    
    const updatedPreferences = await preferenceService.bulkUpdate(userId, preferences);
    
    logger.info('Bulk updated preferences', { userId, count: updatedPreferences.length });
    
    res.json(updatedPreferences);
  } catch (error) {
    logger.error('Error bulk updating preferences', error as Error);
    next(error);
  }
}

/**
 * Toggles the enabled status of a notification type for a user
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function toggleNotificationType(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, notificationType } = req.params as { userId: string; notificationType: NotificationType };
    const { enabled } = req.body as { enabled: boolean };
    
    const updatedPreference = await preferenceService.toggleNotificationType(
      userId, 
      notificationType as NotificationType, 
      enabled
    );
    
    logger.info('Toggled notification type', { 
      userId, 
      notificationType, 
      enabled 
    });
    
    res.json(updatedPreference);
  } catch (error) {
    logger.error('Error toggling notification type', error as Error);
    next(error);
  }
}

/**
 * Updates the delivery channels for a notification type and user
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function updateChannels(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, notificationType } = req.params as { userId: string; notificationType: NotificationType };
    const { channels } = req.body as { channels: DeliveryChannel[] };
    
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      throw ApiError.badRequest('Valid channels array is required');
    }
    
    const updatedPreference = await preferenceService.updateChannels(
      userId, 
      notificationType as NotificationType, 
      channels as DeliveryChannel[]
    );
    
    logger.info('Updated notification channels', {
      userId,
      notificationType,
      channels
    });
    
    res.json(updatedPreference);
  } catch (error) {
    logger.error('Error updating notification channels', error as Error);
    next(error);
  }
}

/**
 * Ensures a user has preferences for all notification types
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function ensureUserPreferences(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    
    const preferences = await preferenceService.ensureUserPreferences(userId);
    
    logger.info('Ensured user preferences', {
      userId,
      count: preferences.length
    });
    
    res.json(preferences);
  } catch (error) {
    logger.error('Error ensuring user preferences', error as Error);
    next(error);
  }
}

/**
 * Resets a user's notification preference to default values
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function resetToDefaults(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId, notificationType } = req.params as { userId: string; notificationType: NotificationType };
    
    const resetPreference = await preferenceService.resetToDefaults(
      userId, 
      notificationType as NotificationType
    );
    
    logger.info('Reset preference to defaults', {
      userId,
      notificationType
    });
    
    res.json(resetPreference);
  } catch (error) {
    logger.error('Error resetting preference to defaults', error as Error);
    next(error);
  }
}