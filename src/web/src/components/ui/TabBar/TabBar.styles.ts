import styled from 'styled-components/native';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

/**
 * Available tab bar position variants
 */
export type TabBarVariant = 'top' | 'bottom';

/**
 * Interface for tab bar container style properties
 */
interface TabBarContainerStyles {
  borderTopWidth?: number;
  borderBottomWidth?: number;
  borderColor: string;
  boxShadow?: string;
}

/**
 * Returns the appropriate styles for the tab bar container based on its variant
 * @param variant The tab bar position variant ('top' or 'bottom')
 * @returns Object containing position-related styles for the tab bar
 */
const getTabBarContainerStyles = (variant: TabBarVariant): TabBarContainerStyles => {
  if (variant === 'top') {
    return {
      borderBottomWidth: 1,
      borderColor: theme.colors.border.light,
      boxShadow: theme.shadows.sm,
    };
  } else {
    // default to bottom
    return {
      borderTopWidth: 1,
      borderColor: theme.colors.border.light,
      boxShadow: theme.shadows.sm,
    };
  }
};

/**
 * Styled container for the tab bar with support for top and bottom variants
 */
export const TabBarContainer = styled(View)`
  flex-direction: row;
  background-color: ${theme.colors.background.default};
  height: 56px;
  width: 100%;
  ${props => getTabBarContainerStyles(props.variant)}
`;

/**
 * Styled touchable component for individual tab items
 */
export const TabItem = styled(TouchableOpacity)`
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  height: 100%;
`;

/**
 * Styled container for the content of each tab item
 */
export const TabItemContent = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xs}px;
`;

/**
 * Styled container for tab icons with conditional spacing based on label visibility
 */
export const TabIcon = styled(View)`
  margin-bottom: ${props => props.showLabel ? theme.spacing.xs : 0}px;
`;

/**
 * Styled text component for tab labels with active state styling
 */
export const TabLabel = styled(Text)`
  font-size: ${theme.typography.fontSize.sm}px;
  font-family: ${theme.typography.fontFamily.primary};
  font-weight: ${props => props.active ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular};
  color: ${props => props.active ? theme.colors.primary.main : theme.colors.text.secondary};
  text-align: center;
`;

/**
 * Styled container for notification badges displayed on tabs
 */
export const TabBadge = styled(View)`
  position: absolute;
  top: -2px;
  right: -6px;
  background-color: ${theme.colors.error.main};
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding-horizontal: 4px;
`;

/**
 * Styled text component for the notification badge count
 */
export const TabBadgeText = styled(Text)`
  color: ${theme.colors.text.contrast};
  font-size: 10px;
  font-weight: ${theme.typography.fontWeight.bold};
`;

/**
 * Styled animated component for the active tab indicator with support for top and bottom variants
 */
export const TabIndicator = styled(Animated.View)`
  position: absolute;
  height: 3px;
  background-color: ${theme.colors.primary.main};
  border-radius: 3px;
  ${props => props.variant === 'top' ? 'bottom: 0;' : 'top: 0;'}
`;