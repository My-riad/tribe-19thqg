import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { 
  ApiResponse, 
  PaginatedResponse, 
  PaginationParams 
} from '../types/api.types';
import {
  Tribe,
  TribeMember,
  TribeActivity,
  TribeGoal,
  TribeEngagementMetrics,
  CreateTribeRequest,
  UpdateTribeRequest,
  JoinTribeRequest,
  InviteMemberRequest,
  TribeSearchFilters,
  CreateTribeGoalRequest,
  UpdateTribeGoalRequest
} from '../types/tribe.types';

/**
 * Fetches all tribes that the current user is a member of
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated list of user's tribes
 */
const getUserTribes = async (
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Tribe>>> => {
  const params = paginationParams ? { ...paginationParams } : {};
  return httpClient.get(API_PATHS.TRIBE.GET_ALL, params);
};

/**
 * Fetches a specific tribe by its ID
 * @param tribeId ID of the tribe to retrieve
 * @returns Promise resolving to the tribe data
 */
const getTribeById = async (
  tribeId: string
): Promise<ApiResponse<Tribe>> => {
  const url = API_PATHS.TRIBE.GET_BY_ID.replace(':id', tribeId);
  return httpClient.get(url);
};

/**
 * Creates a new tribe with the provided data
 * @param tribeData Data for the new tribe
 * @returns Promise resolving to the created tribe data
 */
const createTribe = async (
  tribeData: CreateTribeRequest
): Promise<ApiResponse<Tribe>> => {
  return httpClient.post(API_PATHS.TRIBE.CREATE, tribeData);
};

/**
 * Updates an existing tribe with new information
 * @param tribeId ID of the tribe to update
 * @param tribeData Updated tribe data
 * @returns Promise resolving to the updated tribe data
 */
const updateTribe = async (
  tribeId: string,
  tribeData: UpdateTribeRequest
): Promise<ApiResponse<Tribe>> => {
  const url = API_PATHS.TRIBE.UPDATE.replace(':id', tribeId);
  return httpClient.put(url, tribeData);
};

/**
 * Deletes a tribe by its ID
 * @param tribeId ID of the tribe to delete
 * @returns Promise resolving to success status
 */
const deleteTribe = async (
  tribeId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = API_PATHS.TRIBE.DELETE.replace(':id', tribeId);
  return httpClient.delete(url);
};

/**
 * Searches for tribes based on provided filters
 * @param filters Search filters
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated search results
 */
const searchTribes = async (
  filters: TribeSearchFilters,
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Tribe>>> => {
  const params = { ...filters, ...(paginationParams || {}) };
  return httpClient.get(API_PATHS.TRIBE.GET_ALL, params);
};

/**
 * Fetches all members of a specific tribe
 * @param tribeId ID of the tribe
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated list of tribe members
 */
const getTribeMembers = async (
  tribeId: string,
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<TribeMember>>> => {
  const url = API_PATHS.TRIBE.MEMBERS.replace(':id', tribeId);
  const params = paginationParams ? { ...paginationParams } : {};
  return httpClient.get(url, params);
};

/**
 * Sends a request to join a tribe
 * @param joinRequest Join request data
 * @returns Promise resolving to the created tribe membership
 */
const joinTribe = async (
  joinRequest: JoinTribeRequest
): Promise<ApiResponse<TribeMember>> => {
  const url = API_PATHS.TRIBE.MEMBERS.replace(':id', joinRequest.tribeId);
  return httpClient.post(url, joinRequest);
};

/**
 * Invites a user to join a tribe
 * @param inviteRequest Invitation request data
 * @returns Promise resolving to the created tribe membership invitation
 */
const inviteMember = async (
  inviteRequest: InviteMemberRequest
): Promise<ApiResponse<TribeMember>> => {
  const url = API_PATHS.TRIBE.MEMBERS.replace(':id', inviteRequest.tribeId);
  return httpClient.post(url, inviteRequest);
};

/**
 * Removes a member from a tribe
 * @param tribeId ID of the tribe
 * @param userId ID of the user to remove
 * @returns Promise resolving to success status
 */
const removeMember = async (
  tribeId: string,
  userId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = API_PATHS.TRIBE.MEMBER
    .replace(':id', tribeId)
    .replace(':userId', userId);
  return httpClient.delete(url);
};

/**
 * Allows the current user to leave a tribe
 * @param tribeId ID of the tribe to leave
 * @returns Promise resolving to success status
 */
const leaveTribe = async (
  tribeId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = API_PATHS.TRIBE.MEMBERS.replace(':id', tribeId);
  return httpClient.delete(url);
};

/**
 * Fetches activity history for a specific tribe
 * @param tribeId ID of the tribe
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated activity history
 */
const getTribeActivity = async (
  tribeId: string,
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<TribeActivity>>> => {
  const url = API_PATHS.TRIBE.ACTIVITY.replace(':id', tribeId);
  const params = paginationParams ? { ...paginationParams } : {};
  return httpClient.get(url, params);
};

/**
 * Fetches chat messages for a specific tribe
 * @param tribeId ID of the tribe
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated chat messages
 */
const getTribeChat = async (
  tribeId: string,
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<any>>> => {
  const url = API_PATHS.TRIBE.CHAT.replace(':id', tribeId);
  const params = paginationParams ? { ...paginationParams } : {};
  return httpClient.get(url, params);
};

/**
 * Sends a chat message to a tribe
 * @param tribeId ID of the tribe
 * @param messageData Message content and metadata
 * @returns Promise resolving to the sent message data
 */
const sendChatMessage = async (
  tribeId: string,
  messageData: { content: string; messageType?: string }
): Promise<ApiResponse<any>> => {
  const url = API_PATHS.TRIBE.CHAT.replace(':id', tribeId);
  return httpClient.post(url, messageData);
};

/**
 * Fetches goals for a specific tribe
 * @param tribeId ID of the tribe
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated tribe goals
 */
const getTribeGoals = async (
  tribeId: string,
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<TribeGoal>>> => {
  const url = `${API_PATHS.TRIBE.BASE}/${tribeId}/goals`;
  const params = paginationParams ? { ...paginationParams } : {};
  return httpClient.get(url, params);
};

/**
 * Creates a new goal for a tribe
 * @param goalData Goal creation data
 * @returns Promise resolving to the created goal data
 */
const createTribeGoal = async (
  goalData: CreateTribeGoalRequest
): Promise<ApiResponse<TribeGoal>> => {
  const url = `${API_PATHS.TRIBE.BASE}/${goalData.tribeId}/goals`;
  return httpClient.post(url, goalData);
};

/**
 * Updates an existing tribe goal
 * @param tribeId ID of the tribe
 * @param goalId ID of the goal to update
 * @param goalData Updated goal data
 * @returns Promise resolving to the updated goal data
 */
const updateTribeGoal = async (
  tribeId: string,
  goalId: string,
  goalData: UpdateTribeGoalRequest
): Promise<ApiResponse<TribeGoal>> => {
  const url = `${API_PATHS.TRIBE.BASE}/${tribeId}/goals/${goalId}`;
  return httpClient.put(url, goalData);
};

/**
 * Deletes a tribe goal
 * @param tribeId ID of the tribe
 * @param goalId ID of the goal to delete
 * @returns Promise resolving to success status
 */
const deleteTribeGoal = async (
  tribeId: string,
  goalId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = `${API_PATHS.TRIBE.BASE}/${tribeId}/goals/${goalId}`;
  return httpClient.delete(url);
};

/**
 * Fetches engagement metrics for a specific tribe
 * @param tribeId ID of the tribe
 * @returns Promise resolving to tribe engagement metrics
 */
const getTribeEngagementMetrics = async (
  tribeId: string
): Promise<ApiResponse<TribeEngagementMetrics>> => {
  const url = `${API_PATHS.TRIBE.BASE}/${tribeId}/engagement`;
  return httpClient.get(url);
};

/**
 * Fetches AI-suggested tribes for the current user
 * @param paginationParams Optional pagination parameters
 * @returns Promise resolving to paginated suggested tribes
 */
const getSuggestedTribes = async (
  paginationParams?: PaginationParams
): Promise<ApiResponse<PaginatedResponse<Tribe>>> => {
  const params = paginationParams ? { ...paginationParams } : {};
  return httpClient.get(`${API_PATHS.MATCHING.SUGGESTIONS}`, params);
};

export const tribeApi = {
  getUserTribes,
  getTribeById,
  createTribe,
  updateTribe,
  deleteTribe,
  searchTribes,
  getTribeMembers,
  joinTribe,
  inviteMember,
  removeMember,
  leaveTribe,
  getTribeActivity,
  getTribeChat,
  sendChatMessage,
  getTribeGoals,
  createTribeGoal,
  updateTribeGoal,
  deleteTribeGoal,
  getTribeEngagementMetrics,
  getSuggestedTribes
};