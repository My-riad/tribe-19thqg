import * as prometheus from 'prom-client'; // v14.2.0
import { Request, Response, NextFunction } from 'express'; // v4.18.2
import env from './env';

// Define metrics path and configuration
export const metricsPath = '/metrics';
export const collectDefaultMetrics = true;
export const defaultLabels = { app: 'tribe', environment: env.NODE_ENV };
const metricBuckets = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]; // in seconds

// Define registry for collecting metrics
export let registry: prometheus.Registry;

/**
 * Interface defining the standard metrics for a microservice
 */
export interface ServiceMetrics {
  requestCounter: prometheus.Counter<string>;
  requestDuration: prometheus.Histogram<string>;
  errorCounter: prometheus.Counter<string>;
  activeConnections: prometheus.Gauge<string>;
  uptime: prometheus.Gauge<string>;
}

/**
 * Interface defining the metrics for database performance monitoring
 */
export interface DatabaseMetrics {
  queryDuration: prometheus.Histogram<string>;
  errorCounter: prometheus.Counter<string>;
  connectionPoolSize: prometheus.Gauge<string>;
  activeConnections: prometheus.Gauge<string>;
}

/**
 * Initializes metrics collection based on environment configuration
 */
export function initializeMetrics(): void {
  // Clear existing registry if it exists
  if (registry) {
    registry.clear();
  }

  // Create new registry
  registry = new prometheus.Registry();

  // Configure default labels
  registry.setDefaultLabels(defaultLabels);

  // Enable default metrics collection if configured
  if (collectDefaultMetrics) {
    prometheus.collectDefaultMetrics({ register: registry });
  }
}

/**
 * Creates and registers standard metrics for a microservice
 * 
 * @param serviceName - The name of the microservice
 * @returns Object containing all created metrics for the service
 */
export function createServiceMetrics(serviceName: string): ServiceMetrics {
  // Create counter for total requests by endpoint and method
  const requestCounter = new prometheus.Counter({
    name: `${serviceName}_http_requests_total`,
    help: 'Total number of HTTP requests',
    labelNames: ['endpoint', 'method'],
    registers: [registry]
  });

  // Create histogram for request duration by endpoint and method
  const requestDuration = new prometheus.Histogram({
    name: `${serviceName}_http_request_duration_seconds`,
    help: 'HTTP request duration in seconds',
    labelNames: ['endpoint', 'method'],
    buckets: metricBuckets,
    registers: [registry]
  });

  // Create counter for errors by endpoint, method, and status code
  const errorCounter = new prometheus.Counter({
    name: `${serviceName}_http_errors_total`,
    help: 'Total number of HTTP errors',
    labelNames: ['endpoint', 'method', 'status_code'],
    registers: [registry]
  });

  // Create gauge for active connections
  const activeConnections = new prometheus.Gauge({
    name: `${serviceName}_active_connections`,
    help: 'Current number of active connections',
    registers: [registry]
  });

  // Create gauge for service uptime
  const uptime = new prometheus.Gauge({
    name: `${serviceName}_uptime_seconds`,
    help: 'Service uptime in seconds',
    registers: [registry]
  });

  // Set initial uptime value and update every 15 seconds
  uptime.set(process.uptime());
  setInterval(() => {
    uptime.set(process.uptime());
  }, 15000);

  return {
    requestCounter,
    requestDuration,
    errorCounter,
    activeConnections,
    uptime
  };
}

/**
 * Creates and registers metrics for database performance monitoring
 * 
 * @param serviceName - The name of the microservice
 * @returns Object containing all created database metrics
 */
export function createDatabaseMetrics(serviceName: string): DatabaseMetrics {
  // Create histogram for query duration by operation type
  const queryDuration = new prometheus.Histogram({
    name: `${serviceName}_db_query_duration_seconds`,
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'entity'],
    buckets: metricBuckets,
    registers: [registry]
  });

  // Create counter for database errors by operation type
  const errorCounter = new prometheus.Counter({
    name: `${serviceName}_db_errors_total`,
    help: 'Total number of database errors',
    labelNames: ['operation', 'entity', 'error_type'],
    registers: [registry]
  });

  // Create gauge for connection pool size
  const connectionPoolSize = new prometheus.Gauge({
    name: `${serviceName}_db_connection_pool_size`,
    help: 'Size of the database connection pool',
    registers: [registry]
  });

  // Create gauge for active connections
  const activeConnections = new prometheus.Gauge({
    name: `${serviceName}_db_active_connections`,
    help: 'Current number of active database connections',
    registers: [registry]
  });

  return {
    queryDuration,
    errorCounter,
    connectionPoolSize,
    activeConnections
  };
}

/**
 * Creates an Express middleware for collecting HTTP request metrics
 * 
 * @param metrics - The service metrics object
 * @returns Express middleware function for metrics collection
 */
export function createExpressMiddleware(metrics: ServiceMetrics) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip metrics endpoint
    if (req.path === metricsPath) {
      return next();
    }

    // Increment active connections gauge on request start
    metrics.activeConnections.inc();

    // Track request start time
    const startTime = Date.now();

    // Add response listener to capture metrics on request completion
    res.on('finish', () => {
      // Calculate request duration
      const duration = (Date.now() - startTime) / 1000;
      
      // Normalize endpoint to avoid high cardinality
      // Replace route params like /users/123 with /users/:id
      const endpoint = req.route?.path || req.path;
      
      // Increment request counter with appropriate labels
      metrics.requestCounter.inc({ endpoint, method: req.method });
      
      // Observe request duration with appropriate labels
      metrics.requestDuration.observe(
        { endpoint, method: req.method },
        duration
      );
      
      // Increment error counter if response status >= 400
      if (res.statusCode >= 400) {
        metrics.errorCounter.inc({
          endpoint,
          method: req.method,
          status_code: res.statusCode
        });
      }
      
      // Decrement active connections gauge on request completion
      metrics.activeConnections.dec();
    });

    return next();
  };
}

/**
 * Creates an Express middleware that exposes Prometheus metrics endpoint
 * 
 * @returns Express middleware function for exposing metrics
 */
export function getMetricsMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === metricsPath) {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await registry.metrics());
    } else {
      next();
    }
  };
}

// Initialize metrics on module load
initializeMetrics();

export default {
  registry,
  createServiceMetrics,
  createDatabaseMetrics,
  createExpressMiddleware,
  getMetricsMiddleware,
  metricsPath,
  collectDefaultMetrics,
  defaultLabels,
  initializeMetrics
};