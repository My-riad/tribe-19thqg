import styled from 'styled-components/native';
import { Animated, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import {
  theme,
  colors,
  typography,
  spacing,
  shadows,
  breakpoints,
  isSmallDevice,
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInUp,
  slideOutDown
} from '../../../theme';

// Type definitions
type DialogSize = 'sm' | 'md' | 'lg' | 'fullscreen';
type DialogVariant = 'alert' | 'confirmation' | 'input';

interface DialogSizeStyles {
  width: number;
  maxWidth: number;
  maxHeight: number;
  borderRadius: number;
  fullscreen?: boolean;
}

interface DialogVariantStyles {
  background: string;
  border: string;
  padding: number;
}

/**
 * Returns the appropriate size-related styles for a dialog based on its size prop
 */
const getDialogSizeStyles = (size: DialogSize): DialogSizeStyles => {
  const { width, height } = Dimensions.get('window');
  const isSmall = isSmallDevice();
  
  switch (size) {
    case 'sm':
      return {
        width: isSmall ? width * 0.85 : 320,
        maxWidth: 320,
        maxHeight: height * 0.7,
        borderRadius: 12
      };
    case 'md':
      return {
        width: isSmall ? width * 0.9 : 400,
        maxWidth: 400,
        maxHeight: height * 0.8,
        borderRadius: 12
      };
    case 'lg':
      return {
        width: isSmall ? width * 0.95 : 480,
        maxWidth: 480,
        maxHeight: height * 0.9,
        borderRadius: 12
      };
    case 'fullscreen':
      return {
        width: width,
        maxWidth: width,
        maxHeight: height,
        borderRadius: 0,
        fullscreen: true
      };
    default:
      return {
        width: isSmall ? width * 0.9 : 400,
        maxWidth: 400,
        maxHeight: height * 0.8,
        borderRadius: 12
      };
  }
};

/**
 * Returns the appropriate styles for a dialog based on its variant prop
 */
const getDialogVariantStyles = (variant: DialogVariant): DialogVariantStyles => {
  switch (variant) {
    case 'alert':
      return {
        background: theme.colors.background.paper,
        border: `1px solid ${theme.colors.border.main}`,
        padding: theme.spacing.md
      };
    case 'confirmation':
      return {
        background: theme.colors.background.paper,
        border: `1px solid ${theme.colors.primary.light}`,
        padding: theme.spacing.md
      };
    case 'input':
      return {
        background: theme.colors.background.paper,
        border: `1px solid ${theme.colors.border.main}`,
        padding: theme.spacing.lg
      };
    default:
      return {
        background: theme.colors.background.paper,
        border: `1px solid ${theme.colors.border.main}`,
        padding: theme.spacing.md
      };
  }
};

// Styled components for Dialog
export const DialogOverlay = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.colors.overlay};
  justify-content: center;
  align-items: center;
`;

export const DialogContainer = styled(View)<{ variant?: DialogVariant; size?: DialogSize; fullWidth?: boolean }>`
  background-color: ${props => getDialogVariantStyles(props.variant || 'alert').background};
  border-radius: ${props => getDialogSizeStyles(props.size || 'md').borderRadius}px;
  width: ${props => props.fullWidth ? '90%' : getDialogSizeStyles(props.size || 'md').width}px;
  max-width: ${props => getDialogSizeStyles(props.size || 'md').maxWidth}px;
  max-height: ${props => getDialogSizeStyles(props.size || 'md').maxHeight}px;
  ${theme.shadows.md}
  overflow: hidden;
`;

export const DialogHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

export const DialogTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  flex: 1;
`;

export const DialogContent = styled(View)<{ noPadding?: boolean; size?: DialogSize }>`
  padding: ${props => props.noPadding ? 0 : theme.spacing.md}px;
  max-height: ${props => getDialogSizeStyles(props.size || 'md').maxHeight - 120}px;
`;

export const DialogFooter = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  padding: ${theme.spacing.md}px;
  border-top-width: 1px;
  border-top-color: ${theme.colors.border.light};
  gap: ${theme.spacing.sm}px;
`;

export const DialogCloseButton = styled(TouchableOpacity)`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  justify-content: center;
  align-items: center;
  background-color: ${theme.colors.background.secondary};
`;

// Animated components
export const AnimatedDialogContainer = styled(Animated.View)<{ size?: DialogSize }>`
  ${props => getDialogSizeStyles(props.size || 'md').fullscreen ? 'flex: 1;' : ''}
`;

export const AnimatedDialogOverlay = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
`;

export type { DialogSize, DialogVariant };