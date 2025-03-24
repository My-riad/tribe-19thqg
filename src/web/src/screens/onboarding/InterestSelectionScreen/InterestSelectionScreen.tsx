# src/web/src/screens/onboarding/InterestSelectionScreen/InterestSelectionScreen.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // React library for component creation and hooks // ^18.2.0
import { View, Text, ActivityIndicator, Alert, SafeAreaView } from 'react-native'; // React Native View, Text, ActivityIndicator, Alert, SafeAreaView components // ^0.70.0
import { useNavigation, StackNavigationProp } from '@react-navigation/native'; // Hook for accessing navigation object // ^6.1.6
import { useAppDispatch, useAppSelector } from '../../../store/hooks'; // Typed dispatch and selector hooks for Redux
import { selectInterests, selectProfileLoading, profileActions } from '../../../store/slices/profileSlice'; // Selector for retrieving interests and loading state from Redux
import { updateInterests } from '../../../store/thunks/profileThunks'; // Thunk for updating user interests
import { InterestCategory, Interest, InterestSelectionRequest } from '../../../types/profile.types'; // Types for interests and related data structures
import { InterestSelection } from '../../../components/profile/InterestSelection/InterestSelection'; // Component for selecting user interests
import { ROUTES } from '../../../constants/navigationRoutes'; // Navigation route constants
import { Container, Header, ProgressContainer } from './InterestSelectionScreen.styles'; // Styled container, header, and progress bar components
import { ProgressBar } from 'react-native-progress'; // Progress bar component for onboarding flow // ^5.0.0

// Type for onboarding stack navigation parameters
interface OnboardingStackParamList {
  [ROUTES.ONBOARDING.PERSONALITY_ASSESSMENT]: undefined;
  [ROUTES.ONBOARDING.INTEREST_SELECTION]: undefined;
  [ROUTES.ONBOARDING.LOCATION_SETUP]: undefined;
  [ROUTES.ONBOARDING.PROFILE_CREATION]: undefined;
}

// Type for navigation prop specific to this screen
type InterestSelectionScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  typeof ROUTES.ONBOARDING.INTEREST_SELECTION
>;

// Minimum number of interests required to proceed
const MIN_REQUIRED_INTERESTS = 3;

// Maximum number of interests allowed to select
const MAX_ALLOWED_INTERESTS = 10;

// Progress value for the onboarding progress bar (50%)
const ONBOARDING_PROGRESS = 0.5;

/**
 * Screen component for selecting user interests during onboarding
 */
const InterestSelectionScreen: React.FC = () => {
  // Initialize navigation hook for screen navigation
  const navigation = useNavigation<InterestSelectionScreenNavigationProp>();

  // Initialize Redux hooks (dispatch, selectors)
  const dispatch = useAppDispatch();

  // Get current interests and loading state from Redux
  const interests = useAppSelector(selectInterests);
  const loading = useAppSelector(selectProfileLoading);

  // Define handleComplete function to navigate to the next screen
  const handleComplete = useCallback(() => {
    navigation.navigate(ROUTES.ONBOARDING.LOCATION_SETUP);
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container>
        <Header>
          <Text>Select Interests</Text>
        </Header>
        <ProgressContainer>
          <ProgressBar progress={ONBOARDING_PROGRESS} width={200} />
        </ProgressContainer>
        <InterestSelection
          minRequired={MIN_REQUIRED_INTERESTS}
          maxAllowed={MAX_ALLOWED_INTERESTS}
          onComplete={handleComplete}
        />
      </Container>
    </SafeAreaView>
  );
};

export default InterestSelectionScreen;