import express from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0
import cors from 'cors'; // ^2.8.5
import compression from 'compression'; // ^1.7.4
import rateLimit from 'express-rate-limit'; // ^6.7.0
import { collectDefaultMetrics, Registry } from 'prom-client'; // ^14.2.0
import * as http from 'http';
import config from './config';
import * as eventController from './controllers';
import { EventService, DiscoveryService, RecommendationService } from './services';
import { EventbriteIntegration, GooglePlacesIntegration, MeetupIntegration, OpenWeatherMapIntegration } from './integrations';
import { errorMiddleware, notFoundMiddleware } from '../../shared/src/middlewares/error.middleware';
import { correlationIdMiddleware, requestLoggingMiddleware, httpLoggerMiddleware } from '../../shared/src/middlewares/logging.middleware';
import { validateBody, validateQuery, validateParams } from '../../shared/src/middlewares/validation.middleware';
import { logger } from '../../shared/src/utils/logger.util';

// Declare global variables
declare global {
  var eventService: EventService;
  var discoveryService: DiscoveryService;
  var recommendationService: RecommendationService;
}

/**
 * Configures and applies middleware to the Express application
 * @param app - Express Application
 * @returns void - No return value
 */
function setupMiddleware(app: express.Application): void {
  // LD1: Apply helmet middleware for security headers
  app.use(helmet());

  // LD1: Configure and apply CORS middleware
  const corsOptions: cors.CorsOptions = {
    origin: config.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
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
  const apiRateLimit = rateLimit({
    windowMs: config.env.API_RATE_LIMIT_WINDOW_MS,
    max: config.env.API_RATE_LIMIT,
    message: 'Too many requests, please try again later.',
    headers: true,
  });
  app.use(apiRateLimit);
}

/**
 * Configures API routes for the event service
 * @param app - Express Application
 * @returns void - No return value
 */
function setupRoutes(app: express.Application): void {
  // LD1: Set up health check endpoint at /health
  app.get('/health', (req, res) => {
    res.status(200).send('Event Service is healthy');
  });

  // LD1: Set up metrics endpoint at /metrics
  app.get('/metrics', config.metrics.getMetricsMiddleware());

  // LD1: Create event router for /api/v1/events routes
  const eventRouter = express.Router();

  // LD1: Configure event CRUD endpoints with appropriate controllers and validation
  eventRouter.get('/:eventId', eventController.getEventById);
  eventRouter.get('/tribe/:tribeId', eventController.getEventsByTribeId);
  eventRouter.get('/user/:userId', eventController.getEventsByUserId);
  eventRouter.get('/search', eventController.searchEvents);
  eventRouter.post('/', eventController.createEvent);
  eventRouter.put('/:eventId', eventController.updateEvent);
  eventRouter.patch('/:eventId/status', eventController.updateEventStatus);
  eventRouter.delete('/:eventId', eventController.deleteEvent);

  // LD1: Configure discovery endpoints for finding events
  eventRouter.get('/discover/location', eventController.getEventsByLocation);

  // LD1: Configure recommendation endpoints for personalized event suggestions
  // eventRouter.get('/recommendations/personalized/:userId', eventController.getPersonalizedRecommendations);
  // eventRouter.get('/recommendations/tribe/:tribeId', eventController.getTribeRecommendations);
  // eventRouter.get('/recommendations/weather', eventController.getWeatherBasedRecommendations);
  // eventRouter.get('/recommendations/budget', eventController.getBudgetFriendlyRecommendations);

  // LD1: Configure weather-based activity endpoints
  // eventRouter.get('/weather/current', eventController.getCurrentWeatherHandler);
  // eventRouter.get('/weather/forecast', eventController.getWeatherForecastHandler);
  // eventRouter.get('/weather/date', eventController.getWeatherForDateHandler);
  // eventRouter.get('/weather/suitability', eventController.getWeatherSuitabilityHandler);
  // eventRouter.get('/weather/suggestion', eventController.suggestActivityTypeHandler);

  // LD1: Apply the event router to the app
  app.use('/api/v1/events', eventRouter);

  // LD1: Apply notFoundMiddleware for handling 404 errors
  app.use(notFoundMiddleware);

  // LD1: Apply errorMiddleware for centralized error handling
  app.use(errorMiddleware);
}

/**
 * Initializes service instances and their dependencies
 * @returns Promise<void> - Promise that resolves when services are initialized
 */
async function setupServices(): Promise<void> {
  // LD1: Initialize integration instances for external APIs
  const eventbriteIntegration = new EventbriteIntegration();
  const googlePlacesIntegration = new GooglePlacesIntegration();
  const meetupIntegration = new MeetupIntegration();
  const openWeatherMapIntegration = new OpenWeatherMapIntegration();

  // LD1: Initialize EventService with required dependencies
  global.eventService = new EventService();

  // LD1: Initialize DiscoveryService with required dependencies
  global.discoveryService = new DiscoveryService();

  // LD1: Initialize RecommendationService with required dependencies
  global.recommendationService = new RecommendationService();

  // LD1: Log successful service initialization
  logger.info('Event Service instances initialized successfully');
}

/**
 * Initializes the server and starts listening for requests
 * @returns Promise<http.Server> - Promise that resolves to the HTTP server instance
 */
async function startServer(): Promise<http.Server> {
  // LD1: Initialize configuration using initializeEventServiceConfig
  await config.initializeEventServiceConfig();

  // LD1: Set up services using setupServices
  await setupServices();

  // LD1: Create Express application
  const app = express();

  // LD1: Set up middleware using setupMiddleware
  setupMiddleware(app);

  // LD1: Set up routes using setupRoutes
  setupRoutes(app);

  // LD1: Get port from environment variables or use default (3003)
  const port = config.env.PORT || 3003;

  // LD1: Start HTTP server listening on the configured port
  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  // LD1: Return the HTTP server instance
  return server;
}

/**
 * Gracefully shuts down the server and cleans up resources
 * @param server - HTTP Server
 * @returns Promise<void> - Promise that resolves when server is shut down
 */
async function shutdownServer(server: http.Server): Promise<void> {
  // LD1: Log server shutdown initiation
  logger.info('Initiating server shutdown...');

  // LD1: Close HTTP server connections
  server.close((err) => {
    if (err) {
      logger.error('Error closing server connections', err);
      process.exitCode = 1;
    }
    logger.info('Server connections closed');
  });

  // LD1: Clean up service resources
  // global.eventService.cleanup();

  // LD1: Clean up configuration resources using shutdownEventServiceConfig
  await config.shutdownEventServiceConfig();

  // LD1: Log successful server shutdown
  logger.info('Server shutdown completed');
}

/**
 * Sets up process event handlers for graceful shutdown
 * @param server - HTTP Server
 * @returns void - No return value
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
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', err);
    process.exit(1);
  });

  // LD1: Set up handler for unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { reason, promise });
    process.exit(1);
  });
}

/**
 * Main function that starts the application
 * @returns Promise<void> - Promise that resolves when application is running
 */
async function main(): Promise<void> {
  try {
    // LD1: Call startServer to initialize and start the server
    const server = await startServer();

    // LD1: Set up process signal handlers for graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    // LD1: Catch and log any unhandled errors during startup
    logger.error('Application startup failed', error as Error);
    process.exit(1);
  }
}

// Start the application
main();