import React, { useState, useEffect, useCallback } from 'react'; // React v18.2.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import { Alert } from 'react-native'; // react-native v0.72.0

import {
  Container,
  Title,
  Description,
  InputContainer,
  SliderContainer,
  SliderLabel,
  ButtonContainer,
  ProgressContainer,
  ContentContainer,
  BackButton,
  BackButtonText
} from './LocationSetupScreen.styles'; // Import from ./LocationSetupScreen.styles.ts
import Button from '../../../components/ui/Button'; // Import from ../../../components/ui/Button/Button.tsx
import Input from '../../../components/ui/Input'; // Import from ../../../components/ui/Input/Input.tsx
import Slider from '../../../components/ui/Slider'; // Import from ../../../components/ui/Slider/Slider.tsx
import ProgressBar from '../../../components/ui/ProgressBar'; // Import from ../../../components/ui/ProgressBar/ProgressBar.tsx
import { locationService } from '../../../services/locationService'; // Import from ../../../services/locationService.ts
import { useAppDispatch } from '../../../store/hooks'; // Import from ../../../store/hooks.ts
import { updateProfile } from '../../../store/thunks/profileThunks'; // Import from ../../../store/thunks/profileThunks.ts
import { OnboardingNavigationProp } from '../../../types/navigation.types'; // Import from ../../../types/navigation.types.ts
import { Coordinates } from '../../../types/profile.types'; // Import from ../../../types/profile.types.ts
import { ROUTES } from '../../../constants/navigationRoutes'; // Import from ../../../constants/navigationRoutes.ts

/**
 * Screen component for setting up user location during onboarding
 */
const LocationSetupScreen = () => {
  // State variables
  const [locationInput, setLocationInput] = useState<string>('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);

  // Navigation and dispatch
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useAppDispatch();

  // Function to handle enabling location services
  const handleEnableLocation = useCallback(async () => {
    setLoading(true);
    try {
      const granted = await locationService.requestLocationPermission();
      if (granted) {
        const location = await locationService.getUserLocation();
        setCoordinates(location);
      } else {
        Alert.alert('Location Permission Denied', 'Please enable location services in settings to use this feature.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get location.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to handle manual location input
  const handleManualLocationInput = useCallback((text: string) => {
    setLocationInput(text);
    setCoordinates(null); // Clear coordinates when manual input changes
  }, []);

  // Function to handle searching for a location
  const handleSearchLocation = useCallback(async () => {
    setLoading(true);
    try {
      const location = await locationService.searchLocationByAddress(locationInput);
      setCoordinates(location);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to find location.');
    } finally {
      setLoading(false);
    }
  }, [locationInput]);

  // Function to handle distance change
  const handleDistanceChange = useCallback((value: number) => {
    setMaxDistance(value);
  }, []);

  // Function to handle continue button press
  const handleContinue = useCallback(async () => {
    setLoading(true);
    try {
      if (!coordinates) {
        Alert.alert('Location Required', 'Please enable location services or enter a location manually.');
        return;
      }

      // Get address from coordinates
      const location = await locationService.getAddressFromCoordinates(coordinates);

      // Update profile with location data
      await dispatch(
        updateProfile({
          location: location,
          coordinates: coordinates,
          birthdate: '',
          name: '',
          bio: '',
          phoneNumber: '',
          avatarUrl: '',
          coverImageUrl: '',
          maxTravelDistance: maxDistance,
          availableDays: [],
          availableTimeRanges: []
        })
      );

      // Navigate to profile creation screen
      navigation.navigate(ROUTES.ONBOARDING.PROFILE_CREATION);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save location.');
    } finally {
      setLoading(false);
    }
  }, [coordinates, maxDistance, navigation, dispatch]);

  // Effect to reverse geocode coordinates to address
  useEffect(() => {
    if (coordinates) {
      setLoading(true);
      locationService.getAddressFromCoordinates(coordinates)
        .then(address => setLocationInput(address))
        .catch(error => console.error('Error getting address from coordinates:', error))
        .finally(() => setLoading(false));
    }
  }, [coordinates]);

  return (
    <Container>
      <ContentContainer>
        <Title>Your Location</Title>
        <Description>
          To find local Tribes and events, please enable location services or enter your location manually.
        </Description>

        <ButtonContainer>
          <Button
            onPress={handleEnableLocation}
            disabled={loading}
          >
            Enable Location Services
          </Button>
        </ButtonContainer>

        <InputContainer>
          <Input
            placeholder="Enter your location manually"
            value={locationInput}
            onChangeText={handleManualLocationInput}
            onSubmitEditing={handleSearchLocation}
            returnKeyType="search"
            disabled={loading}
          />
        </InputContainer>

        <SliderContainer>
          <SliderLabel>Maximum distance for activities:</SliderLabel>
          <Slider
            value={maxDistance}
            min={5}
            max={50}
            step={5}
            onChange={handleDistanceChange}
            disabled={loading}
          />
        </SliderContainer>

        <ButtonContainer>
          <Button
            onPress={handleContinue}
            disabled={loading || !coordinates}
          >
            Continue
          </Button>
        </ButtonContainer>
      </ContentContainer>

      <ProgressContainer>
        <ProgressBar progress={0.75} />
      </ProgressContainer>
    </Container>
  );
};

export default LocationSetupScreen;