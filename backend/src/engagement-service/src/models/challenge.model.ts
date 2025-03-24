import mongoose, { Document, Model, Schema } from 'mongoose';

/**
 * Defines the different types of challenges that can be created for tribes
 * These represent different activities to encourage member engagement
 */
export enum ChallengeType {
  PHOTO = 'PHOTO',           // Challenges involving taking photos
  CREATIVE = 'CREATIVE',     // Creative expression challenges
  SOCIAL = 'SOCIAL',         // Social interaction challenges
  EXPLORATION = 'EXPLORATION', // Challenges to explore new places
  LEARNING = 'LEARNING',     // Learning or skill-building challenges
  WELLNESS = 'WELLNESS',     // Health and wellness focused challenges
}

/**
 * Defines the possible statuses of a challenge
 * Represents the lifecycle of a challenge
 */
export enum ChallengeStatus {
  PENDING = 'PENDING',       // Challenge created but not yet started
  ACTIVE = 'ACTIVE',         // Challenge currently in progress
  COMPLETED = 'COMPLETED',   // Challenge has finished
  CANCELLED = 'CANCELLED',   // Challenge was cancelled
}

/**
 * Interface extending Document for challenge documents in MongoDB
 */
export interface IChallengeDocument extends Document {
  tribeId: string;           // ID of the tribe this challenge belongs to
  title: string;             // Title of the challenge
  description: string;       // Detailed description of the challenge
  type: ChallengeType;       // Type of challenge
  status: ChallengeStatus;   // Current status of the challenge
  startDate: Date;           // When the challenge begins
  endDate: Date;             // When the challenge ends
  createdBy: string;         // User ID of challenge creator
  participants: string[];    // Array of user IDs participating in the challenge
  completedBy: Array<{userId: string, completedAt: Date, evidence?: string}>; // Completion records
  pointValue: number;        // Points awarded for completing the challenge
  aiGenerated: boolean;      // Whether the challenge was AI-generated
  metadata: Record<string, any>; // Additional flexible data about the challenge
  createdAt: Date;           // When the challenge was created
  updatedAt: Date;           // When the challenge was last updated
}

/**
 * Interface for the Challenge model with static methods
 */
export interface IChallengeModel extends Model<IChallengeDocument> {
  findByTribeId(tribeId: string): Promise<IChallengeDocument[]>;
  findActiveByTribeId(tribeId: string): Promise<IChallengeDocument[]>;
  findByParticipant(userId: string): Promise<IChallengeDocument[]>;
  findByCompletion(userId: string): Promise<IChallengeDocument[]>;
}

/**
 * Mongoose schema definition for challenges
 */
export const challengeSchema = new Schema<IChallengeDocument, IChallengeModel>(
  {
    tribeId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ChallengeType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ChallengeStatus),
      default: ChallengeStatus.PENDING,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    participants: {
      type: [String],
      default: [],
    },
    completedBy: {
      type: [{
        userId: { type: String, required: true },
        completedAt: { type: Date, required: true },
        evidence: { type: String },
      }],
      default: [],
    },
    pointValue: {
      type: Number,
      default: 10,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Static methods for common query patterns
challengeSchema.statics.findByTribeId = function(tribeId: string): Promise<IChallengeDocument[]> {
  return this.find({ tribeId }).sort({ createdAt: -1 }).exec();
};

challengeSchema.statics.findActiveByTribeId = function(tribeId: string): Promise<IChallengeDocument[]> {
  return this.find({
    tribeId,
    status: ChallengeStatus.ACTIVE,
    endDate: { $gte: new Date() }
  }).sort({ endDate: 1 }).exec();
};

challengeSchema.statics.findByParticipant = function(userId: string): Promise<IChallengeDocument[]> {
  return this.find({
    participants: userId,
    status: ChallengeStatus.ACTIVE
  }).sort({ endDate: 1 }).exec();
};

challengeSchema.statics.findByCompletion = function(userId: string): Promise<IChallengeDocument[]> {
  return this.find({
    'completedBy.userId': userId
  }).sort({ 'completedBy.completedAt': -1 }).exec();
};

// Create and export the model
export const Challenge = mongoose.model<IChallengeDocument, IChallengeModel>('Challenge', challengeSchema);

/**
 * Interface for creating a new challenge
 */
export interface IChallengeCreate {
  tribeId: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  pointValue: number;
  aiGenerated: boolean;
  metadata: Record<string, any>;
}

/**
 * Interface for updating an existing challenge
 */
export interface IChallengeUpdate {
  title?: string;
  description?: string;
  status?: ChallengeStatus;
  startDate?: Date;
  endDate?: Date;
  pointValue?: number;
  metadata?: Record<string, any>;
}

/**
 * Interface for tracking user participation in a challenge
 */
export interface IChallengeParticipation {
  isParticipating: boolean;
  hasCompleted: boolean;
  completedAt: Date;
  evidence: string;
}

/**
 * Interface for challenge response objects sent to clients
 */
export interface IChallengeResponse {
  id: string;
  tribeId: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  participantCount: number;
  completionCount: number;
  pointValue: number;
  aiGenerated: boolean;
  userParticipation: IChallengeParticipation;
  createdAt: Date;
  updatedAt: Date;
}