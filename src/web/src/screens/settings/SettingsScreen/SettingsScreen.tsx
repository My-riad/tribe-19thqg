import React, { useState, useCallback } from 'react'; // react ^18.2.0
import { Alert } from 'react-native'; // react-native ^0.70.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import {
  Container,
  ScrollContainer,
  SectionContainer,
  SectionTitle,
  LogoutButtonContainer,
} from './SettingsScreen.styles';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { NavigationService } from '../../../navigation/NavigationService';
import { ROUTES } from '../../../constants/navigationRoutes';
import { SettingsNavigationProp } from '../../../types/navigation.types';

/**
 * Component that displays the settings screen with various settings categories and a logout button
 * @returns Rendered settings screen component
 */
const SettingsScreen: React.FC = () => {
  // Get the navigation prop using useNavigation hook
  const navigation = useNavigation<SettingsNavigationProp>();

  // Get authentication functions using useAuth hook
  const { logout } = useAuth();

  // Create a state variable for loading state during logout
  const [loading, setLoading] = useState(false);

  // Define a handleLogout function that shows a confirmation dialog
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: confirmLogout,
        },
      ],
      { cancelable: false }
    );
  }, [confirmLogout]);

  // Define a confirmLogout function that logs the user out and resets navigation to the auth screen
  const confirmLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logout();
      NavigationService.reset({
        index: 0,
        routes: [{ name: ROUTES.ROOT.AUTH }],
      });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Define navigation handlers for each settings category
  const handleAutoMatchingPress = useCallback(() => {
    NavigationService.navigateToSettings('AutoMatchingPreferences');
  }, []);

  const handleNotificationSettingsPress = useCallback(() => {
    NavigationService.navigateToSettings('NotificationSettings');
  }, []);

  const handlePrivacySettingsPress = useCallback(() => {
    NavigationService.navigateToSettings('PrivacySettings');
  }, []);

  // Render the settings screen with sections for Account, Tribes & Events, Payment Methods, and Support
  return (
    <Container>
      <ScrollContainer>
        <SectionContainer>
          <SectionTitle>Account</SectionTitle>
          <ListItem
            title="Profile Information"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to profile information screen
            }}
            variant="interactive"
          />
          <ListItem
            title="Privacy Settings"
            trailingElement={'>'}
            onPress={handlePrivacySettingsPress}
            variant="interactive"
          />
          <ListItem
            title="Notification Preferences"
            trailingElement={'>'}
            onPress={handleNotificationSettingsPress}
            variant="interactive"
          />
          <ListItem
            title="Connected Accounts"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to connected accounts screen
            }}
            variant="interactive"
          />
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Tribes & Events</SectionTitle>
          <ListItem
            title="Auto-Matching Preferences"
            trailingElement={'>'}
            onPress={handleAutoMatchingPress}
            variant="interactive"
          />
          <ListItem
            title="Event Preferences"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to event preferences screen
            }}
            variant="interactive"
          />
          <ListItem
            title="Calendar Integration"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to calendar integration screen
            }}
            variant="interactive"
          />
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Payment Methods</SectionTitle>
          <ListItem
            title="Add Payment Method"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to add payment method screen
            }}
            variant="interactive"
          />
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Support</SectionTitle>
          <ListItem
            title="Help Center"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to help center screen
            }}
            variant="interactive"
          />
          <ListItem
            title="Contact Support"
            trailingElement={'>'}
            onPress={() => {
              // Navigate to contact support screen
            }}
            variant="interactive"
          />
        </SectionContainer>

        {/* Render the logout button at the bottom of the screen */}
        <LogoutButtonContainer>
          <Button
            variant="secondary"
            onPress={handleLogout}
            disabled={loading}
            isLoading={loading}
          >
            Log Out
          </Button>
        </LogoutButtonContainer>
      </ScrollContainer>
    </Container>
  );
};

export default SettingsScreen;