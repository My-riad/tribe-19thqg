import express from 'express'; // version: ^4.18.2
import cors from 'cors'; // version: ^2.8.5
import helmet from 'helmet'; // version: ^7.0.0
import compression from 'compression'; // version: ^1.7.4
import rateLimit from 'express-rate-limit'; // version: ^6.7.0

import config from './config';
import { notificationController, getDeliveryById, getDeliveriesByNotification, getDeliveryByNotificationAndChannel, createDelivery, updateDeliveryStatus, markDeliveryAsRead, retryFailedDeliveries, getDeliveryStats, getDeliveryStatsByChannel, cleanupOldDeliveries, getUserPreferences, getUserPreferenceByType, createPreference, updatePreference, deletePreference, bulkUpdatePreferences, toggleNotificationType, updateChannels, ensureUserPreferences, resetToDefaults } from './controllers';
import { errorMiddleware, notFoundMiddleware } from '../../shared/src/middlewares/error.middleware';
import { correlationIdMiddleware, requestLoggingMiddleware, httpLoggerMiddleware } from '../../shared/src/middlewares/logging.middleware';
import { logger } from '../../shared/src/utils/logger.util';

/**
 * Configures Express middleware for the application
 * @param app - Express Application
 */
function setupMiddleware(app: express.Application): void {
  // Configure CORS with appropriate options
  app.use(cors({
    origin: config.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    credentials: true
  }));

  // Add helmet middleware for security headers
  app.use(helmet());

  // Add compression middleware for response compression
  app.use(compression());

  // Add JSON body parser middleware
  app.use(express.json());

  // Add URL-encoded body parser middleware
  app.use(express.urlencoded({ extended: true }));

  // Add correlation ID middleware for request tracing
  app.use(correlationIdMiddleware);

  // Add request logging middleware
  app.use(requestLoggingMiddleware);

  // Add HTTP logger middleware
  app.use(httpLoggerMiddleware());

  // Add rate limiting middleware for API protection
  const limiter = rateLimit({
    windowMs: config.env.API_RATE_LIMIT_WINDOW_MS,
    max: config.env.API_RATE_LIMIT,
    message: 'Too many requests, please try again later.',
    headers: true
  });
  app.use(limiter);
}

/**
 * Configures API routes for the notification service
 * @param app - Express Application
 */
function setupRoutes(app: express.Application): void {
  // Create Express router instances
  const notificationRouter = express.Router();
  const deliveryRouter = express.Router();
  const preferenceRouter = express.Router();

  // Set up health check endpoint at /health
  app.get('/health', (req, res) => {
    res.status(200).send('Notification Service is healthy');
  });

  // Set up notification routes at /api/notifications
  setupNotificationRoutes(notificationRouter);
  app.use('/api/notifications', notificationRouter);

  // Set up delivery routes at /api/deliveries
  setupDeliveryRoutes(deliveryRouter);
  app.use('/api/deliveries', deliveryRouter);

  // Set up preference routes at /api/preferences
  setupPreferenceRoutes(preferenceRouter);
  app.use('/api/preferences', preferenceRouter);

  // Add not found middleware for handling 404 errors
  app.use(notFoundMiddleware);

  // Add error middleware for centralized error handling
  app.use(errorMiddleware);
}

/**
 * Initialises and starts the HTTP server
 */
async function startServer(): Promise<void> {
  try {
    // Validate notification service configuration
    config.validateNotificationConfiguration();

    // Initialize notification service configuration
    await config.initializeNotificationConfiguration();

    // Create Express application
    const app = express();

    // Set up middleware
    setupMiddleware(app);

    // Set up routes
    setupRoutes(app);

    // Get port from environment variables or use default
    const port = config.env.PORT || 3000;

    // Start HTTP server on the specified port
    app.listen(port, () => {
      logger.info(`Notification Service started on port ${port}`);
    });

    // Set up error handling for server
    app.on('error', (error) => {
      logger.error('Express app error', error as Error);
    });
  } catch (error) {
    logger.error('Failed to start Notification Service', error as Error);
    process.exit(1);
  }
}

/**
 * Configures routes for notification-related endpoints
 * @param router - Express Router
 * @returns Configured router
 */
function setupNotificationRoutes(router: express.Router): express.Router {
  // Set up POST /api/notifications for creating notifications
  router.post('/', notificationController.createNotification);

  // Set up GET /api/notifications/:id for retrieving a notification by ID
  router.get('/:id', notificationController.getNotificationById);

  // Set up GET /api/notifications/user/:userId for retrieving user notifications
  router.get('/user/:userId', notificationController.getUserNotifications);

  // Set up GET /api/notifications/user/:userId/unread for retrieving unread notifications
  router.get('/user/:userId/unread', notificationController.getUnreadNotifications);

  // Set up GET /api/notifications/user/:userId/count for counting unread notifications
  router.get('/user/:userId/count', notificationController.countUnreadNotifications);

  // Set up PUT /api/notifications/:id/read for marking a notification as read
  router.put('/:id/read', notificationController.markNotificationAsRead);

  // Set up PUT /api/notifications/read for marking multiple notifications as read
  router.put('/read', notificationController.markAllNotificationsAsRead);

  // Set up DELETE /api/notifications/:id for deleting a notification
  router.delete('/:id', notificationController.deleteNotification);

  // Set up POST /api/notifications/bulk for creating bulk notifications
  router.post('/bulk', notificationController.createBulkNotifications);

  // Set up POST /api/notifications/tribe for creating tribe notifications
  router.post('/tribe', notificationController.createTribeNotification);

  // Set up POST /api/notifications/template for creating templated notifications
  router.post('/template', notificationController.createTemplatedNotification);

  // Set up GET /api/notifications/stats for retrieving delivery statistics
  router.get('/stats', notificationController.getDeliveryStatistics);

  return router;
}

/**
 * Configures routes for delivery-related endpoints
 * @param router - Express Router
 * @returns Configured router
 */
function setupDeliveryRoutes(router: express.Router): express.Router {
  // Set up GET /api/deliveries/:id for retrieving a delivery by ID
  router.get('/:id', getDeliveryById);

  // Set up GET /api/deliveries/notification/:notificationId for retrieving deliveries by notification
  router.get('/notification/:notificationId', getDeliveriesByNotification);

  // Set up GET /api/deliveries/notification/:notificationId/channel/:channel for retrieving delivery by notification and channel
  router.get('/notification/:notificationId/channel/:channel', getDeliveryByNotificationAndChannel);

  // Set up POST /api/deliveries for creating a delivery
  router.post('/', createDelivery);

  // Set up PUT /api/deliveries/:id/status for updating delivery status
  router.put('/:id/status', updateDeliveryStatus);

  // Set up PUT /api/deliveries/:id/read for marking a delivery as read
  router.put('/:id/read', markDeliveryAsRead);

  // Set up POST /api/deliveries/retry for retrying failed deliveries
  router.post('/retry', retryFailedDeliveries);

  // Set up GET /api/deliveries/stats for retrieving delivery statistics
  router.get('/stats', getDeliveryStats);

  // Set up GET /api/deliveries/stats/channel for retrieving delivery statistics by channel
  router.get('/stats/channel', getDeliveryStatsByChannel);

  // Set up POST /api/deliveries/cleanup for cleaning up old deliveries
  router.post('/cleanup', cleanupOldDeliveries);

  return router;
}

/**
 * Configures routes for preference-related endpoints
 * @param router - Express Router
 * @returns Configured router
 */
function setupPreferenceRoutes(router: express.Router): express.Router {
  // Set up GET /api/preferences/user/:userId for retrieving user preferences
  router.get('/user/:userId', getUserPreferences);

  // Set up GET /api/preferences/user/:userId/type/:type for retrieving a specific preference by type
  router.get('/user/:userId/type/:type', getUserPreferenceByType);

  // Set up POST /api/preferences for creating a preference
  router.post('/', createPreference);

  // Set up PUT /api/preferences/:id for updating a preference
  router.put('/:id', updatePreference);

  // Set up DELETE /api/preferences/:id for deleting a preference
  router.delete('/:id', deletePreference);

  // Set up PUT /api/preferences/bulk for updating multiple preferences in bulk
  router.put('/bulk', bulkUpdatePreferences);

  // Set up PUT /api/preferences/toggle for toggling a notification type
  router.put('/toggle/:userId/:notificationType', toggleNotificationType);

  // Set up PUT /api/preferences/channels for updating delivery channels
  router.put('/channels/:userId/:notificationType', updateChannels);

  // Set up POST /api/preferences/ensure for ensuring a user has all required preferences
  router.post('/ensure/:userId', ensureUserPreferences);

  // Set up POST /api/preferences/reset for resetting preferences to defaults
  router.post('/reset/:userId/:notificationType', resetToDefaults);

  return router;
}

// Main execution flow of the notification service
(async () => {
  // Call startServer function to initialize and start the service
  await startServer();

  // Handle any unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason as Error);
  });

  // Handle SIGTERM and SIGINT signals for graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
  });
})();