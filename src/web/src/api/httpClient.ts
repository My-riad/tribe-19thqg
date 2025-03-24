import axios from 'axios'; // axios v1.4.0
import axiosRetry from 'axios-retry'; // axios-retry v3.5.0
import { API_PATHS } from '../constants/apiPaths';
import { CONFIG } from '../constants/config';
import { 
  ApiResponse, 
  ApiError, 
  ApiRequestConfig, 
  HttpMethod, 
  ErrorCode
} from '../types/api.types';
import { offlineService } from '../services/offlineService';

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: CONFIG.API.BASE_URL,
  timeout: CONFIG.API.TIMEOUT
});

// Reference to token manager implementation
let tokenManager: TokenManager | null = null;

/**
 * Interface for token management that can be implemented by auth services
 */
export interface TokenManager {
  /**
   * Gets the currently stored authentication tokens
   * @returns Promise resolving to auth tokens or null if not authenticated
   */
  getStoredTokens: () => Promise<{ accessToken: string; refreshToken: string } | null>;
  
  /**
   * Refreshes authentication tokens using the refresh token
   * @returns Promise resolving to new tokens or null if refresh failed
   */
  refreshTokens: () => Promise<{ accessToken: string; refreshToken: string } | null>;
}

/**
 * Sets up request and response interceptors for the axios instance
 */
const setupInterceptors = (): void => {
  // Clear any existing interceptors
  axiosInstance.interceptors.request.clear();
  axiosInstance.interceptors.response.clear();
  
  // Request interceptor for adding auth headers
  axiosInstance.interceptors.request.use(
    async (config) => {
      // If token manager is available, get the access token
      if (tokenManager) {
        const tokens = await tokenManager.getStoredTokens();
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor for handling auth errors and standardizing responses
  axiosInstance.interceptors.response.use(
    (response) => {
      // Transform successful response to standardized format if needed
      const data = response.data;
      
      // If response is already in our standard format, return it
      if (data && 'success' in data && 'data' in data && 'message' in data) {
        return response;
      }
      
      // Otherwise, transform to standard format
      const standardResponse = {
        success: true,
        data: data,
        message: 'Success',
        timestamp: Date.now()
      };
      
      response.data = standardResponse;
      return response;
    },
    async (error) => {
      // Handle authentication errors
      if (
        error.response && 
        error.response.status === 401 && 
        tokenManager && 
        !error.config.__isRetry
      ) {
        try {
          // Try to refresh the token
          const newTokens = await tokenManager.refreshTokens();
          if (newTokens) {
            // Retry the original request with new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            originalRequest.__isRetry = true;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Token refresh failed, reject with original error
          return Promise.reject(error);
        }
      }
      
      // For other errors, standardize and reject
      return Promise.reject(createApiError(error));
    }
  );
};

/**
 * Creates a standardized API error object from various error sources
 * @param error The original error
 * @returns Standardized ApiError object
 */
const createApiError = (error: any): ApiError => {
  let code = ErrorCode.SERVER_ERROR;
  let message = 'An unexpected error occurred';
  let details: Record<string, any> = {};
  
  if (error.response) {
    // Server responded with a non-2xx status
    const status = error.response.status;
    const data = error.response.data;
    
    // Extract error details from response data if available
    if (data) {
      if (data.message) message = data.message;
      if (data.details) details = data.details;
      if (data.code) code = data.code;
    }
    
    // Set appropriate error code based on status
    if (status === 401) code = ErrorCode.UNAUTHORIZED;
    else if (status === 403) code = ErrorCode.FORBIDDEN;
    else if (status === 404) code = ErrorCode.NOT_FOUND;
    else if (status >= 400 && status < 500) code = ErrorCode.VALIDATION_ERROR;
    else if (status >= 500) code = ErrorCode.SERVER_ERROR;
  } else if (error.request) {
    // Request was made but no response received (network error)
    code = ErrorCode.NETWORK_ERROR;
    message = 'Network error. Please check your connection and try again.';
  } else if (error.code === 'ECONNABORTED') {
    // Request timeout
    code = ErrorCode.TIMEOUT_ERROR;
    message = 'Request timed out. Please try again.';
  } else {
    // Something else happened in setting up the request
    message = error.message || 'An unexpected error occurred';
  }
  
  return {
    code,
    message,
    details,
    timestamp: Date.now()
  };
};

/**
 * Makes an HTTP request to the API with standardized handling
 * @param config Request configuration
 * @returns Promise resolving to standardized API response
 */
const request = async <T>(config: ApiRequestConfig): Promise<ApiResponse<T>> => {
  // Check if device is offline
  if (offlineService.isOffline()) {
    // If request is queueable, add to offline queue
    if (config.offlineQueueable) {
      await offlineService.queueAction({
        type: 'API_REQUEST',
        payload: config
      });
      throw createApiError({
        code: ErrorCode.NETWORK_ERROR,
        message: 'Request queued for offline mode'
      });
    } else {
      // Not queueable, throw network error
      throw createApiError({
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network unavailable and request cannot be queued'
      });
    }
  }
  
  // Apply retry configuration for transient errors
  const retryCount = config.maxRetries ?? CONFIG.API.RETRY_ATTEMPTS;
  if (retryCount > 0) {
    axiosRetry(axiosInstance, {
      retries: retryCount,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Only retry on network errors and server errors (5xx)
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
          (error.response?.status >= 500 && error.response?.status < 600);
      }
    });
  }
  
  try {
    const response = await axiosInstance(config);
    return response.data;
  } catch (error) {
    throw createApiError(error);
  }
};

/**
 * Makes a GET request to the API
 * @param url The request URL
 * @param params Optional query parameters
 * @param config Optional request configuration
 * @returns Promise resolving to standardized API response
 */
const get = async <T>(
  url: string,
  params: Record<string, any> = {},
  config: Partial<ApiRequestConfig> = {}
): Promise<ApiResponse<T>> => {
  return request<T>({
    url,
    method: HttpMethod.GET,
    params,
    ...config
  });
};

/**
 * Makes a POST request to the API
 * @param url The request URL
 * @param data Request payload
 * @param config Optional request configuration
 * @returns Promise resolving to standardized API response
 */
const post = async <T>(
  url: string,
  data: any,
  config: Partial<ApiRequestConfig> = {}
): Promise<ApiResponse<T>> => {
  return request<T>({
    url,
    method: HttpMethod.POST,
    data,
    ...config
  });
};

/**
 * Makes a PUT request to the API
 * @param url The request URL
 * @param data Request payload
 * @param config Optional request configuration
 * @returns Promise resolving to standardized API response
 */
const put = async <T>(
  url: string,
  data: any,
  config: Partial<ApiRequestConfig> = {}
): Promise<ApiResponse<T>> => {
  return request<T>({
    url,
    method: HttpMethod.PUT,
    data,
    ...config
  });
};

/**
 * Makes a PATCH request to the API
 * @param url The request URL
 * @param data Request payload
 * @param config Optional request configuration
 * @returns Promise resolving to standardized API response
 */
const patch = async <T>(
  url: string,
  data: any,
  config: Partial<ApiRequestConfig> = {}
): Promise<ApiResponse<T>> => {
  return request<T>({
    url,
    method: HttpMethod.PATCH,
    data,
    ...config
  });
};

/**
 * Makes a DELETE request to the API
 * @param url The request URL
 * @param config Optional request configuration
 * @returns Promise resolving to standardized API response
 */
const deleteRequest = async <T>(
  url: string,
  config: Partial<ApiRequestConfig> = {}
): Promise<ApiResponse<T>> => {
  return request<T>({
    url,
    method: HttpMethod.DELETE,
    ...config
  });
};

/**
 * Type guard to check if an object is an ApiError
 * @param error The error to check
 * @returns True if the error is an ApiError, false otherwise
 */
const isApiError = (error: any): error is ApiError => {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    'details' in error &&
    'timestamp' in error
  );
};

/**
 * Updates the base URL for API requests
 * @param baseUrl The new base URL
 */
const setBaseUrl = (baseUrl: string): void => {
  axiosInstance.defaults.baseURL = baseUrl;
};

/**
 * Updates the default timeout for API requests
 * @param timeout The new timeout in milliseconds
 */
const setTimeout = (timeout: number): void => {
  axiosInstance.defaults.timeout = timeout;
};

/**
 * Sets the token manager implementation for authentication
 * @param manager The token manager implementation
 */
const setTokenManager = (manager: TokenManager): void => {
  tokenManager = manager;
  setupInterceptors();
};

// Initialize interceptors
setupInterceptors();

// Export the httpClient object with all functions
export const httpClient = {
  get,
  post,
  put,
  patch,
  delete: deleteRequest, // Renamed because 'delete' is a reserved keyword
  request,
  isApiError,
  setBaseUrl,
  setTimeout,
  setTokenManager
};