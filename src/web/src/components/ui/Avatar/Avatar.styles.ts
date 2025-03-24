import styled from 'styled-components'; // styled-components ^5.3.6
import { View, Image, Text, Animated } from 'react-native'; // react-native ^0.70.0
import { colors, spacing } from '../../../theme';

/**
 * Defines available avatar sizes
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

/**
 * Defines available avatar shape variants
 */
export type AvatarVariant = 'circle' | 'rounded' | 'square';

/**
 * Interface for avatar styling props
 */
export interface AvatarStyleProps {
  size?: AvatarSize;
  variant?: AvatarVariant;
  backgroundColor?: string;
}

/**
 * Standard sizes for avatars in pixels
 */
export const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

/**
 * Text sizes for initials based on avatar size
 */
export const initialsTextSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
};

/**
 * Badge sizes based on avatar size
 */
export const badgeSizes = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
};

/**
 * Returns the appropriate size in pixels based on the avatar size prop
 */
export const getAvatarSize = (props: AvatarStyleProps): number => {
  const { size = 'md' } = props;
  
  if (typeof size === 'number') {
    return size;
  }
  
  return avatarSizes[size] || avatarSizes.md;
};

/**
 * Returns the appropriate border radius based on the avatar variant and size
 */
export const getBorderRadius = (props: AvatarStyleProps): number => {
  const { variant = 'circle' } = props;
  const size = getAvatarSize(props);
  
  switch (variant) {
    case 'circle':
      return size / 2;
    case 'rounded':
      return 8;
    case 'square':
      return 4;
    default:
      return size / 2;
  }
};

/**
 * Styled container for the avatar with size and shape styling
 */
export const AvatarContainer = styled(View)<AvatarStyleProps>`
  width: ${props => getAvatarSize(props)}px;
  height: ${props => getAvatarSize(props)}px;
  border-radius: ${props => getBorderRadius(props)}px;
  background-color: ${props => props.backgroundColor || colors.primary.light};
  overflow: hidden;
  align-items: center;
  justify-content: center;
`;

/**
 * Styled image component for displaying the avatar image
 */
export const AvatarImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

/**
 * Styled container for fallback display when no image is available
 */
export const AvatarFallback = styled(View)<AvatarStyleProps>`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.backgroundColor || colors.primary.light};
`;

/**
 * Styled text component for displaying user initials as fallback
 */
export const AvatarInitials = styled(Text)<AvatarStyleProps>`
  color: ${colors.text.contrast};
  font-weight: 500;
  text-align: center;
  font-size: ${props => {
    const size = props.size || 'md';
    return typeof size === 'string' 
      ? initialsTextSizes[size] || initialsTextSizes.md 
      : size / 3;
  }}px;
`;

/**
 * Styled component for displaying status badges on avatars
 */
export const AvatarBadge = styled(View)<AvatarStyleProps & { status?: string }>`
  position: absolute;
  width: ${props => {
    const size = props.size || 'md';
    return typeof size === 'string' 
      ? badgeSizes[size] || badgeSizes.md 
      : size / 4;
  }}px;
  height: ${props => {
    const size = props.size || 'md';
    return typeof size === 'string' 
      ? badgeSizes[size] || badgeSizes.md 
      : size / 4;
  }}px;
  border-radius: ${props => {
    const size = props.size || 'md';
    const badgeSize = typeof size === 'string' 
      ? badgeSizes[size] || badgeSizes.md 
      : size / 4;
    return badgeSize / 2;
  }}px;
  background-color: ${props => {
    switch (props.status) {
      case 'online':
        return colors.success.main;
      case 'away':
        return colors.warning.main;
      case 'busy':
        return colors.error.main;
      default:
        return colors.neutral[400];
    }
  }};
  border: 2px solid ${colors.background.default};
  bottom: 0;
  right: 0;
`;

/**
 * Styled container for displaying multiple avatars in a group
 */
export const AvatarGroup = styled(View)<{ spacing?: number }>`
  flex-direction: row;
  align-items: center;
  margin-left: ${props => props.spacing !== undefined ? props.spacing : spacing.sm}px;
`;