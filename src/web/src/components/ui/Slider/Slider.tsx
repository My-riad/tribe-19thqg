import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, PanResponder, View, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { colors, spacing } from '../../../theme';
import {
  SliderContainer,
  SliderTrack,
  SliderFill,
  SliderThumb,
  SliderLabel,
  SliderMarker,
} from './Slider.styles';

// Define types
export type SliderVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
export type SliderSize = 'sm' | 'md' | 'lg';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  variant?: SliderVariant;
  size?: SliderSize;
  disabled?: boolean;
  showMarkers?: boolean;
  markerCount?: number;
  showLabels?: boolean;
  formatLabel?: (value: number) => string;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Convert a value to a position in pixels
 */
const valueToPosition = (value: number, min: number, max: number, width: number): number => {
  const range = max - min;
  const percentage = (value - min) / range;
  return percentage * width;
};

/**
 * Convert a position in pixels to a value
 */
const positionToValue = (position: number, min: number, max: number, width: number, step?: number): number => {
  const range = max - min;
  const percentage = Math.max(0, Math.min(1, position / width));
  let value = percentage * range + min;
  
  // Apply step if provided
  if (step) {
    value = Math.round(value / step) * step;
  }
  
  // Ensure the value is within bounds
  return Math.max(min, Math.min(max, value));
};

/**
 * Generate marker positions based on marker count
 */
const getMarkerPositions = (count: number, width: number): number[] => {
  if (width === 0 || count <= 1) return [];
  
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push((i / (count - 1)) * width);
  }
  return positions;
};

/**
 * Default function for formatting slider labels
 */
const formatDefaultLabel = (value: number): string => {
  return value.toFixed(0);
};

/**
 * A customizable slider component that allows users to select values within a range
 */
const Slider = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  variant = 'default',
  size = 'md',
  disabled = false,
  showMarkers = false,
  markerCount = 5,
  showLabels = false,
  formatLabel = formatDefaultLabel,
  accessibilityLabel = 'Slider',
  testID,
}: SliderProps): JSX.Element => {
  // Internal state for tracking the value and dragging state
  const [internalValue, setInternalValue] = useState<number>(value);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Track width and position
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const [trackLayout, setTrackLayout] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Animated value for the thumb position
  const thumbPosition = useRef(new Animated.Value(0)).current;
  
  // Animated value for showing/hiding the current value label
  const labelOpacity = useRef(new Animated.Value(0)).current;
  
  // Update internal value when the prop changes (but not during dragging)
  useEffect(() => {
    if (!isDragging) {
      setInternalValue(value);
    }
  }, [value, isDragging]);
  
  // Update thumb position when internal value changes
  useEffect(() => {
    if (trackWidth > 0) {
      const position = valueToPosition(internalValue, min, max, trackWidth);
      thumbPosition.setValue(position);
    }
  }, [internalValue, min, max, thumbPosition, trackWidth]);
  
  // Show/hide value label when dragging
  useEffect(() => {
    Animated.timing(labelOpacity, {
      toValue: isDragging ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isDragging, labelOpacity]);
  
  // Call onChange when internal value changes
  useEffect(() => {
    if (internalValue !== value && onChange) {
      onChange(internalValue);
    }
  }, [internalValue, value, onChange]);
  
  // Handle layout change to get slider width and position
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, x, y } = event.nativeEvent.layout;
    setTrackWidth(width);
    setTrackLayout({ x, y });
    
    // Update thumb position based on new width
    const position = valueToPosition(internalValue, min, max, width);
    thumbPosition.setValue(position);
  }, [internalValue, min, max, thumbPosition]);
  
  // Update value based on position
  const updateValueFromPosition = useCallback((positionX: number) => {
    if (disabled || trackWidth === 0) return;
    
    // Ensure position is within track bounds
    const boundedPosition = Math.max(0, Math.min(trackWidth, positionX));
    
    // Convert position to value
    const newValue = positionToValue(boundedPosition, min, max, trackWidth, step);
    
    if (newValue !== internalValue) {
      setInternalValue(newValue);
    }
  }, [disabled, internalValue, max, min, step, trackWidth]);
  
  // Handle track press for jumping to position
  const handleTrackPress = useCallback((event: GestureResponderEvent) => {
    if (disabled) return;
    
    const touchX = event.nativeEvent.pageX - trackLayout.x;
    updateValueFromPosition(touchX);
  }, [disabled, trackLayout.x, updateValueFromPosition]);
  
  // Create pan responder for handling drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      
      onPanResponderMove: (evt) => {
        if (disabled || trackWidth === 0) return;
        
        const touchX = evt.nativeEvent.pageX - trackLayout.x;
        updateValueFromPosition(touchX);
      },
      
      onPanResponderRelease: () => {
        setIsDragging(false);
      },
      
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;
  
  // Accessibility increment/decrement handlers
  const incrementValue = useCallback(() => {
    if (disabled) return;
    const newValue = Math.min(max, internalValue + step);
    setInternalValue(newValue);
  }, [disabled, internalValue, max, step]);
  
  const decrementValue = useCallback(() => {
    if (disabled) return;
    const newValue = Math.max(min, internalValue - step);
    setInternalValue(newValue);
  }, [disabled, internalValue, min, step]);
  
  // Function to render markers
  const renderMarkers = () => {
    if (!showMarkers || trackWidth === 0) return null;
    
    const positions = getMarkerPositions(markerCount, trackWidth);
    
    return positions.map((position, index) => (
      <SliderMarker
        key={`marker-${index}`}
        style={{ left: position }}
        variant={variant}
        size={size}
        disabled={disabled}
      />
    ));
  };
  
  // Interpolate label position from thumb position
  const labelPosition = thumbPosition.interpolate({
    inputRange: [0, trackWidth || 1],
    outputRange: [0, trackWidth || 1],
    extrapolate: 'clamp',
  });
  
  return (
    <SliderContainer
      disabled={disabled}
      testID={testID}
      accessibilityLabel={`${accessibilityLabel}, ${formatLabel(internalValue)}`}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min,
        max,
        now: internalValue,
        text: formatLabel(internalValue),
      }}
      accessibilityActions={[
        { name: 'increment', label: 'Increase' },
        { name: 'decrement', label: 'Decrease' },
      ]}
      onAccessibilityAction={({ nativeEvent }) => {
        switch (nativeEvent.actionName) {
          case 'increment':
            incrementValue();
            break;
          case 'decrement':
            decrementValue();
            break;
        }
      }}
      accessibilityState={{
        disabled,
        busy: isDragging,
      }}
      accessibilityHint={`Select a value between ${formatLabel(min)} and ${formatLabel(max)}`}
    >
      {/* Slider track */}
      <SliderTrack
        variant={variant}
        size={size}
        disabled={disabled}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => !disabled}
        onResponderGrant={handleTrackPress}
      >
        {/* Filled portion of the track */}
        <SliderFill
          variant={variant}
          size={size}
          disabled={disabled}
          style={{ width: thumbPosition }}
        />
        
        {/* Markers */}
        {renderMarkers()}
        
        {/* Thumb */}
        <SliderThumb
          variant={variant}
          size={size}
          disabled={disabled}
          style={{ transform: [{ translateX: thumbPosition }] }}
          {...panResponder.panHandlers}
          accessible={false} // Accessibility is handled by the container
        />
        
        {/* Current value label - positioned directly above thumb */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: -30, // Position above the thumb
            opacity: labelOpacity,
            transform: [
              { translateX: labelPosition },
              { translateX: -20 }, // Center the label (half of label width)
            ],
          }}
          pointerEvents="none"
        >
          <SliderLabel
            variant={variant}
            size={size}
            disabled={disabled}
            style={{
              width: 40, // Fixed width for the label
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent background
              paddingHorizontal: spacing.xs,
              paddingVertical: spacing.xs / 2,
              borderRadius: 4,
            }}
          >
            {formatLabel(internalValue)}
          </SliderLabel>
        </Animated.View>
      </SliderTrack>
      
      {/* Min/Max Labels */}
      {showLabels && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
          <SliderLabel variant={variant} size={size} disabled={disabled} align="left">
            {formatLabel(min)}
          </SliderLabel>
          
          <SliderLabel variant={variant} size={size} disabled={disabled} align="right">
            {formatLabel(max)}
          </SliderLabel>
        </View>
      )}
    </SliderContainer>
  );
};

export default Slider;