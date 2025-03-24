import styled from 'styled-components/native';
import { Animated, View } from 'react-native';
import { theme } from '../../../theme';

// Card elevation options
export type CardElevation = 'none' | 'low' | 'medium' | 'high';

// Card size options
export type CardSize = 'sm' | 'md' | 'lg';

// Card variant options
export type CardVariant = 'standard' | 'compact' | 'interactive';

// Interface for card size styles
export interface CardSizeStyles {
  padding: number;
}

/**
 * Returns the appropriate shadow styles for a card based on its elevation level
 */
const getElevationStyles = (elevation?: CardElevation) => {
  switch (elevation) {
    case 'none':
      return theme.shadows.none;
    case 'low':
      return theme.shadows.sm;
    case 'medium':
      return theme.shadows.md;
    case 'high':
      return theme.shadows.lg;
    default:
      return theme.shadows.sm; // Default to low elevation
  }
};

/**
 * Returns the appropriate size-related styles for a card based on its size prop
 */
const getCardSizeStyles = (size?: CardSize, noPadding?: boolean): string => {
  if (noPadding) {
    return 'padding: 0;';
  }

  switch (size) {
    case 'sm':
      return `padding: ${theme.spacing.sm}px;`;
    case 'lg':
      return `padding: ${theme.spacing.lg}px;`;
    case 'md':
    default:
      return `padding: ${theme.spacing.md}px;`;
  }
};

/**
 * Styled container component for standard and compact cards with support for 
 * different elevations, sizes, and customization options
 */
export const CardContainer = styled(View)<{
  elevation?: CardElevation;
  variant?: CardVariant;
  fullWidth?: boolean;
  borderColor?: string;
  size?: CardSize;
  noPadding?: boolean;
}>`
  background-color: ${theme.colors.background.paper};
  border-radius: ${props => props.variant === 'compact' ? theme.borderRadius.sm : theme.borderRadius.md}px;
  overflow: hidden;
  ${props => getElevationStyles(props.elevation)}
  ${props => props.fullWidth ? 'width: 100%;' : ''}
  ${props => props.borderColor ? `border-width: 1px; border-color: ${props.borderColor};` : ''}
  ${props => getCardSizeStyles(props.size, props.noPadding)}
`;

/**
 * Styled container component for interactive cards with animation support
 * and the same styling options as standard cards
 */
export const InteractiveCardContainer = styled(Animated.View)<{
  elevation?: CardElevation;
  fullWidth?: boolean;
  borderColor?: string;
  size?: CardSize;
  noPadding?: boolean;
}>`
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borderRadius.md}px;
  overflow: hidden;
  ${props => getElevationStyles(props.elevation)}
  ${props => props.fullWidth ? 'width: 100%;' : ''}
  ${props => props.borderColor ? `border-width: 1px; border-color: ${props.borderColor};` : ''}
  ${props => getCardSizeStyles(props.size, props.noPadding)}
`;

/**
 * Styled component for the content area of cards with optional padding
 */
export const CardContent = styled(View)<{
  noPadding?: boolean;
}>`
  padding: ${props => props.noPadding ? 0 : theme.spacing.md}px;
`;

/**
 * Styled component for card headers with border and appropriate spacing
 */
export const CardHeader = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

/**
 * Styled component for card footers with border and appropriate spacing
 */
export const CardFooter = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding: ${theme.spacing.md}px;
  border-top-width: 1px;
  border-top-color: ${theme.colors.border.light};
`;