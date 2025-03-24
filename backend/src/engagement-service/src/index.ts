import express from 'express'; //  ^4.18.2
import cors from 'cors'; //  ^2.8.5
import helmet from 'helmet'; //  ^6.0.1
import compression from 'compression'; //  ^1.7.4
import http from 'http'; //  ^0.0.1-security
import { config } from './config';
import { logger } from '../../shared/src/utils/logger.util';
import { 
  errorMiddleware, 
  notFoundMiddleware, 
  correlationIdMiddleware, 
  requestLoggingMiddleware 
} from '../../shared/src/middlewares';
import { 
  challengeController, 
  engagementController, 
  promptController 
} from './controllers';

/**
 * Initializes and starts the Engagement Service HTTP server
 * 
 * @returns Promise that resolves to the HTTP server instance
 */
async function startServer(): Promise<http.Server> {
  // LD1: Initialize engagement service configuration using initializeEngagementConfig
  await config.initializeEngagementConfig();

  // LD1: Create Express application instance
  const app = express();

  // LD1: Configure middleware (helmet, cors, compression, JSON parsing)
  app.use(helmet());
  app.use(cors({ origin: config.env.CORS_ORIGIN }));
  app.use(compression());
  app.use(express.json());

  // LD1: Add correlation ID and request logging middleware
  app.use(correlationIdMiddleware);
  app.use(requestLoggingMiddleware);

  // LD1: Set up API routes for challenges, engagements, and prompts
  setupRoutes(app);

  // LD1: Add not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // LD1: Add error handling middleware
  app.use(errorMiddleware);

  // LD1: Determine port from environment configuration
  const port = config.env.PORT || 3000;

  // LD1: Create and start HTTP server on the configured port
  const server = app.listen(port, () => {
    logger.info(`Engagement Service started on port ${port}`);
  });

  // LD1: Set up server error handling
  server.on('error', handleServerError);

  // LD1: Return the HTTP server instance
  return server;
}

/**
 * Configures all routes for the Engagement Service
 * 
 * @param app - Express Application
 */
function setupRoutes(app: express.Application): void {
  // LD1: Set up health check endpoint at /health
  app.get('/health', (req, res) => {
    res.status(200).send('Engagement Service is healthy');
  });

  // LD1: Set up metrics endpoint at /metrics
  app.get('/metrics', (req, res) => {
    res.status(200).send('Metrics endpoint');
  });

  // LD1: Set up API version prefix for all routes
  const apiRouter = express.Router();
  app.use('/api/v1', apiRouter);

  // LD1: Mount challenge routes at /api/v1/challenges
  apiRouter.use('/challenges', challengeController);

  // LD1: Mount engagement routes at /api/v1/engagements
  apiRouter.use('/engagements', engagementController);

  // LD1: Mount prompt routes at /api/v1/prompts
  apiRouter.use('/prompts', promptController);

  // LD1: Log successful routes configuration
  logger.info('Engagement Service routes configured successfully');
}

/**
 * Gracefully shuts down the Engagement Service server
 * 
 * @param server - HTTP server instance
 */
async function shutdownServer(server: http.Server): Promise<void> {
  // LD1: Log shutdown initiation
  logger.info('Initiating graceful shutdown of Engagement Service');

  // LD1: Close HTTP server connections
  server.close(() => {
    // LD1: Perform any necessary cleanup for engagement service resources
    // (e.g., disconnect from database, close connections)
    logger.info('HTTP server closed successfully');

    // LD1: Log successful shutdown completion
    logger.info('Engagement Service shutdown completed');
  });
}

/**
 * Sets up process event handlers for graceful shutdown
 * 
 * @param server - HTTP server instance
 */
function setupGracefulShutdown(server: http.Server): void {
  // LD1: Set up handler for SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal');
    shutdownServer(server);
  });

  // LD1: Set up handler for SIGINT signal
  process.on('SIGINT', () => {
    logger.info('Received SIGINT signal');
    shutdownServer(server);
  });

  // LD1: Set up handler for uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdownServer(server);
  });

  // LD1: Set up handler for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { reason, promise });
    shutdownServer(server);
  });
}

/**
 * Handles server startup errors
 * 
 * @param error - Error object
 */
function handleServerError(error: Error): void {
  // LD1: Log the server error with details
  logger.error('Server error', error);

  // LD1: Exit process with error code
  process.exit(1);
}

// LD1: Validate engagement service configuration using validateEngagementConfig
config.validateEngagementConfig();

// LD1: Call startServer function to initialize and start the server
startServer()
  .then(server => {
    // LD1: Set up graceful shutdown handlers with setupGracefulShutdown
    setupGracefulShutdown(server);

    // LD1: Log successful Engagement Service initialization
    logger.info('Engagement Service initialized successfully');
  })
  // LD1: Handle any startup errors with handleServerError
  .catch(handleServerError);