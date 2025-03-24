import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { Schema, ValidationOptions } from 'joi'; // ^17.9.2
import { ValidationError } from '../errors/validation.error';
import { validateSchema } from '../utils/validation.util';
import { logger } from '../utils/logger.util';

/**
 * Creates middleware to validate request body against a Joi schema
 *
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Express middleware function that validates request body
 */
export const validateBody = (schema: Schema, options?: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Validating request body', { path: req.path });
    
    try {
      // Validate the request body against the schema
      const validatedData = validateSchema(req.body, schema, options);
      
      // Replace the request body with the validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      // Pass validation errors to the error handler
      next(error);
    }
  };
};

/**
 * Creates middleware to validate request query parameters against a Joi schema
 *
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Express middleware function that validates request query parameters
 */
export const validateQuery = (schema: Schema, options?: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Validating request query', { path: req.path });
    
    try {
      // Validate the request query against the schema
      const validatedData = validateSchema(req.query, schema, options);
      
      // Replace the request query with the validated data
      req.query = validatedData;
      
      next();
    } catch (error) {
      // Pass validation errors to the error handler
      next(error);
    }
  };
};

/**
 * Creates middleware to validate request route parameters against a Joi schema
 *
 * @param schema - The Joi schema to validate against
 * @param options - Optional Joi validation options
 * @returns Express middleware function that validates request route parameters
 */
export const validateParams = (schema: Schema, options?: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Validating request params', { path: req.path });
    
    try {
      // Validate the request params against the schema
      const validatedData = validateSchema(req.params, schema, options);
      
      // Replace the request params with the validated data
      req.params = validatedData;
      
      next();
    } catch (error) {
      // Pass validation errors to the error handler
      next(error);
    }
  };
};

/**
 * Creates middleware to validate multiple parts of a request (body, query, params) against Joi schemas
 *
 * @param schemas - Object containing schemas for body, query, and/or params
 * @param options - Optional Joi validation options
 * @returns Express middleware function that validates multiple request parts
 */
export const validateRequest = (
  schemas: {
    body?: Schema;
    query?: Schema;
    params?: Schema;
  },
  options?: ValidationOptions
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug('Validating multiple request parts', { path: req.path });
    
    // Create array of validation middleware based on provided schemas
    const validationMiddleware = [];
    
    if (schemas.body) {
      validationMiddleware.push(validateBody(schemas.body, options));
    }
    
    if (schemas.query) {
      validationMiddleware.push(validateQuery(schemas.query, options));
    }
    
    if (schemas.params) {
      validationMiddleware.push(validateParams(schemas.params, options));
    }
    
    // Execute each validation middleware in sequence
    const executeMiddleware = (index: number) => {
      if (index >= validationMiddleware.length) {
        return next();
      }
      
      validationMiddleware[index](req, res, (err) => {
        if (err) {
          return next(err);
        }
        executeMiddleware(index + 1);
      });
    };
    
    executeMiddleware(0);
  };
};