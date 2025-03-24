import express from 'express'; // v4.18.2
import cors from 'cors'; // ^2.8.5
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import rateLimit from 'express-rate-limit'; // ^6.7.0
import morgan from 'morgan'; // ^1.10.0
import { collectDefaultMetrics, Registry } from 'prom-client'; // ^14.2.0

import config from './config';
import { errorMiddleware, notFoundMiddleware, correlationIdMiddleware, requestLoggingMiddleware } from '@shared/middlewares';
import { paymentController, SplitController, setupTransactionRoutes } from './controllers';
import { PaymentService, SplitService, TransactionService } from './services';
import { getPaymentProvider } from './providers';

const PORT = process.env.PORT || 3004;

/**
 * Configures all payment service API routes
 * @param app Express application instance
 */
function setupRoutes(app: express.Application): void {
  // Create router instances for payment, split, and transaction routes
  const paymentRouter = express.Router();
  const splitRouter = express.Router();
  const transactionRouter = express.Router();

  // Register payment controller routes on the payment router
  paymentRouter.post('/', paymentController.createPaymentMethod);
  paymentRouter.get('/:id', paymentController.getPaymentMethodById);
  paymentRouter.get('/', paymentController.getPaymentMethodsByUser);
  paymentRouter.put('/:id', paymentController.updatePaymentMethod);
  paymentRouter.delete('/:id', paymentController.deletePaymentMethod);
  paymentRouter.post('/:id/default', paymentController.setDefaultPaymentMethod);
  paymentRouter.get('/:userId/default', paymentController.getDefaultPaymentMethod);
  paymentRouter.post('/:id/validate', paymentController.validatePaymentMethod);

  // Initialize SplitController with SplitService and register routes on the split router
  const splitService = new SplitService(new TransactionService());
  const splitController = new SplitController(splitService, new TransactionService());

  splitRouter.post('/', splitController.createSplit.bind(splitController));
  splitRouter.get('/:splitId', splitController.getSplitById.bind(splitController));
  splitRouter.get('/', splitController.getSplits.bind(splitController));
  splitRouter.patch('/:splitId', splitController.updateSplitStatus.bind(splitController));
  splitRouter.post('/:splitId/process', splitController.processSharePayment.bind(splitController));
  splitRouter.post('/:splitId/cancel', splitController.cancelSplit.bind(splitController));
  splitRouter.get('/statistics/:type/:id', splitController.getSplitStatistics.bind(splitController));
  splitRouter.post('/:splitId/remind', splitController.remindPendingPayments.bind(splitController));
  splitRouter.get('/:splitId/summary', splitController.getSplitSummary.bind(splitController));
  splitRouter.get('/:splitId/transactions', splitController.getSplitTransactions.bind(splitController));

  // Set up transaction routes using the setupTransactionRoutes function
  setupTransactionRoutes(transactionRouter);

  // Mount all routers on the main app with appropriate path prefixes
  app.use('/payments', paymentRouter);
  app.use('/splits', splitRouter);
  app.use('/transactions', transactionRouter);

  // Set up webhook endpoints for payment provider callbacks
  // Example: app.post('/webhooks/stripe', stripeWebhookHandler);
}

/**
 * Configures Express middleware for the payment service
 * @param app Express application instance
 */
function setupMiddleware(app: express.Application): void {
  // Apply helmet middleware for security headers
  app.use(helmet());

  // Configure CORS with appropriate options
  const corsOptions = {
    origin: config.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  };
  app.use(cors(corsOptions));

  // Apply compression middleware for response compression
  app.use(compression());

  // Set up correlation ID middleware for request tracing
  app.use(correlationIdMiddleware);

  // Configure request logging middleware
  app.use(requestLoggingMiddleware);

  // Set up JSON body parser with size limits
  app.use(express.json({ limit: '1mb' }));

  // Apply rate limiting middleware to prevent abuse
  const limiter = rateLimit({
    windowMs: Number(config.env.API_RATE_LIMIT_WINDOW_MS),
    max: Number(config.env.API_RATE_LIMIT),
    message: 'Too many requests, please try again later.',
    headers: true,
  });
  app.use(limiter);

  // Configure metrics endpoint for Prometheus monitoring
  // Example: app.use(metricsMiddleware);
}

/**
 * Configures error handling middleware for the payment service
 * @param app Express application instance
 */
function setupErrorHandling(app: express.Application): void {
  // Register 404 handler for undefined routes
  app.use(notFoundMiddleware);

  // Register centralized error handling middleware
  app.use(errorMiddleware);
}

/**
 * Configures Prometheus metrics collection for the payment service
 */
function setupMetrics(): { registry: Registry } {
  // Create a new Prometheus registry
  const registry = new Registry();

  // Configure default metrics collection
  collectDefaultMetrics({ register: registry });

  // Define custom metrics for payment processing
  // Example: const paymentSuccessRate = new promClient.Gauge({ ... });

  // Define custom metrics for transaction success/failure rates
  // Example: const transactionSuccessRate = new promClient.Gauge({ ... });

  // Define custom metrics for API response times
  // Example: const apiResponseTime = new promClient.Histogram({ ... });

  // Return the configured registry
  return { registry };
}

/**
 * Initializes and starts the Express server
 */
async function startServer(): Promise<void> {
  try {
    // Validate payment service configuration
    config.validatePaymentConfiguration();

    // Create Express application instance
    const app = express();

    // Set up middleware using setupMiddleware function
    setupMiddleware(app);

    // Set up routes using setupRoutes function
    setupRoutes(app);

    // Set up error handling using setupErrorHandling function
    setupErrorHandling(app);

    // Start HTTP server on configured port
    app.listen(PORT, () => {
      config.logging.info(`Payment Service started on port ${PORT}`);
    });
  } catch (error) {
    config.logging.error('Startup error', error as Error);
    process.exit(1);
  }
}

// Start the server
startServer();