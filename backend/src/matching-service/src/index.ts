import express from 'express'; // ^4.18.2
import cors from 'cors'; // ^2.8.5
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import * as Bull from 'bull'; // ^4.10.4
import { PrismaClient } from '@prisma/client'; // ^4.16.0
import {
  CompatibilityController,
  MatchingController,
  SuggestionController
} from './controllers';
import {
  CompatibilityService,
  MatchingService,
  SuggestionService
} from './services';
import {
  CompatibilityAlgorithm,
  TribeFormationAlgorithm,
  ClusteringAlgorithm
} from './algorithms';
import {
  errorMiddleware,
  notFoundMiddleware,
  correlationIdMiddleware,
  requestLoggingMiddleware
} from '../../shared/src/middlewares';
import { logger } from '../../shared/src/utils/logger.util';
import config from './config';

// Define global variables
declare global {
  // eslint-disable-next-line no-var
  var app: express.Application;
  // eslint-disable-next-line no-var
  var server: any;
  // eslint-disable-next-line no-var
  var matchingQueue: Bull.Queue;
}

/**
 * Configures Express middleware for the application
 * @param app Express application instance
 */
function setupMiddleware(app: express.Application): void {
  // Apply helmet middleware for security headers
  app.use(helmet());

  // Apply CORS middleware with appropriate configuration
  app.use(cors({
    origin: config.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
  }));

  // Apply compression middleware for response compression
  app.use(compression());

  // Apply JSON body parser middleware
  app.use(express.json());

  // Apply URL-encoded body parser middleware
  app.use(express.urlencoded({ extended: true }));

  // Apply correlation ID middleware for request tracing
  app.use(correlationIdMiddleware);

  // Apply request logging middleware
  app.use(requestLoggingMiddleware);
}

/**
 * Sets up API routes for the matching service
 * @param app Express application instance
 */
function setupRoutes(app: express.Application): void {
  // Create instances of required services
  const prisma = new PrismaClient();
  const redisClient = new Redis();

  const compatibilityService = new CompatibilityService(prisma, redisClient);
  const matchingService = new MatchingService(prisma, redisClient);
  const suggestionService = new SuggestionService(prisma, compatibilityService, matchingService, redisClient);

  // Create instances of required algorithms
  const compatibilityAlgorithm = new CompatibilityAlgorithm();
  const clusteringAlgorithm = new ClusteringAlgorithm(compatibilityAlgorithm);
  const tribeFormationAlgorithm = new TribeFormationAlgorithm(clusteringAlgorithm, compatibilityAlgorithm);

  // Inject dependencies into services
  matchingService.setTribeFormationAlgorithm(tribeFormationAlgorithm);

  // Create controller instances with service dependencies
  const compatibilityController = new CompatibilityController(prisma, redisClient);
  const matchingController = new MatchingController(prisma, redisClient);
  const suggestionController = new SuggestionController(suggestionService);

  // Set up health check route at /health
  app.get('/health', (req, res) => {
    res.status(200).send('Matching service is healthy');
  });

  // Set up metrics endpoint at /metrics
  app.use(config.metrics.getMetricsMiddleware());

  // Mount compatibility routes at /api/compatibility
  app.use('/api/compatibility', compatibilityController.getRouter());

  // Mount matching routes at /api/matching
  app.use('/api/matching', matchingController.getRouter());

  // Mount suggestion routes at /api/suggestions
  // app.use('/api/suggestions', suggestionController.getRouter());

  // Apply not found middleware for unmatched routes
  app.use(notFoundMiddleware);

  // Apply error handling middleware
  app.use(errorMiddleware);
}

/**
 * Sets up the Bull queue for processing matching jobs
 * @returns Configured Bull queue instance
 */
function setupQueue(): Bull.Queue {
  // Create a new Bull queue for matching jobs
  const matchingQueue = new Bull('matchingQueue', {
    redis: {
      host: 'localhost', // Replace with your Redis host
      port: 6379,       // Replace with your Redis port
    },
    defaultJobOptions: {
      attempts: 3,        // Number of attempts to retry a failed job
      backoff: { type: 'exponential', delay: 1000 }, // Exponential backoff strategy
      removeOnComplete: true, // Remove jobs on completion
      removeOnFail: 100,     // Keep up to 100 failed jobs
    },
  });

  // Configure queue settings (concurrency, rate limiting)
  matchingQueue.process(async (job: Bull.Job) => {
    // Process the matching job
    logger.info(`Processing job ${job.id} of type ${job.name}`);
    // Add your matching logic here
  });

  // Set up queue event handlers (completed, failed)
  matchingQueue.on('completed', (job: Bull.Job, result: any) => {
    logger.info(`Job ${job.id} completed successfully`, { result });
  });

  matchingQueue.on('failed', (job: Bull.Job, error: Error) => {
    logger.error(`Job ${job.id} failed`, error);
  });

  // Register job processors for different job types
  // Add your job processors here

  return matchingQueue;
}

/**
 * Initializes and starts the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize configuration
    await config.initializeConfig();

    // Create Express application instance
    global.app = express();

    // Set up middleware
    setupMiddleware(app);

    // Set up routes
    setupRoutes(app);

    // Set up job queue
    global.matchingQueue = setupQueue();

    // Start HTTP server on configured port
    const port = config.env.PORT || 3000;
    global.server = app.listen(port, () => {
      logger.info(`Matching service started on port ${port}`);
    });

    // Set up graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Startup error', error as Error);
    process.exit(1);
  }
}

/**
 * Handles graceful shutdown of the server and resources
 * @param signal Signal type
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Initiating graceful shutdown due to ${signal}`);

  try {
    // Close HTTP server to stop accepting new connections
    server.close(async (err: Error) => {
      if (err) {
        logger.error('Error closing server', err);
      }

      // Close database connections
      await config.shutdownConfig();

      // Close Bull queue connections
      await matchingQueue.close();

      logger.info('Shutdown complete');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown', error as Error);
    process.exit(1);
  }
}

// Main execution flow
(async () => {
  try {
    await startServer();
  } catch (error) {
    logger.error('Error during startup', error as Error);
  }
})();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});