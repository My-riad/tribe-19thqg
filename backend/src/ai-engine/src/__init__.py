"""
AI Engine for the Tribe platform.

This module provides AI-powered services for:
- Matchmaking: Automatically assign users to compatible Tribes based on profiles
- Personality Analysis: Analyze user traits, interests, and communication styles
- Engagement: Generate conversation prompts and activity suggestions
- Recommendations: Suggest events and activities tailored to group preferences

These services are designed to create and sustain meaningful small-group connections
and encourage users to transition from digital to physical interactions.
"""

import logging
import importlib
from typing import Dict, Any, Optional

# Import configuration settings
from .config.settings import DEFAULT_MODEL, MODEL_CONFIGS

# Import model adapter components
from .adapters.model_adapter import (
    create_model_adapter,
    ModelAdapter,
    ModelAdapterError,
    ModelTimeoutError,
    ModelAuthenticationError,
    ModelRateLimitError,
    ModelContentFilterError
)

# Set up module logger
logger = logging.getLogger(__name__)

# Module version
__version__ = "0.1.0"


def create_service(service_type: str, config: Dict[str, Any] = None) -> Any:
    """
    Factory function to create a service instance with the specified configuration.
    
    Args:
        service_type: Type of service to create ('matching', 'personality', 'engagement', 'recommendation')
        config: Configuration dictionary for the service
        
    Returns:
        Service instance of the specified type
        
    Raises:
        ValueError: If service_type is not supported
    """
    if config is None:
        config = {}
    
    logger.info(f"Creating {service_type} service")
    
    if service_type == 'matching':
        # Import dynamically to avoid circular imports
        from .services.matching import MatchingService
        return MatchingService(config)
    
    elif service_type == 'personality':
        from .services.personality import PersonalityService
        return PersonalityService(config)
    
    elif service_type == 'engagement':
        from .services.engagement import EngagementService
        return EngagementService(config)
    
    elif service_type == 'recommendation':
        from .services.recommendation import RecommendationService
        return RecommendationService(config)
    
    else:
        supported_types = ['matching', 'personality', 'engagement', 'recommendation']
        raise ValueError(f"Unsupported service type: {service_type}. Supported types: {', '.join(supported_types)}")


def create_matching_service(config: Dict[str, Any] = None) -> Any:
    """
    Convenience function to create a MatchingService instance.
    
    Args:
        config: Configuration dictionary for the service
        
    Returns:
        Instance of MatchingService
    """
    return create_service('matching', config)


def create_personality_service(config: Dict[str, Any] = None) -> Any:
    """
    Convenience function to create a PersonalityService instance.
    
    Args:
        config: Configuration dictionary for the service
        
    Returns:
        Instance of PersonalityService
    """
    return create_service('personality', config)


def create_engagement_service(config: Dict[str, Any] = None) -> Any:
    """
    Convenience function to create an EngagementService instance.
    
    Args:
        config: Configuration dictionary for the service
        
    Returns:
        Instance of EngagementService
    """
    return create_service('engagement', config)


def create_recommendation_service(config: Dict[str, Any] = None) -> Any:
    """
    Convenience function to create a RecommendationService instance.
    
    Args:
        config: Configuration dictionary for the service
        
    Returns:
        Instance of RecommendationService
    """
    return create_service('recommendation', config)


def configure_logging(log_level: str = 'INFO') -> None:
    """
    Configure logging for the AI Engine module.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    
    # Add handler to the root logger
    root_logger = logging.getLogger()
    root_logger.addHandler(console_handler)
    
    logger.info(f"AI Engine logging configured with level: {log_level}")