import styled from 'styled-components/native';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { colors, spacing, typography } from '../../../theme';

/**
 * Container component for the activity feed with appropriate margins
 */
export const Container = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
  width: 100%;
`;

/**
 * Title component for the activity feed using h3 text style
 */
export const Title = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
`;

/**
 * List container for activity items
 */
export const ActivityList = styled(View)`
  width: 100%;
`;

/**
 * Component for individual activity items with horizontal layout and bottom border
 */
export const ActivityItem = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  padding: ${theme.spacing.sm}px 0;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

/**
 * Circular container for activity type icon
 */
export const ActivityIcon = styled(View)`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${theme.colors.primary.light};
  justify-content: center;
  align-items: center;
  margin-right: ${theme.spacing.sm}px;
`;

/**
 * Container for activity content that takes remaining space
 */
export const ActivityContent = styled(View)`
  flex: 1;
  justify-content: center;
`;

/**
 * Text component for activity description using body text style
 */
export const ActivityText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

/**
 * Component for activity timestamp using small text style and secondary text color
 */
export const ActivityTime = styled(Text)`
  ${theme.typography.textStyles.small};
  color: ${theme.colors.text.secondary};
`;

/**
 * Component for empty state display with centered content
 */
export const EmptyState = styled(View)`
  padding: ${theme.spacing.lg}px;
  align-items: center;
  justify-content: center;
`;

/**
 * Button for loading more activities with centered text and appropriate padding
 */
export const ViewMoreButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.md}px;
  align-items: center;
  justify-content: center;
  margin-top: ${theme.spacing.sm}px;
`;