import React from 'react';
import { ActivityIndicator, Text } from 'react-native';

import { useAuth } from '../../../hooks/useAuth';
import { SocialAuthProvider } from '../../../types/auth.types';
import {
  SocialButtonContainer,
  SocialButton,
  SocialButtonText,
  SocialButtonIcon,
  OrSeparator
} from './SocialAuthButtons.styles';
import { SocialIcons } from '../../../assets/icons';

/**
 * Props for the SocialAuthButtons component
 */
interface SocialAuthButtonsProps {
  showSeparator?: boolean; // Whether to show the 'OR' separator below the buttons
  onSuccess?: () => void; // Optional callback function called after successful authentication
}

/**
 * Component that renders social authentication buttons for third-party login
 */
const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  showSeparator = true,
  onSuccess
}) => {
  const { socialLogin, loading } = useAuth();

  /**
   * Handles the social authentication process for the given provider
   * @param provider The social authentication provider
   */
  const handleSocialLogin = async (provider: SocialAuthProvider) => {
    try {
      // In a real implementation, we would get the token and userData from the provider's SDK
      await socialLogin({
        provider,
        token: 'mock-oauth-token-for-demo-purposes',
        userData: {}
      });
      
      // Call onSuccess callback if provided and authentication was successful
      onSuccess?.();
    } catch (error) {
      console.error(`Error during ${provider} authentication:`, error);
      // Error handling is managed by the useAuth hook and Redux store
    }
  };

  return (
    <SocialButtonContainer>
      {/* Google Sign In Button */}
      <SocialButton
        provider="google"
        onPress={() => handleSocialLogin(SocialAuthProvider.GOOGLE)}
        disabled={loading}
        accessibilityLabel="Sign in with Google"
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
      >
        <SocialButtonIcon>
          <SocialIcons.Google width={24} height={24} />
        </SocialButtonIcon>
        {loading ? (
          <ActivityIndicator size="small" color="#333" />
        ) : (
          <SocialButtonText provider="google">Continue with Google</SocialButtonText>
        )}
      </SocialButton>

      {/* Apple Sign In Button */}
      <SocialButton
        provider="apple"
        onPress={() => handleSocialLogin(SocialAuthProvider.APPLE)}
        disabled={loading}
        accessibilityLabel="Sign in with Apple"
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
      >
        <SocialButtonIcon>
          <SocialIcons.Apple width={24} height={24} />
        </SocialButtonIcon>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <SocialButtonText provider="apple">Continue with Apple</SocialButtonText>
        )}
      </SocialButton>

      {/* Facebook Sign In Button */}
      <SocialButton
        provider="facebook"
        onPress={() => handleSocialLogin(SocialAuthProvider.FACEBOOK)}
        disabled={loading}
        accessibilityLabel="Sign in with Facebook"
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
      >
        <SocialButtonIcon>
          <SocialIcons.Facebook width={24} height={24} />
        </SocialButtonIcon>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <SocialButtonText provider="facebook">Continue with Facebook</SocialButtonText>
        )}
      </SocialButton>

      {/* Optional separator between social login and email login */}
      {showSeparator && (
        <OrSeparator>
          <Text>OR</Text>
        </OrSeparator>
      )}
    </SocialButtonContainer>
  );
};

export default SocialAuthButtons;