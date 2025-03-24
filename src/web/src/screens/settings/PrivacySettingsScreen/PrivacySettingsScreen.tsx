import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import { Alert, Switch, TouchableOpacity } from 'react-native'; // react-native v0.70.0
import Toast from 'react-native-toast-message'; // react-native-toast-message v2.1.5

import {
  Container,
  ScrollContainer,
  SectionContainer,
  SectionTitle,
  PrivacyItemContainer,
  PrivacyItemContent,
  PrivacyItemTitle,
  PrivacyItemDescription,
  StyledSwitch,
  Divider,
  VisibilitySelector,
  VisibilityOption,
  VisibilityOptionText,
  DataUsageContainer,
  WarningText,
  ActionButtonContainer,
  ActionButton,
  ActionButtonText,
  SaveButtonContainer
} from './PrivacySettingsScreen.styles';
import Button from '../../../components/ui';
import Dialog from '../../../components/ui/Dialog';
import { useProfile } from '../../../hooks/useProfile';
import { SettingsNavigationProp } from '../../../types/navigation.types';
import { PreferenceCategory } from '../../../types/profile.types';
import { profileApi } from '../../../api/profileApi';

/**
 * The main privacy settings screen component that allows users to configure privacy-related settings
 */
const PrivacySettingsScreen: React.FC = () => {
  // 1. Get the navigation object using useNavigation hook
  const navigation = useNavigation<SettingsNavigationProp>();

  // 2. Get profile data and updateUserProfile function from useProfile hook
  const { profile, updateUserProfile } = useProfile();

  // 3. Initialize state for privacy settings using useState hooks
  const [profileVisibility, setProfileVisibility] = useState<string>('public');
  const [locationSharingEnabled, setLocationSharingEnabled] = useState<boolean>(true);
  const [dataUsageEnabled, setDataUsageEnabled] = useState<boolean>(true);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isDataDeletionDialogVisible, setIsDataDeletionDialogVisible] = useState<boolean>(false);

  // 4. Fetch current privacy preferences when component mounts
  useEffect(() => {
    fetchPrivacyPreferences();
  }, []);

  // 5. Define handlers for toggling switches and selecting visibility options
  const handleToggle = (setting: string) => {
    switch (setting) {
      case 'locationSharing':
        setLocationSharingEnabled(!locationSharingEnabled);
        break;
      case 'dataUsage':
        setDataUsageEnabled(!dataUsageEnabled);
        break;
      default:
        break;
    }
    setHasChanges(true);
  };

  const handleVisibilityChange = (visibility: string) => {
    setProfileVisibility(visibility);
    setHasChanges(true);
  };

  // 6. Define a saveSettings function to persist privacy settings
  const saveSettings = async () => {
    try {
      const preferenceUpdates = [
        { category: PreferenceCategory.PRIVACY, setting: 'profileVisibility', value: profileVisibility },
        { category: PreferenceCategory.PRIVACY, setting: 'locationSharing', value: locationSharingEnabled.toString() },
        { category: PreferenceCategory.PRIVACY, setting: 'dataUsage', value: dataUsageEnabled.toString() },
      ];

      await Promise.all(
        preferenceUpdates.map(pref => profileApi.updatePreference(pref))
      );

      Toast.show({
        type: 'success',
        text1: 'Privacy settings saved successfully!',
      });

      setHasChanges(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to save privacy settings.',
        text2: (error as any).message || 'Please try again.'
      });
    }
  };

  // 7. Define a handleDataDeletion function to show confirmation dialog for data deletion
  const handleDataDeletion = () => {
    Alert.alert(
      "Delete Your Data",
      "Are you sure you want to delete your data? This action is irreversible.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Are you absolutely sure? This will permanently delete your account and all associated data.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Confirm Delete",
                  style: "destructive",
                  onPress: () => {
                    // Implement the actual data deletion logic here
                    // This is a placeholder for the actual implementation
                    console.warn("Data deletion initiated - implementation pending");
                    Toast.show({
                      type: 'info',
                      text1: 'Data deletion initiated. This process may take some time.',
                    });
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleDataDownload = () => {
    Toast.show({
      type: 'info',
      text1: 'Preparing your data for download...',
    });
    console.warn("Data download initiated - implementation pending");
  };

  // Function to fetch the user's current privacy preferences
  const fetchPrivacyPreferences = async () => {
    try {
      const response = await profileApi.getPreferences();
      if (response.success) {
        const privacyPreferences = response.data.filter(pref => pref.category === PreferenceCategory.PRIVACY);
        privacyPreferences.forEach(pref => {
          switch (pref.setting) {
            case 'profileVisibility':
              setProfileVisibility(pref.value);
              break;
            case 'locationSharing':
              setLocationSharingEnabled(pref.value === 'true');
              break;
            case 'dataUsage':
              setDataUsageEnabled(pref.value === 'true');
              break;
            default:
              break;
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch privacy preferences:", error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch privacy preferences.',
        text2: (error as any).message || 'Please try again.'
      });
    }
  };

  // 8. Render the privacy settings screen with different sections
  return (
    <Container>
      <ScrollContainer>
        <SectionContainer>
          <SectionTitle>Profile Visibility</SectionTitle>
          <PrivacyItemContainer>
            <PrivacyItemContent>
              <PrivacyItemTitle>Who can see your profile?</PrivacyItemTitle>
              <PrivacyItemDescription>Control who can view your profile information.</PrivacyItemDescription>
            </PrivacyItemContent>
            {/* 9. Render profile visibility settings with options (Public, Tribe Members Only, Private) */}
            <VisibilitySelector>
              <VisibilityOption
                selected={profileVisibility === 'public'}
                onPress={() => handleVisibilityChange('public')}
              >
                <VisibilityOptionText selected={profileVisibility === 'public'}>Public</VisibilityOptionText>
              </VisibilityOption>
              <VisibilityOption
                selected={profileVisibility === 'tribeMembersOnly'}
                onPress={() => handleVisibilityChange('tribeMembersOnly')}
              >
                <VisibilityOptionText selected={profileVisibility === 'tribeMembersOnly'}>Tribe Members Only</VisibilityOptionText>
              </VisibilityOption>
              <VisibilityOption
                selected={profileVisibility === 'private'}
                onPress={() => handleVisibilityChange('private')}
              >
                <VisibilityOptionText selected={profileVisibility === 'private'}>Private</VisibilityOptionText>
              </VisibilityOption>
            </VisibilitySelector>
          </PrivacyItemContainer>
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Location Sharing</SectionTitle>
          <PrivacyItemContainer>
            <PrivacyItemContent>
              <PrivacyItemTitle>Share your location</PrivacyItemTitle>
              <PrivacyItemDescription>Allow Tribe to access your location for local recommendations.</PrivacyItemDescription>
            </PrivacyItemContent>
            {/* 10. Render location sharing settings with toggle switches */}
            <StyledSwitch
              value={locationSharingEnabled}
              onValueChange={() => handleToggle('locationSharing')}
            />
          </PrivacyItemContainer>
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Data Usage</SectionTitle>
          <PrivacyItemContainer>
            <PrivacyItemContent>
              <PrivacyItemTitle>Allow data usage for personalization</PrivacyItemTitle>
              <PrivacyItemDescription>Let Tribe use your data to personalize your experience.</PrivacyItemDescription>
            </PrivacyItemContent>
            {/* 11. Render data usage settings with toggle switches */}
            <StyledSwitch
              value={dataUsageEnabled}
              onValueChange={() => handleToggle('dataUsage')}
            />
          </PrivacyItemContainer>
        </SectionContainer>

        <SectionContainer>
          <SectionTitle>Account Privacy</SectionTitle>
          {/* 12. Render account privacy actions (Download My Data, Delete My Data) */}
          <ActionButtonContainer>
            <ActionButton onPress={handleDataDownload}>
              <ActionButtonText>Download My Data</ActionButtonText>
            </ActionButton>
            <ActionButton danger onPress={handleDataDeletion}>
              <ActionButtonText danger>Delete My Data</ActionButtonText>
            </ActionButton>
          </ActionButtonContainer>
        </SectionContainer>
      </ScrollContainer>
      {/* 13. Render a save button at the bottom of the screen */}
      <SaveButtonContainer>
        <Button onPress={saveSettings} disabled={!hasChanges}>
          Save Settings
        </Button>
      </SaveButtonContainer>
    </Container>
  );
};

export default PrivacySettingsScreen;