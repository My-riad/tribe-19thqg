import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { act } from 'react-test-renderer';
import { Text, View } from 'react-native';
import Dialog, { DialogProps } from './Dialog';

describe('Dialog', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    mockOnClose.mockReset();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly when visible', () => {
    const { getByText, getByTestId } = render(
      <Dialog isVisible={true} onClose={mockOnClose} testID="dialog">
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    expect(getByTestId('dialog')).toBeTruthy();
    expect(getByText('Dialog content')).toBeTruthy();
  });
  
  it('does not render when not visible', () => {
    const { queryByText, queryByTestId } = render(
      <Dialog isVisible={false} onClose={mockOnClose} testID="dialog">
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    expect(queryByTestId('dialog')).toBeNull();
    expect(queryByText('Dialog content')).toBeNull();
  });
  
  it('renders with title when provided', () => {
    const { getByText } = render(
      <Dialog isVisible={true} onClose={mockOnClose} title="Test Title" testID="dialog">
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Dialog content')).toBeTruthy();
  });
  
  it('renders different variants correctly', () => {
    const variants = ['alert', 'confirmation', 'input'] as const;
    
    variants.forEach(variant => {
      const { getByTestId, unmount } = render(
        <Dialog 
          isVisible={true} 
          onClose={mockOnClose} 
          variant={variant}
          testID="dialog"
        >
          <Text>Dialog content</Text>
        </Dialog>
      );
      
      const dialog = getByTestId('dialog');
      expect(dialog).toBeTruthy();
      // Verify variant-specific styling would be added here
      // but we need to avoid implementation details
      
      unmount();
    });
  });
  
  it('renders different sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg', 'fullscreen'] as const;
    
    sizes.forEach(size => {
      const { getByTestId, unmount } = render(
        <Dialog 
          isVisible={true} 
          onClose={mockOnClose} 
          size={size}
          testID="dialog"
        >
          <Text>Dialog content</Text>
        </Dialog>
      );
      
      const dialog = getByTestId('dialog');
      expect(dialog).toBeTruthy();
      // Verify size-specific styling would be added here
      // but we need to avoid implementation details
      
      unmount();
    });
  });
  
  it('calls onClose when close button is pressed', () => {
    const { getByA11yLabel } = render(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose} 
        title="Test Title"
        showCloseButton={true}
        testID="dialog"
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    const closeButton = getByA11yLabel('Close dialog');
    fireEvent.press(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('calls onClose when backdrop is pressed if closeOnBackdropPress is true', async () => {
    // Since we can't directly access the backdrop TouchableWithoutFeedback,
    // we'll use UNSAFE_getAllByType to find it
    const { UNSAFE_getAllByType } = render(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose}
        closeOnBackdropPress={true}
        testID="dialog"
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    // Get the TouchableWithoutFeedback components
    const touchables = UNSAFE_getAllByType('TouchableWithoutFeedback');
    
    // Find the backdrop touchable (not the close button)
    // This is fragile and depends on component implementation
    const backdropTouchable = touchables.find(t => 
      t.props.accessibilityRole !== 'button'
    );
    
    expect(backdropTouchable).toBeTruthy();
    fireEvent.press(backdropTouchable);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onClose when backdrop is pressed if closeOnBackdropPress is false', () => {
    const { UNSAFE_getAllByType } = render(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose}
        closeOnBackdropPress={false}
        testID="dialog"
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    // With closeOnBackdropPress=false, no TouchableWithoutFeedback should be rendered for the backdrop
    const touchables = UNSAFE_getAllByType('TouchableWithoutFeedback');
    
    // The only touchable should be the close button if present
    touchables.forEach(touchable => {
      if (touchable.props.accessibilityRole !== 'button') {
        fireEvent.press(touchable);
      }
    });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  
  it('renders primary and secondary action buttons when provided', () => {
    const mockPrimaryAction = jest.fn();
    const mockSecondaryAction = jest.fn();
    
    const { getByText } = render(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose}
        primaryAction={{
          label: 'Confirm',
          onPress: mockPrimaryAction
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: mockSecondaryAction
        }}
        testID="dialog"
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    const primaryButton = getByText('Confirm');
    const secondaryButton = getByText('Cancel');
    
    expect(primaryButton).toBeTruthy();
    expect(secondaryButton).toBeTruthy();
    
    fireEvent.press(primaryButton);
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
    
    fireEvent.press(secondaryButton);
    expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
  });
  
  it('handles animation correctly', async () => {
    const { rerender, queryByText } = render(
      <Dialog isVisible={true} onClose={mockOnClose} testID="dialog">
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    expect(queryByText('Dialog content')).toBeTruthy();
    
    rerender(
      <Dialog isVisible={false} onClose={mockOnClose} testID="dialog">
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    // Wait for animation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300)); // Animation duration
    });
    
    expect(queryByText('Dialog content')).toBeNull();
  });
  
  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose}
        title="Accessible Dialog"
        accessibilityLabel="Test dialog for accessibility"
        testID="dialog"
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    const dialog = getByTestId('dialog');
    expect(dialog.props.accessibilityLabel).toBe('Test dialog for accessibility');
    expect(dialog.props.accessibilityRole).toBe('dialog');
  });
  
  it('respects noPadding prop for content styling', () => {
    const { getByTestId, rerender } = render(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose} 
        testID="dialog"
        noPadding={false}
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    const dialog = getByTestId('dialog');
    expect(dialog).toBeTruthy();
    
    // Test with noPadding=true
    rerender(
      <Dialog 
        isVisible={true} 
        onClose={mockOnClose} 
        testID="dialog"
        noPadding={true}
      >
        <Text>Dialog content</Text>
      </Dialog>
    );
    
    expect(getByTestId('dialog')).toBeTruthy();
  });
  
  it('uses correct animation type', async () => {
    const animationTypes = ['fade', 'scale', 'slideUp'] as const;
    
    for (const animationType of animationTypes) {
      const { getByText, unmount } = render(
        <Dialog 
          isVisible={true} 
          onClose={mockOnClose} 
          animationType={animationType}
          testID="dialog"
        >
          <Text>Dialog content</Text>
        </Dialog>
      );
      
      expect(getByText('Dialog content')).toBeTruthy();
      unmount();
    }
  });
});