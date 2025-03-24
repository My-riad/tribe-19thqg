import { createSlice, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { EventTypes } from '../../types/event.types';

/**
 * Interface for the event state in the Redux store
 */
export interface EventState {
  events: EventTypes.Event[];
  userEvents: EventTypes.Event[];
  currentEvent: EventTypes.Event | null;
  eventAttendees: EventTypes.EventAttendee[];
  eventRecommendations: EventTypes.EventSuggestion[];
  weatherBasedSuggestions: EventTypes.EventSuggestion[];
  optimalTimeSlots: EventTypes.OptimalTimeSlot[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial state for the event slice
 */
const initialState: EventState = {
  events: [],
  userEvents: [],
  currentEvent: null,
  eventAttendees: [],
  eventRecommendations: [],
  weatherBasedSuggestions: [],
  optimalTimeSlots: [],
  loading: false,
  error: null
};

/**
 * Redux slice for managing event-related state
 */
const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    /**
     * Updates the events list in the state
     */
    setEvents: (state, action: PayloadAction<EventTypes.Event[]>) => {
      state.events = action.payload;
    },
    
    /**
     * Sets the currently selected event
     */
    setCurrentEvent: (state, action: PayloadAction<EventTypes.Event | null>) => {
      state.currentEvent = action.payload;
    },
    
    /**
     * Updates the user's events list in the state
     */
    setUserEvents: (state, action: PayloadAction<EventTypes.Event[]>) => {
      state.userEvents = action.payload;
    },
    
    /**
     * Updates the attendees list for the current event
     */
    setEventAttendees: (state, action: PayloadAction<EventTypes.EventAttendee[]>) => {
      state.eventAttendees = action.payload;
    },
    
    /**
     * Updates the AI-powered event recommendations
     */
    setEventRecommendations: (state, action: PayloadAction<EventTypes.EventSuggestion[]>) => {
      state.eventRecommendations = action.payload;
    },
    
    /**
     * Updates the weather-based activity suggestions
     */
    setWeatherBasedSuggestions: (state, action: PayloadAction<EventTypes.EventSuggestion[]>) => {
      state.weatherBasedSuggestions = action.payload;
    },
    
    /**
     * Updates the AI-suggested optimal time slots
     */
    setOptimalTimeSlots: (state, action: PayloadAction<EventTypes.OptimalTimeSlot[]>) => {
      state.optimalTimeSlots = action.payload;
    },
    
    /**
     * Sets the loading state for event operations
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    /**
     * Sets an error message in the event state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    /**
     * Adds a new event to the events list
     */
    addEvent: (state, action: PayloadAction<EventTypes.Event>) => {
      state.events.push(action.payload);
    },
    
    /**
     * Updates an existing event in the events list
     */
    updateEventInList: (state, action: PayloadAction<EventTypes.Event>) => {
      const updatedEvent = action.payload;
      // Update in events array
      const eventIndex = state.events.findIndex(event => event.id === updatedEvent.id);
      if (eventIndex !== -1) {
        state.events[eventIndex] = updatedEvent;
      }
      
      // Also update in userEvents if present
      const userEventIndex = state.userEvents.findIndex(event => event.id === updatedEvent.id);
      if (userEventIndex !== -1) {
        state.userEvents[userEventIndex] = updatedEvent;
      }

      // If this is the current event, update it too
      if (state.currentEvent && state.currentEvent.id === updatedEvent.id) {
        state.currentEvent = updatedEvent;
      }
    },
    
    /**
     * Removes an event from the events list
     */
    removeEvent: (state, action: PayloadAction<string>) => {
      const eventId = action.payload;
      state.events = state.events.filter(event => event.id !== eventId);
      state.userEvents = state.userEvents.filter(event => event.id !== eventId);
      
      if (state.currentEvent && state.currentEvent.id === eventId) {
        state.currentEvent = null;
      }
    },
    
    /**
     * Updates the RSVP status for an event
     */
    updateRSVP: (state, action: PayloadAction<{ eventId: string; status: EventTypes.RSVPStatus }>) => {
      const { eventId, status } = action.payload;
      
      // Update in events array
      const eventIndex = state.events.findIndex(event => event.id === eventId);
      if (eventIndex !== -1) {
        state.events[eventIndex] = {
          ...state.events[eventIndex],
          userRsvpStatus: status
        };
      }
      
      // Update in userEvents array
      const userEventIndex = state.userEvents.findIndex(event => event.id === eventId);
      if (userEventIndex !== -1) {
        state.userEvents[userEventIndex] = {
          ...state.userEvents[userEventIndex],
          userRsvpStatus: status
        };
      }
      
      // Update current event if it matches
      if (state.currentEvent && state.currentEvent.id === eventId) {
        state.currentEvent = {
          ...state.currentEvent,
          userRsvpStatus: status
        };
      }
    },
    
    /**
     * Updates the check-in status for an event
     */
    updateCheckIn: (state, action: PayloadAction<string>) => {
      const eventId = action.payload;
      
      // Update attendee list for the current user
      const attendeeIndex = state.eventAttendees.findIndex(attendee => 
        attendee.eventId === eventId
      );
      
      if (attendeeIndex !== -1) {
        state.eventAttendees[attendeeIndex] = {
          ...state.eventAttendees[attendeeIndex],
          hasCheckedIn: true,
          checkedInAt: new Date()
        };
      }
    },
    
    /**
     * Resets the event state to initial values
     */
    resetState: () => initialState
  },
  extraReducers: (builder: ActionReducerMapBuilder<EventState>) => {
    // fetchEvents
    builder
      .addCase('events/fetchEvents/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/fetchEvents/fulfilled', (state, action) => {
        state.events = action.payload;
        state.loading = false;
      })
      .addCase('events/fetchEvents/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      });
    
    // fetchUserEvents
    builder
      .addCase('events/fetchUserEvents/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/fetchUserEvents/fulfilled', (state, action) => {
        state.userEvents = action.payload;
        state.loading = false;
      })
      .addCase('events/fetchUserEvents/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user events';
      });
    
    // fetchEventById
    builder
      .addCase('events/fetchEventById/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/fetchEventById/fulfilled', (state, action) => {
        state.currentEvent = action.payload;
        state.loading = false;
      })
      .addCase('events/fetchEventById/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch event details';
      });
    
    // createEvent
    builder
      .addCase('events/createEvent/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/createEvent/fulfilled', (state, action) => {
        state.events.push(action.payload);
        state.userEvents.push(action.payload);
        state.currentEvent = action.payload;
        state.loading = false;
      })
      .addCase('events/createEvent/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create event';
      });
    
    // updateEvent
    builder
      .addCase('events/updateEvent/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/updateEvent/fulfilled', (state, action) => {
        const updatedEvent = action.payload;
        
        // Update in events array
        const eventIndex = state.events.findIndex(event => event.id === updatedEvent.id);
        if (eventIndex !== -1) {
          state.events[eventIndex] = updatedEvent;
        }
        
        // Update in userEvents array
        const userEventIndex = state.userEvents.findIndex(event => event.id === updatedEvent.id);
        if (userEventIndex !== -1) {
          state.userEvents[userEventIndex] = updatedEvent;
        }
        
        // Update current event if it matches
        if (state.currentEvent && state.currentEvent.id === updatedEvent.id) {
          state.currentEvent = updatedEvent;
        }
        
        state.loading = false;
      })
      .addCase('events/updateEvent/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update event';
      });
    
    // deleteEvent
    builder
      .addCase('events/deleteEvent/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/deleteEvent/fulfilled', (state, action) => {
        const eventId = action.payload;
        state.events = state.events.filter(event => event.id !== eventId);
        state.userEvents = state.userEvents.filter(event => event.id !== eventId);
        
        if (state.currentEvent && state.currentEvent.id === eventId) {
          state.currentEvent = null;
        }
        
        state.loading = false;
      })
      .addCase('events/deleteEvent/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete event';
      });
    
    // rsvpToEvent
    builder
      .addCase('events/rsvpToEvent/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/rsvpToEvent/fulfilled', (state, action) => {
        const { eventId, status } = action.payload;
        
        // Update in events array
        const eventIndex = state.events.findIndex(event => event.id === eventId);
        if (eventIndex !== -1) {
          state.events[eventIndex] = {
            ...state.events[eventIndex],
            userRsvpStatus: status
          };
        }
        
        // Update in userEvents array
        const userEventIndex = state.userEvents.findIndex(event => event.id === eventId);
        if (userEventIndex !== -1) {
          state.userEvents[userEventIndex] = {
            ...state.userEvents[userEventIndex],
            userRsvpStatus: status
          };
        }
        
        // Update current event if it matches
        if (state.currentEvent && state.currentEvent.id === eventId) {
          state.currentEvent = {
            ...state.currentEvent,
            userRsvpStatus: status
          };
        }
        
        state.loading = false;
      })
      .addCase('events/rsvpToEvent/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update RSVP';
      });
    
    // checkInToEvent
    builder
      .addCase('events/checkInToEvent/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/checkInToEvent/fulfilled', (state, action) => {
        const eventId = action.payload;
        
        // Update attendee list for the current user
        const attendeeIndex = state.eventAttendees.findIndex(attendee => 
          attendee.eventId === eventId
        );
        
        if (attendeeIndex !== -1) {
          state.eventAttendees[attendeeIndex] = {
            ...state.eventAttendees[attendeeIndex],
            hasCheckedIn: true,
            checkedInAt: new Date()
          };
        }
        
        state.loading = false;
      })
      .addCase('events/checkInToEvent/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check in to event';
      });
    
    // getEventAttendees
    builder
      .addCase('events/getEventAttendees/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/getEventAttendees/fulfilled', (state, action) => {
        state.eventAttendees = action.payload;
        state.loading = false;
      })
      .addCase('events/getEventAttendees/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch event attendees';
      });
    
    // getEventRecommendations
    builder
      .addCase('events/getEventRecommendations/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/getEventRecommendations/fulfilled', (state, action) => {
        state.eventRecommendations = action.payload;
        state.loading = false;
      })
      .addCase('events/getEventRecommendations/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch event recommendations';
      });
    
    // getWeatherBasedSuggestions
    builder
      .addCase('events/getWeatherBasedSuggestions/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/getWeatherBasedSuggestions/fulfilled', (state, action) => {
        state.weatherBasedSuggestions = action.payload;
        state.loading = false;
      })
      .addCase('events/getWeatherBasedSuggestions/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch weather-based suggestions';
      });
    
    // getOptimalTimeSlots
    builder
      .addCase('events/getOptimalTimeSlots/pending', (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase('events/getOptimalTimeSlots/fulfilled', (state, action) => {
        state.optimalTimeSlots = action.payload;
        state.loading = false;
      })
      .addCase('events/getOptimalTimeSlots/rejected', (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch optimal time slots';
      });
  }
});

// Export action creators
export const eventActions = eventSlice.actions;

// Export reducer
export default eventSlice.reducer;