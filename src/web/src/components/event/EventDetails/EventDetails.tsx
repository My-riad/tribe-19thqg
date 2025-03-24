import React, { useState, useEffect, useMemo, useCallback } from 'react'; // react ^18.2.0
import { View, Text, Image, ScrollView, ActivityIndicator, Linking } from 'react-native'; // react-native ^0.70.0

import Card from '../../ui/Card';
import Button from '../../ui/Button';
import WeatherWidget from '../WeatherWidget';
import RSVPButtons from '../RSVPButtons';
import AttendeesList from '../AttendeesList';
import { EventTypes } from '../../../types/event.types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchEventById, getEventAttendees, rsvpToEvent, checkInToEvent } from '../../../store/thunks/eventThunks';
import { formatDate } from '../../../utils/dateTime';
import { useLocation } from '../../../hooks/useLocation';
import { 
  Container, 
  Header,
  EventImage, 
  EventInfo, 
  Section, 
  SectionTitle,
  ActionButtonsContainer
} from './EventDetails.styles';

interface EventDetailsProps {
  eventId: string;
  isOrganizer?: boolean;
  onBack?: () => void;
  onChatPress?: () => void;
}

/**
 * Component that displays detailed information about an event
 */
const EventDetails: React.FC<EventDetailsProps> = ({ 
  eventId,
  isOrganizer,
  onBack,
  onChatPress
}) => {
  // State for loading check-in confirmation dialog
  const [confirmCheckIn, setConfirmCheckIn] = useState(false);

  // Get Redux dispatch and selector hooks
  const dispatch = useAppDispatch();
  const event = useAppSelector((state) => state.events.currentEvent);
  const attendees = useAppSelector((state) => state.events.eventAttendees);
  const loading = useAppSelector((state) => state.events.loading);

  // Use useEffect to fetch event details and attendees when component mounts or eventId changes
  useEffect(() => {
    dispatch(fetchEventById(eventId));
    dispatch(getEventAttendees({ eventId }));
  }, [dispatch, eventId]);

  // Use useMemo to format date and time for display
  const formattedDateTime = useMemo(() => {
    if (!event?.startTime || !event?.endTime) return '';
    return formatDate(event.startTime, 'EEEE, MMMM d, yyyy h:mm a')
  }, [event?.startTime, event?.endTime]);

  // Use useMemo to get the user's RSVP status
  const userRsvpStatus = useMemo(() => {
    return event?.userRsvpStatus;
  }, [event?.userRsvpStatus]);

  // Use useMemo to check if the user is attending the event
  const isAttending = useMemo(() => {
    return userRsvpStatus === EventTypes.RSVPStatus.GOING;
  }, [userRsvpStatus]);

  // Use useMemo to check if the event is in the past
  const isEventPast = useMemo(() => {
    if (!event?.endTime) return false;
    return new Date(event.endTime) < new Date();
  }, [event?.endTime]);

  // Use the useLocation hook to get location-related functions
  const { calculateDistance } = useLocation();

  // Handler for RSVP updates
  const handleRSVP = useCallback((status: EventTypes.RSVPStatus) => {
    dispatch(rsvpToEvent({ eventId, status }));
  }, [dispatch, eventId]);

  // Handler for check-ins
  const handleCheckIn = useCallback((attendeeId: string) => {
    dispatch(checkInToEvent({ eventId }));
  }, [dispatch, eventId]);

  // Handler for getting directions
  const handleGetDirections = useCallback(() => {
    if (!event?.coordinates) return;

    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${event.coordinates.latitude},${event.coordinates.longitude}`;
    const label = event.name;
    const url = `${scheme}${latLng}(${label})`;

    Linking.openURL(url);
  }, [event?.coordinates, event?.name]);

  // Handler for chat press
  const handleChatPress = useCallback(() => {
    if (onChatPress) {
      onChatPress();
    }
  }, [onChatPress]);

  // Render loading state
  if (loading || !event) {
    return (
      <Container>
        <ActivityIndicator size="large" color="#0000ff" />
      </Container>
    );
  }

  // Render error state
  if (!event) {
    return (
      <Container>
        <Text>Failed to load event details.</Text>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView>
        <Header>
          <EventImage source={{ uri: event.imageUrl }} />
          <EventInfo>
            <Text>{event.name}</Text>
            <Text>{formattedDateTime}</Text>
            <Text>{event.location}</Text>
          </EventInfo>
        </Header>

        <Section>
          <SectionTitle>Description</SectionTitle>
          <Text>{event.description}</Text>
        </Section>

        <Section>
          <SectionTitle>Weather</SectionTitle>
          <WeatherWidget weatherData={event.weatherData} />
        </Section>

        <Section>
          <SectionTitle>Attendees</SectionTitle>
          <AttendeesList
            attendees={attendees}
            isOrganizer={isOrganizer}
            eventId={eventId}
            onCheckIn={handleCheckIn}
          />
        </Section>

        <ActionButtonsContainer>
          <Button title="Get Directions" onPress={handleGetDirections} />
          <Button title="Chat" onPress={handleChatPress} />
        </ActionButtonsContainer>
      </ScrollView>
    </Container>
  );
};

export default EventDetails;