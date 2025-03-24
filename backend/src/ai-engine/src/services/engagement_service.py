import logging
import json
from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime

from ..models.engagement_model import EngagementModel, ENGAGEMENT_TYPES
from ..adapters.model_adapter import (
    ModelAdapterError, 
    ModelTimeoutError, 
    ModelAuthenticationError, 
    ModelRateLimitError, 
    ModelContentFilterError
)
from ..config.settings import DEFAULT_MODEL, ENGAGEMENT_CONFIG
from ..utils.data_preprocessing import normalize_tribe_data

# Set up logger
logger = logging.getLogger(__name__)

class EngagementService:
    """
    Service for generating AI-driven engagement content for Tribes, including
    conversation prompts, challenges, and activity suggestions.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the EngagementService with configuration.
        
        Args:
            config: Configuration dictionary
        """
        self._config = config or {}
        self._default_model = self._config.get('default_model', DEFAULT_MODEL)
        self._engagement_types = ENGAGEMENT_TYPES
        
        # Initialize engagement model
        self._model = EngagementModel(self._config)
        
        logger.info("EngagementService initialized")
    
    def generate_conversation_prompt(
        self, 
        tribe_data: Dict[str, Any], 
        prompt_type: str = 'general', 
        count: int = 3,
        model_name: str = None
    ) -> Dict[str, Any]:
        """
        Generate conversation starters for a Tribe based on member profiles and interaction history.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            prompt_type: Type of conversation prompt (general, personal, etc.)
            count: Number of prompts to generate
            model_name: Name of the AI model to use
            
        Returns:
            Response containing conversation prompts with explanations
        """
        # Validate inputs
        if not tribe_data:
            return {
                "status": "error", 
                "message": "Tribe data is required",
                "data": None
            }
        
        # Set defaults
        if prompt_type is None:
            prompt_type = 'general'
        
        if count is None:
            count = 3
        
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Generating {count} conversation prompts of type '{prompt_type}'")
        
        try:
            # Call the model
            prompts = self._model.generate_conversation_prompt(
                tribe_data=tribe_data,
                prompt_type=prompt_type,
                count=count,
                model_name=model_name
            )
            
            # Format the response
            response = {
                "status": "success",
                "message": f"Generated {len(prompts)} conversation prompts",
                "data": {
                    "prompts": prompts,
                    "metadata": {
                        "type": "conversation",
                        "prompt_type": prompt_type,
                        "count": len(prompts),
                        "model": model_name
                    }
                }
            }
            
            logger.info(f"Successfully generated {len(prompts)} conversation prompts")
            return response
            
        except (ModelAdapterError, ModelTimeoutError, ModelAuthenticationError, 
               ModelRateLimitError, ModelContentFilterError) as e:
            return self.handle_error(e, "generate_conversation_prompt")
        except Exception as e:
            logger.error(f"Unexpected error generating conversation prompts: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "data": None
            }
    
    def generate_challenge(
        self, 
        tribe_data: Dict[str, Any], 
        challenge_type: str = 'social',
        model_name: str = None
    ) -> Dict[str, Any]:
        """
        Generate a group challenge for a Tribe based on member profiles and shared interests.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            challenge_type: Type of challenge (social, creative, intellectual, physical)
            model_name: Name of the AI model to use
            
        Returns:
            Response containing challenge details including title, description, timeframe, and expected outcomes
        """
        # Validate inputs
        if not tribe_data:
            return {
                "status": "error", 
                "message": "Tribe data is required",
                "data": None
            }
        
        # Set defaults
        if challenge_type is None:
            challenge_type = 'social'
        
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Generating challenge of type '{challenge_type}'")
        
        try:
            # Call the model
            challenge = self._model.generate_challenge(
                tribe_data=tribe_data,
                challenge_type=challenge_type,
                model_name=model_name
            )
            
            # Format the response
            response = {
                "status": "success",
                "message": "Generated group challenge",
                "data": {
                    "challenge": challenge,
                    "metadata": {
                        "type": "challenge",
                        "challenge_type": challenge_type,
                        "model": model_name
                    }
                }
            }
            
            logger.info(f"Successfully generated group challenge: {challenge.get('title', 'Untitled')}")
            return response
            
        except (ModelAdapterError, ModelTimeoutError, ModelAuthenticationError, 
               ModelRateLimitError, ModelContentFilterError) as e:
            return self.handle_error(e, "generate_challenge")
        except Exception as e:
            logger.error(f"Unexpected error generating challenge: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "data": None
            }
    
    def generate_activity_suggestion(
        self, 
        tribe_data: Dict[str, Any], 
        activity_type: str = 'local', 
        count: int = 3,
        model_name: str = None
    ) -> Dict[str, Any]:
        """
        Generate activity suggestions for a Tribe based on member profiles and shared interests.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            activity_type: Type of activity (local, indoor, outdoor, virtual)
            count: Number of activities to suggest
            model_name: Name of the AI model to use
            
        Returns:
            Response containing activity suggestions with titles, descriptions, and personalization reasons
        """
        # Validate inputs
        if not tribe_data:
            return {
                "status": "error", 
                "message": "Tribe data is required",
                "data": None
            }
        
        # Set defaults
        if activity_type is None:
            activity_type = 'local'
        
        if count is None:
            count = 3
        
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Generating {count} activity suggestions of type '{activity_type}'")
        
        try:
            # Call the model
            activities = self._model.generate_activity_suggestion(
                tribe_data=tribe_data,
                activity_type=activity_type,
                count=count,
                model_name=model_name
            )
            
            # Format the response
            response = {
                "status": "success",
                "message": f"Generated {len(activities)} activity suggestions",
                "data": {
                    "activities": activities,
                    "metadata": {
                        "type": "activity",
                        "activity_type": activity_type,
                        "count": len(activities),
                        "model": model_name
                    }
                }
            }
            
            logger.info(f"Successfully generated {len(activities)} activity suggestions")
            return response
            
        except (ModelAdapterError, ModelTimeoutError, ModelAuthenticationError, 
               ModelRateLimitError, ModelContentFilterError) as e:
            return self.handle_error(e, "generate_activity_suggestion")
        except Exception as e:
            logger.error(f"Unexpected error generating activity suggestions: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "data": None
            }
    
    def generate_engagement_content(
        self, 
        tribe_data: Dict[str, Any], 
        engagement_type: str,
        options: Dict[str, Any] = None,
        model_name: str = None
    ) -> Dict[str, Any]:
        """
        Generate engagement content of a specified type for a Tribe.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            engagement_type: Type of engagement content (conversation, challenge, activity)
            options: Additional options for content generation
            model_name: Name of the AI model to use
            
        Returns:
            Response containing generated engagement content based on the specified type
        """
        # Validate inputs
        if not tribe_data:
            return {
                "status": "error", 
                "message": "Tribe data is required",
                "data": None
            }
        
        # Validate engagement type
        if engagement_type not in self._engagement_types:
            return {
                "status": "error",
                "message": f"Invalid engagement type: {engagement_type}. Must be one of: {', '.join(self._engagement_types.keys())}",
                "data": None
            }
        
        # Initialize options if not provided
        if options is None:
            options = {}
        
        # Set default model
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Generating engagement content of type '{engagement_type}'")
        
        try:
            # Normalize tribe data
            normalized_data = normalize_tribe_data(tribe_data)
            
            # Generate content based on engagement type
            if engagement_type == 'conversation':
                prompt_type = options.get('prompt_type', 'general')
                count = options.get('count', 3)
                return self.generate_conversation_prompt(normalized_data, prompt_type, count, model_name)
            
            elif engagement_type == 'challenge':
                challenge_type = options.get('challenge_type', 'social')
                return self.generate_challenge(normalized_data, challenge_type, model_name)
            
            elif engagement_type == 'activity':
                activity_type = options.get('activity_type', 'local')
                count = options.get('count', 3)
                return self.generate_activity_suggestion(normalized_data, activity_type, count, model_name)
            
            else:
                # This shouldn't happen due to validation above
                return {
                    "status": "error",
                    "message": f"Unhandled engagement type: {engagement_type}",
                    "data": None
                }
                
        except (ModelAdapterError, ModelTimeoutError, ModelAuthenticationError, 
               ModelRateLimitError, ModelContentFilterError) as e:
            return self.handle_error(e, f"generate_{engagement_type}_content")
        except Exception as e:
            logger.error(f"Unexpected error generating {engagement_type} content: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "data": None
            }
    
    async def async_generate_engagement_content(
        self, 
        tribe_data: Dict[str, Any], 
        engagement_type: str,
        options: Dict[str, Any] = None,
        model_name: str = None
    ) -> Dict[str, Any]:
        """
        Asynchronously generate engagement content of a specified type for a Tribe.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            engagement_type: Type of engagement content (conversation, challenge, activity)
            options: Additional options for content generation
            model_name: Name of the AI model to use
            
        Returns:
            Response containing generated engagement content based on the specified type
        """
        # Validate inputs
        if not tribe_data:
            return {
                "status": "error", 
                "message": "Tribe data is required",
                "data": None
            }
        
        # Validate engagement type
        if engagement_type not in self._engagement_types:
            return {
                "status": "error",
                "message": f"Invalid engagement type: {engagement_type}. Must be one of: {', '.join(self._engagement_types.keys())}",
                "data": None
            }
        
        # Initialize options if not provided
        if options is None:
            options = {}
        
        # Set default model
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Asynchronously generating engagement content of type '{engagement_type}'")
        
        try:
            # Normalize tribe data
            normalized_data = normalize_tribe_data(tribe_data)
            
            # Call the model's async method
            content = await self._model.async_generate_engagement_content(
                tribe_data=normalized_data,
                engagement_type=engagement_type,
                options=options,
                model_name=model_name
            )
            
            # Format the response
            response = {
                "status": "success",
                "message": f"Generated {engagement_type} content",
                "data": {
                    "content": content,
                    "metadata": {
                        "type": engagement_type,
                        "model": model_name,
                        **options
                    }
                }
            }
            
            logger.info(f"Successfully generated {engagement_type} content asynchronously")
            return response
            
        except (ModelAdapterError, ModelTimeoutError, ModelAuthenticationError, 
               ModelRateLimitError, ModelContentFilterError) as e:
            return self.handle_error(e, f"async_generate_{engagement_type}_content")
        except Exception as e:
            logger.error(f"Unexpected error asynchronously generating {engagement_type} content: {e}")
            return {
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "data": None
            }
    
    def batch_generate_engagement_content(
        self, 
        tribe_data_list: List[Dict[str, Any]], 
        engagement_type: str,
        options: Dict[str, Any] = None,
        model_name: str = None
    ) -> List[Dict[str, Any]]:
        """
        Generate engagement content for multiple tribes in batch.
        
        Args:
            tribe_data_list: List of tribe data dictionaries
            engagement_type: Type of engagement content (conversation, challenge, activity)
            options: Additional options for content generation
            model_name: Name of the AI model to use
            
        Returns:
            List of responses containing generated engagement content for each tribe
        """
        # Validate inputs
        if not tribe_data_list or not isinstance(tribe_data_list, list):
            return [{
                "status": "error", 
                "message": "Tribe data list is required and must be a list",
                "data": None
            }]
        
        # Validate engagement type
        if engagement_type not in self._engagement_types:
            return [{
                "status": "error",
                "message": f"Invalid engagement type: {engagement_type}. Must be one of: {', '.join(self._engagement_types.keys())}",
                "data": None
            }]
        
        # Initialize options if not provided
        if options is None:
            options = {}
        
        # Set default model
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Batch generating {engagement_type} content for {len(tribe_data_list)} tribes")
        
        try:
            # Call the model's batch method
            batch_results = self._model.batch_generate_engagement_content(
                tribe_data_list=tribe_data_list,
                engagement_type=engagement_type,
                options=options,
                model_name=model_name
            )
            
            # Format the responses
            responses = []
            for i, content in enumerate(batch_results):
                responses.append({
                    "status": "success",
                    "message": f"Generated {engagement_type} content for tribe {i+1}",
                    "data": {
                        "content": content,
                        "metadata": {
                            "type": engagement_type,
                            "tribe_index": i,
                            "model": model_name,
                            **options
                        }
                    }
                })
            
            logger.info(f"Successfully batch generated {engagement_type} content for {len(tribe_data_list)} tribes")
            return responses
            
        except (ModelAdapterError, ModelTimeoutError, ModelAuthenticationError, 
               ModelRateLimitError, ModelContentFilterError) as e:
            return [self.handle_error(e, f"batch_generate_{engagement_type}_content")]
        except Exception as e:
            logger.error(f"Unexpected error in batch generation: {e}")
            return [{
                "status": "error",
                "message": f"Unexpected error: {str(e)}",
                "data": None
            }]
    
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
        
        # Format response based on error type
        if isinstance(error, ModelTimeoutError):
            return {
                "status": "error",
                "message": f"Request timed out: {error.message}",
                "data": {
                    "error_type": "timeout",
                    "timeout": error.timeout,
                    "operation": operation,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        elif isinstance(error, ModelAuthenticationError):
            return {
                "status": "error",
                "message": f"Authentication error: {error.message}",
                "data": {
                    "error_type": "authentication",
                    "operation": operation,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        elif isinstance(error, ModelRateLimitError):
            return {
                "status": "error",
                "message": f"Rate limit exceeded: {error.message}",
                "data": {
                    "error_type": "rate_limit",
                    "retry_after": error.retry_after,
                    "operation": operation,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        elif isinstance(error, ModelContentFilterError):
            return {
                "status": "error",
                "message": f"Content filtered: {error.message}",
                "data": {
                    "error_type": "content_filter",
                    "filter_reason": error.filter_reason,
                    "operation": operation,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        elif isinstance(error, ModelAdapterError):
            return {
                "status": "error",
                "message": f"Model error: {error.message}",
                "data": {
                    "error_type": "model_error",
                    "operation": operation,
                    "timestamp": datetime.now().isoformat()
                }
            }
        
        else:
            return {
                "status": "error",
                "message": f"Unexpected error: {str(error)}",
                "data": {
                    "error_type": "unexpected",
                    "operation": operation,
                    "timestamp": datetime.now().isoformat()
                }
            }
    
    def close(self) -> None:
        """
        Close resources used by the service.
        """
        if hasattr(self, '_model') and self._model:
            self._model.close()
        logger.info("EngagementService closed")
    
    async def async_close(self) -> None:
        """
        Asynchronously close resources used by the service.
        """
        if hasattr(self, '_model') and self._model:
            await self._model.async_close()
        logger.info("EngagementService closed asynchronously")
    
    def __enter__(self):
        """Context manager entry method."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit method."""
        self.close()
        if exc_val:
            logger.error(f"Exception in EngagementService context: {exc_val}")
    
    async def __aenter__(self):
        """Async context manager entry method."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit method."""
        await self.async_close()
        if exc_val:
            logger.error(f"Exception in EngagementService async context: {exc_val}")