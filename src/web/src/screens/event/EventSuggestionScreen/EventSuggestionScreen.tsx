import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import {
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'; // react-native ^0.70.0
import { useRoute, useNavigation } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import {
  EventSuggestionScreenContainer,
  HeaderContainer,
  Title,
  SuggestionList,
  SuggestionSection,
  SectionTitle,
  EmptyStateContainer,
  EmptyStateText,
  LoadingContainer,
} from './EventSuggestionScreen.styles';
import EventCard from '../../../components/event/EventCard';
import LoadingIndicator from '../../../components/ui/LoadingIndicator';
import Button from '../../../components/ui/Button';
import { EventTypes } from '../../../types/event.types';
import { EventStackParamList, EventNavigationProp } from '../../../types/navigation.types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  getEventRecommendations,
  getWeatherBasedSuggestions,
  rsvpToEvent,
} from '../../../store/thunks/eventThunks';
import { useLocation } from '../../../hooks/useLocation';

/**
 * Screen component that displays AI-powered event suggestions for a tribe
 */
const EventSuggestionScreen: React.FC = () => {
  // Get the tribeId parameter from the route using useRoute hook
  const { params } = useRoute<RouteProp<EventStackParamList, 'EventSuggestion'>>();
  const { tribeId } = params;

  // Get the navigation object using useNavigation hook
  const navigation = useNavigation<EventNavigationProp>();

  // Get the user's current location using useLocation hook
  const { currentLocation } = useLocation();

  // Initialize state for refreshing status
  const [refreshing, setRefreshing] = useState(false);

  // Access Redux state for event recommendations, weather-based suggestions, loading status, and error
  const {
    eventRecommendations,
    weatherBasedSuggestions,
    loading,
    error,
  } = useAppSelector((state) => state.events);

  // Get the dispatch function using useAppDispatch
  const dispatch = useAppDispatch();

  /**
   * Function to fetch event suggestions that dispatches the getEventRecommendations and getWeatherBasedSuggestions thunks
   */
  const fetchSuggestions = useCallback(async () => {
    if (!tribeId) return;

    const recommendationParams = {
      tribeId,
      location: currentLocation?.latitude && currentLocation?.longitude
        ? `${currentLocation.latitude},${currentLocation.longitude}`
        : undefined,
    };

    const weatherParams = {
      tribeId,
      location: currentLocation?.latitude && currentLocation?.longitude
        ? `${currentLocation.latitude},${currentLocation.longitude}`
        : undefined,
    };

    try {
      await Promise.all([
        dispatch(getEventRecommendations(recommendationParams)),
        dispatch(getWeatherBasedSuggestions(weatherParams)),
      ]);
    } catch (err) {
      console.error('Error fetching event suggestions:', err);
    }
  }, [dispatch, tribeId, currentLocation]);

  /**
   * Function to handle refreshing that sets refreshing state and calls fetchSuggestions
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSuggestions().finally(() => setRefreshing(false));
  }, [fetchSuggestions]);

  /**
   * Function to handle navigation to event details when a card is pressed
   */
  const handleCardPress = useCallback((eventId: string) => {
    navigation.navigate('EventDetail', { eventId });
  }, [navigation]);

  /**
   * Function to handle RSVP actions that dispatches the rsvpToEvent thunk
   */
  const handleRSVP = useCallback(
    async (eventId: string, status: EventTypes.RSVPStatus) => {
      try {
        await dispatch(rsvpToEvent({ eventId, status }));
      } catch (err) {
        console.error('Error updating RSVP:', err);
      }
    },
    [dispatch]
  );

  // Use useEffect to fetch suggestions when the component mounts or tribeId changes
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Render the screen with header, loading state, or content based on the current state
  return (
    <EventSuggestionScreenContainer>
      <HeaderContainer>
        <Title>Event Suggestions</Title>
      </HeaderContainer>

      {loading ? (
        <LoadingContainer>
          <LoadingIndicator size="large" />
        </LoadingContainer>
      ) : error ? (
        <EmptyStateContainer>
          <EmptyStateText>Error: {error}</EmptyStateText>
        </EmptyStateContainer>
      ) : (
        <SuggestionList
          data={[
            { title: 'Recommended Events', data: eventRecommendations },
            { title: 'Weather-Based Activities', data: weatherBasedSuggestions },
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <SuggestionSection>
              <SectionTitle>{item.title}</SectionTitle>
              {item.data && item.data.length > 0 ? (
                item.data.map((suggestion) => (
                  <EventCard
                    key={suggestion.event.id}
                    event={suggestion.event}
                    onPress={handleCardPress}
                    showRSVP
                  />
                ))
              ) : (
                <EmptyStateText>No suggestions available for this category.</EmptyStateText>
              )}
            </SuggestionSection>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </EventSuggestionScreenContainer>
  );
};

// Export the EventSuggestionScreen component for use in navigation
export default EventSuggestionScreen;