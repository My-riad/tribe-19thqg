import React, { useState, useEffect, useCallback } from 'react'; // react ^18.2.0
import { useFocusEffect } from '@react-navigation/native'; // @react-navigation/native ^6.1.6
import { FlatList, RefreshControl, View, Text, TouchableOpacity } from 'react-native'; // react-native ^0.70.0

import {
  EventsScreenContainer,
  EventsHeader,
  SectionTitle,
  EventsList,
  EmptyStateContainer,
  EmptyStateText,
} from './EventsScreen.styles';
import EventCard from '../../../components/event/EventCard';
import Button from '../../../components/ui/Button';
import LoadingIndicator from '../../../components/ui/LoadingIndicator';
import { useEvents } from '../../../hooks/useEvents';
import { useLocation } from '../../../hooks/useLocation';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/navigationRoutes';
import { EventTypes } from '../../../types/event.types';

/**
 * Main component for the Events screen that displays upcoming events, recommendations, and provides event discovery
 * @param props - The props passed to the EventsScreen component
 * @returns Rendered EventsScreen component
 */
const EventsScreen: React.FC = (props: any) => {
  // Extract navigation from props
  const { navigation } = props;

  // Get events, userEvents, suggestedEvents, loading, and event-related functions from useEvents hook
  const {
    events,
    userEvents,
    suggestedEvents,
    loading,
    fetchEvents,
    fetchUserEvents,
    getEventRecommendations,
    getWeatherBasedSuggestions,
  } = useEvents();

  // Get currentLocation from useLocation hook
  const { currentLocation } = useLocation();

  // Get authentication state from useAuth hook
  const { isAuthenticated } = useAuth();

  // Initialize refreshing state with useState
  const [refreshing, setRefreshing] = useState(false);

  // Initialize activeTab state with useState (default to 'upcoming')
  const [activeTab, setActiveTab] = useState('upcoming');

  /**
   * Helper function to filter events that are upcoming (not past events)
   * @param events - Array of events to filter
   * @returns Filtered list of upcoming events
   */
  const filterUpcomingEvents = (events: EventTypes.Event[]): EventTypes.Event[] => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  /**
   * Helper function to filter events happening this weekend
   * @param events - Array of events to filter
   * @returns Filtered list of weekend events
   */
  const filterWeekendEvents = (events: EventTypes.Event[]): EventTypes.Event[] => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diff = day === 0 ? 6 : 5 - day; // Days until Friday
    const friday = new Date(now.setDate(now.getDate() + diff));
    const saturday = new Date(friday);
    saturday.setDate(saturday.getDate() + 1);
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);

    return events
      .filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= friday && eventDate <= sunday;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  /**
   * Memoized function to handle event presses and navigate to event details
   * @param eventId - The ID of the event to navigate to
   */
  const handleEventPress = useCallback((eventId: string) => {
    navigation.navigate(ROUTES.EVENT.EVENT_DETAIL, { eventId });
  }, [navigation]);

  /**
   * Memoized function to handle create event presses and navigate to event planning screen
   */
  const handleCreateEventPress = useCallback(() => {
    navigation.navigate(ROUTES.EVENT.EVENT_PLANNING);
  }, [navigation]);

  /**
   * Memoized function to handle refresh and fetch events data
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchEvents(),
      fetchUserEvents(),
      currentLocation && getEventRecommendations({
        location: currentLocation.location,
        coordinates: currentLocation.coordinates,
      }),
    ]).finally(() => setRefreshing(false));
  }, [fetchEvents, fetchUserEvents, currentLocation, getEventRecommendations]);

  /**
   * Render function for event items in the FlatList
   * @param param - Object containing the event item
   * @returns Rendered EventCard component
   */
  const renderEventItem = useCallback(({ item }: { item: EventTypes.Event }) => {
    return (
      <EventCard
        event={item}
        onPress={handleEventPress}
        showWeather
        variant="standard"
      />
    );
  }, [handleEventPress]);

  /**
   * Render function for suggested event items in the FlatList
   * @param param - Object containing the event suggestion item
   * @returns Rendered EventCard component
   */
  const renderSuggestedEventItem = useCallback(({ item }: { item: EventTypes.EventSuggestion }) => {
    return (
      <EventCard
        event={item.event}
        onPress={handleEventPress}
        showWeather
        variant="featured"
      />
    );
  }, [handleEventPress]);

  /**
   * Render function for empty state when no events are available
   * @returns Rendered empty state component
   */
  const renderEmptyComponent = useCallback(() => (
    <EmptyStateContainer>
      <EmptyStateText>
        No events available. Create an event or join a tribe to see events here!
      </EmptyStateText>
    </EmptyStateContainer>
  ), []);

  // Use useFocusEffect to fetch events when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        handleRefresh();
      }
    }, [isAuthenticated, handleRefresh])
  );

  // Use useEffect to fetch event recommendations when location changes
  useEffect(() => {
    if (isAuthenticated && currentLocation) {
      getEventRecommendations({
        location: currentLocation.location,
        coordinates: currentLocation.coordinates,
      });
      getWeatherBasedSuggestions({
        location: currentLocation.location,
        coordinates: currentLocation.coordinates,
      });
    }
  }, [isAuthenticated, currentLocation, getEventRecommendations, getWeatherBasedSuggestions]);

  return (
    <EventsScreenContainer
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <EventsHeader>
        <SectionTitle>Upcoming Events</SectionTitle>
      </EventsHeader>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <EventsList
          data={filterUpcomingEvents(userEvents)}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      <SectionTitle>This Weekend</SectionTitle>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <EventsList
          data={filterWeekendEvents(userEvents)}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      <SectionTitle>Recommended for You</SectionTitle>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <EventsList
          data={suggestedEvents}
          renderItem={renderSuggestedEventItem}
          keyExtractor={item => item.event.id}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      <Button onPress={handleCreateEventPress}>Create Event</Button>
    </EventsScreenContainer>
  );
};

export default EventsScreen;