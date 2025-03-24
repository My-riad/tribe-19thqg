import React from 'react';
import { TouchableOpacity, Animated, GestureResponderEvent } from 'react-native';
import {
  CardContainer,
  InteractiveCardContainer,
  CardContent,
  CardHeader,
  CardFooter
} from './Card.styles';

/**
 * Props interface for the Card component defining all available customization options
 */
interface CardProps {
  children?: React.ReactNode;
  variant?: 'standard' | 'compact' | 'interactive';
  elevation?: 'none' | 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  fullWidth?: boolean;
  noPadding?: boolean;
  borderColor?: string;
  testID?: string;
  style?: any;
  contentStyle?: any;
}

/**
 * Configuration for the scale animation used in interactive cards
 */
const SCALE_ANIMATION_CONFIG = {
  duration: 150,
  useNativeDriver: true
};

/**
 * A versatile card component that serves as a container for content with different variants and customization options
 */
const Card = ({
  children,
  variant = 'standard',
  elevation = 'low',
  size = 'md',
  header,
  footer,
  onPress,
  fullWidth = false,
  noPadding = false,
  borderColor,
  testID,
  style,
  contentStyle
}: CardProps) => {
  // Animation setup for interactive cards
  const scale = React.useRef(new Animated.Value(1)).current;
  
  // Handle press in for animation
  const handlePressIn = React.useCallback(() => {
    if (variant === 'interactive') {
      Animated.timing(scale, {
        toValue: 0.98,
        ...SCALE_ANIMATION_CONFIG
      }).start();
    }
  }, [variant, scale]);
  
  // Handle press out for animation
  const handlePressOut = React.useCallback(() => {
    if (variant === 'interactive') {
      Animated.timing(scale, {
        toValue: 1,
        ...SCALE_ANIMATION_CONFIG
      }).start();
    }
  }, [variant, scale]);

  // Determine which container component to use based on variant
  const Container = variant === 'interactive' 
    ? InteractiveCardContainer 
    : CardContainer;
  
  // Props for the container component
  const containerProps = {
    elevation,
    variant: variant !== 'interactive' ? variant : undefined, // Only pass variant to CardContainer
    fullWidth,
    borderColor,
    size,
    noPadding,
    testID,
    style: variant === 'interactive' ? [{ transform: [{ scale }] }, style] : style
  };

  // Card content with header, body, and footer
  const renderContent = () => (
    <>
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent noPadding={noPadding} style={contentStyle}>
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </>
  );

  // Return the card with or without touch functionality
  return (
    <Container {...containerProps}>
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={variant === 'interactive' ? 0.9 : 0.7}
          accessible={true}
          accessibilityRole="button"
          testID={`${testID}-button`}
        >
          {renderContent()}
        </TouchableOpacity>
      ) : (
        renderContent()
      )}
    </Container>
  );
};

export default Card;
export type { CardProps };