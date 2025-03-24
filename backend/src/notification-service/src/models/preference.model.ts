import { Schema, model, Document } from 'mongoose';
import { 
  NotificationType,
  DeliveryChannel,
  INotificationPreference 
} from '../../../shared/src/types/notification.types';

/**
 * Extends the INotificationPreference interface with Mongoose Document properties
 */
export interface IPreferenceDocument extends Omit<INotificationPreference, 'id'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Determines the default delivery channels for a notification type
 * @param type The notification type
 * @returns Array of default delivery channels for the notification type
 */
function getDefaultChannelsForType(type: NotificationType): DeliveryChannel[] {
  // Initialize with IN_APP channel for all notification types
  const channels: DeliveryChannel[] = [DeliveryChannel.IN_APP];
  
  switch (type) {
    case NotificationType.TRIBE_INVITATION:
    case NotificationType.TRIBE_MATCH:
      // Important tribe membership notifications go to push and email
      channels.push(DeliveryChannel.PUSH, DeliveryChannel.EMAIL);
      break;
    case NotificationType.EVENT_REMINDER:
      // Event reminders should reach users through multiple channels
      channels.push(DeliveryChannel.PUSH, DeliveryChannel.EMAIL);
      break;
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      // Achievement notifications primarily push
      channels.push(DeliveryChannel.PUSH);
      break;
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      // Engagement prompts are time-sensitive
      channels.push(DeliveryChannel.PUSH);
      break;
    case NotificationType.TRIBE_UPDATE:
      // Updates about tribes the user belongs to
      channels.push(DeliveryChannel.PUSH);
      break;
    // Other notification types just use IN_APP by default
  }
  
  return channels;
}

/**
 * Mongoose schema definition for notification preferences
 */
export const PreferenceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    description: 'Reference to the user who owns these notification preferences'
  },
  notificationType: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    description: 'Type of notification these preferences apply to'
  },
  enabled: {
    type: Boolean,
    default: true,
    description: 'Whether notifications of this type are enabled for the user'
  },
  channels: {
    type: [String],
    enum: Object.values(DeliveryChannel),
    default: function(this: any) {
      return getDefaultChannelsForType(this.notificationType);
    },
    description: 'Array of delivery channels through which the user wants to receive this notification type'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    description: 'Timestamp when the preference was created'
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    description: 'Timestamp when the preference was last updated'
  }
}, { 
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Create indexes for efficient queries
PreferenceSchema.index({ userId: 1 }, { 
  name: 'user_preferences_idx',
  background: true,
  description: 'Optimize queries for finding all preferences for a user'
});

PreferenceSchema.index({ userId: 1, notificationType: 1 }, { 
  unique: true,
  name: 'user_notification_type_idx',
  background: true,
  description: 'Ensure each user has only one preference record per notification type'
});

PreferenceSchema.index({ notificationType: 1, enabled: 1 }, {
  name: 'notification_type_enabled_idx',
  background: true,
  description: 'Optimize queries for finding users with specific notification types enabled/disabled'
});

// Add virtual properties to easily check presence of specific channels
PreferenceSchema.virtual('hasEmailChannel').get(function(this: IPreferenceDocument) {
  return this.channels.includes(DeliveryChannel.EMAIL);
});

PreferenceSchema.virtual('hasPushChannel').get(function(this: IPreferenceDocument) {
  return this.channels.includes(DeliveryChannel.PUSH);
});

PreferenceSchema.virtual('hasInAppChannel').get(function(this: IPreferenceDocument) {
  return this.channels.includes(DeliveryChannel.IN_APP);
});

PreferenceSchema.virtual('hasSmsChannel').get(function(this: IPreferenceDocument) {
  return this.channels.includes(DeliveryChannel.SMS);
});

// Add hooks for data validation and maintenance
PreferenceSchema.pre('save', function(this: IPreferenceDocument, next) {
  this.updatedAt = new Date();
  next();
});

PreferenceSchema.pre('save', function(this: IPreferenceDocument, next) {
  // Ensure all channels are valid DeliveryChannel values
  this.channels = this.channels.filter(channel => 
    Object.values(DeliveryChannel).includes(channel as DeliveryChannel)
  );
  next();
});

// Add static methods for common operations
PreferenceSchema.statics.findByUser = function(userId: string): Promise<IPreferenceDocument[]> {
  return this.find({ userId }).exec();
};

PreferenceSchema.statics.findByUserAndType = function(
  userId: string, 
  notificationType: NotificationType
): Promise<IPreferenceDocument | null> {
  return this.findOne({ userId, notificationType }).exec();
};

PreferenceSchema.statics.findEnabledByUserAndType = async function(
  userId: string, 
  notificationType: NotificationType
): Promise<boolean> {
  const preference = await this.findOne({ userId, notificationType, enabled: true }).exec();
  return !!preference;
};

PreferenceSchema.statics.getChannelsForUserAndType = async function(
  userId: string, 
  notificationType: NotificationType
): Promise<DeliveryChannel[]> {
  const preference = await this.findOne({ userId, notificationType }).exec();
  
  if (preference) {
    if (!preference.enabled) {
      return [];
    }
    return preference.channels;
  }
  
  // If no preference exists, return default channels
  return getDefaultChannelsForType(notificationType);
};

PreferenceSchema.statics.createDefaultPreference = async function(
  userId: string, 
  notificationType: NotificationType
): Promise<IPreferenceDocument> {
  const defaultChannels = getDefaultChannelsForType(notificationType);
  
  const preference = new this({
    userId,
    notificationType,
    enabled: true,
    channels: defaultChannels
  });
  
  await preference.save();
  return preference;
};

// Create and export the model
export const Preference = model<IPreferenceDocument>('Preference', PreferenceSchema);