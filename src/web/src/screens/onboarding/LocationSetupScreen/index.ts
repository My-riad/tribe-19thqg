import React from 'react'; // React v18.2.0
import LocationSetupScreen from './LocationSetupScreen'; // Import from ./LocationSetupScreen.tsx

/**
 * LocationSetupScreen Component
 *
 * This component is part of the onboarding flow and allows users to set up their location preferences.
 * It's responsible for collecting user location data, which is then used for location-based tribe matching and activity discovery.
 *
 * @returns {React.FC} LocationSetupScreen component
 */
const LocationSetupScreenExport: React.FC = () => {
  return <LocationSetupScreen />;
};

export default LocationSetupScreenExport;