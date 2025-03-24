import React, { useCallback, useEffect, useState } from 'react'; // React library for building user interfaces // react ^18.2.0
import { View, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native'; // React Native components for building UI
import { useNotifications } from '../../../hooks/useNotifications'; // Custom hook for notification functionality
import { NavigationService } from '../../../navigation'; // Navigation service for navigating to related content
import ListItem from '../../../components/ui/ListItem'; // UI component for rendering notification items
import LoadingIndicator from '../../../components/ui/LoadingIndicator'; // UI component for loading states
import Button from '../../../components/ui/Button'; // UI component for actions like 'Mark All as Read'
import { Notification, NotificationType } from '../../../types/notification.types'; // Type definition for notification data
import { styles } from './NotificationScreen.styles'; // Styles for the notification screen

/**
 * Screen component that displays and manages user notifications
 */
const NotificationScreen: React.FC = () => {
  // LD1: Get notification data and functions from useNotifications hook
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, getNotifications } = useNotifications();

  // LD1: Initialize refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // LD1: Initialize grouped notifications state
  const [groupedNotifications, setGroupedNotifications] = useState<{ [date: string]: Notification[] }>({});

  // LD1: Create a function to group notifications by date
  const groupNotificationsByDate = useCallback((notifications: Notification[]): { [date: string]: Notification[] } => {
    const grouped: { [date: string]: Notification[] } = {};
    notifications.forEach(notification => {
      const date = formatDate(notification.createdAt);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(notification);
    });
    return grouped;
  }, []);

  // LD1: Create a function to handle notification press
  const handleNotificationPress = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    // LD1: Extract navigation data from notification payload
    const { payload } = notification;

    // LD1: Navigate to appropriate screen based on notification type
    switch (notification.type) {
      case NotificationType.TRIBE_MATCH:
        NavigationService.navigate('TribeDetail', { tribeId: payload?.tribeId });
        break;
      case NotificationType.EVENT_REMINDER:
        NavigationService.navigate('EventDetail', { eventId: payload?.eventId });
        break;
      default:
        console.log('No action defined for notification type:', notification.type);
    }
  }, [markAsRead]);

  // LD1: Create a function to handle notification deletion
  const handleNotificationDeletion = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  // LD1: Create a function to handle marking a notification as read
  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  // LD1: Create a function to handle marking all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // LD1: Create a function to handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getNotifications()
      .finally(() => setRefreshing(false));
  }, [getNotifications]);

  // LD1: Fetch notifications on component mount
  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  // LD1: Group notifications by date when notifications change
  useEffect(() => {
    if (notifications) {
      setGroupedNotifications(groupNotificationsByDate(notifications));
    }
  }, [notifications, groupNotificationsByDate]);

  // LD1: Render loading indicator when loading
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator />
      </View>
    );
  }

  // LD1: Render empty state when no notifications
  if (!notifications || notifications.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No notifications yet.</Text>
      </View>
    );
  }

  // LD1: Render FlatList with grouped notifications
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(notification => !notification.isRead) && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButtonText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={Object.entries(groupedNotifications)}
        keyExtractor={(item) => item[0]}
        renderItem={({ item: [date, notifications] }) => (
          <View>
            <Text style={styles.notificationHeader}>{date}</Text>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItemContainer}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

// LD1: Helper function to format dates for grouping
const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const inputDate = new Date(date);

  if (inputDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (inputDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const day = String(inputDate.getDate()).padStart(2, '0');
    const year = inputDate.getFullYear();
    return `${month}/${day}/${year}`;
  }
};

// LD1: Helper function to get the appropriate icon for a notification type
const getNotificationIcon = (type: NotificationType): JSX.Element => {
  switch (type) {
    case NotificationType.TRIBE_MATCH:
      return <Text>Tribe Match Icon</Text>;
    case NotificationType.EVENT_REMINDER:
      return <Text>Event Reminder Icon</Text>;
    default:
      return <Text>Default Icon</Text>;
  }
};

// LD1: Function to handle notification press and navigate to related content
const handleNotificationPress = (notification: Notification): void => {
  // LD1: Mark notification as read if not already read
  if (!notification.isRead) {
    markAsRead(notification.id);
  }

  // LD1: Extract navigation data from notification payload
  const { payload } = notification;

  // LD1: Navigate to appropriate screen based on notification type
  switch (notification.type) {
    // LD1: Handle tribe-related notifications
    case NotificationType.TRIBE_MATCH:
      if (payload?.tribeId) {
        NavigationService.navigate('TribeDetail', { tribeId: payload.tribeId });
      }
      break;

    // LD1: Handle event-related notifications
    case NotificationType.EVENT_REMINDER:
      if (payload?.eventId) {
        NavigationService.navigate('EventDetail', { eventId: payload.eventId });
      }
      break;

    // LD1: Handle chat-related notifications
    case NotificationType.CHAT_MESSAGE:
      if (payload?.tribeId) {
        NavigationService.navigate('TribeChat', { tribeId: payload.tribeId });
      }
      break;

    // LD1: Handle achievement-related notifications
    case NotificationType.ACHIEVEMENT:
      if (payload?.achievementId) {
        // NavigationService.navigate('AchievementDetail', { achievementId: payload.achievementId });
      }
      break;

    // LD1: Handle AI suggestion notifications
    case NotificationType.AI_SUGGESTION:
      if (payload?.suggestionType) {
        // NavigationService.navigate('AISuggestionDetail', { suggestionType: payload.suggestionType });
      }
      break;

    default:
      console.log('No action defined for notification type:', notification.type);
  }
};

export default NotificationScreen;