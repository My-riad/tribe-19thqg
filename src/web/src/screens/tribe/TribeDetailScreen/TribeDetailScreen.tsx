# src/web/src/screens/tribe/TribeDetailScreen/TribeDetailScreen.tsx
```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // react v18.2.0
import { ScrollView, View, Text, Image, TouchableOpacity, FlatList, Alert } from 'react-native'; // react-native ^0.70.0
import { RouteProp, useRoute } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import {
  Container,
  ScrollContainer,
  HeaderContainer,
  TribeImage,
  TribeInfo,
  TribeName,
  TribeMeta,
  TribeDescription,
  SectionTitle,
  ActionButtonsContainer,
  LoadingContainer,
  ErrorContainer,
} from './TribeDetailScreen.styles';
import ActivityFeed from '../../../components/tribe/ActivityFeed';
import MembersList from '../../../components/tribe/MembersList';
import EventCard from '../../../components/event/EventCard';
import Button from '../../../components/ui/Button';
import LoadingIndicator from '../../../components/ui/LoadingIndicator';
import Badge from '../../../components/ui/Badge';
import useTribes from '../../../hooks/useTribes';
import useAuth from '../../../hooks/useAuth';
import { NavigationService } from '../../../navigation/NavigationService';
import { ROUTES } from '../../../constants/navigationRoutes';
import { Tribe, TribeMember, TribeActivity, TribeStatus, MemberRole } from '../../../types/tribe.types';
import { TribeStackParamList } from '../../../types/navigation.types';

// Define the type for the route prop containing tribe detail parameters
type TribeDetailScreenRouteProp = RouteProp<TribeStackParamList, 'TribeDetail'>;

/**
 * Screen component that displays detailed information about a tribe
 */
const TribeDetailScreen: React.FC = () => {
  // Get the route parameters using useRoute hook to extract tribeId
  const route = useRoute<TribeDetailScreenRouteProp>();
  const { tribeId } = route.params;

  // Get tribe-related functions using useTribes hook
  const { 
    currentTribe, 
    loading, 
    error, 
    getTribeById, 
    joinExistingTribe, 
    leaveCurrentTribe,
    getTribeActivity,
    setActiveTribe,
  } = useTribes();

  // Get current user information using useAuth hook
  const { user } = useAuth();

  // Set up state for loading more activities
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);

  // Set up state for selected member
  const [selectedMember, setSelectedMember] = useState<TribeMember | null>(null);

  // Create a memoized function to check if current user is a tribe member
  const isCurrentUserMember = useCallback(() => {
    return currentTribe?.members?.some(member => member.userId === user?.id);
  }, [currentTribe?.members, user?.id]);

  // Create a memoized function to check if current user is the tribe creator or admin
  const isCurrentUserCreator = useCallback(() => {
    return currentTribe?.createdBy === user?.id;
  }, [currentTribe?.createdBy, user?.id]);

  // Create a memoized function to handle joining the tribe
  const handleJoinTribe = useCallback(async () => {
    if (tribeId) {
      try {
        await joinExistingTribe(tribeId, 'Request to join');
        getTribeById(tribeId); // Refresh tribe data after joining
      } catch (err) {
        console.error('Failed to join tribe:', err);
        Alert.alert('Error', 'Failed to join tribe. Please try again.');
      }
    }
  }, [tribeId, joinExistingTribe, getTribeById]);

  // Create a memoized function to handle leaving the tribe
  const handleLeaveTribe = useCallback(async () => {
    if (tribeId) {
      try {
        await leaveCurrentTribe(tribeId);
      } catch (err) {
        console.error('Failed to leave tribe:', err);
        Alert.alert('Error', 'Failed to leave tribe. Please try again.');
      }
    }
  }, [tribeId, leaveCurrentTribe]);

  // Create a memoized function to handle navigating to tribe chat
  const handleNavigateToChat = useCallback(() => {
    NavigationService.navigateToTribe(ROUTES.TRIBE.TRIBE_CHAT, { tribeId });
  }, [tribeId]);

  // Create a memoized function to handle navigating to event planning
  const handleNavigateToEventPlanning = useCallback(() => {
    NavigationService.navigateToEvent(ROUTES.EVENT.EVENT_PLANNING, { tribeId });
  }, [tribeId]);

  // Create a memoized function to handle navigating to member list
  const handleNavigateToMemberList = useCallback(() => {
    NavigationService.navigateToTribe(ROUTES.TRIBE.MEMBER_LIST, { tribeId });
  }, [tribeId]);

    // Create a memoized function to handle navigating to event details
    const handleNavigateToEventDetails = useCallback((eventId: string) => {
      NavigationService.navigateToEvent(ROUTES.EVENT.EVENT_DETAIL, { eventId });
    }, []);

  // Create a memoized function to handle loading more activities
  const handleLoadMoreActivities = useCallback(async () => {
    setLoadingMoreActivities(true);
    try {
      await getTribeActivity(tribeId);
    } catch (err) {
      console.error('Failed to load more activities:', err);
      Alert.alert('Error', 'Failed to load more activities. Please try again.');
    } finally {
      setLoadingMoreActivities(false);
    }
  }, [tribeId, getTribeActivity]);

  // Use useEffect to fetch tribe details, members, and activities when component mounts or tribeId changes
  useEffect(() => {
    getTribeById(tribeId);
    getTribeActivity(tribeId);
  }, [tribeId, getTribeById, getTribeActivity]);

  // Use useEffect to set the active tribe in the global state
  useEffect(() => {
    setActiveTribe(tribeId);

    return () => {
      setActiveTribe(null);
    };
  }, [tribeId, setActiveTribe]);

  // Helper function to format member count with appropriate text
  const formatMemberCount = (count: number): string => {
    return `${count} member${count !== 1 ? 's' : ''}`;
  };

  // Helper function to format tribe creation date
  const formatCreationDate = (date: Date): string => {
    return `Created ${date}`;
  };

  // Helper function to render a badge for tribe status
  const getTribeStatusBadge = (status: TribeStatus): JSX.Element => {
    switch (status) {
      case TribeStatus.ACTIVE:
        return <Badge variant="success">Active</Badge>;
      case TribeStatus.INACTIVE:
        return <Badge variant="warning">Inactive</Badge>;
      case TribeStatus.FORMATION:
        return <Badge variant="primary">Formation</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingIndicator size="large" />
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <Text>Error: {error}</Text>
          <Button onPress={() => getTribeById(tribeId)}>Retry</Button>
        </ErrorContainer>
      </Container>
    );
  }

  if (!currentTribe) {
    return null;
  }

  return (
    <Container>
      <ScrollContainer>
        <HeaderContainer>
          <TribeImage source={{ uri: currentTribe.imageUrl }} />
          <TribeInfo>
            <TribeName>{currentTribe.name}</TribeName>
            <TribeMeta>
              {formatMemberCount(currentTribe.memberCount)} • {formatCreationDate(currentTribe.createdAt)}
            </TribeMeta>
            <TribeDescription>{currentTribe.description}</TribeDescription>
          </TribeInfo>
        </HeaderContainer>

        <ActionButtonsContainer>
          {isCurrentUserMember() ? (
            <>
              <Button onPress={handleNavigateToChat}>Chat</Button>
              <Button onPress={handleNavigateToEventPlanning}>Plan Event</Button>
            </>
          ) : (
            <Button onPress={handleJoinTribe}>Join Tribe</Button>
          )}
        </ActionButtonsContainer>

        <SectionTitle>Members</SectionTitle>
        <MembersList 
          members={currentTribe.members} 
          onMemberPress={(member) => setSelectedMember(member)}
        />

        <SectionTitle>Upcoming Events</SectionTitle>
        {currentTribe.activities && currentTribe.activities.length > 0 ? (
          currentTribe.activities.map((event) => (
            <EventCard key={event.id} event={event} onPress={handleNavigateToEventDetails} />
          ))
        ) : (
          <Text>No upcoming events</Text>
        )}

        <SectionTitle>Recent Activity</SectionTitle>
        <ActivityFeed 
          activities={currentTribe.activities} 
          onLoadMore={handleLoadMoreActivities}
          loading={loadingMoreActivities}
        />
      </ScrollContainer>
    </Container>
  );
};

export default TribeDetailScreen;