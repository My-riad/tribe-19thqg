import React from 'react'; // React library for building user interfaces // react ^18.2.0
import { Text, SafeAreaView, StatusBar } from 'react-native'; // React Native components // react-native ^0.70.0
import { useNavigation } from '@react-navigation/native'; // Hook for navigation functionality // @react-navigation/native ^6.0.0

import { useAuth } from '../../../hooks/useAuth'; // Hook for authentication state and functionality
import { AuthNavigationProp } from '../../../types/navigation.types'; // Type definition for auth navigation prop
import { ROUTES } from '../../../constants/navigationRoutes'; // Navigation route constants
import Button from '../../../components/ui/Button'; // Reusable button component
import SocialAuthButtons from '../../../components/auth/SocialAuthButtons'; // Component for social authentication buttons
import { // Styled components for the WelcomeScreen
  Container,
  ContentContainer,
  LogoContainer,
  Logo,
  TitleContainer,
  AppTitle,
  AppTagline,
  ButtonsContainer,
  ButtonSpacer,
  FooterContainer,
  FooterText,
  FooterLink
} from './WelcomeScreen.styles';

/**
 * Component that renders the welcome screen of the Tribe application
 * @returns Rendered welcome screen component
 */
const WelcomeScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<AuthNavigationProp>();

  // Get loading state from useAuth hook
  const { loading } = useAuth();

  /**
   * Function to handle email sign-up navigation
   */
  const handleEmailSignUp = () => {
    navigation.navigate(ROUTES.AUTH.REGISTRATION);
  };

  /**
   * Function to handle sign-in navigation
   */
  const handleSignIn = () => {
    navigation.navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Main container for the welcome screen */}
      <Container>
        {/* Set StatusBar properties (light content on dark background) */}
        <StatusBar barStyle="light-content" backgroundColor="#4169E1" />

        {/* Container for the main content */}
        <ContentContainer>
          {/* Container for the app logo */}
          <LogoContainer>
            {/* App logo */}
            <Logo source={require('../../../assets/images/tribe_logo.png')} resizeMode="contain" />
          </LogoContainer>

          {/* Container for the app title and tagline */}
          <TitleContainer>
            {/* App title */}
            <AppTitle>Tribe</AppTitle>

            {/* App tagline */}
            <AppTagline>Meaningful connections in your local community</AppTagline>
          </TitleContainer>

          {/* Container for the action buttons */}
          <ButtonsContainer>
            {/* Email sign-up button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleEmailSignUp}
              disabled={loading}
              accessibilityLabel="Sign up with Email"
            >
              Sign up with Email
            </Button>

            {/* Spacer between buttons */}
            <ButtonSpacer />

            {/* Social authentication buttons */}
            <SocialAuthButtons />
          </ButtonsContainer>
        </ContentContainer>

        {/* Container for the footer with sign-in link */}
        <FooterContainer>
          {/* Footer text */}
          <FooterText>Already have an account?</FooterText>

          {/* Touchable component for the footer link */}
          <FooterLink onPress={handleSignIn}>
            {/* Footer link text */}
            <FooterText style={{ fontWeight: 'bold' }}>Sign In</FooterText>
          </FooterLink>
        </FooterContainer>
      </Container>
    </SafeAreaView>
  );
};

export default WelcomeScreen;