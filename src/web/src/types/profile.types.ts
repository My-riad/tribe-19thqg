/**
 * Interface representing geographic coordinates for location-based features
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Enum of personality traits used in the personality assessment
 * Based on the Big Five (OCEAN) model with additional traits for more detailed matching
 */
export enum PersonalityTraitName {
  // Big Five (OCEAN) traits
  OPENNESS = 'OPENNESS',
  CONSCIENTIOUSNESS = 'CONSCIENTIOUSNESS',
  EXTRAVERSION = 'EXTRAVERSION',
  AGREEABLENESS = 'AGREEABLENESS',
  NEUROTICISM = 'NEUROTICISM',
  
  // Additional traits for more detailed matching
  ADVENTUROUSNESS = 'ADVENTUROUSNESS',
  ANALYTICAL = 'ANALYTICAL',
  ASSERTIVENESS = 'ASSERTIVENESS',
  COMMUNICATION_STYLE = 'COMMUNICATION_STYLE',
  CREATIVITY = 'CREATIVITY',
  EMPATHY = 'EMPATHY',
  LEADERSHIP = 'LEADERSHIP',
  ORGANIZATION = 'ORGANIZATION',
  RISK_TOLERANCE = 'RISK_TOLERANCE',
  SOCIAL_ENERGY = 'SOCIAL_ENERGY'
}

/**
 * Interface representing a personality trait with its score for a user
 */
export interface PersonalityTrait {
  id: string;
  profileId: string;
  traitName: PersonalityTraitName;
  score: number;  // Typically 0-100 scale
  assessedAt: Date;
}

/**
 * Enum of interest categories for user interest selection
 */
export enum InterestCategory {
  OUTDOOR_ADVENTURES = 'OUTDOOR_ADVENTURES',
  ARTS_CULTURE = 'ARTS_CULTURE',
  FOOD_DINING = 'FOOD_DINING',
  SPORTS_FITNESS = 'SPORTS_FITNESS',
  GAMES_ENTERTAINMENT = 'GAMES_ENTERTAINMENT',
  LEARNING_EDUCATION = 'LEARNING_EDUCATION',
  TECHNOLOGY = 'TECHNOLOGY',
  WELLNESS_MINDFULNESS = 'WELLNESS_MINDFULNESS',
  SOCIAL_CAUSES = 'SOCIAL_CAUSES',
  TRAVEL = 'TRAVEL',
  MUSIC = 'MUSIC',
  READING_WRITING = 'READING_WRITING'
}

/**
 * Interface representing a user interest with category and enthusiasm level
 */
export interface Interest {
  id: string;
  profileId: string;
  category: InterestCategory;
  name: string;
  level: number;  // 1-5 scale indicating enthusiasm level
}

/**
 * Enum of preference categories for user settings
 */
export enum PreferenceCategory {
  NOTIFICATIONS = 'NOTIFICATIONS',
  PRIVACY = 'PRIVACY',
  MATCHING = 'MATCHING',
  EVENTS = 'EVENTS',
  COMMUNICATION = 'COMMUNICATION',
  APPEARANCE = 'APPEARANCE'
}

/**
 * Interface representing a user preference setting
 */
export interface Preference {
  id: string;
  profileId: string;
  category: PreferenceCategory;
  setting: string;
  value: string;
}

/**
 * Interface representing a user achievement for gamification
 */
export interface Achievement {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string;
  awardedAt: Date;
  pointValue: number;
  metadata: Record<string, any>;  // Flexible field for achievement-specific data
}

/**
 * Interface representing a complete user profile with all related data
 */
export interface Profile {
  id: string;
  userId: string;
  name: string;
  bio: string;
  location: string;
  coordinates: Coordinates;
  birthdate: Date;
  phoneNumber: string;
  avatarUrl: string;
  coverImageUrl: string;
  personalityTraits: PersonalityTrait[];
  interests: Interest[];
  preferences: Preference[];
  achievements: Achievement[];
  lastUpdated: Date;
  completionPercentage: number;  // 0-100 indicating profile completion
  maxTravelDistance: number;  // In miles or kilometers
  availableDays: string[];  // e.g., ['MONDAY', 'WEDNESDAY', 'FRIDAY']
  availableTimeRanges: { day: string; startTime: string; endTime: string }[];
}

/**
 * Interface for profile update request payload
 */
export interface ProfileUpdateRequest {
  name: string;
  bio: string;
  location: string;
  coordinates: Coordinates;
  birthdate: string;  // ISO format date string
  phoneNumber: string;
  avatarUrl: string;
  coverImageUrl: string;
  maxTravelDistance: number;
  availableDays: string[];
  availableTimeRanges: { day: string; startTime: string; endTime: string }[];
}

/**
 * Interface representing a personality assessment question
 */
export interface PersonalityAssessmentQuestion {
  id: string;
  text: string;
  options: { id: string; text: string; value: number }[];
  traitName: PersonalityTraitName;
  weight: number;  // How heavily this question influences the trait score
}

/**
 * Interface for submitting personality assessment responses
 */
export interface PersonalityAssessmentSubmission {
  responses: { questionId: string; optionId: string }[];
}

/**
 * Interface for submitting user interest selections
 */
export interface InterestSelectionRequest {
  interests: { category: InterestCategory; name: string; level: number }[];
}

/**
 * Interface for updating a user preference setting
 */
export interface PreferenceUpdateRequest {
  category: PreferenceCategory;
  setting: string;
  value: string;
}

/**
 * Interface for profile state in Redux store
 */
export interface ProfileState {
  profile: Profile | null;
  personalityTraits: PersonalityTrait[];
  interests: Interest[];
  preferences: Preference[];
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
  assessmentStatus: string;  // 'not_started', 'in_progress', 'completed'
  assessmentProgress: number;  // 0-100 percentage
}

/**
 * Namespace containing all profile-related types for easy import
 */
export namespace ProfileTypes {
  export {
    Profile,
    Coordinates,
    PersonalityTrait,
    PersonalityTraitName,
    Interest,
    InterestCategory,
    Preference,
    PreferenceCategory,
    Achievement,
    ProfileState,
    ProfileUpdateRequest,
    PersonalityAssessmentQuestion,
    PersonalityAssessmentSubmission,
    InterestSelectionRequest,
    PreferenceUpdateRequest
  };
}