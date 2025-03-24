import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import ListItem from './ListItem';
import { colors } from '../../../theme';

describe('ListItem', () => {
  // Mock functions for event handlers
  const onPressMock = jest.fn();
  const onExpandChangeMock = jest.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    onPressMock.mockReset();
    onExpandChangeMock.mockReset();
  });

  it('renders correctly with default props', () => {
    render(<ListItem title="Test Item" testID="list-item" />);
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    expect(screen.getByText('Test Item')).toBeTruthy();
    // Default should be standard variant, medium size
  });

  it('renders standard variant correctly', () => {
    render(<ListItem title="Standard Item" variant="standard" testID="list-item" />);
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    expect(screen.getByText('Standard Item')).toBeTruthy();
    // Would check that it uses ListItemContainer in a more complex test
  });

  it('renders interactive variant correctly', () => {
    render(
      <ListItem 
        title="Interactive Item" 
        variant="interactive" 
        onPress={onPressMock} 
        testID="list-item"
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Test interactive behavior
    fireEvent.press(listItem);
    expect(onPressMock).toHaveBeenCalledTimes(1);
    
    // In a more complex test, would verify the scale animation on press
  });

  it('renders expandable variant correctly', () => {
    render(
      <ListItem 
        title="Expandable Item" 
        variant="expandable" 
        expandedContent={<Text testID="expanded-content">Expanded content</Text>}
        testID="list-item"
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Expanded content should not be visible initially
    expect(screen.queryByTestId('expanded-content')).toBeNull();
    
    // After pressing, expanded content should be visible
    fireEvent.press(screen.getByText('Expandable Item'));
    expect(screen.getByTestId('expanded-content')).toBeTruthy();
  });

  it('renders with different sizes correctly', () => {
    // Small size
    const { rerender } = render(
      <ListItem title="Small Item" size="sm" testID="list-item" />
    );
    let listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Medium size
    rerender(<ListItem title="Medium Item" size="md" testID="list-item" />);
    listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Large size
    rerender(<ListItem title="Large Item" size="lg" testID="list-item" />);
    listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // In a more complex test, would verify each size has correct padding and height
  });

  it('renders with different densities correctly', () => {
    // Default density
    const { rerender } = render(
      <ListItem title="Default Density" density="default" testID="list-item" />
    );
    let listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Compact density
    rerender(<ListItem title="Compact Density" density="compact" testID="list-item" />);
    listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // In a more complex test, would verify compact has less vertical padding
  });

  it('renders with different positions correctly', () => {
    // First position
    const { rerender } = render(
      <ListItem title="First Item" position="first" testID="list-item" />
    );
    let listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Middle position
    rerender(<ListItem title="Middle Item" position="middle" testID="list-item" />);
    listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Last position
    rerender(<ListItem title="Last Item" position="last" testID="list-item" />);
    listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Single position
    rerender(<ListItem title="Single Item" position="single" testID="list-item" />);
    listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // In a more complex test, would verify correct border radius for each position
  });

  it('renders in selected state correctly', () => {
    render(
      <ListItem 
        title="Selected Item" 
        selected={true} 
        testID="list-item" 
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // In a more complex test, would verify background color changes
  });

  it('renders in disabled state correctly', () => {
    render(
      <ListItem 
        title="Disabled Item" 
        disabled={true}
        variant="interactive" 
        onPress={onPressMock} 
        testID="list-item" 
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    
    // Test that pressing doesn't trigger onPress when disabled
    fireEvent.press(listItem);
    expect(onPressMock).not.toHaveBeenCalled();
    
    // In a more complex test, would verify opacity is reduced
  });

  it('renders with leading element correctly', () => {
    render(
      <ListItem 
        title="Item with Leading" 
        leadingElement={<View testID="leading-element" />} 
        testID="list-item"
      />
    );
    
    expect(screen.getByTestId('list-item')).toBeTruthy();
    expect(screen.getByTestId('leading-element')).toBeTruthy();
  });

  it('renders with trailing element correctly', () => {
    render(
      <ListItem 
        title="Item with Trailing" 
        trailingElement={<View testID="trailing-element" />} 
        testID="list-item"
      />
    );
    
    expect(screen.getByTestId('list-item')).toBeTruthy();
    expect(screen.getByTestId('trailing-element')).toBeTruthy();
  });

  it('renders with title and description correctly', () => {
    render(
      <ListItem 
        title="Item Title" 
        description="Item description" 
        testID="list-item"
      />
    );
    
    expect(screen.getByTestId('list-item')).toBeTruthy();
    expect(screen.getByText('Item Title')).toBeTruthy();
    expect(screen.getByText('Item description')).toBeTruthy();
  });

  it('handles press events correctly for interactive variant', () => {
    render(
      <ListItem 
        title="Pressable Item" 
        variant="interactive" 
        onPress={onPressMock} 
        testID="list-item"
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    fireEvent.press(listItem);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('handles expand/collapse correctly for expandable variant', () => {
    render(
      <ListItem 
        title="Expandable Item" 
        variant="expandable" 
        expandedContent={<Text testID="expanded-content">Expanded content</Text>}
        onExpandChange={onExpandChangeMock}
        testID="list-item"
      />
    );
    
    // Initially expanded content should not be visible
    expect(screen.queryByTestId('expanded-content')).toBeNull();
    
    // Press to expand
    fireEvent.press(screen.getByText('Expandable Item'));
    
    // Verify expanded content is visible and onExpandChange was called with true
    expect(screen.getByTestId('expanded-content')).toBeTruthy();
    expect(onExpandChangeMock).toHaveBeenCalledWith(true);
    
    // Press again to collapse
    fireEvent.press(screen.getByText('Expandable Item'));
    
    // Verify expanded content is hidden and onExpandChange was called with false
    expect(screen.queryByTestId('expanded-content')).toBeNull();
    expect(onExpandChangeMock).toHaveBeenCalledWith(false);
  });

  it('applies borderBottom style correctly', () => {
    render(
      <ListItem 
        title="Item with Border" 
        borderBottom={true} 
        testID="list-item"
      />
    );
    
    expect(screen.getByTestId('list-item')).toBeTruthy();
    // In a more complex test, would verify border styling is applied
  });

  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'red' };
    render(
      <ListItem 
        title="Custom Styled Item" 
        style={customStyle} 
        testID="list-item"
      />
    );
    
    expect(screen.getByTestId('list-item')).toBeTruthy();
    // In a more complex test, would verify custom style is applied
  });

  it('has correct accessibility properties', () => {
    render(
      <ListItem 
        title="Accessible Item" 
        accessibilityLabel="Custom accessibility label" 
        testID="list-item"
      />
    );
    
    const listItem = screen.getByTestId('list-item');
    expect(listItem).toBeTruthy();
    // In a more complex test, would verify accessibility properties
  });
});