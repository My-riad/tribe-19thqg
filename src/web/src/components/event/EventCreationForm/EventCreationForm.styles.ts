import styled from 'styled-components/native';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../../theme';

/**
 * Main container for the entire event creation form
 */
const FormContainer = styled(View)`
  width: 100%;
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.md}px;
  ${theme.shadows.md}
`;

/**
 * Container that adjusts form position when keyboard appears
 */
const KeyboardAwareFormContainer = styled(KeyboardAvoidingView).attrs({
  behavior: Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: Platform.OS === 'ios' ? 64 : 0
})`
  flex: 1;
  width: 100%;
`;

/**
 * Scrollable container for form content
 */
const ScrollableFormContent = styled(ScrollView)`
  width: 100%;
  padding: ${theme.spacing.lg}px;
`;

/**
 * Header section for the form containing title and subtitle
 */
const FormHeader = styled(View)`
  align-items: flex-start;
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Title component for the form
 */
const FormTitle = styled(Text)`
  ${theme.typography.textStyles.h1}
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

/**
 * Subtitle component for the form
 */
const FormSubtitle = styled(Text)`
  ${theme.typography.textStyles.body}
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.sm}px;
`;

/**
 * Body section containing form inputs
 */
const FormBody = styled(View)`
  width: 100%;
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Container for individual form fields
 */
const FormFieldContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Component for displaying form-level error messages
 */
const FormErrorMessage = styled(Text)`
  ${theme.typography.textStyles.small}
  color: ${theme.colors.error.main};
  margin-top: ${theme.spacing.xs}px;
  margin-bottom: ${theme.spacing.sm}px;
`;

/**
 * Footer section for form actions like submit and cancel buttons
 */
const FormFooter = styled(View)`
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg}px;
`;

/**
 * Divider for separating form sections
 */
const SectionDivider = styled(View)`
  height: 1px;
  width: 100%;
  background-color: ${theme.colors.border.light};
  margin-vertical: ${theme.spacing.md}px;
`;

/**
 * Title for form sections
 */
const SectionTitle = styled(Text)`
  ${theme.typography.textStyles.h3}
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
  margin-top: ${theme.spacing.sm}px;
`;

/**
 * Container for date and time input fields
 */
const DateTimeContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for location input fields
 */
const LocationContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for description input field
 */
const DescriptionContainer = styled(View)`
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for AI optimization options with light background
 */
const AIOptimizationContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.sm}px;
  background-color: ${theme.colors.primary.light}20;
  border-radius: ${theme.spacing.xs}px;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Styled text for AI optimization options
 */
const AIOptimizationText = styled(Text)`
  ${theme.typography.textStyles.body}
  color: ${theme.colors.primary.dark};
  flex: 1;
  margin-left: ${theme.spacing.sm}px;
`;

export {
  FormContainer,
  KeyboardAwareFormContainer,
  ScrollableFormContent,
  FormHeader,
  FormTitle,
  FormSubtitle,
  FormBody,
  FormFieldContainer,
  FormErrorMessage,
  FormFooter,
  SectionDivider,
  SectionTitle,
  DateTimeContainer,
  LocationContainer,
  DescriptionContainer,
  AIOptimizationContainer,
  AIOptimizationText
};