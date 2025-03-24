import Joi from 'joi'; // v17.9.2
import { 
  MemberRole, 
  MembershipStatus, 
  IMembershipCreate, 
  IMembershipUpdate 
} from '@shared/types';
import { TRIBE_LIMITS } from '@shared/constants/app.constants';
import { idSchema } from '@shared/validation/common.validation';
import { ValidationError } from '@shared/errors/validation.error';

/**
 * Schema for creating a new tribe membership
 * Note: The actual enforcement of membership limits (max 8 per tribe, max 3 tribes per user) 
 * is handled at the service layer where we have access to existing tribe/membership data
 */
export const createMembershipSchema = Joi.object({
  tribeId: idSchema.required().messages({
    'any.required': 'Tribe ID is required'
  }),
  userId: idSchema.required().messages({
    'any.required': 'User ID is required'
  }),
  role: Joi.string().valid(...Object.values(MemberRole)).default(MemberRole.MEMBER)
});

/**
 * Schema for updating an existing tribe membership
 */
export const updateMembershipSchema = Joi.object({
  role: Joi.string().valid(...Object.values(MemberRole)),
  status: Joi.string().valid(...Object.values(MembershipStatus))
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Schema for membership query parameters
 */
export const membershipQuerySchema = Joi.object({
  status: Joi.string().valid(...Object.values(MembershipStatus)),
  role: Joi.string().valid(...Object.values(MemberRole)),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * Validates data for creating a new tribe membership
 * 
 * @param membershipData - The membership data to validate
 * @returns The validated membership data with defaults applied
 * @throws ValidationError if validation fails
 */
export function validateCreateMembership(membershipData: Partial<IMembershipCreate>): Partial<IMembershipCreate> {
  const { error, value } = createMembershipSchema.validate(membershipData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates data for updating an existing tribe membership
 * 
 * @param updateData - The update data to validate
 * @returns The validated update data
 * @throws ValidationError if validation fails
 */
export function validateUpdateMembership(updateData: Partial<IMembershipUpdate>): Partial<IMembershipUpdate> {
  const { error, value } = updateMembershipSchema.validate(updateData, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates a membership ID
 * 
 * @param id - The ID to validate
 * @returns The validated ID
 * @throws ValidationError if validation fails
 */
export function validateMembershipId(id: string): string {
  const { error, value } = idSchema.validate(id, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}

/**
 * Validates query parameters for retrieving memberships
 * 
 * @param queryParams - The query parameters to validate
 * @returns The validated query parameters with defaults applied
 * @throws ValidationError if validation fails
 */
export function validateMembershipQuery(queryParams: any): any {
  const { error, value } = membershipQuerySchema.validate(queryParams, { abortEarly: false });
  if (error) {
    throw ValidationError.fromValidationErrors(error.details);
  }
  return value;
}