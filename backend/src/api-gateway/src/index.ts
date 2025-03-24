/**
 * API Gateway Entry Point
 * 
 * This is the main entry point for the API Gateway service. It initializes the Express application,
 * configures middleware and routes, and starts the HTTP server. It also provides graceful shutdown
 * handling for clean process termination.
 */

import * as express from 'express';
import * as http from 'http';
import * as process from 'process';

// Import configuration and utilities
import config, { env, initializeApiGatewayConfig, shutdownApiGatewayConfig } from './config';
import { logger } from '../../shared/src/utils/logger.util';
import { setupRoutes } from './routes';

/**
 * Initializes and starts the API Gateway HTTP server
 * 
 * @returns Promise that resolves to the HTTP server instance
 */
async function startServer(): Promise<http.Server> {
  try {
    // Initialize API Gateway configuration
    await initializeApiGatewayConfig();
    
    // Create Express application
    const app = express();
    
    // Configure routes and middleware
    setupRoutes(app);
    
    // Determine server port
    const port = parseInt(env.PORT || '3000', 10);
    
    // Create and start HTTP server
    const server = http.createServer(app);
    
    // Start listening on the configured port
    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        logger.info(`API Gateway listening on port ${port}`, {
          port,
          environment: env.NODE_ENV,
          version: process.env.npm_package_version || 'unknown'
        });
        resolve();
      });
    });
    
    // Handle server error events
    server.on('error', handleServerError);
    
    return server;
  } catch (error) {
    logger.error('Failed to start API Gateway server', error as Error, {
      service: 'api-gateway'
    });
    throw error;
  }
}

/**
 * Gracefully shuts down the API Gateway server
 * 
 * @param server - The HTTP server instance to shut down
 * @returns Promise that resolves when shutdown is complete
 */
async function shutdownServer(server: http.Server): Promise<void> {
  logger.info('Shutting down API Gateway server...');
  
  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Clean up API Gateway configuration
    await shutdownApiGatewayConfig();
    
    logger.info('API Gateway server shutdown completed successfully');
  } catch (error) {
    logger.error('Error during API Gateway server shutdown', error as Error);
    // We don't re-throw the error here to ensure shutdown continues
  }
}

/**
 * Sets up process event handlers for graceful shutdown
 * 
 * @param server - The HTTP server instance
 */
function setupGracefulShutdown(server: http.Server): void {
  // Handle SIGTERM signal (e.g., Kubernetes termination)
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received');
    await shutdownServer(server);
    process.exit(0);
  });
  
  // Handle SIGINT signal (e.g., Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received');
    await shutdownServer(server);
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception', error);
    await shutdownServer(server);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason) => {
    logger.error('Unhandled promise rejection', reason as Error);
    await shutdownServer(server);
    process.exit(1);
  });
}

/**
 * Handles server startup errors
 * 
 * @param error - The error object
 */
function handleServerError(error: Error): void {
  const errorCode = (error as any).code;
  logger.error('Server error', error, {
    errorCode
  });
  
  // Handle specific error types
  if (errorCode === 'EADDRINUSE') {
    logger.error('Port is already in use');
  } else if (errorCode === 'EACCES') {
    logger.error('Insufficient permissions to bind to port');
  }
  
  // Exit process with error code
  process.exit(1);
}

// Start the server and set up graceful shutdown
startServer()
  .then((server) => {
    setupGracefulShutdown(server);
    logger.info('API Gateway initialized successfully');
  })
  .catch((error) => {
    handleServerError(error);
  });