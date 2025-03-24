import { Schema, model, Document, Model } from 'mongoose';

/**
 * Enum representing different types of prompts for engagement
 */
export enum PromptType {
  CONVERSATION_STARTER = 'CONVERSATION_STARTER',
  ACTIVITY_SUGGESTION = 'ACTIVITY_SUGGESTION',
  GROUP_CHALLENGE = 'GROUP_CHALLENGE',
  ICE_BREAKER = 'ICE_BREAKER',
  POLL_QUESTION = 'POLL_QUESTION'
}

/**
 * Enum representing different categories of prompts for organization and retrieval
 */
export enum PromptCategory {
  GENERAL = 'GENERAL',
  INTEREST_BASED = 'INTEREST_BASED',
  PERSONALITY_BASED = 'PERSONALITY_BASED',
  EVENT_RELATED = 'EVENT_RELATED',
  SEASONAL = 'SEASONAL',
  WEATHER_BASED = 'WEATHER_BASED'
}

/**
 * Interface for prompt documents in MongoDB
 * Extends the Document type from Mongoose
 */
export interface IPromptDocument extends Document {
  content: string;
  type: PromptType;
  category: PromptCategory;
  tags: string[];
  interestCategories: string[];
  personalityTraits: string[];
  usageCount: number;
  responseRate: number;
  lastUsed: Date;
  aiGenerated: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for the Prompt model with static methods
 */
export interface IPromptModel extends Model<IPromptDocument> {
  findByType(type: PromptType): Promise<IPromptDocument[]>;
  findByCategory(category: PromptCategory): Promise<IPromptDocument[]>;
  findByInterestCategory(interestCategories: string[]): Promise<IPromptDocument[]>;
  findByPersonalityTraits(personalityTraits: string[]): Promise<IPromptDocument[]>;
  findRelevantPrompts(criteria: object): Promise<IPromptDocument[]>;
  updateUsageStats(promptId: string, usageData: IPromptUsageUpdate): Promise<IPromptDocument>;
}

/**
 * Interface for creating a new prompt
 */
export interface IPromptCreate {
  content: string;
  type: PromptType;
  category: PromptCategory;
  tags: string[];
  interestCategories: string[];
  personalityTraits: string[];
  aiGenerated: boolean;
  metadata: Record<string, any>;
}

/**
 * Interface for updating an existing prompt
 */
export interface IPromptUpdate {
  content?: string;
  tags?: string[];
  interestCategories?: string[];
  personalityTraits?: string[];
  metadata?: Record<string, any>;
}

/**
 * Interface for prompt response objects sent to clients
 */
export interface IPromptResponse {
  id: string;
  content: string;
  type: string;
  category: string;
  tags: string[];
  interestCategories: string[];
  personalityTraits: string[];
  usageCount: number;
  responseRate: number;
  lastUsed: Date;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for updating prompt usage statistics
 */
export interface IPromptUsageUpdate {
  used: boolean;
  receivedResponse: boolean;
  engagementId: string;
}

/**
 * Interface for searching prompts with various criteria
 */
export interface IPromptSearchParams {
  type?: PromptType;
  category?: PromptCategory;
  tags?: string[];
  interestCategories?: string[];
  personalityTraits?: string[];
  aiGenerated?: boolean;
  minResponseRate?: number;
  excludeUsedInLast?: number; // days
  page?: number;
  limit?: number;
}

/**
 * Mongoose schema definition for prompts
 */
export const promptSchema = new Schema<IPromptDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(PromptType),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(PromptCategory),
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    interestCategories: {
      type: [String],
      default: [],
    },
    personalityTraits: {
      type: [String],
      default: [],
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    responseRate: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
      default: null,
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
  { timestamps: true }
);

/**
 * Static method to find prompts by their type
 * @param type - The prompt type to search for
 * @returns Promise resolving to an array of matching prompt documents
 */
promptSchema.static('findByType', async function(type: PromptType): Promise<IPromptDocument[]> {
  return this.find({ type });
});

/**
 * Static method to find prompts by their category
 * @param category - The prompt category to search for
 * @returns Promise resolving to an array of matching prompt documents
 */
promptSchema.static('findByCategory', async function(category: PromptCategory): Promise<IPromptDocument[]> {
  return this.find({ category });
});

/**
 * Static method to find prompts relevant to specific interest categories
 * @param interestCategories - Array of interest categories to search for
 * @returns Promise resolving to an array of matching prompt documents
 */
promptSchema.static('findByInterestCategory', async function(interestCategories: string[]): Promise<IPromptDocument[]> {
  return this.find({ interestCategories: { $in: interestCategories } });
});

/**
 * Static method to find prompts relevant to specific personality traits
 * @param personalityTraits - Array of personality traits to search for
 * @returns Promise resolving to an array of matching prompt documents
 */
promptSchema.static('findByPersonalityTraits', async function(personalityTraits: string[]): Promise<IPromptDocument[]> {
  return this.find({ personalityTraits: { $in: personalityTraits } });
});

/**
 * Static method to find prompts relevant to a tribe based on multiple criteria
 * @param criteria - Object containing search parameters
 * @returns Promise resolving to an array of matching prompt documents
 */
promptSchema.static('findRelevantPrompts', async function(criteria: any): Promise<IPromptDocument[]> {
  const queryConditions: any = {};
  
  if (criteria.type) {
    queryConditions.type = criteria.type;
  }
  
  if (criteria.category) {
    queryConditions.category = criteria.category;
  }
  
  if (criteria.interestCategories && criteria.interestCategories.length > 0) {
    queryConditions.interestCategories = { $in: criteria.interestCategories };
  }
  
  if (criteria.personalityTraits && criteria.personalityTraits.length > 0) {
    queryConditions.personalityTraits = { $in: criteria.personalityTraits };
  }
  
  if (criteria.tags && criteria.tags.length > 0) {
    queryConditions.tags = { $in: criteria.tags };
  }
  
  if (criteria.aiGenerated !== undefined) {
    queryConditions.aiGenerated = criteria.aiGenerated;
  }
  
  if (criteria.minResponseRate !== undefined) {
    queryConditions.responseRate = { $gte: criteria.minResponseRate };
  }
  
  if (criteria.excludeUsedInLast !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.excludeUsedInLast);
    queryConditions.$or = [
      { lastUsed: { $lt: cutoffDate } },
      { lastUsed: null }
    ];
  }
  
  let findQuery = this.find(queryConditions);
  
  if (criteria.page !== undefined && criteria.limit !== undefined) {
    const skip = (criteria.page - 1) * criteria.limit;
    findQuery = findQuery.skip(skip).limit(criteria.limit);
  }
  
  return findQuery;
});

/**
 * Static method to update usage statistics for a prompt
 * @param promptId - ID of the prompt to update
 * @param usageData - Object containing usage update information
 * @returns Promise resolving to the updated prompt document
 */
promptSchema.static('updateUsageStats', async function(promptId: string, usageData: IPromptUsageUpdate): Promise<IPromptDocument> {
  const prompt = await this.findById(promptId);
  
  if (!prompt) {
    throw new Error(`Prompt with ID ${promptId} not found`);
  }
  
  // Update usage count
  if (usageData.used) {
    prompt.usageCount += 1;
    prompt.lastUsed = new Date();
  }
  
  // Update response rate
  if (usageData.used) {
    // Calculate new response rate based on historical data
    const totalResponses = prompt.usageCount > 0 ? prompt.responseRate * prompt.usageCount : 0;
    const newTotalResponses = usageData.receivedResponse ? totalResponses + 1 : totalResponses;
    prompt.responseRate = prompt.usageCount > 0 ? newTotalResponses / prompt.usageCount : 0;
  }
  
  return prompt.save();
});

/**
 * Mongoose model for prompts
 */
export const Prompt = model<IPromptDocument, IPromptModel>('Prompt', promptSchema);