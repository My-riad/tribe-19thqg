import Joi from 'joi'; // ^17.9.2
import { idSchema, paginationSchema, timeRangeSchema } from '../../../shared/src/validation/common.validation';
import { ChallengeType, ChallengeStatus } from '../models/challenge.model';
import { validateBody, validateParams, validateQuery } from '../../../shared/src/middlewares/validation.middleware';

// Constants for validation rules
const CHALLENGE_TITLE_MIN_LENGTH = 5;
const CHALLENGE_TITLE_MAX_LENGTH = 100;
const CHALLENGE_DESCRIPTION_MIN_LENGTH = 10;
const CHALLENGE_DESCRIPTION_MAX_LENGTH = 1000;
const EVIDENCE_MAX_LENGTH = 500;

// Schema for creating a new challenge
export const createChallengeSchema = Joi.object({
  tribeId: idSchema,
  title: Joi.string().min(CHALLENGE_TITLE_MIN_LENGTH).max(CHALLENGE_TITLE_MAX_LENGTH).required(),
  description: Joi.string().min(CHALLENGE_DESCRIPTION_MIN_LENGTH).max(CHALLENGE_DESCRIPTION_MAX_LENGTH).required(),
  type: Joi.string().valid(...Object.values(ChallengeType)).required(),
  status: Joi.string().valid(...Object.values(ChallengeStatus)).default(ChallengeStatus.ACTIVE),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  createdBy: idSchema,
  pointValue: Joi.number().integer().min(1).max(100).default(10),
  aiGenerated: Joi.boolean().default(false),
  metadata: Joi.object().optional()
});

// Schema for updating an existing challenge
export const updateChallengeSchema = Joi.object({
  title: Joi.string().min(CHALLENGE_TITLE_MIN_LENGTH).max(CHALLENGE_TITLE_MAX_LENGTH).optional(),
  description: Joi.string().min(CHALLENGE_DESCRIPTION_MIN_LENGTH).max(CHALLENGE_DESCRIPTION_MAX_LENGTH).optional(),
  status: Joi.string().valid(...Object.values(ChallengeStatus)).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
  pointValue: Joi.number().integer().min(1).max(100).optional(),
  metadata: Joi.object().optional()
});

// Schema for retrieving a single challenge
export const getChallengeSchema = Joi.object({
  id: idSchema
});

// Schema for listing challenges with filters
export const listChallengesSchema = Joi.object({
  tribeId: idSchema.optional(),
  type: Joi.string().valid(...Object.values(ChallengeType)).optional(),
  status: Joi.string().valid(...Object.values(ChallengeStatus)).optional(),
  createdBy: idSchema.optional(),
  aiGenerated: Joi.boolean().optional(),
  participatedBy: idSchema.optional(),
  completedBy: idSchema.optional(),
  dateRange: timeRangeSchema.optional(),
  ...paginationSchema
});

// Schema for participating in a challenge
export const participateChallengeSchema = Joi.object({
  userId: idSchema
});

// Schema for completing a challenge
export const completeChallengeSchema = Joi.object({
  userId: idSchema,
  evidence: Joi.string().max(EVIDENCE_MAX_LENGTH).optional()
});

// Schema for generating an AI challenge
export const generateChallengeSchema = Joi.object({
  tribeId: idSchema,
  createdBy: idSchema,
  type: Joi.string().valid(...Object.values(ChallengeType)).required()
});

// Schema for retrieving challenge statistics
export const getChallengeStatsSchema = Joi.object({
  tribeId: idSchema
});

// Middleware for validating challenge creation requests
export const validateCreateChallenge = validateBody(createChallengeSchema);

// Middleware for validating challenge update requests
export const validateUpdateChallenge = validateBody(updateChallengeSchema);

// Middleware for validating single challenge retrieval requests
export const validateGetChallenge = validateParams(getChallengeSchema);

// Middleware for validating challenge listing requests
export const validateListChallenges = validateQuery(listChallengesSchema);

// Middleware for validating challenge participation requests
export const validateParticipateChallenge = validateBody(participateChallengeSchema);

// Middleware for validating challenge completion requests
export const validateCompleteChallenge = validateBody(completeChallengeSchema);

// Middleware for validating AI challenge generation requests
export const validateGenerateChallenge = validateBody(generateChallengeSchema);

// Middleware for validating challenge statistics retrieval requests
export const validateGetChallengeStats = validateParams(getChallengeStatsSchema);