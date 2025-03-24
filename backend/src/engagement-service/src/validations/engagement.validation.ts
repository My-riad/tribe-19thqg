import Joi from 'joi'; // v17.9.2
import { idSchema, paginationSchema, timeRangeSchema } from '../../../shared/src/validation/common.validation';
import { EngagementType, EngagementStatus, EngagementTrigger } from '../models/engagement.model';
import { validateBody, validateParams, validateQuery } from '../../../shared/src/middlewares/validation.middleware';

// Constants for content length constraints
const ENGAGEMENT_CONTENT_MIN_LENGTH = 10;
const ENGAGEMENT_CONTENT_MAX_LENGTH = 2000;
const RESPONSE_CONTENT_MIN_LENGTH = 1;
const RESPONSE_CONTENT_MAX_LENGTH = 1000;

// Create Engagement Schema
export const createEngagementSchema = Joi.object({
  tribeId: idSchema,
  type: Joi.string().valid(...Object.values(EngagementType)).required(),
  content: Joi.string().min(ENGAGEMENT_CONTENT_MIN_LENGTH).max(ENGAGEMENT_CONTENT_MAX_LENGTH).required(),
  status: Joi.string().valid(...Object.values(EngagementStatus)).default(EngagementStatus.PENDING),
  trigger: Joi.string().valid(...Object.values(EngagementTrigger)).required(),
  createdBy: idSchema,
  expiresAt: Joi.date().iso().greater('now').required(),
  aiGenerated: Joi.boolean().default(false),
  metadata: Joi.object().optional()
});

// Update Engagement Schema
export const updateEngagementSchema = Joi.object({
  content: Joi.string().min(ENGAGEMENT_CONTENT_MIN_LENGTH).max(ENGAGEMENT_CONTENT_MAX_LENGTH).optional(),
  status: Joi.string().valid(...Object.values(EngagementStatus)).optional(),
  expiresAt: Joi.date().iso().greater('now').optional(),
  metadata: Joi.object().optional()
});

// Get Engagement Schema
export const getEngagementSchema = Joi.object({
  id: idSchema
});

// List Engagements Schema
export const listEngagementsSchema = Joi.object({
  tribeId: idSchema.optional(),
  type: Joi.string().valid(...Object.values(EngagementType)).optional(),
  status: Joi.string().valid(...Object.values(EngagementStatus)).optional(),
  trigger: Joi.string().valid(...Object.values(EngagementTrigger)).optional(),
  createdBy: idSchema.optional(),
  aiGenerated: Joi.boolean().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
  ...paginationSchema
});

// Respond to Engagement Schema
export const respondToEngagementSchema = Joi.object({
  userId: idSchema,
  content: Joi.string().min(RESPONSE_CONTENT_MIN_LENGTH).max(RESPONSE_CONTENT_MAX_LENGTH).required(),
  responseType: Joi.string().required(),
  metadata: Joi.object().optional()
});

// Generate Engagement Schema
export const generateEngagementSchema = Joi.object({
  tribeId: idSchema,
  type: Joi.string().valid(...Object.values(EngagementType)).required(),
  trigger: Joi.string().valid(...Object.values(EngagementTrigger)).required()
});

// Get Engagement Metrics Schema
export const getEngagementMetricsSchema = Joi.object({
  tribeId: idSchema,
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional()
});

// Validation middleware functions
export const validateCreateEngagement = validateBody(createEngagementSchema);
export const validateUpdateEngagement = validateBody(updateEngagementSchema);
export const validateGetEngagement = validateParams(getEngagementSchema);
export const validateListEngagements = validateQuery(listEngagementsSchema);
export const validateRespondToEngagement = validateBody(respondToEngagementSchema);
export const validateGenerateEngagement = validateBody(generateEngagementSchema);
export const validateGetEngagementMetrics = validateParams({ tribeId: idSchema }).append(validateQuery(timeRangeSchema));