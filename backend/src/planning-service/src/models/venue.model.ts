import { ValidationError } from '../../../shared/src/errors/validation.error';
import { ApiError } from '../../../shared/src/errors/api.error';
import { IVenue } from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { logger } from '../../../shared/src/utils/logger.util';
import { PrismaClient } from '@prisma/client'; // ^4.16.0
import { AIOrchestrationClient } from '@tribe/ai-orchestration-client'; // ^1.0.0
import axios from 'axios'; // ^1.4.0

/**
 * Interface defining parameters for searching venues
 */
export interface IVenueSearchParams {
  query?: string;
  location?: ICoordinates;
  radius?: number;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  venueTypes?: string[];
  page?: number;
  limit?: number;
}

/**
 * Interface defining parameters for calculating venue suitability
 */
export interface IVenueSuitabilityParams {
  groupSize: number;
  preferredLocation: ICoordinates;
  budgetRange: { min: number, max: number };
  accessibilityRequirements: string[];
  weights: {
    distance: number;
    capacity: number;
    budget: number;
    accessibility: number;
  };
}

/**
 * Interface defining venue with calculated suitability scores
 */
export interface IVenueSuitability {
  venue: IVenue;
  distanceScore: number;
  capacityScore: number;
  budgetScore: number;
  accessibilityScore: number;
  overallScore: number;
  aiRecommended: boolean;
  recommendationReason: string;
}

/**
 * Interface defining parameters for venue recommendations
 */
export interface IVenueRecommendationParams {
  tribeId: string;
  eventId: string;
  groupSize: number;
  preferredLocation: ICoordinates;
  maxDistance: number;
  budgetRange: { min: number, max: number };
  venueTypes: string[];
  accessibilityRequirements: string[];
  limit: number;
}

/**
 * Interface defining detailed venue information structure
 */
export interface IVenueDetails {
  id: string;
  name: string;
  address: string;
  coordinates: ICoordinates;
  placeId: string;
  website: string;
  phoneNumber: string;
  capacity: number;
  priceLevel: number;
  rating: number;
  photos: string[];
  categories: InterestCategory[];
  hours: { [day: string]: { open: string, close: string } };
  amenities: string[];
  accessibilityFeatures: string[];
  reviews: Array<{ rating: number, text: string, author: string, date: Date }>;
  metadata: Record<string, any>;
}

/**
 * Interface defining transportation option to a venue
 */
export interface ITransportationOption {
  mode: string;
  duration: number;
  distance: number;
  cost: number;
  route: ICoordinates[];
  instructions: string[];
}

/**
 * Model class for managing venue data and operations
 */
export class VenueModel {
  private prisma: PrismaClient;
  private aiClient: AIOrchestrationClient;
  private httpClient: typeof axios;

  /**
   * Initializes a new instance of the VenueModel class
   */
  constructor() {
    // Initialize the Prisma client for database operations
    this.prisma = new PrismaClient();
    
    // Initialize the AI Orchestration client for AI-powered venue recommendations
    this.aiClient = new AIOrchestrationClient();
    
    // Initialize the HTTP client for external venue API integrations
    this.httpClient = axios;
  }

  /**
   * Retrieves a venue by its ID
   * 
   * @param id - Venue ID to retrieve
   * @returns The venue if found, null otherwise
   */
  async getVenueById(id: string): Promise<IVenue | null> {
    try {
      // Validate the venue ID
      if (!id) {
        throw ValidationError.invalidInput('Venue ID is required');
      }

      logger.debug(`Retrieving venue with ID: ${id}`);
      
      // Query the database for the venue with the given ID
      const venue = await this.prisma.venue.findUnique({
        where: { id }
      });

      if (!venue) {
        logger.debug(`Venue with ID ${id} not found`);
        return null;
      }

      // Transform database model to interface format
      return this.transformVenueData(venue);
    } catch (error) {
      logger.error(`Error retrieving venue by ID: ${id}`, error as Error);
      throw error;
    }
  }

  /**
   * Searches for venues based on search parameters
   * 
   * @param searchParams - Parameters for venue search
   * @returns Search results with pagination info
   */
  async searchVenues(searchParams: IVenueSearchParams): Promise<{ venues: IVenue[], total: number }> {
    try {
      // Validate the search parameters
      this.validateSearchParams(searchParams);

      logger.debug('Searching venues with params', { searchParams });
      
      const {
        query,
        location,
        radius = 10,
        minCapacity,
        maxCapacity,
        minPrice,
        maxPrice,
        venueTypes,
        page = 1,
        limit = 20
      } = searchParams;

      // Build the database query based on search parameters
      const where: any = {};
      
      // Add text search if query is provided
      if (query) {
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } }
        ];
      }
      
      // Add capacity filters
      if (minCapacity !== undefined) {
        where.capacity = { ...where.capacity, gte: minCapacity };
      }
      
      if (maxCapacity !== undefined) {
        where.capacity = { ...where.capacity, lte: maxCapacity };
      }
      
      // Add price filters
      if (minPrice !== undefined) {
        where.priceLevel = { ...where.priceLevel, gte: minPrice };
      }
      
      if (maxPrice !== undefined) {
        where.priceLevel = { ...where.priceLevel, lte: maxPrice };
      }
      
      // Add venue type filters
      if (venueTypes && venueTypes.length > 0) {
        where.categories = { hasSome: venueTypes };
      }
      
      // Add location-based search if coordinates are provided
      if (location) {
        const boundingBox = this.calculateBoundingBox(location, radius);
        where.AND = [
          { coordinates: { latitude: { gte: boundingBox.minLat } } },
          { coordinates: { latitude: { lte: boundingBox.maxLat } } },
          { coordinates: { longitude: { gte: boundingBox.minLng } } },
          { coordinates: { longitude: { lte: boundingBox.maxLng } } }
        ];
      }

      // Calculate pagination values
      const skip = (page - 1) * limit;
      
      // Execute the query to get venues and total count
      const [venues, total] = await Promise.all([
        this.prisma.venue.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' }
        }),
        this.prisma.venue.count({ where })
      ]);

      logger.debug(`Found ${venues.length} venues out of ${total} total`);
      
      // Transform database results to interface format
      const transformedVenues = venues.map(venue => this.transformVenueData(venue));
      
      return {
        venues: transformedVenues,
        total
      };
    } catch (error) {
      logger.error('Error searching venues', error as Error);
      throw error;
    }
  }

  /**
   * Finds venues near a specific location
   * 
   * @param coordinates - Center point for location search
   * @param radius - Search radius in miles
   * @param options - Additional search options
   * @returns Venues near the specified location
   */
  async findVenuesByLocation(
    coordinates: ICoordinates,
    radius: number = 10,
    options: Record<string, any> = {}
  ): Promise<{ venues: IVenue[], total: number }> {
    try {
      // Validate the location parameters
      if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        throw ValidationError.invalidInput('Valid coordinates are required');
      }
      
      if (radius <= 0 || radius > 50) {
        throw ValidationError.invalidRange('radius', 1, 50);
      }

      logger.debug(`Finding venues near location`, { coordinates, radius, options });
      
      // Calculate the bounding box for the given coordinates and radius
      const boundingBox = this.calculateBoundingBox(coordinates, radius);
      
      // Build the query with the bounding box
      const where: any = {
        AND: [
          { coordinates: { latitude: { gte: boundingBox.minLat } } },
          { coordinates: { latitude: { lte: boundingBox.maxLat } } },
          { coordinates: { longitude: { gte: boundingBox.minLng } } },
          { coordinates: { longitude: { lte: boundingBox.maxLng } } }
        ]
      };
      
      // Add venue type filter if specified
      if (options.venueTypes && Array.isArray(options.venueTypes) && options.venueTypes.length > 0) {
        where.categories = { hasSome: options.venueTypes };
      }
      
      // Add capacity filters if specified
      if (options.minCapacity !== undefined) {
        where.capacity = { ...where.capacity, gte: options.minCapacity };
      }
      
      if (options.maxCapacity !== undefined) {
        where.capacity = { ...where.capacity, lte: options.maxCapacity };
      }
      
      // Add price level filters if specified
      if (options.minPrice !== undefined) {
        where.priceLevel = { ...where.priceLevel, gte: options.minPrice };
      }
      
      if (options.maxPrice !== undefined) {
        where.priceLevel = { ...where.priceLevel, lte: options.maxPrice };
      }
      
      // Set pagination options
      const skip = options.page && options.page > 0 ? (options.page - 1) * (options.limit || 20) : 0;
      const take = options.limit || 20;
      
      // Query the database for venues within the bounding box
      const [venues, total] = await Promise.all([
        this.prisma.venue.findMany({
          where,
          skip,
          take,
          orderBy: [
            { rating: 'desc' },
            { name: 'asc' }
          ]
        }),
        this.prisma.venue.count({ where })
      ]);
      
      logger.debug(`Found ${venues.length} venues within ${radius} miles`);
      
      // Transform database results and calculate exact distances
      const transformedVenues = venues.map(venue => {
        const venueData = this.transformVenueData(venue);
        
        // Calculate exact distance for each venue
        if (venueData.coordinates) {
          const distance = this.calculateDistance(coordinates, venueData.coordinates);
          // Filter out venues that are outside the exact radius
          // The bounding box is an approximation, so we need this additional check
          if (distance > radius) {
            return null;
          }
          
          // Add distance to metadata for sorting/display
          venueData.metadata = {
            ...venueData.metadata,
            distance
          };
        }
        
        return venueData;
      }).filter(Boolean) as IVenue[];
      
      // Sort by exact distance
      transformedVenues.sort((a, b) => {
        const distanceA = a.metadata?.distance || 0;
        const distanceB = b.metadata?.distance || 0;
        return distanceA - distanceB;
      });
      
      return {
        venues: transformedVenues,
        total: transformedVenues.length
      };
    } catch (error) {
      logger.error('Error finding venues by location', error as Error);
      throw error;
    }
  }

  /**
   * Calculates suitability score for a venue based on group requirements
   * 
   * @param venue - Venue to evaluate
   * @param params - Parameters for suitability calculation
   * @returns Venue with suitability scores
   */
  async calculateVenueSuitability(
    venue: IVenue,
    params: IVenueSuitabilityParams
  ): Promise<IVenueSuitability> {
    try {
      // Validate the venue and suitability parameters
      if (!venue) {
        throw ValidationError.invalidInput('Venue is required');
      }
      
      if (!params) {
        throw ValidationError.invalidInput('Suitability parameters are required');
      }

      logger.debug(`Calculating suitability for venue`, { venueId: venue.id, params });
      
      const {
        groupSize,
        preferredLocation,
        budgetRange,
        accessibilityRequirements,
        weights = {
          distance: 0.3,
          capacity: 0.3,
          budget: 0.3,
          accessibility: 0.1
        }
      } = params;
      
      // Validate that weights sum to 1.0
      const totalWeight = weights.distance + weights.capacity + weights.budget + weights.accessibility;
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        logger.warn(`Weights don't sum to 1.0, normalizing`, { originalWeights: weights, sum: totalWeight });
        
        // Normalize weights to sum to 1.0
        const normalizationFactor = 1.0 / totalWeight;
        weights.distance *= normalizationFactor;
        weights.capacity *= normalizationFactor;
        weights.budget *= normalizationFactor;
        weights.accessibility *= normalizationFactor;
      }
      
      // Calculate distance score based on venue location and preferred location
      let distanceScore = 0;
      if (venue.coordinates && preferredLocation) {
        const distance = this.calculateDistance(preferredLocation, venue.coordinates);
        // Exponential decay formula: score decreases as distance increases
        // 10 miles is used as a reference distance for score calculation
        distanceScore = Math.max(0, 100 * Math.exp(-distance / 10));
      }
      
      // Calculate capacity score based on venue capacity and group size
      let capacityScore = 0;
      if (venue.capacity && groupSize) {
        // Optimal capacity is when venue can accommodate between 1.2x and 2x the group size
        // This avoids venues that are too empty or too crowded
        const minOptimalCapacity = groupSize * 1.2;
        const maxOptimalCapacity = groupSize * 2;
        
        if (venue.capacity < groupSize) {
          // Venue is too small
          capacityScore = 0;
        } else if (venue.capacity >= minOptimalCapacity && venue.capacity <= maxOptimalCapacity) {
          // Venue capacity is in the optimal range
          capacityScore = 100;
        } else if (venue.capacity > maxOptimalCapacity) {
          // Venue is larger than optimal, apply a linear penalty
          // Up to 3x the optimal size will score down to 70
          const overSizeRatio = Math.min((venue.capacity / maxOptimalCapacity) - 1, 2) / 2;
          capacityScore = 100 - (overSizeRatio * 30);
        } else {
          // Venue is between minimum and optimal size
          const underOptimalRatio = (venue.capacity - groupSize) / (minOptimalCapacity - groupSize);
          capacityScore = 70 + (underOptimalRatio * 30);
        }
      }
      
      // Calculate budget score based on venue price level and budget range
      let budgetScore = 0;
      if (typeof venue.priceLevel === 'number' && budgetRange) {
        // Price level is typically 1-4 (inexpensive to very expensive)
        if (venue.priceLevel < budgetRange.min) {
          // Below minimum budget, might indicate lower quality
          const ratio = venue.priceLevel / budgetRange.min;
          budgetScore = 70 * ratio;
        } else if (venue.priceLevel > budgetRange.max) {
          // Above maximum budget, penalty increases with difference
          const overBudgetRatio = Math.min((venue.priceLevel - budgetRange.max) / 2, 1);
          budgetScore = 100 - (overBudgetRatio * 100);
        } else {
          // Within budget range, optimal score
          // Score is highest in the middle of the range, slightly lower at extremes
          const rangePosition = (venue.priceLevel - budgetRange.min) / 
                             (budgetRange.max - budgetRange.min || 1);
          const distanceFromMiddle = Math.abs(rangePosition - 0.5) * 2; // 0 at middle, 1 at extremes
          budgetScore = 100 - (distanceFromMiddle * 10); // 10% penalty at range extremes
        }
      }
      
      // Calculate accessibility score based on venue features and accessibility requirements
      let accessibilityScore = 0;
      if (accessibilityRequirements && accessibilityRequirements.length > 0) {
        // Get venue accessibility features
        const venueAccessibility = venue.metadata?.accessibilityFeatures || [];
        
        if (venueAccessibility.length === 0) {
          // No accessibility information, average score
          accessibilityScore = 50;
        } else {
          // Calculate percentage of required features available
          const matchingFeatures = accessibilityRequirements.filter(
            req => venueAccessibility.includes(req)
          ).length;
          
          accessibilityScore = (matchingFeatures / accessibilityRequirements.length) * 100;
        }
      } else {
        // No requirements specified, full score
        accessibilityScore = 100;
      }
      
      // Calculate overall score using weighted average of individual scores
      const overallScore = (
        (distanceScore * weights.distance) +
        (capacityScore * weights.capacity) +
        (budgetScore * weights.budget) +
        (accessibilityScore * weights.accessibility)
      );
      
      // Prepare the result
      const suitability: IVenueSuitability = {
        venue,
        distanceScore,
        capacityScore,
        budgetScore,
        accessibilityScore,
        overallScore,
        aiRecommended: false,
        recommendationReason: ''
      };
      
      // Enhance suitability calculation with AI insights if available
      try {
        const aiEnhancedSuitability = await this.aiClient.enhanceVenueSuitability(
          suitability,
          params
        );
        
        if (aiEnhancedSuitability) {
          return aiEnhancedSuitability;
        }
      } catch (aiError) {
        logger.warn('AI suitability enhancement failed, using standard calculation', 
          { error: (aiError as Error).message, venueId: venue.id });
      }
      
      return suitability;
    } catch (error) {
      logger.error('Error calculating venue suitability', error as Error);
      throw error;
    }
  }

  /**
   * Recommends venues based on group preferences and requirements
   * 
   * @param params - Parameters for venue recommendations
   * @returns Ranked list of suitable venues
   */
  async recommendVenues(params: IVenueRecommendationParams): Promise<IVenueSuitability[]> {
    try {
      // Validate the recommendation parameters
      if (!params.preferredLocation) {
        throw ValidationError.invalidInput('Preferred location is required');
      }
      
      if (!params.groupSize || params.groupSize <= 0) {
        throw ValidationError.invalidInput('Valid group size is required');
      }

      logger.debug('Recommending venues with params', { params });
      
      const {
        groupSize,
        preferredLocation,
        maxDistance = 15,
        budgetRange = { min: 1, max: 4 },
        venueTypes = [],
        accessibilityRequirements = [],
        limit = 5
      } = params;
      
      // Find venues near the preferred location within the specified radius
      const { venues } = await this.findVenuesByLocation(
        preferredLocation,
        maxDistance,
        {
          minCapacity: groupSize,
          venueTypes: venueTypes,
          limit: Math.max(20, limit * 2) // Fetch more venues than needed for better selection
        }
      );
      
      if (venues.length === 0) {
        logger.debug('No venues found matching criteria');
        return [];
      }
      
      logger.debug(`Found ${venues.length} potential venues, calculating suitability`);
      
      // Calculate suitability scores for each venue
      const suitabilityPromises = venues.map(venue => 
        this.calculateVenueSuitability(venue, {
          groupSize,
          preferredLocation,
          budgetRange,
          accessibilityRequirements,
          weights: {
            distance: 0.3,
            capacity: 0.3,
            budget: 0.3,
            accessibility: 0.1
          }
        })
      );
      
      let venueSuitability = await Promise.all(suitabilityPromises);
      
      // Sort venues by overall suitability score
      venueSuitability.sort((a, b) => b.overallScore - a.overallScore);
      
      // Enhance recommendations with AI insights
      try {
        // Get AI-enhanced recommendations
        const aiRecommendations = await this.aiClient.enhanceVenueRecommendations(
          venueSuitability.slice(0, Math.min(venues.length, limit * 2)),
          params
        );
        
        if (aiRecommendations && aiRecommendations.length > 0) {
          venueSuitability = aiRecommendations;
        } else {
          logger.debug('AI recommendations not available, using standard scoring');
        }
      } catch (aiError) {
        logger.warn('AI recommendation enhancement failed, using standard scoring', 
          { error: (aiError as Error).message });
      }
      
      // Return the top venues with suitability scores
      return venueSuitability.slice(0, limit);
    } catch (error) {
      logger.error('Error recommending venues', error as Error);
      throw error;
    }
  }

  /**
   * Gets detailed information about a venue
   * 
   * @param venueId - ID of the venue
   * @returns Detailed venue information
   */
  async getVenueDetails(venueId: string): Promise<IVenueDetails> {
    try {
      // Validate the venue ID
      if (!venueId) {
        throw ValidationError.invalidInput('Venue ID is required');
      }

      logger.debug(`Getting detailed information for venue: ${venueId}`);
      
      // Retrieve basic venue information from the database
      const venue = await this.prisma.venue.findUnique({
        where: { id: venueId },
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          amenities: true,
          accessibility: true,
          hours: true
        }
      });
      
      if (!venue) {
        throw ApiError.notFound(`Venue with ID ${venueId} not found`);
      }
      
      // Fetch additional details from external venue API if needed
      let additionalDetails = {};
      if (venue.placeId) {
        try {
          const externalData = await this.fetchExternalVenueDetails(venue.placeId);
          additionalDetails = externalData || {};
        } catch (extError) {
          logger.warn('Failed to fetch external venue details', 
            { venueId, placeId: venue.placeId, error: (extError as Error).message });
        }
      }
      
      // Transform and combine the venue data
      const venueDetails: IVenueDetails = {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        coordinates: {
          latitude: venue.coordinates.latitude,
          longitude: venue.coordinates.longitude
        },
        placeId: venue.placeId,
        website: venue.website || '',
        phoneNumber: venue.phoneNumber || '',
        capacity: venue.capacity,
        priceLevel: venue.priceLevel,
        rating: venue.rating,
        photos: venue.photos || [],
        categories: venue.categories as InterestCategory[],
        hours: this.transformHoursData(venue.hours),
        amenities: venue.amenities?.map(a => a.name) || [],
        accessibilityFeatures: venue.accessibility?.map(a => a.feature) || [],
        reviews: venue.reviews?.map(r => ({
          rating: r.rating,
          text: r.text,
          author: r.authorName,
          date: r.createdAt
        })) || [],
        metadata: {
          ...venue.metadata,
          ...additionalDetails
        }
      };
      
      return venueDetails;
    } catch (error) {
      logger.error(`Error getting venue details: ${venueId}`, error as Error);
      throw error;
    }
  }

  /**
   * Gets transportation options to a venue from a location
   * 
   * @param venueId - ID of the destination venue
   * @param fromLocation - Starting location coordinates
   * @returns Available transportation options
   */
  async getTransportationOptions(
    venueId: string,
    fromLocation: ICoordinates
  ): Promise<ITransportationOption[]> {
    try {
      // Validate the venue ID and from location
      if (!venueId) {
        throw ValidationError.invalidInput('Venue ID is required');
      }
      
      if (!fromLocation || !fromLocation.latitude || !fromLocation.longitude) {
        throw ValidationError.invalidInput('Valid starting location is required');
      }

      logger.debug(`Getting transportation options to venue: ${venueId}`);
      
      // Retrieve venue location from the database
      const venue = await this.prisma.venue.findUnique({
        where: { id: venueId },
        select: {
          coordinates: true,
          address: true
        }
      });
      
      if (!venue) {
        throw ApiError.notFound(`Venue with ID ${venueId} not found`);
      }
      
      const toLocation = {
        latitude: venue.coordinates.latitude,
        longitude: venue.coordinates.longitude
      };
      
      // Calculate straight-line distance
      const distance = this.calculateDistance(fromLocation, toLocation);
      
      // Query external transportation API for available options
      let transportationOptions: ITransportationOption[] = [];
      
      try {
        // Call external API for transportation options
        transportationOptions = await this.fetchTransportationOptions(fromLocation, toLocation);
      } catch (apiError) {
        logger.warn('Failed to fetch external transportation options, using fallback', 
          { error: (apiError as Error).message });
        
        // Fallback: Generate reasonable transportation options based on distance
        transportationOptions = this.generateFallbackTransportationOptions(distance);
      }
      
      return transportationOptions;
    } catch (error) {
      logger.error('Error getting transportation options', error as Error);
      throw error;
    }
  }

  /**
   * Calculates the distance between two geographic coordinates
   * 
   * @param point1 - First coordinate point
   * @param point2 - Second coordinate point
   * @returns Distance in miles
   */
  calculateDistance(point1: ICoordinates, point2: ICoordinates): number {
    // Validate the input coordinates
    if (!point1 || !point2) {
      throw ValidationError.invalidInput('Valid coordinates are required');
    }
    
    // Implementation of the Haversine formula for calculating great-circle distance
    // between two points on a sphere (Earth)
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    
    const R = 3958.8; // Earth's radius in miles
    
    const lat1 = toRadians(point1.latitude);
    const lon1 = toRadians(point1.longitude);
    const lat2 = toRadians(point2.latitude);
    const lon2 = toRadians(point2.longitude);
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculates a bounding box around a point for geographic queries
   * 
   * @param center - Center coordinates of the bounding box
   * @param radiusMiles - Radius in miles
   * @returns Bounding box coordinates
   */
  calculateBoundingBox(center: ICoordinates, radiusMiles: number): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    // Validate the center coordinates and radius
    if (!center || !center.latitude || !center.longitude) {
      throw ValidationError.invalidInput('Valid center coordinates are required');
    }
    
    if (radiusMiles <= 0) {
      throw ValidationError.invalidRange('radius', 0.1, 1000);
    }
    
    // Approximate degrees latitude per mile
    const degreesLatPerMile = 1 / 69.0;
    
    // Approximate degrees longitude per mile (varies with latitude)
    const degreesLngPerMile = 1 / (69.0 * Math.cos(center.latitude * (Math.PI / 180)));
    
    // Calculate the latitude/longitude offsets based on the radius
    const latOffset = radiusMiles * degreesLatPerMile;
    const lngOffset = radiusMiles * degreesLngPerMile;
    
    // Return the bounding box as min/max latitude and longitude
    return {
      minLat: center.latitude - latOffset,
      maxLat: center.latitude + latOffset,
      minLng: center.longitude - lngOffset,
      maxLng: center.longitude + lngOffset
    };
  }

  // Private helper methods

  /**
   * Validates venue search parameters
   * 
   * @param params - Search parameters to validate
   * @throws ValidationError if parameters are invalid
   */
  private validateSearchParams(params: IVenueSearchParams): void {
    if (!params) {
      throw ValidationError.invalidInput('Search parameters are required');
    }
    
    if (params.radius !== undefined && (params.radius <= 0 || params.radius > 50)) {
      throw ValidationError.invalidRange('radius', 1, 50, { value: params.radius });
    }
    
    if (params.minCapacity !== undefined && params.minCapacity < 0) {
      throw ValidationError.invalidInput('minCapacity must be a positive number');
    }
    
    if (params.maxCapacity !== undefined && params.maxCapacity < 0) {
      throw ValidationError.invalidInput('maxCapacity must be a positive number');
    }
    
    if (params.minCapacity !== undefined && params.maxCapacity !== undefined && 
        params.minCapacity > params.maxCapacity) {
      throw ValidationError.invalidInput('minCapacity cannot be greater than maxCapacity');
    }
    
    if (params.minPrice !== undefined && (params.minPrice < 1 || params.minPrice > 4)) {
      throw ValidationError.invalidRange('minPrice', 1, 4, { value: params.minPrice });
    }
    
    if (params.maxPrice !== undefined && (params.maxPrice < 1 || params.maxPrice > 4)) {
      throw ValidationError.invalidRange('maxPrice', 1, 4, { value: params.maxPrice });
    }
    
    if (params.minPrice !== undefined && params.maxPrice !== undefined && 
        params.minPrice > params.maxPrice) {
      throw ValidationError.invalidInput('minPrice cannot be greater than maxPrice');
    }
    
    if (params.page !== undefined && params.page < 1) {
      throw ValidationError.invalidInput('page must be a positive number');
    }
    
    if (params.limit !== undefined && (params.limit < 1 || params.limit > 100)) {
      throw ValidationError.invalidRange('limit', 1, 100, { value: params.limit });
    }
  }

  /**
   * Transforms database venue model to interface format
   * 
   * @param venueData - Raw venue data from database
   * @returns Transformed venue object
   */
  private transformVenueData(venueData: any): IVenue {
    return {
      id: venueData.id,
      name: venueData.name,
      address: venueData.address,
      coordinates: {
        latitude: venueData.coordinates.latitude,
        longitude: venueData.coordinates.longitude
      },
      placeId: venueData.placeId || '',
      website: venueData.website || '',
      phoneNumber: venueData.phoneNumber || '',
      capacity: venueData.capacity,
      priceLevel: venueData.priceLevel,
      rating: venueData.rating,
      photos: venueData.photos || [],
      categories: venueData.categories as InterestCategory[],
      metadata: venueData.metadata || {}
    };
  }

  /**
   * Transforms hours data to the format needed for the interface
   * 
   * @param hoursData - Raw hours data from database
   * @returns Formatted hours object
   */
  private transformHoursData(hoursData: any): { [day: string]: { open: string, close: string } } {
    if (!hoursData || !Array.isArray(hoursData)) {
      return {};
    }
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const result: { [day: string]: { open: string, close: string } } = {};
    
    for (const hour of hoursData) {
      if (days.includes(hour.day.toLowerCase())) {
        result[hour.day.toLowerCase()] = {
          open: hour.openTime,
          close: hour.closeTime
        };
      }
    }
    
    return result;
  }

  /**
   * Fetches additional venue details from external API
   * 
   * @param placeId - External place ID reference
   * @returns Additional venue details
   */
  private async fetchExternalVenueDetails(placeId: string): Promise<Record<string, any> | null> {
    try {
      // This would typically call Google Places API or similar
      // For example: https://maps.googleapis.com/maps/api/place/details/json?place_id={placeId}&key={apiKey}
      
      // Implementation would depend on the specific external API being used
      logger.debug(`Fetching external details for place ID: ${placeId}`);
      
      return null; // Placeholder return
    } catch (error) {
      logger.error(`Error fetching external venue details for place ID: ${placeId}`, error as Error);
      return null;
    }
  }

  /**
   * Fetches transportation options from external API
   * 
   * @param fromLocation - Starting location
   * @param toLocation - Destination location
   * @returns Available transportation options
   */
  private async fetchTransportationOptions(
    fromLocation: ICoordinates,
    toLocation: ICoordinates
  ): Promise<ITransportationOption[]> {
    try {
      // This would typically call a transportation/directions API
      // For example: Google Directions API, Uber API, etc.
      
      // Implementation would depend on the specific external API being used
      logger.debug(`Fetching transportation options between locations`);
      
      const distance = this.calculateDistance(fromLocation, toLocation);
      
      // Fallback to generating reasonable options based on distance
      return this.generateFallbackTransportationOptions(distance);
    } catch (error) {
      logger.error('Error fetching transportation options', error as Error);
      throw error;
    }
  }

  /**
   * Generates fallback transportation options based on distance
   * 
   * @param distanceMiles - Distance in miles
   * @returns Generated transportation options
   */
  private generateFallbackTransportationOptions(distanceMiles: number): ITransportationOption[] {
    const options: ITransportationOption[] = [];
    
    // Walking (for distances under 3 miles)
    if (distanceMiles <= 3) {
      options.push({
        mode: 'walking',
        duration: Math.round(distanceMiles * 20), // Approx. 20 min per mile
        distance: distanceMiles,
        cost: 0,
        route: [], // Would contain path coordinates in real implementation
        instructions: [`Walk ${distanceMiles.toFixed(1)} miles to destination`]
      });
    }
    
    // Cycling (for distances under 10 miles)
    if (distanceMiles <= 10) {
      options.push({
        mode: 'cycling',
        duration: Math.round(distanceMiles * 6), // Approx. 6 min per mile
        distance: distanceMiles,
        cost: 0,
        route: [],
        instructions: [`Cycle ${distanceMiles.toFixed(1)} miles to destination`]
      });
    }
    
    // Driving (for all distances)
    options.push({
      mode: 'driving',
      duration: Math.round(distanceMiles * 2), // Approx. 2 min per mile
      distance: distanceMiles,
      cost: distanceMiles * 0.58, // Approximate cost based on standard mileage rate
      route: [],
      instructions: [`Drive ${distanceMiles.toFixed(1)} miles to destination`]
    });
    
    // Public transit (for distances over 1 mile and under 30 miles)
    if (distanceMiles > 1 && distanceMiles < 30) {
      options.push({
        mode: 'transit',
        duration: Math.round(distanceMiles * 4), // Approx. 4 min per mile
        distance: distanceMiles,
        cost: 2.75, // Approximate cost of public transit
        route: [],
        instructions: [`Take public transportation ${distanceMiles.toFixed(1)} miles to destination`]
      });
    }
    
    // Ride service (for all distances)
    options.push({
      mode: 'rideshare',
      duration: Math.round(distanceMiles * 2), // Same as driving
      distance: distanceMiles,
      cost: 5.0 + (distanceMiles * 1.5), // Base fare + per mile
      route: [],
      instructions: [`Take a ride service ${distanceMiles.toFixed(1)} miles to destination`]
    });
    
    return options;
  }
}