import logging
import json
import hashlib
import time
import asyncio
from typing import Dict, List, Any, Optional, Union

from ..config.settings import DEFAULT_MODEL, CACHE_ENABLED, CACHE_TTL, MATCHING_CONFIG
from ..models.matching_model import MatchingModel
from ..adapters.model_adapter import (
    ModelAdapterError, 
    ModelTimeoutError, 
    ModelAuthenticationError,
    ModelRateLimitError, 
    ModelContentFilterError
)
from ..utils.data_preprocessing import (
    normalize_profile_data,
    normalize_tribe_data,
    batch_normalize_profiles
)

# Set up logger
logger = logging.getLogger(__name__)

# Define matching types for reference
MATCHING_TYPES = {
    'user_tribe': 'Match user to tribes',
    'tribe_formation': 'Form tribes from users',
    'compatibility': 'Calculate compatibility'
}

class MatchingService:
    """
    Service for AI-powered matchmaking and tribe formation, providing a high-level 
    interface to the MatchingModel with caching and error handling.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the MatchingService with configuration.
        
        Args:
            config: Configuration dictionary which may include:
                - model: Name of the default AI model to use
                - cache_enabled: Whether to enable result caching
                - cache_ttl: Time-to-live for cached results in seconds
                - matching_config: Configuration for matching parameters
        """
        if config is None:
            config = {}
        
        # Initialize logging
        logger.info("Initializing matching service")
        
        # Store matching types dictionary
        self._matching_types = MATCHING_TYPES
        
        # Initialize caching
        self._cache_enabled = config.get('cache_enabled', CACHE_ENABLED)
        self._cache_ttl = config.get('cache_ttl', CACHE_TTL)
        
        if self._cache_enabled:
            self._cache = {}
            logger.info(f"Matching result caching enabled with TTL {self._cache_ttl}s")
        else:
            self._cache = None
            logger.info("Matching result caching disabled")
        
        # Set matching configuration
        self._matching_config = config.get('matching_config', MATCHING_CONFIG)
        
        # Set default model
        self._default_model = config.get('model', DEFAULT_MODEL)
        
        # Create the matching model
        self._matching_model = MatchingModel(config)
        
        logger.info(f"Matching service initialized with default model {self._default_model}")
    
    def match_user_to_tribes(self, user_profile: Dict[str, Any], 
                            tribes: List[Dict[str, Any]],
                            factor_weights: Dict[str, float] = None,
                            model_name: str = None) -> List[Dict[str, Any]]:
        """
        Match a user to compatible existing tribes.
        
        Args:
            user_profile: User profile data with personality traits, interests, etc.
            tribes: List of tribe data to match against
            factor_weights: Optional dictionary of weights for different matching factors
                           (e.g. {"personality": 0.5, "interests": 0.3, "location": 0.2})
            model_name: Name of the AI model to use for matching
            
        Returns:
            List of tribe matches with compatibility scores and reasoning
        """
        # Validate input parameters
        if not user_profile or not isinstance(user_profile, dict):
            logger.warning("Invalid user_profile provided to match_user_to_tribes")
            return []
        
        if not tribes or not isinstance(tribes, list):
            logger.warning("Invalid tribes list provided to match_user_to_tribes")
            return []
        
        # Initialize empty factor weights if not provided
        if factor_weights is None:
            factor_weights = {}
        
        # Use default model if not specified
        if model_name is None:
            model_name = self._default_model
        
        # Generate cache key
        cache_key = self.generate_cache_key(
            'user_tribe',
            {'user_profile': user_profile, 'tribes': tribes, 'factor_weights': factor_weights},
            {},
            model_name
        )
        
        # Check cache for existing result
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug("Using cached match_user_to_tribes result")
            return cached_result
        
        try:
            # Call the matching model
            result = self._matching_model.match_user_to_tribes(
                user_profile, tribes, factor_weights
            )
            
            # Cache the result
            self.cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in match_user_to_tribes: {e}")
            return []
    
    def form_tribes(self, user_profiles: List[Dict[str, Any]], 
                   min_tribe_size: int = None, 
                   max_tribe_size: int = None,
                   model_name: str = None) -> List[Dict[str, Any]]:
        """
        Form balanced and compatible tribes from a pool of users.
        
        Args:
            user_profiles: List of user profile data
            min_tribe_size: Minimum members per tribe (default from matching_config)
            max_tribe_size: Maximum members per tribe (default from matching_config)
            model_name: Name of the AI model to use for tribe formation
            
        Returns:
            List of formed tribes with member assignments and compatibility reasoning
        """
        # Validate input parameters
        if not user_profiles or not isinstance(user_profiles, list):
            logger.warning("Invalid user_profiles provided to form_tribes")
            return []
        
        # Use defaults from config if not provided
        if min_tribe_size is None:
            min_tribe_size = self._matching_config['min_tribe_size']
        
        if max_tribe_size is None:
            max_tribe_size = self._matching_config['max_tribe_size']
        
        # Use default model if not specified
        if model_name is None:
            model_name = self._default_model
        
        # Generate cache key
        cache_key = self.generate_cache_key(
            'tribe_formation',
            {'user_profiles': user_profiles},
            {'min_tribe_size': min_tribe_size, 'max_tribe_size': max_tribe_size},
            model_name
        )
        
        # Check cache for existing result
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug("Using cached form_tribes result")
            return cached_result
        
        try:
            # Call the matching model
            result = self._matching_model.form_tribes(
                user_profiles, min_tribe_size, max_tribe_size
            )
            
            # Cache the result
            self.cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in form_tribes: {e}")
            return []
    
    def calculate_compatibility(self, user_profile: Dict[str, Any], 
                               target: Dict[str, Any], 
                               target_type: str = 'user',
                               factor_weights: Dict[str, float] = None,
                               model_name: str = None) -> Dict[str, Any]:
        """
        Calculate compatibility between a user and another user or tribe.
        
        Args:
            user_profile: User profile data
            target: Target user or tribe data
            target_type: Type of target ('user' or 'tribe')
            factor_weights: Optional dictionary of weights for different compatibility factors
            model_name: Name of the AI model to use for compatibility calculation
            
        Returns:
            Detailed compatibility analysis with overall score and factor breakdown
        """
        # Validate input parameters
        if not user_profile or not isinstance(user_profile, dict):
            logger.warning("Invalid user_profile provided to calculate_compatibility")
            return {}
        
        if not target or not isinstance(target, dict):
            logger.warning("Invalid target provided to calculate_compatibility")
            return {}
        
        # Initialize empty factor weights if not provided
        if factor_weights is None:
            factor_weights = {}
        
        # Use default model if not specified
        if model_name is None:
            model_name = self._default_model
        
        # Generate cache key
        cache_key = self.generate_cache_key(
            'compatibility',
            {'user_profile': user_profile, 'target': target},
            {'target_type': target_type, 'factor_weights': factor_weights},
            model_name
        )
        
        # Check cache for existing result
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug("Using cached calculate_compatibility result")
            return cached_result
        
        try:
            # Call the matching model
            result = self._matching_model.calculate_compatibility(
                user_profile, target, target_type, factor_weights
            )
            
            # Cache the result
            self.cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in calculate_compatibility: {e}")
            return {}
    
    def perform_matching(self, matching_type: str, data: Dict[str, Any] = None, 
                        options: Dict[str, Any] = None, model_name: str = None) -> Dict[str, Any]:
        """
        Perform matching operation based on specified type.
        
        Args:
            matching_type: Type of matching operation ('user_tribe', 'tribe_formation', 'compatibility')
            data: Data required for the matching operation
            options: Additional options for the matching operation
            model_name: Name of the AI model to use
            
        Returns:
            Matching results based on the matching type
        """
        # Validate matching type
        if matching_type not in self._matching_types:
            raise ValueError(f"Invalid matching type: {matching_type}. Must be one of: {', '.join(self._matching_types.keys())}")
        
        # Initialize empty dictionaries if not provided
        if data is None:
            data = {}
        
        if options is None:
            options = {}
        
        # Use default model if not specified
        if model_name is None:
            model_name = self._default_model
        
        # Generate cache key
        cache_key = self.generate_cache_key(matching_type, data, options, model_name)
        
        # Check cache for existing result
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Using cached result for {matching_type} matching")
            return cached_result
        
        try:
            # Perform matching based on type
            result = self._matching_model.perform_matching(matching_type, data, options)
            
            # Cache the result
            self.cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            error_response = self.handle_error(e, f"perform_matching - {matching_type}")
            return error_response
    
    async def async_perform_matching(self, matching_type: str, data: Dict[str, Any] = None, 
                                   options: Dict[str, Any] = None, 
                                   model_name: str = None) -> Dict[str, Any]:
        """
        Asynchronously perform matching operation based on specified type.
        
        Args:
            matching_type: Type of matching operation ('user_tribe', 'tribe_formation', 'compatibility')
            data: Data required for the matching operation
            options: Additional options for the matching operation
            model_name: Name of the AI model to use
            
        Returns:
            Matching results based on the matching type
        """
        # Validate matching type
        if matching_type not in self._matching_types:
            raise ValueError(f"Invalid matching type: {matching_type}. Must be one of: {', '.join(self._matching_types.keys())}")
        
        # Initialize empty dictionaries if not provided
        if data is None:
            data = {}
        
        if options is None:
            options = {}
        
        # Use default model if not specified
        if model_name is None:
            model_name = self._default_model
        
        # Generate cache key
        cache_key = self.generate_cache_key(matching_type, data, options, model_name)
        
        # Check cache for existing result
        cached_result = self.get_cached_result(cache_key)
        if cached_result:
            logger.debug(f"Using cached result for async {matching_type} matching")
            return cached_result
        
        try:
            # Perform matching asynchronously based on type
            result = await self._matching_model.async_perform_matching(matching_type, data, options)
            
            # Cache the result
            self.cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            error_response = self.handle_error(e, f"async_perform_matching - {matching_type}")
            return error_response
    
    def batch_perform_matching(self, matching_type: str, batch_data: List[Dict[str, Any]], 
                              options: Dict[str, Any] = None, 
                              model_name: str = None) -> List[Dict[str, Any]]:
        """
        Perform matching operations in batch for multiple users or tribes.
        
        Args:
            matching_type: Type of matching operation
            batch_data: List of data items for batch processing
            options: Additional options for the matching operations
            model_name: Name of the AI model to use
            
        Returns:
            List of matching results for each item in the batch
        """
        # Validate matching type
        if matching_type not in self._matching_types:
            raise ValueError(f"Invalid matching type: {matching_type}. Must be one of: {', '.join(self._matching_types.keys())}")
        
        # Validate batch data
        if not batch_data or not isinstance(batch_data, list):
            raise ValueError("batch_data must be a non-empty list")
        
        # Initialize empty options dictionary if not provided
        if options is None:
            options = {}
        
        # Use default model if not specified
        if model_name is None:
            model_name = self._default_model
        
        try:
            # Perform batch matching
            results = self._matching_model.batch_perform_matching(matching_type, batch_data, options)
            
            # Cache individual results if enabled
            if self._cache_enabled:
                for i, data_item in enumerate(batch_data):
                    cache_key = self.generate_cache_key(matching_type, data_item, options, model_name)
                    self.cache_result(cache_key, results[i])
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch_perform_matching - {matching_type}: {e}")
            # Return a list of error responses matching the batch size
            error_response = self.handle_error(e, f"batch_perform_matching - {matching_type}")
            return [error_response] * len(batch_data)
    
    def get_cached_result(self, cache_key: str) -> Any:
        """
        Retrieve cached matching result if available.
        
        Args:
            cache_key: The cache key for the result
            
        Returns:
            Cached result or None if not found or expired
        """
        if not self._cache_enabled or not self._cache:
            return None
        
        if cache_key in self._cache:
            cache_entry = self._cache[cache_key]
            timestamp = cache_entry.get('timestamp', 0)
            result = cache_entry.get('result')
            
            # Check if the entry is expired
            current_time = time.time()
            if current_time - timestamp > self._cache_ttl:
                # Entry is expired, remove it
                logger.debug(f"Cache entry expired for key {cache_key}")
                del self._cache[cache_key]
                return None
            
            return result
        
        return None
    
    def cache_result(self, cache_key: str, result: Any) -> None:
        """
        Cache matching result with TTL.
        
        Args:
            cache_key: The cache key for the result
            result: The result to cache
        """
        if not self._cache_enabled or not self._cache:
            return
        
        # Store result with timestamp
        self._cache[cache_key] = {
            'result': result,
            'timestamp': time.time()
        }
        
        logger.debug(f"Cached result for key {cache_key}")
    
    def generate_cache_key(self, matching_type: str, data: Dict[str, Any], 
                          options: Dict[str, Any], model_name: str) -> str:
        """
        Generate a unique cache key based on input parameters.
        
        Args:
            matching_type: Type of matching operation
            data: Input data for the operation
            options: Additional options for the operation
            model_name: Name of the AI model used
            
        Returns:
            Unique cache key (SHA-256 hash)
        """
        # Create a dictionary with all parameters
        key_data = {
            'matching_type': matching_type,
            'data': data,
            'options': options,
            'model_name': model_name
        }
        
        # Convert to JSON string
        key_json = json.dumps(key_data, sort_keys=True)
        
        # Generate SHA-256 hash
        key_hash = hashlib.sha256(key_json.encode()).hexdigest()
        
        return key_hash
    
    def clear_cache(self) -> None:
        """
        Clear the matching result cache.
        """
        if self._cache_enabled and self._cache:
            self._cache.clear()
            logger.info("Matching cache cleared")
    
    def handle_error(self, error: Exception, operation: str) -> Dict[str, Any]:
        """
        Handle errors from model operations and format appropriate responses.
        
        Args:
            error: The exception that occurred
            operation: The operation that was being performed
            
        Returns:
            Error response with appropriate status and message
        """
        logger.error(f"Error in {operation}: {error}")
        
        # Default error response
        error_response = {
            'status': 'error',
            'error': {
                'type': type(error).__name__,
                'message': str(error),
                'operation': operation,
                'timestamp': time.time()
            }
        }
        
        # Customize response based on error type
        if isinstance(error, ModelTimeoutError):
            error_response['error']['type'] = 'timeout'
            error_response['error']['message'] = f"The request timed out after {error.timeout} seconds"
            
        elif isinstance(error, ModelAuthenticationError):
            error_response['error']['type'] = 'authentication'
            error_response['error']['message'] = "Authentication failed with the AI model provider"
            
        elif isinstance(error, ModelRateLimitError):
            error_response['error']['type'] = 'rate_limit'
            error_response['error']['message'] = "Rate limit exceeded for AI model provider"
            if hasattr(error, 'retry_after') and error.retry_after:
                error_response['error']['retry_after'] = error.retry_after
                
        elif isinstance(error, ModelContentFilterError):
            error_response['error']['type'] = 'content_filter'
            error_response['error']['message'] = "Content was filtered by the AI model provider"
            if hasattr(error, 'filter_reason') and error.filter_reason:
                error_response['error']['filter_reason'] = error.filter_reason
                
        elif isinstance(error, ModelAdapterError):
            error_response['error']['type'] = 'model_error'
            
        elif isinstance(error, ValueError):
            error_response['error']['type'] = 'validation_error'
            
        return error_response
    
    def get_matching_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about matching operations.
        
        Returns:
            Statistics about matching operations, cache usage, etc.
        """
        stats = {
            'cache': {
                'enabled': self._cache_enabled,
                'size': len(self._cache) if self._cache_enabled and self._cache else 0,
                'ttl': self._cache_ttl
            },
            'default_model': self._default_model,
            'matching_config': self._matching_config
        }
        
        return stats
    
    def close(self) -> None:
        """
        Close resources used by the service.
        """
        if hasattr(self, '_matching_model'):
            self._matching_model.close()
        
        self.clear_cache()
        logger.info("Matching service closed")
    
    async def async_close(self) -> None:
        """
        Asynchronously close resources used by the service.
        """
        if hasattr(self, '_matching_model'):
            # Call asynchronous close if it exists, otherwise fall back to synchronous
            if hasattr(self._matching_model, 'async_close'):
                await self._matching_model.async_close()
            else:
                self._matching_model.close()
        
        self.clear_cache()
        logger.info("Matching service closed asynchronously")
    
    def __enter__(self):
        """Context manager entry method."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit method."""
        self.close()
        if exc_val:
            logger.error(f"Exception occurred: {exc_val}")
    
    async def __aenter__(self):
        """Async context manager entry method."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit method."""
        await self.async_close()
        if exc_val:
            logger.error(f"Exception occurred: {exc_val}")