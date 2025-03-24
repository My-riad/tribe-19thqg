import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';
import Badge, { BadgeProps } from './Badge';

// Mock an icon component for testing achievement badges
const MockIcon = () => <View testID="mock-icon" />;

// Helper function to render Badge with given props
const renderWithProps = (props: BadgeProps) => {
  return render(<Badge {...props} />);
};

describe('Badge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders standard badge correctly', () => {
    renderWithProps({ children: 'Test Badge' });
    expect(screen.getByText('Test Badge')).toBeTruthy();
  });

  it('renders with different variants', () => {
    const variants: BadgeProps['variant'][] = ['primary', 'secondary', 'success', 'warning', 'error'];
    
    variants.forEach(variant => {
      const { unmount } = renderWithProps({ variant, children: `${variant} Badge` });
      expect(screen.getByText(`${variant} Badge`)).toBeTruthy();
      unmount();
    });
  });

  it('renders with different sizes', () => {
    const sizes: BadgeProps['size'][] = ['xs', 'sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      const { unmount } = renderWithProps({ size, children: `${size} Badge` });
      expect(screen.getByText(`${size} Badge`)).toBeTruthy();
      unmount();
    });
  });

  it('renders notification badge correctly', () => {
    renderWithProps({ type: 'notification', count: 5 });
    expect(screen.getByText('5')).toBeTruthy();
    
    // Test large number truncation
    const { unmount } = renderWithProps({ type: 'notification', count: 100 });
    expect(screen.getByText('99+')).toBeTruthy();
    unmount();
    
    // Test negative number handling (should be converted to 0)
    renderWithProps({ type: 'notification', count: -5 });
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('renders status badge correctly', () => {
    renderWithProps({ type: 'status', children: 'Active' });
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders achievement badge correctly', () => {
    renderWithProps({
      type: 'achievement',
      icon: <MockIcon />,
      children: 'Achievement'
    });
    expect(screen.getByText('Achievement')).toBeTruthy();
    expect(screen.getByTestId('mock-icon')).toBeTruthy();
  });

  it('renders outlined badge correctly', () => {
    renderWithProps({ outlined: true, children: 'Outlined' });
    expect(screen.getByText('Outlined')).toBeTruthy();
  });

  it('applies custom color correctly', () => {
    renderWithProps({ color: '#FF0000', children: 'Custom Color' });
    expect(screen.getByText('Custom Color')).toBeTruthy();
  });

  it('applies custom style correctly', () => {
    const customStyle = { margin: 10 };
    renderWithProps({ style: customStyle, children: 'Custom Style' });
    expect(screen.getByText('Custom Style')).toBeTruthy();
  });

  it('applies custom text style correctly', () => {
    const customTextStyle = { fontWeight: 'bold' };
    renderWithProps({ textStyle: customTextStyle, children: 'Custom Text Style' });
    expect(screen.getByText('Custom Text Style')).toBeTruthy();
  });

  it('applies testID correctly for testing', () => {
    renderWithProps({ testID: 'test-badge', children: 'Test Badge' });
    expect(screen.getByTestId('test-badge')).toBeTruthy();
  });
});