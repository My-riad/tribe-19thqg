import React, { useState, useEffect } from 'react'; // react v18.2.0
import { View, Text, TouchableOpacity } from 'react-native'; // react-native v0.70.0
import { Checkbox } from 'react-native-elements'; // react-native-elements v3.4.0

import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import SocialAuthButtons from '../SocialAuthButtons/SocialAuthButtons';
import { useAuth } from '../../../hooks/useAuth';
import { RegistrationData } from '../../../types/auth.types';
import { isRequired, isEmail, isPassword, isPasswordMatch } from '../../../utils/validation';
import {
  FormContainer,
  FormTitle,
  FormError,
  TermsContainer,
  TermsText,
} from './RegistrationForm.styles';

interface RegistrationFormProps {
  onSuccess?: () => void;
}

/**
 * Registration form component that handles user registration
 */
const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  // 1. Destructure props including onSuccess callback
  // 2. Initialize form state with useState hook for name, email, password, confirmPassword, and acceptedTerms
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // 3. Initialize form errors state with useState hook
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptedTerms?: string;
    form?: string;
  }>({});

  // 4. Get register function, loading state, and error from useAuth hook
  const { register, loading, error } = useAuth();

  // 5. Create handleChange function to update form state and clear errors
  const handleChange = (field: string, value: string) => {
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      default:
        break;
    }
    setErrors(prevErrors => ({ ...prevErrors, [field]: undefined }));
  };

  // 6. Create validateForm function to validate all form fields
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      acceptedTerms?: string;
      form?: string;
    } = {};

    if (!name) newErrors.name = isRequired(name);
    if (!email) newErrors.email = isEmail(email);
    if (!password) newErrors.password = isPassword(password);
    if (!confirmPassword) newErrors.confirmPassword = isPasswordMatch(password, confirmPassword);
    if (!acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms and conditions.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 7. Create handleSubmit function to validate form and submit registration data
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const registrationData: RegistrationData = {
          name,
          email,
          password,
          acceptedTerms,
        };
        await register(registrationData);
      } catch (registrationError: any) {
        setErrors(prevErrors => ({ ...prevErrors, form: registrationError.message || 'Registration failed' }));
      }
    }
  };

  // 8. Create handleSocialSuccess function to call onSuccess callback after social authentication
  const handleSocialSuccess = () => {
    onSuccess?.();
  };

  // 9. Use useEffect to call onSuccess when registration is successful
  useEffect(() => {
    if (!loading && !error && onSuccess) {
      onSuccess();
    }
  }, [loading, error, onSuccess]);

  // 10. Render form container with title
  // 11. Render social authentication buttons with separator
  // 12. Render name input field with validation
  // 13. Render email input field with validation
  // 14. Render password input field with validation
  // 15. Render confirm password input field with validation
  // 16. Render terms and conditions checkbox
  // 17. Render form error message if present
  // 18. Render submit button with loading state
  return (
    <FormContainer>
      <FormTitle>Create Account</FormTitle>
      <SocialAuthButtons onSuccess={handleSocialSuccess} />
      {errors.form && <FormError>{errors.form}</FormError>}
      <Input
        label="Full Name"
        placeholder="Enter your full name"
        value={name}
        onChangeText={(text) => handleChange('name', text)}
        error={errors.name}
        accessibilityLabel="Full Name"
        testID="name-input"
      />
      <Input
        label="Email Address"
        placeholder="Enter your email address"
        value={email}
        onChangeText={(text) => handleChange('email', text)}
        error={errors.email}
        keyboardType="email-address"
        accessibilityLabel="Email Address"
        testID="email-input"
      />
      <Input
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={(text) => handleChange('password', text)}
        error={errors.password}
        secureTextEntry
        accessibilityLabel="Password"
        testID="password-input"
      />
      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={(text) => handleChange('confirmPassword', text)}
        error={errors.confirmPassword}
        secureTextEntry
        accessibilityLabel="Confirm Password"
        testID="confirm-password-input"
      />
      <TermsContainer>
        <Checkbox
          checked={acceptedTerms}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
          containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
          accessibilityLabel="Accept Terms and Conditions"
          testID="terms-checkbox"
        />
        <TermsText>
          I agree to the Terms of Service and Privacy Policy
        </TermsText>
      </TermsContainer>
      <Button
        onPress={handleSubmit}
        disabled={loading}
        isLoading={loading}
        accessibilityLabel="Sign Up"
        testID="signup-button"
      >
        Sign Up
      </Button>
    </FormContainer>
  );
};

export default RegistrationForm;