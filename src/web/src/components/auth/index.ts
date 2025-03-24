// Import the SocialAuthButtons component
import SocialAuthButtons from './SocialAuthButtons';

// Import the AuthForm component and related types
import AuthForm from './AuthForm';
import { AuthFormProps, FormType } from './AuthForm';

// Import the RegistrationForm component
import RegistrationForm from './RegistrationForm';

/**
 * @file src/web/src/components/auth/index.ts
 * @src_subfolder web
 * @description Barrel file that exports all authentication-related components from the auth directory, providing a clean and centralized import point for authentication UI components throughout the Tribe application.
 * @requirements_addressed 
 *   - name: Component Organization
 *   - location: Technical Specifications/System Components Design/React Component Structure
 *   - description: Follow the pattern of using index files to simplify component imports throughout the application
 * @requirements_addressed 
 *   - name: Authentication UI
 *   - location: Technical Specifications/7. USER INTERFACE DESIGN/7.3 SCREEN WIREFRAMES/7.3.1 Onboarding Flow
 *   - description: Provide centralized access to authentication-related UI components for login, registration, and social authentication
 */

// Re-export the SocialAuthButtons component as a named export
export { SocialAuthButtons };

// Re-export the AuthForm component and related types as named exports
export { AuthForm, AuthFormProps, FormType };

// Re-export the RegistrationForm component as a named export
export { RegistrationForm };