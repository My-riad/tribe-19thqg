/**
 * API Gateway Routing Module
 * 
 * This module configures all routes and middleware for the API Gateway,
 * handling request forwarding to appropriate microservices, authentication,
 * rate limiting, logging, and other cross-cutting concerns.
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware'; // ^2.0.6
import helmet from 'helmet'; // ^6.1.5
import compression from 'compression'; // ^1.7.4
import httpStatus from 'http-status'; // ^1.6.2

// Import configuration and utilities
import config, { serviceRegistry, env } from '../config';
import { logger } from '../../../shared/src/utils/logger.util';

// Import middleware
import { authMiddleware, roleAuthMiddleware } from '../middleware/auth.middleware';
import { corsMiddleware } from '../middleware/cors.middleware';
import { requestLoggingMiddleware, correlationMiddleware } from '../middleware/logging.middleware';
import { standardRateLimiter, authRateLimiter, tieredRateLimiter } from '../middleware/rate-limit.middleware';

/**
 * Configures Express application with middleware and routes for the API Gateway
 * 
 * @param app - Express application instance
 * @returns Configured Express application
 */
export function setupRoutes(app: Application): Application {
  // Apply security middleware
  app.use(helmet());
  
  // Apply compression middleware to reduce response size
  app.use(compression());
  
  // Apply CORS middleware
  app.use(corsMiddleware);
  
  // Apply correlation ID middleware for request tracing
  app.use(correlationMiddleware);
  
  // Apply request logging middleware
  app.use(requestLoggingMiddleware);
  
  // Parse JSON and URL-encoded request bodies
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Setup health check endpoints
  setupHealthCheck(app);
  
  // Setup metrics endpoints
  setupMetrics(app);
  
  // Setup routes for each service in the registry
  setupServiceRoutes(app);
  
  // Global error handler
  app.use(errorHandler);
  
  return app;
}

/**
 * Sets up proxy routes for each microservice defined in the service registry
 * 
 * @param app - Express application instance
 */
function setupServiceRoutes(app: Application): void {
  // Iterate through each service in the registry
  for (const service of serviceRegistry.services) {
    logger.info(`Setting up routes for service: ${service.name}`, {
      path: service.path,
      url: service.url,
      requiresAuth: service.requiresAuth,
      rateLimitTier: service.rateLimitTier
    });
    
    // Create a router for the service
    const router = express.Router();
    
    // Apply appropriate rate limiter based on service tier
    // This prevents abuse of services based on their criticality
    switch (service.rateLimitTier) {
      case 'auth':
        // Stricter limits for authentication to prevent brute force
        router.use(authRateLimiter());
        break;
      case 'critical':
        // Special limits for payment and sensitive operations
        router.use(tieredRateLimiter('critical'));
        break;
      default:
        // Standard limits for most services
        router.use(standardRateLimiter());
    }
    
    // Apply authentication middleware if required by the service
    if (service.requiresAuth) {
      router.use(authMiddleware);
    }
    
    // Create proxy middleware for the service
    const proxy = createServiceProxy(service);
    
    // Mount the proxy middleware on the service path
    router.use('/', proxy);
    
    // Mount the router on the app
    app.use(service.path, router);
    
    logger.info(`Service routes configured for ${service.name}`);
  }
}

/**
 * Sets up health check endpoints for the API Gateway
 * 
 * @param app - Express application instance
 */
function setupHealthCheck(app: Application): void {
  // Basic health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown'
    });
  });
  
  // Detailed health check endpoint for monitoring systems
  app.get('/health/detailed', async (req: Request, res: Response) => {
    try {
      // Check dependent services (in a full implementation, we'd check actual service health)
      const serviceStatus = serviceRegistry.services.map(service => ({
        name: service.name,
        status: 'ok', // In production, this would be based on actual health checks
        url: service.url
      }));
      
      res.status(httpStatus.OK).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown',
        services: serviceStatus,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      });
    } catch (error) {
      logger.error('Error in detailed health check', error as Error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Could not retrieve detailed health status'
      });
    }
  });
  
  // Kubernetes liveness probe
  app.get('/health/live', (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({ status: 'ok' });
  });
  
  // Kubernetes readiness probe
  app.get('/health/ready', (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({ status: 'ok' });
  });
  
  logger.info('Health check endpoints configured');
}

/**
 * Sets up metrics endpoints for the API Gateway
 * 
 * @param app - Express application instance
 */
function setupMetrics(app: Application): void {
  // Metrics endpoint for Prometheus
  app.get('/metrics', (req: Request, res: Response) => {
    // In a production environment, secure the metrics endpoint
    if (env.NODE_ENV === 'production') {
      const auth = req.headers.authorization;
      
      if (!auth || auth !== `Bearer ${env.METRICS_API_KEY}`) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          error: true,
          message: 'Unauthorized access to metrics endpoint'
        });
      }
    }
    
    // In a real implementation, we'd integrate with a metrics library
    // such as prom-client to expose actual metrics data
    res.setHeader('Content-Type', 'text/plain');
    res.status(httpStatus.OK).send('# Metrics data would be exposed here');
  });
  
  logger.info('Metrics endpoints configured');
}

/**
 * Creates a proxy middleware for a specific microservice
 * 
 * @param service - Service configuration from the registry
 * @returns Configured proxy middleware
 */
function createServiceProxy(service: any) {
  return createProxyMiddleware({
    target: service.url,
    changeOrigin: true,
    
    // Remove the service path prefix before forwarding the request
    // For example, /api/auth/login -> /login when forwarding to auth service
    pathRewrite: (path) => {
      const rewrittenPath = path.replace(service.path, '');
      logger.debug(`Rewriting path from ${path} to ${rewrittenPath}`);
      return rewrittenPath;
    },
    
    // Modify the proxy request before sending to target service
    onProxyReq: (proxyReq, req, res) => {
      // Add correlation ID header to proxied request for tracing
      if ((req as any).correlationId) {
        proxyReq.setHeader('X-Correlation-ID', (req as any).correlationId);
      }
      
      // Forward user info if authenticated
      if ((req as any).user) {
        proxyReq.setHeader('X-User-ID', (req as any).user.id);
        proxyReq.setHeader('X-User-Role', (req as any).user.role);
      }
      
      logger.debug(`Proxying request to ${service.name}`, {
        method: req.method,
        path: req.path,
        targetPath: proxyReq.path,
        targetHost: service.url,
        correlationId: (req as any).correlationId
      });
    },
    
    // Process proxy response
    onProxyRes: (proxyRes, req, res) => {
      // Add service name to response headers for debugging
      proxyRes.headers['x-served-by'] = service.name;
      
      logger.debug(`Received response from ${service.name}`, {
        method: req.method,
        path: req.path,
        statusCode: proxyRes.statusCode,
        correlationId: (req as any).correlationId
      });
    },
    
    // Handle proxy errors
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${service.name}`, err, {
        method: req.method,
        path: req.path,
        correlationId: (req as any).correlationId
      });
      
      // Send error response if headers haven't been sent already
      if (!res.headersSent) {
        res.status(httpStatus.BAD_GATEWAY).json({
          error: true,
          message: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          correlationId: (req as any).correlationId
        });
      }
    },
    
    // Configure reasonable timeouts to prevent hanging requests
    proxyTimeout: 30000, // 30 seconds for proxy response timeout
    timeout: 30000       // 30 seconds for connection timeout
  });
}

/**
 * Global error handling middleware for the API Gateway
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Get correlation ID for error tracking
  const correlationId = (req as any).correlationId || 'unknown';
  
  // Log the error with appropriate level based on status code
  if (err.statusCode >= 500) {
    logger.error(`Server error: ${req.method} ${req.path}`, err, {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: err.statusCode || httpStatus.INTERNAL_SERVER_ERROR
    });
  } else if (err.statusCode >= 400) {
    logger.warn(`Client error: ${req.method} ${req.path}`, {
      error: err.message,
      code: err.code,
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: err.statusCode
    });
  } else {
    logger.error(`Unexpected error: ${req.method} ${req.path}`, err, {
      correlationId,
      method: req.method,
      path: req.path
    });
  }
  
  // Store the error for possible inclusion in response logging
  (res as any).locals = { ...(res as any).locals, error: err };
  
  // Determine appropriate status code
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  
  // Map known error types to appropriate status codes
  if (err.name === 'ValidationError') {
    statusCode = httpStatus.BAD_REQUEST;
  } else if (err.name === 'AuthError') {
    statusCode = httpStatus.UNAUTHORIZED;
  } else if (err.name === 'ForbiddenError') {
    statusCode = httpStatus.FORBIDDEN;
  } else if (err.name === 'NotFoundError') {
    statusCode = httpStatus.NOT_FOUND;
  } else if (err.name === 'ConflictError') {
    statusCode = httpStatus.CONFLICT;
  } else if (err.name === 'RateLimitError') {
    statusCode = httpStatus.TOO_MANY_REQUESTS;
  }
  
  // Format the error response
  const errorResponse: any = {
    error: true,
    message: err.message || 'An unexpected error occurred',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    correlationId
  };
  
  // Include stack trace in development environment
  if (env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack.split('\n');
    
    // Include additional error data in development
    if (err.data) {
      errorResponse.data = err.data;
    }
  }
  
  // Send the error response
  res.status(statusCode).json(errorResponse);
}