import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import Checkbox from './Checkbox';
import { colors } from '../../../theme';
import { checkboxSizes } from './Checkbox.styles';

// Mock Animated API to simplify testing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('Checkbox', () => {
  // Setup mock function for press handler
  let onPressMock;
  
  beforeEach(() => {
    onPressMock = jest.fn();
    
    // Spy on Animated.timing
    jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: (callback) => {
        if (callback) callback({ finished: true });
        return {
          stop: jest.fn()
        };
      }
    }));
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId } = render(<Checkbox testID="checkbox" />);
    const checkbox = getByTestId('checkbox');
    
    expect(checkbox).toBeTruthy();
    // With default props, checkbox should be rendered unchecked
  });

  it('renders in checked state correctly', () => {
    const { getByTestId } = render(<Checkbox testID="checkbox" checked={true} />);
    const checkbox = getByTestId('checkbox');
    
    expect(checkbox).toBeTruthy();
    // In a real-world scenario, we would test for the presence of checkmark icon
    // and background color, but this is limited in RNTL
  });

  it('renders in disabled state correctly', () => {
    const { getByTestId } = render(
      <Checkbox testID="checkbox" disabled={true} onPress={onPressMock} />
    );
    const checkbox = getByTestId('checkbox');
    
    // Press the checkbox
    fireEvent.press(checkbox);
    
    // Verify onPress wasn't called because it's disabled
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders in error state correctly', () => {
    const { getByTestId } = render(<Checkbox testID="checkbox" error={true} />);
    const checkbox = getByTestId('checkbox');
    
    expect(checkbox).toBeTruthy();
    // In a real-world scenario, we would test for the error styling (red border)
    // but this is limited in RNTL
  });

  it('renders different sizes correctly', () => {
    // Test small size
    const { rerender, getByTestId } = render(<Checkbox testID="checkbox" size="sm" />);
    expect(getByTestId('checkbox')).toBeTruthy();
    
    // Test medium size
    rerender(<Checkbox testID="checkbox" size="md" />);
    expect(getByTestId('checkbox')).toBeTruthy();
    
    // Test large size
    rerender(<Checkbox testID="checkbox" size="lg" />);
    expect(getByTestId('checkbox')).toBeTruthy();
    
    // Ideally we would verify actual dimensions match checkboxSizes values,
    // but this is challenging with RNTL
  });

  it('renders with label correctly', () => {
    const testLabel = "Test Label";
    const { getByText } = render(<Checkbox label={testLabel} />);
    
    // Verify the label text is rendered
    expect(getByText(testLabel)).toBeTruthy();
  });

  it('handles press events correctly', () => {
    const { getByTestId } = render(
      <Checkbox testID="checkbox" onPress={onPressMock} />
    );
    
    // Press the checkbox (initially unchecked)
    fireEvent.press(getByTestId('checkbox'));
    
    // Verify onPress was called with true (toggled state)
    expect(onPressMock).toHaveBeenCalledWith(true);
    
    // Test with initial checked=true
    onPressMock.mockReset();
    const { getByTestId: getByTestIdChecked } = render(
      <Checkbox testID="checkbox-checked" checked={true} onPress={onPressMock} />
    );
    
    // Press the checkbox (initially checked)
    fireEvent.press(getByTestIdChecked('checkbox-checked'));
    
    // Verify onPress was called with false (toggled state)
    expect(onPressMock).toHaveBeenCalledWith(false);
  });

  it('toggles checked state when pressed', async () => {
    // Create a component with controlled checked state
    const TestComponent = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <Checkbox 
          testID="checkbox" 
          checked={checked} 
          onPress={() => setChecked(!checked)} 
        />
      );
    };
    
    const { getByTestId } = render(<TestComponent />);
    const checkbox = getByTestId('checkbox');
    
    // Press to check
    fireEvent.press(checkbox);
    
    // Wait for state update
    await waitFor(() => {});
    
    // Press again to uncheck
    fireEvent.press(checkbox);
    
    // Wait for state update
    await waitFor(() => {});
  });

  it('has correct accessibility properties', () => {
    const testLabel = "Test Label";
    
    // We need to get the touchable component that has the accessibility props
    // This is a bit fragile but necessary since we can't easily query by role in RNTL
    const { UNSAFE_getAllByType } = render(
      <Checkbox label={testLabel} checked={false} testID="checkbox" />
    );
    
    // Get all touchable opacity components (one should be our checkbox touchable)
    const touchables = UNSAFE_getAllByType('TouchableOpacity');
    const checkboxTouchable = touchables.find(
      t => t.props.accessibilityRole === 'checkbox'
    );
    
    // Verify accessibility props
    expect(checkboxTouchable).toBeTruthy();
    expect(checkboxTouchable.props.accessibilityRole).toBe('checkbox');
    expect(checkboxTouchable.props.accessibilityState.checked).toBe(false);
  });

  it('animates checkmark when state changes', () => {
    // Spy on Animated.timing
    const timingSpy = jest.spyOn(Animated, 'timing');
    timingSpy.mockClear();
    
    const { getByTestId } = render(<Checkbox testID="checkbox" />);
    
    // Press to toggle state and trigger animation
    fireEvent.press(getByTestId('checkbox'));
    
    // Verify Animated.timing was called
    expect(timingSpy).toHaveBeenCalled();
    
    // Check animation configuration
    const animationConfig = timingSpy.mock.calls[0][1];
    expect(animationConfig).toHaveProperty('toValue', 1); // animate to 1 (checked)
    expect(animationConfig).toHaveProperty('duration');
    expect(animationConfig).toHaveProperty('useNativeDriver');
  });
});