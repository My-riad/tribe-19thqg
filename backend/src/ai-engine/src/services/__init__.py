import logging

# Configure logger for the module
logger = logging.getLogger(__name__)

# Import service classes and constants from their respective modules
from .engagement_service import EngagementService, ENGAGEMENT_TYPES
from .matching_service import MatchingService, MATCHING_TYPES
from .personality_service import PersonalityService, PERSONALITY_ANALYSIS_TYPES
from .recommendation_service import RecommendationService, RECOMMENDATION_TYPES

# Define the public interface of the services module
__all__ = [
    "EngagementService",
    "ENGAGEMENT_TYPES",
    "MatchingService",
    "MATCHING_TYPES",
    "PersonalityService",
    "PERSONALITY_ANALYSIS_TYPES",
    "RecommendationService",
    "RECOMMENDATION_TYPES"
]

logger.info("AI Engine services initialized")