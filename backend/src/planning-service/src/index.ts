import express from 'express'; // version: ^4.18.2
import helmet from 'helmet'; // version: ^7.0.0
import cors from 'cors'; // version: ^2.8.5
import compression from 'compression'; // version: ^1.7.4
import rateLimit from 'express-rate-limit'; // version: ^6.7.0
import { Server } from 'http'; // core nodejs module
import { AddressInfo } from 'net'; // core nodejs module

import config from './config';
import {
  availabilityRouter,
  PlanningController,
  SchedulingController,
  VenueController,
  setupVenueRoutes
} from './controllers';
import { errorMiddleware, notFoundMiddleware } from '../../shared/src/middlewares/error.middleware';
import {
  correlationIdMiddleware,
  requestLoggingMiddleware,
  httpLoggerMiddleware
} from '../../shared/src/middlewares/logging.middleware';
import { logger } from '../../shared/src/utils/logger.util';

/**
 * Configures and applies middleware to the Express application
 * @param app - Express Application instance
 */
function setupMiddleware(app: express.Application): void {
  // LD1: Apply helmet middleware for security headers
  app.use(helmet());

  // LD1: Configure and apply CORS middleware
  const corsOptions = {
    origin: config.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));

  // LD1: Apply compression middleware
  app.use(compression());

  // LD1: Configure JSON body parser with size limits
  app.use(express.json({ limit: '1mb' }));

  // LD1: Apply correlation ID middleware for request tracing
  app.use(correlationIdMiddleware);

  // LD1: Apply request logging middleware
  app.use(requestLoggingMiddleware);

  // LD1: Apply HTTP logger middleware
  app.use(httpLoggerMiddleware());

  // LD1: Configure and apply rate limiting middleware
  const limiter = rateLimit({
    windowMs: config.env.API_RATE_LIMIT_WINDOW_MS || 60000, // 1 minute
    max: config.env.API_RATE_LIMIT || 100, // 100 requests per minute
    message: 'Rate limit exceeded. Please try again later.',
    headers: true,
  });
  app.use(limiter);

  // LD1: Apply metrics middleware for collecting performance metrics
  app.use(config.metrics.createExpressMiddleware(config.metrics.serviceMetrics));
}

/**
 * Configures API routes for the planning service
 * @param app - Express Application instance
 */
function setupRoutes(app: express.Application): void {
  // LD1: Set up health check endpoint at /health
  app.get('/health', (req, res) => res.status(200).send('OK'));

  // LD1: Set up metrics endpoint at /metrics
  app.get('/metrics', config.metrics.getMetricsMiddleware());

  // LD1: Create planning router for /api/v1/planning routes
  const planningRouter = express.Router();

  // LD1: Create scheduling router for /api/v1/scheduling routes
  const schedulingRouter = express.Router();

  // LD1: Mount availability router at /api/v1/availability
  app.use('/api/v1/availability', availabilityRouter);

  // LD1: Initialize PlanningController and register its routes
  const planningController = new PlanningController();
  planningRouter.post('/planning', planningController.createPlanningSession);
  planningRouter.get('/planning/:id', planningController.getPlanningSessionById);
  planningRouter.get('/planning/event/:eventId', planningController.getPlanningSessionByEventId);
  planningRouter.put('/planning/:id', planningController.updatePlanningSession);
  planningRouter.delete('/planning/:id', planningController.cancelPlanningSession);

  // LD1: Initialize SchedulingController and register its routes
  const schedulingController = new SchedulingController();
  schedulingRouter.get('/scheduling/optimal-times', schedulingController.findOptimalMeetingTimes);

  // LD1: Initialize VenueController and register its routes using setupVenueRoutes
  const venueController = new VenueController();
  setupVenueRoutes(app);

  // LD1: Apply the routers to the app
  app.use('/api/v1', planningRouter);
  app.use('/api/v1', schedulingRouter);

  // LD1: Apply notFoundMiddleware for handling 404 errors
  app.use(notFoundMiddleware);

  // LD1: Apply errorMiddleware for centralized error handling
  app.use(errorMiddleware);
}

/**
 * Initializes the server and starts listening for requests
 */
async function startServer(): Promise<void> {
  try {
    // LD1: Initialize configuration using initializeConfig
    await config.initializeConfig();

    // LD1: Connect to the database using database.connectDatabase
    await config.database.connectDatabase();

    // LD1: Create Express application
    const app = express();

    // LD1: Set up middleware using setupMiddleware
    setupMiddleware(app);

    // LD1: Set up routes using setupRoutes
    setupRoutes(app);

    // LD1: Get port from environment variables or use default (3000)
    const port = config.env.PORT || 3000;

    // LD1: Start HTTP server listening on the configured port
    const server = app.listen(port, () => {
      // LD1: Log successful server start with port information
      logger.info(`Server is running at http://localhost:${port}`);
    });

    // LD1: Set up process signal handlers for graceful shutdown
    handleProcessSignals(server);
  } catch (error) {
    // LD1: Catch and log any unhandled errors during startup
    logger.error('Error during server startup', error as Error);
  }
}

/**
 * Gracefully shuts down the server and cleans up resources
 * @param server - HTTP Server instance
 */
async function shutdownServer(server: Server): Promise<void> {
  try {
    // LD1: Log server shutdown initiation
    logger.info('Initiating server shutdown...');

    // LD1: Close HTTP server connections
    server.close((err) => {
      if (err) {
        logger.error('Error closing server connections', err);
        process.exitCode = 1;
      }
      logger.info('HTTP server connections closed.');
    });

    // LD1: Disconnect from database using database.disconnectDatabase
    await config.database.disconnectDatabase();

    // LD1: Clean up configuration resources using shutdownConfig
    await config.shutdownConfig();

    // LD1: Log successful server shutdown
    logger.info('Server shutdown completed successfully.');
  } catch (error) {
    logger.error('Error during server shutdown', error as Error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

/**
 * Sets up handlers for process signals to enable graceful shutdown
 * @param server - HTTP Server instance
 */
function handleProcessSignals(server: Server): void {
  // LD1: Set up handler for SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal.');
    shutdownServer(server);
  });

  // LD1: Set up handler for SIGINT signal
  process.on('SIGINT', () => {
    logger.info('Received SIGINT signal.');
    shutdownServer(server);
  });
}

/**
 * Main function that starts the application
 */
async function main(): Promise<void> {
  try {
    // LD1: Call startServer to initialize and start the server
    await startServer();
  } catch (error) {
    // LD1: Catch and log any unhandled errors during startup
    logger.error('Unhandled error during startup', error as Error);
  }
}

// Start the application
main();