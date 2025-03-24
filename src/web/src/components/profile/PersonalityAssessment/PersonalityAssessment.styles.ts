import styled from 'styled-components/native';
import { Animated, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import { colors, typography, spacing, shadows } from '../../../theme';

/**
 * Main scrollable container for the personality assessment
 * with appropriate padding and background color
 */
export const Container = styled(ScrollView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
  padding: ${theme.spacing.lg}px;
`;

/**
 * Container for individual assessment questions
 * with bottom margin for spacing
 */
export const QuestionContainer = styled(View)`
  margin-bottom: ${theme.spacing.xl}px;
`;

/**
 * Text component for displaying question number
 * with primary color and appropriate typography
 */
export const QuestionNumber = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.primary.main};
  margin-bottom: ${theme.spacing.xs}px;
`;

/**
 * Text component for displaying question text
 * with larger font size and semibold weight for emphasis
 */
export const QuestionText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.semiBold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for answer options
 * with top margin for spacing from question
 */
export const OptionsContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
`;

/**
 * Touchable component for individual answer options
 * with selection state styling and subtle shadow
 */
export const OptionItem = styled(TouchableOpacity)`
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.spacing.sm}px;
  border-width: 1px;
  border-color: ${props => props.selected ? theme.colors.primary.main : theme.colors.neutral[300]};
  background-color: ${props => props.selected ? theme.colors.primary.light : theme.colors.background.paper};
  margin-bottom: ${theme.spacing.sm}px;
  ${theme.shadows.xs}
`;

/**
 * Text component for option label
 * with conditional styling based on selection state
 */
export const OptionText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${props => props.selected ? theme.colors.primary.dark : theme.colors.text.primary};
  margin-bottom: ${props => props.hasDescription ? theme.spacing.xs : 0}px;
`;

/**
 * Text component for option description
 * with smaller font size and secondary color
 */
export const OptionDescription = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.regular};
  color: ${props => props.selected ? theme.colors.primary.dark : theme.colors.text.secondary};
`;

/**
 * Container for progress indicator and text
 * with appropriate vertical margins
 */
export const ProgressContainer = styled(View)`
  margin-top: ${theme.spacing.xl}px;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Text component for progress percentage
 * with right alignment and secondary color
 */
export const ProgressText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.regular};
  color: ${theme.colors.text.secondary};
  text-align: right;
  margin-top: ${theme.spacing.xs}px;
`;

/**
 * Container for navigation buttons
 * with row layout and space-between justification
 */
export const NavigationContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.xl}px;
  padding-bottom: ${theme.spacing.xl}px;
`;

/**
 * Animated container for question transitions
 * with full width to enable proper animation
 */
export const AnimatedQuestionContainer = styled(Animated.View)`
  width: 100%;
`;