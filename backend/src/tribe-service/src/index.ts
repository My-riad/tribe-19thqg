/**
 * Main entry point for the Tribe Service microservice.
 *
 * This service handles tribe creation, membership management, tribe chat, and activity tracking.
 * It initializes the Express application, configures middleware, sets up routes, and starts the HTTP server.
 */

import express, { Express, Request, Response } from 'express'; // Web framework for creating the HTTP server and API routes // ^4.18.2
import cors from 'cors'; // Middleware to enable CORS (Cross-Origin Resource Sharing) // ^2.8.5
import helmet from 'helmet'; // Middleware to set security-related HTTP headers // ^6.0.1
import compression from 'compression'; // Middleware to compress HTTP responses // ^1.7.4
import bodyParser from 'body-parser'; // Middleware to parse HTTP request bodies // ^1.20.1
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io'; // Import Socket.IO Server
import { config } from './config'; // Import service configuration including environment variables and database connections
import { logger } from '../../shared/src/utils/logger.util'; // Import logger for application logging
import metrics from '../../config/metrics'; // Import metrics configuration for monitoring and observability
import {
  errorMiddleware,
  notFoundMiddleware,
  correlationIdMiddleware,
  requestLoggingMiddleware,
} from '../../shared/src/middlewares'; // Import shared middleware for error handling, logging, and request tracing
import {
  tribeRouter,
  memberController,
  chatRouter,
  activityRouter,
} from './controllers'; // Import controllers for tribe-related endpoints
import models from './models'; // Import data models for tribe-related entities

// Define global variables
let app: Express; // Express.Application instance
let server: HTTPServer; // HTTP.Server instance
let io: SocketIOServer; // Socket.IO Server instance
let serviceMetrics: any; // Object containing service-specific metrics

/**
 * Initializes the Express application with middleware and routes.
 *
 * @returns Configured Express application
 */
function initializeApp(): Express {
  // LD1: Create new Express application
  const expressApp: Express = express();

  // LD1: Configure middleware (cors, helmet, compression, body-parser)
  expressApp.use(cors({ origin: config.env.CORS_ORIGIN }));
  expressApp.use(helmet());
  expressApp.use(compression());
  expressApp.use(bodyParser.json());

  // LD1: Set up correlation ID and request logging middleware
  expressApp.use(correlationIdMiddleware);
  expressApp.use(requestLoggingMiddleware);

  // LD1: Initialize metrics middleware
  expressApp.use(metrics.getMetricsMiddleware());

  // LD1: Set up API routes for tribes, members, chat, and activities
  setupRoutes(expressApp);

  // LD1: Configure error handling middleware
  expressApp.use(errorMiddleware);
  expressApp.use(notFoundMiddleware);

  // LD1: Return the configured Express application
  return expressApp;
}

/**
 * Configures all API routes for the tribe service.
 *
 * @param app - Express.Application instance
 */
function setupRoutes(app: Express): void {
  // LD1: Set up health check endpoint at /health
  app.get('/health', setupHealthCheck);

  // LD1: Mount tribe router at /api/tribes
  app.use('/api/tribes', tribeRouter);

  // LD1: Mount chat router at /api/tribes/:tribeId/chat
  app.use('/api/tribes/:tribeId/chat', chatRouter);

  // LD1: Mount activity router at /api/tribes/:tribeId/activities
  app.use('/api/tribes/:tribeId/activities', activityRouter);

  // LD1: Set up 404 handler for undefined routes
  app.use(notFoundMiddleware);
}

/**
 * Starts the HTTP server on the configured port.
 *
 * @param app - Express.Application instance
 * @returns Promise resolving to the HTTP server instance
 */
async function startServer(app: Express): Promise<HTTPServer> {
  // LD1: Get port from environment configuration
  const port = config.env.PORT;

  // LD1: Create HTTP server with the Express app
  server = app.listen(port, () => {
    // LD1: Log successful server start
    logger.info(`Server is running at http://localhost:${port}`);
  });

  // LD1: Set up server error handling
  server.on('error', (error: Error) => {
    logger.error('Server error', error);
  });

  // LD1: Return promise resolving to the server instance
  return server;
}

/**
 * Handles graceful shutdown of the server and resources.
 */
async function gracefulShutdown(): Promise<void> {
  // LD1: Log shutdown initiation
  logger.info('Initiating graceful shutdown');

  try {
    // LD1: Close HTTP server connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // LD1: Disconnect from database
    await config.database.disconnectDatabase();

    // LD1: Shut down configuration resources
    await config.shutdownConfig();

    // LD1: Log successful shutdown
    logger.info('Shutdown complete');

    // LD1: Exit process with success code
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
}

/**
 * Sets up the health check endpoint for the service.
 *
 * @param app - Express.Application instance
 */
function setupHealthCheck(req: Request, res: Response): void {
  // LD1: Create route handler for GET /health
  const healthStatus = {
    status: 'ok',
    uptime: process.uptime(),
    version: '1.0.0',
  };

  // LD1: Return health status with uptime and version information
  res.status(200).json(healthStatus);

  // LD1: Log health check requests at debug level
  logger.debug('Health check requested', {
    path: req.originalUrl || req.url,
    ip: req.ip,
  });
}

/**
 * Main function that initializes and starts the service.
 */
async function main(): Promise<void> {
  try {
    // LD1: Initialize configuration
    await config.initializeConfig();

    // LD1: Connect to database
    await config.database.connectDatabase();

    // LD1: Initialize models
    // const tribeModel = new models.TribeModel(config.database.prisma);
    // const memberModel = new models.MemberModel(config.database.prisma);
    // const chatModel = new models.ChatModel(config.database.prisma);
    // const activityModel = new models.ActivityModel(config.database.prisma);

    // LD1: Initialize Express application
    app = initializeApp();

    // LD1: Start HTTP server
    server = await startServer(app);

    // LD1: Set up signal handlers for graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // LD1: Log successful service startup
    logger.info('Service started successfully');
  } catch (error) {
    logger.error('Service failed to start', error);
    process.exit(1);
  }
}

// Execute main function to start the service
main().catch((error) => {
  logger.error('Unhandled error during service startup', error);
});

// Handle any unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', error);
});