import { Schema, model, Document } from 'mongoose';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus,
  INotification 
} from '../../../shared/src/types/notification.types';

/**
 * Calculates the expiration time for notifications based on their type
 * @param type NotificationType to calculate expiration for
 * @returns Date representing when the notification should expire
 */
const calculateExpirationTime = (type: NotificationType): Date => {
  let expirationDays = 30; // Default expiration of 30 days
  
  switch (type) {
    case NotificationType.EVENT_REMINDER:
      expirationDays = 1; // Expire after 1 day
      break;
    case NotificationType.TRIBE_INVITATION:
      expirationDays = 7; // Expire after 7 days
      break;
    case NotificationType.TRIBE_MATCH:
      expirationDays = 14; // Expire after 14 days
      break;
    case NotificationType.AI_ENGAGEMENT_PROMPT:
      expirationDays = 3; // Expire after 3 days
      break;
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      expirationDays = 60; // Expire after 60 days
      break;
    case NotificationType.TRIBE_UPDATE:
      expirationDays = 14; // Expire after 14 days
      break;
  }
  
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  return expirationDate;
};

/**
 * Interface extending both INotification and Document for MongoDB operations
 */
export interface INotificationDocument extends INotification, Document {
  markAsRead(): Promise<INotificationDocument>;
  markAsSent(): Promise<INotificationDocument>;
  markAsDelivered(): Promise<INotificationDocument>;
  markAsFailed(): Promise<INotificationDocument>;
}

/**
 * Mongoose schema definition for the Notification model
 */
export const NotificationSchema = new Schema<INotificationDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    description: 'Reference to the user who will receive the notification'
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
    index: true,
    description: 'Type of notification (TRIBE_INVITATION, EVENT_REMINDER, etc.)'
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    description: 'Short title or heading for the notification'
  },
  body: {
    type: String,
    required: true,
    maxlength: 500,
    description: 'Main content of the notification'
  },
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
    description: 'Priority level of the notification (LOW, MEDIUM, HIGH, URGENT)'
  },
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true,
    description: 'Current status of the notification (PENDING, SENT, DELIVERED, READ, FAILED)'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    description: 'Timestamp when the notification was created'
  },
  expiresAt: {
    type: Date,
    index: true,
    description: 'Timestamp when the notification expires and should no longer be shown'
  },
  tribeId: {
    type: Schema.Types.ObjectId,
    ref: 'Tribe',
    index: true,
    sparse: true,
    description: 'Reference to related tribe if notification is tribe-related'
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    index: true,
    sparse: true,
    description: 'Reference to related event if notification is event-related'
  },
  actionUrl: {
    type: String,
    description: 'Deep link URL for the notification action'
  },
  imageUrl: {
    type: String,
    description: 'URL to an image to display with the notification'
  },
  metadata: {
    type: Object,
    description: 'Additional data related to the notification'
  }
}, {
  timestamps: true
});

// Create compound indexes for common queries
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, type: 1 });

/**
 * Virtual property that returns true if notification has been read
 */
NotificationSchema.virtual('isRead').get(function(this: INotificationDocument) {
  return this.status === NotificationStatus.READ;
});

/**
 * Virtual property that returns true if notification has expired
 */
NotificationSchema.virtual('isExpired').get(function(this: INotificationDocument) {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

/**
 * Virtual property that returns the age of the notification in milliseconds
 */
NotificationSchema.virtual('age').get(function(this: INotificationDocument) {
  return Date.now() - this.createdAt.getTime();
});

/**
 * Mark notification as read
 */
NotificationSchema.methods.markAsRead = async function(this: INotificationDocument): Promise<INotificationDocument> {
  this.status = NotificationStatus.READ;
  return this.save();
};

/**
 * Mark notification as sent
 */
NotificationSchema.methods.markAsSent = async function(this: INotificationDocument): Promise<INotificationDocument> {
  this.status = NotificationStatus.SENT;
  return this.save();
};

/**
 * Mark notification as delivered
 */
NotificationSchema.methods.markAsDelivered = async function(this: INotificationDocument): Promise<INotificationDocument> {
  this.status = NotificationStatus.DELIVERED;
  return this.save();
};

/**
 * Mark notification as failed
 */
NotificationSchema.methods.markAsFailed = async function(this: INotificationDocument): Promise<INotificationDocument> {
  this.status = NotificationStatus.FAILED;
  return this.save();
};

/**
 * Find all notifications for a user with optional filtering
 */
NotificationSchema.statics.findByUser = async function(
  userId: string,
  options: {
    status?: NotificationStatus,
    type?: NotificationType,
    limit?: number,
    offset?: number,
    sort?: Record<string, 1 | -1>
  } = {}
): Promise<INotificationDocument[]> {
  const query = this.find({ userId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.offset) {
    query.skip(options.offset);
  }
  
  query.sort(options.sort || { createdAt: -1 });
  
  return query.exec();
};

/**
 * Find unread notifications for a user
 */
NotificationSchema.statics.findUnreadByUser = async function(
  userId: string,
  options: {
    type?: NotificationType,
    limit?: number,
    offset?: number
  } = {}
): Promise<INotificationDocument[]> {
  const query = this.find({
    userId,
    status: { $ne: NotificationStatus.READ }
  });
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.offset) {
    query.skip(options.offset);
  }
  
  query.sort({ createdAt: -1 });
  
  return query.exec();
};

/**
 * Count unread notifications for a user
 */
NotificationSchema.statics.countUnreadByUser = async function(
  userId: string
): Promise<number> {
  return this.countDocuments({
    userId,
    status: { $ne: NotificationStatus.READ }
  }).exec();
};

/**
 * Find notifications related to a specific tribe
 */
NotificationSchema.statics.findByTribe = async function(
  tribeId: string,
  options: {
    status?: NotificationStatus,
    type?: NotificationType,
    limit?: number,
    offset?: number
  } = {}
): Promise<INotificationDocument[]> {
  const query = this.find({ tribeId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.offset) {
    query.skip(options.offset);
  }
  
  query.sort({ createdAt: -1 });
  
  return query.exec();
};

/**
 * Find notifications related to a specific event
 */
NotificationSchema.statics.findByEvent = async function(
  eventId: string,
  options: {
    status?: NotificationStatus,
    type?: NotificationType,
    limit?: number,
    offset?: number
  } = {}
): Promise<INotificationDocument[]> {
  const query = this.find({ eventId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.offset) {
    query.skip(options.offset);
  }
  
  query.sort({ createdAt: -1 });
  
  return query.exec();
};

/**
 * Find expired notifications
 */
NotificationSchema.statics.findExpired = async function(
  limit: number = 100
): Promise<INotificationDocument[]> {
  return this.find({
    expiresAt: { $lt: new Date() }
  })
  .limit(limit)
  .exec();
};

/**
 * Mark all notifications as read for a user, optionally filtered by type
 */
NotificationSchema.statics.markAllAsRead = async function(
  userId: string,
  type?: NotificationType
): Promise<number> {
  const query: any = { userId };
  
  if (type) {
    query.type = type;
  }
  
  const result = await this.updateMany(
    query,
    { $set: { status: NotificationStatus.READ } }
  ).exec();
  
  return result.modifiedCount;
};

/**
 * Set default expiration date based on notification type if not already set
 */
NotificationSchema.pre('save', function(this: INotificationDocument, next) {
  if (!this.expiresAt) {
    this.expiresAt = calculateExpirationTime(this.type);
  }
  next();
});

/**
 * Create delivery records after saving a notification
 */
NotificationSchema.post('save', function(this: INotificationDocument) {
  // This would typically call a service to create delivery records
  // based on user preferences for different channels (push, email, in-app)
  console.log(`Notification ${this._id} saved, creating delivery records...`);
});

/**
 * Mongoose model for notifications
 */
export const Notification = model<INotificationDocument>(
  'Notification', 
  NotificationSchema
);