// Import the RegistrationForm component for re-export
import RegistrationForm from './RegistrationForm';

/**
 * @file RegistrationForm/index.ts
 * @src_subfolder web
 * @description Barrel file that exports the RegistrationForm component, making it available for import from other parts of the application without having to reference the specific implementation file.
 * @requirements_addressed 
 *   - name: Component Organization
 *   - location: Technical Specifications/6. SYSTEM COMPONENTS DESIGN/6.2.4 Mobile Component Structure
 *   - description: Organize components using barrel files for cleaner imports
 */

// Re-export the RegistrationForm component as the default export
export default RegistrationForm;