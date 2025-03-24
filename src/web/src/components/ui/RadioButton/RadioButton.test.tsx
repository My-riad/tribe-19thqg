import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RadioButton from './RadioButton';
import { theme } from '../../../theme';

describe('RadioButton', () => {
  // Create reusable mock function for onPress
  let onPressMock: jest.Mock;
  
  beforeEach(() => {
    onPressMock = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId } = render(<RadioButton testID="radio-button" />);
    const radioButton = getByTestId('radio-button');
    
    expect(radioButton).toBeTruthy();
    expect(radioButton.props.accessibilityState.checked).toBe(false);
    expect(radioButton.props.accessibilityState.disabled).toBe(false);
  });
  
  it('renders in selected state correctly', () => {
    const { getByTestId } = render(
      <RadioButton testID="radio-button" selected={true} />
    );
    const radioButton = getByTestId('radio-button');
    
    expect(radioButton.props.accessibilityState.checked).toBe(true);
    // The inner circle should be visible when selected
    // but we can't easily test this directly with RNTL
  });
  
  it('renders in disabled state correctly', () => {
    const { getByTestId } = render(
      <RadioButton testID="radio-button" disabled={true} onPress={onPressMock} />
    );
    const radioButton = getByTestId('radio-button');
    
    expect(radioButton.props.accessibilityState.disabled).toBe(true);
    
    // A disabled radio button should have reduced opacity
    // and shouldn't respond to press events
    fireEvent.press(radioButton);
    expect(onPressMock).not.toHaveBeenCalled();
  });
  
  it('renders in error state correctly', () => {
    const { getByTestId } = render(
      <RadioButton testID="radio-button" error={true} />
    );
    
    // Error state should change border color to theme.colors.error.main
    // but we can't easily test styles directly with RNTL
    expect(getByTestId('radio-button')).toBeTruthy();
  });
  
  it('renders different sizes correctly', () => {
    const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      const { getByTestId, unmount } = render(
        <RadioButton testID="radio-button" size={size} />
      );
      expect(getByTestId('radio-button')).toBeTruthy();
      unmount();
    });
  });
  
  it('renders with label correctly', () => {
    const label = 'Test Label';
    const { getByText } = render(
      <RadioButton label={label} />
    );
    
    const labelElement = getByText(label);
    expect(labelElement).toBeTruthy();
    
    // Label should have the correct text color, but again,
    // we can't easily test styles directly
  });
  
  it('handles press events correctly', () => {
    const testValue = 'test-value';
    
    const { getByTestId } = render(
      <RadioButton 
        testID="radio-button" 
        onPress={onPressMock} 
        value={testValue} 
      />
    );
    
    fireEvent.press(getByTestId('radio-button'));
    
    expect(onPressMock).toHaveBeenCalledWith(testValue);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onPress when disabled', () => {
    const { getByTestId } = render(
      <RadioButton 
        testID="radio-button" 
        onPress={onPressMock} 
        disabled={true} 
      />
    );
    
    fireEvent.press(getByTestId('radio-button'));
    
    expect(onPressMock).not.toHaveBeenCalled();
  });
  
  it('animates inner circle when selected', async () => {
    const { getByTestId, rerender } = render(
      <RadioButton testID="radio-button" selected={false} />
    );
    
    expect(getByTestId('radio-button').props.accessibilityState.checked).toBe(false);
    
    rerender(<RadioButton testID="radio-button" selected={true} />);
    
    // Wait for the animation to potentially complete
    await waitFor(() => {
      expect(getByTestId('radio-button').props.accessibilityState.checked).toBe(true);
    });
    
    // Note: We can't directly test the animation effects (opacity and scale)
    // as they are implementation details not easily accessible with RNTL
  });
  
  it('has correct accessibility properties', () => {
    const accessibilityLabel = 'Custom Accessibility Label';
    const { getByTestId } = render(
      <RadioButton 
        testID="radio-button" 
        accessibilityLabel={accessibilityLabel} 
      />
    );
    
    const radioButton = getByTestId('radio-button');
    
    expect(radioButton.props.accessibilityRole).toBe('radio');
    expect(radioButton.props.accessibilityLabel).toBe(accessibilityLabel);
    expect(radioButton.props.accessibilityState).toEqual({
      checked: false, 
      disabled: false
    });
  });
  
  it('uses label as accessibility label when accessibilityLabel is not provided', () => {
    const label = 'Test Label';
    const { getByTestId } = render(
      <RadioButton testID="radio-button" label={label} />
    );
    
    expect(getByTestId('radio-button').props.accessibilityLabel).toBe(label);
  });
});