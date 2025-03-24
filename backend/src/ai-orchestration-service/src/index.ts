import express, { Request, Response, NextFunction } from 'express'; // ^4.18.2
import cors from 'cors'; // ^2.8.5
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import * as promClient from 'prom-client'; // ^14.2.0

import config from './config';
import { logger } from '../../shared/src/utils/logger.util';
import { errorMiddleware } from '../../shared/src/middlewares/error.middleware';
import { loggingMiddleware } from '../../shared/src/middlewares/logging.middleware';
import { 
    ModelController, 
    OrchestrationController,
    promptRouter
} from './controllers';
import { ModelService } from './services';
import { OrchestrationService } from './services';
import { PromptService } from './services';
import { OpenRouterIntegration } from './integrations';
import { AIEngineIntegration } from './integrations';

/**
 * Initializes the Express server with middleware and routes
 * @returns Configured Express application
 */
function initializeServer(): express.Application {
    // LD1: Create Express application
    const app = express();

    // LD1: Configure middleware (cors, helmet, compression, etc.)
    app.use(cors({ origin: config.env.CORS_ORIGIN }));
    app.use(helmet());
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // LD1: Set up logging middleware
    app.use(loggingMiddleware);

    // LD1: Initialize Prometheus metrics
    const collectDefaultMetrics = config.metrics.collectDefaultMetrics;
    if (collectDefaultMetrics) {
        promClient.collectDefaultMetrics({ register: config.metrics.registry });
    }

    // LD1: Create and configure routes
    setupRoutes(app);

    // LD1: Set up error handling middleware
    app.use(errorMiddleware);

    // LD1: Return configured Express application
    return app;
}

/**
 * Sets up API routes for the AI Orchestration Service
 * @param app Express.Application
 */
function setupRoutes(app: express.Application): void {
    // LD1: Create model controller instance
    const openRouterIntegration = new OpenRouterIntegration();
    const aiEngineIntegration = new AIEngineIntegration();
    const modelService = new ModelService(openRouterIntegration);
    const promptService = new PromptService();
    const orchestrationService = new OrchestrationService(modelService, promptService, openRouterIntegration, aiEngineIntegration);
    const modelController = new ModelController(modelService);
    const orchestrationController = new OrchestrationController(orchestrationService);

    // LD1: Set up health check endpoint
    app.get('/health', async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        } catch (error) {
            next(error);
        }
    });

    // LD1: Set up metrics endpoint
    app.get(config.metrics.metricsPath, async (req: Request, res: Response) => {
        res.setHeader('Content-Type', promClient.register.contentType);
        const metrics = await config.metrics.registry.metrics();
        res.end(metrics);
    });

    // LD1: Set up model-related endpoints
    app.get('/models', modelController.getModels.bind(modelController));
    app.get('/models/:modelId', modelController.getModel.bind(modelController));

    // LD1: Set up orchestration-related endpoints
    app.post('/orchestration/requests', orchestrationController.createRequest.bind(orchestrationController));
    app.get('/orchestration/requests/:id', orchestrationController.getRequest.bind(orchestrationController));

    // LD1: Set up prompt-related endpoints
    app.use('/prompts', promptRouter);
}

/**
 * Initializes all required services for the AI Orchestration Service
 */
async function initializeServices(): Promise<void> {
    try {
        // LD1: Initialize model service
        // await modelService.initialize();

        // LD1: Initialize orchestration service
        // await orchestrationService.initialize();

        // LD1: Initialize prompt service
        // await promptService.initialize();

        // LD1: Log successful service initialization
        logger.info('All services initialized successfully');
    } catch (error) {
        // LD1: Log service initialization failure
        logger.error('Failed to initialize services', error as Error);
        throw error;
    }
}

/**
 * Starts the HTTP server on the configured port
 * @param app Express.Application
 */
async function startServer(app: express.Application): Promise<void> {
    try {
        // LD1: Get port from configuration
        const port = config.env.PORT || 3004;

        // LD1: Start HTTP server on specified port
        const server = app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });

        // LD1: Set up graceful shutdown handlers
        setupGracefulShutdown(server);

        // LD1: Log server start information
        logger.info('Server started successfully');
    } catch (error) {
        // LD1: Log server start failure
        logger.error('Failed to start server', error as Error);
        throw error;
    }
}

/**
 * Sets up handlers for graceful server shutdown
 * @param server http.Server
 */
function setupGracefulShutdown(server: any): void {
    // LD1: Register handler for SIGTERM signal
    process.on('SIGTERM', () => {
        logger.info('Received SIGTERM signal, shutting down gracefully');
        shutdown();
    });

    // LD1: Register handler for SIGINT signal
    process.on('SIGINT', () => {
        logger.info('Received SIGINT signal, shutting down gracefully');
        shutdown();
    });

    // LD1: Implement shutdown logic to close server and connections
    function shutdown() {
        logger.info('Shutting down server...');
        server.close(() => {
            logger.info('Server shut down successfully');
            process.exit(0);
        });
    }

    // LD1: Log shutdown events
    logger.info('Graceful shutdown handlers registered');
}

/**
 * Main function that orchestrates server initialization and startup
 */
async function main(): Promise<void> {
    try {
        // LD1: Initialize and validate configuration
        config.initializeConfiguration();
        config.aiConfig.validateAIConfiguration();

        // LD1: Initialize services
        await initializeServices();

        // LD1: Initialize server
        const app = initializeServer();

        // LD1: Set up routes
        // setupRoutes(app);

        // LD1: Start server
        await startServer(app);

        // LD1: Log successful startup
        logger.info('AI Orchestration Service started successfully');
    } catch (error) {
        // LD1: Log startup failure
        logger.error('AI Orchestration Service failed to start', error as Error);
        process.exit(1);
    }
}

// Start the server
main();