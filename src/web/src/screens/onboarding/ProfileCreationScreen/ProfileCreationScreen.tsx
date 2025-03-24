import React, { useState, useCallback } from 'react'; // react v^18.2.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v^6.0.0
import { SafeAreaView, ScrollView, Alert } from 'react-native'; // react-native ^0.70.0

import { useProfile } from '../../../hooks/useProfile';
import ProfileEditor from '../../../components/profile/ProfileEditor/ProfileEditor';
import ProgressBar from '../../../components/ui/ProgressBar/ProgressBar';
import Button from '../../../components/ui/Button/Button';
import LoadingIndicator from '../../../components/ui/LoadingIndicator/LoadingIndicator';
import { ROUTES } from '../../../constants/navigationRoutes';
import { OnboardingNavigationProp } from '../../../types/navigation.types';
import { 
  ProfileCreationContainer,
  HeaderSection,
  Title,
  Subtitle,
  ProgressSection,
  ProgressText,
  ContentSection,
  ButtonSection
} from './ProfileCreationScreen.styles';

/**
 * Screen component for creating a user profile during onboarding
 */
const ProfileCreationScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<OnboardingNavigationProp>();

  // Get profile state and methods from useProfile hook
  const { profile, loading, error, clearProfileError } = useProfile();

  // Initialize loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize error state for form errors
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate onboarding progress (100% for final step)
  const progress = 1;

  /**
   * Create handleProfileComplete function to handle profile creation completion
   */
  const handleProfileComplete = useCallback(() => {
    // Navigate to the main app screen after successful profile creation
    navigation.reset({
      index: 0,
      routes: [{ name: ROUTES.MAIN.HOME }],
    });
  }, [navigation]);

  /**
   * Create handleSkip function to allow users to skip profile completion
   */
  const handleSkip = useCallback(() => {
    // Show confirmation dialog before skipping
    confirmSkip();
  }, [confirmSkip]);

  /**
   * Create confirmSkip function to confirm skipping with an alert dialog
   */
  const confirmSkip = useCallback(() => {
    Alert.alert(
      "Skip Profile Creation?",
      "Skipping profile creation will limit your matching potential. Are you sure you want to skip?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Skip", 
          onPress: () => {
            // Navigate to the main app screen after skipping profile creation
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.MAIN.HOME }],
            });
          },
          style: "destructive"
        }
      ]
    );
  }, [navigation]);

  return (
    <ProfileCreationContainer>
      {/* Render screen with SafeAreaView as root container */}
      <SafeAreaView style={{ flex: 1 }}>
        {/* Render header section with title and subtitle */}
        <HeaderSection>
          <Title>Create Your Profile</Title>
          <Subtitle>
            Tell us a bit about yourself to help us find the best Tribe for you.
          </Subtitle>
        </HeaderSection>

        {/* Render progress section with ProgressBar component */}
        <ProgressSection>
          <ProgressBar progress={progress} />
          <ProgressText>Step 4 of 4</ProgressText>
        </ProgressSection>

        {/* Render content section with ProfileEditor component */}
        <ContentSection>
          <ProfileEditor
            initialData={profile}
            onComplete={handleProfileComplete}
            onCancel={() => navigation.goBack()}
          />
        </ContentSection>

        {/* Render button section with skip option */}
        <ButtonSection>
          <Button variant="secondary" onPress={handleSkip}>
            Skip
          </Button>
        </ButtonSection>

        {/* Handle loading state with LoadingIndicator component */}
        {isSubmitting && <LoadingIndicator text="Updating profile..." />}

        {/* Handle error state with error message display */}
        {formError && <Text style={{ color: 'red', textAlign: 'center' }}>{formError}</Text>}
      </SafeAreaView>
    </ProfileCreationContainer>
  );
};

export default ProfileCreationScreen;