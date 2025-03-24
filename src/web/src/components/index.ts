// Import all UI components from the UI module
import * as ui from './ui';
// Import all authentication-related components
import * as auth from './auth';
// Import all profile-related components
import * as profile from './profile';
// Import all tribe-related components
import * as tribe from './tribe';
// Import all event-related components
import * as event from './event';

/**
 * @file src/web/src/components/index.ts
 * @src_subfolder web
 * @description Main barrel file that exports all components from various subdirectories, providing a centralized import point for the entire component library. This simplifies imports throughout the application by allowing developers to import any component from a single path.
 * @requirements_addressed 
 *   - name: Component Organization
 *   - location: Technical Specifications/7. USER INTERFACE DESIGN/7.7 DESIGN IMPLEMENTATION GUIDELINES/7.7.1 React Native Components
 *   - description: Implements the recommended component organization structure for React Native, using barrel files for simplified imports
 * @requirements_addressed 
 *   - name: UI Component Library
 *   - location: Technical Specifications/7. USER INTERFACE DESIGN/7.2 DESIGN SYSTEM/7.2.3 Common UI Components
 *   - description: Centralizes exports for all UI components defined in the design system
 * @requirements_addressed 
 *   - name: Feature-Specific Components
 *   - location: Technical Specifications/6. SYSTEM COMPONENTS DESIGN/6.2 MOBILE CLIENT DESIGN
 *   - description: Organizes and exports components by feature domain (auth, profile, tribe, event)
 * @imports
 *   - internal: 
 *     - name: *
 *       type: module
 *       import_type: named
 *       members_used: []
 *       module: './ui'
 *       path: src/web/src/components/ui/index.ts
 *       purpose: Import all UI components from the UI module
 *     - name: *
 *       type: module
 *       import_type: named
 *       members_used: []
 *       module: './auth'
 *       path: src/web/src/components/auth/index.ts
 *       purpose: Import all authentication-related components
 *     - name: *
 *       type: module
 *       import_type: named
 *       members_used: []
 *       module: './profile'
 *       path: src/web/src/components/profile/index.ts
 *       purpose: Import all profile-related components
 *     - name: *
 *       type: module
 *       import_type: named
 *       members_used: []
 *       module: './tribe'
 *       path: src/web/src/components/tribe/index.ts
 *       purpose: Import all tribe-related components
 *     - name: *
 *       type: module
 *       import_type: named
 *       members_used: []
 *       module: './event'
 *       path: src/web/src/components/event/index.ts
 *       purpose: Import all event-related components
 *   - external: []
 * @globals []
 * @functions []
 * @classes []
 * @exports
 *   - name: *
 *     type: module
 *     members_exposed: []
 *     export_type: named
 *     purpose: Re-export all UI components
 *   - name: *
 *     type: module
 *     members_exposed: []
 *     export_type: named
 *     purpose: Re-export all authentication components
 *   - name: *
 *     type: module
 *     members_exposed: []
 *     export_type: named
 *     purpose: Re-export all profile components
 *   - name: *
 *     type: module
 *     members_exposed: []
 *     export_type: named
 *     purpose: Re-export all tribe components
 *   - name: *
 *     type: module
 *     members_exposed: []
 *     export_type: named
 *     purpose: Re-export all event components
 */

// Re-export all UI components
export * as ui from './ui';

// Re-export all authentication components
export * as auth from './auth';

// Re-export all profile components
export * as profile from './profile';

// Re-export all tribe components
export * as tribe from './tribe';

// Re-export all event components
export * as event from './event';