import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import Card from './Card';
import { theme } from '../../../theme';

describe('Card', () => {
  // Basic rendering tests
  it('renders correctly with default props', () => {
    const testId = 'test-card';
    render(<Card testID={testId}><Text>Card Content</Text></Card>);
    
    const card = screen.getByTestId(testId);
    expect(card).toBeTruthy();
    
    // Default variant should be standard
    // Default elevation should be low
    // Default size should be md
    expect(card.props.style).toMatchObject({
      backgroundColor: theme.colors.background.paper,
      borderRadius: 8, // theme.borderRadius.md
    });
  });

  it('renders standard variant correctly', () => {
    const testId = 'standard-card';
    render(
      <Card variant="standard" testID={testId}>
        <Text>Standard Card</Text>
      </Card>
    );
    
    const card = screen.getByTestId(testId);
    expect(card.props.style).toMatchObject({
      borderRadius: 8, // theme.borderRadius.md
    });
  });

  it('renders compact variant correctly', () => {
    const testId = 'compact-card';
    render(
      <Card variant="compact" testID={testId}>
        <Text>Compact Card</Text>
      </Card>
    );
    
    const card = screen.getByTestId(testId);
    expect(card.props.style).toMatchObject({
      borderRadius: 4, // theme.borderRadius.sm
    });
  });

  it('renders interactive variant correctly', () => {
    const testId = 'interactive-card';
    const onPress = jest.fn();
    
    render(
      <Card variant="interactive" onPress={onPress} testID={testId}>
        <Text>Interactive Card</Text>
      </Card>
    );
    
    // For interactive cards, we should use the InteractiveCardContainer
    const card = screen.getByTestId(testId);
    expect(card.props.style).toHaveProperty('transform');
    
    // It should also have a touchable component
    const button = screen.getByTestId(`${testId}-button`);
    expect(button).toBeTruthy();
  });

  // Elevation tests
  it('applies different elevation styles correctly', () => {
    const { rerender } = render(
      <Card testID="no-elevation" elevation="none">
        <Text>No Elevation</Text>
      </Card>
    );
    
    expect(screen.getByTestId('no-elevation').props.style).toMatchObject(theme.shadows.none);
    
    rerender(
      <Card testID="low-elevation" elevation="low">
        <Text>Low Elevation</Text>
      </Card>
    );
    
    expect(screen.getByTestId('low-elevation').props.style).toMatchObject(theme.shadows.sm);
    
    rerender(
      <Card testID="medium-elevation" elevation="medium">
        <Text>Medium Elevation</Text>
      </Card>
    );
    
    expect(screen.getByTestId('medium-elevation').props.style).toMatchObject(theme.shadows.md);
    
    rerender(
      <Card testID="high-elevation" elevation="high">
        <Text>High Elevation</Text>
      </Card>
    );
    
    expect(screen.getByTestId('high-elevation').props.style).toMatchObject(theme.shadows.lg);
  });

  // Size tests
  it('renders with different sizes correctly', () => {
    const { rerender } = render(
      <Card testID="small-card" size="sm">
        <Text>Small Card</Text>
      </Card>
    );
    
    const smallCard = screen.getByTestId('small-card');
    expect(smallCard.props.style.padding).toBe(theme.spacing.sm);
    
    rerender(
      <Card testID="medium-card" size="md">
        <Text>Medium Card</Text>
      </Card>
    );
    
    const mediumCard = screen.getByTestId('medium-card');
    expect(mediumCard.props.style.padding).toBe(theme.spacing.md);
    
    rerender(
      <Card testID="large-card" size="lg">
        <Text>Large Card</Text>
      </Card>
    );
    
    const largeCard = screen.getByTestId('large-card');
    expect(largeCard.props.style.padding).toBe(theme.spacing.lg);
  });

  // Header and footer tests
  it('renders with header correctly', () => {
    const headerText = 'Card Header';
    render(
      <Card 
        testID="card-with-header" 
        header={<Text testID="header-content">{headerText}</Text>}
      >
        <Text>Card Content</Text>
      </Card>
    );
    
    const header = screen.getByTestId('header-content');
    expect(header).toBeTruthy();
    expect(header.props.children).toBe(headerText);
  });

  it('renders with footer correctly', () => {
    const footerText = 'Card Footer';
    render(
      <Card 
        testID="card-with-footer" 
        footer={<Text testID="footer-content">{footerText}</Text>}
      >
        <Text>Card Content</Text>
      </Card>
    );
    
    const footer = screen.getByTestId('footer-content');
    expect(footer).toBeTruthy();
    expect(footer.props.children).toBe(footerText);
  });

  // Style customization tests
  it('applies fullWidth style correctly', () => {
    render(
      <Card testID="full-width-card" fullWidth>
        <Text>Full Width Card</Text>
      </Card>
    );
    
    const card = screen.getByTestId('full-width-card');
    expect(card.props.style).toMatchObject({
      width: '100%',
    });
  });

  it('applies noPadding style correctly', () => {
    render(
      <Card testID="no-padding-card" noPadding>
        <Text>No Padding Card</Text>
      </Card>
    );
    
    const card = screen.getByTestId('no-padding-card');
    expect(card.props.style.padding).toBe(0);
  });

  it('applies custom border color correctly', () => {
    const borderColor = theme.colors.primary.main;
    render(
      <Card testID="custom-border-card" borderColor={borderColor}>
        <Text>Custom Border Card</Text>
      </Card>
    );
    
    const card = screen.getByTestId('custom-border-card');
    expect(card.props.style).toMatchObject({
      borderWidth: 1,
      borderColor,
    });
  });

  it('applies custom styles correctly', () => {
    const customStyle = {
      marginTop: 20,
      backgroundColor: theme.colors.secondary.light,
    };
    
    render(
      <Card testID="custom-style-card" style={customStyle}>
        <Text>Custom Style Card</Text>
      </Card>
    );
    
    const card = screen.getByTestId('custom-style-card');
    expect(card.props.style).toMatchObject(customStyle);
  });

  it('applies custom content styles correctly', () => {
    const contentStyle = {
      backgroundColor: theme.colors.background.subtle,
      borderRadius: 4,
    };
    
    render(
      <Card testID="custom-content-card" contentStyle={contentStyle}>
        <Text testID="content">Content with Custom Style</Text>
      </Card>
    );
    
    // Find the CardContent component within the Card
    const content = screen.getByTestId('content').parent;
    expect(content.props.style).toMatchObject(contentStyle);
  });

  // Interaction tests
  it('handles press events correctly', () => {
    const onPressMock = jest.fn();
    render(
      <Card testID="pressable-card" onPress={onPressMock}>
        <Text>Pressable Card</Text>
      </Card>
    );
    
    const button = screen.getByTestId('pressable-card-button');
    fireEvent.press(button);
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('handles animation on press for interactive cards', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <Card testID="animated-card" variant="interactive" onPress={onPressMock}>
        <Text>Animated Card</Text>
      </Card>
    );
    
    const button = getByTestId('animated-card-button');
    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
    
    // We can't easily test the animation values directly,
    // but we can ensure the press handlers don't throw errors
    expect(onPressMock).not.toHaveBeenCalled();
  });

  // Accessibility test
  it('has correct accessibility properties', () => {
    const testID = 'accessible-card';
    const onPress = jest.fn();
    
    render(
      <Card testID={testID} onPress={onPress}>
        <Text>Accessible Card</Text>
      </Card>
    );
    
    const button = screen.getByTestId(`${testID}-button`);
    expect(button.props.accessible).toBe(true);
    expect(button.props.accessibilityRole).toBe('button');
  });
});