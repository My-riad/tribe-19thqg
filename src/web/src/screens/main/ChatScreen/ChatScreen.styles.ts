import styled from 'styled-components/native';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { theme } from '../../../theme';
import { colors, spacing, typography, shadows } from '../../../theme';

/**
 * Main container for the entire chat screen
 */
export const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

/**
 * Header component with platform-specific shadow
 */
export const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.background.paper};
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
  ${Platform.OS === 'ios' ? theme.shadows.sm : ''}
`;

/**
 * Title text in the header
 */
export const HeaderTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
`;

/**
 * Main content container
 */
export const Content = styled(View)`
  flex: 1;
  padding: ${theme.spacing.sm}px;
`;

/**
 * Container for loading state
 */
export const LoadingContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/**
 * Container for error state
 */
export const ErrorContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
`;

/**
 * Text component for error messages
 */
export const ErrorText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Button component for retry actions
 */
export const RetryButton = styled(TouchableOpacity)`
  background-color: ${theme.colors.primary.main};
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  border-radius: ${theme.spacing.sm}px;
  ${theme.shadows.sm}
`;

/**
 * Text component for retry button
 */
export const RetryButtonText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.primary.contrast};
`;

/**
 * Container for empty state
 */
export const EmptyStateContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
`;

/**
 * Text component for empty state message
 */
export const EmptyStateText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${theme.spacing.lg}px;
`;

/**
 * Styled FlatList for tribe list
 */
export const TribeList = styled(FlatList)`
  flex: 1;
`;

/**
 * Container for tribe list items
 */
export const TribeItemContainer = styled(View)`
  margin-bottom: ${theme.spacing.sm}px;
  position: relative;
`;

/**
 * Badge component for unread message count
 */
export const UnreadBadge = styled(View)`
  position: absolute;
  top: ${theme.spacing.xs}px;
  right: ${theme.spacing.xs}px;
  min-width: ${theme.spacing.md}px;
  height: ${theme.spacing.md}px;
  border-radius: ${theme.spacing.md / 2}px;
  background-color: ${theme.colors.primary.main};
  align-items: center;
  justify-content: center;
  padding-horizontal: ${theme.spacing.xs / 2}px;
  z-index: 1;
`;

/**
 * Text component for unread message count
 */
export const UnreadBadgeText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xs}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.primary.contrast};
`;