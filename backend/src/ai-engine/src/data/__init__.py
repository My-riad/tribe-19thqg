import logging  # version: standard library
from .loaders import (  # backend/src/ai-engine/src/data/loaders.py
    UserProfileLoader,
    TribeDataLoader,
    EventDataLoader,
    DataLoaderFactory,
    fetch_data_from_api,
    fetch_data_from_database,
)
from .processors import (  # backend/src/ai-engine/src/data/processors.py
    ProfileProcessor,
    TribeProcessor,
    EventProcessor,
    DataPreprocessor,
    FeatureExtractor,
    extract_features,
    calculate_compatibility_features,
    process_text_data,
)
from .schemas import (  # backend/src/ai-engine/src/data/schemas.py
    UserProfileSchema,
    TribeSchema,
    EventSchema,
    PersonalityTraitSchema,
    InterestSchema,
    LocationSchema,
    PromptSchema,
    ResponseSchema,
    MatchResultSchema,
    RecommendationSchema,
)

# Configure logging for the data package
logger = logging.getLogger(__name__)

__all__ = [
    "UserProfileLoader",
    "TribeDataLoader",
    "EventDataLoader",
    "DataLoaderFactory",
    "ProfileProcessor",
    "TribeProcessor",
    "EventProcessor",
    "DataPreprocessor",
    "FeatureExtractor",
    "UserProfileSchema",
    "TribeSchema",
    "EventSchema",
    "PersonalityTraitSchema",
    "InterestSchema",
    "LocationSchema",
    "PromptSchema",
    "ResponseSchema",
    "MatchResultSchema",
    "RecommendationSchema",
    "extract_features",
    "calculate_compatibility_features",
    "process_text_data",
    "fetch_data_from_api",
    "fetch_data_from_database",
    "create_data_loader",
]


def create_data_loader(loader_type: str, config: dict) -> object:
    """
    Factory function to create an instance of the specified data loader with configuration

    Args:
        loader_type (str): Type of data loader to create (e.g., 'UserProfileLoader', 'TribeDataLoader')
        config (dict): Configuration dictionary for the data loader

    Returns:
        object: Instance of the requested data loader class

    Raises:
        ValueError: If loader_type is not recognized
    """
    # Validate loader_type against available data loaders
    available_loaders = {
        "UserProfileLoader": UserProfileLoader,
        "TribeDataLoader": TribeDataLoader,
        "EventDataLoader": EventDataLoader,
    }

    # Initialize empty config dictionary if not provided
    if config is None:
        config = {}

    # Create and return appropriate data loader instance based on loader_type
    if loader_type in available_loaders:
        data_loader_class = available_loaders[loader_type]
        data_loader = data_loader_class(config)
        logger.debug(
            f"Data loader created: {loader_type} with configuration: {config}"
        )
        return data_loader
    else:
        # Raise ValueError if loader_type is not recognized
        logger.error(f"Invalid data loader type: {loader_type}")
        raise ValueError(f"Invalid data loader type: {loader_type}")