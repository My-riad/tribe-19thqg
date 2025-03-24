import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Image } from 'react-native';
import LoadingIndicator from './LoadingIndicator';
import { colors } from '../../../theme';

// Mock the theme functions needed for testing
jest.mock('../../../theme', () => {
  const originalModule = jest.requireActual('../../../theme');
  return {
    ...originalModule,
    checkReducedMotion: jest.fn().mockResolvedValue(false),
    loadingSpinner: jest.fn().mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
    }),
  };
});

describe('LoadingIndicator', () => {
  const mockCheckReducedMotion = require('../../../theme').checkReducedMotion;
  const mockLoadingSpinner = require('../../../theme').loadingSpinner;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId } = render(<LoadingIndicator />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.props.accessibilityRole).toBe('progressbar');
  });

  it('renders different sizes correctly', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
    
    sizes.forEach(size => {
      const { getByTestId, unmount } = render(<LoadingIndicator size={size} />);
      const indicator = getByTestId('loading-indicator');
      expect(indicator).toBeTruthy();
      
      // Check that the size prop is passed to the Spinner component
      const spinner = indicator.findByProps({ accessibilityLabel: 'Loading' });
      expect(spinner.props.size).toBe(size);
      
      unmount();
    });
  });

  it('renders different colors correctly', () => {
    const colorOptions = ['primary', 'secondary', 'white', 'neutral'] as const;
    
    colorOptions.forEach(color => {
      const { getByTestId, unmount } = render(<LoadingIndicator color={color} />);
      const indicator = getByTestId('loading-indicator');
      expect(indicator).toBeTruthy();
      
      // Check that the color prop is passed to the Spinner component
      const spinner = indicator.findByProps({ accessibilityLabel: 'Loading' });
      expect(spinner.props.color).toBe(color);
      
      unmount();
    });
  });

  it('renders in fullscreen mode correctly', () => {
    const { getByTestId } = render(<LoadingIndicator fullscreen={true} />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.props.fullscreen).toBe(true);
  });

  it('renders with overlay correctly', () => {
    const { getByTestId } = render(<LoadingIndicator overlay={true} />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.props.overlay).toBe(true);
  });

  it('renders with transparent background correctly', () => {
    const { getByTestId } = render(<LoadingIndicator transparent={true} />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator).toBeTruthy();
    expect(indicator.props.transparent).toBe(true);
  });

  it('renders with text correctly', () => {
    const testText = 'Loading...';
    const { getByText, getByTestId } = render(<LoadingIndicator text={testText} />);
    
    // Verify the text is displayed
    const loadingText = getByText(testText);
    expect(loadingText).toBeTruthy();
    
    // Verify the text component receives the same color prop as the spinner
    const indicator = getByTestId('loading-indicator');
    const spinner = indicator.findByProps({ accessibilityLabel: 'Loading' });
    expect(loadingText.props.color).toBe(spinner.props.color);
  });

  it('renders with custom animation correctly', () => {
    const { getByTestId } = render(<LoadingIndicator useCustomAnimation={true} />);
    const indicator = getByTestId('loading-indicator');
    
    // No standard spinner should be present with custom animation
    const standardSpinner = indicator.findAllByProps({ accessibilityLabel: 'Loading' });
    expect(standardSpinner.length).toBe(0);
    
    // An AnimatedSpinner should be present instead
    const animatedSpinner = indicator.findByType('AnimatedSpinner');
    expect(animatedSpinner).toBeTruthy();
    
    // The animation style should include a rotation transform
    expect(animatedSpinner.props.style.transform).toBeTruthy();
    expect(animatedSpinner.props.style.transform[0].rotate).toBeTruthy();
  });

  it('renders with custom spinner image correctly', () => {
    const mockImage = { uri: 'https://example.com/spinner.gif' };
    const { UNSAFE_getByType } = render(
      <LoadingIndicator
        useCustomAnimation={true}
        customSpinnerImage={mockImage}
      />
    );
    
    // Find the Image component
    const imageComponent = UNSAFE_getByType(Image);
    expect(imageComponent).toBeTruthy();
    expect(imageComponent.props.source).toBe(mockImage);
    expect(imageComponent.props.accessibilityLabel).toBe('Loading');
    expect(imageComponent.props.resizeMode).toBe('contain');
  });

  it('applies testID correctly', () => {
    const customTestId = 'test-loading';
    const { getByTestId } = render(<LoadingIndicator testID={customTestId} />);
    const indicator = getByTestId(customTestId);
    expect(indicator).toBeTruthy();
  });

  it('handles reduced motion preference correctly', async () => {
    // Override the mock to return true for reduced motion
    mockCheckReducedMotion.mockResolvedValue(true);
    
    // Render the component
    render(<LoadingIndicator />);
    
    // Wait for the useEffect to process the reduced motion preference
    await waitFor(() => {
      expect(mockLoadingSpinner).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ isReducedMotion: true })
      );
    });
  });
});