import express from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0
import cors from 'cors'; // ^2.8.5
import compression from 'compression'; // ^1.7.4
import rateLimit from 'express-rate-limit'; // ^6.7.0
import { 
  correlationIdMiddleware, 
  requestLoggingMiddleware, 
  httpLoggerMiddleware 
} from '../../shared/src/middlewares/logging.middleware';
import { logger } from '../../shared/src/utils/logger.util';
import { 
  errorMiddleware, 
  notFoundMiddleware 
} from '../../shared/src/middlewares/error.middleware';
import config from './config';
import { 
  ProfileController, 
  PersonalityController,
  createInterestHandler,
  getInterestByIdHandler,
  getInterestsByProfileIdHandler,
  updateInterestHandler,
  deleteInterestHandler,
  bulkCreateInterestsHandler,
  deleteInterestsByProfileIdHandler
} from './controllers';
import { 
  ProfileService, 
  PersonalityService,
  InterestService
} from './services';
import { 
  validateProfileParams, 
  validateProfileCreateBody, 
  validateProfileUpdateBody, 
  validateProfileSearchQuery, 
  validateLocationUpdateBody, 
  validateMaxTravelDistanceBody,
  validatePersonalityTraitParams,
  validateProfilePersonalityParams,
  validatePersonalityTrait,
  validatePersonalityAssessment,
  validateInterestParams,
  validateProfileInterestsParams,
  validateInterest,
  validateInterestSubmission
} from './validations';
import { ProfileModel } from './models/profile.model';

/**
 * Configures and applies middleware to the Express application
 * 
 * @param app - The Express application instance
 */
function setupMiddleware(app: express.Application): void {
  // LD1: Apply helmet middleware for security headers
  app.use(helmet());

  // LD1: Configure and apply CORS middleware
  const corsOptions = {
    origin: config.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
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
    windowMs: Number(config.env.API_RATE_LIMIT_WINDOW_MS),
    max: Number(config.env.API_RATE_LIMIT),
    message: 'Rate limit exceeded. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

/**
 * Configures API routes for the profile service
 * 
 * @param app - The Express application instance
 */
function setupRoutes(app: express.Application): void {
  // LD1: Set up health check endpoint at /health
  app.get('/health', (req, res) => {
    res.status(200).send('Profile service is healthy');
  });

  // LD1: Set up metrics endpoint at /metrics
  app.get('/metrics', config.metrics.getMetricsMiddleware());

  // LD1: Create profile router for /api/v1/profiles routes
  const profileRouter = express.Router();

  // LD1: Configure profile creation endpoint POST /
  profileRouter.post('/', validateProfileCreateBody, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.createProfile(req, res, next);
  });

  // LD1: Configure profile retrieval endpoint GET /:profileId
  profileRouter.get('/:id', validateProfileParams, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.getProfileById(req, res, next);
  });

  // LD1: Configure profile by user ID endpoint GET /user/:userId
  profileRouter.get('/user/:userId', validateProfileParams, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.getProfileByUserId(req, res, next);
  });

  // LD1: Configure profile update endpoint PUT /:profileId
  profileRouter.put('/:id', validateProfileParams, validateProfileUpdateBody, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.updateProfile(req, res, next);
  });

  // LD1: Configure profile deletion endpoint DELETE /:profileId
  profileRouter.delete('/:id', validateProfileParams, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.deleteProfile(req, res, next);
  });

  // LD1: Configure profile search endpoint GET /search
  profileRouter.get('/search', validateProfileSearchQuery, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.searchProfiles(req, res, next);
  });

  // LD1: Configure location update endpoint PUT /:profileId/location
  profileRouter.put('/:id/location', validateProfileParams, validateLocationUpdateBody, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.updateLocation(req, res, next);
  });

  // LD1: Configure travel distance update endpoint PUT /:profileId/travel-distance
  profileRouter.put('/:id/travel-distance', validateProfileParams, validateMaxTravelDistanceBody, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.updateMaxTravelDistance(req, res, next);
  });

  // LD1: Configure personality assessment endpoint POST /:profileId/personality
  profileRouter.post('/:profileId/personality', validateProfilePersonalityParams, validatePersonalityAssessment, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.submitPersonalityAssessment(req, res, next);
  });

  // LD1: Configure personality traits endpoint GET /:profileId/personality
  profileRouter.get('/:profileId/personality', validateProfilePersonalityParams, async (req, res, next) => {
    const personalityController = new PersonalityController();
    await personalityController.getTraitsByProfileId(req, res, next);
  });

  // LD1: Configure interests endpoints for CRUD operations
  profileRouter.post('/:profileId/interests', validateProfileInterestsParams, validateInterestSubmission, createInterestHandler);
  profileRouter.get('/:profileId/interests/:id', validateInterestParams, getInterestByIdHandler);
  profileRouter.get('/:profileId/interests', validateProfileInterestsParams, getInterestsByProfileIdHandler);
  profileRouter.put('/:profileId/interests/:id', validateInterestParams, validateInterest, updateInterestHandler);
  profileRouter.delete('/:profileId/interests/:id', validateInterestParams, deleteInterestHandler);
  profileRouter.delete('/:profileId/interests', validateProfileInterestsParams, deleteInterestsByProfileIdHandler);

  // LD1: Configure compatibility calculation endpoint GET /:profileId/compatibility/:targetProfileId
  profileRouter.get('/:profileId/compatibility/:targetProfileId', async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.calculateCompatibility(req, res, next);
  });

  // LD1: Configure nearby profiles endpoint GET /:profileId/nearby
  profileRouter.get('/:profileId/nearby', validateProfileParams, async (req, res, next) => {
    const profileController = new ProfileController();
    await profileController.getNearbyProfiles(req, res, next);
  });

  // LD1: Apply the profile router to the app
  app.use('/api/v1/profiles', profileRouter);

  // LD1: Apply notFoundMiddleware for handling 404 errors
  app.use(notFoundMiddleware);

  // LD1: Apply errorMiddleware for centralized error handling
  app.use(errorMiddleware);
}

/**
 * Initializes service instances with dependencies
 */
function initializeServices(): { profileService: ProfileService; personalityService: PersonalityService; interestService: InterestService } {
  // LD1: Create instance of ProfileService
  const profileService = new ProfileService();

  // LD1: Create instance of PersonalityService
  const personalityService = new PersonalityService();

  // LD1: Create instance of InterestService
  const interestService = new InterestService();

  // LD1: Return object with service instances
  return { profileService, personalityService, interestService };
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

    // LD1: Initialize service instances using initializeServices
    const { profileService, personalityService, interestService } = initializeServices();

    // LD1: Create Express application
    const app = express();

    // LD1: Set up middleware using setupMiddleware
    setupMiddleware(app);

    // LD1: Set up routes using setupRoutes
    setupRoutes(app);

    // LD1: Get port from environment variables or use default (3001)
    const port = config.env.PORT || 3001;

    // LD1: Start HTTP server listening on the configured port
    const server = app.listen(port, () => {
      // LD1: Log successful server start with port information
      logger.info(`Profile service started on port ${port}`);
    });

    // LD1: Set up process signal handlers for graceful shutdown
    handleProcessSignals(server);
  } catch (error) {
    // LD1: Catch and log any unhandled errors during startup
    logger.error('Failed to start profile service', error as Error);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the server and cleans up resources
 */
async function shutdownServer(server: any): Promise<void> {
  try {
    // LD1: Log server shutdown initiation
    logger.info('Initiating profile service shutdown...');

    // LD1: Close HTTP server connections
    server.close((err: Error) => {
      if (err) {
        logger.error('Error closing server connections', err);
      } else {
        logger.info('Server connections closed');
      }
    });

    // LD1: Disconnect from database using database.disconnectDatabase
    await config.database.disconnectDatabase();

    // LD1: Clean up configuration resources using shutdownConfig
    await config.shutdownConfig();

    // LD1: Log successful server shutdown
    logger.info('Profile service shutdown completed successfully');
  } catch (error) {
    logger.error('Error during profile service shutdown', error as Error);
  }
}

/**
 * Sets up handlers for process signals to enable graceful shutdown
 */
function handleProcessSignals(server: any): void {
  // LD1: Set up handler for SIGTERM signal
  process.on('SIGTERM', () => {
    // LD1: Each handler calls shutdownServer and then exits process
    shutdownServer(server).then(() => {
      logger.info('Exiting process after SIGTERM');
      process.exit(0);
    });
  });

  // LD1: Set up handler for SIGINT signal
  process.on('SIGINT', () => {
    // LD1: Each handler calls shutdownServer and then exits process
    shutdownServer(server).then(() => {
      logger.info('Exiting process after SIGINT');
      process.exit(0);
    });
  });
}

/**
 * Main function that starts the application
 */
async function main(): Promise<void> {
  // LD1: Call startServer to initialize and start the server
  await startServer();
}

// Start the application
main();