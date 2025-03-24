import styled from 'styled-components/native';
import { View, Text } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

/**
 * Interface for badge style props used in styled components
 */
interface BadgeStyleProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  outlined?: boolean;
  color?: string;
}

/**
 * Defines color configurations for different badge variants
 */
const badgeVariants = {
  primary: {
    background: colors.primary.main,
    text: colors.primary.contrast,
    border: colors.primary.main
  },
  secondary: {
    background: colors.secondary.main,
    text: colors.secondary.contrast,
    border: colors.secondary.main
  },
  success: {
    background: colors.success.main,
    text: colors.success.contrast,
    border: colors.success.main
  },
  warning: {
    background: colors.warning.main,
    text: colors.warning.contrast,
    border: colors.warning.main
  },
  error: {
    background: colors.error.main,
    text: colors.error.contrast,
    border: colors.error.main
  }
};

/**
 * Defines size configurations for different badge sizes
 */
const badgeSizes = {
  xs: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: typography.fontSize.xs
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: typography.fontSize.xs
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: typography.fontSize.sm
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: typography.fontSize.sm
  }
};

/**
 * Defines size configurations for notification badges
 */
const notificationBadgeSizes = {
  xs: {
    size: 16,
    fontSize: typography.fontSize.xs
  },
  sm: {
    size: 20,
    fontSize: typography.fontSize.xs
  },
  md: {
    size: 24,
    fontSize: typography.fontSize.sm
  },
  lg: {
    size: 28,
    fontSize: typography.fontSize.sm
  }
};

/**
 * Returns the appropriate colors for a badge based on its variant and outlined state
 * @param props - Object containing variant, outlined state, and custom color
 * @returns Color configuration for background, text, and border
 */
const getBadgeColors = (props: { variant?: BadgeVariant; outlined?: boolean; color?: string }) => {
  const { variant = 'primary', outlined = false, color } = props;
  
  // If custom color is provided, use it
  if (color) {
    return {
      background: outlined ? 'transparent' : color,
      text: outlined ? color : '#FFFFFF', // Assume white text on custom color background
      border: color
    };
  }
  
  // Otherwise use variant colors
  const variantColors = badgeVariants[variant];
  
  return {
    background: outlined ? 'transparent' : variantColors.background,
    text: outlined ? variantColors.border : variantColors.text,
    border: variantColors.border
  };
};

/**
 * Returns the appropriate size-related styles for a badge based on its size prop
 * @param props - Object containing size prop
 * @returns Size-related styles including padding, height, and border-radius
 */
const getBadgeSizeStyles = (props: { size?: BadgeSize }) => {
  const { size = 'md' } = props;
  return badgeSizes[size];
};

/**
 * Styled container component for the standard badge with variant and size styling
 */
const BadgeContainer = styled(View)<BadgeStyleProps>`
  background-color: ${props => getBadgeColors(props).background};
  border-width: 1px;
  border-color: ${props => getBadgeColors(props).border};
  border-radius: ${props => getBadgeSizeStyles(props).borderRadius}px;
  padding-vertical: ${props => getBadgeSizeStyles(props).paddingVertical}px;
  padding-horizontal: ${props => getBadgeSizeStyles(props).paddingHorizontal}px;
  align-self: flex-start;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

/**
 * Styled text component for the badge content
 */
const BadgeText = styled(Text)<BadgeStyleProps>`
  color: ${props => getBadgeColors(props).text};
  font-size: ${props => getBadgeSizeStyles(props).fontSize}px;
  font-family: ${typography.fontFamily.primary};
  font-weight: ${typography.fontWeight.medium};
`;

/**
 * Specialized badge variant for notifications with count display
 */
const NotificationBadge = styled(View)<BadgeStyleProps>`
  background-color: ${props => getBadgeColors(props).background};
  border-width: 1px;
  border-color: ${props => getBadgeColors(props).border};
  width: ${props => notificationBadgeSizes[props.size || 'md'].size}px;
  height: ${props => notificationBadgeSizes[props.size || 'md'].size}px;
  border-radius: ${props => notificationBadgeSizes[props.size || 'md'].size / 2}px;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -${props => notificationBadgeSizes[props.size || 'md'].size / 3}px;
  right: -${props => notificationBadgeSizes[props.size || 'md'].size / 3}px;
`;

/**
 * Specialized badge variant for status indicators
 */
const StatusBadge = styled(View)<BadgeStyleProps>`
  background-color: ${props => getBadgeColors(props).background};
  border-width: 1px;
  border-color: ${props => getBadgeColors(props).border};
  border-radius: ${props => getBadgeSizeStyles(props).borderRadius}px;
  padding-vertical: ${props => getBadgeSizeStyles(props).paddingVertical}px;
  padding-horizontal: ${props => getBadgeSizeStyles(props).paddingHorizontal}px;
  flex-direction: row;
  align-items: center;
`;

/**
 * Specialized badge variant for achievements with icon support
 */
const AchievementBadge = styled(View)<BadgeStyleProps>`
  background-color: ${props => getBadgeColors(props).background};
  border-width: 1px;
  border-color: ${props => getBadgeColors(props).border};
  border-radius: ${props => getBadgeSizeStyles(props).borderRadius}px;
  padding-vertical: ${props => getBadgeSizeStyles(props).paddingVertical}px;
  padding-horizontal: ${props => getBadgeSizeStyles(props).paddingHorizontal}px;
  flex-direction: row;
  align-items: center;
`;

// Type definitions for badge variants and sizes
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export {
  BadgeContainer,
  BadgeText,
  NotificationBadge,
  StatusBadge,
  AchievementBadge
};