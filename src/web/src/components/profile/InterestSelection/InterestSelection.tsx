import React, { useState, useEffect, useCallback } from 'react'; // react v^18.2.0
import { View, Text, ActivityIndicator, Alert } from 'react-native'; // react-native ^0.70.0
import { 
  useAppDispatch, 
  useAppSelector 
} from '../../store/hooks';
import { 
  selectInterests, 
  selectProfileLoading, 
  profileActions
} from '../../store/slices/profileSlice';
import { updateInterests } from '../../store/thunks/profileThunks';
import { 
  InterestCategory, 
  Interest,
  InterestSelectionRequest
} from '../../types/profile.types';
import { 
  Container, 
  Title, 
  Description, 
  InterestsContainer, 
  CategoryContainer, 
  CategoryTitle, 
  InterestItem, 
  InterestItemText, 
  SelectedIndicator,
  SelectedCount
} from './InterestSelection.styles';
import Button from '../../ui/Button/Button';
import Checkbox from '../../ui/Checkbox/Checkbox';

/**
 * Default minimum number of interests required
 */
const DEFAULT_MIN_REQUIRED = 3;

/**
 * Default maximum number of interests allowed
 */
const DEFAULT_MAX_ALLOWED = 10;

/**
 * Default interest level for selected interests
 */
const INTEREST_LEVEL_DEFAULT = 5;

/**
 * Predefined interest options grouped by category
 */
const INTEREST_OPTIONS = {
  [InterestCategory.OUTDOOR_ADVENTURES]: ['Hiking', 'Camping', 'Kayaking', 'Rock Climbing', 'Cycling'],
  [InterestCategory.ARTS_CULTURE]: ['Museums', 'Galleries', 'Theater', 'Live Music', 'Dance'],
  [InterestCategory.FOOD_DINING]: ['Restaurants', 'Cooking', 'Wine Tasting', 'Food Trucks', 'Breweries'],
  [InterestCategory.SPORTS_FITNESS]: ['Running', 'Yoga', 'Team Sports', 'Gym Workouts', 'Swimming'],
  [InterestCategory.GAMES_ENTERTAINMENT]: ['Board Games', 'Video Games', 'Trivia', 'Card Games', 'Escape Rooms'],
  [InterestCategory.LEARNING_EDUCATION]: ['Workshops', 'Book Clubs', 'Languages', 'Science', 'History'],
  [InterestCategory.TECHNOLOGY]: ['Coding', 'Gadgets', 'AI', 'Startups', 'Blockchain'],
  [InterestCategory.WELLNESS_MINDFULNESS]: ['Meditation', 'Spa Days', 'Self-care', 'Therapy', 'Nature Walks'],
  [InterestCategory.SOCIAL_CAUSES]: ['Volunteering', 'Activism', 'Community Service', 'Fundraising', 'Environmental'],
  [InterestCategory.TRAVEL]: ['Local Exploration', 'Road Trips', 'International Travel', 'Weekend Getaways', 'Cultural Exchange'],
  [InterestCategory.MUSIC]: ['Concerts', 'Festivals', 'Playing Instruments', 'Singing', 'DJing'],
  [InterestCategory.READING_WRITING]: ['Fiction', 'Non-fiction', 'Poetry', 'Journaling', 'Creative Writing']
};

/**
 * Internal representation of an interest item with selection state
 */
interface InterestItem {
  id?: string;
  category: InterestCategory;
  name: string;
  level: number;
  selected: boolean;
}

/**
 * Type for interests grouped by category
 */
type GroupedInterests = Record<string, InterestItem[]>;

/**
 * Props for the InterestSelection component
 */
interface InterestSelectionProps {
  minRequired?: number;
  maxAllowed?: number;
  onComplete?: () => void;
  testID?: string;
}

/**
 * Component for selecting user interests from predefined categories
 */
const InterestSelection: React.FC<InterestSelectionProps> = ({
  minRequired = DEFAULT_MIN_REQUIRED,
  maxAllowed = DEFAULT_MAX_ALLOWED,
  onComplete,
  testID
}) => {
  // Typed dispatch hook for Redux actions
  const dispatch = useAppDispatch();

  // Typed selector hook for Redux state
  const interestsFromStore = useAppSelector(selectInterests);

  // Selector for retrieving loading state from Redux
  const loading = useAppSelector(selectProfileLoading);

  // Local state for selected interests
  const [selectedInterests, setSelectedInterests] = useState<InterestItem[]>([]);

  // Set up effect to initialize selected interests from Redux state
  useEffect(() => {
    if (interestsFromStore && interestsFromStore.length > 0) {
      const initialSelected: InterestItem[] = interestsFromStore.map(interest => ({
        ...interest,
        selected: true
      }));
      setSelectedInterests(initialSelected);
    }
  }, [interestsFromStore]);

  /**
   * Function to handle interest selection/deselection
   */
  const toggleInterest = useCallback((category: InterestCategory, name: string) => {
    setSelectedInterests(prevSelected => {
      const existingIndex = prevSelected.findIndex(
        interest => interest.category === category && interest.name === name
      );

      if (existingIndex !== -1) {
        // Deselect interest
        return prevSelected.filter((_, index) => index !== existingIndex);
      } else {
        if (prevSelected.length < maxAllowed) {
          // Select interest
          return [
            ...prevSelected,
            {
              category,
              name,
              level: INTEREST_LEVEL_DEFAULT,
              selected: true
            }
          ];
        } else {
          // Show alert if max allowed is reached
          Alert.alert(
            'Too Many Interests',
            `You can only select up to ${maxAllowed} interests.`,
            [{ text: 'OK' }]
          );
          return prevSelected;
        }
      }
    });
  }, [maxAllowed]);

  /**
   * Function to save selected interests
   */
  const handleSubmit = async () => {
    if (selectedInterests.length < minRequired) {
      Alert.alert(
        'Minimum Interests Required',
        `Please select at least ${minRequired} interests.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Prepare the data to be sent to the API
    const interestsData: InterestSelectionRequest = {
      interests: selectedInterests.map(interest => ({
        category: interest.category,
        name: interest.name,
        level: interest.level
      }))
    };

    // Dispatch the updateInterests thunk
    try {
      await dispatch(updateInterests(interestsData)).unwrap();
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to update interests:', error);
      Alert.alert(
        'Error',
        'Failed to save interests. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Group interests by category for display
  const groupedInterests: GroupedInterests = Object.keys(INTEREST_OPTIONS).reduce(
    (groups: GroupedInterests, category: string) => {
      const interestCategory = category as InterestCategory;
      groups[interestCategory] = INTEREST_OPTIONS[interestCategory].map(name => {
        const isSelected = selectedInterests.some(
          interest => interest.category === interestCategory && interest.name === name
        );
        return {
          category: interestCategory,
          name,
          level: INTEREST_LEVEL_DEFAULT,
          selected: isSelected
        };
      });
      return groups;
    },
    {}
  );

  return (
    <Container testID={testID}>
      <Title>Select Your Interests</Title>
      <Description>
        Choose activities that resonate with you to connect with like-minded people.
      </Description>
      <InterestsContainer>
        {Object.entries(groupedInterests).map(([category, interests]) => (
          <CategoryContainer key={category}>
            <CategoryTitle>{category.replace(/_/g, ' ')}</CategoryTitle>
            {interests.map(interest => (
              <InterestItem
                key={`${interest.category}-${interest.name}`}
                onPress={() => toggleInterest(interest.category, interest.name)}
                selected={interest.selected}
              >
                <InterestItemText selected={interest.selected}>
                  {interest.name}
                </InterestItemText>
                <SelectedIndicator selected={interest.selected}>
                  <Checkbox
                    checked={interest.selected}
                    onPress={() => toggleInterest(interest.category, interest.name)}
                  />
                </SelectedIndicator>
              </InterestItem>
            ))}
          </CategoryContainer>
        ))}
      </InterestsContainer>
      <SelectedCount>
        {selectedInterests.length} / {maxAllowed} selected
      </SelectedCount>
      <Button
        onPress={handleSubmit}
        disabled={selectedInterests.length < minRequired || loading}
        isLoading={loading}
        testID="submit-interests-button"
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          'Save Interests'
        )}
      </Button>
    </Container>
  );
};

export default InterestSelection;