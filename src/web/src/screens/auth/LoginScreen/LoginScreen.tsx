import React, { useLayoutEffect, useState } from 'react'; // react ^18.2.0
import { Text, StatusBar } from 'react-native'; // react-native ^0.70.0
import { useNavigation, useRoute } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import { useAuth } from '../../../hooks/useAuth';
import AuthForm from '../../../components/auth/AuthForm';
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
} from './LoginScreen.styles';

/**
 * Login screen component that allows users to authenticate to the application
 */
const LoginScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<AuthNavigationProp>();

  // Get route params using useRoute hook
  const route = useRoute<any>();

  // Extract email from route params if provided
  const initialEmail = route?.params?.email || '';

  // Get authentication functions and state from useAuth hook
  const { login, loading, error, mfaRequired } = useAuth();

  // Define handleLoginSuccess function to handle successful login
  const handleLoginSuccess = () => {
    // Navigate to the main app screen after successful login
    navigation.navigate(ROUTES.ROOT.MAIN);
  };

  // Define handleToggleForm function to navigate to registration screen
  const handleToggleForm = () => {
    // Navigate to the registration screen
    navigation.navigate(ROUTES.AUTH.REGISTRATION);
  };

  // Use useLayoutEffect to set navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide the header for this screen
    });
  }, [navigation]);

  // Render the login screen with logo, title, and form
  return (
    <Container>
      {/* Set the status bar style */}
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollContainer>
        <KeyboardAwareContainer>
          {/* Logo and app title */}
          <LogoContainer>
            <Logo source={require('../../../assets/images/logo.png')} />
            <AppTitle>Tribe</AppTitle>
            <AppTagline>Meaningful connections in your local community</AppTagline>
          </LogoContainer>

          {/* Render AuthForm component with login form type */}
          <AuthForm
            formType="login"
            onSuccess={handleLoginSuccess}
            onToggleForm={handleToggleForm}
          />

          {/* Footer with link to registration screen */}
          <FooterContainer>
            <FooterText>Don't have an account?</FooterText>
            <FooterLink onPress={handleToggleForm}>
              <Text>Create one</Text>
            </FooterLink>
          </FooterContainer>
        </KeyboardAwareContainer>
      </ScrollContainer>
    </Container>
  );
};

export default LoginScreen;