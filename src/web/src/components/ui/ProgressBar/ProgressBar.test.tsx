import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Animated, Easing } from 'react-native';
import ProgressBar from './ProgressBar';

// Mock the native animation helper to prevent warnings during tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  default: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// Mock Animated and Easing for testing animation behavior
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Animated: {
      ...rn.Animated,
      Value: jest.fn((value) => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          __getValue: jest.fn(() => `${value * 100}%`),
        })),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
    },
    Easing: {
      ...rn.Easing,
      inOut: jest.fn(() => 'easingFunction'),
      ease: 'ease',
    },
  };
});

describe('ProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId } = render(<ProgressBar progress={0.5} testID="progress-bar" />);
    expect(getByTestId('progress-bar')).toBeDefined();
    
    // Check that Animated.Value was initialized with the correct progress value
    expect(Animated.Value).toHaveBeenCalledWith(0.5);
    
    // Verify animation is applied by default
    expect(Animated.timing).toHaveBeenCalled();
  });

  it('renders with custom progress value', () => {
    render(<ProgressBar progress={0.75} testID="progress-bar" />);
    
    // Check that Animated.Value was initialized with the provided progress value
    expect(Animated.Value).toHaveBeenCalledWith(0.75);
  });

  it('renders with different variants', () => {
    const variants: Array<'default' | 'success' | 'warning' | 'error'> = [
      'default', 'success', 'warning', 'error'
    ];
    
    variants.forEach(variant => {
      const { getByTestId } = render(
        <ProgressBar progress={0.5} variant={variant} testID={`progress-bar-${variant}`} />
      );
      expect(getByTestId(`progress-bar-${variant}`)).toBeDefined();
    });
  });

  it('renders with different sizes', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      const { getByTestId } = render(
        <ProgressBar progress={0.5} size={size} testID={`progress-bar-${size}`} />
      );
      expect(getByTestId(`progress-bar-${size}`)).toBeDefined();
    });
  });

  it('applies animation when animated prop is true', () => {
    const { rerender } = render(<ProgressBar progress={0.5} animated={true} />);
    
    // Check that easing function is configured correctly
    expect(Easing.inOut).toHaveBeenCalledWith(Easing.ease);
    
    // Check that animation is configured correctly
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        toValue: 0.5,
        duration: 300, // default duration
        easing: 'easingFunction',
        useNativeDriver: false,
      })
    );
    
    // Update progress and verify animation is updated
    rerender(<ProgressBar progress={0.7} animated={true} />);
    expect(Animated.timing).toHaveBeenCalledTimes(2);
    expect(Animated.timing).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({
        toValue: 0.7,
        duration: 300,
        easing: 'easingFunction',
        useNativeDriver: false,
      })
    );
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <ProgressBar 
        progress={0.5} 
        accessibilityLabel="Loading progress" 
        testID="progress-bar"
      />
    );
    
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.accessibilityLabel).toBe('Loading progress');
    expect(progressBar.props.accessibilityRole).toBe('progressbar');
    expect(progressBar.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 50,
    });
  });

  it('applies custom styles when provided', () => {
    const customStyle = { marginTop: 10, backgroundColor: 'transparent' };
    const { getByTestId } = render(
      <ProgressBar progress={0.5} style={customStyle} testID="progress-bar" />
    );
    
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.style).toMatchObject(customStyle);
  });

  it('clamps progress values between 0 and 1', () => {
    // Test with value > 1
    render(<ProgressBar progress={1.5} />);
    expect(Animated.Value).toHaveBeenCalledWith(1);
    
    jest.clearAllMocks();
    
    // Test with value < 0
    render(<ProgressBar progress={-0.5} />);
    expect(Animated.Value).toHaveBeenCalledWith(0);
  });

  it('respects custom animation duration', () => {
    render(<ProgressBar progress={0.5} animated={true} animationDuration={500} />);
    
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        toValue: 0.5,
        duration: 500, // custom duration
        useNativeDriver: false,
      })
    );
  });
});