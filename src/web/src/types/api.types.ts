/**
 * TypeScript type definitions for API requests and responses used throughout the Tribe application.
 * This file provides standardized interfaces for HTTP communication, error handling, pagination,
 * and common API patterns to ensure consistency across the application.
 * 
 * @version 1.0.0
 */

import { User } from './auth.types';
import { Profile } from './profile.types';
import { TribeTypes } from './tribe.types';
import { EventTypes } from './event.types';

/**
 * Generic interface for all API responses with consistent structure
 * @template T The type of data contained in the response
 */
export interface ApiResponse<T> {
  /** Indicates whether the request was successful */
  success: boolean;
  /** The response payload */
  data: T;
  /** Human-readable message about the response */
  message: string;
  /** Server timestamp when the response was generated */
  timestamp: number;
}

/**
 * Standardized error structure for API error responses
 */
export interface ApiError {
  /** Standardized error code (see ErrorCode enum) */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context, field validation errors, etc. */
  details: Record<string, any>;
  /** Server timestamp when the error occurred */
  timestamp: number;
}

/**
 * Generic interface for paginated API responses
 * @template T The type of items being paginated
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
  /** Indicates if there are more pages after the current one */
  hasMore: boolean;
}

/**
 * Interface for pagination parameters in API requests
 */
export interface PaginationParams {
  /** Page number to retrieve (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Field to sort by */
  sortBy: string;
  /** Sort direction (ascending or descending) */
  sortDirection: SortDirection;
}

/**
 * Enum for sort direction in paginated requests
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Enum of available API endpoints for type safety
 */
export enum ApiEndpoints {
  AUTH = '/auth',
  PROFILE = '/profile',
  TRIBE = '/tribes',
  MATCHING = '/matching',
  EVENT = '/events',
  ENGAGEMENT = '/engagement',
  PLANNING = '/planning',
  PAYMENT = '/payment',
  NOTIFICATION = '/notifications',
  AI = '/ai'
}

/**
 * Enum of HTTP methods for type safety
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

/**
 * Enum of error codes for standardized error handling
 */
export enum ErrorCode {
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error'
}

/**
 * Configuration options for API requests
 */
export interface ApiRequestConfig {
  /** Request URL (can be relative or absolute) */
  url: string;
  /** HTTP method to use */
  method: HttpMethod;
  /** Request payload (for POST, PUT, PATCH) */
  data?: any;
  /** URL query parameters */
  params?: Record<string, any>;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to include credentials in cross-origin requests */
  withCredentials?: boolean;
  /** Expected response type */
  responseType?: string;
  /** Maximum number of automatic retry attempts */
  maxRetries?: number;
  /** Whether this request can be queued for offline retry */
  offlineQueueable?: boolean;
}

/**
 * Enum representing the status of an API request for UI state management
 */
export enum ApiStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Type alias for API response containing user data
 */
export type UserResponse = ApiResponse<User>;

/**
 * Type alias for API response containing profile data
 */
export type ProfileResponse = ApiResponse<Profile>;

/**
 * Type alias for API response containing tribe data
 */
export type TribeResponse = ApiResponse<TribeTypes.Tribe>;

/**
 * Type alias for API response containing event data
 */
export type EventResponse = ApiResponse<EventTypes.Event>;

/**
 * Type alias for paginated API response containing user data
 */
export type PaginatedUsersResponse = ApiResponse<PaginatedResponse<User>>;

/**
 * Type alias for paginated API response containing tribe data
 */
export type PaginatedTribesResponse = ApiResponse<PaginatedResponse<TribeTypes.Tribe>>;

/**
 * Type alias for paginated API response containing event data
 */
export type PaginatedEventsResponse = ApiResponse<PaginatedResponse<EventTypes.Event>>;

/**
 * Generic interface for tracking API request state in Redux store
 * @template T The type of data being requested
 */
export interface ApiState<T> {
  /** Current status of the API request */
  status: ApiStatus;
  /** Response data (null if request is not complete or failed) */
  data: T | null;
  /** Error information (null if request succeeded or is in progress) */
  error: ApiError | null;
  /** Timestamp of the last status update */
  timestamp: number;
}

/**
 * Interface for items in the offline request queue
 */
export interface OfflineQueueItem {
  /** Unique identifier for this queue item */
  id: string;
  /** The API request to be executed when online */
  request: ApiRequestConfig;
  /** Timestamp when the request was added to the queue */
  createdAt: number;
  /** Number of times this request has been retried */
  retryCount: number;
  /** Priority level for processing (higher numbers = higher priority) */
  priority: number;
}