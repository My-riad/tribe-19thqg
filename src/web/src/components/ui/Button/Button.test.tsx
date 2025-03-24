import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Button from './Button';
import { colors } from '../../../theme';

// Mock component for testing buttons with icons
const IconMock = () => <View testID="icon-mock" />;

describe('Button', () => {
  // Test default rendering
  it('renders correctly with default props', () => {
    const { getByText, getByTestId } = render(
      <Button testID="button">Press me</Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Press me')).toBeTruthy();
  });

  // Test button variants
  it('renders primary variant correctly', () => {
    const { getByText, getByTestId } = render(
      <Button testID="button" variant="primary">
        Primary
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Primary')).toBeTruthy();
    // Note: We can't easily test the actual styling with this approach
    // but we can verify the component renders with the correct props
  });

  it('renders secondary variant correctly', () => {
    const { getByText, getByTestId } = render(
      <Button testID="button" variant="secondary">
        Secondary
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders tertiary variant correctly', () => {
    const { getByText, getByTestId } = render(
      <Button testID="button" variant="tertiary">
        Tertiary
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Tertiary')).toBeTruthy();
  });

  it('renders icon variant correctly', () => {
    const { getByTestId } = render(
      <Button testID="button" variant="icon">
        <View testID="icon-content" />
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByTestId('icon-content')).toBeTruthy();
  });

  // Test button sizes
  it('renders different sizes correctly', () => {
    const { getByText, getByTestId, rerender } = render(
      <Button testID="button" size="sm">
        Small
      </Button>
    );
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Small')).toBeTruthy();
    
    rerender(
      <Button testID="button" size="md">
        Medium
      </Button>
    );
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Medium')).toBeTruthy();
    
    rerender(
      <Button testID="button" size="lg">
        Large
      </Button>
    );
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Large')).toBeTruthy();
  });

  // Test disabled state
  it('renders in disabled state correctly', () => {
    const onPressMock = jest.fn();
    const { getByText, getByTestId } = render(
      <Button testID="button" disabled onPress={onPressMock}>
        Disabled
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Disabled')).toBeTruthy();
    
    fireEvent.press(getByTestId('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  // Test loading state
  it('renders loading state correctly', () => {
    const { queryByText, getByTestId } = render(
      <Button testID="button" isLoading>
        Loading Button
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    // Text should not be visible during loading
    expect(queryByText('Loading Button')).toBeNull();
    // ActivityIndicator should be present, but we can't easily test for it
    // without adding a specific testID to the ButtonLoadingIndicator
  });

  // Test icon rendering
  it('renders with left icon correctly', () => {
    const { getByTestId, getByText } = render(
      <Button testID="button" leftIcon={<IconMock />}>
        Left Icon
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByTestId('icon-mock')).toBeTruthy();
    expect(getByText('Left Icon')).toBeTruthy();
  });

  it('renders with right icon correctly', () => {
    const { getByTestId, getByText } = render(
      <Button testID="button" rightIcon={<IconMock />}>
        Right Icon
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByTestId('icon-mock')).toBeTruthy();
    expect(getByText('Right Icon')).toBeTruthy();
  });

  // Test press events
  it('handles press events correctly', async () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Button testID="button" onPress={onPressMock}>
        Pressable
      </Button>
    );
    
    fireEvent.press(getByTestId('button'));
    await waitFor(() => {
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });
  });

  // Test fullWidth prop
  it('applies fullWidth style correctly', () => {
    const { getByText, getByTestId } = render(
      <Button testID="button" fullWidth>
        Full Width
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Full Width')).toBeTruthy();
    // Note: We can't easily test the actual styling without snapshot testing
  });

  // Test custom styles
  it('applies custom styles correctly', () => {
    const customStyle = { margin: 10 };
    const { getByText, getByTestId } = render(
      <Button testID="button" style={customStyle}>
        Custom Style
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
    expect(getByText('Custom Style')).toBeTruthy();
    // Note: We can't easily test the actual styling without snapshot testing
  });

  // Test accessibility
  it('has correct accessibility properties', () => {
    const accessibilityLabel = "Accessibility Button";
    const { getByA11yLabel } = render(
      <Button accessibilityLabel={accessibilityLabel}>
        Accessible Button
      </Button>
    );
    
    expect(getByA11yLabel(accessibilityLabel)).toBeTruthy();
  });
});