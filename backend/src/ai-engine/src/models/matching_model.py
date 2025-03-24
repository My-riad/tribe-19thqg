import logging
import json
import asyncio
from typing import Dict, List, Any, Optional, Union
import numpy as np

from ..config.settings import DEFAULT_MODEL, MODEL_CONFIGS, MATCHING_CONFIG
from ..adapters.model_adapter import create_model_adapter, ModelAdapterError
from ..utils.data_preprocessing import (
    normalize_profile_data,
    normalize_tribe_data,
    batch_normalize_profiles
)
from ..utils.prompt_engineering import (
    MatchingPromptGenerator,
    extract_json_from_response
)

# Set up logger
logger = logging.getLogger(__name__)

class MatchingModel:
    """
    Model for AI-powered matchmaking and tribe formation.
    
    This class provides methods for matching users with compatible tribes,
    forming balanced tribes from groups of users, and calculating compatibility
    scores between users and tribes.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the MatchingModel with configuration.
        
        Args:
            config: Configuration dictionary for the model including API keys,
                   model settings, and matching parameters
        """
        # Set default model from config or settings
        self._default_model = config.get('model', DEFAULT_MODEL)
        
        # Create model adapter using factory function
        adapter_config = config.get('adapter_config', {
            'provider': 'openrouter',
            'api_key': config.get('api_key', None)
        })
        self._model_adapter = create_model_adapter(adapter_config)
        
        # Initialize prompt generator for creating effective prompts
        self._prompt_generator = MatchingPromptGenerator(config)
        
        # Set matching configuration from settings or config override
        self._matching_config = config.get('matching_config', MATCHING_CONFIG)
        
        logger.info(f"MatchingModel initialized with model {self._default_model}")
    
    def match_user_to_tribes(self, user_profile: Dict[str, Any], 
                            tribes: List[Dict[str, Any]],
                            factor_weights: Dict[str, float] = None) -> List[Dict[str, Any]]:
        """
        Match a user to compatible existing tribes.
        
        Args:
            user_profile: User profile data with personality traits, interests, etc.
            tribes: List of tribe data to match against
            factor_weights: Optional dictionary of weights for different matching factors
                           (e.g. {"personality": 0.5, "interests": 0.3, "location": 0.2})
            
        Returns:
            List of tribe matches with compatibility scores and reasoning
        """
        # Normalize input data for consistent processing
        normalized_user = normalize_profile_data(user_profile)
        normalized_tribes = [normalize_tribe_data(tribe) for tribe in tribes]
        
        # Generate prompt for matching using the prompt generator
        prompt = self._prompt_generator.generate_user_tribe_matching_prompt(
            normalized_user, normalized_tribes
        )
        
        try:
            # Send prompt to AI model through model adapter
            response = self._model_adapter.generate_text(
                prompt=prompt,
                model_name=self._default_model
            )
            
            # Parse and structure the AI response
            match_results = extract_json_from_response(response)
            
            # Validate response format and required fields
            if not self.validate_matching_response(match_results, 'user_tribe'):
                logger.warning("Invalid match results format, returning empty list")
                return []
            
            # Sort results by compatibility score (descending)
            if isinstance(match_results, list):
                match_results = sorted(
                    match_results, 
                    key=lambda x: x.get('compatibilityScore', 0), 
                    reverse=True
                )
            
            return match_results
            
        except ModelAdapterError as e:
            logger.error(f"Error in match_user_to_tribes: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in match_user_to_tribes: {e}")
            return []
    
    def form_tribes(self, user_profiles: List[Dict[str, Any]], 
                   min_tribe_size: int = None, 
                   max_tribe_size: int = None) -> List[Dict[str, Any]]:
        """
        Form balanced and compatible tribes from a pool of users.
        
        Args:
            user_profiles: List of user profile data
            min_tribe_size: Minimum members per tribe (default from matching_config)
            max_tribe_size: Maximum members per tribe (default from matching_config)
            
        Returns:
            List of formed tribes with member assignments and compatibility reasoning
        """
        # Normalize input data for consistent processing
        normalized_profiles = batch_normalize_profiles(user_profiles)
        
        # Use defaults from config if not provided
        if min_tribe_size is None:
            min_tribe_size = self._matching_config['min_tribe_size']
        
        if max_tribe_size is None:
            max_tribe_size = self._matching_config['max_tribe_size']
        
        # Generate prompt for tribe formation
        prompt = self._prompt_generator.generate_tribe_formation_prompt(
            normalized_profiles, min_tribe_size, max_tribe_size
        )
        
        try:
            # Send prompt to AI model through model adapter
            response = self._model_adapter.generate_text(
                prompt=prompt,
                model_name=self._default_model
            )
            
            # Parse and structure the AI response
            tribe_results = extract_json_from_response(response)
            
            # Validate response format and required fields
            if not self.validate_matching_response(tribe_results, 'tribe_formation'):
                logger.warning("Invalid tribe formation results format, returning empty list")
                return []
            
            return tribe_results
            
        except ModelAdapterError as e:
            logger.error(f"Error in form_tribes: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in form_tribes: {e}")
            return []
    
    def calculate_compatibility(self, user_profile: Dict[str, Any], 
                               target: Dict[str, Any], 
                               target_type: str = 'user',
                               factor_weights: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Calculate compatibility between a user and another user or tribe.
        
        Args:
            user_profile: User profile data
            target: Target user or tribe data
            target_type: Type of target ('user' or 'tribe')
            factor_weights: Optional dictionary of weights for different compatibility factors
            
        Returns:
            Detailed compatibility analysis with overall score and factor breakdown
        """
        # Normalize input data for consistent processing
        normalized_user = normalize_profile_data(user_profile)
        
        # Normalize target based on target_type
        if target_type == 'user':
            normalized_target = normalize_profile_data(target)
        else:  # tribe
            normalized_target = normalize_tribe_data(target)
        
        # Generate prompt for compatibility analysis
        prompt = self._prompt_generator.generate_compatibility_analysis_prompt(
            normalized_user, normalized_target, target_type
        )
        
        try:
            # Send prompt to AI model through model adapter
            response = self._model_adapter.generate_text(
                prompt=prompt,
                model_name=self._default_model
            )
            
            # Parse and structure the AI response
            compatibility_result = extract_json_from_response(response)
            
            # Validate response format and required fields
            if not self.validate_matching_response(compatibility_result, 'compatibility'):
                logger.warning("Invalid compatibility result format, returning empty dict")
                return {}
            
            return compatibility_result
            
        except ModelAdapterError as e:
            logger.error(f"Error in calculate_compatibility: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error in calculate_compatibility: {e}")
            return {}
    
    def perform_matching(self, matching_type: str, data: Dict[str, Any], 
                        options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Perform matching operation based on specified type.
        
        Args:
            matching_type: Type of matching operation ('user_tribe', 'tribe_formation', 'compatibility')
            data: Data required for the matching operation
            options: Additional options for the matching operation
            
        Returns:
            Matching results based on the matching type
        """
        if options is None:
            options = {}
        
        # Validate matching_type
        valid_types = ['user_tribe', 'tribe_formation', 'compatibility']
        if matching_type not in valid_types:
            logger.error(f"Invalid matching type: {matching_type}")
            raise ValueError(f"Matching type must be one of: {', '.join(valid_types)}")
        
        try:
            # Perform appropriate matching operation based on matching_type
            if matching_type == 'user_tribe':
                # Check required data fields
                if 'user_profile' not in data or 'tribes' not in data:
                    raise ValueError("user_tribe matching requires 'user_profile' and 'tribes' data")
                
                return self.match_user_to_tribes(
                    data['user_profile'], 
                    data['tribes'],
                    options.get('factor_weights')
                )
                
            elif matching_type == 'tribe_formation':
                # Check required data fields
                if 'user_profiles' not in data:
                    raise ValueError("tribe_formation matching requires 'user_profiles' data")
                
                return self.form_tribes(
                    data['user_profiles'],
                    options.get('min_tribe_size'),
                    options.get('max_tribe_size')
                )
                
            elif matching_type == 'compatibility':
                # Check required data fields
                if 'user_profile' not in data or 'target' not in data:
                    raise ValueError("compatibility matching requires 'user_profile' and 'target' data")
                
                return self.calculate_compatibility(
                    data['user_profile'],
                    data['target'],
                    options.get('target_type', 'user'),
                    options.get('factor_weights')
                )
        
        except ValueError as e:
            logger.error(f"Value error in perform_matching: {e}")
            raise
        except Exception as e:
            logger.error(f"Error in perform_matching: {e}")
            if matching_type == 'user_tribe' or matching_type == 'tribe_formation':
                return []
            else:
                return {}
    
    async def async_perform_matching(self, matching_type: str, data: Dict[str, Any], 
                                   options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Asynchronously perform matching operation.
        
        Args:
            matching_type: Type of matching operation ('user_tribe', 'tribe_formation', 'compatibility')
            data: Data required for the matching operation
            options: Additional options for the matching operation
            
        Returns:
            Matching results based on the matching type
        """
        if options is None:
            options = {}
        
        # Validate matching_type
        valid_types = ['user_tribe', 'tribe_formation', 'compatibility']
        if matching_type not in valid_types:
            logger.error(f"Invalid matching type: {matching_type}")
            raise ValueError(f"Matching type must be one of: {', '.join(valid_types)}")
        
        try:
            # Perform appropriate matching operation based on matching_type
            if matching_type == 'user_tribe':
                # Check required data fields
                if 'user_profile' not in data or 'tribes' not in data:
                    raise ValueError("user_tribe matching requires 'user_profile' and 'tribes' data")
                
                # Normalize input data
                normalized_user = normalize_profile_data(data['user_profile'])
                normalized_tribes = [normalize_tribe_data(tribe) for tribe in data['tribes']]
                
                # Generate prompt for matching
                prompt = self._prompt_generator.generate_user_tribe_matching_prompt(
                    normalized_user, normalized_tribes
                )
                
                # Send prompt to AI model asynchronously
                response = await self._model_adapter.async_generate_text(
                    prompt=prompt,
                    model_name=self._default_model
                )
                
                # Parse and structure the response
                match_results = extract_json_from_response(response)
                
                # Validate response format
                if not self.validate_matching_response(match_results, 'user_tribe'):
                    logger.warning("Invalid match results format, returning empty list")
                    return []
                
                # Sort results by compatibility score (descending)
                if isinstance(match_results, list):
                    match_results = sorted(
                        match_results, 
                        key=lambda x: x.get('compatibilityScore', 0), 
                        reverse=True
                    )
                
                return match_results
                
            elif matching_type == 'tribe_formation':
                # Check required data fields
                if 'user_profiles' not in data:
                    raise ValueError("tribe_formation matching requires 'user_profiles' data")
                
                # Normalize input data
                normalized_profiles = batch_normalize_profiles(data['user_profiles'])
                
                # Use defaults from config if not provided
                min_tribe_size = options.get('min_tribe_size', self._matching_config['min_tribe_size'])
                max_tribe_size = options.get('max_tribe_size', self._matching_config['max_tribe_size'])
                
                # Generate prompt for tribe formation
                prompt = self._prompt_generator.generate_tribe_formation_prompt(
                    normalized_profiles, min_tribe_size, max_tribe_size
                )
                
                # Send prompt to AI model asynchronously
                response = await self._model_adapter.async_generate_text(
                    prompt=prompt,
                    model_name=self._default_model
                )
                
                # Parse and structure the response
                tribe_results = extract_json_from_response(response)
                
                # Validate response format
                if not self.validate_matching_response(tribe_results, 'tribe_formation'):
                    logger.warning("Invalid tribe formation results format, returning empty list")
                    return []
                
                return tribe_results
                
            elif matching_type == 'compatibility':
                # Check required data fields
                if 'user_profile' not in data or 'target' not in data:
                    raise ValueError("compatibility matching requires 'user_profile' and 'target' data")
                
                # Normalize input data
                normalized_user = normalize_profile_data(data['user_profile'])
                
                # Normalize target based on type
                target_type = options.get('target_type', 'user')
                if target_type == 'user':
                    normalized_target = normalize_profile_data(data['target'])
                else:  # tribe
                    normalized_target = normalize_tribe_data(data['target'])
                
                # Generate prompt for compatibility analysis
                prompt = self._prompt_generator.generate_compatibility_analysis_prompt(
                    normalized_user, normalized_target, target_type
                )
                
                # Send prompt to AI model asynchronously
                response = await self._model_adapter.async_generate_text(
                    prompt=prompt,
                    model_name=self._default_model
                )
                
                # Parse and structure the response
                compatibility_result = extract_json_from_response(response)
                
                # Validate response format
                if not self.validate_matching_response(compatibility_result, 'compatibility'):
                    logger.warning("Invalid compatibility result format, returning empty dict")
                    return {}
                
                return compatibility_result
                
        except ValueError as e:
            logger.error(f"Value error in async_perform_matching: {e}")
            raise
        except Exception as e:
            logger.error(f"Error in async_perform_matching: {e}")
            if matching_type == 'user_tribe' or matching_type == 'tribe_formation':
                return []
            else:
                return {}
    
    def batch_perform_matching(self, matching_type: str, batch_data: List[Dict[str, Any]], 
                              options: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Perform matching operations in batch for multiple users.
        
        Args:
            matching_type: Type of matching operation
            batch_data: List of data items for batch processing
            options: Additional options for the matching operations
            
        Returns:
            List of matching results for each item in the batch
        """
        if options is None:
            options = {}
        
        results = []
        
        for item_data in batch_data:
            try:
                # Process each item in batch_data using perform_matching
                item_result = self.perform_matching(matching_type, item_data, options)
                results.append(item_result)
            except Exception as e:
                logger.error(f"Error processing batch item: {e}")
                # Add empty result to maintain order with the batch items
                if matching_type == 'user_tribe' or matching_type == 'tribe_formation':
                    results.append([])
                else:
                    results.append({})
        
        return results
    
    def validate_matching_response(self, response: Dict[str, Any], matching_type: str) -> bool:
        """
        Validate that a matching response contains required data.
        
        Args:
            response: Response data to validate
            matching_type: Type of matching operation
            
        Returns:
            True if valid, False otherwise
        """
        if matching_type == 'user_tribe':
            # Validate tribe matches format
            if not isinstance(response, list):
                logger.warning("user_tribe response should be a list")
                return False
            
            # Check each match item format
            for item in response:
                if not isinstance(item, dict):
                    logger.warning("Each match item should be a dictionary")
                    return False
                
                # Check required fields
                required_fields = ['tribeId', 'compatibilityScore', 'compatibilityReasoning']
                for field in required_fields:
                    if field not in item:
                        logger.warning(f"Match item missing required field: {field}")
                        return False
            
            return True
            
        elif matching_type == 'tribe_formation':
            # Validate tribe formation format
            if not isinstance(response, list):
                logger.warning("tribe_formation response should be a list")
                return False
            
            # Check each tribe item format
            for item in response:
                if not isinstance(item, dict):
                    logger.warning("Each tribe item should be a dictionary")
                    return False
                
                # Check required fields
                required_fields = ['memberIds', 'compatibilityScore', 'formationReasoning']
                for field in required_fields:
                    if field not in item:
                        logger.warning(f"Tribe item missing required field: {field}")
                        return False
                
                # Check memberIds format
                if not isinstance(item['memberIds'], list):
                    logger.warning("memberIds should be a list")
                    return False
            
            return True
            
        elif matching_type == 'compatibility':
            # Validate compatibility analysis format
            if not isinstance(response, dict):
                logger.warning("compatibility response should be a dictionary")
                return False
            
            # Check required fields
            if 'overall' not in response or 'dimensions' not in response:
                logger.warning("Compatibility result missing required fields")
                return False
            
            # Check overall format
            overall = response['overall']
            if not isinstance(overall, dict) or 'score' not in overall or 'summary' not in overall:
                logger.warning("overall field has invalid format")
                return False
            
            # Check dimensions format
            dimensions = response['dimensions']
            if not isinstance(dimensions, dict):
                logger.warning("dimensions field should be a dictionary")
                return False
            
            # Check required dimension types
            required_dimensions = ['personality', 'interests', 'communication', 'values']
            found_dimensions = 0
            for dim_name, dim_data in dimensions.items():
                if not isinstance(dim_data, dict) or 'score' not in dim_data or 'reasoning' not in dim_data:
                    logger.warning(f"Dimension {dim_name} has invalid format")
                    return False
                
                # Count how many required dimensions are found (using partial matching)
                for req_dim in required_dimensions:
                    if req_dim.lower() in dim_name.lower():
                        found_dimensions += 1
                        break
            
            # At least 3 of the 4 required dimensions should be present
            if found_dimensions < 3:
                logger.warning("Not enough required dimensions found in compatibility analysis")
                return False
            
            return True
            
        else:
            logger.warning(f"Unknown matching type for validation: {matching_type}")
            return False
    
    def close(self) -> None:
        """
        Close resources used by the model.
        """
        if hasattr(self, '_model_adapter'):
            self._model_adapter.close()
        
        logger.info("MatchingModel resources closed")