import styled from 'styled-components/native';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

/**
 * Main container for the interest selection screen with appropriate padding and background color
 */
export const Container = styled(View)`
  flex: 1;
  padding: ${spacing.lg}px;
  background-color: ${colors.background.default};
`;

/**
 * Title component for the interest selection screen using h2 text style
 */
export const Title = styled(Text)`
  ${typography.textStyles.h2};
  color: ${colors.text.primary};
  margin-bottom: ${spacing.sm}px;
`;

/**
 * Description text explaining the interest selection process
 */
export const Description = styled(Text)`
  ${typography.textStyles.body};
  color: ${colors.text.secondary};
  margin-bottom: ${spacing.md}px;
`;

/**
 * Scrollable container for the list of interests
 */
export const InterestsContainer = styled(ScrollView)`
  flex: 1;
  margin-bottom: ${spacing.md}px;
`;

/**
 * Container for grouping interests by category with bottom margin
 */
export const CategoryContainer = styled(View)`
  margin-bottom: ${spacing.lg}px;
`;

/**
 * Title for each interest category using h3 text style
 */
export const CategoryTitle = styled(Text)`
  ${typography.textStyles.h3};
  color: ${colors.text.primary};
  margin-bottom: ${spacing.sm}px;
`;

/**
 * Touchable component for individual interest items with selected state styling
 */
export const InterestItem = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: ${spacing.sm}px ${spacing.md}px;
  margin-bottom: ${spacing.xs}px;
  border-radius: ${spacing.sm}px;
  background-color: ${props => props.selected ? colors.primary.light : colors.background.subtle};
  border: 1px solid ${props => props.selected ? colors.primary.main : colors.border.light};
`;

/**
 * Text component for interest item labels with color change based on selection state
 */
export const InterestItemText = styled(Text)`
  ${typography.textStyles.body};
  color: ${props => props.selected ? colors.primary.contrast : colors.text.primary};
  flex: 1;
`;

/**
 * Visual indicator for selected interests
 */
export const SelectedIndicator = styled(View)`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${colors.primary.contrast};
  align-items: center;
  justify-content: center;
  margin-left: ${spacing.sm}px;
`;

/**
 * Text component for displaying the count of selected interests
 */
export const SelectedCount = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.text.secondary};
  margin-bottom: ${spacing.md}px;
  text-align: center;
`;