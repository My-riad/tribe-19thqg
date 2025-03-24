import { useEffect, useCallback } from 'react'; // react ^18.2.0
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchTribes,
  fetchTribe,
  createTribe,
  updateTribe,
  searchTribes,
  joinTribe,
  leaveTribe,
  fetchTribeMembers,
  fetchTribeActivity,
  fetchTribeEngagementMetrics
} from '../store/thunks/tribeThunks';
import { 
  tribeActions, 
  selectTribes,
  selectUserTribes,
  selectSuggestedTribes,
  selectCurrentTribe,
  selectTribeLoading,
  selectTribeError,
  selectTribeCreationStatus
} from '../store/slices/tribeSlice';
import {
  Tribe,
  TribeMember,
  TribeActivity,
  TribeEngagementMetrics,
  CreateTribeRequest,
  UpdateTribeRequest,
  TribeSearchFilters
} from '../types/tribe.types';
import { LoadingStatus } from '../types/state.types';

/**
 * Custom hook that provides tribe-related functionality throughout the application
 * @returns Tribe context object with tribe state and tribe management methods
 */
const useTribes = () => {
  const dispatch = useAppDispatch();
  
  // Select tribe state from Redux store using selectors
  const tribes = useAppSelector(selectTribes);
  const userTribes = useAppSelector(selectUserTribes);
  const suggestedTribes = useAppSelector(selectSuggestedTribes);
  const currentTribe = useAppSelector(selectCurrentTribe);
  const loading = useAppSelector(selectTribeLoading);
  const error = useAppSelector(selectTribeError);
  const tribeCreationStatus = useAppSelector(selectTribeCreationStatus);
  
  // Tribe data fetching methods
  const getUserTribes = useCallback(() => {
    dispatch(fetchTribes());
  }, [dispatch]);
  
  const getTribeById = useCallback((tribeId: string) => {
    dispatch(fetchTribe(tribeId));
  }, [dispatch]);
  
  const getTribeMembers = useCallback((tribeId: string) => {
    return dispatch(fetchTribeMembers({ tribeId }));
  }, [dispatch]);
  
  const getTribeActivity = useCallback((tribeId: string) => {
    return dispatch(fetchTribeActivity({ tribeId }));
  }, [dispatch]);
  
  const getTribeEngagement = useCallback((tribeId: string) => {
    return dispatch(fetchTribeEngagementMetrics(tribeId));
  }, [dispatch]);
  
  // Tribe management methods
  const createNewTribe = useCallback((tribeData: CreateTribeRequest) => {
    return dispatch(createTribe(tribeData));
  }, [dispatch]);
  
  const updateExistingTribe = useCallback((tribeId: string, tribeData: UpdateTribeRequest) => {
    return dispatch(updateTribe({ tribeId, tribeData }));
  }, [dispatch]);
  
  const searchForTribes = useCallback((filters: TribeSearchFilters) => {
    return dispatch(searchTribes({ filters }));
  }, [dispatch]);
  
  const joinExistingTribe = useCallback((tribeId: string, message: string = '') => {
    return dispatch(joinTribe({ tribeId, message }));
  }, [dispatch]);
  
  const leaveCurrentTribe = useCallback((tribeId: string) => {
    return dispatch(leaveTribe(tribeId));
  }, [dispatch]);
  
  // State management methods
  const setActiveTribe = useCallback((tribeId: string | null) => {
    dispatch(tribeActions.setCurrentTribe(tribeId));
  }, [dispatch]);
  
  const clearError = useCallback(() => {
    dispatch(tribeActions.clearTribeError());
  }, [dispatch]);
  
  const resetCreationStatus = useCallback(() => {
    dispatch(tribeActions.resetTribeCreationStatus());
  }, [dispatch]);
  
  // Fetch user tribes on mount
  useEffect(() => {
    getUserTribes();
  }, [getUserTribes]);
  
  // Return the tribe context object
  return {
    // State
    tribes,
    userTribes,
    suggestedTribes,
    currentTribe,
    loading,
    error,
    tribeCreationStatus,
    
    // Data fetching methods
    getUserTribes,
    getTribeById,
    getTribeMembers,
    getTribeActivity,
    getTribeEngagement,
    
    // Tribe management methods
    createNewTribe,
    updateExistingTribe,
    searchForTribes,
    joinExistingTribe,
    leaveCurrentTribe,
    
    // State management methods
    setActiveTribe,
    clearError,
    resetCreationStatus
  };
};

export default useTribes;