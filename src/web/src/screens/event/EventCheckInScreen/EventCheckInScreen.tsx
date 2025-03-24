import React, { useState, useEffect, useCallback } from 'react'; // React v18.0.0
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native'; // react-native v0.70.0
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import Button from '../../components/ui/Button'; // Button component for check-in action
import { useEvents } from '../../hooks/useEvents'; // Hook for event-related operations
import { useLocation } from '../../hooks/useLocation'; // Hook for location-related operations
import { useNotifications } from '../../hooks/useNotifications'; // Hook for displaying notifications
import { EventNavigationProp, EventStackParamList } from '../../types/navigation.types'; // Type for event navigation props
import { theme } from '../../theme'; // Application theme for styling

/**
 * Interface defining the props for the EventCheckInScreen component
 */
interface EventCheckInScreenProps {
  navigation: EventNavigationProp;
  route: RouteProp<EventStackParamList, 'EventCheckIn'>;
}

/**
 * Screen component for checking in to an event
 */
const EventCheckInScreen: React.FC<EventCheckInScreenProps> = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<EventNavigationProp>();

  // Get route object using useRoute hook
  const route = useRoute<RouteProp<EventStackParamList, 'EventCheckIn'>>();

  // Extract eventId from route params
  const { eventId } = route.params;

  // Get event-related functions and state from useEvents hook
  const { fetchEvent, checkInToEvent, currentEvent, loading: eventLoading, error: eventError } = useEvents();

  // Get location-related functions and state from useLocation hook
  const { currentLocation, isLoading: locationLoading, error: locationError, getCurrentLocation, isWithinRadius, calculateDistance } = useLocation();

  // Get notification function from useNotifications hook
  const { showNotification } = useNotifications();

  // Initialize state for check-in status
  const [checkingIn, setCheckingIn] = useState(false);

  // Initialize state for proximity verification
  const [withinProximity, setWithinProximity] = useState(false);

  // Define the proximity radius in kilometers
  const proximityRadiusKm = 0.1; // 100 meters

  // Fetch event details when component mounts
  useEffect(() => {
    fetchEvent(eventId);
  }, [eventId, fetchEvent]);

  // Get current location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Calculate distance to event venue when location and event data are available
  useEffect(() => {
    if (currentLocation && currentEvent) {
      const eventCoordinates = {
        latitude: currentEvent.coordinates.latitude,
        longitude: currentEvent.coordinates.longitude,
      };
      const distance = calculateDistance(currentLocation, eventCoordinates);
      setWithinProximity(isWithinRadius(currentLocation, eventCoordinates, proximityRadiusKm));
    }
  }, [currentLocation, currentEvent, calculateDistance, isWithinRadius, proximityRadiusKm]);

  // Handle check-in button press
  const handleCheckIn = async () => {
    if (!currentEvent) {
      showNotification({ message: 'Event details not loaded.', type: 'error' });
      return;
    }

    if (!currentLocation) {
      showNotification({ message: 'Location not available. Please try again.', type: 'error' });
      return;
    }

    if (!withinProximity) {
      showNotification({ message: 'You are not within the required proximity to check in.', type: 'warning' });
      return;
    }

    setCheckingIn(true);
    try {
      await checkInToEvent(eventId, {
        coordinates: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
      });
      showNotification({ message: 'Check-in successful!', type: 'success' });
      navigation.goBack();
    } catch (error: any) {
      showNotification({ message: error.message || 'Failed to check in.', type: 'error' });
    } finally {
      setCheckingIn(false);
    }
  };

  // Render loading state if data is being fetched
  if (eventLoading || locationLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Verifying location and event details...</Text>
      </View>
    );
  }

  // Render error state if there was an error
  if (eventError || locationError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Error: {eventError || locationError}
        </Text>
      </View>
    );
  }

  // Render event details and check-in button
  return (
    <View style={styles.container}>
      {currentEvent && (
        <View style={styles.eventDetails}>
          <Text style={styles.title}>{currentEvent.name}</Text>
          <Text style={styles.description}>{currentEvent.description}</Text>
          <Text style={styles.location}>Location: {currentEvent.location}</Text>
          <Text style={styles.time}>
            Time: {new Date(currentEvent.startTime).toLocaleTimeString()}
          </Text>
          <Text style={styles.distance}>
            Distance: {withinProximity ? 'Within proximity' : 'Not within proximity'}
          </Text>
        </View>
      )}

      <Button
        onPress={handleCheckIn}
        disabled={!withinProximity || checkingIn}
        isLoading={checkingIn}
        accessibilityLabel="Check in to event"
        testID="check-in-button"
      >
        {checkingIn ? 'Checking In...' : 'Check In'}
      </Button>
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDetails: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  location: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.xs,
  },
  time: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.xs,
  },
  distance: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error.main,
    textAlign: 'center',
  },
});

export default EventCheckInScreen;