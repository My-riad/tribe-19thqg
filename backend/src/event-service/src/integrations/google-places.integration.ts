import axios from 'axios';
import NodeCache from 'node-cache';
import { eventServiceConfig, env } from '../config';
import { IVenue } from '../../../shared/src/types/event.types';
import { ICoordinates, InterestCategory } from '../../../shared/src/types/profile.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Initialize cache with TTL from config
const venueCache = new NodeCache({ stdTTL: eventServiceConfig.venueCacheTtl, checkperiod: 120 });

/**
 * Class for integrating with Google Places API to fetch venue data
 */
class GooglePlacesIntegration {
  private apiKey: string;
  private baseUrl: string;
  private cache: NodeCache;

  /**
   * Initializes a new instance of the GooglePlacesIntegration class
   */
  constructor() {
    this.apiKey = env.GOOGLE_PLACES_API_KEY;
    this.baseUrl = eventServiceConfig.googlePlacesApiUrl;
    this.cache = venueCache;

    // Validate that API key is available
    if (!this.apiKey) {
      logger.error('Google Places API key is not configured');
      throw new Error('Google Places API key is missing from environment variables');
    }
  }

  /**
   * Searches for venues near a specific location
   * 
   * @param coordinates - The geographical coordinates to search around
   * @param options - Additional search options
   * @returns Promise<IVenue[]> - Array of venues near the specified location
   */
  async searchNearby(coordinates: ICoordinates, options: any = {}): Promise<IVenue[]> {
    try {
      // Validate coordinates
      if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        throw ApiError.badRequest('Invalid coordinates provided');
      }

      // Generate cache key based on coordinates and options
      const cacheKey = `nearby-${coordinates.latitude},${coordinates.longitude}-${JSON.stringify(options)}`;
      
      // Check if venue data exists in cache
      const cachedData = this.cache.get<IVenue[]>(cacheKey);
      if (cachedData) {
        logger.debug('Returning cached nearby venues', { coordinates });
        return cachedData;
      }

      // Construct API URL with coordinates and options
      const url = `${this.baseUrl}/nearbysearch/json`;
      
      // Prepare request parameters
      const params = {
        location: `${coordinates.latitude},${coordinates.longitude}`,
        radius: options.radius || 5000, // Default 5km radius
        type: options.type || 'establishment',
        keyword: options.keyword || '',
        rankby: options.rankby || 'prominence',
        key: this.apiKey
      };

      // Make HTTP request to Google Places API nearby search endpoint
      logger.info('Fetching nearby venues from Google Places API', { coordinates });
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places API error', { status: response.data.status, error_message: response.data.error_message });
        throw ApiError.externalServiceError(`Google Places API error: ${response.data.status}`);
      }

      // Parse response and transform to IVenue format
      const venues: IVenue[] = [];
      
      if (response.data.results && Array.isArray(response.data.results)) {
        for (const place of response.data.results) {
          venues.push(this.transformPlaceToVenue(place));
        }
      }

      // Store result in cache
      this.cache.set(cacheKey, venues);
      
      // Return venue data array
      return venues;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Failed to search nearby venues', error as Error);
      
      if (axios.isAxiosError(error)) {
        throw ApiError.externalServiceError('Failed to connect to Google Places API');
      }
      
      throw ApiError.internal('Failed to search nearby venues');
    }
  }

  /**
   * Searches for venues based on text query
   * 
   * @param query - The search query
   * @param options - Additional search options
   * @returns Promise<IVenue[]> - Array of venues matching the query
   */
  async searchText(query: string, options: any = {}): Promise<IVenue[]> {
    try {
      // Validate query
      if (!query || typeof query !== 'string') {
        throw ApiError.badRequest('Invalid search query provided');
      }

      // Generate cache key based on query and options
      const cacheKey = `text-${query}-${JSON.stringify(options)}`;
      
      // Check if venue data exists in cache
      const cachedData = this.cache.get<IVenue[]>(cacheKey);
      if (cachedData) {
        logger.debug('Returning cached text search venues', { query });
        return cachedData;
      }

      // Construct API URL with query and options
      const url = `${this.baseUrl}/textsearch/json`;
      
      // Prepare request parameters
      const params = {
        query,
        radius: options.radius || 5000, // Default 5km radius
        type: options.type || '',
        key: this.apiKey
      };

      // Add location if provided
      if (options.coordinates) {
        params['location'] = `${options.coordinates.latitude},${options.coordinates.longitude}`;
      }

      // Make HTTP request to Google Places API text search endpoint
      logger.info('Fetching venues from Google Places API text search', { query });
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places API error', { status: response.data.status, error_message: response.data.error_message });
        throw ApiError.externalServiceError(`Google Places API error: ${response.data.status}`);
      }

      // Parse response and transform to IVenue format
      const venues: IVenue[] = [];
      
      if (response.data.results && Array.isArray(response.data.results)) {
        for (const place of response.data.results) {
          venues.push(this.transformPlaceToVenue(place));
        }
      }

      // Store result in cache
      this.cache.set(cacheKey, venues);
      
      // Return venue data array
      return venues;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Failed to search venues by text', error as Error);
      
      if (axios.isAxiosError(error)) {
        throw ApiError.externalServiceError('Failed to connect to Google Places API');
      }
      
      throw ApiError.internal('Failed to search venues by text');
    }
  }

  /**
   * Gets detailed information about a specific venue by place ID
   * 
   * @param placeId - The Google Places ID of the venue
   * @returns Promise<IVenue> - Detailed venue information
   */
  async getPlaceDetails(placeId: string): Promise<IVenue> {
    try {
      // Validate place ID
      if (!placeId || typeof placeId !== 'string') {
        throw ApiError.badRequest('Invalid place ID provided');
      }

      // Generate cache key based on place ID
      const cacheKey = `details-${placeId}`;
      
      // Check if venue data exists in cache
      const cachedData = this.cache.get<IVenue>(cacheKey);
      if (cachedData) {
        logger.debug('Returning cached venue details', { placeId });
        return cachedData;
      }

      // Construct API URL with place ID
      const url = `${this.baseUrl}/details/json`;
      
      // Prepare request parameters
      const params = {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,website,international_phone_number,photos,price_level,rating,types,url',
        key: this.apiKey
      };

      // Make HTTP request to Google Places API details endpoint
      logger.info('Fetching venue details from Google Places API', { placeId });
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK') {
        logger.error('Google Places API error', { status: response.data.status, error_message: response.data.error_message });
        throw ApiError.externalServiceError(`Google Places API error: ${response.data.status}`);
      }

      // Parse response and transform to IVenue format
      const venue = this.transformPlaceToVenue(response.data.result);

      // Store result in cache
      this.cache.set(cacheKey, venue);
      
      // Return venue data
      return venue;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Failed to get venue details', error as Error);
      
      if (axios.isAxiosError(error)) {
        throw ApiError.externalServiceError('Failed to connect to Google Places API');
      }
      
      throw ApiError.internal('Failed to get venue details');
    }
  }

  /**
   * Gets autocomplete suggestions for venue search
   * 
   * @param input - The search input
   * @param options - Additional autocomplete options
   * @returns Promise<Array<{placeId: string, description: string}>> - Array of autocomplete suggestions
   */
  async autocomplete(input: string, options: any = {}): Promise<Array<{placeId: string, description: string}>> {
    try {
      // Validate input
      if (!input || typeof input !== 'string') {
        throw ApiError.badRequest('Invalid input provided for autocomplete');
      }

      // Generate cache key based on input and options
      const cacheKey = `autocomplete-${input}-${JSON.stringify(options)}`;
      
      // Check if suggestion data exists in cache
      const cachedData = this.cache.get<Array<{placeId: string, description: string}>>(cacheKey);
      if (cachedData) {
        logger.debug('Returning cached autocomplete suggestions', { input });
        return cachedData;
      }

      // Construct API URL with input and options
      const url = `${this.baseUrl}/autocomplete/json`;
      
      // Prepare request parameters
      const params = {
        input,
        types: options.types || 'establishment',
        key: this.apiKey
      };

      // Add location if provided
      if (options.coordinates) {
        params['location'] = `${options.coordinates.latitude},${options.coordinates.longitude}`;
        params['radius'] = options.radius || 5000; // Default 5km radius
      }

      // Make HTTP request to Google Places API autocomplete endpoint
      logger.info('Fetching autocomplete suggestions from Google Places API', { input });
      const response = await axios.get(url, { params });
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Google Places API error', { status: response.data.status, error_message: response.data.error_message });
        throw ApiError.externalServiceError(`Google Places API error: ${response.data.status}`);
      }

      // Parse response and extract place IDs and descriptions
      const suggestions: Array<{placeId: string, description: string}> = [];
      
      if (response.data.predictions && Array.isArray(response.data.predictions)) {
        for (const prediction of response.data.predictions) {
          suggestions.push({
            placeId: prediction.place_id,
            description: prediction.description
          });
        }
      }

      // Store result in cache
      this.cache.set(cacheKey, suggestions);
      
      // Return autocomplete suggestions array
      return suggestions;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('Failed to get autocomplete suggestions', error as Error);
      
      if (axios.isAxiosError(error)) {
        throw ApiError.externalServiceError('Failed to connect to Google Places API');
      }
      
      throw ApiError.internal('Failed to get autocomplete suggestions');
    }
  }

  /**
   * Gets the URL for a venue photo by photo reference
   * 
   * @param photoReference - The Google Places photo reference
   * @param maxWidth - Maximum width of the photo (default: 400)
   * @returns string - URL for the venue photo
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    // Validate photo reference
    if (!photoReference || typeof photoReference !== 'string') {
      logger.warn('Invalid photo reference provided');
      return '';
    }

    // Construct photo URL with photo reference, max width, and API key
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Maps Google Places types to application interest categories
   * 
   * @param types - Array of Google Places type strings
   * @returns InterestCategory[] - Array of mapped interest categories
   */
  private mapPlaceTypeToCategory(types: string[]): InterestCategory[] {
    // Define mapping of Google Places types to InterestCategory values
    const typeMapping: Record<string, InterestCategory> = {
      // Outdoor adventures
      'park': InterestCategory.OUTDOOR_ADVENTURES,
      'campground': InterestCategory.OUTDOOR_ADVENTURES,
      'natural_feature': InterestCategory.OUTDOOR_ADVENTURES,
      'rv_park': InterestCategory.OUTDOOR_ADVENTURES,
      'zoo': InterestCategory.OUTDOOR_ADVENTURES,
      'amusement_park': InterestCategory.OUTDOOR_ADVENTURES,
      
      // Arts & culture
      'art_gallery': InterestCategory.ARTS_CULTURE,
      'museum': InterestCategory.ARTS_CULTURE,
      'library': InterestCategory.ARTS_CULTURE,
      'movie_theater': InterestCategory.ARTS_CULTURE,
      'tourist_attraction': InterestCategory.ARTS_CULTURE,
      'theater': InterestCategory.ARTS_CULTURE,
      
      // Food & dining
      'restaurant': InterestCategory.FOOD_DINING,
      'cafe': InterestCategory.FOOD_DINING,
      'bar': InterestCategory.FOOD_DINING,
      'bakery': InterestCategory.FOOD_DINING,
      'food': InterestCategory.FOOD_DINING,
      'meal_takeaway': InterestCategory.FOOD_DINING,
      
      // Sports & fitness
      'gym': InterestCategory.SPORTS_FITNESS,
      'stadium': InterestCategory.SPORTS_FITNESS,
      'bowling_alley': InterestCategory.SPORTS_FITNESS,
      'fitness_center': InterestCategory.SPORTS_FITNESS,
      'sports_complex': InterestCategory.SPORTS_FITNESS,
      
      // Games & entertainment
      'casino': InterestCategory.GAMES_ENTERTAINMENT,
      'night_club': InterestCategory.GAMES_ENTERTAINMENT,
      'amusement_park': InterestCategory.GAMES_ENTERTAINMENT,
      'movie_theater': InterestCategory.GAMES_ENTERTAINMENT,
      'game_center': InterestCategory.GAMES_ENTERTAINMENT,
      
      // Learning & education
      'university': InterestCategory.LEARNING_EDUCATION,
      'school': InterestCategory.LEARNING_EDUCATION,
      'library': InterestCategory.LEARNING_EDUCATION,
      'book_store': InterestCategory.LEARNING_EDUCATION,
      
      // Technology
      'electronics_store': InterestCategory.TECHNOLOGY,
      'computer_store': InterestCategory.TECHNOLOGY,
      'store': InterestCategory.TECHNOLOGY,
      
      // Wellness & mindfulness
      'spa': InterestCategory.WELLNESS_MINDFULNESS,
      'health': InterestCategory.WELLNESS_MINDFULNESS,
      'physiotherapist': InterestCategory.WELLNESS_MINDFULNESS,
      'beauty_salon': InterestCategory.WELLNESS_MINDFULNESS,
      'yoga': InterestCategory.WELLNESS_MINDFULNESS
    };
    
    // Filter and map the input types to corresponding interest categories
    const categories = types
      .filter(type => typeMapping[type])
      .map(type => typeMapping[type]);
    
    // Remove duplicates
    return [...new Set(categories)];
  }

  /**
   * Transforms Google Places API response to IVenue format
   * 
   * @param placeData - The place data from Google Places API
   * @returns IVenue - Transformed venue data in application format
   */
  private transformPlaceToVenue(placeData: any): IVenue {
    // Extract coordinates
    const coordinates: ICoordinates = {
      latitude: placeData.geometry?.location?.lat || 0,
      longitude: placeData.geometry?.location?.lng || 0
    };
    
    // Extract photos and generate photo URLs
    const photos = placeData.photos
      ? placeData.photos.map((photo: any) => this.getPhotoUrl(photo.photo_reference))
      : [];
    
    // Map place types to interest categories
    const categories = this.mapPlaceTypeToCategory(placeData.types || []);
    
    // Extract price level if available
    const priceLevel = typeof placeData.price_level === 'number' ? placeData.price_level : 0;
    
    // Extract rating if available
    const rating = typeof placeData.rating === 'number' ? placeData.rating : 0;
    
    // Construct and return IVenue object
    return {
      id: placeData.place_id || '',
      name: placeData.name || '',
      address: placeData.formatted_address || placeData.vicinity || '',
      coordinates,
      placeId: placeData.place_id || '',
      website: placeData.website || '',
      phoneNumber: placeData.international_phone_number || placeData.formatted_phone_number || '',
      capacity: 0, // Not provided by Google Places API
      priceLevel,
      rating,
      photos,
      categories,
      metadata: {
        google_maps_url: placeData.url || '',
        place_types: placeData.types || []
      }
    };
  }

  /**
   * Clears the venue data cache
   */
  clearCache(): void {
    this.cache.flushAll();
    logger.info('Venue cache cleared');
  }
}

export default GooglePlacesIntegration;