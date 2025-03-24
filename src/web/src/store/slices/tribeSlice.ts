import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tribe, TribeMember, TribeActivity, TribeState } from '../../types/tribe.types';
import { TribesState, LoadingStatus } from '../../types/state.types';
import { registerReducer } from '../store';

/**
 * Initial state for the tribe slice
 * Contains normalized data structure for tribes with separate arrays for tribe IDs
 */
const initialState: TribeState = {
  tribes: {}, // Map of tribe IDs to tribe objects
  userTribes: [], // IDs of tribes the user belongs to
  suggestedTribes: [], // IDs of tribes suggested to the user
  activeTribe: null, // ID of currently selected tribe
  loading: false, // Loading status
  error: null, // Error message if any
  searchResults: [], // IDs of tribes from search
  searchLoading: false, // Loading status for search
  searchError: null, // Error message for search
  tribeCreationStatus: 'IDLE' // Status of tribe creation process
};

/**
 * Creates the tribe slice with reducers and actions
 * @returns The created Redux slice for tribe state
 */
const createTribeSlice = () => {
  return createSlice({
    name: 'tribes',
    initialState,
    reducers: {
      /**
       * Sets the current active tribe
       * @param state Current state
       * @param action Payload containing the tribe ID to set as active
       */
      setCurrentTribe(state, action: PayloadAction<string | null>) {
        state.activeTribe = action.payload;
      },
  
      /**
       * Clears all error messages in the tribe state
       * @param state Current state
       */
      clearTribeError(state) {
        state.error = null;
        state.searchError = null;
      },
  
      /**
       * Resets the tribe creation status to idle
       * @param state Current state
       */
      resetTribeCreationStatus(state) {
        state.tribeCreationStatus = 'IDLE';
      },
  
      /**
       * Adds a tribe to the user's tribes list
       * @param state Current state
       * @param action Payload containing the tribe ID to add
       */
      addTribeToUserTribes(state, action: PayloadAction<string>) {
        if (!state.userTribes.includes(action.payload)) {
          state.userTribes.push(action.payload);
        }
      },
  
      /**
       * Removes a tribe from the user's tribes list
       * @param state Current state
       * @param action Payload containing the tribe ID to remove
       */
      removeTribeFromUserTribes(state, action: PayloadAction<string>) {
        state.userTribes = state.userTribes.filter(id => id !== action.payload);
      },
  
      /**
       * Updates a tribe in the state
       * @param state Current state
       * @param action Payload containing the tribe object to update
       */
      updateTribeInState(state, action: PayloadAction<Tribe>) {
        const tribe = action.payload;
        state.tribes[tribe.id] = tribe;
      }
    },
    extraReducers: (builder) => {
      // Handle async thunk actions using string matchers to avoid circular dependencies
      
      // Matchers for fetchTribes
      builder
        .addMatcher(
          (action) => action.type === 'tribes/fetchTribes/pending',
          (state) => {
            state.loading = true;
            state.error = null;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/fetchTribes/fulfilled',
          (state, action) => {
            const tribesById: Record<string, Tribe> = {};
            action.payload.forEach((tribe: Tribe) => {
              tribesById[tribe.id] = tribe;
            });
            state.tribes = tribesById;
            state.loading = false;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/fetchTribes/rejected',
          (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch tribes';
          }
        );
      
      // Matchers for fetchUserTribes
      builder
        .addMatcher(
          (action) => action.type === 'tribes/fetchUserTribes/pending',
          (state) => {
            state.loading = true;
            state.error = null;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/fetchUserTribes/fulfilled',
          (state, action) => {
            const tribesById: Record<string, Tribe> = { ...state.tribes };
            const userTribeIds: string[] = [];
            
            action.payload.forEach((tribe: Tribe) => {
              tribesById[tribe.id] = tribe;
              userTribeIds.push(tribe.id);
            });
            
            state.tribes = tribesById;
            state.userTribes = userTribeIds;
            state.loading = false;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/fetchUserTribes/rejected',
          (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch user tribes';
          }
        );
      
      // Matchers for fetchSuggestedTribes
      builder
        .addMatcher(
          (action) => action.type === 'tribes/fetchSuggestedTribes/pending',
          (state) => {
            state.loading = true;
            state.error = null;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/fetchSuggestedTribes/fulfilled',
          (state, action) => {
            const tribesById: Record<string, Tribe> = { ...state.tribes };
            const suggestedTribeIds: string[] = [];
            
            action.payload.forEach((tribe: Tribe) => {
              tribesById[tribe.id] = tribe;
              suggestedTribeIds.push(tribe.id);
            });
            
            state.tribes = tribesById;
            state.suggestedTribes = suggestedTribeIds;
            state.loading = false;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/fetchSuggestedTribes/rejected',
          (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch suggested tribes';
          }
        );
      
      // Matchers for createTribe
      builder
        .addMatcher(
          (action) => action.type === 'tribes/createTribe/pending',
          (state) => {
            state.tribeCreationStatus = 'LOADING';
            state.error = null;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/createTribe/fulfilled',
          (state, action) => {
            const tribe = action.payload;
            state.tribes[tribe.id] = tribe;
            state.userTribes.push(tribe.id);
            state.activeTribe = tribe.id;
            state.tribeCreationStatus = 'SUCCESS';
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/createTribe/rejected',
          (state, action) => {
            state.tribeCreationStatus = 'ERROR';
            state.error = action.error.message || 'Failed to create tribe';
          }
        );
      
      // Matchers for searchTribes
      builder
        .addMatcher(
          (action) => action.type === 'tribes/searchTribes/pending',
          (state) => {
            state.searchLoading = true;
            state.searchError = null;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/searchTribes/fulfilled',
          (state, action) => {
            const tribesById: Record<string, Tribe> = { ...state.tribes };
            const searchResultIds: string[] = [];
            
            action.payload.forEach((tribe: Tribe) => {
              tribesById[tribe.id] = tribe;
              searchResultIds.push(tribe.id);
            });
            
            state.tribes = tribesById;
            state.searchResults = searchResultIds;
            state.searchLoading = false;
          }
        )
        .addMatcher(
          (action) => action.type === 'tribes/searchTribes/rejected',
          (state, action) => {
            state.searchLoading = false;
            state.searchError = action.error.message || 'Failed to search tribes';
          }
        );
    }
  });
};

// Create the tribe slice
const tribeSlice = createTribeSlice();

// Export the action creators
export const tribeActions = tribeSlice.actions;

// Register the reducer with the store to enable dynamic loading
registerReducer('tribes', tribeSlice.reducer);

// Export the reducer as the default export
export default tribeSlice.reducer;