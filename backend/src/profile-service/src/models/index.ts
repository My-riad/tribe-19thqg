/**
 * Index file for Profile Service Models
 * 
 * This file centralizes and exports all models and functions related to user profiles,
 * personality traits, and interests. It serves as the main entry point for accessing
 * data models used in the personality-based matching and user profiling systems.
 */

// Import ProfileModel and related functions
import { 
  ProfileModel,
  createProfile, 
  getProfileById, 
  getProfileByUserId, 
  updateProfile, 
  deleteProfile, 
  searchProfiles, 
  getCompleteProfile, 
  updateLocation, 
  updateMaxTravelDistance 
} from './profile.model';

// Import PersonalityModel and related functions
import { 
  PersonalityModel,
  createPersonalityTrait, 
  getPersonalityTraitById, 
  getPersonalityTraitsByProfileId, 
  updatePersonalityTrait, 
  deletePersonalityTrait, 
  updateCommunicationStyle, 
  submitPersonalityAssessment, 
  getPersonalityCompatibility 
} from './personality.model';

// Import InterestModel and related functions
import { 
  InterestModel,
  createInterest, 
  getInterestById, 
  getInterestsByProfileId, 
  updateInterest, 
  deleteInterest, 
  submitInterests, 
  getInterestCompatibility 
} from './interest.model';

// Export all models and functions
export {
  // Profile models and functions
  ProfileModel,
  createProfile,
  getProfileById,
  getProfileByUserId,
  updateProfile,
  deleteProfile,
  searchProfiles,
  getCompleteProfile,
  updateLocation,
  updateMaxTravelDistance,
  
  // Personality models and functions
  PersonalityModel,
  createPersonalityTrait,
  getPersonalityTraitById,
  getPersonalityTraitsByProfileId,
  updatePersonalityTrait,
  deletePersonalityTrait,
  updateCommunicationStyle,
  submitPersonalityAssessment,
  getPersonalityCompatibility,
  
  // Interest models and functions
  InterestModel,
  createInterest,
  getInterestById,
  getInterestsByProfileId,
  updateInterest,
  deleteInterest,
  submitInterests,
  getInterestCompatibility
};