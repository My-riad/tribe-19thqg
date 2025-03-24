import { Schema, model, Document } from 'mongoose'; // v6.0.0
import { 
  DeliveryChannel, 
  NotificationStatus, 
  INotificationDelivery 
} from '../../../shared/src/types/notification.types';

/**
 * Interface extending both Mongoose Document and INotificationDelivery
 */
export interface IDeliveryDocument extends Document, INotificationDelivery {
  // Document properties
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsSent(): Promise<IDeliveryDocument>;
  markAsDelivered(): Promise<IDeliveryDocument>;
  markAsRead(): Promise<IDeliveryDocument>;
  markAsFailed(errorMessage: string): Promise<IDeliveryDocument>;
  incrementRetryCount(): Promise<IDeliveryDocument>;
  
  // Virtual properties
  deliveryTime: number | null;
  isDelivered: boolean;
  isRead: boolean;
  isFailed: boolean;
  canRetry: boolean;
}

// Interface for the Delivery model statics
interface IDeliveryModel extends Model<IDeliveryDocument> {
  findByNotification(notificationId: string): Promise<IDeliveryDocument[]>;
  findByNotificationAndChannel(notificationId: string, channel: DeliveryChannel): Promise<IDeliveryDocument | null>;
  findPendingDeliveries(limit: number): Promise<IDeliveryDocument[]>;
  findFailedDeliveries(limit: number, maxRetryCount: number): Promise<IDeliveryDocument[]>;
  getDeliveryStats(startDate: Date, endDate: Date): Promise<{
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
    successRate: number;
  }>;
  getDeliveryStatsByChannel(startDate: Date, endDate: Date): Promise<Record<DeliveryChannel, {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    pending: number;
    successRate: number;
  }>>;
}

/**
 * Mongoose schema for notification delivery tracking
 */
export const DeliverySchema = new Schema({
  notificationId: {
    type: Schema.Types.ObjectId,
    ref: 'Notification',
    required: true,
    description: 'Reference to the notification being delivered'
  },
  channel: {
    type: String,
    enum: Object.values(DeliveryChannel),
    required: true,
    description: 'Channel through which the notification is being delivered (PUSH, EMAIL, IN_APP, SMS)'
  },
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    description: 'Current status of the delivery (PENDING, SENT, DELIVERED, READ, FAILED)'
  },
  sentAt: {
    type: Date,
    description: 'Timestamp when the notification was sent through the channel'
  },
  deliveredAt: {
    type: Date,
    description: 'Timestamp when the notification was confirmed delivered to the user'
  },
  readAt: {
    type: Date,
    description: 'Timestamp when the notification was read by the user'
  },
  errorMessage: {
    type: String,
    description: 'Error message if delivery failed'
  },
  retryCount: {
    type: Number,
    default: 0,
    description: 'Number of retry attempts for failed deliveries'
  },
  metadata: {
    type: Object,
    description: 'Additional data related to the delivery, such as device info, email details, etc.'
  }
}, { timestamps: true });

// Create indexes for optimizing queries
DeliverySchema.index({ notificationId: 1 });
DeliverySchema.index({ notificationId: 1, channel: 1 }, { unique: true });
DeliverySchema.index({ status: 1, createdAt: 1 });
DeliverySchema.index({ channel: 1, status: 1 });
DeliverySchema.index({ updatedAt: 1 });

/**
 * Instance methods
 */
DeliverySchema.methods.markAsSent = function(): Promise<IDeliveryDocument> {
  this.status = NotificationStatus.SENT;
  this.sentAt = new Date();
  return this.save();
};

DeliverySchema.methods.markAsDelivered = function(): Promise<IDeliveryDocument> {
  this.status = NotificationStatus.DELIVERED;
  this.deliveredAt = new Date();
  return this.save();
};

DeliverySchema.methods.markAsRead = function(): Promise<IDeliveryDocument> {
  this.status = NotificationStatus.READ;
  this.readAt = new Date();
  return this.save();
};

DeliverySchema.methods.markAsFailed = function(errorMessage: string): Promise<IDeliveryDocument> {
  this.status = NotificationStatus.FAILED;
  this.errorMessage = errorMessage;
  return this.save();
};

DeliverySchema.methods.incrementRetryCount = function(): Promise<IDeliveryDocument> {
  this.retryCount += 1;
  return this.save();
};

/**
 * Static methods
 */
DeliverySchema.statics.findByNotification = function(notificationId: string): Promise<IDeliveryDocument[]> {
  return this.find({ notificationId }).exec();
};

DeliverySchema.statics.findByNotificationAndChannel = function(notificationId: string, channel: DeliveryChannel): Promise<IDeliveryDocument | null> {
  return this.findOne({ notificationId, channel }).exec();
};

DeliverySchema.statics.findPendingDeliveries = function(limit: number): Promise<IDeliveryDocument[]> {
  return this.find({ status: NotificationStatus.PENDING })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

DeliverySchema.statics.findFailedDeliveries = function(limit: number, maxRetryCount: number): Promise<IDeliveryDocument[]> {
  return this.find({ 
    status: NotificationStatus.FAILED,
    retryCount: { $lt: maxRetryCount }
  })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .exec();
};

DeliverySchema.statics.getDeliveryStats = async function(startDate: Date, endDate: Date) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: { 
          $sum: {
            $cond: [{ $in: ['$status', [NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ]] }, 1, 0]
          }
        },
        delivered: {
          $sum: {
            $cond: [{ $in: ['$status', [NotificationStatus.DELIVERED, NotificationStatus.READ]] }, 1, 0]
          }
        },
        read: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.READ] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.FAILED] }, 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.PENDING] }, 1, 0]
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline).exec();
  
  if (result.length === 0) {
    return {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: 0,
      successRate: 0
    };
  }

  const stats = result[0];
  stats.successRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
  delete stats._id;
  
  return stats;
};

DeliverySchema.statics.getDeliveryStatsByChannel = async function(startDate: Date, endDate: Date) {
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$channel',
        total: { $sum: 1 },
        sent: { 
          $sum: {
            $cond: [{ $in: ['$status', [NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ]] }, 1, 0]
          }
        },
        delivered: {
          $sum: {
            $cond: [{ $in: ['$status', [NotificationStatus.DELIVERED, NotificationStatus.READ]] }, 1, 0]
          }
        },
        read: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.READ] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.FAILED] }, 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', NotificationStatus.PENDING] }, 1, 0]
          }
        }
      }
    }
  ];

  const results = await this.aggregate(pipeline).exec();
  
  const statsByChannel = Object.values(DeliveryChannel).reduce((acc, channel) => {
    acc[channel] = {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      pending: 0,
      successRate: 0
    };
    return acc;
  }, {} as Record<DeliveryChannel, any>);
  
  results.forEach(result => {
    const channel = result._id;
    statsByChannel[channel] = {
      ...result,
      successRate: result.total > 0 ? (result.delivered / result.total) * 100 : 0
    };
    delete statsByChannel[channel]._id;
  });
  
  return statsByChannel;
};

/**
 * Virtual properties
 */
DeliverySchema.virtual('deliveryTime').get(function() {
  if (this.sentAt && this.deliveredAt) {
    return this.deliveredAt.getTime() - this.sentAt.getTime();
  }
  return null;
});

DeliverySchema.virtual('isDelivered').get(function() {
  return this.status === NotificationStatus.DELIVERED || this.status === NotificationStatus.READ;
});

DeliverySchema.virtual('isRead').get(function() {
  return this.status === NotificationStatus.READ;
});

DeliverySchema.virtual('isFailed').get(function() {
  return this.status === NotificationStatus.FAILED;
});

DeliverySchema.virtual('canRetry').get(function() {
  // Default max retry count is 3 if not specified in environment
  const MAX_RETRY_COUNT = process.env.MAX_RETRY_COUNT ? parseInt(process.env.MAX_RETRY_COUNT) : 3;
  return this.status === NotificationStatus.FAILED && this.retryCount < MAX_RETRY_COUNT;
});

// Configure schema to include virtuals when converted to JSON
DeliverySchema.set('toJSON', { virtuals: true });
DeliverySchema.set('toObject', { virtuals: true });

// Create and export the Delivery model
export const Delivery = model<IDeliveryDocument, IDeliveryModel>('Delivery', DeliverySchema);