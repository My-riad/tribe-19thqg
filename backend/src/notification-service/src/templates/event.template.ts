/**
 * Event notification templates for the Tribe platform
 * 
 * This file defines standardized templates for generating event-related notifications,
 * ensuring consistent messaging and format across different notification types.
 */

import { 
  NotificationType, 
  NotificationPriority, 
  INotificationCreate 
} from '../../../shared/src/types/notification.types';
import { 
  EventType, 
  RSVPStatus 
} from '../../../shared/src/types/event.types';

/**
 * Creates a notification for an event invitation
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event being invited to
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param tribeName - Name of the tribe
 * @param organizerName - Name of the event organizer
 * @param eventDate - Date and time of the event
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createEventInvitationNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  tribeName: string,
  organizerName: string,
  eventDate: Date,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  const formattedDate = formatEventDate(eventDate);
  
  return {
    userId,
    type: NotificationType.EVENT_INVITATION,
    title: `You're invited: ${eventName} with ${tribeName}`,
    body: `${organizerName} has invited you to join "${eventName}" on ${formattedDate}. RSVP now!`,
    priority: NotificationPriority.MEDIUM,
    tribeId,
    eventId,
    expiresAt: eventDate,
    actionUrl: `/events/${eventId}`,
    imageUrl: metadata.imageUrl || `/assets/images/events/invitation.png`,
    metadata: {
      ...metadata,
      eventName,
      tribeName,
      organizerName,
      eventDate: eventDate.toISOString(),
      formattedDate
    }
  };
};

/**
 * Creates a reminder notification for an upcoming event
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param tribeName - Name of the tribe
 * @param eventDate - Date and time of the event
 * @param hoursUntilEvent - Number of hours until the event starts
 * @param weatherData - Weather forecast data for the event (optional)
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createEventReminderNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  tribeName: string,
  eventDate: Date,
  hoursUntilEvent: number,
  weatherData?: Record<string, any>,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  const formattedDate = formatEventDate(eventDate);
  
  // Set title based on how soon the event is
  let title: string;
  let priority: NotificationPriority;
  
  if (hoursUntilEvent <= 2) {
    title = `Event starting soon: ${eventName}`;
    priority = NotificationPriority.HIGH;
  } else if (hoursUntilEvent <= 24) {
    title = `Event today: ${eventName}`;
    priority = NotificationPriority.MEDIUM;
  } else if (hoursUntilEvent <= 48) {
    title = `Tomorrow's event: ${eventName}`;
    priority = NotificationPriority.MEDIUM;
  } else {
    title = `Upcoming event: ${eventName}`;
    priority = NotificationPriority.LOW;
  }
  
  // Build body text
  let body = `Your event with ${tribeName} is scheduled for ${formattedDate}.`;
  
  // Add weather information if available
  if (weatherData && weatherData.condition) {
    const weatherIcon = getWeatherIcon(weatherData.condition);
    const temperature = weatherData.temperature ? `${weatherData.temperature}°F` : '';
    body += ` Weather forecast: ${weatherIcon} ${weatherData.condition}${temperature ? ', ' + temperature : ''}`;
  }
  
  // Add reminders for what to bring if near the event
  if (hoursUntilEvent <= 48) {
    body += ' Don\'t forget any necessary items!';
  }
  
  return {
    userId,
    type: NotificationType.EVENT_REMINDER,
    title,
    body,
    priority,
    tribeId,
    eventId,
    expiresAt: eventDate,
    actionUrl: `/events/${eventId}`,
    imageUrl: metadata.imageUrl || `/assets/images/events/reminder.png`,
    metadata: {
      ...metadata,
      eventName,
      tribeName,
      eventDate: eventDate.toISOString(),
      formattedDate,
      hoursUntilEvent,
      weatherData
    }
  };
};

/**
 * Creates a notification for RSVP updates to an event
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param memberName - Name of the member who updated their RSVP
 * @param rsvpStatus - The updated RSVP status
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createEventRSVPUpdateNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  memberName: string,
  rsvpStatus: RSVPStatus,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  let body: string;
  
  switch (rsvpStatus) {
    case RSVPStatus.GOING:
      body = `${memberName} is attending "${eventName}".`;
      break;
    case RSVPStatus.MAYBE:
      body = `${memberName} might attend "${eventName}".`;
      break;
    case RSVPStatus.NOT_GOING:
      body = `${memberName} can't attend "${eventName}".`;
      break;
    default:
      body = `${memberName} updated their RSVP for "${eventName}".`;
  }
  
  return {
    userId,
    type: NotificationType.EVENT_RSVP,
    title: `RSVP update for ${eventName}`,
    body,
    priority: NotificationPriority.LOW,
    tribeId,
    eventId,
    expiresAt: null,
    actionUrl: `/events/${eventId}`,
    imageUrl: metadata.imageUrl || `/assets/images/events/rsvp.png`,
    metadata: {
      ...metadata,
      eventName,
      memberName,
      rsvpStatus
    }
  };
};

/**
 * Creates a notification for a cancelled event
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param tribeName - Name of the tribe
 * @param cancelledBy - Name of the person who cancelled the event
 * @param cancellationReason - Reason for cancellation (optional)
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createEventCancelledNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  tribeName: string,
  cancelledBy: string,
  cancellationReason?: string,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  let body = `${cancelledBy} has cancelled "${eventName}"`;
  
  if (cancellationReason) {
    body += ` with reason: "${cancellationReason}"`;
  }
  
  return {
    userId,
    type: NotificationType.EVENT_UPDATE,
    title: `Event cancelled: ${eventName}`,
    body,
    priority: NotificationPriority.HIGH,
    tribeId,
    eventId,
    expiresAt: null,
    actionUrl: `/tribes/${tribeId}`,
    imageUrl: metadata.imageUrl || `/assets/images/events/cancelled.png`,
    metadata: {
      ...metadata,
      eventName,
      tribeName,
      cancelledBy,
      cancellationReason,
      updateType: 'cancellation'
    }
  };
};

/**
 * Creates a notification for updated event details
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param tribeName - Name of the tribe
 * @param changedFields - Array of field names that were updated
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createEventUpdatedNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  tribeName: string,
  changedFields: string[],
  metadata: Record<string, any> = {}
): INotificationCreate => {
  // Format the list of changed fields to be more user-friendly
  const formattedFields = changedFields.map(field => {
    switch (field) {
      case 'startTime':
      case 'endTime':
        return 'time';
      case 'location':
      case 'coordinates':
      case 'venueId':
        return 'location';
      case 'description':
        return 'description';
      case 'name':
        return 'name';
      default:
        return field;
    }
  });
  
  // Remove duplicates
  const uniqueFields = [...new Set(formattedFields)];
  
  // Format the list for human readability
  let changesText: string;
  if (uniqueFields.length === 1) {
    changesText = uniqueFields[0];
  } else if (uniqueFields.length === 2) {
    changesText = `${uniqueFields[0]} and ${uniqueFields[1]}`;
  } else {
    const lastField = uniqueFields.pop();
    changesText = `${uniqueFields.join(', ')}, and ${lastField}`;
  }
  
  return {
    userId,
    type: NotificationType.EVENT_UPDATE,
    title: `Event updated: ${eventName}`,
    body: `The ${changesText} for "${eventName}" has been updated. Check the latest details!`,
    priority: NotificationPriority.MEDIUM,
    tribeId,
    eventId,
    expiresAt: null,
    actionUrl: `/events/${eventId}`,
    imageUrl: metadata.imageUrl || `/assets/images/events/updated.png`,
    metadata: {
      ...metadata,
      eventName,
      tribeName,
      changedFields,
      updateType: 'details'
    }
  };
};

/**
 * Creates a notification for AI-suggested events
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventName - Name of the suggested event
 * @param eventDescription - Description of the suggested event
 * @param tribeId - ID of the tribe for which the event is suggested
 * @param tribeName - Name of the tribe
 * @param suggestedDate - Suggested date and time for the event
 * @param location - Suggested location for the event
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createEventSuggestionNotification = (
  userId: string,
  eventName: string,
  eventDescription: string,
  tribeId: string,
  tribeName: string,
  suggestedDate: Date,
  location: string,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  const formattedDate = formatEventDate(suggestedDate);
  
  return {
    userId,
    type: NotificationType.AI_ACTIVITY_SUGGESTION,
    title: `Event suggestion: ${eventName}`,
    body: `Based on your tribe's interests, how about "${eventName}" at ${location} on ${formattedDate}? ${eventDescription.substring(0, 100)}${eventDescription.length > 100 ? '...' : ''}`,
    priority: NotificationPriority.LOW,
    tribeId,
    eventId: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    actionUrl: `/tribes/${tribeId}/event-suggestions`,
    imageUrl: metadata.imageUrl || `/assets/images/events/suggestion.png`,
    metadata: {
      ...metadata,
      eventName,
      eventDescription,
      tribeName,
      suggestedDate: suggestedDate.toISOString(),
      formattedDate,
      location,
      source: 'ai'
    }
  };
};

/**
 * Creates a notification for weather changes affecting events
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param eventDate - Date and time of the event
 * @param weatherData - Updated weather forecast data
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createWeatherUpdateNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  eventDate: Date,
  weatherData: Record<string, any>,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  const formattedDate = formatEventDate(eventDate);
  const weatherIcon = getWeatherIcon(weatherData.condition);
  const weatherSeverity = weatherData.severity || 'moderate';
  
  // Determine priority based on weather severity
  let priority: NotificationPriority;
  if (weatherData.severity === 'severe') {
    priority = NotificationPriority.HIGH;
  } else if (weatherData.severity === 'moderate') {
    priority = NotificationPriority.MEDIUM;
  } else {
    priority = NotificationPriority.LOW;
  }
  
  return {
    userId,
    type: NotificationType.EVENT_UPDATE,
    title: `Weather update for ${eventName}`,
    body: `${weatherIcon} The forecast for "${eventName}" on ${formattedDate} has changed: ${weatherData.condition}, ${weatherData.temperature}°F. ${weatherData.forecast || ''}`,
    priority,
    tribeId,
    eventId,
    expiresAt: eventDate,
    actionUrl: `/events/${eventId}`,
    imageUrl: metadata.imageUrl || `/assets/images/events/weather.png`,
    metadata: {
      ...metadata,
      eventName,
      eventDate: eventDate.toISOString(),
      formattedDate,
      weatherData,
      updateType: 'weather'
    }
  };
};

/**
 * Creates a notification reminding users to check in at events
 * 
 * @param userId - ID of the user receiving the notification
 * @param eventId - ID of the event
 * @param eventName - Name of the event
 * @param tribeId - ID of the tribe hosting the event
 * @param location - Location of the event
 * @param metadata - Additional metadata for the notification
 * @returns Notification creation payload
 */
export const createCheckInReminderNotification = (
  userId: string,
  eventId: string,
  eventName: string,
  tribeId: string,
  location: string,
  metadata: Record<string, any> = {}
): INotificationCreate => {
  return {
    userId,
    type: NotificationType.EVENT_REMINDER,
    title: `Don't forget to check in at ${eventName}`,
    body: `You've arrived at ${location}. Check in to let your tribe know you're here!`,
    priority: NotificationPriority.MEDIUM,
    tribeId,
    eventId,
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // Expires in 1 hour
    actionUrl: `/events/${eventId}/check-in`,
    imageUrl: metadata.imageUrl || `/assets/images/events/check-in.png`,
    metadata: {
      ...metadata,
      eventName,
      location,
      reminderType: 'check-in'
    }
  };
};

/**
 * Helper function to format event date and time for notifications
 * 
 * @param date - Date object to format
 * @returns Formatted date string
 */
const formatEventDate = (date: Date): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.getDate() === now.getDate() && 
                  date.getMonth() === now.getMonth() && 
                  date.getFullYear() === now.getFullYear();
                  
  const isTomorrow = date.getDate() === tomorrow.getDate() && 
                     date.getMonth() === tomorrow.getMonth() && 
                     date.getFullYear() === tomorrow.getFullYear();
  
  // Format time
  const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const timeString = date.toLocaleTimeString('en-US', timeOptions);
  
  if (isToday) {
    return `Today at ${timeString}`;
  } else if (isTomorrow) {
    return `Tomorrow at ${timeString}`;
  } else {
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = date.toLocaleDateString('en-US', dateOptions);
    return `${dateString} at ${timeString}`;
  }
};

/**
 * Helper function to get the appropriate image URL for an event type
 * 
 * @param eventType - Type of the event
 * @returns URL to the event type image
 */
const getEventImageUrl = (eventType: EventType): string => {
  switch (eventType) {
    case EventType.IN_PERSON:
      return '/assets/images/events/in-person.png';
    case EventType.VIRTUAL:
      return '/assets/images/events/virtual.png';
    case EventType.HYBRID:
      return '/assets/images/events/hybrid.png';
    default:
      return '/assets/images/events/default.png';
  }
};

/**
 * Helper function to get the appropriate weather icon for notifications
 * 
 * @param weatherCondition - Weather condition string
 * @returns Weather icon or emoji
 */
const getWeatherIcon = (weatherCondition: string): string => {
  const condition = weatherCondition.toLowerCase();
  
  if (condition.includes('sunny') || condition.includes('clear')) {
    return '☀️';
  } else if (condition.includes('partly cloudy')) {
    return '⛅';
  } else if (condition.includes('cloudy')) {
    return '☁️';
  } else if (condition.includes('rain')) {
    return '🌧️';
  } else if (condition.includes('thunder') || condition.includes('storm')) {
    return '⛈️';
  } else if (condition.includes('snow')) {
    return '❄️';
  } else if (condition.includes('fog') || condition.includes('mist')) {
    return '🌫️';
  } else if (condition.includes('wind')) {
    return '💨';
  } else {
    return '🌤️'; // Default weather icon
  }
};