import logging
import json
from typing import Dict, List, Any, Optional
import asyncio

from ..config.settings import DEFAULT_MODEL, RECOMMENDATION_CONFIG
from ..models.recommendation_model import RecommendationModel
from ..utils.data_preprocessing import normalize_tribe_data, normalize_event_data

# Set up logger
logger = logging.getLogger(__name__)

# Define recommendation types
RECOMMENDATION_TYPES = {
    'events': 'event recommendations based on tribe interests and location',
    'venues': 'venue recommendations for specific event types',
    'weather_activities': 'weather-appropriate activity recommendations',
    'budget_options': 'budget-friendly activity recommendations'
}

class RecommendationService:
    """Service for generating AI-powered event and activity recommendations for Tribes"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the RecommendationService with configuration
        
        Args:
            config: Configuration dictionary
        """
        # Store configuration dictionary
        self._config = config
        
        # Set default model from config or settings
        self._default_model = config.get('default_model', DEFAULT_MODEL)
        
        # Initialize recommendation model with config
        self._model = RecommendationModel(config)
        
        # Set up recommendation types dictionary
        self._recommendation_types = RECOMMENDATION_TYPES
        
        # Initialize cache if enabled
        self._cache = {} if config.get('cache_enabled', True) else None
        
        # Initialize statistics tracking
        self._stats = {
            'events': {'count': 0, 'cache_hits': 0, 'errors': 0},
            'venues': {'count': 0, 'cache_hits': 0, 'errors': 0},
            'weather_activities': {'count': 0, 'cache_hits': 0, 'errors': 0},
            'budget_options': {'count': 0, 'cache_hits': 0, 'errors': 0},
            'batch': {'count': 0, 'total_items': 0, 'errors': 0}
        }
        
        logger.info(f"RecommendationService initialized with model: {self._default_model}")
    
    def recommend_events(
        self,
        tribe_data: Dict[str, Any],
        location: str,
        date_range: str = 'next 7 days',
        count: int = 3,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate event recommendations for a Tribe based on member preferences and location
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            location: Location for event recommendations
            date_range: Date range for event search (e.g., "next 7 days")
            count: Number of recommendations to generate
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of recommended events with relevance scores and explanations
        """
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Set default count if not provided or invalid
        if count < 1:
            count = 3
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate cache key if caching is enabled
        cache_key = None
        if self._cache is not None:
            cache_key = f"events:{json.dumps(normalized_tribe_data['id'])}:{location}:{date_range}:{count}:{model_name}"
            if cache_key in self._cache:
                self._stats['events']['cache_hits'] += 1
                logger.debug(f"Cache hit for event recommendations: {cache_key}")
                return self._cache[cache_key]
        
        try:
            # Get event recommendations from model
            recommendations = self._model.recommend_events(
                normalized_tribe_data,
                location,
                date_range,
                count,
                context,
                model_name
            )
            
            # Update statistics
            self._stats['events']['count'] += 1
            
            # Cache results if caching is enabled
            if self._cache is not None and cache_key is not None:
                self._cache[cache_key] = recommendations
            
            logger.info(f"Generated {len(recommendations)} event recommendations for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return recommendations
            
        except Exception as e:
            self._stats['events']['errors'] += 1
            logger.error(f"Error generating event recommendations: {str(e)}")
            return []
    
    def recommend_venues(
        self,
        tribe_data: Dict[str, Any],
        location: str,
        event_type: str,
        count: int = 3,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate venue recommendations for a Tribe based on event type and preferences
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            location: Location for venue search
            event_type: Type of event (social, educational, etc.)
            count: Number of recommendations to generate
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of recommended venues with relevance scores and explanations
        """
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Set default count if not provided or invalid
        if count < 1:
            count = 3
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate cache key if caching is enabled
        cache_key = None
        if self._cache is not None:
            cache_key = f"venues:{json.dumps(normalized_tribe_data['id'])}:{location}:{event_type}:{count}:{model_name}"
            if cache_key in self._cache:
                self._stats['venues']['cache_hits'] += 1
                logger.debug(f"Cache hit for venue recommendations: {cache_key}")
                return self._cache[cache_key]
        
        try:
            # Get venue recommendations from model
            recommendations = self._model.recommend_venues(
                normalized_tribe_data,
                location,
                event_type,
                count,
                context,
                model_name
            )
            
            # Update statistics
            self._stats['venues']['count'] += 1
            
            # Cache results if caching is enabled
            if self._cache is not None and cache_key is not None:
                self._cache[cache_key] = recommendations
            
            logger.info(f"Generated {len(recommendations)} venue recommendations for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return recommendations
            
        except Exception as e:
            self._stats['venues']['errors'] += 1
            logger.error(f"Error generating venue recommendations: {str(e)}")
            return []
    
    def recommend_weather_based_activities(
        self,
        tribe_data: Dict[str, Any],
        location: str,
        weather_data: Dict[str, Any],
        count: int = 3,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate weather-appropriate activity recommendations based on forecast and preferences
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            location: Location for activity search
            weather_data: Weather forecast data
            count: Number of recommendations to generate
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of weather-appropriate activity recommendations
        """
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Set default count if not provided or invalid
        if count < 1:
            count = 3
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate cache key if caching is enabled
        cache_key = None
        if self._cache is not None:
            # Use a hash of weather data since it might be large and complex
            weather_hash = hash(json.dumps(weather_data, sort_keys=True))
            cache_key = f"weather_activities:{json.dumps(normalized_tribe_data['id'])}:{location}:{weather_hash}:{count}:{model_name}"
            if cache_key in self._cache:
                self._stats['weather_activities']['cache_hits'] += 1
                logger.debug(f"Cache hit for weather-based activity recommendations: {cache_key}")
                return self._cache[cache_key]
        
        try:
            # Get weather-based activity recommendations from model
            recommendations = self._model.recommend_weather_based_activities(
                normalized_tribe_data,
                location,
                weather_data,
                count,
                context,
                model_name
            )
            
            # Update statistics
            self._stats['weather_activities']['count'] += 1
            
            # Cache results if caching is enabled
            if self._cache is not None and cache_key is not None:
                self._cache[cache_key] = recommendations
            
            logger.info(f"Generated {len(recommendations)} weather-based activity recommendations for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return recommendations
            
        except Exception as e:
            self._stats['weather_activities']['errors'] += 1
            logger.error(f"Error generating weather-based activity recommendations: {str(e)}")
            return []
    
    def recommend_budget_options(
        self,
        tribe_data: Dict[str, Any],
        location: str,
        budget: float,
        count: int = 3,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate budget-friendly activity recommendations based on budget constraints
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            location: Location for activity search
            budget: Maximum budget amount
            count: Number of recommendations to generate
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of budget-friendly activity recommendations
        """
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Set default count if not provided or invalid
        if count < 1:
            count = 3
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate cache key if caching is enabled
        cache_key = None
        if self._cache is not None:
            cache_key = f"budget_options:{json.dumps(normalized_tribe_data['id'])}:{location}:{budget}:{count}:{model_name}"
            if cache_key in self._cache:
                self._stats['budget_options']['cache_hits'] += 1
                logger.debug(f"Cache hit for budget option recommendations: {cache_key}")
                return self._cache[cache_key]
        
        try:
            # Get budget-friendly activity recommendations from model
            recommendations = self._model.recommend_budget_options(
                normalized_tribe_data,
                location,
                budget,
                count,
                context,
                model_name
            )
            
            # Update statistics
            self._stats['budget_options']['count'] += 1
            
            # Cache results if caching is enabled
            if self._cache is not None and cache_key is not None:
                self._cache[cache_key] = recommendations
            
            logger.info(f"Generated {len(recommendations)} budget-friendly recommendations for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return recommendations
            
        except Exception as e:
            self._stats['budget_options']['errors'] += 1
            logger.error(f"Error generating budget-friendly recommendations: {str(e)}")
            return []
    
    def generate_recommendations(
        self,
        tribe_data: Dict[str, Any],
        recommendation_type: str,
        data: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate recommendations of a specified type for a Tribe
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            recommendation_type: Type of recommendations to generate 
                                (events, venues, weather_activities, budget_options)
            data: Data specific to the recommendation type
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of recommendations
        """
        # Validate recommendation type
        if recommendation_type not in self._recommendation_types:
            valid_types = ", ".join(self._recommendation_types.keys())
            logger.error(f"Invalid recommendation type: {recommendation_type}. Valid types: {valid_types}")
            raise ValueError(f"Invalid recommendation type: {recommendation_type}")
        
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
            
        # Set default data if none provided
        if data is None:
            data = {}
        
        # Generate cache key if caching is enabled
        cache_key = None
        if self._cache is not None:
            data_hash = hash(json.dumps(data, sort_keys=True))
            cache_key = f"{recommendation_type}:{json.dumps(normalized_tribe_data['id'])}:{data_hash}:{model_name}"
            if cache_key in self._cache:
                self._stats[recommendation_type]['cache_hits'] += 1
                logger.debug(f"Cache hit for {recommendation_type} recommendations: {cache_key}")
                return self._cache[cache_key]
        
        try:
            # Call model's generate_recommendations method
            recommendations = self._model.generate_recommendations(
                normalized_tribe_data,
                recommendation_type,
                data,
                context,
                model_name
            )
            
            # Update statistics
            self._stats[recommendation_type]['count'] += 1
            
            # Cache results if caching is enabled
            if self._cache is not None and cache_key is not None:
                self._cache[cache_key] = recommendations
            
            logger.info(f"Generated {len(recommendations)} {recommendation_type} recommendations for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return recommendations
            
        except Exception as e:
            if recommendation_type in self._stats:
                self._stats[recommendation_type]['errors'] += 1
            logger.error(f"Error generating {recommendation_type} recommendations: {str(e)}")
            return []
    
    async def async_generate_recommendations(
        self,
        tribe_data: Dict[str, Any],
        recommendation_type: str,
        data: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Asynchronously generate recommendations of a specified type for a Tribe
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            recommendation_type: Type of recommendations to generate
            data: Data specific to the recommendation type
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of recommendations
        """
        # Validate recommendation type
        if recommendation_type not in self._recommendation_types:
            valid_types = ", ".join(self._recommendation_types.keys())
            logger.error(f"Invalid recommendation type: {recommendation_type}. Valid types: {valid_types}")
            raise ValueError(f"Invalid recommendation type: {recommendation_type}")
        
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
            
        # Set default data if none provided
        if data is None:
            data = {}
        
        # Generate cache key if caching is enabled
        cache_key = None
        if self._cache is not None:
            data_hash = hash(json.dumps(data, sort_keys=True))
            cache_key = f"{recommendation_type}:{json.dumps(normalized_tribe_data['id'])}:{data_hash}:{model_name}"
            if cache_key in self._cache:
                self._stats[recommendation_type]['cache_hits'] += 1
                logger.debug(f"Cache hit for async {recommendation_type} recommendations: {cache_key}")
                return self._cache[cache_key]
        
        try:
            # Call model's async_generate_recommendations method
            recommendations = await self._model.async_generate_recommendations(
                normalized_tribe_data,
                recommendation_type,
                data,
                context,
                model_name
            )
            
            # Update statistics
            self._stats[recommendation_type]['count'] += 1
            
            # Cache results if caching is enabled
            if self._cache is not None and cache_key is not None:
                self._cache[cache_key] = recommendations
            
            logger.info(f"Asynchronously generated {len(recommendations)} {recommendation_type} recommendations for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return recommendations
            
        except Exception as e:
            if recommendation_type in self._stats:
                self._stats[recommendation_type]['errors'] += 1
            logger.error(f"Error generating async {recommendation_type} recommendations: {str(e)}")
            return []
    
    async def batch_generate_recommendations(
        self,
        tribe_data_list: List[Dict[str, Any]],
        recommendation_type: str,
        data: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[List[Dict[str, Any]]]:
        """
        Generate recommendations for multiple tribes in batch
        
        Args:
            tribe_data_list: List of tribe data dictionaries
            recommendation_type: Type of recommendations to generate
            data: Data specific to the recommendation type
            context: Additional context for recommendations
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            List of recommendation lists for each tribe
        """
        # Validate recommendation type
        if recommendation_type not in self._recommendation_types:
            valid_types = ", ".join(self._recommendation_types.keys())
            logger.error(f"Invalid recommendation type: {recommendation_type}. Valid types: {valid_types}")
            raise ValueError(f"Invalid recommendation type: {recommendation_type}")
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
            
        # Set default data if none provided
        if data is None:
            data = {}
        
        try:
            # Create tasks list for async processing
            tasks = []
            for tribe_data in tribe_data_list:
                task = self.async_generate_recommendations(
                    tribe_data,
                    recommendation_type,
                    data,
                    context,
                    model_name
                )
                tasks.append(task)
            
            # Execute all tasks concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out exceptions and convert to empty lists
            processed_results = []
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error in batch processing: {str(result)}")
                    processed_results.append([])
                else:
                    processed_results.append(result)
            
            # Update batch statistics
            self._stats['batch']['count'] += 1
            self._stats['batch']['total_items'] += len(tribe_data_list)
            
            logger.info(f"Batch generated {recommendation_type} recommendations for {len(tribe_data_list)} tribes")
            return processed_results
            
        except Exception as e:
            self._stats['batch']['errors'] += 1
            logger.error(f"Error in batch recommendation generation: {str(e)}")
            return [[] for _ in range(len(tribe_data_list))]
    
    def rank_recommendations(
        self,
        tribe_data: Dict[str, Any],
        items: List[Dict[str, Any]],
        item_type: str,
        context: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank a list of potential recommendations based on relevance to the tribe
        
        Args:
            tribe_data: Tribe data containing member profiles and interests
            items: List of items to rank
            item_type: Type of items (events, venues, activities)
            context: Additional context for ranking
            model_name: Name of the model to use, defaults to default_model
            
        Returns:
            Ranked list of items with relevance scores
        """
        # Normalize tribe data
        normalized_tribe_data = normalize_tribe_data(tribe_data)
        
        # Validate items list structure
        if not isinstance(items, list) or len(items) == 0:
            logger.warning("Invalid items list: must be a non-empty list")
            return []
        
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        try:
            # Call model's rank_recommendations method
            ranked_items = self._model.rank_recommendations(
                normalized_tribe_data,
                items,
                item_type,
                context,
                model_name
            )
            
            # Update statistics for the relevant item type
            if item_type in self._stats:
                self._stats[item_type]['count'] += 1
            
            logger.info(f"Ranked {len(ranked_items)} {item_type} items by relevance for tribe {normalized_tribe_data.get('id', 'unknown')}")
            return ranked_items
            
        except Exception as e:
            if item_type in self._stats:
                self._stats[item_type]['errors'] += 1
            logger.error(f"Error ranking {item_type} items: {str(e)}")
            return items  # Return original items if ranking fails
    
    def get_recommendation_statistics(self, recommendation_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Get statistics about recommendation operations
        
        Args:
            recommendation_type: Type of recommendations to get statistics for (if None, returns all)
            
        Returns:
            Statistics for the specified recommendation type or all types
        """
        if recommendation_type is None:
            return self._stats
        
        if recommendation_type not in self._stats:
            valid_types = ", ".join(self._stats.keys())
            raise ValueError(f"Invalid recommendation type: {recommendation_type}. Valid types: {valid_types}")
        
        return self._stats[recommendation_type]
    
    def clear_cache(self, recommendation_type: Optional[str] = None) -> None:
        """
        Clear the recommendation cache
        
        Args:
            recommendation_type: Type of recommendations to clear cache for (if None, clears all)
        """
        if self._cache is None:
            logger.debug("Cache is not enabled, nothing to clear")
            return
        
        if recommendation_type is None:
            # Clear all cache
            self._cache.clear()
            logger.info("Cleared entire recommendation cache")
            return
        
        if recommendation_type not in self._recommendation_types:
            valid_types = ", ".join(self._recommendation_types.keys())
            raise ValueError(f"Invalid recommendation type: {recommendation_type}. Valid types: {valid_types}")
        
        # Clear cache for specific recommendation type
        keys_to_remove = [k for k in self._cache if k.startswith(f"{recommendation_type}:")]
        for key in keys_to_remove:
            del self._cache[key]
        
        logger.info(f"Cleared cache for {recommendation_type} recommendations, removed {len(keys_to_remove)} entries")
    
    def close(self) -> None:
        """
        Close resources used by the service
        """
        if hasattr(self, '_model') and self._model is not None:
            self._model.close()
        
        # Clear cache if it exists
        if self._cache is not None:
            self._cache.clear()
        
        logger.info("RecommendationService resources closed")
    
    async def async_close(self) -> None:
        """
        Asynchronously close resources used by the service
        """
        if hasattr(self, '_model') and self._model is not None:
            await self._model.async_close()
        
        # Clear cache if it exists
        if self._cache is not None:
            self._cache.clear()
        
        logger.info("RecommendationService resources closed asynchronously")
    
    def __enter__(self):
        """
        Context manager entry method
        
        Returns:
            Self reference
        """
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Context manager exit method
        
        Args:
            exc_type: Exception type if an exception occurred
            exc_val: Exception value if an exception occurred
            exc_tb: Exception traceback if an exception occurred
        """
        self.close()
        if exc_val:
            logger.error(f"Exception in RecommendationService context: {exc_val}")
    
    async def __aenter__(self):
        """
        Async context manager entry method
        
        Returns:
            Self reference
        """
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """
        Async context manager exit method
        
        Args:
            exc_type: Exception type if an exception occurred
            exc_val: Exception value if an exception occurred
            exc_tb: Exception traceback if an exception occurred
        """
        await self.async_close()
        if exc_val:
            logger.error(f"Exception in RecommendationService async context: {exc_val}")