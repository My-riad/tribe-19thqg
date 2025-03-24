import React, { useLayoutEffect } from 'react'; // react ^18.2.0
import { Text, StatusBar, Image } from 'react-native'; // react-native v0.70.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import { useAuth } from '../../../hooks/useAuth';
import RegistrationForm from '../../../components/auth/RegistrationForm';
import { ROUTES } from '../../../constants/navigationRoutes';
import { AuthNavigationProp } from '../../../types/navigation.types';
import {
  Container,
  ScrollContainer,
  KeyboardAwareContainer,
  LogoContainer,
  Logo,
  AppTitle,
  AppTagline,
  FormContainer,
  FooterContainer,
  FooterText,
  FooterLink,
  FooterLinkText,
} from './RegistrationScreen.styles';

/**
 * Registration screen component that allows new users to create an account
 */
const RegistrationScreen: React.FC = () => {
  // 1. Get navigation object using useNavigation hook
  const navigation = useNavigation<AuthNavigationProp>();

  // 2. Get authentication functions and state from useAuth hook
  const { register, loading, error } = useAuth();

  // 3. Define handleRegistrationSuccess function to handle successful registration
  const handleRegistrationSuccess = () => {
    // Navigate to the personality assessment screen after successful registration
    navigation.navigate(ROUTES.ONBOARDING.PERSONALITY_ASSESSMENT);
  };

  // 4. Define handleToggleForm function to navigate to login screen
  const handleToggleForm = () => {
    // Navigate to the login screen
    navigation.navigate(ROUTES.AUTH.LOGIN);
  };

  // 5. Use useLayoutEffect to set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide the header for this screen
    });
  }, [navigation]);

  // 6. Render the registration screen with logo, title, and form
  // 7. Render RegistrationForm component with registration form fields
  // 8. Render footer with link to login screen for existing users
  // 9. Handle loading state during registration process
  // 10. Handle error state if registration fails
  return (
    <Container>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAwareContainer>
        <ScrollContainer>
          <LogoContainer>
            <Logo source={require('../../../assets/images/logo.png')} resizeMode="contain" />
            <AppTitle>Tribe</AppTitle>
            <AppTagline>Meaningful connections in your local community</AppTagline>
          </LogoContainer>
          <FormContainer>
            <RegistrationForm onSuccess={handleRegistrationSuccess} />
          </FormContainer>
          <FooterContainer>
            <FooterText>Already have an account?</FooterText>
            <FooterLink onPress={handleToggleForm} accessibilityLabel="Sign In">
              <FooterLinkText>Sign In</FooterLinkText>
            </FooterLink>
          </FooterContainer>
        </ScrollContainer>
      </KeyboardAwareContainer>
    </Container>
  );
};

export default RegistrationScreen;