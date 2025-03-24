# backend/src/auth-service/src/index.ts
```typescript
import express from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0
import cors from 'cors'; // ^2.8.5
import compression from 'compression'; // ^1.7.4
import rateLimit from 'express-rate-limit'; // ^6.7.0

import config from './config';
import {
  registerUser,
  loginUser,
  socialAuthUser,
  refreshUserToken,
  logoutUser,
  logoutAllSessions,
  requestPasswordResetEmail,
  resetPassword,
  verifyUserEmail,
  resendVerificationEmail,
  changeUserPassword,
  validateUserToken,
  getCurrentUser
} from './controllers';
import {
  authMiddleware,
  validateLogin,
  validateRegistration,
  validateRefreshToken,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateEmailVerification,
  validateSocialLogin,
  validateLogout,
  validatePasswordChange
} from './middleware';
import { errorMiddleware, notFoundMiddleware } from '../../shared/src/middlewares/error.middleware';
import { correlationIdMiddleware, requestLoggingMiddleware, httpLoggerMiddleware } from '../../shared/src/middlewares/logging.middleware';
import { logger } from '../../shared/src/utils/logger.util';
import { AddressInfo } from 'net';

/**
 * Configures and applies middleware to the Express application
 * 
 * @param app - Express.Application
 * @returns void - No return value
 */
function setupMiddleware(app: express.Application): void {
  // Apply helmet middleware for security headers
  app.use(helmet());

  // Configure and apply CORS middleware
  const corsOptions: cors.CorsOptions = {
    origin: config.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Apply compression middleware
  app.use(compression());

  // Configure JSON body parser with size limits
  app.use(express.json({ limit: '1mb' }));

  // Apply correlation ID middleware for request tracing
  app.use(correlationIdMiddleware);

  // Apply request logging middleware
  app.use(requestLoggingMiddleware);

  // Apply HTTP logger middleware
  app.use(httpLoggerMiddleware());

  // Configure and apply rate limiting middleware
  const limiter = rateLimit({
    windowMs: config.env.API_RATE_LIMIT_WINDOW_MS,
    max: config.env.API_RATE_LIMIT,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

/**
 * Configures API routes for the authentication service
 * 
 * @param app - Express.Application
 * @returns void - No return value
 */
function setupRoutes(app: express.Application): void {
  // Set up health check endpoint at /health
  app.get('/health', (req, res) => {
    res.status(200).send('Auth service is healthy');
  });

  // Set up metrics endpoint at /metrics
  app.get('/metrics', config.metrics.getMetricsMiddleware());

  // Create auth router for /api/v1/auth routes
  const authRouter = express.Router();

  // Configure registration endpoint POST /register with validation
  authRouter.post('/register', validateRegistration(), registerUser);

  // Configure login endpoint POST /login with validation
  authRouter.post('/login', validateLogin(), loginUser);

  // Configure social auth endpoint POST /social with validation
  authRouter.post('/social-auth', validateSocialLogin(), socialAuthUser);

  // Configure token refresh endpoint POST /refresh with validation
  authRouter.post('/refresh-token', validateRefreshToken(), refreshUserToken);

  // Configure logout endpoint POST /logout with validation
  authRouter.post('/logout', validateLogout(), logoutUser);

  // Configure logout all sessions endpoint POST /logout-all with auth middleware
  authRouter.post('/logout-all', authMiddleware, logoutAllSessions);

  // Configure password reset request endpoint POST /password-reset with validation
  authRouter.post('/password-reset-request', validatePasswordReset(), requestPasswordResetEmail);

  // Configure password reset confirmation endpoint POST /password-reset/confirm with validation
  authRouter.post('/password-reset', validatePasswordResetConfirm(), resetPassword);

  // Configure email verification endpoint GET /verify-email with validation
  authRouter.post('/verify-email', validateEmailVerification(), verifyUserEmail);

  // Configure resend verification email endpoint POST /resend-verification with validation
  authRouter.post('/resend-verification', resendVerificationEmail);

  // Configure password change endpoint POST /change-password with auth middleware and validation
  authRouter.post('/change-password', authMiddleware, validatePasswordChange(), changeUserPassword);

  // Configure token validation endpoint GET /validate-token with auth middleware
  authRouter.get('/validate-token', authMiddleware, validateUserToken);

  // Configure current user endpoint GET /me with auth middleware
  authRouter.get('/me', authMiddleware, getCurrentUser);

  // Apply the auth router to the app
  app.use('/api/v1/auth', authRouter);

  // Apply notFoundMiddleware for handling 404 errors
  app.use(notFoundMiddleware);

  // Apply errorMiddleware for centralized error handling
  app.use(errorMiddleware);
}

/**
 * Initializes the server and starts listening for requests
 * 
 * @returns Promise<void> - Promise that resolves when server is started
 */
async function startServer(): Promise<void> {
  try {
    // Initialize configuration
    await config.initializeConfig();

    // Connect to the database
    await config.database.connectDatabase();

    // Create Express application
    const app = express();

    // Set up middleware
    setupMiddleware(app);

    // Set up routes
    setupRoutes(app);

    // Get port from environment variables or use default (3000)
    const port = config.env.PORT || 3000;

    // Start HTTP server listening on the configured port
    const server = app.listen(port, () => {
      logger.info(`Server is listening on port ${port}`);
    });

    // Handle process signals for graceful shutdown
    handleProcessSignals(server);
  } catch (error) {
    logger.error('Error during server startup', error as Error);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the server and cleans up resources
 * 
 * @param server - http.Server
 * @returns Promise<void> - Promise that resolves when server is shut down
 */
async function shutdownServer(server: any): Promise<void> {
  logger.info('Initiating server shutdown...');

  try {
    // Close HTTP server connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Disconnect from database
    await config.database.disconnectDatabase();

    // Clean up configuration resources
    await config.shutdownConfig();

    logger.info('Server shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during server shutdown', error as Error);
    process.exit(1);
  }
}

/**
 * Sets up handlers for process signals to enable graceful shutdown
 * 
 * @param server - http.Server
 * @returns void - No return value
 */
function handleProcessSignals(server: any): void {
  // Set up handler for SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal');
    shutdownServer(server);
  });

  // Set up handler for SIGINT signal
  process.on('SIGINT', () => {
    logger.info('Received SIGINT signal');
    shutdownServer(server);
  });
}

/**
 * Main function that starts the application
 * 
 * @returns Promise<void> - Promise that resolves when application is running
 */
async function main(): Promise<void> {
  try {
    // Call startServer to initialize and start the server
    await startServer();
  } catch (error) {
    logger.error('Unhandled error during startup', error as Error);
  }
}

// Execute main function
main();