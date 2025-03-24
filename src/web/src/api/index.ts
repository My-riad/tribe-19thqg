/**
 * Central export file for all API-related functionality in the Tribe application.
 * This file aggregates and re-exports API clients for various services,
 * providing a unified entry point for all backend API interactions throughout the application.
 * 
 * Import any API client from this file rather than directly from individual modules
 * to ensure consistent access patterns and easier refactoring.
 */

import { httpClient, TokenManager } from './httpClient';
import { socketClient, SocketEvents } from './socketClient';
import { authApi } from './authApi';
import { profileApi } from './profileApi';
import { tribeApi } from './tribeApi';
import { eventApi } from './eventApi';
import { matchingApi } from './matchingApi';
import { notificationApi } from './notificationApi';
import { paymentApi } from './paymentApi';
import { planningApi } from './planningApi';
import { engagementApi } from './engagementApi';
import { aiApi } from './aiApi';

/**
 * Initializes all API clients and sets up authentication
 * This function should be called early in the application lifecycle
 * to ensure all API services are properly configured before use.
 * 
 * @returns Promise that resolves when all API clients are initialized
 */
const initializeApi = async (): Promise<void> => {
  // Initialize auth API first as it handles token management for all other services
  authApi.initializeAuthApi();
  
  // Additional initialization steps can be added here as needed
  // For example, initializing the socket client for real-time communication
  // await socketClient.initialize();
};

// Export all API clients and utilities for application-wide use
export {
  httpClient,
  TokenManager,
  socketClient,
  SocketEvents,
  authApi,
  profileApi,
  tribeApi,
  eventApi,
  matchingApi,
  notificationApi,
  paymentApi,
  planningApi,
  engagementApi,
  aiApi,
  initializeApi
};