import React, { useState, useRef } from 'react';
import { 
  Animated, 
  TouchableWithoutFeedback, 
  GestureResponderEvent, 
  View 
} from 'react-native';

import { colors, buttonPress } from '../../../theme';
import {
  ListItemContainer,
  InteractiveListItemContainer,
  ExpandableListItemContainer,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemLeading,
  ListItemTrailing,
  ExpandedContent
} from './ListItem.styles';

// Define types for the component props
export type ListItemVariant = 'standard' | 'interactive' | 'expandable';
export type ListItemSize = 'sm' | 'md' | 'lg';
export type ListItemDensity = 'default' | 'compact';
export type ListItemPosition = 'first' | 'middle' | 'last' | 'single';

export interface ListItemProps {
  /** The primary text displayed in the list item */
  title: string;
  /** Optional secondary text displayed below the title */
  description?: string;
  /** The variant of the list item */
  variant?: ListItemVariant;
  /** The size of the list item */
  size?: ListItemSize;
  /** The density of the list item */
  density?: ListItemDensity;
  /** The position of the list item in a list */
  position?: ListItemPosition;
  /** Whether the list item is in a selected state */
  selected?: boolean;
  /** Whether the list item is disabled */
  disabled?: boolean;
  /** Function called when the list item is pressed */
  onPress?: (event: GestureResponderEvent) => void;
  /** Element displayed at the start of the list item */
  leadingElement?: React.ReactNode;
  /** Element displayed at the end of the list item */
  trailingElement?: React.ReactNode;
  /** Content displayed when the expandable list item is expanded */
  expandedContent?: React.ReactNode;
  /** Whether the expandable list item is expanded */
  expanded?: boolean;
  /** Function called when the expanded state changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Whether to show a bottom border */
  borderBottom?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
  /** Custom styles to apply to the container */
  style?: object;
}

/**
 * A versatile list item component that supports multiple variants, sizes, and customization options.
 * Used in lists, menus, and settings screens throughout the Tribe application.
 */
const ListItem = ({
  title,
  description,
  variant = 'standard',
  size = 'md',
  density = 'default',
  position = 'single',
  selected = false,
  disabled = false,
  onPress,
  leadingElement,
  trailingElement,
  expandedContent,
  expanded,
  onExpandChange,
  borderBottom = false,
  accessibilityLabel,
  testID,
  style
}: ListItemProps): JSX.Element => {
  // State for handling expandable variant (uncontrolled mode)
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Determine if component is controlled or uncontrolled for expanded state
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;
  
  // Animation value for interactive items - using useRef to persist between renders
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Handle press animations for interactive variant
  const handlePressIn = () => {
    if (disabled) return;
    
    if (variant === 'interactive') {
      const { pressIn } = buttonPress(scaleAnim);
      pressIn().start();
    }
  };
  
  const handlePressOut = () => {
    if (disabled) return;
    
    if (variant === 'interactive') {
      const { pressOut } = buttonPress(scaleAnim);
      pressOut().start();
    }
  };
  
  // Handle press events for all variants
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    
    // Handle expandable variant toggle
    if (variant === 'expandable') {
      if (isControlled && onExpandChange) {
        onExpandChange(!isExpanded);
      } else {
        setInternalExpanded(!internalExpanded);
      }
    }
    
    // Call onPress if provided
    if (onPress) {
      onPress(event);
    }
  };
  
  // Common props for all container types
  const commonProps = {
    size,
    density,
    position,
    selected,
    disabled,
    borderBottom
  };
  
  // Content to be placed inside the container
  const content = (
    <>
      {leadingElement && <ListItemLeading>{leadingElement}</ListItemLeading>}
      <ListItemContent>
        <ListItemTitle>{title}</ListItemTitle>
        {description && <ListItemDescription>{description}</ListItemDescription>}
      </ListItemContent>
      {trailingElement && <ListItemTrailing>{trailingElement}</ListItemTrailing>}
    </>
  );
  
  // Accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel: accessibilityLabel || title,
    accessibilityRole: onPress || variant === 'expandable' || variant === 'interactive' ? 'button' : 'none',
    accessibilityState: { 
      disabled, 
      selected,
      ...(variant === 'expandable' ? { expanded: isExpanded } : {})
    },
    testID
  };
  
  // Render appropriate container based on variant
  if (variant === 'interactive') {
    return (
      <TouchableWithoutFeedback
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        {...accessibilityProps}
      >
        <InteractiveListItemContainer
          {...commonProps}
          style={[{ transform: [{ scale: scaleAnim }] }, style]}
        >
          {content}
        </InteractiveListItemContainer>
      </TouchableWithoutFeedback>
    );
  } else if (variant === 'expandable') {
    return (
      <ExpandableListItemContainer {...commonProps} style={style}>
        <TouchableWithoutFeedback
          onPress={handlePress}
          disabled={disabled}
          {...accessibilityProps}
        >
          <View>
            {content}
          </View>
        </TouchableWithoutFeedback>
        
        {isExpanded && expandedContent && (
          <ExpandedContent>
            {expandedContent}
          </ExpandedContent>
        )}
      </ExpandableListItemContainer>
    );
  } else {
    // Standard list item
    if (onPress) {
      return (
        <TouchableWithoutFeedback
          onPress={handlePress}
          disabled={disabled}
          {...accessibilityProps}
        >
          <ListItemContainer {...commonProps} style={style}>
            {content}
          </ListItemContainer>
        </TouchableWithoutFeedback>
      );
    } else {
      return (
        <ListItemContainer 
          {...commonProps}
          {...accessibilityProps}
          style={style}
        >
          {content}
        </ListItemContainer>
      );
    }
  }
};

export default ListItem;
export { ListItemProps };