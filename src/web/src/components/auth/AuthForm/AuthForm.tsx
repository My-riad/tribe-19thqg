import React, { useState, useEffect, useRef } from 'react'; // react ^18.2.0
import { View, Text, TouchableOpacity } from 'react-native'; // react-native ^0.70.0

import { useAuth } from '../../../hooks/useAuth';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import SocialAuthButtons from '../SocialAuthButtons';
import {
  LoginCredentials,
  RegistrationData,
  MFAResponse,
} from '../../../types/auth.types';
import { isRequired, isEmail, isPassword, isPasswordMatch } from '../../../utils/validation';
import {
  FormContainer,
  FormTitle,
  FormError,
  FormFooter,
  FormLink,
} from './AuthForm.styles';

// Define the type for the authentication form mode
type FormType = 'login' | 'register';

// Define the props for the AuthForm component
export interface AuthFormProps {
  formType: FormType; // Type of the form ('login' or 'register')
  onSuccess?: () => void; // Optional callback function called after successful authentication
  onToggleForm?: () => void; // Optional callback function to toggle between login and register forms
}

// Define the state for login form fields
interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Define the state for registration form fields
interface RegisterFormState {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

// Define the validation errors for form fields
interface FormErrors {
  email?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
  acceptedTerms?: string;
  mfaCode?: string;
}

/**
 * A versatile authentication form component that handles both login and registration flows
 */
const AuthForm: React.FC<AuthFormProps> = ({ formType, onSuccess, onToggleForm }) => {
  // Get authentication functions and state from useAuth hook
  const { login, register, verifyMFA, loading, error, mfaRequired, mfaChallenge } = useAuth();

  // Initialize form state based on formType (login or register)
  const [loginForm, setLoginForm] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  // Initialize validation errors state object
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize MFA code state for multi-factor authentication
  const [mfaCode, setMfaCode] = useState('');

  // Create handleInputChange function to update form state and validate input
  const handleInputChange = (field: string, value: string) => {
    if (formType === 'login') {
      setLoginForm({ ...loginForm, [field]: value });
    } else {
      setRegisterForm({ ...registerForm, [field]: value });
    }

    // Validate the input field
    setErrors(prevErrors => ({ ...prevErrors, [field]: validateField(field, value) }));
  };

  // Create validateForm function to validate all form fields
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: FormErrors> = {};

    if (formType === 'login') {
      newErrors.email = isEmail(loginForm.email);
      newErrors.password = isPassword(loginForm.password);

      if (newErrors.email) isValid = false;
      if (newErrors.password) isValid = false;
    } else {
      newErrors.email = isEmail(registerForm.email);
      newErrors.name = isRequired(registerForm.name);
      newErrors.password = isPassword(registerForm.password);
      newErrors.confirmPassword = isPasswordMatch(registerForm.password, registerForm.confirmPassword);

      if (newErrors.email) isValid = false;
      if (newErrors.name) isValid = false;
      if (newErrors.password) isValid = false;
      if (newErrors.confirmPassword) isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Create validateField function to validate a single field
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'email':
        return isEmail(value);
      case 'name':
        return isRequired(value);
      case 'password':
        return isPassword(value);
      case 'confirmPassword':
        if (formType === 'register') {
          return isPasswordMatch(registerForm.password, value);
        }
        return undefined;
      default:
        return undefined;
    }
  };

  // Create handleSubmit function to process form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (formType === 'login') {
        await login({ email: loginForm.email, password: loginForm.password, rememberMe: loginForm.rememberMe });
      } else {
        await register({ email: registerForm.email, name: registerForm.name, password: registerForm.password, acceptedTerms: registerForm.acceptedTerms });
      }
    } catch (e) {
      // Error handling is managed by the useAuth hook and Redux store
    }
  };

  // Create handleMFASubmit function to handle MFA verification
  const handleMFASubmit = async () => {
    try {
      await verifyMFA({ challengeId: mfaChallenge?.challengeId || '', code: mfaCode });
    } catch (e) {
      // Error handling is managed by the useAuth hook and Redux store
    }
  };

  // Create handleSocialAuthSuccess function to handle successful social authentication
  const handleSocialAuthSuccess = () => {
    onSuccess?.();
  };

  // Use useEffect to call onSuccess callback when authentication is successful
  useEffect(() => {
    if (onSuccess && !loading && !error && !mfaRequired) {
      onSuccess();
    }
  }, [onSuccess, loading, error, mfaRequired]);

  // Render appropriate form based on mfaRequired state
  if (mfaRequired && mfaChallenge) {
    // If MFA is required, render MFA verification form
    return (
      <FormContainer>
        <FormTitle>Verify MFA</FormTitle>
        <Text>Enter the code sent to {mfaChallenge.destination}</Text>
        <Input
          label="MFA Code"
          placeholder="Enter code"
          value={mfaCode}
          onChangeText={text => setMfaCode(text)}
          error={errors.mfaCode}
        />
        <Button onPress={handleMFASubmit} isLoading={loading}>
          Verify
        </Button>
        {error && <FormError>{error}</FormError>}
      </FormContainer>
    );
  } else {
    // If MFA is not required, render login or registration form based on formType
    return (
      <FormContainer>
        <FormTitle>{formType === 'login' ? 'Sign In' : 'Create Account'}</FormTitle>

        {formType === 'login' ? (
          // For login form, render email and password inputs with validation
          <>
            <Input
              label="Email"
              placeholder="Enter email"
              value={loginForm.email}
              onChangeText={text => handleInputChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              placeholder="Enter password"
              value={loginForm.password}
              onChangeText={text => handleInputChange('password', text)}
              error={errors.password}
              secureTextEntry
            />
          </>
        ) : (
          // For registration form, render email, name, password, and confirm password inputs with validation
          <>
            <Input
              label="Email"
              placeholder="Enter email"
              value={registerForm.email}
              onChangeText={text => handleInputChange('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Name"
              placeholder="Enter name"
              value={registerForm.name}
              onChangeText={text => handleInputChange('name', text)}
              error={errors.name}
            />
            <Input
              label="Password"
              placeholder="Enter password"
              value={registerForm.password}
              onChangeText={text => handleInputChange('password', text)}
              error={errors.password}
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm password"
              value={registerForm.confirmPassword}
              onChangeText={text => handleInputChange('confirmPassword', text)}
              error={errors.confirmPassword}
              secureTextEntry
            />
          </>
        )}

        {/* Render form submission button with loading state */}
        <Button onPress={handleSubmit} isLoading={loading}>
          {formType === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>

        {/* Render social authentication buttons with separator */}
        <SocialAuthButtons onSuccess={handleSocialAuthSuccess} />

        {/* Render form toggle link to switch between login and registration */}
        <FormFooter>
          <FormLink onPress={onToggleForm}>
            <Text>
              {formType === 'login'
                ? 'Don\'t have an account? Create one'
                : 'Already have an account? Sign in'}
            </Text>
          </FormLink>
        </FormFooter>

        {/* Render form error message if authentication error occurs */}
        {error && <FormError>{error}</FormError>}
      </FormContainer>
    );
  }
};

export default AuthForm;