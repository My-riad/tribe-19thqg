/**
 * Database Configuration Module
 * 
 * This module configures and manages the database connection for the Tribe platform
 * using Prisma ORM. It provides a configured Prisma client instance and functions
 * for managing the database connection lifecycle.
 * 
 * The module implements:
 * - Environment-specific logging configuration
 * - Connection management with proper error handling
 * - Graceful connection termination
 * - Connection pooling and optimization
 */

import { PrismaClient } from '@prisma/client'; // ^4.16.0
import env from './env';
import { logger } from '../shared/src/utils/logger.util';

/**
 * Configures the Prisma client with appropriate options based on environment
 * 
 * @returns Configured Prisma client instance
 */
const configurePrisma = (): PrismaClient => {
  // Configure logging based on environment
  const logSettings = [];
  
  // Add development-specific logging
  if (env.NODE_ENV === 'development') {
    logSettings.push({ level: 'query', emit: 'stdout' });
    logSettings.push({ level: 'info', emit: 'stdout' });
  }
  
  // Always log errors and warnings
  logSettings.push({ level: 'error', emit: 'stdout' });
  logSettings.push({ level: 'warn', emit: 'stdout' });
  
  // Note: Connection pool settings are configured in the Prisma schema
  // or through connection URL parameters. Transaction timeout and other
  // engine options are managed through Prisma's connection configuration.
  
  // Create and return Prisma client with configuration
  return new PrismaClient({
    log: logSettings
  });
};

// Create singleton Prisma client instance
const prisma = configurePrisma();

/**
 * Establishes a connection to the PostgreSQL database using Prisma
 * 
 * @returns Promise that resolves when the database connection is established
 */
const connectDatabase = async (): Promise<void> => {
  try {
    logger.info('Connecting to database...');
    
    // Attempt to connect to the database
    await prisma.$connect();
    
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database', error as Error, {
      // Include additional context for troubleshooting
      service: 'database',
      action: 'connect'
    });
    
    // Re-throw error to allow application to handle it appropriately
    throw error;
  }
};

/**
 * Gracefully closes the database connection
 * 
 * @returns Promise that resolves when the database connection is closed
 */
const disconnectDatabase = async (): Promise<void> => {
  try {
    logger.info('Disconnecting from database...');
    
    // Attempt to disconnect from the database
    await prisma.$disconnect();
    
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error during database disconnection', error as Error, {
      service: 'database',
      action: 'disconnect'
    });
    
    // Don't throw error during disconnection to prevent application crash during shutdown
  }
};

// Export the Prisma client instance and connection management functions
export default {
  prisma,
  connectDatabase,
  disconnectDatabase
};