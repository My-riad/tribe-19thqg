import EventCreationForm from './EventCreationForm'; // Import the EventCreationForm component for re-export
import { EventCreationFormProps } from './EventCreationForm'; // Import the EventCreationFormProps interface for type definitions

/**
 * @file Entry point file for the EventCreationForm component that exports the component and its related types for use throughout the application.
 */

/**
 * @requirement_addressed Event Creation Form
 * @description Exports the form component for creating and editing events with fields for event details, date/time selection, and location
 */
export default EventCreationForm;

/**
 * @requirement_addressed Component Organization
 * @description Follows the established pattern for component exports and organization
 */
export type { EventCreationFormProps };