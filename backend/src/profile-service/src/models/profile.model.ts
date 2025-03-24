/**
 * Profile Model
 * 
 * Implements the data access layer for user profiles in the Tribe platform. This model
 * provides methods for creating, retrieving, updating, and managing user profiles,
 * including location data, communication preferences, and travel distance settings.
 * It serves as the foundation for the personality-based matchmaking system.
 */

import prisma from '../../../config/database';
import { 
  IProfile, 
  IProfileCreate, 
  IProfileUpdate, 
  IProfileResponse, 
  IProfileSearchParams, 
  ICoordinates, 
  CommunicationStyle
} from '../../../shared/src/types/profile.types';
import { DatabaseError } from '../../../shared/src/errors/database.error';
import { PersonalityModel } from './personality.model';
import { InterestModel } from './interest.model';

/**
 * Class representing the profile model with database operations
 */
export class ProfileModel {
  private prisma;
  private personalityModel: PersonalityModel;
  private interestModel: InterestModel;

  /**
   * Initializes the ProfileModel with required dependencies
   */
  constructor() {
    this.prisma = prisma.prisma; // Access the Prisma client instance
    this.personalityModel = new PersonalityModel();
    this.interestModel = new InterestModel();
  }

  /**
   * Creates a new user profile
   * 
   * @param data - Profile data to create
   * @returns The created profile
   * @throws DatabaseError if creation fails
   */
  async create(data: IProfileCreate): Promise<IProfile> {
    try {
      // Validate the profile data
      if (!data.userId || !data.name) {
        throw new Error('User ID and name are required for profile creation');
      }

      // Create the profile
      const profile = await this.prisma.profile.create({
        data: {
          userId: data.userId,
          name: data.name,
          bio: data.bio || '',
          location: data.location || '',
          coordinates: data.coordinates ? {
            latitude: data.coordinates.latitude,
            longitude: data.coordinates.longitude
          } : null,
          birthdate: data.birthdate,
          phoneNumber: data.phoneNumber || '',
          avatarUrl: data.avatarUrl || '',
          communicationStyle: data.communicationStyle || CommunicationStyle.DIRECT,
          maxTravelDistance: data.maxTravelDistance || 10 // Default to 10 miles
        }
      });

      return profile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'create profile' });
    }
  }

  /**
   * Retrieves a profile by ID
   * 
   * @param id - Profile ID
   * @returns The profile if found, null otherwise
   * @throws DatabaseError if retrieval fails
   */
  async getById(id: string): Promise<IProfile | null> {
    try {
      // Query the database
      const profile = await this.prisma.profile.findUnique({
        where: { id }
      });

      return profile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'get profile by id' });
    }
  }

  /**
   * Retrieves a profile by user ID
   * 
   * @param userId - User ID
   * @returns The profile if found, null otherwise
   * @throws DatabaseError if retrieval fails
   */
  async getByUserId(userId: string): Promise<IProfile | null> {
    try {
      // Query the database
      const profile = await this.prisma.profile.findUnique({
        where: { userId }
      });

      return profile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'get profile by user id' });
    }
  }

  /**
   * Updates a profile
   * 
   * @param id - Profile ID
   * @param data - Updated profile data
   * @returns The updated profile
   * @throws DatabaseError if update fails
   */
  async update(id: string, data: IProfileUpdate): Promise<IProfile> {
    try {
      // Update the profile
      const updatedProfile = await this.prisma.profile.update({
        where: { id },
        data: {
          name: data.name,
          bio: data.bio,
          location: data.location,
          coordinates: data.coordinates ? {
            latitude: data.coordinates.latitude,
            longitude: data.coordinates.longitude
          } : undefined,
          birthdate: data.birthdate,
          phoneNumber: data.phoneNumber,
          avatarUrl: data.avatarUrl,
          communicationStyle: data.communicationStyle,
          maxTravelDistance: data.maxTravelDistance
        }
      });

      return updatedProfile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'update profile' });
    }
  }

  /**
   * Deletes a profile
   * 
   * @param id - Profile ID
   * @returns The deleted profile
   * @throws DatabaseError if deletion fails
   */
  async delete(id: string): Promise<IProfile> {
    try {
      // Delete the profile
      const deletedProfile = await this.prisma.profile.delete({
        where: { id }
      });

      return deletedProfile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'delete profile' });
    }
  }

  /**
   * Searches for profiles based on criteria
   * 
   * @param params - Search parameters
   * @returns Search results with pagination
   * @throws DatabaseError if search fails
   */
  async search(params: IProfileSearchParams): Promise<{ profiles: IProfile[]; total: number; page: number; limit: number; }> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      // Build query filters
      const where: any = {};

      // Apply text search if query is provided
      if (params.query) {
        where.OR = [
          { name: { contains: params.query, mode: 'insensitive' } },
          { bio: { contains: params.query, mode: 'insensitive' } },
          { location: { contains: params.query, mode: 'insensitive' } }
        ];
      }

      // Apply interest filter if provided
      if (params.interests && params.interests.length > 0) {
        where.interests = {
          some: {
            category: {
              in: params.interests
            }
          }
        };
      }

      // Apply communication style filter if provided
      if (params.communicationStyles && params.communicationStyles.length > 0) {
        where.communicationStyle = {
          in: params.communicationStyles
        };
      }

      // Apply personality trait filters if provided
      if (params.personalityTraits && params.personalityTraits.length > 0) {
        where.personalityTraits = {
          some: {
            OR: params.personalityTraits.map(trait => ({
              trait: trait.trait,
              score: {
                gte: trait.minScore,
                lte: trait.maxScore
              }
            }))
          }
        };
      }

      // Apply location-based filtering if coordinates are provided
      if (params.location && params.maxDistance) {
        // Using Prisma's raw SQL capabilities for geospatial queries
        // This assumes PostgreSQL with PostGIS extension
        // In a real implementation, this would use a more sophisticated approach
        // based on the database's geospatial capabilities
        
        const { latitude, longitude } = params.location;
        const maxDistance = params.maxDistance;
        
        // This is a simplified placeholder - actual implementation would depend on database setup
        where.coordinates = { 
          // Example of how this might be handled with a function:
          // distance: { lte: maxDistance }
          // For now, we'll use this as a placeholder
        };
      }

      // Get total count for pagination
      const total = await this.prisma.profile.count({ where });

      // Execute the search query
      const profiles = await this.prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' } // Default order by creation date
      });

      return {
        profiles,
        total,
        page,
        limit
      };
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'search profiles' });
    }
  }

  /**
   * Gets a complete profile with related data
   * 
   * @param id - Profile ID
   * @returns Complete profile data
   * @throws DatabaseError if retrieval fails
   */
  async getComplete(id: string): Promise<IProfileResponse | null> {
    try {
      // Get the profile
      const profile = await this.getById(id);
      if (!profile) {
        return null;
      }

      // Get personality traits and interests
      const personalityTraits = await this.personalityModel.getByProfileId(id);
      const interests = await this.interestModel.getByProfileId(id);

      // Combine into complete profile
      const completeProfile: IProfileResponse = {
        ...profile,
        personalityTraits,
        interests
      };

      return completeProfile;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'get complete profile' });
    }
  }

  /**
   * Updates a profile's location
   * 
   * @param id - Profile ID
   * @param location - Location name
   * @param coordinates - Geographic coordinates
   * @returns The updated profile
   * @throws DatabaseError if update fails
   */
  async updateLocation(id: string, location: string, coordinates: ICoordinates): Promise<IProfile> {
    try {
      // Validate location data
      if (!location || !coordinates || 
          typeof coordinates.latitude !== 'number' || 
          typeof coordinates.longitude !== 'number') {
        throw new Error('Invalid location or coordinates');
      }

      // Update the profile
      const updatedProfile = await this.prisma.profile.update({
        where: { id },
        data: {
          location,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          }
        }
      });

      return updatedProfile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'update location' });
    }
  }

  /**
   * Updates maximum travel distance
   * 
   * @param id - Profile ID
   * @param maxTravelDistance - Maximum travel distance in miles
   * @returns The updated profile
   * @throws DatabaseError if update fails
   */
  async updateMaxTravelDistance(id: string, maxTravelDistance: number): Promise<IProfile> {
    try {
      // Validate travel distance
      if (typeof maxTravelDistance !== 'number' || maxTravelDistance <= 0) {
        throw new Error('Maximum travel distance must be a positive number');
      }

      // Update the profile
      const updatedProfile = await this.prisma.profile.update({
        where: { id },
        data: { maxTravelDistance }
      });

      return updatedProfile;
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'update max travel distance' });
    }
  }

  /**
   * Finds profiles within a specified distance
   * 
   * @param coordinates - Center coordinates
   * @param maxDistance - Maximum distance in miles
   * @param limit - Maximum number of results
   * @returns Array of nearby profiles
   * @throws DatabaseError if search fails
   */
  async findNearby(coordinates: ICoordinates, maxDistance: number, limit = 20): Promise<IProfile[]> {
    try {
      // Validate coordinates and distance
      if (!coordinates || typeof coordinates.latitude !== 'number' || 
          typeof coordinates.longitude !== 'number' || 
          typeof maxDistance !== 'number' || maxDistance <= 0) {
        throw new Error('Invalid coordinates or distance');
      }

      // This is a simplified implementation
      // In a production environment, this would use the database's geospatial capabilities
      // such as PostGIS for PostgreSQL with functions like ST_DWithin

      // Example of how this might be implemented with raw SQL through Prisma:
      // Using $queryRaw to execute geospatial query
      const profiles = await this.prisma.$queryRaw`
        SELECT * FROM "Profile"
        WHERE ST_DWithin(
          ST_MakePoint(coordinates->>'longitude', coordinates->>'latitude')::geography,
          ST_MakePoint(${coordinates.longitude}, ${coordinates.latitude})::geography,
          ${maxDistance * 1609.34}  -- Convert miles to meters
        )
        LIMIT ${limit}
      `;

      return profiles as IProfile[];
    } catch (error) {
      throw DatabaseError.fromPrismaError(error as Error, { operation: 'find nearby profiles' });
    }
  }
}

/**
 * Creates a new user profile in the database
 * 
 * @param profileData - The profile data to create
 * @returns The created profile
 * @throws DatabaseError if creation fails
 */
export async function createProfile(profileData: IProfileCreate): Promise<IProfile> {
  try {
    // Validate required profile data
    if (!profileData.userId || !profileData.name) {
      throw new Error('User ID and name are required for profile creation');
    }

    // Create profile record in database using Prisma
    const profile = await prisma.prisma.profile.create({
      data: {
        userId: profileData.userId,
        name: profileData.name,
        bio: profileData.bio || '',
        location: profileData.location || '',
        coordinates: profileData.coordinates ? {
          latitude: profileData.coordinates.latitude,
          longitude: profileData.coordinates.longitude
        } : null,
        birthdate: profileData.birthdate,
        phoneNumber: profileData.phoneNumber || '',
        avatarUrl: profileData.avatarUrl || '',
        communicationStyle: profileData.communicationStyle || CommunicationStyle.DIRECT,
        maxTravelDistance: profileData.maxTravelDistance || 10 // Default to 10 miles
      }
    });

    // Return the created profile
    return profile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'create profile' });
  }
}

/**
 * Retrieves a profile by its ID
 * 
 * @param id - The profile ID
 * @returns The profile if found, null otherwise
 * @throws DatabaseError if retrieval fails
 */
export async function getProfileById(id: string): Promise<IProfile | null> {
  try {
    // Query the database for a profile with the given ID
    const profile = await prisma.prisma.profile.findUnique({
      where: { id }
    });

    // Return the profile if found, null otherwise
    return profile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'get profile by id' });
  }
}

/**
 * Retrieves a profile by the associated user ID
 * 
 * @param userId - The user ID
 * @returns The profile if found, null otherwise
 * @throws DatabaseError if retrieval fails
 */
export async function getProfileByUserId(userId: string): Promise<IProfile | null> {
  try {
    // Query the database for a profile with the given user ID
    const profile = await prisma.prisma.profile.findUnique({
      where: { userId }
    });

    // Return the profile if found, null otherwise
    return profile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'get profile by user id' });
  }
}

/**
 * Updates an existing profile
 * 
 * @param id - The profile ID
 * @param profileData - The data to update
 * @returns The updated profile
 * @throws DatabaseError if update fails
 */
export async function updateProfile(id: string, profileData: IProfileUpdate): Promise<IProfile> {
  try {
    // Validate profile update data
    if (!id) {
      throw new Error('Profile ID is required');
    }

    // Update profile record in database using Prisma
    const updatedProfile = await prisma.prisma.profile.update({
      where: { id },
      data: {
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        coordinates: profileData.coordinates ? {
          latitude: profileData.coordinates.latitude,
          longitude: profileData.coordinates.longitude
        } : undefined,
        birthdate: profileData.birthdate,
        phoneNumber: profileData.phoneNumber,
        avatarUrl: profileData.avatarUrl,
        communicationStyle: profileData.communicationStyle,
        maxTravelDistance: profileData.maxTravelDistance
      }
    });

    // Return the updated profile
    return updatedProfile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'update profile' });
  }
}

/**
 * Deletes a profile from the database
 * 
 * @param id - The profile ID
 * @returns The deleted profile
 * @throws DatabaseError if deletion fails
 */
export async function deleteProfile(id: string): Promise<IProfile> {
  try {
    // Delete the profile record from the database using Prisma
    const deletedProfile = await prisma.prisma.profile.delete({
      where: { id }
    });

    // Return the deleted profile data
    return deletedProfile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'delete profile' });
  }
}

/**
 * Searches for profiles based on various criteria
 * 
 * @param searchParams - The search parameters
 * @returns Search results with pagination info
 * @throws DatabaseError if search fails
 */
export async function searchProfiles(searchParams: IProfileSearchParams): Promise<{ profiles: IProfile[]; total: number; page: number; limit: number; }> {
  try {
    // Build query filters based on search parameters
    const page = searchParams.page || 1;
    const limit = searchParams.limit || 20;
    const skip = (page - 1) * limit;

    // Prepare where clause for the query
    const where: any = {};

    // Apply text search if query is provided
    if (searchParams.query) {
      where.OR = [
        { name: { contains: searchParams.query, mode: 'insensitive' } },
        { bio: { contains: searchParams.query, mode: 'insensitive' } },
        { location: { contains: searchParams.query, mode: 'insensitive' } }
      ];
    }

    // Apply interest filter if provided
    if (searchParams.interests && searchParams.interests.length > 0) {
      where.interests = {
        some: {
          category: {
            in: searchParams.interests
          }
        }
      };
    }

    // Apply communication style filter if provided
    if (searchParams.communicationStyles && searchParams.communicationStyles.length > 0) {
      where.communicationStyle = {
        in: searchParams.communicationStyles
      };
    }

    // Apply personality trait filters if provided
    if (searchParams.personalityTraits && searchParams.personalityTraits.length > 0) {
      where.personalityTraits = {
        some: {
          OR: searchParams.personalityTraits.map(trait => ({
            trait: trait.trait,
            score: {
              gte: trait.minScore,
              lte: trait.maxScore
            }
          }))
        }
      };
    }

    // Apply location-based filtering if coordinates provided
    if (searchParams.location && searchParams.maxDistance) {
      // In a real implementation, this would use the database's geospatial capabilities
      // This is a placeholder for the actual implementation
    }

    // Execute count query for total results
    const total = await prisma.prisma.profile.count({ where });

    // Execute search query with filters and pagination
    const profiles = await prisma.prisma.profile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' } // Default order by creation date
    });

    // Return profiles with pagination metadata
    return {
      profiles,
      total,
      page,
      limit
    };
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'search profiles' });
  }
}

/**
 * Retrieves a complete profile with personality traits and interests
 * 
 * @param id - The profile ID
 * @returns Complete profile data if found, null otherwise
 * @throws DatabaseError if retrieval fails
 */
export async function getCompleteProfile(id: string): Promise<IProfileResponse | null> {
  try {
    // Retrieve the base profile by ID
    const profile = await getProfileById(id);
    
    // If profile not found, return null
    if (!profile) {
      return null;
    }

    // Retrieve personality traits using PersonalityModel
    const personalityModel = new PersonalityModel();
    const personalityTraits = await personalityModel.getByProfileId(id);

    // Retrieve interests using InterestModel
    const interestModel = new InterestModel();
    const interests = await interestModel.getByProfileId(id);

    // Combine data into a complete profile response
    const completeProfile: IProfileResponse = {
      ...profile,
      personalityTraits,
      interests
    };

    // Return the complete profile
    return completeProfile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'get complete profile' });
  }
}

/**
 * Updates a profile's location information
 * 
 * @param id - The profile ID
 * @param location - The location string
 * @param coordinates - The geographic coordinates
 * @returns The updated profile
 * @throws DatabaseError if update fails
 */
export async function updateLocation(id: string, location: string, coordinates: ICoordinates): Promise<IProfile> {
  try {
    // Validate location data
    if (!location || !coordinates || 
        typeof coordinates.latitude !== 'number' || 
        typeof coordinates.longitude !== 'number') {
      throw new Error('Invalid location or coordinates');
    }

    // Update profile's location and coordinates in database
    const updatedProfile = await prisma.prisma.profile.update({
      where: { id },
      data: {
        location,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        }
      }
    });

    // Return the updated profile
    return updatedProfile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'update location' });
  }
}

/**
 * Updates a profile's maximum travel distance preference
 * 
 * @param id - The profile ID
 * @param maxTravelDistance - The maximum travel distance in miles
 * @returns The updated profile
 * @throws DatabaseError if update fails
 */
export async function updateMaxTravelDistance(id: string, maxTravelDistance: number): Promise<IProfile> {
  try {
    // Validate travel distance value (must be positive)
    if (typeof maxTravelDistance !== 'number' || maxTravelDistance <= 0) {
      throw new Error('Maximum travel distance must be a positive number');
    }

    // Update profile's maxTravelDistance in database
    const updatedProfile = await prisma.prisma.profile.update({
      where: { id },
      data: { maxTravelDistance }
    });

    // Return the updated profile
    return updatedProfile;
  } catch (error) {
    // Handle any database errors and throw a DatabaseError
    throw DatabaseError.fromPrismaError(error as Error, { operation: 'update max travel distance' });
  }
}

export {
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
};