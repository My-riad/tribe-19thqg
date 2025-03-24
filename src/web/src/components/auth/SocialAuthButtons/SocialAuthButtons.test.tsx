import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import SocialAuthButtons from './SocialAuthButtons';
import { SocialAuthProvider } from '../../../types/auth.types';

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Import the mocked hook
import { useAuth } from '../../../hooks/useAuth';

describe('SocialAuthButtons', () => {
  // Setup default mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementation
    (useAuth as jest.Mock).mockReturnValue({
      socialLogin: jest.fn().mockResolvedValue({}),
      loading: false
    });
  });

  it('renders all social buttons', () => {
    render(<SocialAuthButtons />);
    
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Continue with Apple')).toBeTruthy();
    expect(screen.getByText('Continue with Facebook')).toBeTruthy();
  });

  it('disables buttons when loading is true', () => {
    (useAuth as jest.Mock).mockReturnValue({
      socialLogin: jest.fn(),
      loading: true
    });
    
    render(<SocialAuthButtons />);
    
    const googleButton = screen.getByAccessibilityLabel('Sign in with Google');
    const appleButton = screen.getByAccessibilityLabel('Sign in with Apple');
    const facebookButton = screen.getByAccessibilityLabel('Sign in with Facebook');
    
    expect(googleButton.props.disabled).toBe(true);
    expect(appleButton.props.disabled).toBe(true);
    expect(facebookButton.props.disabled).toBe(true);
  });

  it('calls socialLogin with correct provider when Google button is pressed', async () => {
    const mockSocialLogin = jest.fn().mockResolvedValue({});
    (useAuth as jest.Mock).mockReturnValue({
      socialLogin: mockSocialLogin,
      loading: false
    });
    
    render(<SocialAuthButtons />);
    
    const googleButton = screen.getByAccessibilityLabel('Sign in with Google');
    fireEvent.press(googleButton);
    
    await waitFor(() => {
      expect(mockSocialLogin).toHaveBeenCalledWith(expect.objectContaining({
        provider: SocialAuthProvider.GOOGLE,
      }));
    });
  });

  it('calls socialLogin with correct provider when Apple button is pressed', async () => {
    const mockSocialLogin = jest.fn().mockResolvedValue({});
    (useAuth as jest.Mock).mockReturnValue({
      socialLogin: mockSocialLogin,
      loading: false
    });
    
    render(<SocialAuthButtons />);
    
    const appleButton = screen.getByAccessibilityLabel('Sign in with Apple');
    fireEvent.press(appleButton);
    
    await waitFor(() => {
      expect(mockSocialLogin).toHaveBeenCalledWith(expect.objectContaining({
        provider: SocialAuthProvider.APPLE,
      }));
    });
  });

  it('calls socialLogin with correct provider when Facebook button is pressed', async () => {
    const mockSocialLogin = jest.fn().mockResolvedValue({});
    (useAuth as jest.Mock).mockReturnValue({
      socialLogin: mockSocialLogin,
      loading: false
    });
    
    render(<SocialAuthButtons />);
    
    const facebookButton = screen.getByAccessibilityLabel('Sign in with Facebook');
    fireEvent.press(facebookButton);
    
    await waitFor(() => {
      expect(mockSocialLogin).toHaveBeenCalledWith(expect.objectContaining({
        provider: SocialAuthProvider.FACEBOOK,
      }));
    });
  });

  it('calls onSuccess callback after successful login', async () => {
    const mockSocialLogin = jest.fn().mockResolvedValue({});
    (useAuth as jest.Mock).mockReturnValue({
      socialLogin: mockSocialLogin,
      loading: false
    });
    
    const mockOnSuccess = jest.fn();
    render(<SocialAuthButtons onSuccess={mockOnSuccess} />);
    
    const googleButton = screen.getByAccessibilityLabel('Sign in with Google');
    fireEvent.press(googleButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('renders separator when showSeparator is true', () => {
    render(<SocialAuthButtons showSeparator={true} />);
    
    expect(screen.getByText('OR')).toBeTruthy();
  });

  it('does not render separator when showSeparator is false', () => {
    render(<SocialAuthButtons showSeparator={false} />);
    
    expect(screen.queryByText('OR')).toBeNull();
  });

  it('has correct accessibility labels on buttons', () => {
    render(<SocialAuthButtons />);
    
    expect(screen.getByAccessibilityLabel('Sign in with Google')).toBeTruthy();
    expect(screen.getByAccessibilityLabel('Sign in with Apple')).toBeTruthy();
    expect(screen.getByAccessibilityLabel('Sign in with Facebook')).toBeTruthy();
  });
});