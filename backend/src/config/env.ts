import * as dotenv from 'dotenv'; // v16.0.3
import * as path from 'path'; // built-in
import { ValidationError } from '../shared/src/errors/validation.error';

/**
 * Enum of available environment types for type-safe environment checking
 */
export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Loads environment variables from the appropriate .env file based on NODE_ENV
 */
function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || EnvironmentType.DEVELOPMENT;
  const envFile = `.env.${nodeEnv}`;
  const envFilePath = path.resolve(process.cwd(), envFile);
  
  dotenv.config({ path: envFilePath });
  
  console.log(`Environment: ${nodeEnv}, Configuration: ${envFile}`);
}

/**
 * Retrieves an environment variable with type conversion and validation
 * 
 * @param name - The name of the environment variable
 * @param defaultValue - The default value to use if the variable is not set
 * @param required - Whether the variable is required
 * @returns The environment variable value with appropriate type conversion
 */
function getEnvVariable(name: string, defaultValue: any, required: boolean = false): any {
  const value = process.env[name];
  
  if (value === undefined) {
    if (required) {
      throw ValidationError.invalidInput(`Required environment variable "${name}" is missing`);
    }
    return defaultValue;
  }
  
  // Convert value to the appropriate type based on defaultValue
  if (typeof defaultValue === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      throw ValidationError.invalidInput(`Environment variable "${name}" must be a number`);
    }
    return num;
  } else if (typeof defaultValue === 'boolean') {
    return value.toLowerCase() === 'true';
  }
  
  return value;
}

/**
 * Validates that all required environment variables are present
 * 
 * @returns True if all required variables are present
 */
function validateRequiredEnvVariables(): boolean {
  const requiredVariables = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET'];
  const nodeEnv = process.env.NODE_ENV || EnvironmentType.DEVELOPMENT;
  
  // Add production-specific required variables
  if (nodeEnv === EnvironmentType.PRODUCTION) {
    requiredVariables.push(
      'JWT_EXPIRES_IN',
      'JWT_REFRESH_EXPIRES_IN',
      'MASTER_ENCRYPTION_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'OPENROUTER_API_KEY',
      'STRIPE_API_KEY',
      'GOOGLE_PLACES_API_KEY'
    );
  }
  
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      throw ValidationError.invalidInput(`Required environment variable "${variable}" is missing`);
    }
  }
  
  return true;
}

// Load environment variables from the appropriate .env file
loadEnvFile();

// Export the environment configuration
export default {
  // Server configuration
  NODE_ENV: getEnvVariable('NODE_ENV', EnvironmentType.DEVELOPMENT, true),
  PORT: getEnvVariable('PORT', 3000),
  
  // Database configuration
  DATABASE_URL: getEnvVariable('DATABASE_URL', '', true),
  
  // Authentication configuration
  JWT_SECRET: getEnvVariable('JWT_SECRET', '', true),
  JWT_EXPIRES_IN: getEnvVariable('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: getEnvVariable('JWT_REFRESH_EXPIRES_IN', '7d'),
  
  // External API keys
  OPENROUTER_API_KEY: getEnvVariable('OPENROUTER_API_KEY', ''),
  OPENROUTER_API_URL: getEnvVariable('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1'),
  STRIPE_API_KEY: getEnvVariable('STRIPE_API_KEY', ''),
  VENMO_API_KEY: getEnvVariable('VENMO_API_KEY', ''),
  GOOGLE_PLACES_API_KEY: getEnvVariable('GOOGLE_PLACES_API_KEY', ''),
  EVENTBRITE_API_KEY: getEnvVariable('EVENTBRITE_API_KEY', ''),
  MEETUP_API_KEY: getEnvVariable('MEETUP_API_KEY', ''),
  OPENWEATHERMAP_API_KEY: getEnvVariable('OPENWEATHERMAP_API_KEY', ''),
  FIREBASE_API_KEY: getEnvVariable('FIREBASE_API_KEY', ''),
  
  // Application configuration
  LOG_LEVEL: getEnvVariable('LOG_LEVEL', 'info'),
  CORS_ORIGIN: getEnvVariable('CORS_ORIGIN', '*'),
  API_RATE_LIMIT: getEnvVariable('API_RATE_LIMIT', 100),
  API_RATE_LIMIT_WINDOW_MS: getEnvVariable('API_RATE_LIMIT_WINDOW_MS', 60000),
  
  // Security configuration
  MASTER_ENCRYPTION_KEY: getEnvVariable('MASTER_ENCRYPTION_KEY', ''),
  DATABASE_ENCRYPTION_KEY: getEnvVariable('DATABASE_ENCRYPTION_KEY', ''),
  
  // AWS configuration
  AWS_REGION: getEnvVariable('AWS_REGION', 'us-east-1'),
  AWS_ACCESS_KEY_ID: getEnvVariable('AWS_ACCESS_KEY_ID', ''),
  AWS_SECRET_ACCESS_KEY: getEnvVariable('AWS_SECRET_ACCESS_KEY', ''),
  S3_BUCKET_NAME: getEnvVariable('S3_BUCKET_NAME', ''),
  
  // Feature-specific configuration
  EVENT_CACHE_TTL: getEnvVariable('EVENT_CACHE_TTL', 900),
  MATCHING_BATCH_SIZE: getEnvVariable('MATCHING_BATCH_SIZE', 100),
  AI_MODEL_TIMEOUT: getEnvVariable('AI_MODEL_TIMEOUT', 10000),
  AI_MAX_RETRIES: getEnvVariable('AI_MAX_RETRIES', 3),
  AI_RETRY_DELAY: getEnvVariable('AI_RETRY_DELAY', 1000),
  
  // Export the validation function for use in other modules
  validateRequiredEnvVariables,
};