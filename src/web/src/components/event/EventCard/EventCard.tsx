import React, { useState, useCallback } from 'react'; // react ^18.2.0
import { Animated, TouchableOpacity, View, Text } from 'react-native'; // react-native ^0.70.0

import {
  EventCardContainer,
  InteractiveEventCardContainer,
  EventImageContainer,
  EventImage,
  EventContentContainer,
  EventHeader,
  EventTitle,
  EventDateContainer,
  EventDay,
  EventTime,
  EventLocation,
  EventDetailsContainer,
  EventTribeInfo,
  EventAttendeeInfo,
  EventTypeTag,
  EventStatusIndicator,
  EventFooter,
  AiRecommendationBadge,
  EventWeatherIcon,
} from './EventCard.styles';
import RSVPButtons from '../RSVPButtons';
import WeatherWidget from '../WeatherWidget';
import { EventTypes } from '../../../types/event.types';
import { formatEventTime, getDayAbbreviation, truncateText } from '../../../utils/dateTime';

/**
 * Props interface for the EventCard component
 */
interface EventCardProps {
  event: EventTypes.Event;
  variant?: 'standard' | 'compact' | 'featured';
  onPress?: (eventId: string) => void;
  showRSVP?: boolean;
  showWeather?: boolean;
  testID?: string;
  style?: any;
}

const SCALE_ANIMATION_CONFIG = {
  duration: 150,
  useNativeDriver: true
};

const DEFAULT_EVENT_IMAGE = require('../../../assets/images/default-event.jpg');

/**
 * Helper function to determine the color for event status indicators
 * @param status The event status
 * @returns Color code for the status indicator
 */
const getStatusColor = (status: EventTypes.EventStatus): string => {
  switch (status) {
    case EventTypes.EventStatus.SCHEDULED:
      return 'green';
    case EventTypes.EventStatus.CANCELLED:
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Helper function to get a human-readable label for event types
 * @param type The event type
 * @returns Human-readable event type label
 */
const getEventTypeLabel = (type: EventTypes.EventType): string => {
  switch (type) {
    case EventTypes.EventType.OUTDOOR_ACTIVITY:
      return 'Outdoor';
    case EventTypes.EventType.INDOOR_ACTIVITY:
      return 'Indoor';
    case EventTypes.EventType.DINING:
      return 'Dining';
    case EventTypes.EventType.ENTERTAINMENT:
      return 'Entertainment';
    case EventTypes.EventType.CULTURAL:
      return 'Cultural';
    case EventTypes.EventType.EDUCATIONAL:
      return 'Educational';
    case EventTypes.EventType.SOCIAL:
      return 'Social';
    default:
      return 'Other';
  }
};

/**
 * A component that displays event information in a card format with different variants and interactive capabilities
 * @param props - The props for the EventCard component
 * @returns Rendered EventCard component
 */
const EventCard: React.FC<EventCardProps> = (props) => {
  // Destructure props with defaults
  const {
    event,
    variant = 'standard',
    onPress,
    showRSVP = false,
    showWeather = false,
    testID,
    style,
  } = props;

  // Set up animation values for interactive cards
  const scaleValue = useState(new Animated.Value(1))[0];

  // Create press handlers for interactive cards that trigger scale animations
  const pressInHandler = useCallback(() => {
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleValue]);

  const pressOutHandler = useCallback(() => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleValue]);

  // Format event date and time using utility functions
  const eventDay = getDayAbbreviation(event.startTime);
  const eventTime = formatEventTime(event.startTime);

  // Determine which container component to use based on variant and interactivity
  const Container = onPress ? InteractiveEventCardContainer : EventCardContainer;

  return (
    <Container
      style={style}
      variant={variant}
      testID={testID}
      as={onPress ? TouchableOpacity : View}
      onPress={() => onPress && onPress(event.id)}
      onPressIn={onPress ? pressInHandler : undefined}
      onPressOut={onPress ? pressOutHandler : undefined}
      style={{ transform: [{ scale: scaleValue }] }}
    >
      {/* Render AI recommendation badge if event is AI-generated */}
      {event.isAiGenerated && (
        <AiRecommendationBadge>
          <Text style={{ color: 'white' }}>AI Recommended</Text>
        </AiRecommendationBadge>
      )}

      {/* Render event image if available */}
      <EventImageContainer variant={variant}>
        <EventImage
          source={event.imageUrl ? { uri: event.imageUrl } : DEFAULT_EVENT_IMAGE}
        />
      </EventImageContainer>

      <EventContentContainer variant={variant}>
        <EventHeader variant={variant}>
          <EventTitle variant={variant}>
            {truncateText(event.name, 30)}
          </EventTitle>
          <EventDateContainer variant={variant}>
            <EventDay variant={variant}>{eventDay}</EventDay>
            <EventTime variant={variant}>{eventTime}</EventTime>
          </EventDateContainer>
        </EventHeader>

        {/* Render event location */}
        <EventLocation variant={variant}>{event.location}</EventLocation>

        <EventDetailsContainer>
          <EventTribeInfo variant={variant}>
            {event.tribe.name}
          </EventTribeInfo>
          <EventAttendeeInfo>
            {event.attendeeCount} attending
          </EventAttendeeInfo>
        </EventDetailsContainer>

        <EventFooter variant={variant}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <EventTypeTag>
              <Text style={{ fontSize: 12 }}>{getEventTypeLabel(event.eventType)}</Text>
            </EventTypeTag>
            <EventStatusIndicator color={getStatusColor(event.status)} />
            <Text style={{ fontSize: 12 }}>{event.status}</Text>
          </View>

          {/* Render weather information if available */}
          {showWeather && event.weatherData && (
            <EventWeatherIcon>
              <WeatherWidget weatherData={event.weatherData} compact />
            </EventWeatherIcon>
          )}
        </EventFooter>
      </EventContentContainer>

      {/* Render RSVP buttons if showRSVP is true */}
      {showRSVP && <RSVPButtons eventId={event.id} initialStatus={event.userRsvpStatus} />}
    </Container>
  );
};

export default EventCard;