import logging
import json
from typing import Dict, List, Any, Optional
import asyncio

from ..config.settings import DEFAULT_MODEL, RECOMMENDATION_CONFIG
from ..adapters.model_adapter import create_model_adapter
from ..utils.prompt_engineering import (
    get_recommendation_prompt,
    RecommendationPromptGenerator,
    extract_json_from_response
)
from ..utils.data_preprocessing import (
    normalize_tribe_data,
    normalize_event_data
)

# Set up logger
logger = logging.getLogger(__name__)

class RecommendationModel:
    """
    Model for generating AI-powered event and activity recommendations for Tribes
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the RecommendationModel with configuration
        
        Args:
            config: Configuration dictionary
        """
        # Store configuration dictionary
        self._config = config
        
        # Set default model from config or settings
        self._default_model = config.get('default_model', DEFAULT_MODEL)
        
        # Initialize model adapter
        self._model_adapter = create_model_adapter(config)
        
        # Initialize recommendation prompt generator
        self._prompt_generator = RecommendationPromptGenerator(config)
        
        # Set up recommendation types dictionary for validation
        self._recommendation_types = {
            'events': self.recommend_events,
            'venues': self.recommend_venues,
            'weather_activities': self.recommend_weather_based_activities,
            'budget_options': self.recommend_budget_options
        }
        
        logger.debug(f"RecommendationModel initialized with model: {self._default_model}")
    
    def recommend_events(
        self,
        tribe_data: Dict[str, Any],
        location: str,
        date_range: str,
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
        
        # Set default count if not provided
        if count < 1:
            count = 3
            
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate recommendation prompt
        prompt = self._prompt_generator.generate_event_recommendations_prompt(
            normalized_tribe_data,
            location,
            date_range,
            count
        )
        
        # Call model to generate recommendations
        response = self._model_adapter.generate_chat_completion(
            [{"role": "user", "content": prompt}],
            model_name=model_name
        )
        
        # Extract response content
        response_content = response['choices'][0]['message']['content']
        
        # Extract JSON data from response
        recommendations = extract_json_from_response(response_content)
        
        # Validate response format
        if not isinstance(recommendations, list):
            logger.warning("Invalid recommendation format: expected list")
            return []
        
        logger.info(f"Generated {len(recommendations)} event recommendations")
        
        return recommendations
    
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
        
        # Set default count if not provided
        if count < 1:
            count = 3
            
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate recommendation prompt using general function since there's no specialized method
        options = {
            'location': location,
            'event_type': event_type,
            'count': count
        }
        prompt = get_recommendation_prompt('venues', normalized_tribe_data, options)
        
        # Call model to generate recommendations
        response = self._model_adapter.generate_chat_completion(
            [{"role": "user", "content": prompt}],
            model_name=model_name
        )
        
        # Extract response content
        response_content = response['choices'][0]['message']['content']
        
        # Extract JSON data from response
        recommendations = extract_json_from_response(response_content)
        
        # Validate response format
        if not isinstance(recommendations, list):
            logger.warning("Invalid recommendation format: expected list")
            return []
        
        logger.info(f"Generated {len(recommendations)} venue recommendations")
        
        return recommendations
    
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
        
        # Set default count if not provided
        if count < 1:
            count = 3
            
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate recommendation prompt
        prompt = self._prompt_generator.generate_weather_activities_prompt(
            normalized_tribe_data,
            location,
            weather_data,
            count
        )
        
        # Call model to generate recommendations
        response = self._model_adapter.generate_chat_completion(
            [{"role": "user", "content": prompt}],
            model_name=model_name
        )
        
        # Extract response content
        response_content = response['choices'][0]['message']['content']
        
        # Extract JSON data from response
        recommendations = extract_json_from_response(response_content)
        
        # Validate response format
        if not isinstance(recommendations, list):
            logger.warning("Invalid recommendation format: expected list")
            return []
        
        logger.info(f"Generated {len(recommendations)} weather-based activity recommendations")
        
        return recommendations
    
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
        
        # Set default count if not provided
        if count < 1:
            count = 3
            
        # Set default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        # Set default context if none provided
        if context is None:
            context = {}
        
        # Generate recommendation prompt
        prompt = self._prompt_generator.generate_budget_options_prompt(
            normalized_tribe_data,
            location,
            budget,
            count
        )
        
        # Call model to generate recommendations
        response = self._model_adapter.generate_chat_completion(
            [{"role": "user", "content": prompt}],
            model_name=model_name
        )
        
        # Extract response content
        response_content = response['choices'][0]['message']['content']
        
        # Extract JSON data from response
        recommendations = extract_json_from_response(response_content)
        
        # Validate response format
        if not isinstance(recommendations, list):
            logger.warning("Invalid recommendation format: expected list")
            return []
        
        logger.info(f"Generated {len(recommendations)} budget-friendly recommendations")
        
        return recommendations
    
    def generate_recommendations(
        self,
        tribe_data: Dict[str, Any],
        recommendation_type: str,
        data: Dict[str, Any],
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
            
        # Generate appropriate prompt based on recommendation type
        if recommendation_type == 'events':
            return self.recommend_events(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('date_range', 'next 7 days'),
                data.get('count', 3),
                context,
                model_name
            )
        elif recommendation_type == 'venues':
            return self.recommend_venues(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('event_type', 'social'),
                data.get('count', 3),
                context,
                model_name
            )
        elif recommendation_type == 'weather_activities':
            return self.recommend_weather_based_activities(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('weather_data', {}),
                data.get('count', 3),
                context,
                model_name
            )
        elif recommendation_type == 'budget_options':
            return self.recommend_budget_options(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('budget', 100),
                data.get('count', 3),
                context,
                model_name
            )
    
    async def async_generate_recommendations(
        self,
        tribe_data: Dict[str, Any],
        recommendation_type: str,
        data: Dict[str, Any],
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
            
        # Generate recommendation prompt based on type
        if recommendation_type == 'events':
            prompt = self._prompt_generator.generate_event_recommendations_prompt(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('date_range', 'next 7 days'),
                data.get('count', 3)
            )
        elif recommendation_type == 'venues':
            options = {
                'location': data.get('location', ''),
                'event_type': data.get('event_type', 'social'),
                'count': data.get('count', 3)
            }
            prompt = get_recommendation_prompt('venues', normalized_tribe_data, options)
        elif recommendation_type == 'weather_activities':
            prompt = self._prompt_generator.generate_weather_activities_prompt(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('weather_data', {}),
                data.get('count', 3)
            )
        elif recommendation_type == 'budget_options':
            prompt = self._prompt_generator.generate_budget_options_prompt(
                normalized_tribe_data,
                data.get('location', ''),
                data.get('budget', 100),
                data.get('count', 3)
            )
        
        # Call model to generate recommendations asynchronously
        response = await self._model_adapter.async_generate_chat_completion(
            [{"role": "user", "content": prompt}],
            model_name=model_name
        )
        
        # Extract response content
        response_content = response['choices'][0]['message']['content']
        
        # Extract JSON data from response
        recommendations = extract_json_from_response(response_content)
        
        # Validate response format
        if not isinstance(recommendations, list):
            logger.warning("Invalid recommendation format: expected list")
            return []
        
        logger.info(f"Asynchronously generated {len(recommendations)} {recommendation_type} recommendations")
        
        return recommendations
    
    async def batch_generate_recommendations(
        self,
        tribe_data_list: List[Dict[str, Any]],
        recommendation_type: str,
        data: Dict[str, Any],
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
        results = await asyncio.gather(*tasks)
        
        logger.info(f"Batch generated recommendations for {len(tribe_data_list)} tribes")
        
        return results
    
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
        
        # Generate ranking prompt with tribe data and items
        options = {
            'items': items,
            'item_type': item_type
        }
        prompt = get_recommendation_prompt('rank', normalized_tribe_data, options)
        
        # Call model to generate rankings
        response = self._model_adapter.generate_chat_completion(
            [{"role": "user", "content": prompt}],
            model_name=model_name
        )
        
        # Extract response content
        response_content = response['choices'][0]['message']['content']
        
        # Extract JSON data from response
        ranked_items = extract_json_from_response(response_content)
        
        # Validate response format
        if not isinstance(ranked_items, list):
            logger.warning("Invalid ranking format: expected list")
            return items  # Return original items if ranking fails
        
        logger.info(f"Ranked {len(ranked_items)} items by relevance")
        
        return ranked_items
    
    def close(self) -> None:
        """
        Close resources used by the model
        """
        if hasattr(self, '_model_adapter') and self._model_adapter is not None:
            self._model_adapter.close()
        logger.debug("Recommendation model resources closed")
    
    async def async_close(self) -> None:
        """
        Asynchronously close resources used by the model
        """
        if hasattr(self, '_model_adapter') and self._model_adapter is not None:
            await self._model_adapter.async_close()
        logger.debug("Recommendation model resources closed asynchronously")
    
    def __enter__(self):
        """
        Context manager entry method
        """
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Context manager exit method
        """
        self.close()
        if exc_val:
            logger.error(f"Exception in recommendation model context: {exc_val}")
    
    async def __aenter__(self):
        """
        Async context manager entry method
        """
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """
        Async context manager exit method
        """
        await self.async_close()
        if exc_val:
            logger.error(f"Exception in recommendation model async context: {exc_val}")