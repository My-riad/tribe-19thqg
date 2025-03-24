/**
 * Centralized logging configuration for the Tribe platform.
 * 
 * This module provides a consistent logging setup across all microservices,
 * with environment-specific formatting, appropriate log levels, and support
 * for structured logging with correlation IDs.
 */

import * as path from 'path'; // built-in
import * as winston from 'winston'; // ^3.8.2
import env from './env';

/**
 * Interface defining the structure of the logging configuration
 */
interface LoggingConfig {
  /** Minimum log level to record (debug, info, warn, error) */
  level: string;
  /** Winston format configuration for log entries */
  format: winston.Logform.Format;
  /** Array of Winston transport configurations */
  transports: winston.transport[];
  /** Name of the service for identification in logs */
  serviceName: string;
  /** Whether to enable console logging */
  enableConsoleLogging: boolean;
  /** Whether to enable file logging */
  enableFileLogging: boolean;
  /** Path where log files will be stored */
  logFilePath: string;
  /** Configuration for HTTP request logging */
  httpLogging: HttpLoggingConfig;
}

/**
 * Interface defining the HTTP logging configuration
 */
interface HttpLoggingConfig {
  /** Morgan format string for HTTP request logging */
  format: string;
  /** Function to determine which requests to skip logging */
  skip: (req: any, res: any) => boolean;
}

/**
 * Determines the appropriate log level based on environment variables and defaults.
 * 
 * - Uses LOG_LEVEL environment variable if set to a valid level
 * - Falls back to 'debug' for development and 'info' for production
 * 
 * @returns The determined log level (debug, info, warn, error)
 */
function getLogLevel(): string {
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  
  if (env.LOG_LEVEL && validLogLevels.includes(env.LOG_LEVEL.toLowerCase())) {
    return env.LOG_LEVEL.toLowerCase();
  }
  
  // Default log levels based on environment
  return env.NODE_ENV === 'development' ? 'debug' : 'info';
}

/**
 * Creates the appropriate log format configuration based on environment.
 * 
 * - Development: Human-readable, colorized output with timestamps
 * - Production: JSON structured format for machine processing
 * 
 * Both formats include correlation IDs when available for request tracing.
 * 
 * @returns Winston format configuration
 */
function getLogFormat(): winston.Logform.Format {
  if (env.NODE_ENV === 'development') {
    // Development: colorized console format with timestamp
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        // Include correlation ID in the log if available
        const correlationIdStr = correlationId ? `[${correlationId}] ` : '';
        
        // Stringify metadata if present, excluding handled fields
        const metaStr = Object.keys(meta).length 
          ? ` ${JSON.stringify(meta, null, 2)}`
          : '';
          
        return `${timestamp} ${level}: ${correlationIdStr}${message}${metaStr}`;
      })
    );
  }
  
  // Production: JSON format with additional metadata for easier querying
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Include error stack traces
    winston.format((info) => {
      // Add service name to all logs for service identification
      info.service = 'tribe-service';
      
      // Add environment for filtering logs by environment
      info.environment = env.NODE_ENV;
      
      return info;
    })(),
    winston.format.json()
  );
}

/**
 * Configures the logging transports based on environment and configuration.
 * 
 * - Console transport: Always enabled for development, configurable for production
 * - File transport: Enabled for production with separate error and combined logs
 * 
 * @returns Array of configured Winston transports
 */
function getTransports(): winston.transport[] {
  const transports: winston.transport[] = [];
  
  // Console transport - useful for local development and container logs
  if (enableConsoleLogging) {
    transports.push(
      new winston.transports.Console({
        format: getLogFormat()
      })
    );
  }
  
  // File transport - primarily for production environments
  // Creates separate logs for errors and combined logs
  if (enableFileLogging) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logFilePath, 'error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 10, // Keep last 10 files
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }),
      new winston.transports.File({
        filename: path.join(logFilePath, 'combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 10, // Keep last 10 files
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }
  
  return transports;
}

// Define configuration values for transports
const enableConsoleLogging = true; // Always enable console logging for local development and container logs
const enableFileLogging = env.NODE_ENV === 'production'; // Only enable file logging in production
const logFilePath = path.resolve(process.cwd(), 'logs');

/**
 * Centralized logging configuration for the Tribe platform.
 * This configuration ensures consistent logging behavior across all microservices.
 */
const loggingConfig: LoggingConfig = {
  level: getLogLevel(),
  format: getLogFormat(),
  transports: getTransports(),
  serviceName: 'tribe-service',
  enableConsoleLogging,
  enableFileLogging,
  logFilePath,
  httpLogging: {
    // Use 'combined' format for detailed HTTP request logging including IP, method, URL, status, etc.
    format: 'combined',
    // Skip health check endpoints to reduce noise in logs
    skip: (req, res) => {
      return req.url === '/health' || req.url === '/health/live' || req.url === '/health/ready';
    }
  }
};

export default loggingConfig;