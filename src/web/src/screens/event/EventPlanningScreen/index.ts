import React, { useState, useEffect, useLayoutEffect } from 'react'; // react v18.2.0
import { View, ScrollView, Text, Alert } from 'react-native'; // react-native v0.72.0
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // @react-navigation/native v6.0.0

import EventCreationForm from '../../../components/event/EventCreationForm/EventCreationForm';
import { EventTypes } from '../../../types/event.types';
import { EventNavigationProp, EventStackParamList } from '../../../types/navigation.types';
import { eventApi } from '../../../api/eventApi';
import useTribes from '../../../hooks/useTribes';
import LoadingIndicator from '../../../components/ui/LoadingIndicator/LoadingIndicator';
import {
  Container,
  Header,
  Title,
} from './EventPlanningScreen.styles';

/**
 * Screen component for planning and creating events within a tribe
 * @returns JSX.Element
 */
const EventPlanningScreen = (): JSX.Element => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<EventNavigationProp>();

  // Get route parameters using useRoute hook
  const route = useRoute<RouteProp<EventStackParamList, 'EventPlanning'>>();

  // Extract tribeId and eventId from route parameters
  const { tribeId, eventId } = route.params;

  // Set up state for loading status, error message, and event data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventTypes.Event | null>(null);

  // Get tribe data using useTribes hook
  const { tribes } = useTribes();

  // Create effect to fetch event data if editing an existing event
  useEffect(() => {
    if (eventId) {
      setLoading(true);
      eventApi.getEvent(eventId)
        .then(response => {
          if (response.success) {
            setEvent(response.data);
          } else {
            setError(response.message);
          }
        })
        .catch(err => {
          setError(err.message || 'Failed to fetch event');
        })
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  // Create effect to set screen title based on whether creating or editing
  useLayoutEffect(() => {
    navigation.setOptions({
      title: eventId ? 'Edit Event' : 'Create Event',
    });
  }, [navigation, eventId]);

  // Create function to handle successful event creation/update
  const handleSuccess = (newEvent: EventTypes.Event) => {
    navigation.goBack();
  };

  // Create function to handle cancellation of event creation/update
  const handleCancel = () => {
    navigation.goBack();
  };

  // Render loading indicator while fetching event data
  if (loading) {
    return (
      <Container>
        <LoadingIndicator size="large" />
      </Container>
    );
  }

  // Render error message if there was an error fetching data
  if (error) {
    return (
      <Container>
        <Text>Error: {error}</Text>
      </Container>
    );
  }

  // Render EventCreationForm with appropriate props
  return (
    <Container>
      <EventCreationForm
        initialEvent={event} // Pass initial event data if editing an existing event
        tribeId={tribeId} // Pass tribeId from route parameters
        onSuccess={handleSuccess} // Pass success handler
        onCancel={handleCancel} // Pass cancel handler
      />
    </Container>
  );
};

export default EventPlanningScreen;