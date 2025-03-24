# src/web/src/screens/main/HomeScreen/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, FlatList } from 'react-native'; // React Native v0.70.0
import { useFocusEffect } from '@react-navigation/native'; // @react-navigation/native v6.0.0

import { useAppSelector, useAppDispatch } from '../../store/hooks';
import useTribes from '../../hooks/useTribes';
import { useEvents } from '../../hooks/useEvents';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import TribeCard from '../../components/tribe/TribeCard/TribeCard';
import EventCard from '../../components/event/EventCard/EventCard';
import AIPrompt from '../../components/tribe/AIPrompt/AIPrompt';
import { NavigationService } from '../../navigation/NavigationService';
import { ROUTES } from '../../constants/navigationRoutes';
import {
  Container,
  Header,
  GreetingText,
  NotificationButton,
  SectionTitle,
  SectionContainer,
  CardsList,
  EmptyStateContainer,
  EmptyStateText,
  LoadingIndicator,
  Badge,
} from './HomeScreen.styles';

/**
 * Main home screen component that displays personalized content for the user
 */
const HomeScreen: React.FC = () => {
  // LD1: Get authentication state using useAuth hook
  const { user } = useAuth();

  // LD1: Get tribe-related data and functions using useTribes hook
  const { tribes, userTribes, suggestedTribes, loading: tribesLoading } = useTribes();

  // LD1: Get event-related data and functions using useEvents hook
  const { events, loading: eventsLoading } = useEvents();

  // LD1: Get notification-related data and functions using useNotifications hook
  const { unreadCount } = useNotifications();

  // LD1: Initialize refreshing state with useState
  const [refreshing, setRefreshing] = useState(false);

  // LD1: Create handleRefresh function to refresh data when pull-to-refresh is triggered
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Implement refresh logic for tribes, events, and notifications
    setRefreshing(false);
  }, []);

  // LD1: Create handleTribePress function to navigate to tribe details when a tribe card is pressed
  const handleTribePress = useCallback((tribeId: string) => {
    NavigationService.navigateToTribe(ROUTES.TRIBE.TRIBE_DETAIL, { tribeId });
  }, []);

  // LD1: Create handleEventPress function to navigate to event details when an event card is pressed
  const handleEventPress = useCallback((eventId: string) => {
    NavigationService.navigateToEvent(ROUTES.EVENT.EVENT_DETAIL, { eventId });
  }, []);

  // LD1: Create handleNotificationsPress function to navigate to notifications screen
  const handleNotificationsPress = useCallback(() => {
    NavigationService.navigateToNotification();
  }, []);

  // LD1: Use useFocusEffect to refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // TODO: Implement refresh logic for tribes, events, and notifications
    }, [])
  );

  // LD1: Use useEffect to fetch initial data when component mounts
  useEffect(() => {
    // TODO: Implement initial data fetching logic for tribes, events, and notifications
  }, []);

  // LD1: Helper function to get a time-appropriate greeting
  const getGreeting = (): string => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      return 'Good morning';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'Good afternoon';
    } else if (currentHour >= 17 && currentHour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  };

  // LD1: Render the HomeScreen component
  return (
    <Container>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Header>
          {/* LD1: Render welcome message with user's name */}
          <GreetingText>
            {getGreeting()}, {user?.name || 'User'}
          </GreetingText>
          {/* LD1: Render notification button with unread count badge */}
          <NotificationButton onPress={handleNotificationsPress}>
            {unreadCount > 0 && <Badge type="notification" count={unreadCount} />}
            {/* TODO: Implement Notification Icon */}
          </NotificationButton>
        </Header>

        {/* LD1: Render AI-generated notification or prompt if available */}
        {/* TODO: Implement AI prompt component and data fetching */}
        {/* <AIPrompt engagement={/* AI prompt data *//*} /> */}

        {/* LD1: Render user's tribes section with horizontal scrollable list of TribeCard components */}
        <SectionContainer>
          <SectionTitle>Your Tribes</SectionTitle>
          {tribesLoading ? (
            <LoadingIndicator />
          ) : userTribes.length > 0 ? (
            <CardsList horizontal>
              {userTribes.map((tribeId) => {
                const tribe = tribes[tribeId];
                return tribe ? (
                  <TribeCard
                    key={tribe.id}
                    tribe={tribe}
                    onPress={handleTribePress}
                  />
                ) : null;
              })}
            </CardsList>
          ) : (
            <EmptyStateContainer>
              <EmptyStateText>No tribes yet. Create or join one!</EmptyStateText>
              {/* TODO: Implement Create Tribe Button */}
            </EmptyStateContainer>
          )}
        </SectionContainer>

        {/* LD1: Render suggested tribes section with horizontal scrollable list of TribeCard components */}
        <SectionContainer>
          <SectionTitle>Suggested Tribes</SectionTitle>
          {tribesLoading ? (
            <LoadingIndicator />
          ) : suggestedTribes.length > 0 ? (
            <CardsList horizontal>
              {suggestedTribes.map((tribeId) => {
                const tribe = tribes[tribeId];
                return tribe ? (
                  <TribeCard
                    key={tribe.id}
                    tribe={tribe}
                    onPress={handleTribePress}
                  />
                ) : null;
              })}
            </CardsList>
          ) : (
            <EmptyStateContainer>
              <EmptyStateText>No suggested tribes available.</EmptyStateText>
              {/* TODO: Implement Browse Tribes Button */}
            </EmptyStateContainer>
          )}
        </SectionContainer>

        {/* LD1: Render upcoming events section with horizontal scrollable list of EventCard components */}
        <SectionContainer>
          <SectionTitle>Upcoming Events</SectionTitle>
          {eventsLoading ? (
            <LoadingIndicator />
          ) : events.length > 0 ? (
            <CardsList horizontal>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={handleEventPress}
                />
              ))}
            </CardsList>
          ) : (
            <EmptyStateContainer>
              <EmptyStateText>No upcoming events. Plan one now!</EmptyStateText>
              {/* TODO: Implement Plan Event Button */}
            </EmptyStateContainer>
          )}
        </SectionContainer>
      </ScrollView>
    </Container>
  );
};

export default HomeScreen;