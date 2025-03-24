import React, { useState, useEffect, useCallback } from 'react'; // react v^18.2.0
import { Alert } from 'react-native'; // react-native v^0.70.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v^6.0.0

import {
  Container,
  ScrollContainer,
  SectionContainer,
  SectionTitle,
  PreferenceRow,
  PreferenceLabel,
  SliderContainer,
  SliderLabels,
  SliderLabel,
  SaveButtonContainer,
} from './AutoMatchingPreferencesScreen.styles';
import Button from '../../../components/ui/Button';
import Checkbox from '../../../components/ui/Checkbox';
import RadioButton from '../../../components/ui/RadioButton';
import Slider from '../../../components/ui/Slider';
import { useProfile } from '../../../hooks/useProfile';
import { PreferenceCategory } from '../../../types/profile.types';
import { SettingsNavigationProp } from '../../../types/navigation.types';

/**
 * Screen component for configuring auto-matching preferences
 */
const AutoMatchingPreferencesScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<SettingsNavigationProp>();

  // Get profile and updateUserProfile function from useProfile hook
  const { profile, updateUserProfile } = useProfile();

  // Initialize state for auto-matching enabled status
  const [autoMatchingEnabled, setAutoMatchingEnabled] = useState(false);

  // Initialize state for matching criteria (personality, interests, location, age)
  const [matchingCriteria, setMatchingCriteria] = useState({
    personality: true,
    interests: true,
    location: true,
    age: false,
  });

  // Initialize state for maximum distance preference
  const [maxDistance, setMaxDistance] = useState(25);

  // Initialize state for preferred tribe size
  const [preferredTribeSize, setPreferredTribeSize] = useState(6);

  // Initialize state for matching schedule frequency
  const [matchingSchedule, setMatchingSchedule] = useState('weekly');

  // Initialize state for loading status during save operation
  const [loading, setLoading] = useState(false);

  // Set up useEffect to initialize form values from profile data when available
  useEffect(() => {
    if (profile) {
      setAutoMatchingEnabled(profile.preferences?.find(p => p.category === PreferenceCategory.MATCHING && p.setting === 'autoMatchingEnabled')?.value === 'true' || false);
      setMaxDistance(profile.maxTravelDistance || 25);
    }
  }, [profile]);

  /**
   * Function to save auto-matching preferences to user profile
   */
  const handleSavePreferences = useCallback(async () => {
    // Set loading state to true
    setLoading(true);

    try {
      // Create preferences object with all current preference values
      const preferences = {
        maxTravelDistance: maxDistance,
      };

      // Call updateUserProfile with preferences object
      await updateUserProfile(preferences);

      // Show success alert on successful update
      Alert.alert('Success', 'Auto-matching preferences saved successfully!');
    } catch (error) {
      // Handle any errors with error alert
      Alert.alert('Error', 'Failed to save auto-matching preferences. Please try again.');
    } finally {
      // Set loading state to false regardless of outcome
      setLoading(false);
    }
  }, [maxDistance, updateUserProfile]);

  /**
   * Function to toggle auto-matching enabled status
   * @param value
   */
  const handleToggleAutoMatching = (value: boolean) => {
    setAutoMatchingEnabled(value);
  };

  /**
   * Function to toggle individual matching criteria
   * @param criteriaName
   * @param value
   */
  const handleToggleCriteria = (criteriaName: string, value: boolean) => {
    setMatchingCriteria(prev => ({ ...prev, [criteriaName]: value }));
  };

  /**
   * Function to update maximum distance preference
   * @param value
   */
  const handleDistanceChange = (value: number) => {
    setMaxDistance(value);
  };

  /**
   * Function to update preferred tribe size
   * @param value
   */
  const handleTribeSizeChange = (value: number) => {
    setPreferredTribeSize(value);
  };

  /**
   * Function to update matching schedule frequency
   * @param value
   */
  const handleScheduleChange = (value: string) => {
    setMatchingSchedule(value);
  };

  // Render screen container with header
  return (
    <Container>
      <ScrollContainer>
        {/* Render auto-matching toggle section */}
        <SectionContainer>
          <SectionTitle>Auto-Matching</SectionTitle>
          <PreferenceRow>
            <PreferenceLabel>Enable weekly auto-matching</PreferenceLabel>
            <Checkbox
              checked={autoMatchingEnabled}
              onPress={handleToggleAutoMatching}
            />
          </PreferenceRow>
        </SectionContainer>

        {/* Render matching criteria section with checkboxes */}
        <SectionContainer>
          <SectionTitle>Matching Criteria</SectionTitle>
          <PreferenceRow>
            <PreferenceLabel>Personality compatibility</PreferenceLabel>
            <Checkbox
              checked={matchingCriteria.personality}
              onPress={() => handleToggleCriteria('personality', !matchingCriteria.personality)}
            />
          </PreferenceRow>
          <PreferenceRow>
            <PreferenceLabel>Shared interests</PreferenceLabel>
            <Checkbox
              checked={matchingCriteria.interests}
              onPress={() => handleToggleCriteria('interests', !matchingCriteria.interests)}
            />
          </PreferenceRow>
          <PreferenceRow>
            <PreferenceLabel>Location proximity</PreferenceLabel>
            <Checkbox
              checked={matchingCriteria.location}
              onPress={() => handleToggleCriteria('location', !matchingCriteria.location)}
            />
          </PreferenceRow>
          <PreferenceRow>
            <PreferenceLabel>Age group similarity</PreferenceLabel>
            <Checkbox
              checked={matchingCriteria.age}
              onPress={() => handleToggleCriteria('age', !matchingCriteria.age)}
            />
          </PreferenceRow>
        </SectionContainer>

        {/* Render maximum distance slider section */}
        <SectionContainer>
          <SectionTitle>Maximum Distance for Tribes</SectionTitle>
          <SliderContainer>
            <Slider
              value={maxDistance}
              min={5}
              max={50}
              step={5}
              onChange={handleDistanceChange}
              showLabels
            />
          </SliderContainer>
        </SectionContainer>

        {/* Render preferred tribe size slider section */}
        <SectionContainer>
          <SectionTitle>Preferred Tribe Size</SectionTitle>
          <SliderContainer>
            <Slider
              value={preferredTribeSize}
              min={4}
              max={8}
              step={1}
              onChange={handleTribeSizeChange}
              showLabels
            />
          </SliderContainer>
        </SectionContainer>

        {/* Render matching schedule section with radio buttons */}
        <SectionContainer>
          <SectionTitle>Matching Schedule</SectionTitle>
          <PreferenceRow>
            <RadioButton
              label="Weekly"
              selected={matchingSchedule === 'weekly'}
              onPress={() => handleScheduleChange('weekly')}
              value="weekly"
            />
          </PreferenceRow>
          <PreferenceRow>
            <RadioButton
              label="Bi-weekly"
              selected={matchingSchedule === 'bi-weekly'}
              onPress={() => handleScheduleChange('bi-weekly')}
              value="bi-weekly"
            />
          </PreferenceRow>
          <PreferenceRow>
            <RadioButton
              label="Monthly"
              selected={matchingSchedule === 'monthly'}
              onPress={() => handleScheduleChange('monthly')}
              value="monthly"
            />
          </PreferenceRow>
        </SectionContainer>

        {/* Render save button at bottom of screen */}
        <SaveButtonContainer>
          <Button
            onPress={handleSavePreferences}
            disabled={loading}
            isLoading={loading}
          >
            Save Preferences
          </Button>
        </SaveButtonContainer>
      </ScrollContainer>
    </Container>
  );
};

export default AutoMatchingPreferencesScreen;