import PersonalityProfile from './PersonalityProfile';
import { PersonalityTrait } from '../../../types/profile.types';

/**
 * Props interface for the PersonalityProfile component
 */
export interface PersonalityProfileProps {
  /** Array of personality traits to display */
  traits?: PersonalityTrait[];
  /** Title displayed at the top of the component */
  title?: string;
  /** Whether to show compatibility score section */
  showCompatibility?: boolean;
  /** Compatibility score (0-100) to display if showCompatibility is true */
  compatibilityScore?: number;
  /** Label for the compatibility score */
  compatibilityLabel?: string;
  /** Test ID for component testing */
  testID?: string;
}

// Export the personality profile component as default
export default PersonalityProfile;