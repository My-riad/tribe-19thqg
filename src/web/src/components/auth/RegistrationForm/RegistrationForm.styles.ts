import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../../theme';
import { colors, typography, spacing, shadows } from '../../../theme';

/**
 * Main container for the registration form
 */
export const FormContainer = styled(View)`
  width: 100%;
  padding: ${theme.spacing.lg}px;
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.md}px;
  ${theme.shadows.md}
`;

/**
 * A container that adjusts content position when keyboard appears
 */
export const KeyboardAwareFormContainer = styled(KeyboardAvoidingView).attrs({
  behavior: Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: Platform.OS === 'ios' ? 64 : 0
})`
  flex: 1;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.md}px;
`;

/**
 * Header section of the form containing title and subtitle
 */
export const FormHeader = styled(View)`
  align-items: center;
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Main title of the registration form
 */
export const FormTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xl}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
  text-align: center;
`;

/**
 * Subtitle text below the main title
 */
export const FormSubtitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${theme.spacing.sm}px;
`;

/**
 * Main body section containing form fields
 */
export const FormBody = styled(View)`
  width: 100%;
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Container for individual form fields
 */
export const FormFieldContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Component for displaying form error messages
 */
export const FormErrorMessage = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.error.main};
  margin-top: ${theme.spacing.xs}px;
  margin-bottom: ${theme.spacing.sm}px;
  text-align: center;
`;

/**
 * Footer section containing action buttons
 */
export const FormFooter = styled(View)`
  width: 100%;
  align-items: center;
`;

/**
 * Divider with text between form sections
 */
export const FormDivider = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-vertical: ${theme.spacing.md}px;
  width: 100%;

  &:before, &:after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: ${theme.colors.border.light};
  }

  &:before {
    margin-right: ${theme.spacing.sm}px;
  }

  &:after {
    margin-left: ${theme.spacing.sm}px;
  }
`;

/**
 * Touchable component for form links
 */
export const FormLink = styled(TouchableOpacity)`
  margin-top: ${theme.spacing.md}px;
`;

/**
 * Text style for form links
 */
export const FormLinkText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.primary.main};
  text-align: center;
`;

/**
 * Container for terms and conditions checkbox and text
 */
export const TermsContainer = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md}px;
  padding-horizontal: ${theme.spacing.xs}px;
`;

/**
 * Text style for terms and conditions
 */
export const TermsText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
  flex-shrink: 1;
  margin-left: ${theme.spacing.xs}px;
`;

/**
 * Style for clickable links within terms text
 */
export const TermsLink = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.primary.main};
  text-decoration-line: underline;
`;

/**
 * Configuration object for registration form text content
 */
export const registrationFormConfig = {
  title: 'Create Account',
  subtitle: 'Join Tribe to connect with like-minded people.',
  termsText: 'I agree to the ',
  termsLinkText: 'Terms of Service',
  privacyLinkText: 'Privacy Policy',
  andText: ' and ',
  submitButtonText: 'Sign Up',
  socialDividerText: 'or continue with',
  signInText: 'Already have an account? ',
  signInLinkText: 'Sign In'
};