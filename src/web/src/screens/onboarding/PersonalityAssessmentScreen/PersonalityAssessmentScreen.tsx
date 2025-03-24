import React, { useCallback } from 'react'; // react v18.2.0
import { useNavigation } from '@react-navigation/native'; // ^6.0.0
import { SafeAreaView } from 'react-native-safe-area-context'; // ^4.4.1
import { StatusBar } from 'react-native'; // ^0.70.0

import PersonalityAssessment from '../../../components/profile/PersonalityAssessment';
import { useProfile } from '../../../hooks/useProfile';
import { OnboardingNavigationProp } from '../../../types/navigation.types';
import { ROUTES } from '../../../constants/navigationRoutes';
import { 
    Container,
    HeaderContainer,
    Title,
    Subtitle
} from './PersonalityAssessmentScreen.styles';

/**
 * Screen component for the personality assessment step in the onboarding flow
 */
const PersonalityAssessmentScreen: React.FC = () => {
    // Get navigation object using useNavigation hook
    const navigation = useNavigation<OnboardingNavigationProp>();

    // Get profile management functionality from useProfile hook
    const { submitAssessment } = useProfile();

    // Create a function to handle assessment completion
    const handleAssessmentComplete = useCallback(() => {
        // Navigate to the next step in the onboarding flow (InterestSelection)
        navigation.navigate(ROUTES.ONBOARDING.INTEREST_SELECTION);
    }, [navigation]);

    // Create a function to handle navigation back (not used in onboarding flow)
    const handleBack = useCallback(() => {
        // Navigation back is not applicable in the onboarding flow
        // Implement logic if needed in future versions
    }, []);

    // Return the screen component with SafeAreaView, StatusBar, header section, and PersonalityAssessment component
    return (
        <Container>
            {/* Set the status bar style based on the platform */}
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* Header section with title and subtitle */}
            <HeaderContainer>
                <Title>Personality Assessment</Title>
                <Subtitle>Help us understand you better to find the perfect Tribe!</Subtitle>
            </HeaderContainer>

            {/* PersonalityAssessment component for the assessment questionnaire */}
            <PersonalityAssessment
                onComplete={handleAssessmentComplete}
                onBack={handleBack}
            />
        </Container>
    );
};

export default PersonalityAssessmentScreen;