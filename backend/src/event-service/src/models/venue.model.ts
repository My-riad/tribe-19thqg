import { PrismaClient } from '@prisma/client'; // ^4.16.0
import NodeCache from 'node-cache'; // ^5.1.2
import { IVenue } from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';
import GooglePlacesIntegration from '../integrations/google-places.integration';

/**
 * Model class for managing venue data and operations in the Tribe platform.
 * Provides methods for venue retrieval, creation, updating, and searching.
 * Integrates with Google Places API for external venue data and implements
 * caching for performance optimization.
 */
export class VenueModel {
  private prisma: PrismaClient;
  private cache: NodeCache;
  private googlePlacesIntegration: GooglePlacesIntegration;

  /**
   * Initializes a new instance of the VenueModel class
   */
  constructor() {
    this.prisma = new PrismaClient();
    // Initialize cache with TTL of 24 hours and check period of 1 hour
    this.cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
    this.googlePlacesIntegration = new GooglePlacesIntegration();
  }

  /**
   * Retrieves a venue by its ID
   * 
   * @param id - The venue ID
   * @returns The venue if found, null otherwise
   */
  async getVenueById(id: string): Promise<IVenue | null> {
    try {
      // Check cache first
      const cacheKey = `venue:id:${id}`;
      const cachedVenue = this.cache.get<IVenue>(cacheKey);
      
      if (cachedVenue) {
        logger.debug(`Venue with ID ${id} found in cache`);
        return cachedVenue;
      }

      // If not in cache, query the database
      const venue = await this.prisma.venue.findUnique({
        where: { id }
      });

      // If venue not found, return null
      if (!venue) {
        return null;
      }

      // Convert database model to IVenue interface
      const venueData: IVenue = {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: JSON.parse(venue.coordinates as string),
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity || 0,
        priceLevel: venue.priceLevel || 0,
        rating: venue.rating || 0,
        photos: venue.photos ? JSON.parse(venue.photos) : [],
        categories: venue.categories ? JSON.parse(venue.categories) : [],
        metadata: venue.metadata ? JSON.parse(venue.metadata) : {}
      };

      // Store in cache and return
      this.cache.set(cacheKey, venueData);
      return venueData;
    } catch (error) {
      logger.error(`Error retrieving venue with ID ${id}`, error as Error);
      throw ApiError.internal(`Failed to retrieve venue: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves a venue by its Google Place ID
   * 
   * @param placeId - The Google Place ID
   * @returns The venue if found, null otherwise
   */
  async getVenueByPlaceId(placeId: string): Promise<IVenue | null> {
    try {
      // Check cache first
      const cacheKey = `venue:placeId:${placeId}`;
      const cachedVenue = this.cache.get<IVenue>(cacheKey);
      
      if (cachedVenue) {
        logger.debug(`Venue with Place ID ${placeId} found in cache`);
        return cachedVenue;
      }

      // If not in cache, query the database
      const venue = await this.prisma.venue.findFirst({
        where: { placeId }
      });

      // If venue found in database, cache and return
      if (venue) {
        const venueData: IVenue = {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          coordinates: JSON.parse(venue.coordinates as string),
          placeId: venue.placeId,
          website: venue.website || '',
          phoneNumber: venue.phoneNumber || '',
          capacity: venue.capacity || 0,
          priceLevel: venue.priceLevel || 0,
          rating: venue.rating || 0,
          photos: venue.photos ? JSON.parse(venue.photos) : [],
          categories: venue.categories ? JSON.parse(venue.categories) : [],
          metadata: venue.metadata ? JSON.parse(venue.metadata) : {}
        };

        this.cache.set(cacheKey, venueData);
        this.cache.set(`venue:id:${venue.id}`, venueData);
        return venueData;
      }

      // If not in database, try to fetch from Google Places API
      try {
        // Fetch venue details from Google Places API
        const venueFromGoogle = await this.googlePlacesIntegration.getPlaceDetails(placeId);
        
        if (!venueFromGoogle) {
          return null;
        }

        // Save to database
        const savedVenue = await this.createVenue(venueFromGoogle);
        return savedVenue;
      } catch (googleError) {
        logger.error(`Error fetching venue from Google Places API for place ID ${placeId}`, googleError as Error);
        return null;
      }
    } catch (error) {
      logger.error(`Error retrieving venue with Place ID ${placeId}`, error as Error);
      throw ApiError.internal(`Failed to retrieve venue by place ID: ${(error as Error).message}`);
    }
  }

  /**
   * Searches for venues based on various criteria
   * 
   * @param searchParams - The search parameters including query, location, filters, and pagination
   * @returns Object containing venues and total count
   */
  async searchVenues(searchParams: {
    query?: string;
    coordinates?: ICoordinates;
    radius?: number;
    categories?: InterestCategory[];
    priceLevel?: number[];
    capacity?: { min?: number; max?: number };
    page?: number;
    limit?: number;
  }): Promise<{ venues: IVenue[], total: number }> {
    try {
      const {
        query,
        coordinates,
        radius = 10, // Default 10 miles
        categories,
        priceLevel,
        capacity,
        page = 1,
        limit = 20
      } = searchParams;

      // Validate search parameters
      if (page < 1) {
        throw ApiError.badRequest('Page must be greater than or equal to 1');
      }

      if (limit < 1 || limit > 100) {
        throw ApiError.badRequest('Limit must be between 1 and 100');
      }

      // Build where clause for database query
      const where: any = {};

      // Add text search if query provided
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Add location-based filtering if coordinates provided
      if (coordinates) {
        // Note: In a real implementation, use a geospatial query with PostGIS
        // This is a simplified approach
        logger.debug(`Location filtering would be applied here with radius: ${radius} miles`);
      }

      // Add category filtering if provided
      if (categories && categories.length > 0) {
        // Note: In a real implementation, use JSONB containment operators
        // This is a simplified approach
        where.categories = {
          contains: JSON.stringify(categories)
        };
      }

      // Add price level filtering if provided
      if (priceLevel && priceLevel.length > 0) {
        where.priceLevel = { in: priceLevel };
      }

      // Add capacity filtering if provided
      if (capacity) {
        if (capacity.min !== undefined) {
          where.capacity = { ...where.capacity, gte: capacity.min };
        }
        if (capacity.max !== undefined) {
          where.capacity = { ...where.capacity, lte: capacity.max };
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute count query
      const total = await this.prisma.venue.count({ where });

      // Execute the main query with pagination
      const venues = await this.prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });

      // Convert database models to IVenue interface
      const venueData: IVenue[] = venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: JSON.parse(venue.coordinates as string),
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity || 0,
        priceLevel: venue.priceLevel || 0,
        rating: venue.rating || 0,
        photos: venue.photos ? JSON.parse(venue.photos) : [],
        categories: venue.categories ? JSON.parse(venue.categories) : [],
        metadata: venue.metadata ? JSON.parse(venue.metadata) : {}
      }));

      // If we don't have enough results from the database and coordinates were provided,
      // supplement with results from Google Places API
      if (venueData.length < limit && coordinates && query) {
        try {
          // Calculate how many more venues we need
          const remaining = limit - venueData.length;
          
          // Search for venues using Google Places API
          const additionalVenues = await this.googlePlacesIntegration.searchText(query, {
            coordinates,
            radius: radius * 1609.34 // Convert miles to meters
          });
          
          // Filter out venues that we already have (based on placeId)
          const existingPlaceIds = venueData.map(v => v.placeId);
          const newVenues = additionalVenues.filter(v => !existingPlaceIds.includes(v.placeId));
          
          // Add up to 'remaining' venues
          const additionalVenueData = newVenues.slice(0, remaining);
          
          // Cache and potentially save these venues to the database
          for (const venue of additionalVenueData) {
            this.cache.set(`venue:placeId:${venue.placeId}`, venue);
            // Optionally, save to database in the background
            this.createVenue(venue).catch(error => {
              logger.error(`Failed to save venue from search results: ${venue.name}`, error as Error);
            });
          }
          
          // Combine results
          venueData.push(...additionalVenueData);
        } catch (googleError) {
          logger.error('Error supplementing venue search with Google Places API', googleError as Error);
          // Continue with just the database results if Google Places API fails
        }
      }

      return {
        venues: venueData,
        total
      };
    } catch (error) {
      logger.error('Error searching venues', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to search venues: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves venues near a specific location
   * 
   * @param coordinates - The geographical coordinates to search around
   * @param radius - The search radius in miles
   * @param options - Additional search options
   * @returns Object containing venues and total count
   */
  async getVenuesByLocation(
    coordinates: ICoordinates,
    radius: number = 10,
    options: {
      categories?: InterestCategory[];
      priceLevel?: number[];
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ venues: IVenue[], total: number }> {
    try {
      // Validate coordinates
      if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        throw ApiError.badRequest('Invalid coordinates provided');
      }

      // Validate radius
      if (radius <= 0 || radius > 50) {
        throw ApiError.badRequest('Radius must be between 0 and 50 miles');
      }

      const {
        categories,
        priceLevel,
        page = 1,
        limit = 20
      } = options;

      // Check cache for this location query
      const cacheKey = `venues:location:${coordinates.latitude},${coordinates.longitude}:${radius}:${JSON.stringify(options)}`;
      const cachedResult = this.cache.get<{ venues: IVenue[], total: number }>(cacheKey);
      
      if (cachedResult) {
        logger.debug(`Returning cached venues for location (${coordinates.latitude}, ${coordinates.longitude})`);
        return cachedResult;
      }

      // Execute query against Google Places API
      const venues = await this.googlePlacesIntegration.searchNearby(coordinates, {
        radius: radius * 1609.34, // Convert miles to meters
        type: categories ? categories.join('|').toLowerCase() : undefined
      });

      // Filter results based on additional criteria
      let filteredVenues = venues;
      
      if (priceLevel && priceLevel.length > 0) {
        filteredVenues = filteredVenues.filter(venue => 
          priceLevel.includes(venue.priceLevel)
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVenues = filteredVenues.slice(startIndex, endIndex);

      // Cache the results
      const result = {
        venues: paginatedVenues,
        total: filteredVenues.length
      };
      
      this.cache.set(cacheKey, result);
      
      // Optionally save these venues to the database in the background
      for (const venue of paginatedVenues) {
        this.cache.set(`venue:placeId:${venue.placeId}`, venue);
        
        // Check if venue already exists in database before saving
        this.getVenueByPlaceId(venue.placeId).catch(() => {
          // If retrieval fails, try to create the venue
          this.createVenue(venue).catch(error => {
            logger.error(`Failed to save venue from location search: ${venue.name}`, error as Error);
          });
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Error retrieving venues by location`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to retrieve venues by location: ${(error as Error).message}`);
    }
  }

  /**
   * Creates a new venue with the provided data
   * 
   * @param venueData - The venue data to create
   * @returns The created venue
   */
  async createVenue(venueData: IVenue): Promise<IVenue> {
    try {
      // Validate required fields
      if (!venueData.name || !venueData.address) {
        throw ApiError.badRequest('Venue name and address are required');
      }

      // Check if venue with same place ID already exists
      if (venueData.placeId) {
        const existingVenue = await this.prisma.venue.findFirst({
          where: { placeId: venueData.placeId }
        });

        if (existingVenue) {
          // Update the venue instead of creating a new one
          return this.updateVenue(existingVenue.id, venueData);
        }
      }

      // Create new venue record
      const venue = await this.prisma.venue.create({
        data: {
          name: venueData.name,
          address: venueData.address,
          coordinates: JSON.stringify(venueData.coordinates),
          placeId: venueData.placeId || '',
          website: venueData.website || '',
          phoneNumber: venueData.phoneNumber || '',
          capacity: venueData.capacity || 0,
          priceLevel: venueData.priceLevel || 0,
          rating: venueData.rating || 0,
          photos: JSON.stringify(venueData.photos || []),
          categories: JSON.stringify(venueData.categories || []),
          metadata: JSON.stringify(venueData.metadata || {})
        }
      });

      // Convert to IVenue format
      const createdVenue: IVenue = {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: venueData.coordinates,
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity || 0,
        priceLevel: venue.priceLevel || 0,
        rating: venue.rating || 0,
        photos: venueData.photos || [],
        categories: venueData.categories || [],
        metadata: venueData.metadata || {}
      };

      // Cache the new venue
      this.cache.set(`venue:id:${venue.id}`, createdVenue);
      if (venue.placeId) {
        this.cache.set(`venue:placeId:${venue.placeId}`, createdVenue);
      }

      logger.info(`Created new venue: ${venue.name} (${venue.id})`);
      return createdVenue;
    } catch (error) {
      logger.error('Error creating venue', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to create venue: ${(error as Error).message}`);
    }
  }

  /**
   * Updates an existing venue
   * 
   * @param id - The ID of the venue to update
   * @param venueData - The updated venue data
   * @returns The updated venue
   */
  async updateVenue(id: string, venueData: Partial<IVenue>): Promise<IVenue> {
    try {
      // Check if the venue exists
      const existingVenue = await this.prisma.venue.findUnique({
        where: { id }
      });

      if (!existingVenue) {
        throw ApiError.notFound(`Venue with ID ${id} not found`);
      }

      // Update the venue
      const venue = await this.prisma.venue.update({
        where: { id },
        data: {
          name: venueData.name !== undefined ? venueData.name : existingVenue.name,
          address: venueData.address !== undefined ? venueData.address : existingVenue.address,
          coordinates: venueData.coordinates !== undefined 
            ? JSON.stringify(venueData.coordinates) 
            : existingVenue.coordinates,
          placeId: venueData.placeId !== undefined ? venueData.placeId : existingVenue.placeId,
          website: venueData.website !== undefined ? venueData.website : existingVenue.website,
          phoneNumber: venueData.phoneNumber !== undefined 
            ? venueData.phoneNumber 
            : existingVenue.phoneNumber,
          capacity: venueData.capacity !== undefined ? venueData.capacity : existingVenue.capacity,
          priceLevel: venueData.priceLevel !== undefined 
            ? venueData.priceLevel 
            : existingVenue.priceLevel,
          rating: venueData.rating !== undefined ? venueData.rating : existingVenue.rating,
          photos: venueData.photos !== undefined 
            ? JSON.stringify(venueData.photos) 
            : existingVenue.photos,
          categories: venueData.categories !== undefined 
            ? JSON.stringify(venueData.categories) 
            : existingVenue.categories,
          metadata: venueData.metadata !== undefined 
            ? JSON.stringify(venueData.metadata) 
            : existingVenue.metadata
        }
      });

      // Convert to IVenue format
      const updatedVenue: IVenue = {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: JSON.parse(venue.coordinates as string),
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity || 0,
        priceLevel: venue.priceLevel || 0,
        rating: venue.rating || 0,
        photos: venue.photos ? JSON.parse(venue.photos) : [],
        categories: venue.categories ? JSON.parse(venue.categories) : [],
        metadata: venue.metadata ? JSON.parse(venue.metadata) : {}
      };

      // Update cache
      this.cache.set(`venue:id:${venue.id}`, updatedVenue);
      if (venue.placeId) {
        this.cache.set(`venue:placeId:${venue.placeId}`, updatedVenue);
      }

      logger.info(`Updated venue: ${venue.name} (${venue.id})`);
      return updatedVenue;
    } catch (error) {
      logger.error(`Error updating venue with ID ${id}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to update venue: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a venue
   * 
   * @param id - The ID of the venue to delete
   * @returns True if the venue was deleted, false otherwise
   */
  async deleteVenue(id: string): Promise<boolean> {
    try {
      // Check if the venue exists
      const existingVenue = await this.prisma.venue.findUnique({
        where: { id }
      });

      if (!existingVenue) {
        throw ApiError.notFound(`Venue with ID ${id} not found`);
      }

      // Check if venue is referenced by any events
      const eventCount = await this.getVenueUsageCount(id);
      if (eventCount > 0) {
        throw ApiError.badRequest(`Cannot delete venue with ID ${id} as it is used by ${eventCount} events`);
      }

      // Delete the venue
      await this.prisma.venue.delete({
        where: { id }
      });

      // Clear from cache
      this.cache.del(`venue:id:${id}`);
      if (existingVenue.placeId) {
        this.cache.del(`venue:placeId:${existingVenue.placeId}`);
      }

      logger.info(`Deleted venue: ${existingVenue.name} (${id})`);
      return true;
    } catch (error) {
      logger.error(`Error deleting venue with ID ${id}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to delete venue: ${(error as Error).message}`);
    }
  }

  /**
   * Gets detailed information about a venue
   * 
   * @param id - The ID of the venue
   * @returns Detailed venue information
   */
  async getVenueDetails(id: string): Promise<IVenue> {
    try {
      // Get basic venue data
      const venue = await this.getVenueById(id);
      if (!venue) {
        throw ApiError.notFound(`Venue with ID ${id} not found`);
      }

      // If the venue has a place ID, fetch additional details from Google Places
      if (venue.placeId) {
        try {
          const venueDetails = await this.googlePlacesIntegration.getPlaceDetails(venue.placeId);
          
          // Merge additional details with basic venue data
          const enhancedVenue: IVenue = {
            ...venue,
            // Override with more up-to-date information from Google
            website: venueDetails.website || venue.website,
            phoneNumber: venueDetails.phoneNumber || venue.phoneNumber,
            rating: venueDetails.rating || venue.rating,
            photos: venueDetails.photos.length > 0 ? venueDetails.photos : venue.photos,
            metadata: {
              ...venue.metadata,
              ...venueDetails.metadata,
              last_refreshed: new Date().toISOString()
            }
          };

          // Update venue in database and cache
          await this.updateVenue(id, enhancedVenue);
          return enhancedVenue;
        } catch (googleError) {
          logger.error(`Error fetching additional venue details from Google Places for venue ${id}`, googleError as Error);
          // Continue with basic venue data if Google Places API fails
        }
      }

      return venue;
    } catch (error) {
      logger.error(`Error getting venue details for venue ${id}`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to get venue details: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves popular venues based on usage and ratings
   * 
   * @param options - Search options
   * @returns Object containing venues and total count
   */
  async getPopularVenues(
    options: {
      coordinates?: ICoordinates;
      radius?: number;
      categories?: InterestCategory[];
      limit?: number;
      page?: number;
    } = {}
  ): Promise<{ venues: IVenue[], total: number }> {
    try {
      const {
        coordinates,
        radius = 10,
        categories,
        limit = 20,
        page = 1
      } = options;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Add location filtering if coordinates provided
      if (coordinates) {
        // In a real implementation, use geospatial query here
        logger.debug(`Location filtering would be applied here with radius: ${radius} miles`);
      }

      // Add category filtering if provided
      if (categories && categories.length > 0) {
        // In a real implementation with JSONB support:
        where.categories = {
          contains: JSON.stringify(categories)
        };
      }

      // Query for venues, ordered by rating (popularity)
      const venues = await this.prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { rating: 'desc' },  // Higher rated venues first
          { name: 'asc' }      // Then alphabetically
        ]
      });

      // Count total results for pagination
      const total = await this.prisma.venue.count({ where });

      // Convert database models to IVenue interface
      const venueData: IVenue[] = venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: JSON.parse(venue.coordinates as string),
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity || 0,
        priceLevel: venue.priceLevel || 0,
        rating: venue.rating || 0,
        photos: venue.photos ? JSON.parse(venue.photos) : [],
        categories: venue.categories ? JSON.parse(venue.categories) : [],
        metadata: venue.metadata ? JSON.parse(venue.metadata) : {}
      }));

      return {
        venues: venueData,
        total
      };
    } catch (error) {
      logger.error('Error retrieving popular venues', error as Error);
      throw ApiError.internal(`Failed to retrieve popular venues: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieves venues by category
   * 
   * @param category - The interest category to filter by
   * @param options - Additional search options
   * @returns Object containing venues and total count
   */
  async getVenuesByCategory(
    category: InterestCategory,
    options: {
      coordinates?: ICoordinates;
      radius?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ venues: IVenue[], total: number }> {
    try {
      const {
        coordinates,
        radius = 10,
        page = 1,
        limit = 20
      } = options;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      
      // Add category filtering
      // In a real implementation with JSONB support:
      where.categories = {
        contains: JSON.stringify([category])
      };

      // Add location filtering if coordinates provided
      if (coordinates) {
        // In a real implementation, use geospatial query here
        logger.debug(`Location filtering would be applied here with radius: ${radius} miles`);
      }

      // Execute query
      const venues = await this.prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });

      // Count total results for pagination
      const total = await this.prisma.venue.count({ where });

      // Convert database models to IVenue interface
      const venueData: IVenue[] = venues.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: JSON.parse(venue.coordinates as string),
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity || 0,
        priceLevel: venue.priceLevel || 0,
        rating: venue.rating || 0,
        photos: venue.photos ? JSON.parse(venue.photos) : [],
        categories: venue.categories ? JSON.parse(venue.categories) : [],
        metadata: venue.metadata ? JSON.parse(venue.metadata) : {}
      }));

      return {
        venues: venueData,
        total
      };
    } catch (error) {
      logger.error(`Error retrieving venues by category: ${category}`, error as Error);
      throw ApiError.internal(`Failed to retrieve venues by category: ${(error as Error).message}`);
    }
  }

  /**
   * Gets the number of events that have used a venue
   * 
   * @param venueId - The venue ID
   * @returns Number of events using the venue
   */
  async getVenueUsageCount(venueId: string): Promise<number> {
    try {
      // Count events that use this venue
      const count = await this.prisma.event.count({
        where: { venueId }
      });
      
      return count;
    } catch (error) {
      logger.error(`Error getting usage count for venue ${venueId}`, error as Error);
      throw ApiError.internal(`Failed to get venue usage count: ${(error as Error).message}`);
    }
  }

  /**
   * Refreshes venue data from Google Places API
   * 
   * @param id - The ID of the venue to refresh
   * @returns The refreshed venue if successful, null otherwise
   */
  async refreshVenueFromGooglePlaces(id: string): Promise<IVenue | null> {
    try {
      // Get venue to retrieve place ID
      const venue = await this.getVenueById(id);
      if (!venue) {
        throw ApiError.notFound(`Venue with ID ${id} not found`);
      }

      // If no place ID, cannot refresh from Google Places
      if (!venue.placeId) {
        throw ApiError.badRequest(`Venue with ID ${id} has no Google Place ID`);
      }

      // Fetch fresh data from Google Places API
      const freshVenueData = await this.googlePlacesIntegration.getPlaceDetails(venue.placeId);
      
      // Update venue with fresh data
      const updatedVenue = await this.updateVenue(id, {
        name: freshVenueData.name,
        address: freshVenueData.address,
        coordinates: freshVenueData.coordinates,
        website: freshVenueData.website,
        phoneNumber: freshVenueData.phoneNumber,
        priceLevel: freshVenueData.priceLevel,
        rating: freshVenueData.rating,
        photos: freshVenueData.photos,
        categories: freshVenueData.categories,
        metadata: {
          ...freshVenueData.metadata,
          last_refreshed: new Date().toISOString()
        }
      });

      logger.info(`Refreshed venue data from Google Places: ${venue.name} (${id})`);
      return updatedVenue;
    } catch (error) {
      logger.error(`Error refreshing venue ${id} from Google Places`, error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to refresh venue from Google Places: ${(error as Error).message}`);
    }
  }

  /**
   * Imports multiple venues from Google Places API based on search criteria
   * 
   * @param searchParams - The search parameters for venue import
   * @returns Number of venues imported
   */
  async importVenuesFromGooglePlaces(searchParams: {
    query?: string;
    coordinates: ICoordinates;
    radius?: number;
    type?: string;
  }): Promise<number> {
    try {
      const { query, coordinates, radius = 10, type } = searchParams;

      // Validate required parameters
      if (!coordinates) {
        throw ApiError.badRequest('Coordinates are required for venue import');
      }

      // Build search options
      const searchOptions: any = {
        coordinates,
        radius: radius * 1609.34 // Convert miles to meters
      };

      if (type) {
        searchOptions.type = type;
      }

      // Execute search
      let venues: IVenue[];
      if (query) {
        venues = await this.googlePlacesIntegration.searchText(query, searchOptions);
      } else {
        venues = await this.googlePlacesIntegration.searchNearby(coordinates, searchOptions);
      }

      // Process each venue
      const importedVenues: string[] = [];
      for (const venue of venues) {
        try {
          // Check if venue already exists
          const existingVenue = await this.prisma.venue.findFirst({
            where: { placeId: venue.placeId }
          });

          if (existingVenue) {
            // Update existing venue
            await this.updateVenue(existingVenue.id, venue);
            importedVenues.push(existingVenue.id);
          } else {
            // Create new venue
            const createdVenue = await this.createVenue(venue);
            importedVenues.push(createdVenue.id);
          }
        } catch (venueError) {
          logger.error(`Error importing venue: ${venue.name}`, venueError as Error);
          // Continue with next venue
        }
      }

      logger.info(`Imported ${importedVenues.length} venues from Google Places API`);
      return importedVenues.length;
    } catch (error) {
      logger.error('Error importing venues from Google Places', error as Error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal(`Failed to import venues from Google Places: ${(error as Error).message}`);
    }
  }

  /**
   * Clears the venue cache
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Venue cache cleared');
  }
}

export default VenueModel;