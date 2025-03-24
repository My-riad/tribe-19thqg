// Import the AttendeesList component and its props interface for re-export
import AttendeesList, { AttendeesListProps } from './AttendeesList';
// Import the EventCard component and its props interface for re-export
import EventCard, { EventCardProps } from './EventCard';
// Import the EventCreationForm component and its props interface for re-export
import EventCreationForm, { EventCreationFormProps } from './EventCreationForm';
// Import the EventDetails component for re-export
import EventDetails from './EventDetails';
// Import the RSVPButtons component for re-export
import RSVPButtons from './RSVPButtons';
// Import the WeatherWidget component and its props interface for re-export
import WeatherWidget, { WeatherWidgetProps } from './WeatherWidget';

/**
 * @file src/web/src/components/event/index.ts
 * @src_subfolder web
 * @description Barrel file that exports all event-related components from a single entry point. This file simplifies imports by allowing consumers to import any event component from a single path rather than having to import from individual component folders.
 * @requirements_addressed 
 *   - name: Component Organization
 *     location: Technical Specifications/6. SYSTEM COMPONENTS DESIGN/6.2 MOBILE CLIENT DESIGN
 *     description: Follows the established pattern for component organization and exports, providing a centralized entry point for all event-related components
 *   - name: Event Planning & Management
 *     location: Technical Specifications/7. USER INTERFACE DESIGN/7.3 SCREEN WIREFRAMES/7.3.4 Event Planning & Management
 *     description: Exports all UI components needed for the event planning and management screens
 * @imports
 *   - internal: 
 *     - name: AttendeesList
 *       type: component
 *       import_type: default
 *       members_used: []
 *       module: './AttendeesList'
 *       path: src/web/src/components/event/AttendeesList/index.ts
 *       purpose: Import the AttendeesList component for re-export
 *     - name: AttendeesListProps
 *       type: interface
 *       import_type: named
 *       members_used: []
 *       module: './AttendeesList'
 *       path: src/web/src/components/event/AttendeesList/index.ts
 *       purpose: Import the AttendeesListProps interface for type definitions
 *     - name: EventCard
 *       type: component
 *       import_type: default
 *       members_used: []
 *       module: './EventCard'
 *       path: src/web/src/components/event/EventCard/index.ts
 *       purpose: Import the EventCard component for re-export
 *     - name: EventCardProps
 *       type: interface
 *       import_type: named
 *       members_used: []
 *       module: './EventCard'
 *       path: src/web/src/components/event/EventCard/index.ts
 *       purpose: Import the EventCardProps interface for type definitions
 *     - name: EventCreationForm
 *       type: component
 *       import_type: default
 *       members_used: []
 *       module: './EventCreationForm'
 *       path: src/web/src/components/event/EventCreationForm/index.ts
 *       purpose: Import the EventCreationForm component for re-export
 *     - name: EventCreationFormProps
 *       type: interface
 *       import_type: named
 *       members_used: []
 *       module: './EventCreationForm'
 *       path: src/web/src/components/event/EventCreationForm/index.ts
 *       purpose: Import the EventCreationFormProps interface for type definitions
 *     - name: EventDetails
 *       type: component
 *       import_type: default
 *       members_used: []
 *       module: './EventDetails'
 *       path: src/web/src/components/event/EventDetails/index.ts
 *       purpose: Import the EventDetails component for re-export
 *     - name: RSVPButtons
 *       type: component
 *       import_type: default
 *       members_used: []
 *       module: './RSVPButtons'
 *       path: src/web/src/components/event/RSVPButtons/index.ts
 *       purpose: Import the RSVPButtons component for handling event attendance responses
 *     - name: WeatherWidget
 *       type: component
 *       import_type: default
 *       members_used: []
 *       module: './WeatherWidget'
 *       path: src/web/src/components/event/WeatherWidget/index.ts
 *       purpose: Import the WeatherWidget component for displaying weather information for events
 *     - name: WeatherWidgetProps
 *       type: interface
 *       import_type: named
 *       members_used: []
 *       module: './WeatherWidget'
 *       path: src/web/src/components/event/WeatherWidget/index.ts
 *       purpose: Import the WeatherWidgetProps interface for type checking
 *   - external: []
 * @globals []
 * @functions []
 * @classes []
 * @exports
 *   - name: AttendeesList
 *     type: component
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the AttendeesList component for use in event-related screens
 *   - name: AttendeesListProps
 *     type: interface
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the AttendeesListProps interface for type checking
 *   - name: EventCard
 *     type: component
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the EventCard component for displaying event information in various screens
 *   - name: EventCardProps
 *     type: interface
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the EventCardProps interface for type checking
 *   - name: EventCreationForm
 *     type: component
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the EventCreationForm component for creating and editing events
 *   - name: EventCreationFormProps
 *     type: interface
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the EventCreationFormProps interface for type checking
 *   - name: EventDetails
 *     type: component
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the EventDetails component for displaying comprehensive event information
 *   - name: RSVPButtons
 *     type: component
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the RSVPButtons component for handling event attendance responses
 *   - name: WeatherWidget
 *     type: component
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the WeatherWidget component for displaying weather information for events
 *   - name: WeatherWidgetProps
 *     type: interface
 *     members_exposed: []
 *     export_type: named
 *     purpose: Export the WeatherWidgetProps interface for type checking
 */

// Export AttendeesList and AttendeesListProps
export { AttendeesList, AttendeesListProps };

// Export EventCard and EventCardProps
export { EventCard, EventCardProps };

// Export EventCreationForm and EventCreationFormProps
export { EventCreationForm, EventCreationFormProps };

// Export EventDetails
export { EventDetails };

// Export RSVPButtons
export { RSVPButtons };

// Export WeatherWidget and WeatherWidgetProps
export { WeatherWidget, WeatherWidgetProps };