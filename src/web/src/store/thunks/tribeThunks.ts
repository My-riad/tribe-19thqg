import { createAsyncThunk } from '@reduxjs/toolkit';
import { tribeApi } from '../../api/tribeApi';
import { tribeActions } from '../slices/tribeSlice';
import { RootState } from '../store';
import { 
  Tribe, 
  TribeMember, 
  TribeActivity, 
  TribeEngagementMetrics,
  CreateTribeRequest,
  UpdateTribeRequest,
  JoinTribeRequest,
  TribeSearchFilters
} from '../../types/tribe.types';
import { 
  PaginationParams, 
  ApiResponse, 
  PaginatedResponse 
} from '../../types/api.types';

/**
 * Fetches all tribes that the current user is a member of
 * @param paginationParams Optional pagination parameters
 * @returns Normalized tribes with entities and ids
 */
export const fetchTribes = createAsyncThunk(
  'tribes/fetchTribes',
  async (paginationParams?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await tribeApi.getUserTribes(paginationParams);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      const tribes = response.data.items;
      const normalizedTribes = normalizeTribes(tribes);
      
      return {
        entities: normalizedTribes.entities,
        userTribes: normalizedTribes.ids
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tribes');
    }
  }
);

/**
 * Fetches AI-suggested tribes for the current user
 * @param paginationParams Optional pagination parameters
 * @returns Normalized suggested tribes with entities and ids
 */
export const fetchSuggestedTribes = createAsyncThunk(
  'tribes/fetchSuggestedTribes',
  async (paginationParams?: PaginationParams, { rejectWithValue }) => {
    try {
      const response = await tribeApi.getSuggestedTribes(paginationParams);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      const tribes = response.data.items;
      const normalizedTribes = normalizeTribes(tribes);
      
      return {
        entities: normalizedTribes.entities,
        suggestedTribes: normalizedTribes.ids
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch suggested tribes');
    }
  }
);

/**
 * Fetches a specific tribe by its ID
 * @param tribeId ID of the tribe to fetch
 * @returns Tribe data
 */
export const fetchTribe = createAsyncThunk(
  'tribes/fetchTribe',
  async (tribeId: string, { rejectWithValue }) => {
    try {
      const response = await tribeApi.getTribeById(tribeId);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tribe');
    }
  }
);

/**
 * Creates a new tribe with the provided data
 * @param tribeData Data for the new tribe
 * @returns Created tribe
 */
export const createTribe = createAsyncThunk(
  'tribes/createTribe',
  async (tribeData: CreateTribeRequest, { rejectWithValue }) => {
    try {
      const response = await tribeApi.createTribe(tribeData);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create tribe');
    }
  }
);

/**
 * Updates an existing tribe with new information
 * @param params Object containing tribeId and tribeData
 * @returns Updated tribe
 */
export const updateTribe = createAsyncThunk(
  'tribes/updateTribe',
  async (params: { tribeId: string; tribeData: UpdateTribeRequest }, { rejectWithValue }) => {
    try {
      const { tribeId, tribeData } = params;
      const response = await tribeApi.updateTribe(tribeId, tribeData);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update tribe');
    }
  }
);

/**
 * Deletes a tribe by its ID
 * @param tribeId ID of the tribe to delete
 * @returns The deleted tribe ID
 */
export const deleteTribe = createAsyncThunk(
  'tribes/deleteTribe',
  async (tribeId: string, { rejectWithValue }) => {
    try {
      const response = await tribeApi.deleteTribe(tribeId);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return tribeId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete tribe');
    }
  }
);

/**
 * Searches for tribes based on provided filters
 * @param params Object containing filters and optional pagination parameters
 * @returns Normalized search results with entities and ids
 */
export const searchTribes = createAsyncThunk(
  'tribes/searchTribes',
  async (params: { filters: TribeSearchFilters; paginationParams?: PaginationParams }, { rejectWithValue }) => {
    try {
      const { filters, paginationParams } = params;
      const response = await tribeApi.searchTribes(filters, paginationParams);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      const tribes = response.data.items;
      const normalizedTribes = normalizeTribes(tribes);
      
      return {
        entities: normalizedTribes.entities,
        searchResults: normalizedTribes.ids
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search tribes');
    }
  }
);

/**
 * Fetches all members of a specific tribe
 * @param params Object containing tribeId and optional pagination parameters
 * @returns Paginated list of tribe members
 */
export const fetchTribeMembers = createAsyncThunk(
  'tribes/fetchTribeMembers',
  async (params: { tribeId: string; paginationParams?: PaginationParams }, { rejectWithValue }) => {
    try {
      const { tribeId, paginationParams } = params;
      const response = await tribeApi.getTribeMembers(tribeId, paginationParams);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tribe members');
    }
  }
);

/**
 * Sends a request to join a tribe
 * @param joinRequest Join request data
 * @returns The tribe membership data
 */
export const joinTribe = createAsyncThunk(
  'tribes/joinTribe',
  async (joinRequest: JoinTribeRequest, { rejectWithValue }) => {
    try {
      const response = await tribeApi.joinTribe(joinRequest);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to join tribe');
    }
  }
);

/**
 * Allows the current user to leave a tribe
 * @param tribeId ID of the tribe to leave
 * @returns The tribe ID that was left
 */
export const leaveTribe = createAsyncThunk(
  'tribes/leaveTribe',
  async (tribeId: string, { rejectWithValue }) => {
    try {
      const response = await tribeApi.leaveTribe(tribeId);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return tribeId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to leave tribe');
    }
  }
);

/**
 * Fetches activity history for a specific tribe
 * @param params Object containing tribeId and optional pagination parameters
 * @returns Paginated list of tribe activities
 */
export const fetchTribeActivity = createAsyncThunk(
  'tribes/fetchTribeActivity',
  async (params: { tribeId: string; paginationParams?: PaginationParams }, { rejectWithValue }) => {
    try {
      const { tribeId, paginationParams } = params;
      const response = await tribeApi.getTribeActivity(tribeId, paginationParams);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tribe activity');
    }
  }
);

/**
 * Fetches engagement metrics for a specific tribe
 * @param tribeId ID of the tribe
 * @returns Tribe engagement metrics
 */
export const fetchTribeEngagementMetrics = createAsyncThunk(
  'tribes/fetchTribeEngagementMetrics',
  async (tribeId: string, { rejectWithValue }) => {
    try {
      const response = await tribeApi.getTribeEngagementMetrics(tribeId);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tribe engagement metrics');
    }
  }
);

/**
 * Sets the currently active tribe in the Redux store
 * @param tribeId ID of the tribe to set as active, or null to clear
 */
export const setActiveTribe = (tribeId: string | null) => {
  return async (dispatch: any) => {
    dispatch(tribeActions.setCurrentTribe(tribeId));
    
    if (tribeId) {
      dispatch(fetchTribe(tribeId));
    }
  };
};

/**
 * Clears any tribe-related errors in the Redux store
 */
export const clearTribeErrors = () => {
  return (dispatch: any) => {
    dispatch(tribeActions.clearTribeError());
  };
};

/**
 * Helper function to normalize an array of tribes into a lookup object
 * @param tribes Array of tribes to normalize
 * @returns Normalized structure with entities and ids
 */
export const normalizeTribes = (tribes: Tribe[]) => {
  const entities: Record<string, Tribe> = {};
  const ids: string[] = [];
  
  tribes.forEach(tribe => {
    entities[tribe.id] = tribe;
    ids.push(tribe.id);
  });
  
  return { entities, ids };
};