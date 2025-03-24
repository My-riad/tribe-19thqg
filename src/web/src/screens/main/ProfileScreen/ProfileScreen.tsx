import React, { useState, useEffect, useCallback } from 'react'; // react v^18.2.0
import { View, Text, Alert, FlatList } from 'react-native'; // react-native v^0.70.0
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // @react-navigation/native v^6.0.0

import {
  Container,
  ScrollContent,
  ProfileHeader,
  ProfileImage,
  ProfileInfo,
  ProfileName,
  ProfileLocation,
  ProfileBio,
  SectionTitle,
  ActionButton,
  ActionButtonText,
  SectionContainer,
  ButtonsContainer,
} from './ProfileScreen.styles';
import { useProfile } from '../../../hooks/useProfile';
import { useAuth } from '../../../hooks/useAuth';
import { useTribes } from '../../../hooks/useTribes';
import PersonalityProfile from '../../../components/profile/PersonalityProfile/PersonalityProfile';
import AchievementsList from '../../../components/profile/AchievementsList/AchievementsList';
import ProfileEditor from '../../../components/profile/ProfileEditor/ProfileEditor';
import LoadingIndicator from '../../../components/ui/LoadingIndicator/LoadingIndicator';
import TribeCard from '../../../components/tribe/TribeCard/TribeCard';
import { MainTabNavigationProp } from '../../../types/navigation.types';
import { ROUTES } from '../../../constants/navigationRoutes';

/**
 * Interface defining the props for the ProfileScreen component
 */
interface ProfileScreenProps {
  navigation: MainTabNavigationProp<'Profile'>;
}

/**
 * Main profile screen component that displays user information and profile sections
 */
const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  // LD1: Get navigation object using useNavigation hook
  const navigation = useNavigation<MainTabNavigationProp<'Profile'>>();

  // LD1: Get profile data and methods from useProfile hook
  const { profile, loading, error, clearProfileError, profileCompletionPercentage } = useProfile();

  // LD1: Get authentication methods from useAuth hook
  const { logout } = useAuth();

  // LD1: Get tribe data from useTribes hook
  const { userTribes, tribes, getTribeById } = useTribes();

  // LD1: Initialize editing state with useState hook
  const [editing, setEditing] = useState(false);

  // LD1: Create handleEditProfile function to toggle editing mode
  const handleEditProfile = () => {
    setEditing(!editing);
  };

  // LD1: Create handleLogout function to log out the user
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to logout.');
    }
  };

  // LD1: Create handleProfileUpdate function to handle profile updates
  const handleProfileUpdate = (updatedProfile: any) => {
    setEditing(false);
  };

  // LD1: Create handleSettingsPress function to navigate to settings
  const handleSettingsPress = () => {
    navigation.navigate(ROUTES.SETTINGS.SETTINGS);
  };

  // LD1: Create handleTribePress function to navigate to tribe details
  const handleTribePress = (tribeId: string) => {
    navigation.navigate(ROUTES.TRIBE.TRIBE_DETAIL, { tribeId });
  };

  // LD1: Use useFocusEffect to refresh profile data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (clearProfileError) {
        clearProfileError();
      }
    }, [clearProfileError])
  );

  // LD1: Render loading indicator if profile is loading
  if (loading) {
    return (
      <Container>
        <LoadingIndicator text="Loading profile..." />
      </Container>
    );
  }

  // LD1: Render profile editor if editing mode is active
  if (editing) {
    return (
      <Container>
        <ProfileEditor
          initialData={profile}
          onComplete={handleProfileUpdate}
          onCancel={() => setEditing(false)}
        />
      </Container>
    );
  }

  // LD1: Render profile information if not in editing mode
  return (
    <Container>
      <ScrollContent>
        {/* LD1: Render profile header with user image, name, location, and bio */}
        <ProfileHeader>
          <ProfileImage
            source={profile?.avatarUrl ? { uri: profile.avatarUrl } : undefined}
          />
          <ProfileInfo>
            <ProfileName>{profile?.name}</ProfileName>
            <ProfileLocation>{profile?.location}</ProfileLocation>
            <ProfileBio>{profile?.bio}</ProfileBio>
          </ProfileInfo>
        </ProfileHeader>

        {/* LD1: Render personality profile section */}
        <SectionContainer>
          <PersonalityProfile traits={profile?.personalityTraits} />
        </SectionContainer>

        {/* LD1: Render achievements section */}
        <SectionContainer>
          <AchievementsList achievements={profile?.achievements} />
        </SectionContainer>

        {/* LD1: Render tribes section with list of user's tribes */}
        <SectionContainer>
          <SectionTitle>MY TRIBES</SectionTitle>
          <FlatList
            data={userTribes}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const tribe = tribes[item];
              if (!tribe) {
                getTribeById(item);
                return null;
              }
              return (
                <TribeCard
                  tribe={tribe}
                  onPress={handleTribePress}
                />
              );
            }}
          />
        </SectionContainer>

        {/* LD1: Render action buttons for editing profile, settings, and logout */}
        <ButtonsContainer>
          <ActionButton onPress={handleEditProfile}>
            <ActionButtonText>Edit Profile</ActionButtonText>
          </ActionButton>
          <ActionButton onPress={handleSettingsPress} secondary>
            <ActionButtonText>Settings</ActionButtonText>
          </ActionButton>
          <ActionButton onPress={handleLogout} secondary>
            <ActionButtonText>Logout</ActionButtonText>
          </ActionButton>
        </ButtonsContainer>
      </ScrollContent>
    </Container>
  );
};

export default ProfileScreen;