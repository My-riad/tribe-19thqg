/**
 * Centralized logging utility for the Tribe platform.
 * 
 * Provides consistent logging capabilities across all microservices with
 * structured JSON logging, correlation IDs, and configurable log levels.
 * 
 * @module logger.util
 */

import * as winston from 'winston'; // ^3.8.2
import * as morgan from 'morgan'; // ^1.10.0
import * as split from 'split'; // ^1.0.1
import loggingConfig from '../../../config/logging';

/**
 * Options for configuring a Logger instance
 */
export interface LoggerOptions {
  /** Minimum log level to record (debug, info, warn, error) */
  level?: string;
  /** Name of the service for identification in logs */
  serviceName?: string;
  /** Default metadata to include with all log entries */
  defaultMeta?: Record<string, any>;
  /** Winston transport configurations */
  transports?: winston.transport[];
}

/**
 * Options for configuring HTTP request logging
 */
export interface HttpLoggerOptions {
  /** Morgan format string */
  format?: string;
  /** Function to determine which requests to skip logging */
  skip?: (req: any, res: any) => boolean;
}

/**
 * Creates and configures a Winston logger instance with the specified options
 * 
 * @param options - Configuration options for the logger
 * @returns Configured Winston logger instance
 */
export const createLogger = (options: Partial<LoggerOptions> = {}): winston.Logger => {
  // Merge provided options with default configuration
  const level = options.level || loggingConfig.level;
  const transports = options.transports || loggingConfig.transports;
  const defaultMeta = options.defaultMeta || {};
  
  // Create and return the Winston logger instance
  return winston.createLogger({
    level,
    format: loggingConfig.format,
    defaultMeta: {
      service: options.serviceName || loggingConfig.serviceName,
      ...defaultMeta
    },
    transports,
    // Exit on error: false ensures the logger doesn't crash the application
    exitOnError: false
  });
};

/**
 * Creates a Morgan HTTP request logger middleware configured to work with Winston
 * 
 * @param options - Configuration options for HTTP logging
 * @returns Configured Morgan middleware
 */
export const createHttpLogger = (options: Partial<HttpLoggerOptions> = {}) => {
  const httpConfig = loggingConfig.httpLogging;
  const format = options.format || httpConfig.format;
  const skip = options.skip || httpConfig.skip;
  
  // Create a Winston stream for Morgan
  const stream = {
    write: (message: string) => {
      // Remove trailing newline
      const logMessage = message.trim();
      
      // Log HTTP requests as info level
      logger.info(logMessage, { 
        type: 'http_request', 
        timestamp: new Date().toISOString() 
      });
    }
  };
  
  // Configure and return Morgan middleware
  return morgan(format, {
    stream,
    skip
  });
};

/**
 * Formats error objects for consistent logging across the application
 * 
 * @param error - The error object to format
 * @returns Formatted error object suitable for logging
 */
export const formatError = (error: Error): Record<string, any> => {
  if (!error) {
    return { message: 'Unknown error' };
  }

  // Basic error properties
  const formattedError: Record<string, any> = {
    name: error.name,
    message: error.message
  };

  // Include stack trace if available
  if (error.stack) {
    // Format stack trace for better readability
    formattedError.stack = error.stack
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  }

  // Include additional properties from the error object
  // This handles ApiError and other custom error classes
  Object.getOwnPropertyNames(error).forEach(key => {
    if (!['name', 'message', 'stack'].includes(key)) {
      formattedError[key] = (error as any)[key];
    }
  });

  return formattedError;
};

/**
 * Determines the appropriate log level based on configuration and environment
 * 
 * @returns Log level (debug, info, warn, error)
 */
export const getLogLevel = (): string => {
  return loggingConfig.level;
};

/**
 * Wrapper class around Winston logger that provides additional context and utility methods
 */
export class Logger {
  /** Winston logger instance */
  private logger: winston.Logger;
  /** Service name for identification in logs */
  private serviceName: string;
  /** Default metadata included with all log entries */
  private defaultMeta: Record<string, any>;

  /**
   * Initializes a new Logger instance with the specified options
   * 
   * @param options - Configuration options for the logger
   */
  constructor(options: Partial<LoggerOptions> = {}) {
    this.serviceName = options.serviceName || loggingConfig.serviceName;
    this.defaultMeta = options.defaultMeta || {};
    this.logger = createLogger({
      level: options.level,
      serviceName: this.serviceName,
      defaultMeta: this.defaultMeta,
      transports: options.transports
    });
  }

  /**
   * Logs a debug message with optional metadata
   * 
   * @param message - The message to log
   * @param meta - Additional metadata to include
   */
  debug(message: string, meta: Record<string, any> = {}): void {
    this.logger.debug(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Logs an info message with optional metadata
   * 
   * @param message - The message to log
   * @param meta - Additional metadata to include
   */
  info(message: string, meta: Record<string, any> = {}): void {
    this.logger.info(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Logs a warning message with optional metadata
   * 
   * @param message - The message to log
   * @param meta - Additional metadata to include
   */
  warn(message: string, meta: Record<string, any> = {}): void {
    this.logger.warn(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Logs an error message with error object and optional metadata
   * 
   * @param message - The error message
   * @param error - The error object
   * @param meta - Additional metadata to include
   */
  error(message: string, error?: Error, meta: Record<string, any> = {}): void {
    const errorData = error ? formatError(error) : {};
    this.logger.error(message, { 
      ...this.defaultMeta, 
      ...meta,
      error: errorData
    });
  }

  /**
   * Creates a new logger instance with additional context metadata
   * 
   * @param contextMeta - Additional context metadata
   * @returns New logger instance with merged context
   */
  withContext(contextMeta: Record<string, any>): Logger {
    return new Logger({
      serviceName: this.serviceName,
      defaultMeta: { ...this.defaultMeta, ...contextMeta }
    });
  }

  /**
   * Creates a child logger with additional metadata (Winston compatibility)
   * 
   * @param options - Options for the child logger
   * @returns Child logger instance
   */
  child(options: Record<string, any>): Logger {
    return this.withContext(options);
  }
}

/**
 * Default logger instance for use throughout the application
 */
export const logger = new Logger();