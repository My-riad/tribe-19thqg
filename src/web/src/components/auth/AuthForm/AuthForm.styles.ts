import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../../theme';
const { colors, typography, spacing, shadows } = theme;

// Types for form variants
export type FormVariant = 'login' | 'register' | 'forgotPassword';

// Interface for form variant styles
export interface FormVariantStyles {
  title: string;
  subtitle: string;
  actionText: string;
}

// Main form container
export const FormContainer = styled(View)`
  width: 100%;
  padding: ${spacing.lg}px;
  background-color: ${colors.background.paper};
  border-radius: ${spacing.md}px;
  ${shadows.md}
`;

// Keyboard-aware container to adjust form position when keyboard appears
export const KeyboardAwareFormContainer = styled(KeyboardAvoidingView).attrs({
  behavior: Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: Platform.OS === 'ios' ? 64 : 0
})`
  flex: 1;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: ${spacing.md}px;
`;

// Form header section
export const FormHeader = styled(View)`
  align-items: center;
  margin-bottom: ${spacing.lg}px;
`;

// Form title
export const FormTitle = styled(Text)`
  ${typography.textStyles.h1}
  color: ${colors.text.primary};
  margin-bottom: ${spacing.xs}px;
  text-align: center;
`;

// Form subtitle
export const FormSubtitle = styled(Text)`
  ${typography.textStyles.body}
  color: ${colors.text.secondary};
  text-align: center;
  margin-bottom: ${spacing.sm}px;
`;

// Form body section containing inputs
export const FormBody = styled(View)`
  width: 100%;
  margin-bottom: ${spacing.lg}px;
`;

// Container for individual form fields
export const FormFieldContainer = styled(View)`
  margin-bottom: ${spacing.md}px;
`;

// Display form-level error messages
export const FormErrorMessage = styled(Text)`
  ${typography.textStyles.small}
  color: ${colors.error.main};
  margin-top: ${spacing.xs}px;
  margin-bottom: ${spacing.sm}px;
`;

// Form footer section for buttons and links
export const FormFooter = styled(View)`
  width: 100%;
  align-items: center;
`;

// Divider for separating form sections (e.g., "or continue with")
export const FormDivider = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-vertical: ${spacing.md}px;
  width: 100%;
`;

// Touchable component for form action links
export const FormLink = styled(TouchableOpacity)`
  margin-top: ${spacing.md}px;
`;

// Text component for form action links
export const FormLinkText = styled(Text)`
  ${typography.textStyles.body}
  color: ${colors.primary.main};
  text-align: center;
`;

// Form variants with their text content
export const formVariants = {
  login: {
    title: 'Sign In',
    subtitle: 'Welcome back! Please sign in to continue.',
    actionText: 'Sign In'
  },
  register: {
    title: 'Create Account',
    subtitle: 'Join Tribe to connect with like-minded people.',
    actionText: 'Sign Up'
  },
  forgotPassword: {
    title: 'Reset Password',
    subtitle: 'Enter your email to receive a password reset link.',
    actionText: 'Send Reset Link'
  }
};

// Function to get form variant styles based on the variant
export const getFormVariantStyles = (variant: FormVariant): FormVariantStyles => {
  return formVariants[variant];
};