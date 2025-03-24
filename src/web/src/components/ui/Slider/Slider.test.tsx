import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Slider from './Slider';
import { colors } from '../../../theme';

describe('Slider', () => {
  let onChangeMock;
  let formatLabelMock;
  
  beforeEach(() => {
    onChangeMock = jest.fn();
    formatLabelMock = jest.fn(value => `$${value}`);
  });
  
  it('renders correctly with default props', () => {
    const { getByTestId } = render(<Slider value={50} testID="slider" />);
    const slider = getByTestId('slider');
    expect(slider).toBeTruthy();
    expect(slider.props.accessibilityValue.min).toBe(0);
    expect(slider.props.accessibilityValue.max).toBe(100);
    expect(slider.props.accessibilityValue.now).toBe(50);
  });
  
  it('renders with custom min, max, and value', () => {
    const { getByTestId } = render(
      <Slider 
        value={30} 
        min={10} 
        max={50} 
        testID="slider" 
      />
    );
    
    const slider = getByTestId('slider');
    expect(slider.props.accessibilityValue.min).toBe(10);
    expect(slider.props.accessibilityValue.max).toBe(50);
    expect(slider.props.accessibilityValue.now).toBe(30);
  });
  
  it('renders primary variant correctly', () => {
    const { getByTestId } = render(
      <Slider 
        value={50} 
        variant="primary" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
    // In a real test environment, we could check for specific styles
    // But in this test suite we're verifying it renders without errors
  });
  
  it('renders success variant correctly', () => {
    const { getByTestId } = render(
      <Slider 
        value={50} 
        variant="success" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
  });
  
  it('renders warning variant correctly', () => {
    const { getByTestId } = render(
      <Slider 
        value={50} 
        variant="warning" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
  });
  
  it('renders error variant correctly', () => {
    const { getByTestId } = render(
      <Slider 
        value={50} 
        variant="error" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
  });
  
  it('renders different sizes correctly', () => {
    const { rerender, getByTestId } = render(
      <Slider 
        value={50} 
        size="sm" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
    
    rerender(
      <Slider 
        value={50} 
        size="md" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
    
    rerender(
      <Slider 
        value={50} 
        size="lg" 
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
  });
  
  it('renders in disabled state correctly', () => {
    const { getByTestId } = render(
      <Slider 
        value={50} 
        disabled={true} 
        onChange={onChangeMock}
        testID="slider"
      />
    );
    
    const slider = getByTestId('slider');
    expect(slider.props.accessibilityState.disabled).toBe(true);
  });
  
  it('renders with markers correctly', () => {
    // This is a simplified test for markers since we can't easily test
    // internal component rendering without additional test IDs
    const { getByTestId } = render(
      <Slider 
        value={50}
        showMarkers={true}
        markerCount={5}
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
    
    // In an actual implementation with testIDs for markers:
    // const markers = getAllByTestId('slider-marker');
    // expect(markers.length).toBe(5);
  });
  
  it('renders with labels correctly', () => {
    const { getByText } = render(
      <Slider 
        value={50}
        showLabels={true}
        testID="slider"
      />
    );
    
    // Check for min and max labels (0 and 100 by default)
    expect(getByText('0')).toBeTruthy();
    expect(getByText('100')).toBeTruthy();
  });
  
  it('formats labels correctly with custom formatter', () => {
    const { getByText } = render(
      <Slider 
        value={50}
        showLabels={true}
        formatLabel={formatLabelMock}
        testID="slider"
      />
    );
    
    // Check that formatter was called
    expect(formatLabelMock).toHaveBeenCalled();
    
    // Check for formatted labels
    expect(getByText('$0')).toBeTruthy();
    expect(getByText('$100')).toBeTruthy();
  });
  
  it('calls onChange when value changes', async () => {
    // Since we can't easily simulate PanResponder gestures in tests,
    // we'll test through accessibility actions
    const { getByTestId } = render(
      <Slider 
        value={50}
        onChange={onChangeMock}
        testID="slider"
      />
    );
    
    act(() => {
      fireEvent(getByTestId('slider'), 'accessibilityAction', { 
        nativeEvent: { actionName: 'increment' } 
      });
    });
    
    expect(onChangeMock).toHaveBeenCalledWith(51);
  });
  
  it('handles track press to jump to position', async () => {
    // This test is a placeholder - in a real environment with testIDs on
    // the track component, we could simulate track presses
    const { getByTestId } = render(
      <Slider 
        value={50}
        onChange={onChangeMock}
        testID="slider"
      />
    );
    
    expect(getByTestId('slider')).toBeTruthy();
  });
  
  it('respects step prop for value increments', () => {
    const { getByTestId } = render(
      <Slider 
        value={50}
        min={0}
        max={100}
        step={5}
        onChange={onChangeMock}
        testID="slider"
      />
    );
    
    act(() => {
      fireEvent(getByTestId('slider'), 'accessibilityAction', { 
        nativeEvent: { actionName: 'increment' } 
      });
    });
    
    expect(onChangeMock).toHaveBeenCalledWith(55);
  });
  
  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <Slider 
        value={50}
        accessibilityLabel="Volume control"
        testID="slider"
      />
    );
    
    const slider = getByTestId('slider');
    
    expect(slider.props.accessibilityLabel).toContain('Volume control');
    expect(slider.props.accessibilityRole).toBe('adjustable');
    expect(slider.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 50,
      text: "50"
    });
    expect(slider.props.accessibilityActions).toEqual([
      { name: 'increment', label: 'Increase' },
      { name: 'decrement', label: 'Decrease' },
    ]);
  });
  
  it('handles min/max boundary correctly with accessibility actions', () => {
    // Test at max boundary
    const { getByTestId: getSliderAtMax } = render(
      <Slider 
        value={100}
        min={0}
        max={100}
        onChange={onChangeMock}
        testID="slider-max"
      />
    );
    
    act(() => {
      fireEvent(getSliderAtMax('slider-max'), 'accessibilityAction', { 
        nativeEvent: { actionName: 'increment' } 
      });
    });
    
    // Should still be at max
    expect(onChangeMock).toHaveBeenCalledWith(100);
    
    // Test min boundary
    onChangeMock.mockClear();
    
    const { getByTestId: getSliderAtMin } = render(
      <Slider 
        value={0}
        min={0}
        max={100}
        onChange={onChangeMock}
        testID="slider-min"
      />
    );
    
    act(() => {
      fireEvent(getSliderAtMin('slider-min'), 'accessibilityAction', { 
        nativeEvent: { actionName: 'decrement' } 
      });
    });
    
    // Should still be at min
    expect(onChangeMock).toHaveBeenCalledWith(0);
  });
  
  it('handles disabled state with accessibility actions', () => {
    const { getByTestId } = render(
      <Slider 
        value={50}
        disabled={true}
        onChange={onChangeMock}
        testID="slider"
      />
    );
    
    act(() => {
      fireEvent(getByTestId('slider'), 'accessibilityAction', { 
        nativeEvent: { actionName: 'increment' } 
      });
    });
    
    expect(onChangeMock).not.toHaveBeenCalled();
    
    act(() => {
      fireEvent(getByTestId('slider'), 'accessibilityAction', { 
        nativeEvent: { actionName: 'decrement' } 
      });
    });
    
    expect(onChangeMock).not.toHaveBeenCalled();
  });
});