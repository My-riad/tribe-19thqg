import logging
import json
from typing import Dict, List, Any, Optional, Union
import asyncio
import hashlib
import time

from ..config.settings import (
    DEFAULT_MODEL,
    CACHE_ENABLED,
    CACHE_TTL,
    PERSONALITY_CONFIG
)
from ..models.personality_model import PersonalityModel
from ..adapters.model_adapter import (
    ModelAdapterError, 
    ModelTimeoutError, 
    ModelAuthenticationError, 
    ModelRateLimitError, 
    ModelContentFilterError
)
from ..utils.data_preprocessing import (
    normalize_profile_data,
    clean_text_data,
    batch_normalize_profiles
)

# Set up logger
logger = logging.getLogger(__name__)

# Define analysis types for reference
ANALYSIS_TYPES = {
    'assessment': 'Analyze personality assessment',
    'communication_style': 'Analyze communication style',
    'interests': 'Analyze interests',
    'behavior_update': 'Update profile from behavior'
}


class PersonalityService:
    """Service for AI-powered personality analysis, providing a high-level interface to the PersonalityModel with caching and error handling"""

    def __init__(self, config: Dict = None):
        """Initialize the PersonalityService with configuration"""
        # Initialize logger for tracking service operations
        self._logger = logging.getLogger(__name__)
        
        # Store analysis types dictionary
        self._analysis_types = ANALYSIS_TYPES
        
        # Set cache_enabled from config or settings.CACHE_ENABLED
        config = config or {}
        self._cache_enabled = config.get('cache_enabled', CACHE_ENABLED)
        self._cache_ttl = config.get('cache_ttl', CACHE_TTL)  # Default TTL in seconds
        
        # Initialize in-memory cache dictionary if caching is enabled
        self._cache = {} if self._cache_enabled else None
        
        # Set personality_config from config or settings.PERSONALITY_CONFIG
        self._personality_config = config.get('personality_config', PERSONALITY_CONFIG)
        
        # Set default_model from config or settings.DEFAULT_MODEL
        self._default_model = config.get('default_model', DEFAULT_MODEL)
        
        # Create PersonalityModel instance with config
        self._personality_model = PersonalityModel(config)
        
        logger.info("Personality service initialized")

    def analyze_assessment(self, assessment_data: Dict, model_name: str = None) -> Dict:
        """
        Analyze personality assessment responses to generate a personality profile
        
        Args:
            assessment_data: User's responses to personality assessment
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing personality profile with traits, communication style, and social preferences
        """
        # Validate assessment_data structure
        if not isinstance(assessment_data, dict):
            logger.error("Invalid assessment data: must be a dictionary")
            return {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key('assessment', assessment_data, {}, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for assessment analysis with model {model}")
            return cached_result
        
        # If cache miss, preprocess assessment_data
        try:
            normalized_data = normalize_profile_data(assessment_data)
            
            # Call personality model's analyze_assessment method
            result = self._personality_model.analyze_assessment(normalized_data, model)
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error analyzing assessment: {str(e)}")
            return self.handle_error(e, "analyze_assessment")

    def analyze_communication_style(self, interaction_data: Dict, model_name: str = None) -> Dict:
        """
        Analyze interaction data to determine a user's communication style
        
        Args:
            interaction_data: Data about the user's communication patterns
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing communication style analysis with directness, information processing, expression, and conflict approach
        """
        # Validate interaction_data structure
        if not isinstance(interaction_data, dict):
            logger.error("Invalid interaction data: must be a dictionary")
            return {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key('communication_style', interaction_data, {}, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for communication style analysis with model {model}")
            return cached_result
        
        # If cache miss, preprocess interaction_data
        try:
            clean_data = clean_text_data(json.dumps(interaction_data))
            normalized_data = json.loads(clean_data)
            
            # Call personality model's analyze_communication_style method
            result = self._personality_model.analyze_communication_style(normalized_data, model)
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error analyzing communication style: {str(e)}")
            return self.handle_error(e, "analyze_communication_style")

    def analyze_interests(self, profile_data: Dict, model_name: str = None) -> Dict:
        """
        Analyze profile data to categorize and score user interests
        
        Args:
            profile_data: User profile data containing interest information
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing categorized interests with relevance scores
        """
        # Validate profile_data structure
        if not isinstance(profile_data, dict):
            logger.error("Invalid profile data: must be a dictionary")
            return {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key('interests', profile_data, {}, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for interests analysis with model {model}")
            return cached_result
        
        # If cache miss, preprocess profile_data
        try:
            normalized_data = normalize_profile_data(profile_data)
            
            # Call personality model's analyze_interests method
            result = self._personality_model.analyze_interests(normalized_data, model)
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error analyzing interests: {str(e)}")
            return self.handle_error(e, "analyze_interests")

    def update_profile_from_behavior(self, current_profile: Dict, behavior_data: Dict, model_name: str = None) -> Dict:
        """
        Update personality profile based on observed user behavior
        
        Args:
            current_profile: Current personality profile
            behavior_data: New behavioral data to incorporate
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Updated personality profile
        """
        # Validate current_profile and behavior_data structures
        if not isinstance(current_profile, dict) or not isinstance(behavior_data, dict):
            logger.error("Invalid profile or behavior data: both must be dictionaries")
            return current_profile  # Return original profile if invalid input
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key('behavior_update', {
            'current_profile': current_profile,
            'behavior_data': behavior_data
        }, {}, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for profile update from behavior with model {model}")
            return cached_result
        
        # If cache miss, preprocess current_profile and behavior_data
        try:
            normalized_profile = normalize_profile_data(current_profile)
            normalized_behavior = clean_text_data(json.dumps(behavior_data))
            behavior_data_clean = json.loads(normalized_behavior)
            
            # Call personality model's update_profile_from_behavior method
            result = self._personality_model.update_profile_from_behavior(
                normalized_profile, behavior_data_clean, model
            )
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error updating profile from behavior: {str(e)}")
            return self.handle_error(e, "update_profile_from_behavior")

    def get_compatibility_factors(self, profile: Dict) -> Dict:
        """
        Extract key compatibility factors from a personality profile for matchmaking
        
        Args:
            profile: Personality profile
            
        Returns:
            Compatibility factors for matchmaking
        """
        # Validate profile structure
        if not isinstance(profile, dict):
            logger.error("Invalid profile: must be a dictionary")
            return {}
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key('compatibility_factors', profile, {}, None)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug("Cache hit for compatibility factors")
            return cached_result
        
        # If cache miss, call personality model's get_compatibility_factors method
        try:
            result = self._personality_model.get_compatibility_factors(profile)
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error extracting compatibility factors: {str(e)}")
            return {}  # Return empty dict on error

    def perform_analysis(self, analysis_type: str, data: Dict = None, options: Dict = None, model_name: str = None) -> Dict:
        """
        Perform personality analysis based on specified type
        
        Args:
            analysis_type: Type of analysis to perform
            data: Input data for analysis
            options: Additional options for analysis
            model_name: Optional model name to use
            
        Returns:
            Analysis results based on the analysis type
        """
        # Validate analysis_type against supported types in self._analysis_types
        if analysis_type not in self._analysis_types:
            valid_types = ", ".join(self._analysis_types.keys())
            logger.error(f"Invalid analysis type: {analysis_type}. Valid types: {valid_types}")
            return {"error": f"Invalid analysis type. Valid types: {valid_types}"}
        
        # Initialize empty data dictionary if not provided
        data = data or {}
        
        # Initialize empty options dictionary if not provided
        options = options or {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key(analysis_type, data, options, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for {analysis_type} with model {model}")
            return cached_result
        
        # If cache miss, dispatch to appropriate analysis method based on analysis_type
        try:
            result = {}
            
            # For 'assessment', call analyze_assessment
            if analysis_type == 'assessment':
                result = self.analyze_assessment(data, model)
            # For 'communication_style', call analyze_communication_style
            elif analysis_type == 'communication_style':
                result = self.analyze_communication_style(data, model)
            # For 'interests', call analyze_interests
            elif analysis_type == 'interests':
                result = self.analyze_interests(data, model)
            # For 'behavior_update', call update_profile_from_behavior
            elif analysis_type == 'behavior_update':
                current_profile = data.get('current_profile', {})
                behavior_data = data.get('behavior_data', {})
                result = self.update_profile_from_behavior(current_profile, behavior_data, model)
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error performing {analysis_type} analysis: {str(e)}")
            return self.handle_error(e, f"perform_{analysis_type}")

    async def async_analyze_assessment(self, assessment_data: Dict, model_name: str = None) -> Dict:
        """
        Asynchronously analyze personality assessment responses
        
        Args:
            assessment_data: User's responses to personality assessment
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing personality profile with traits, communication style, and social preferences
        """
        # Validate assessment_data structure
        if not isinstance(assessment_data, dict):
            logger.error("Invalid assessment data: must be a dictionary")
            return {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key('assessment', assessment_data, {}, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for async assessment analysis with model {model}")
            return cached_result
        
        # If cache miss, preprocess assessment_data
        try:
            normalized_data = normalize_profile_data(assessment_data)
            
            # Call personality model's async_analyze_assessment method
            result = await self._personality_model.async_analyze_assessment(normalized_data, model)
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error in async assessment analysis: {str(e)}")
            return self.handle_error(e, "async_analyze_assessment")

    async def async_perform_analysis(self, analysis_type: str, data: Dict = None, options: Dict = None, model_name: str = None) -> Dict:
        """
        Asynchronously perform personality analysis based on specified type
        
        Args:
            analysis_type: Type of analysis to perform
            data: Input data for analysis
            options: Additional options for analysis
            model_name: Optional model name to use
            
        Returns:
            Analysis results based on the analysis type
        """
        # Validate analysis_type against supported types in self._analysis_types
        if analysis_type not in self._analysis_types:
            valid_types = ", ".join(self._analysis_types.keys())
            logger.error(f"Invalid analysis type: {analysis_type}. Valid types: {valid_types}")
            return {"error": f"Invalid analysis type. Valid types: {valid_types}"}
        
        # Initialize empty data dictionary if not provided
        data = data or {}
        
        # Initialize empty options dictionary if not provided
        options = options or {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        # Check cache for existing result if caching is enabled
        cache_key = self.generate_cache_key(analysis_type, data, options, model)
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for async {analysis_type} with model {model}")
            return cached_result
        
        # If cache miss, dispatch to appropriate async analysis method based on analysis_type
        try:
            result = {}
            
            # For 'assessment', call async_analyze_assessment
            if analysis_type == 'assessment':
                result = await self.async_analyze_assessment(data, model)
            # For other types, create and await a task for the synchronous method
            else:
                if analysis_type == 'communication_style':
                    task = asyncio.create_task(
                        asyncio.to_thread(self.analyze_communication_style, data, model)
                    )
                elif analysis_type == 'interests':
                    task = asyncio.create_task(
                        asyncio.to_thread(self.analyze_interests, data, model)
                    )
                elif analysis_type == 'behavior_update':
                    current_profile = data.get('current_profile', {})
                    behavior_data = data.get('behavior_data', {})
                    task = asyncio.create_task(
                        asyncio.to_thread(self.update_profile_from_behavior, 
                                         current_profile, behavior_data, model)
                    )
                
                result = await task
            
            # Cache the result if caching is enabled
            self.cache_result(cache_key, result)
            
            return result
        except Exception as e:
            logger.error(f"Error performing async {analysis_type} analysis: {str(e)}")
            return self.handle_error(e, f"async_perform_{analysis_type}")

    def batch_analyze_assessments(self, assessment_data_list: List[Dict], model_name: str = None) -> List[Dict]:
        """
        Analyze multiple personality assessments in batch
        
        Args:
            assessment_data_list: List of assessment data dictionaries
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            List of personality profiles
        """
        # Validate assessment_data_list is a list and not empty
        if not isinstance(assessment_data_list, list) or not assessment_data_list:
            logger.error("Invalid assessment data list: must be a non-empty list")
            return []
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        try:
            # Preprocess assessment data using batch_normalize_profiles
            normalized_data_list = batch_normalize_profiles(assessment_data_list)
            
            # Call personality model's batch_analyze_assessments method
            results = self._personality_model.batch_analyze_assessments(normalized_data_list, model)
            
            # Cache individual results if caching is enabled
            if self._cache_enabled:
                for i, assessment_data in enumerate(assessment_data_list):
                    if i < len(results):  # Check to avoid index error
                        cache_key = self.generate_cache_key('assessment', assessment_data, {}, model)
                        self.cache_result(cache_key, results[i])
            
            return results
        except Exception as e:
            logger.error(f"Error in batch assessment analysis: {str(e)}")
            # Try to process each assessment individually
            results = []
            for assessment_data in assessment_data_list:
                try:
                    result = self.analyze_assessment(assessment_data, model)
                    results.append(result)
                except Exception as individual_error:
                    logger.error(f"Error processing individual assessment: {str(individual_error)}")
                    results.append({})  # Add empty result for failed assessments
            
            return results

    def batch_perform_analysis(self, analysis_type: str, batch_data: List[Dict], options: Dict = None, model_name: str = None) -> List[Dict]:
        """
        Perform personality analysis in batch for multiple users
        
        Args:
            analysis_type: Type of analysis to perform
            batch_data: List of data items to analyze
            options: Additional options for analysis
            model_name: Optional model name to use
            
        Returns:
            List of analysis results for each item in the batch
        """
        # Validate analysis_type against supported types in self._analysis_types
        if analysis_type not in self._analysis_types:
            valid_types = ", ".join(self._analysis_types.keys())
            logger.error(f"Invalid analysis type: {analysis_type}. Valid types: {valid_types}")
            return [{"error": f"Invalid analysis type. Valid types: {valid_types}"}]
        
        # Validate batch_data is a list and not empty
        if not isinstance(batch_data, list) or not batch_data:
            logger.error("Invalid batch data: must be a non-empty list")
            return []
        
        # Initialize empty options dictionary if not provided
        options = options or {}
        
        # Set default model_name to self._default_model if not provided
        model = model_name or self._default_model
        
        try:
            # If analysis_type is 'assessment', call batch_analyze_assessments
            if analysis_type == 'assessment':
                return self.batch_analyze_assessments(batch_data, model)
            
            # For other types, process each item individually
            results = []
            for data_item in batch_data:
                try:
                    if analysis_type == 'communication_style':
                        result = self.analyze_communication_style(data_item, model)
                    elif analysis_type == 'interests':
                        result = self.analyze_interests(data_item, model)
                    elif analysis_type == 'behavior_update':
                        current_profile = data_item.get('current_profile', {})
                        behavior_data = data_item.get('behavior_data', {})
                        result = self.update_profile_from_behavior(current_profile, behavior_data, model)
                    else:
                        # This should never happen due to earlier validation
                        result = {}
                    
                    results.append(result)
                    
                    # Cache individual results if caching is enabled
                    if self._cache_enabled:
                        cache_key = self.generate_cache_key(analysis_type, data_item, options, model)
                        self.cache_result(cache_key, result)
                        
                except Exception as e:
                    logger.error(f"Error processing {analysis_type} for item in batch: {str(e)}")
                    results.append({})  # Add empty result for failed items
            
            return results
        except Exception as e:
            logger.error(f"Error in batch {analysis_type} analysis: {str(e)}")
            return [{}] * len(batch_data)  # Return list of empty dicts on error

    def get_cached_result(self, cache_key: str) -> Optional[Dict]:
        """
        Retrieve cached analysis result if available
        
        Args:
            cache_key: Unique key for cached result
            
        Returns:
            Cached result or None if not found
        """
        # Check if caching is enabled
        if not self._cache_enabled or not self._cache:
            return None
        
        # Check if cache_key exists in cache dictionary
        cache_entry = self._cache.get(cache_key)
        if not cache_entry:
            return None
        
        # If exists, check if entry is expired based on TTL
        timestamp = cache_entry.get('timestamp', 0)
        current_time = time.time()
        
        if current_time - timestamp > self._cache_ttl:
            # If expired, remove from cache and return None
            del self._cache[cache_key]
            return None
        
        # If not expired, return cached result
        return cache_entry.get('result')

    def cache_result(self, cache_key: str, result: Dict) -> None:
        """
        Cache analysis result with TTL
        
        Args:
            cache_key: Unique key for cached result
            result: Analysis result to cache
        """
        # Check if caching is enabled
        if not self._cache_enabled or not self._cache:
            return
        
        # Create cache entry with result and timestamp
        cache_entry = {
            'result': result,
            'timestamp': time.time()
        }
        
        # Store entry in cache dictionary with cache_key
        self._cache[cache_key] = cache_entry

    def generate_cache_key(self, analysis_type: str, data: Dict, options: Dict, model_name: str) -> str:
        """
        Generate a unique cache key based on input parameters
        
        Args:
            analysis_type: Type of analysis
            data: Input data for analysis
            options: Additional options for analysis
            model_name: Model name
            
        Returns:
            Unique cache key
        """
        # Create a dictionary with all input parameters
        key_data = {
            'analysis_type': analysis_type,
            'data': data,
            'options': options,
            'model_name': model_name
        }
        
        # Convert dictionary to JSON string
        key_json = json.dumps(key_data, sort_keys=True)
        
        # Generate SHA-256 hash of the JSON string
        key_hash = hashlib.sha256(key_json.encode()).hexdigest()
        
        return key_hash

    def clear_cache(self) -> None:
        """Clear the analysis result cache"""
        # Check if caching is enabled
        if self._cache_enabled and self._cache:
            self._cache.clear()
            logger.info("Personality service cache cleared")

    def handle_error(self, error: Exception, operation: str) -> Dict:
        """
        Handle errors from model operations and format appropriate responses
        
        Args:
            error: The exception that occurred
            operation: The operation being performed
            
        Returns:
            Error response with appropriate status and message
        """
        # Log the error with operation details
        logger.error(f"Error in {operation}: {str(error)}")
        
        error_response = {
            "error": True,
            "operation": operation,
            "timestamp": time.time()
        }
        
        # Check error type and format appropriate response
        if isinstance(error, ModelTimeoutError):
            # For ModelTimeoutError, return timeout error response
            error_response.update({
                "error_type": "timeout",
                "message": f"Request timed out after {error.timeout}s",
                "timeout": error.timeout
            })
        elif isinstance(error, ModelAuthenticationError):
            # For ModelAuthenticationError, return authentication error response
            error_response.update({
                "error_type": "authentication",
                "message": "Authentication failed with the AI model provider"
            })
        elif isinstance(error, ModelRateLimitError):
            # For ModelRateLimitError, return rate limit error response with retry information
            error_response.update({
                "error_type": "rate_limit",
                "message": "Rate limit exceeded for AI model provider",
                "retry_after": error.retry_after
            })
        elif isinstance(error, ModelContentFilterError):
            # For ModelContentFilterError, return content filter error response
            error_response.update({
                "error_type": "content_filter",
                "message": "Content was flagged by the AI model's content filter",
                "filter_reason": error.filter_reason
            })
        elif isinstance(error, ModelAdapterError):
            # For ModelAdapterError, return general model error response
            error_response.update({
                "error_type": "model_error",
                "message": f"Error with AI model: {str(error)}"
            })
        else:
            # For other exceptions, return unexpected error response
            error_response.update({
                "error_type": "unexpected",
                "message": f"Unexpected error: {str(error)}"
            })
        
        # Include error details and timestamp in response
        return error_response

    def get_analysis_statistics(self) -> Dict:
        """
        Get statistics about personality analysis operations
        
        Returns:
            Statistics about analysis operations
        """
        # Collect statistics about cache hits/misses
        stats = {
            "cache": {
                "enabled": self._cache_enabled,
                "size": len(self._cache) if self._cache_enabled else 0,
                "ttl": self._cache_ttl
            },
            "models": {},
            "analysis_types": {
                analysis_type: 0 for analysis_type in self._analysis_types
            }
        }
        
        # Collect statistics about analysis types performed
        # Collect statistics about model usage
        # Return dictionary with collected statistics
        return stats

    def close(self) -> None:
        """Close resources used by the service"""
        # Close the personality model if it exists
        if hasattr(self, '_personality_model'):
            self._personality_model.close()
        
        # Clear the cache
        self.clear_cache()
        
        logger.info("Personality service closed")

    async def async_close(self) -> None:
        """Asynchronously close resources used by the service"""
        # Asynchronously close the personality model if it exists
        if hasattr(self, '_personality_model'):
            # No async_close in PersonalityModel, so use synchronous close
            self._personality_model.close()
        
        # Clear the cache
        self.clear_cache()
        
        logger.info("Personality service closed asynchronously")

    def __enter__(self):
        """Context manager entry method"""
        # Return self for use in context manager
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit method"""
        # Close service resources
        self.close()
        # Log any exceptions that occurred
        if exc_val:
            logger.error(f"Exception occurred in PersonalityService context: {exc_val}")

    async def __aenter__(self):
        """Async context manager entry method"""
        # Return self for use in async context manager
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit method"""
        # Asynchronously close service resources
        await self.async_close()
        # Log any exceptions that occurred
        if exc_val:
            logger.error(f"Exception occurred in PersonalityService async context: {exc_val}")