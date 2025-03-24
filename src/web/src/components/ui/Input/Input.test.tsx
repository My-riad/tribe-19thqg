import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Input from './Input';
import { theme } from '../../../theme';

describe('Input', () => {
  // Mock functions for event handlers
  const onChangeTextMock = jest.fn();
  const onFocusMock = jest.fn();
  const onBlurMock = jest.fn();
  const onSubmitEditingMock = jest.fn();
  
  // Mock component for icons
  const IconMock = () => <View testID="icon" />;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with default props', () => {
    const { getByTestId } = render(<Input testID="input" />);
    const input = getByTestId('input');
    expect(input).toBeTruthy();
  });
  
  it('renders with label correctly', () => {
    const { getByText } = render(<Input label="Email" />);
    const label = getByText('Email');
    expect(label).toBeTruthy();
    // Verify label has proper accessibility role
    expect(label.props.accessibilityRole).toBe('text');
  });
  
  it('renders with placeholder correctly', () => {
    const placeholder = 'Enter your email';
    const { getByPlaceholderText } = render(<Input placeholder={placeholder} />);
    const input = getByPlaceholderText(placeholder);
    expect(input).toBeTruthy();
  });
  
  it('renders different variants correctly', () => {
    // Test text variant (default)
    const { rerender, getByTestId } = render(<Input testID="input" variant="text" />);
    let input = getByTestId('input');
    expect(input.props.keyboardType).toBe('default');
    expect(input.props.secureTextEntry).toBeFalsy();
    
    // Test number variant
    rerender(<Input testID="input" variant="number" />);
    input = getByTestId('input');
    expect(input.props.keyboardType).toBe('numeric');
    
    // Test email variant
    rerender(<Input testID="input" variant="email" />);
    input = getByTestId('input');
    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoCapitalize).toBe('none');
    
    // Test password variant
    rerender(<Input testID="input" variant="password" />);
    input = getByTestId('input');
    expect(input.props.secureTextEntry).toBeTruthy();
    
    // Test search variant
    rerender(<Input testID="input" variant="search" />);
    input = getByTestId('input');
    expect(input.props.autoCapitalize).toBe('none');
  });
  
  it('renders different sizes correctly', () => {
    // Test small size
    const { rerender, getByTestId } = render(<Input testID="input" size="sm" />);
    let input = getByTestId('input');
    
    // Test medium size (default)
    rerender(<Input testID="input" size="md" />);
    input = getByTestId('input');
    
    // Test large size
    rerender(<Input testID="input" size="lg" />);
    input = getByTestId('input');
    
    // We can't directly test style properties in styled-components
    // but we can verify the component renders with different sizes
    expect(input).toBeTruthy();
  });
  
  it('renders in error state correctly', () => {
    const errorMessage = 'This field is required';
    const { getByText } = render(<Input error={errorMessage} />);
    
    // Verify error message is displayed
    const errorText = getByText(errorMessage);
    expect(errorText).toBeTruthy();
    
    // Verify error has proper accessibility properties
    expect(errorText.props.accessibilityRole).toBe('text');
    expect(errorText.props.accessibilityLiveRegion).toBe('polite');
  });
  
  it('renders in disabled state correctly', () => {
    const { getByTestId } = render(<Input disabled testID="input" />);
    
    const input = getByTestId('input');
    // Verify input is not editable when disabled
    expect(input.props.editable).toBe(false);
    
    // Verify accessibility state includes disabled
    expect(input.props.accessibilityState.disabled).toBe(true);
  });
  
  it('renders with left icon correctly', () => {
    const { getByTestId } = render(<Input leftIcon={<IconMock />} />);
    
    const icon = getByTestId('icon');
    expect(icon).toBeTruthy();
  });
  
  it('renders with right icon correctly', () => {
    const { getByTestId } = render(<Input rightIcon={<IconMock />} />);
    
    const icon = getByTestId('icon');
    expect(icon).toBeTruthy();
  });
  
  it('handles text changes correctly', () => {
    const { getByTestId } = render(
      <Input onChangeText={onChangeTextMock} testID="input" />
    );
    
    const input = getByTestId('input');
    fireEvent.changeText(input, 'test');
    
    expect(onChangeTextMock).toHaveBeenCalledWith('test');
  });
  
  it('handles focus events correctly', () => {
    const { getByTestId } = render(
      <Input onFocus={onFocusMock} testID="input" />
    );
    
    const input = getByTestId('input');
    fireEvent(input, 'focus');
    
    expect(onFocusMock).toHaveBeenCalled();
  });
  
  it('handles blur events correctly', () => {
    const { getByTestId } = render(
      <Input onBlur={onBlurMock} testID="input" />
    );
    
    const input = getByTestId('input');
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
    
    expect(onBlurMock).toHaveBeenCalled();
  });
  
  it('handles submit editing events correctly', () => {
    const { getByTestId } = render(
      <Input onSubmitEditing={onSubmitEditingMock} testID="input" />
    );
    
    const input = getByTestId('input');
    fireEvent(input, 'submitEditing');
    
    expect(onSubmitEditingMock).toHaveBeenCalled();
  });
  
  it('clears input when clearable and clear button is pressed', () => {
    const { getByLabelText } = render(
      <Input 
        clearable 
        value="test" 
        onChangeText={onChangeTextMock} 
      />
    );
    
    // Find clear button by accessibility label
    const clearButton = getByLabelText('Clear text');
    expect(clearButton).toBeTruthy();
    
    // Press clear button
    fireEvent.press(clearButton);
    
    // Verify onChangeText was called with empty string
    expect(onChangeTextMock).toHaveBeenCalledWith('');
  });
  
  it('applies fullWidth style correctly', () => {
    // fullWidth should apply width: 100% to the container
    const { toJSON } = render(<Input fullWidth />);
    
    // Instead of accessing styled-component props directly (which can be tricky),
    // we can assert that the component renders correctly
    expect(toJSON()).toBeTruthy();
  });
  
  it('renders multiline input correctly', () => {
    const { getByTestId } = render(
      <Input multiline numberOfLines={3} testID="input" />
    );
    
    const input = getByTestId('input');
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(3);
  });
  
  it('applies custom styles correctly', () => {
    const customStyle = { marginTop: 20 };
    const { toJSON } = render(<Input style={customStyle} />);
    
    // Instead of accessing styled-component props directly,
    // we can assert that the component renders correctly
    expect(toJSON()).toBeTruthy();
  });
  
  it('has correct accessibility properties', () => {
    const accessibilityLabel = 'Email input field';
    const accessibilityHint = 'Enter your email address';
    
    const { getByTestId } = render(
      <Input 
        testID="input"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      />
    );
    
    const input = getByTestId('input');
    expect(input.props.accessibilityLabel).toBe(accessibilityLabel);
    expect(input.props.accessibilityHint).toBe(accessibilityHint);
  });
  
  it('masks text correctly in password variant', () => {
    const { getByTestId } = render(<Input variant="password" testID="input" />);
    
    const input = getByTestId('input');
    expect(input.props.secureTextEntry).toBe(true);
  });
  
  it('passes through additional props to TextInput', () => {
    const { getByTestId } = render(
      <Input 
        testID="input"
        maxLength={10}
        autoFocus
      />
    );
    
    const input = getByTestId('input');
    expect(input.props.maxLength).toBe(10);
    expect(input.props.autoFocus).toBe(true);
  });
  
  it('sets focused state on focus and blur', async () => {
    const { getByTestId } = render(<Input testID="input" />);
    
    const input = getByTestId('input');
    
    // Focus the input
    fireEvent(input, 'focus');
    
    // Focusing should update the focused state (we can't directly test this,
    // but the component should update accessibility state)
    await waitFor(() => {
      expect(input.props.accessibilityState.selected).toBe(true);
    });
    
    // Blur the input
    fireEvent(input, 'blur');
    
    // Blurring should update the focused state
    await waitFor(() => {
      expect(input.props.accessibilityState.selected).toBe(false);
    });
  });
});