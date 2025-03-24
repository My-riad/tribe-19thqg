import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import {
  BadgeContainer,
  BadgeText,
  NotificationBadge,
  StatusBadge,
  AchievementBadge
} from './Badge.styles';

// Type definitions
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type BadgeType = 'standard' | 'notification' | 'status' | 'achievement';

// Props interface
export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  type?: BadgeType;
  outlined?: boolean;
  color?: string;
  count?: number;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

/**
 * A versatile badge component that can be used for status indicators, notifications, and achievements.
 * Supports different variants, sizes, and types for flexible UI implementation.
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'standard',
  outlined = false,
  color,
  count = 0,
  icon,
  style = {},
  textStyle = {},
  testID,
}: BadgeProps): JSX.Element => {
  // Ensure count is non-negative and handle overflow
  const safeCount = Math.max(0, Math.round(count));
  const displayCount = safeCount > 99 ? '99+' : safeCount.toString();
  
  // Common props for all badge containers
  const containerProps = {
    variant,
    size,
    outlined,
    color,
    style,
    testID,
  };
  
  // Common props for all badge text elements
  const textProps = {
    variant,
    size,
    outlined,
    color,
    style: textStyle,
  };
  
  // Render badge based on type
  if (type === 'notification') {
    return (
      <NotificationBadge {...containerProps}>
        <BadgeText {...textProps}>{displayCount}</BadgeText>
      </NotificationBadge>
    );
  }
  
  if (type === 'status') {
    return (
      <StatusBadge {...containerProps}>
        <BadgeText {...textProps}>{children}</BadgeText>
      </StatusBadge>
    );
  }
  
  if (type === 'achievement') {
    return (
      <AchievementBadge {...containerProps}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <BadgeText {...textProps}>{children}</BadgeText>
      </AchievementBadge>
    );
  }
  
  // Default: standard badge
  return (
    <BadgeContainer {...containerProps}>
      <BadgeText {...textProps}>{children}</BadgeText>
    </BadgeContainer>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Badge;