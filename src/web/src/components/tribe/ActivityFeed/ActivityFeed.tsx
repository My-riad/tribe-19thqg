import React, { useState, useEffect, useMemo } from 'react';
import { Text, TouchableOpacity, FlatList } from 'react-native';
import {
  Container,
  Title,
  ActivityList,
  ActivityItem,
  ActivityIcon,
  ActivityContent,
  ActivityText,
  ActivityTime,
  EmptyState,
  ViewMoreButton
} from './ActivityFeed.styles';
import { TribeActivity, ActivityType } from '../../../types/tribe.types';
import { formatRelativeTime } from '../../../utils/dateTime';
import { GroupIcon, CalendarIcon, InfoIcon, SuccessIcon } from '../../../assets/icons';

/**
 * Props interface for the ActivityFeed component
 */
interface ActivityFeedProps {
  /** Array of activity data to display */
  activities: TribeActivity[];
  /** Optional title for the feed, defaults to "RECENT ACTIVITY" */
  title?: string;
  /** Optional limit for the number of activities initially shown, defaults to 5 */
  limit?: number;
  /** Optional callback for loading more activities */
  onLoadMore?: () => void;
  /** Optional flag to indicate if more activities are being loaded */
  loading?: boolean;
}

/**
 * Helper function to get the appropriate icon based on activity type
 */
const getActivityIcon = (activityType: ActivityType): JSX.Element => {
  switch (activityType) {
    case ActivityType.MEMBER_JOINED:
    case ActivityType.MEMBER_LEFT:
      return <GroupIcon width={24} height={24} />;
    case ActivityType.EVENT_CREATED:
    case ActivityType.EVENT_UPDATED:
    case ActivityType.EVENT_CANCELLED:
    case ActivityType.EVENT_COMPLETED:
      return <CalendarIcon width={24} height={24} />;
    case ActivityType.GOAL_CREATED:
    case ActivityType.GOAL_COMPLETED:
      return <SuccessIcon width={24} height={24} />;
    case ActivityType.AI_SUGGESTION:
    case ActivityType.TRIBE_UPDATED:
    default:
      return <InfoIcon width={24} height={24} />;
  }
};

/**
 * Component that displays a chronological feed of activities within a tribe,
 * such as member joins, event creations, and AI suggestions.
 */
const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  title = 'RECENT ACTIVITY',
  limit = 5,
  onLoadMore,
  loading = false
}) => {
  const [visibleActivities, setVisibleActivities] = useState<number>(limit);
  
  // Sort activities by timestamp (newest first)
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [activities]);
  
  // Handle loading more activities
  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    } else {
      setVisibleActivities(prev => prev + limit);
    }
  };
  
  // Display only the limited number of activities
  const displayedActivities = sortedActivities.slice(0, visibleActivities);
  
  return (
    <Container>
      <Title>{title}</Title>
      
      {activities.length === 0 ? (
        <EmptyState>
          <ActivityText>No recent activities in this tribe yet</ActivityText>
        </EmptyState>
      ) : (
        <>
          <ActivityList>
            {displayedActivities.map((activity) => (
              <ActivityItem key={activity.id}>
                <ActivityIcon>
                  {getActivityIcon(activity.activityType)}
                </ActivityIcon>
                <ActivityContent>
                  <ActivityText>{activity.description}</ActivityText>
                  <ActivityTime>{formatRelativeTime(activity.timestamp)}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>
          
          {sortedActivities.length > visibleActivities && (
            <ViewMoreButton onPress={handleLoadMore} disabled={loading}>
              <Text>{loading ? 'Loading...' : 'View More'}</Text>
            </ViewMoreButton>
          )}
        </>
      )}
    </Container>
  );
};

export default ActivityFeed;