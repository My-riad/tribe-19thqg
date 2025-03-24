import React, { useState, useEffect, useLayoutEffect } from 'react'; // react ^18.2.0
import { View, Text, ActivityIndicator } from 'react-native'; // react-native ^0.70.0
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // @react-navigation/native ^6.0.0
import { HeaderBackButton } from '@react-navigation/elements'; // @react-navigation/elements ^1.3.0

import EventDetails from '../../../components/event/EventDetails';
import { Container } from './EventDetailScreen.styles';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { EventNavigationProp, EventStackParamList } from '../../../types/navigation.types';
import { fetchEventById, getEventAttendees } from '../../../store/thunks/eventThunks';

// Define the type for the route prop containing event detail parameters
type EventDetailScreenRouteProp = RouteProp<EventStackParamList, 'EventDetail'>;

/**
 * Screen component that displays detailed information about an event
 */
const EventDetailScreen: React.FC = () => {
  // Get the navigation object using useNavigation hook
  const navigation = useNavigation<EventNavigationProp>();

  // Get the route object using useRoute hook to access route parameters
  const route = useRoute<EventDetailScreenRouteProp>();

  // Extract eventId from route.params
  const { eventId } = route.params;

  // Get Redux dispatch function using useAppDispatch
  const dispatch = useAppDispatch();

  // Get the current user ID from Redux state using useAppSelector
  const userId = useAppSelector(state => state.auth.user?.id);

  // Get the current event from Redux state using useAppSelector
  const event = useAppSelector(state => state.events.currentEvent);

  // Get the loading state for event operations from Redux state using useAppSelector
  const isLoading = useAppSelector(state => state.events.loading);

  // Determine if the current user is the event organizer by comparing userId with event.createdBy
  const isOrganizer = event?.createdBy === userId;

  // Set up navigation header with title and back button using useLayoutEffect
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: event ? event.name : 'Event Details',
      headerTitleAlign: 'center',
      headerLeft: () => (
        <HeaderBackButton onPress={handleBackPress} />
      ),
    });
  }, [navigation, event]);

  // Define handleChatPress function to navigate to event chat
  const handleChatPress = () => {
    navigation.navigate('EventChat', { tribeId: event?.tribeId, eventId: eventId });
  };

  // Define handleBackPress function to navigate back
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Use useEffect to fetch event details and attendees when component mounts or eventId changes
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
      dispatch(getEventAttendees({ eventId }));
    }
  }, [dispatch, eventId]);

  // Render the EventDetails component with eventId, isOrganizer, onBack, and onChatPress props
  return (
    <Container>
      {isLoading || !event ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <EventDetails
          eventId={eventId}
          isOrganizer={isOrganizer}
          onBack={handleBackPress}
          onChatPress={handleChatPress}
        />
      )}
    </Container>
  );
};

export default EventDetailScreen;