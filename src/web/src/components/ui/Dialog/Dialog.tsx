import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Modal,
  TouchableWithoutFeedback,
  View,
  Platform
} from 'react-native';

import {
  theme,
  colors,
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInUp,
  slideOutDown
} from '../../../theme';

import {
  DialogOverlay,
  DialogContainer,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogCloseButton,
  AnimatedDialogContainer,
  AnimatedDialogOverlay
} from './Dialog.styles';

import Button from '../Button';

// Types for dialog properties
export type DialogSize = 'sm' | 'md' | 'lg' | 'fullscreen';
export type DialogVariant = 'alert' | 'confirmation' | 'input';
export type DialogAnimationType = 'fade' | 'scale' | 'slideUp';

// Interface for dialog action buttons
export interface DialogActionButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  isLoading?: boolean;
  disabled?: boolean;
}

// Props interface for the Dialog component
export interface DialogProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: DialogVariant;
  size?: DialogSize;
  animationType?: DialogAnimationType;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  closeOnBackButtonPress?: boolean;
  primaryAction?: DialogActionButton;
  secondaryAction?: DialogActionButton;
  fullWidth?: boolean;
  noPadding?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

/**
 * A versatile dialog component that supports multiple variants, sizes, and animations
 */
const Dialog = ({
  isVisible,
  onClose,
  title,
  children,
  variant = 'alert',
  size = 'md',
  animationType = 'fade',
  showCloseButton = true,
  closeOnBackdropPress = true,
  closeOnBackButtonPress = true,
  primaryAction,
  secondaryAction,
  fullWidth = false,
  noPadding = false,
  testID,
  accessibilityLabel
}: DialogProps) => {
  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dialogAnimation = useRef(new Animated.Value(0)).current;
  
  // State for controlling visibility
  const [visible, setVisible] = useState(isVisible);
  const [animating, setAnimating] = useState(false);

  // Handle the Android back button
  useEffect(() => {
    let backHandler: any;
    
    if (Platform.OS === 'android' && isVisible && closeOnBackButtonPress) {
      backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
    }
    
    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [isVisible, closeOnBackButtonPress, onClose]);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      setVisible(true);
      animateIn();
    } else if (visible) {
      animateOut();
    }
  }, [isVisible]);

  // Animation functions
  const animateIn = () => {
    setAnimating(true);
    
    // Set initial animation values
    if (animationType === 'scale') {
      dialogAnimation.setValue(0.8);
    } else if (animationType === 'slideUp') {
      dialogAnimation.setValue(100);
    } else {
      dialogAnimation.setValue(0);
    }
    
    Animated.parallel([
      fadeIn(backdropOpacity, {
        duration: 300,
        useNativeDriver: true
      }),
      animationType === 'fade' 
        ? fadeIn(dialogAnimation, {
            duration: 300,
            useNativeDriver: true
          })
        : animationType === 'scale'
        ? scaleIn(dialogAnimation, {
            duration: 300,
            useNativeDriver: true
          })
        : slideInUp(dialogAnimation, {
            duration: 300,
            useNativeDriver: true
          })
    ]).start(() => {
      setAnimating(false);
    });
  };

  const animateOut = () => {
    setAnimating(true);
    
    Animated.parallel([
      fadeOut(backdropOpacity, {
        duration: 250,
        useNativeDriver: true
      }),
      animationType === 'fade'
        ? fadeOut(dialogAnimation, {
            duration: 250,
            useNativeDriver: true
          })
        : animationType === 'scale'
        ? scaleOut(dialogAnimation, {
            duration: 250,
            useNativeDriver: true
          })
        : slideOutDown(dialogAnimation, {
            duration: 250,
            useNativeDriver: true
          })
    ]).start(() => {
      setVisible(false);
      setAnimating(false);
    });
  };

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdropPress && !animating) {
      onClose();
    }
  };

  if (!visible) {
    return null;
  }

  // Determine animation styles
  const getAnimatedStyles = () => {
    if (animationType === 'fade') {
      return {
        opacity: dialogAnimation
      };
    } else if (animationType === 'scale') {
      return {
        opacity: backdropOpacity,
        transform: [{ scale: dialogAnimation }]
      };
    } else { // slideUp
      return {
        opacity: backdropOpacity,
        transform: [{ translateY: dialogAnimation }]
      };
    }
  };

  // Set up accessibility props
  const dialogAccessibilityProps = {
    accessible: true,
    accessibilityRole: 'dialog' as const,
    accessibilityLabel: accessibilityLabel || title,
    accessibilityViewIsModal: true,
    testID: testID
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={closeOnBackButtonPress ? onClose : undefined}
      animationType="none"
      statusBarTranslucent
    >
      <AnimatedDialogOverlay style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: backdropOpacity }}>
        {closeOnBackdropPress && (
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          </TouchableWithoutFeedback>
        )}
        
        <AnimatedDialogContainer
          style={getAnimatedStyles()}
          size={size}
        >
          <DialogContainer
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            {...dialogAccessibilityProps}
          >
            {(title || showCloseButton) && (
              <DialogHeader>
                {title && <DialogTitle>{title}</DialogTitle>}
                {showCloseButton && (
                  <TouchableWithoutFeedback
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close dialog"
                  >
                    <DialogCloseButton>
                      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 16, height: 2, backgroundColor: colors.text.primary, transform: [{ rotate: '45deg' }] }} />
                        <View style={{ width: 16, height: 2, backgroundColor: colors.text.primary, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
                      </View>
                    </DialogCloseButton>
                  </TouchableWithoutFeedback>
                )}
              </DialogHeader>
            )}
            
            <DialogContent noPadding={noPadding} size={size}>
              {children}
            </DialogContent>
            
            {(primaryAction || secondaryAction) && (
              <DialogFooter>
                {secondaryAction && (
                  <Button
                    variant={secondaryAction.variant || 'tertiary'}
                    onPress={secondaryAction.onPress}
                    disabled={secondaryAction.disabled}
                    isLoading={secondaryAction.isLoading}
                  >
                    {secondaryAction.label}
                  </Button>
                )}
                
                {primaryAction && (
                  <Button
                    variant={primaryAction.variant || 'primary'}
                    onPress={primaryAction.onPress}
                    disabled={primaryAction.disabled}
                    isLoading={primaryAction.isLoading}
                  >
                    {primaryAction.label}
                  </Button>
                )}
              </DialogFooter>
            )}
          </DialogContainer>
        </AnimatedDialogContainer>
      </AnimatedDialogOverlay>
    </Modal>
  );
};

export default Dialog;