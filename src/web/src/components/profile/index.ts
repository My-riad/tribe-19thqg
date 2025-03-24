import AchievementsList, { AchievementsListProps } from './AchievementsList';
import InterestSelection from './InterestSelection';
import PersonalityAssessment, { PersonalityAssessmentProps } from './PersonalityAssessment';
import PersonalityProfile, { PersonalityProfileProps } from './PersonalityProfile';
import ProfileEditor from './ProfileEditor';

/**
 * Exports all profile-related components from a single entry point, simplifying imports throughout the application.
 * This includes components for personality assessment, profile editing, interest selection, achievements display, and personality profile visualization.
 */

// Export AchievementsList component and its props
export { AchievementsList };
export type { AchievementsListProps };

// Export InterestSelection component
export { InterestSelection };

// Export PersonalityAssessment component and its props
export { PersonalityAssessment };
export type { PersonalityAssessmentProps };

// Export PersonalityProfile component and its props
export { PersonalityProfile };
export type { PersonalityProfileProps };

// Export ProfileEditor component
export { ProfileEditor };