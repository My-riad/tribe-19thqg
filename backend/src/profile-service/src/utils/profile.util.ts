/**
 * Utility functions for working with user profiles in the Tribe platform.
 * This module includes functions for profile data validation, geographic calculations,
 * profile formatting, and metadata enrichment to support the personality-based matchmaking system.
 */

import { ValidationError } from '../../../shared/src/errors/validation.error';
import { 
  validateString, 
  validateNumber, 
  validateObject, 
  validateDate 
} from '../../../shared/src/utils/validation.util';
import { 
  IProfile, 
  IProfileCreate, 
  IProfileUpdate, 
  IProfileResponse, 
  ICoordinates,
  CommunicationStyle
} from '../../../shared/src/types/profile.types';
import { 
  LATITUDE_REGEX, 
  LONGITUDE_REGEX 
} from '../../../shared/src/constants/regex.constants';

/**
 * Validates profile data for creation or update operations
 * 
 * @param data - The profile data to validate
 * @param isUpdate - Whether this is an update (true) or create (false) operation
 * @returns Validated profile data object
 * @throws ValidationError if validation fails
 */
export const validateProfileData = (data: any, isUpdate: boolean = false): object => {
  // Check if data is a valid object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw ValidationError.invalidInput('Profile data must be an object');
  }

  // Create a copy of the data to avoid modifying the original
  const validatedData: Record<string, any> = { ...data };

  // Validate required fields for create operation
  if (!isUpdate) {
    if (!data.userId) throw ValidationError.requiredField('userId');
    if (!data.name) throw ValidationError.requiredField('name');
    if (!data.location) throw ValidationError.requiredField('location');
    if (!data.coordinates) throw ValidationError.requiredField('coordinates');
    if (!data.birthdate) throw ValidationError.requiredField('birthdate');
    
    // Validate userId format (assuming it's a UUID)
    validateString(data.userId);
  }

  // Validate optional fields if provided
  if (data.name !== undefined) {
    validatedData.name = validateString(data.name);
    if (data.name.length < 2 || data.name.length > 50) {
      throw ValidationError.invalidLength('name', 2, 50);
    }
  }

  if (data.bio !== undefined) {
    validatedData.bio = validateString(data.bio);
    if (data.bio.length > 500) {
      throw ValidationError.invalidLength('bio', 0, 500);
    }
  }

  if (data.location !== undefined) {
    validatedData.location = validateString(data.location);
    if (data.location.length < 2 || data.location.length > 100) {
      throw ValidationError.invalidLength('location', 2, 100);
    }
  }

  if (data.coordinates !== undefined) {
    validatedData.coordinates = validateCoordinates(data.coordinates);
  }

  if (data.birthdate !== undefined) {
    validatedData.birthdate = validateDate(data.birthdate);
    
    // Ensure the user is at least 18 years old
    if (!isAdult(validatedData.birthdate)) {
      throw ValidationError.invalidInput('User must be at least 18 years old');
    }
  }

  if (data.phoneNumber !== undefined) {
    validatedData.phoneNumber = validateString(data.phoneNumber);
    // Phone validation can be handled by the validatePhone utility if needed
  }

  if (data.avatarUrl !== undefined) {
    validatedData.avatarUrl = validateString(data.avatarUrl);
    // URL validation can be handled by the validateUrl utility if needed
  }

  if (data.communicationStyle !== undefined) {
    validatedData.communicationStyle = validateString(data.communicationStyle);
    
    // Validate that the communication style is one of the enum values
    const validStyles = Object.values(CommunicationStyle);
    if (!validStyles.includes(data.communicationStyle as CommunicationStyle)) {
      throw ValidationError.invalidEnum('communicationStyle', validStyles);
    }
  }

  if (data.maxTravelDistance !== undefined) {
    validatedData.maxTravelDistance = validateNumber(data.maxTravelDistance, { min: 1, max: 100 });
  }

  return validatedData;
};

/**
 * Validates geographic coordinates
 * 
 * @param coordinates - The coordinates object to validate
 * @returns Validated coordinates object
 * @throws ValidationError if validation fails
 */
export const validateCoordinates = (coordinates: ICoordinates): ICoordinates => {
  if (!coordinates || typeof coordinates !== 'object' || Array.isArray(coordinates)) {
    throw ValidationError.invalidInput('Coordinates must be an object with latitude and longitude');
  }

  const { latitude, longitude } = coordinates;

  // Check if latitude and longitude are present
  if (latitude === undefined) throw ValidationError.requiredField('latitude');
  if (longitude === undefined) throw ValidationError.requiredField('longitude');

  // Validate latitude
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw ValidationError.invalidRange('latitude', -90, 90);
  }

  // Validate longitude
  if (typeof longitude !== 'number' || isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw ValidationError.invalidRange('longitude', -180, 180);
  }

  // Check against regex patterns for additional validation
  const latString = latitude.toString();
  const lngString = longitude.toString();
  
  if (!LATITUDE_REGEX.test(latString)) {
    throw ValidationError.invalidFormat('latitude', '-90 to 90 degrees');
  }
  
  if (!LONGITUDE_REGEX.test(lngString)) {
    throw ValidationError.invalidFormat('longitude', '-180 to 180 degrees');
  }

  return { latitude, longitude };
};

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * 
 * @param coords1 - First coordinates
 * @param coords2 - Second coordinates
 * @returns Distance in kilometers
 */
export const calculateDistance = (coords1: ICoordinates, coords2: ICoordinates): number => {
  // Validate coordinates
  validateCoordinates(coords1);
  validateCoordinates(coords2);

  // Earth's radius in kilometers
  const R = 6371;

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const lon1Rad = (coords1.longitude * Math.PI) / 180;
  const lon2Rad = (coords2.longitude * Math.PI) / 180;

  // Calculate differences
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Apply Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Checks if two coordinates are within a specified distance of each other
 * 
 * @param coords1 - First coordinates
 * @param coords2 - Second coordinates
 * @param maxDistance - Maximum distance in kilometers
 * @returns True if within distance, false otherwise
 */
export const isWithinDistance = (
  coords1: ICoordinates,
  coords2: ICoordinates,
  maxDistance: number
): boolean => {
  // Validate coordinates
  validateCoordinates(coords1);
  validateCoordinates(coords2);
  
  // Validate maxDistance
  if (typeof maxDistance !== 'number' || isNaN(maxDistance) || maxDistance <= 0) {
    throw ValidationError.invalidInput('Maximum distance must be a positive number');
  }

  // Calculate distance between coordinates
  const distance = calculateDistance(coords1, coords2);
  
  // Return true if distance is less than or equal to maxDistance
  return distance <= maxDistance;
};

/**
 * Calculates a bounding box around a center point for efficient geospatial queries
 * 
 * @param center - Center coordinates
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box with min/max latitude and longitude
 */
export const calculateBoundingBox = (
  center: ICoordinates,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } => {
  // Validate center coordinates
  validateCoordinates(center);
  
  // Validate radius
  if (typeof radiusKm !== 'number' || isNaN(radiusKm) || radiusKm <= 0) {
    throw ValidationError.invalidInput('Radius must be a positive number');
  }

  // Earth's radius in kilometers
  const earthRadiusKm = 6371;

  // Angular distance in radians
  const angularDistance = radiusKm / earthRadiusKm;

  // Convert latitude and longitude to radians
  const latRad = (center.latitude * Math.PI) / 180;
  const lngRad = (center.longitude * Math.PI) / 180;

  // Calculate min/max latitudes
  const minLat = (latRad - angularDistance) * (180 / Math.PI);
  const maxLat = (latRad + angularDistance) * (180 / Math.PI);

  // Calculate min/max longitudes
  // This is an approximation that may not be accurate near the poles
  const latDelta = Math.asin(Math.sin(angularDistance) / Math.cos(latRad));
  const minLng = ((lngRad - latDelta + Math.PI) % (2 * Math.PI) - Math.PI) * (180 / Math.PI);
  const maxLng = ((lngRad + latDelta + Math.PI) % (2 * Math.PI) - Math.PI) * (180 / Math.PI);

  // Handle edge cases at poles and international date line
  return {
    minLat: Math.max(minLat, -90),
    maxLat: Math.min(maxLat, 90),
    minLng: minLng,
    maxLng: maxLng
  };
};

/**
 * Formats a profile object for API responses, including related data
 * 
 * @param profile - The profile object
 * @param personalityTraits - Optional array of personality traits
 * @param interests - Optional array of interests
 * @returns Formatted profile response object
 */
export const formatProfileResponse = (
  profile: IProfile,
  personalityTraits: any[] = [],
  interests: any[] = []
): IProfileResponse => {
  // Validate profile object
  if (!profile || typeof profile !== 'object') {
    throw ValidationError.invalidInput('Invalid profile object');
  }

  // Create base response
  const response: IProfileResponse = {
    ...profile,
    personalityTraits: [],
    interests: []
  };

  // Add personality traits if provided
  if (Array.isArray(personalityTraits) && personalityTraits.length > 0) {
    response.personalityTraits = personalityTraits;
  }

  // Add interests if provided
  if (Array.isArray(interests) && interests.length > 0) {
    response.interests = interests;
  }

  return response;
};

/**
 * Calculates a user's age based on their birthdate
 * 
 * @param birthdate - The user's birthdate
 * @returns Age in years
 */
export const getAgeFromBirthdate = (birthdate: Date): number => {
  if (!(birthdate instanceof Date) || isNaN(birthdate.getTime())) {
    throw ValidationError.invalidInput('Invalid birthdate');
  }

  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDifference = today.getMonth() - birthdate.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Checks if a user is at least 18 years old based on their birthdate
 * 
 * @param birthdate - The user's birthdate
 * @returns True if 18 or older, false otherwise
 */
export const isAdult = (birthdate: Date): boolean => {
  const age = getAgeFromBirthdate(birthdate);
  return age >= 18;
};

/**
 * Calculates the completion percentage of a user profile
 * 
 * @param profile - The profile object
 * @param personalityTraitsCount - Number of personality traits defined
 * @param interestsCount - Number of interests defined
 * @returns Completion percentage (0-100)
 */
export const getProfileCompletionPercentage = (
  profile: IProfile,
  personalityTraitsCount: number = 0,
  interestsCount: number = 0
): number => {
  if (!profile || typeof profile !== 'object') {
    throw ValidationError.invalidInput('Invalid profile object');
  }

  // Define required fields and their weights
  const fields = [
    { name: 'name', weight: 15 },
    { name: 'bio', weight: 10 },
    { name: 'location', weight: 15 },
    { name: 'coordinates', weight: 5 },
    { name: 'birthdate', weight: 10 },
    { name: 'phoneNumber', weight: 5 },
    { name: 'avatarUrl', weight: 5 },
    { name: 'communicationStyle', weight: 10 }
  ];

  // Calculate base profile completion
  let completionPercentage = 0;
  
  for (const field of fields) {
    if (profile[field.name as keyof IProfile]) {
      completionPercentage += field.weight;
    }
  }

  // Add score for personality traits (up to 15%)
  const maxTraitsScore = 15;
  const traitsScore = Math.min(personalityTraitsCount * 3, maxTraitsScore);
  completionPercentage += traitsScore;
  
  // Add score for interests (up to 10%)
  const maxInterestsScore = 10;
  const interestsScore = Math.min(interestsCount * 2, maxInterestsScore);
  completionPercentage += interestsScore;

  // Cap at 100%
  return Math.min(completionPercentage, 100);
};

/**
 * Generates a concise summary of a user profile for display purposes
 * 
 * @param profile - The profile response object
 * @returns Profile summary with key information
 */
export const getProfileSummary = (profile: IProfileResponse): { 
  name: string; 
  age: number; 
  location: string; 
  topTraits: string[]; 
  topInterests: string[];
  communicationStyle: string;
} => {
  if (!profile || typeof profile !== 'object') {
    throw ValidationError.invalidInput('Invalid profile object');
  }

  // Extract basic info
  const name = profile.name;
  const age = profile.birthdate ? getAgeFromBirthdate(profile.birthdate) : 0;
  const location = profile.location;

  // Extract top personality traits (highest scores)
  const sortedTraits = [...(profile.personalityTraits || [])].sort((a, b) => b.score - a.score);
  const topTraits = sortedTraits.slice(0, 3).map(t => t.trait);

  // Extract top interests (highest levels)
  const sortedInterests = [...(profile.interests || [])].sort((a, b) => b.level - a.level);
  const topInterests = sortedInterests.slice(0, 3).map(i => i.name);

  // Format communication style
  let communicationStyle = '';
  if (profile.communicationStyle) {
    // Convert from snake_case or camelCase to readable format
    communicationStyle = profile.communicationStyle
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  return {
    name,
    age,
    location,
    topTraits,
    topInterests,
    communicationStyle
  };
};

/**
 * Adds calculated metadata to a profile for internal use
 * 
 * @param profile - The profile response object
 * @returns Profile with added metadata
 */
export const enrichProfileWithMetadata = (profile: IProfileResponse): object => {
  if (!profile || typeof profile !== 'object') {
    throw ValidationError.invalidInput('Invalid profile object');
  }

  // Create a copy to avoid modifying the original
  const enrichedProfile = { ...profile };

  // Calculate age
  if (profile.birthdate) {
    enrichedProfile['age'] = getAgeFromBirthdate(profile.birthdate);
  }

  // Calculate profile completion percentage
  enrichedProfile['completionPercentage'] = getProfileCompletionPercentage(
    profile,
    profile.personalityTraits ? profile.personalityTraits.length : 0,
    profile.interests ? profile.interests.length : 0
  );

  // Add other metadata if available in the system
  // These would typically come from other services but we're preparing the structure
  enrichedProfile['lastActivity'] = new Date(); // This would come from activity tracking
  enrichedProfile['tribeCount'] = 0; // This would come from tribe service
  enrichedProfile['eventParticipation'] = { total: 0, attended: 0 }; // This would come from event service

  return enrichedProfile;
};

/**
 * Removes sensitive data from a profile object for public exposure
 * 
 * @param profile - The profile object
 * @returns Sanitized profile object
 */
export const sanitizeProfileData = (profile: IProfile): object => {
  if (!profile || typeof profile !== 'object') {
    throw ValidationError.invalidInput('Invalid profile object');
  }

  // Create a deep copy to avoid modifying the original
  const sanitizedProfile = JSON.parse(JSON.stringify(profile));

  // Replace birthdate with age
  if (sanitizedProfile.birthdate) {
    sanitizedProfile.age = getAgeFromBirthdate(new Date(sanitizedProfile.birthdate));
    delete sanitizedProfile.birthdate;
  }

  // Remove exact coordinates (could keep general location)
  if (sanitizedProfile.coordinates) {
    // Round coordinates to lower precision for privacy
    sanitizedProfile.coordinates = {
      latitude: Math.round(sanitizedProfile.coordinates.latitude * 10) / 10,
      longitude: Math.round(sanitizedProfile.coordinates.longitude * 10) / 10
    };
  }

  // Remove phone number
  delete sanitizedProfile.phoneNumber;

  // Remove any other sensitive fields that shouldn't be publicly exposed
  delete sanitizedProfile.userId; // The public API would use the profile ID instead

  return sanitizedProfile;
};