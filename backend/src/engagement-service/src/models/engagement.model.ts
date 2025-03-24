import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Defines the different types of engagement activities that can be generated for tribes
 */
export enum EngagementType {
  CONVERSATION_PROMPT = 'CONVERSATION_PROMPT',
  ACTIVITY_SUGGESTION = 'ACTIVITY_SUGGESTION',
  GROUP_CHALLENGE = 'GROUP_CHALLENGE',
  MEETUP_SUGGESTION = 'MEETUP_SUGGESTION',
  POLL_QUESTION = 'POLL_QUESTION'
}

/**
 * Defines the possible statuses of an engagement activity throughout its lifecycle
 */
export enum EngagementStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  RESPONDED = 'RESPONDED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED'
}

/**
 * Defines what triggered the creation of an engagement activity
 */
export enum EngagementTrigger {
  SCHEDULED = 'SCHEDULED',
  LOW_ACTIVITY = 'LOW_ACTIVITY',
  USER_REQUESTED = 'USER_REQUESTED',
  EVENT_BASED = 'EVENT_BASED',
  AI_INITIATED = 'AI_INITIATED'
}

/**
 * Interface for user responses to engagement activities
 */
export interface IEngagementResponse {
  userId: string;
  content: string;
  responseType: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * Interface extending Document for engagement documents in MongoDB
 */
export interface IEngagementDocument extends Document {
  tribeId: string;
  type: EngagementType;
  content: string;
  status: EngagementStatus;
  trigger: EngagementTrigger;
  createdBy: string;
  deliveredAt?: Date;
  expiresAt?: Date;
  responses: IEngagementResponse[];
  aiGenerated: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for the Engagement model with static methods
 */
export interface IEngagementModel extends Model<IEngagementDocument> {
  findByTribeId(tribeId: string): Promise<IEngagementDocument[]>;
  findActiveByTribeId(tribeId: string): Promise<IEngagementDocument[]>;
  findByType(type: EngagementType): Promise<IEngagementDocument[]>;
  findExpired(): Promise<IEngagementDocument[]>;
  getEngagementMetrics(tribeId: string, startDate?: Date, endDate?: Date): Promise<IEngagementMetricsResponse>;
}

// Schema for engagement responses
const engagementResponseSchema = new Schema<IEngagementResponse>(
  {
    userId: { type: String, required: true },
    content: { type: String, required: true },
    responseType: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

/**
 * Mongoose schema definition for engagements
 */
export const engagementSchema = new Schema<IEngagementDocument, IEngagementModel>(
  {
    tribeId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      required: true, 
      enum: Object.values(EngagementType),
      index: true 
    },
    content: { type: String, required: true },
    status: { 
      type: String, 
      required: true, 
      enum: Object.values(EngagementStatus),
      default: EngagementStatus.PENDING,
      index: true 
    },
    trigger: { 
      type: String, 
      required: true, 
      enum: Object.values(EngagementTrigger),
      index: true 
    },
    createdBy: { type: String, required: true },
    deliveredAt: { type: Date },
    expiresAt: { type: Date, index: true },
    responses: [engagementResponseSchema],
    aiGenerated: { type: Boolean, required: true, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Static methods for the Engagement model
engagementSchema.statics.findByTribeId = function(tribeId: string): Promise<IEngagementDocument[]> {
  return this.find({ tribeId }).sort({ createdAt: -1 }).exec();
};

engagementSchema.statics.findActiveByTribeId = function(tribeId: string): Promise<IEngagementDocument[]> {
  return this.find({ 
    tribeId, 
    status: { $in: [EngagementStatus.PENDING, EngagementStatus.DELIVERED] },
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  }).sort({ createdAt: -1 }).exec();
};

engagementSchema.statics.findByType = function(type: EngagementType): Promise<IEngagementDocument[]> {
  return this.find({ type }).sort({ createdAt: -1 }).exec();
};

engagementSchema.statics.findExpired = function(): Promise<IEngagementDocument[]> {
  return this.find({ 
    status: { $in: [EngagementStatus.PENDING, EngagementStatus.DELIVERED] },
    expiresAt: { $lt: new Date() }
  }).exec();
};

engagementSchema.statics.getEngagementMetrics = async function(
  tribeId: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<IEngagementMetricsResponse> {
  const query: any = { tribeId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const engagements = await this.find(query).exec();
  
  // Calculate total engagements
  const totalEngagements = engagements.length;
  
  // Calculate response rate
  const engagementsWithResponses = engagements.filter(e => e.responses.length > 0);
  const responseRate = totalEngagements > 0 
    ? engagementsWithResponses.length / totalEngagements 
    : 0;
  
  // Count engagements by type
  const engagementsByType: Record<string, number> = {};
  engagements.forEach(e => {
    engagementsByType[e.type] = (engagementsByType[e.type] || 0) + 1;
  });
  
  // Count responses by type
  const responsesByType: Record<string, number> = {};
  engagements.forEach(e => {
    responsesByType[e.type] = (responsesByType[e.type] || 0) + e.responses.length;
  });
  
  // Find top responders
  const responderMap = new Map<string, number>();
  engagements.forEach(e => {
    e.responses.forEach(r => {
      responderMap.set(r.userId, (responderMap.get(r.userId) || 0) + 1);
    });
  });
  
  const topResponders = Array.from(responderMap.entries())
    .map(([userId, responseCount]) => ({ userId, responseCount }))
    .sort((a, b) => b.responseCount - a.responseCount)
    .slice(0, 5);
  
  // Get recent engagements
  const recentEngagements: IEngagementResponse[] = engagements
    .slice(0, 5)
    .map(e => ({
      id: e._id.toString(),
      tribeId: e.tribeId,
      type: e.type,
      content: e.content,
      status: e.status,
      trigger: e.trigger,
      createdBy: e.createdBy,
      deliveredAt: e.deliveredAt,
      expiresAt: e.expiresAt,
      responseCount: e.responses.length,
      userHasResponded: false, // This will be set by the service
      responses: e.responses,
      aiGenerated: e.aiGenerated,
      metadata: e.metadata,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    }));
  
  return {
    totalEngagements,
    responseRate,
    engagementsByType,
    responsesByType,
    topResponders,
    recentEngagements,
    timeRange: {
      startDate: startDate || engagements[engagements.length - 1]?.createdAt || new Date(),
      endDate: endDate || new Date()
    }
  };
};

/**
 * Mongoose model for engagements
 */
export const Engagement = mongoose.model<IEngagementDocument, IEngagementModel>(
  'Engagement', 
  engagementSchema
);

/**
 * Interface for creating a new engagement
 */
export interface IEngagementCreate {
  tribeId: string;
  type: EngagementType;
  content: string;
  status?: EngagementStatus;
  trigger: EngagementTrigger;
  createdBy: string;
  expiresAt?: Date;
  aiGenerated: boolean;
  metadata?: Record<string, any>;
}

/**
 * Interface for updating an existing engagement
 */
export interface IEngagementUpdate {
  content?: string;
  status?: EngagementStatus;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for creating a new response to an engagement
 */
export interface IEngagementResponseCreate {
  userId: string;
  content: string;
  responseType: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for engagement response objects sent to clients
 * 
 * Note: This interface has the same name as the one used for user responses
 * within an engagement document but serves a different purpose. It represents
 * the full engagement object returned to clients.
 */
export interface IEngagementResponse {
  id: string;
  tribeId: string;
  type: string;
  content: string;
  status: string;
  trigger: string;
  createdBy: string;
  deliveredAt?: Date;
  expiresAt?: Date;
  responseCount: number;
  userHasResponded: boolean;
  responses: IEngagementResponse[];
  aiGenerated: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for engagement metrics response
 */
export interface IEngagementMetricsResponse {
  totalEngagements: number;
  responseRate: number;
  engagementsByType: Record<string, number>;
  responsesByType: Record<string, number>;
  topResponders: Array<{userId: string, responseCount: number}>;
  recentEngagements: IEngagementResponse[];
  timeRange: {startDate: Date, endDate: Date};
}

/**
 * Interface for searching engagements with various criteria
 */
export interface IEngagementSearchParams {
  tribeId?: string;
  type?: EngagementType;
  status?: EngagementStatus;
  trigger?: EngagementTrigger;
  createdBy?: string;
  aiGenerated?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}