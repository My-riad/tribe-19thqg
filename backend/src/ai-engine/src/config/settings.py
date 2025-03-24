import os
import logging
from typing import Dict, Any
from dotenv import load_dotenv

def load_environment() -> None:
    """
    Load environment variables from .env file if it exists
    """
    load_dotenv()
    logging.debug("Environment variables loaded from .env file if present")

# Environment settings
ENV = os.getenv('AI_ENGINE_ENV', 'development')
DEBUG = ENV == 'development' or os.getenv('AI_ENGINE_DEBUG', 'False').lower() == 'true'
LOG_LEVEL = os.getenv('AI_ENGINE_LOG_LEVEL', 'DEBUG' if DEBUG else 'INFO')
LOG_FILE = os.getenv('AI_ENGINE_LOG_FILE', None)

# API settings
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_API_URL = os.getenv('OPENROUTER_API_URL', 'https://openrouter.ai')
DEFAULT_MODEL = os.getenv('DEFAULT_AI_MODEL', 'openai/gpt-4')
MODEL_TIMEOUT = int(os.getenv('AI_MODEL_TIMEOUT', '30'))

# Cache settings
CACHE_ENABLED = os.getenv('AI_CACHE_ENABLED', 'True').lower() == 'true'
CACHE_TTL = int(os.getenv('AI_CACHE_TTL', '3600'))  # Default 1 hour
REDIS_URL = os.getenv('REDIS_URL', None)

# Model configurations
MODEL_CONFIGS = {
    'openai/gpt-4': {
        'temperature': 0.7,
        'max_tokens': 1000,
        'top_p': 1.0,
        'frequency_penalty': 0.0,
        'presence_penalty': 0.0,
        'stop': None,
        'timeout': MODEL_TIMEOUT,
        'context_window': 8192,
        'capabilities': ['matching', 'personality', 'engagement', 'recommendation']
    },
    'openai/gpt-3.5-turbo': {
        'temperature': 0.7,
        'max_tokens': 1000,
        'top_p': 1.0,
        'frequency_penalty': 0.0,
        'presence_penalty': 0.0,
        'stop': None,
        'timeout': MODEL_TIMEOUT,
        'context_window': 4096,
        'capabilities': ['matching', 'personality', 'engagement', 'recommendation']
    },
    'anthropic/claude-2': {
        'temperature': 0.7,
        'max_tokens': 1000,
        'top_p': 1.0,
        'stop': None,
        'timeout': MODEL_TIMEOUT,
        'context_window': 100000,
        'capabilities': ['matching', 'personality', 'engagement', 'recommendation']
    },
    'anthropic/claude-instant-1': {
        'temperature': 0.7,
        'max_tokens': 1000,
        'top_p': 1.0,
        'stop': None,
        'timeout': MODEL_TIMEOUT,
        'context_window': 100000,
        'capabilities': ['engagement', 'recommendation']
    }
}

# Matching configuration
MATCHING_CONFIG = {
    'min_tribe_size': int(os.getenv('MIN_TRIBE_SIZE', '4')),
    'max_tribe_size': int(os.getenv('MAX_TRIBE_SIZE', '8')),
    'compatibility_threshold': float(os.getenv('COMPATIBILITY_THRESHOLD', '0.7')),
    'max_tribes_per_user': int(os.getenv('MAX_TRIBES_PER_USER', '3'))
}

# Personality analysis configuration
PERSONALITY_CONFIG = {
    'trait_categories': ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'],
    'communication_styles': ['direct', 'analytical', 'intuitive', 'functional'],
    'interest_categories': ['outdoor', 'arts', 'food', 'sports', 'games', 'learning', 'technology', 'wellness']
}

# Engagement configuration
ENGAGEMENT_CONFIG = {
    'prompt_types': ['conversation', 'activity', 'challenge', 'reflection'],
    'challenge_types': ['social', 'creative', 'intellectual', 'physical'],
    'activity_categories': ['indoor', 'outdoor', 'virtual', 'local']
}

# Recommendation configuration
RECOMMENDATION_CONFIG = {
    'event_types': ['social', 'educational', 'recreational', 'cultural'],
    'max_distance_miles': int(os.getenv('MAX_EVENT_DISTANCE', '15')),
    'weather_activity_mapping': {
        'sunny': ['outdoor', 'sports', 'hiking', 'picnic'],
        'rainy': ['indoor', 'museum', 'cafe', 'movie'],
        'snowy': ['skiing', 'indoor', 'cozy'],
        'hot': ['water', 'indoor', 'evening'],
        'cold': ['indoor', 'warm', 'cozy']
    }
}

def get_model_config(model_name: str = None) -> Dict[str, Any]:
    """
    Get configuration for a specific model
    
    Args:
        model_name (str, optional): The name of the model to get the configuration for.
            Defaults to DEFAULT_MODEL if not provided.
            
    Returns:
        dict: Model configuration dictionary
    """
    model = model_name or DEFAULT_MODEL
    
    if model not in MODEL_CONFIGS:
        logging.warning(f"Model {model} not found in configurations. Using default settings.")
        return {
            'temperature': 0.7,
            'max_tokens': 1000,
            'top_p': 1.0,
            'timeout': MODEL_TIMEOUT,
            'capabilities': []
        }
    
    return MODEL_CONFIGS[model]

def validate_settings() -> bool:
    """
    Validate that required settings are properly configured
    
    Returns:
        bool: True if all required settings are valid, False otherwise
    """
    valid = True
    
    # Check API key
    if not OPENROUTER_API_KEY:
        logging.warning("OPENROUTER_API_KEY is not set. AI operations will fail.")
        valid = False
    
    # Check model configuration
    if DEFAULT_MODEL not in MODEL_CONFIGS:
        logging.warning(f"DEFAULT_MODEL '{DEFAULT_MODEL}' is not configured in MODEL_CONFIGS.")
        valid = False
    
    # Validate numeric settings
    if MODEL_TIMEOUT <= 0:
        logging.warning("MODEL_TIMEOUT must be greater than 0.")
        valid = False
    
    if CACHE_TTL <= 0:
        logging.warning("CACHE_TTL must be greater than 0.")
        valid = False
    
    # Validate matching configuration
    if MATCHING_CONFIG['min_tribe_size'] < 2:
        logging.warning("Minimum tribe size must be at least 2.")
        valid = False
        
    if MATCHING_CONFIG['max_tribe_size'] < MATCHING_CONFIG['min_tribe_size']:
        logging.warning("Maximum tribe size must be greater than or equal to minimum tribe size.")
        valid = False
    
    if not (0 < MATCHING_CONFIG['compatibility_threshold'] <= 1):
        logging.warning("Compatibility threshold must be between 0 and 1.")
        valid = False
    
    return valid

# Load environment variables from .env file if it exists
load_environment()

# Validate settings on module import
if not validate_settings():
    logging.warning('AI Engine settings validation failed. Some features may not work correctly.')