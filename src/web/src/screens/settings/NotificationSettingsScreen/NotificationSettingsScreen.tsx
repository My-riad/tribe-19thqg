import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { Alert } from 'react-native'; // react-native v0.70.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import {
  Container,
  ScrollContainer,
  SectionTitle,
  SectionContainer,
  NotificationItemContainer,
  NotificationItemContent,
  NotificationItemTitle,
  NotificationItemDescription,
  StyledSwitch,
  Divider,
  GlobalToggleContainer,
  GlobalToggleText,
  SaveButtonContainer
} from './NotificationSettingsScreen.styles';
import Button from '../../../components/ui/Button';
import { useNotifications } from '../../../hooks/useNotifications';
import {
  NotificationType,
  NotificationPreference,
  SettingsNavigationProp
} from '../../../types/notification.types';

/**
 * The main notification settings screen component that allows users to configure their notification preferences
 */
const NotificationSettingsScreen: React.FC = () => {
  // Get the navigation object using useNavigation hook
  const navigation = useNavigation<SettingsNavigationProp>();

  // Get notification preferences and methods from useNotifications hook
  const { preferences, updatePreferences, getPreferences } = useNotifications();

  // Initialize state for notification preferences, loading state, and whether changes have been made
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state for global notifications toggle
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(true);

  // Create a useEffect to load notification preferences when the component mounts
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      const prefs = await getPreferences();
      setNotificationPreferences(prefs);
      setGlobalNotificationsEnabled(prefs.every(p => p.enabled));
      setLoading(false);
    };

    loadPreferences();
  }, [getPreferences]);

  // Create a useEffect to set up a navigation listener to prompt for unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Changes', style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return () => unsubscribe();
  }, [navigation, hasChanges]);

  /**
   * Toggles all notifications on or off
   * @param value boolean
   */
  const handleToggleGlobalNotifications = useCallback((value: boolean) => {
    setGlobalNotificationsEnabled(value);
    const updatedPreferences = notificationPreferences.map(preference => ({
      ...preference,
      enabled: value,
    }));
    setNotificationPreferences(updatedPreferences);
    setHasChanges(true);
  }, [notificationPreferences]);

  /**
   * Toggles a specific notification type on or off
   * @param type NotificationType
   * @param value boolean
   */
  const handleToggleNotificationType = useCallback((type: NotificationType, value: boolean) => {
    const updatedPreferences = notificationPreferences.map(preference =>
      preference.type === type ? { ...preference, enabled: value } : preference
    );
    setNotificationPreferences(updatedPreferences);
    setHasChanges(true);

    // Check if all preferences are now disabled and update globalNotificationsEnabled accordingly
    const allDisabled = updatedPreferences.every(p => !p.enabled);
    setGlobalNotificationsEnabled(!allDisabled);
  }, [notificationPreferences]);

  /**
   * Toggles a specific notification channel for a notification type
   * @param type NotificationType
   * @param channel string
   * @param value boolean
   */
  const handleToggleChannel = useCallback((type: NotificationType, channel: string, value: boolean) => {
    const updatedPreferences = notificationPreferences.map(preference =>
      preference.type === type
        ? {
            ...preference,
            channels: {
              ...preference.channels,
              [channel]: value,
            },
          }
        : preference
    );
    setNotificationPreferences(updatedPreferences);
    setHasChanges(true);
  }, [notificationPreferences]);

  /**
   * Saves all notification preferences to the server
   */
  const handleSavePreferences = useCallback(async () => {
    setLoading(true);
    const success = await updatePreferences(notificationPreferences);
    if (success) {
      setHasChanges(false);
      Alert.alert('Success', 'Notification preferences saved successfully!');
    } else {
      Alert.alert('Error', 'Failed to save notification preferences. Please try again.');
    }
    setLoading(false);
  }, [notificationPreferences, updatePreferences]);

  /**
   * Helper function to get the display name and description for a notification type
   * @param type NotificationType
   * @returns object
   */
  const getNotificationTypeInfo = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRIBE_MATCH:
        return { name: 'Tribe Matches', description: 'New tribes that match your interests' };
      case NotificationType.TRIBE_INVITATION:
        return { name: 'Tribe Invitations', description: 'Invitations to join existing tribes' };
      case NotificationType.TRIBE_UPDATE:
        return { name: 'Tribe Updates', description: 'Updates and announcements from your tribes' };
      case NotificationType.EVENT_REMINDER:
        return { name: 'Event Reminders', description: 'Reminders for upcoming events' };
      case NotificationType.EVENT_INVITATION:
        return { name: 'Event Invitations', description: 'Invitations to events in your tribes' };
      case NotificationType.EVENT_UPDATE:
        return { name: 'Event Updates', description: 'Changes to events you\'re attending' };
      case NotificationType.CHAT_MESSAGE:
        return { name: 'Chat Messages', description: 'New messages in tribe chats' };
      case NotificationType.AI_SUGGESTION:
        return { name: 'AI Suggestions', description: 'AI-generated prompts and activity ideas' };
      case NotificationType.ACHIEVEMENT:
        return { name: 'Achievements', description: 'Notifications when you earn achievements' };
      case NotificationType.SYSTEM:
        return { name: 'System Notifications', description: 'Important account and app updates' };
      default:
        return { name: 'Unknown', description: 'Unknown notification type' };
    }
  };

  /**
   * Renders an individual notification preference item with toggle and channel options
   * @param preference NotificationPreference
   * @param index number
   */
  const renderNotificationItem = (preference: NotificationPreference, index: number) => {
    const { type, enabled, channels } = preference;
    const { name, description } = getNotificationTypeInfo(type);

    return (
      <React.Fragment key={type}>
        <NotificationItemContainer>
          <NotificationItemContent>
            <NotificationItemTitle>{name}</NotificationItemTitle>
            <NotificationItemDescription>{description}</NotificationItemDescription>
          </NotificationItemContent>
          <StyledSwitch
            value={enabled}
            onValueChange={(value) => handleToggleNotificationType(type, value)}
          />
        </NotificationItemContainer>
        {index < notificationPreferences.length - 1 && <Divider />}
      </React.Fragment>
    );
  };

  // Group notification types into categories for better organization
  const notificationCategories = [
    { title: 'Tribe Notifications', types: [NotificationType.TRIBE_MATCH, NotificationType.TRIBE_INVITATION, NotificationType.TRIBE_UPDATE] },
    { title: 'Event Notifications', types: [NotificationType.EVENT_REMINDER, NotificationType.EVENT_INVITATION, NotificationType.EVENT_UPDATE] },
    { title: 'Communication', types: [NotificationType.CHAT_MESSAGE] },
    { title: 'AI Engagement', types: [NotificationType.AI_SUGGESTION] },
    { title: 'Achievements & System', types: [NotificationType.ACHIEVEMENT, NotificationType.SYSTEM] },
  ];

  // Render the notification settings screen with global toggle, notification type sections, and save button
  return (
    <Container>
      <ScrollContainer>
        <GlobalToggleContainer>
          <GlobalToggleText>Global Notifications</GlobalToggleText>
          <StyledSwitch
            value={globalNotificationsEnabled}
            onValueChange={handleToggleGlobalNotifications}
          />
        </GlobalToggleContainer>

        {notificationCategories.map((category) => (
          <SectionContainer key={category.title}>
            <SectionTitle>{category.title}</SectionTitle>
            {category.types.map((type, index) => {
              const preference = notificationPreferences.find(p => p.type === type);
              if (!preference) return null;
              return renderNotificationItem(preference, index);
            })}
          </SectionContainer>
        ))}
      </ScrollContainer>

      <SaveButtonContainer>
        <Button
          onPress={handleSavePreferences}
          disabled={!hasChanges || loading}
          isLoading={loading}
        >
          Save Preferences
        </Button>
      </SaveButtonContainer>
    </Container>
  );
};

export default NotificationSettingsScreen;