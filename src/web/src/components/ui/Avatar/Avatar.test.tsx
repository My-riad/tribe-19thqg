import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import Avatar, { AvatarGroup } from './Avatar';

describe('Avatar component', () => {
  // Basic rendering tests
  test('renders correctly with default props', () => {
    render(<Avatar testID="avatar" />);
    expect(screen.getByTestId('avatar')).toBeTruthy();
  });

  // Test rendering with image source
  test('renders with image source', () => {
    const source = { uri: 'https://example.com/avatar.jpg' };
    const { getByTestId } = render(<Avatar source={source} testID="avatar" />);
    expect(getByTestId('avatar')).toBeTruthy();
  });

  // Test fallback behavior when no image is provided
  test('renders with initials when no image source is provided', () => {
    const { getByText } = render(<Avatar name="John Doe" testID="avatar" />);
    expect(getByText('JD')).toBeTruthy();
  });

  // Test single initial for single name
  test('renders with single initial for one-word name', () => {
    const { getByText } = render(<Avatar name="John" testID="avatar" />);
    expect(getByText('J')).toBeTruthy();
  });

  // Test different sizes
  test('renders with different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    sizes.forEach(size => {
      const { getByTestId } = render(<Avatar size={size} testID={`avatar-${size}`} />);
      expect(getByTestId(`avatar-${size}`)).toBeTruthy();
    });
    
    // Test numeric size
    const { getByTestId } = render(<Avatar size={100} testID="avatar-custom" />);
    expect(getByTestId("avatar-custom")).toBeTruthy();
  });

  // Test different variants
  test('renders with different variants', () => {
    const variants = ['circle', 'rounded', 'square'];
    
    variants.forEach(variant => {
      const { getByTestId } = render(<Avatar variant={variant} testID={`avatar-${variant}`} />);
      expect(getByTestId(`avatar-${variant}`)).toBeTruthy();
    });
  });

  // Test status indicators
  test('renders with status indicator', () => {
    const statuses = ['online', 'offline', 'away', 'busy'];
    
    statuses.forEach(status => {
      const { getByTestId } = render(<Avatar status={status} testID={`avatar-${status}`} />);
      expect(getByTestId(`avatar-${status}`)).toBeTruthy();
    });
  });

  // Test user interaction
  test('handles onPress event', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Avatar onPress={onPress} testID="avatar" />);
    
    fireEvent.press(getByTestId('avatar'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // Test loading state
  test('handles loading state', () => {
    const { getByTestId } = render(<Avatar loading={true} testID="avatar-loading" />);
    expect(getByTestId("avatar-loading")).toBeTruthy();
  });

  // Test error handling
  test('handles error state', () => {
    const onError = jest.fn();
    const source = { uri: 'https://example.com/invalid.jpg' };
    const { getByTestId } = render(
      <Avatar 
        source={source} 
        onError={onError} 
        testID="avatar-error" 
      />
    );
    
    // Simulate image load error
    fireEvent(getByTestId("avatar-error"), 'onError');
    expect(onError).toHaveBeenCalled();
  });

  // Test AvatarGroup rendering
  test('AvatarGroup renders correctly', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Bob Johnson' }
    ];
    
    const { getByTestId } = render(<AvatarGroup avatars={avatars} testID="avatar-group" />);
    expect(getByTestId('avatar-group')).toBeTruthy();
    expect(getByTestId('avatar-group-avatar-0')).toBeTruthy();
    expect(getByTestId('avatar-group-avatar-1')).toBeTruthy();
    expect(getByTestId('avatar-group-avatar-2')).toBeTruthy();
  });

  // Test AvatarGroup maxVisible prop
  test('AvatarGroup respects maxVisible prop', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' },
      { name: 'Bob Johnson' },
      { name: 'Alice Williams' },
      { name: 'Charlie Brown' }
    ];
    
    const { getByTestId, queryByTestId, getByText } = render(
      <AvatarGroup avatars={avatars} maxVisible={2} testID="avatar-group" />
    );
    
    expect(getByTestId('avatar-group-avatar-0')).toBeTruthy();
    expect(getByTestId('avatar-group-avatar-1')).toBeTruthy();
    expect(queryByTestId('avatar-group-avatar-2')).toBeNull();
    expect(getByTestId('avatar-group-remaining')).toBeTruthy();
    expect(getByText('+3')).toBeTruthy(); // 3 remaining avatars
  });

  // Test AvatarGroup with different size
  test('AvatarGroup passes size prop to avatars', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' }
    ];
    
    const { getByTestId } = render(
      <AvatarGroup avatars={avatars} size="lg" testID="avatar-group" />
    );
    expect(getByTestId('avatar-group')).toBeTruthy();
    expect(getByTestId('avatar-group-avatar-0')).toBeTruthy();
    expect(getByTestId('avatar-group-avatar-1')).toBeTruthy();
  });

  // Test AvatarGroup with custom spacing
  test('AvatarGroup renders with custom spacing', () => {
    const avatars = [
      { name: 'John Doe' },
      { name: 'Jane Smith' }
    ];
    
    const { getByTestId } = render(
      <AvatarGroup avatars={avatars} spacing={10} testID="avatar-group" />
    );
    expect(getByTestId('avatar-group')).toBeTruthy();
  });
});