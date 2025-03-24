import logging
import json
import asyncio
from typing import Dict, List, Any, Optional

from ..adapters.model_adapter import create_model_adapter
from ..config.settings import DEFAULT_MODEL, ENGAGEMENT_CONFIG
from ..utils.data_preprocessing import normalize_tribe_data
from ..utils.prompt_engineering import (
    EngagementPromptGenerator,
    extract_json_from_response
)

# Set up logger
logger = logging.getLogger(__name__)

# Define engagement types for easy reference
ENGAGEMENT_TYPES = {
    'conversation': 'Generate conversation starters',
    'challenge': 'Generate group challenges',
    'activity': 'Generate spontaneous activity ideas'
}

class EngagementModel:
    """
    Model for generating AI-driven engagement content for Tribes, including
    conversation prompts, challenges, and activity suggestions.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the EngagementModel with configuration.
        
        Args:
            config: Configuration dictionary
        """
        self._config = config
        self._default_model = config.get('default_model', DEFAULT_MODEL)
        self._engagement_types = ENGAGEMENT_TYPES
        
        # Initialize model adapter
        self._model_adapter = create_model_adapter(config)
        
        # Initialize prompt generator
        self._prompt_generator = EngagementPromptGenerator(config)
        
        logger.info("EngagementModel initialized with configuration")
    
    def generate_conversation_prompt(
        self, 
        tribe_data: Dict[str, Any], 
        prompt_type: str = 'general', 
        count: int = 3,
        model_name: str = None
    ) -> List[Dict[str, str]]:
        """
        Generate conversation starters for a Tribe based on member profiles and interaction history.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            prompt_type: Type of conversation prompt (general, personal, etc.)
            count: Number of prompts to generate
            model_name: Name of the AI model to use
            
        Returns:
            List of generated conversation prompts with explanations
        """
        try:
            # Normalize tribe data
            normalized_data = normalize_tribe_data(tribe_data)
            
            # Use default model if not provided
            if model_name is None:
                model_name = self._default_model
            
            # Generate prompt
            prompt = self._prompt_generator.generate_conversation_prompts_prompt(
                normalized_data, prompt_type, count
            )
            
            # Call the model
            response = self._model_adapter.generate_chat_completion(
                [{"role": "user", "content": prompt}],
                model_name=model_name
            )
            
            # Extract the content from the response
            content = response["choices"][0]["message"]["content"]
            
            # Parse the response
            result = extract_json_from_response(content)
            
            # Validate response format
            if not isinstance(result, list):
                logger.warning(f"Expected response to be a list of prompts, got {type(result)}")
                return []
            
            # Validate that each prompt has the required fields
            validated_prompts = []
            for item in result:
                if isinstance(item, dict) and "prompt" in item and "explanation" in item:
                    validated_prompts.append(item)
                else:
                    logger.warning(f"Skipping invalid prompt item: {item}")
            
            logger.info(f"Generated {len(validated_prompts)} conversation prompts for tribe")
            return validated_prompts
        
        except Exception as e:
            logger.error(f"Error generating conversation prompts: {e}")
            return []
    
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
            Challenge details including title, description, timeframe, and expected outcomes
        """
        try:
            # Normalize tribe data
            normalized_data = normalize_tribe_data(tribe_data)
            
            # Use default model if not provided
            if model_name is None:
                model_name = self._default_model
            
            # Generate prompt
            prompt = self._prompt_generator.generate_group_challenge_prompt(
                normalized_data, challenge_type
            )
            
            # Call the model
            response = self._model_adapter.generate_chat_completion(
                [{"role": "user", "content": prompt}],
                model_name=model_name
            )
            
            # Extract the content from the response
            content = response["choices"][0]["message"]["content"]
            
            # Parse the response
            result = extract_json_from_response(content)
            
            # Validate response format
            if not isinstance(result, dict):
                logger.warning(f"Expected response to be a challenge object, got {type(result)}")
                return {}
            
            # Validate that the challenge has the required fields
            required_fields = ["title", "description", "timeframe", "expectedOutcomes"]
            for field in required_fields:
                if field not in result:
                    logger.warning(f"Challenge missing required field: {field}")
                    result[field] = ""
            
            logger.info(f"Generated challenge '{result.get('title', 'Untitled')}' for tribe")
            return result
        
        except Exception as e:
            logger.error(f"Error generating challenge: {e}")
            return {}
    
    def generate_activity_suggestion(
        self, 
        tribe_data: Dict[str, Any], 
        activity_type: str = 'local', 
        count: int = 3,
        model_name: str = None
    ) -> List[Dict[str, Any]]:
        """
        Generate activity suggestions for a Tribe based on member profiles and shared interests.
        
        Args:
            tribe_data: Data about the tribe, including member profiles
            activity_type: Type of activity (local, indoor, outdoor, virtual)
            count: Number of activities to suggest
            model_name: Name of the AI model to use
            
        Returns:
            List of activity suggestions with titles, descriptions, and personalization reasons
        """
        try:
            # Normalize tribe data
            normalized_data = normalize_tribe_data(tribe_data)
            
            # Use default model if not provided
            if model_name is None:
                model_name = self._default_model
            
            # Generate prompt
            prompt = self._prompt_generator.generate_activity_suggestions_prompt(
                normalized_data, activity_type, count
            )
            
            # Call the model
            response = self._model_adapter.generate_chat_completion(
                [{"role": "user", "content": prompt}],
                model_name=model_name
            )
            
            # Extract the content from the response
            content = response["choices"][0]["message"]["content"]
            
            # Parse the response
            result = extract_json_from_response(content)
            
            # Validate response format
            if not isinstance(result, list):
                logger.warning(f"Expected response to be a list of activities, got {type(result)}")
                return []
            
            # Validate that each activity has the required fields
            validated_activities = []
            for item in result:
                if isinstance(item, dict) and "title" in item and "description" in item and "personalizationReason" in item:
                    validated_activities.append(item)
                else:
                    logger.warning(f"Skipping invalid activity item: {item}")
            
            logger.info(f"Generated {len(validated_activities)} activity suggestions for tribe")
            return validated_activities
        
        except Exception as e:
            logger.error(f"Error generating activity suggestions: {e}")
            return []
    
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
            Generated engagement content based on the specified type
        """
        # Validate engagement type
        if engagement_type not in self._engagement_types:
            logger.error(f"Invalid engagement type: {engagement_type}")
            raise ValueError(f"Invalid engagement type: {engagement_type}. Must be one of: {', '.join(self._engagement_types.keys())}")
        
        # Initialize options dictionary if not provided
        if options is None:
            options = {}
        
        # Use default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Generating {engagement_type} engagement content for tribe")
        
        # Generate content based on engagement type
        if engagement_type == 'conversation':
            prompt_type = options.get('prompt_type', 'general')
            count = options.get('count', 3)
            return self.generate_conversation_prompt(tribe_data, prompt_type, count, model_name)
        
        elif engagement_type == 'challenge':
            challenge_type = options.get('challenge_type', 'social')
            return self.generate_challenge(tribe_data, challenge_type, model_name)
        
        elif engagement_type == 'activity':
            activity_type = options.get('activity_type', 'local')
            count = options.get('count', 3)
            return self.generate_activity_suggestion(tribe_data, activity_type, count, model_name)
        
        # This shouldn't happen due to validation above
        logger.error(f"Unhandled engagement type: {engagement_type}")
        return {}
    
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
            Generated engagement content based on the specified type
        """
        # Validate engagement type
        if engagement_type not in self._engagement_types:
            logger.error(f"Invalid engagement type: {engagement_type}")
            raise ValueError(f"Invalid engagement type: {engagement_type}. Must be one of: {', '.join(self._engagement_types.keys())}")
        
        # Initialize options dictionary if not provided
        if options is None:
            options = {}
        
        # Use default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        try:
            # Normalize tribe data
            normalized_data = normalize_tribe_data(tribe_data)
            
            logger.info(f"Asynchronously generating {engagement_type} engagement content for tribe")
            
            # Generate appropriate prompt based on engagement type
            prompt = None
            if engagement_type == 'conversation':
                prompt_type = options.get('prompt_type', 'general')
                count = options.get('count', 3)
                prompt = self._prompt_generator.generate_conversation_prompts_prompt(
                    normalized_data, prompt_type, count
                )
            
            elif engagement_type == 'challenge':
                challenge_type = options.get('challenge_type', 'social')
                prompt = self._prompt_generator.generate_group_challenge_prompt(
                    normalized_data, challenge_type
                )
            
            elif engagement_type == 'activity':
                activity_type = options.get('activity_type', 'local')
                count = options.get('count', 3)
                prompt = self._prompt_generator.generate_activity_suggestions_prompt(
                    normalized_data, activity_type, count
                )
            
            # Call the model asynchronously
            response = await self._model_adapter.async_generate_chat_completion(
                [{"role": "user", "content": prompt}],
                model_name=model_name
            )
            
            # Extract the content from the response
            content = response["choices"][0]["message"]["content"]
            
            # Parse the response
            result = extract_json_from_response(content)
            
            # Format and return result based on engagement type
            if engagement_type == 'conversation':
                if not isinstance(result, list):
                    logger.warning(f"Expected response to be a list of prompts, got {type(result)}")
                    return []
                
                # Validate that each prompt has the required fields
                validated_prompts = []
                for item in result:
                    if isinstance(item, dict) and "prompt" in item and "explanation" in item:
                        validated_prompts.append(item)
                    else:
                        logger.warning(f"Skipping invalid prompt item: {item}")
                
                logger.info(f"Asynchronously generated {len(validated_prompts)} conversation prompts for tribe")
                return validated_prompts
            
            elif engagement_type == 'challenge':
                if not isinstance(result, dict):
                    logger.warning(f"Expected response to be a challenge object, got {type(result)}")
                    return {}
                
                # Validate that the challenge has the required fields
                required_fields = ["title", "description", "timeframe", "expectedOutcomes"]
                for field in required_fields:
                    if field not in result:
                        logger.warning(f"Challenge missing required field: {field}")
                        result[field] = ""
                
                logger.info(f"Asynchronously generated challenge '{result.get('title', 'Untitled')}' for tribe")
                return result
            
            elif engagement_type == 'activity':
                if not isinstance(result, list):
                    logger.warning(f"Expected response to be a list of activities, got {type(result)}")
                    return []
                
                # Validate that each activity has the required fields
                validated_activities = []
                for item in result:
                    if isinstance(item, dict) and "title" in item and "description" in item and "personalizationReason" in item:
                        validated_activities.append(item)
                    else:
                        logger.warning(f"Skipping invalid activity item: {item}")
                
                logger.info(f"Asynchronously generated {len(validated_activities)} activity suggestions for tribe")
                return validated_activities
            
            # This shouldn't happen due to validation above
            logger.error(f"Unhandled engagement type: {engagement_type}")
            return {}
        
        except Exception as e:
            logger.error(f"Error asynchronously generating engagement content: {e}")
            return {}
    
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
            List of generated engagement content for each tribe
        """
        # Validate engagement type
        if engagement_type not in self._engagement_types:
            logger.error(f"Invalid engagement type: {engagement_type}")
            raise ValueError(f"Invalid engagement type: {engagement_type}. Must be one of: {', '.join(self._engagement_types.keys())}")
        
        # Initialize options dictionary if not provided
        if options is None:
            options = {}
        
        # Use default model if not provided
        if model_name is None:
            model_name = self._default_model
        
        logger.info(f"Batch generating {engagement_type} engagement content for {len(tribe_data_list)} tribes")
        
        # Generate engagement content for each tribe
        results = []
        for i, tribe_data in enumerate(tribe_data_list):
            try:
                logger.debug(f"Processing tribe {i+1} of {len(tribe_data_list)}")
                content = self.generate_engagement_content(
                    tribe_data, engagement_type, options, model_name
                )
                results.append(content)
            except Exception as e:
                logger.error(f"Error generating engagement content for tribe {i+1}: {e}")
                results.append({})
        
        logger.info(f"Completed batch generation for {len(tribe_data_list)} tribes")
        return results
    
    def close(self) -> None:
        """
        Close resources used by the model.
        """
        if hasattr(self, '_model_adapter') and self._model_adapter:
            self._model_adapter.close()
        logger.info("Engagement model closed")
    
    async def async_close(self) -> None:
        """
        Asynchronously close resources used by the model.
        """
        if hasattr(self, '_model_adapter') and self._model_adapter:
            await self._model_adapter.async_close()
        logger.info("Engagement model closed asynchronously")
    
    def __enter__(self):
        """Context manager entry method."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit method."""
        self.close()
        if exc_val:
            logger.error(f"Exception occurred in engagement model context: {exc_val}")
    
    async def __aenter__(self):
        """Async context manager entry method."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit method."""
        await self.async_close()
        if exc_val:
            logger.error(f"Exception occurred in engagement model async context: {exc_val}")