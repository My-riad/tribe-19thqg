import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import re
from datetime import datetime
from typing import Dict, List, Any, Union, Optional, Callable

from ..config.settings import PERSONALITY_CONFIG, MATCHING_CONFIG
from ..data.schemas import UserProfileSchema, TribeSchema, EventSchema

# Set up logger
logger = logging.getLogger(__name__)

# Define feature type constants
NUMERIC_FEATURES = ['age', 'distance', 'score', 'rating', 'level']
CATEGORICAL_FEATURES = ['gender', 'status', 'type', 'category']
TEXT_FEATURES = ['name', 'description', 'bio', 'message']
TEMPORAL_FEATURES = ['created_at', 'updated_at', 'start_time', 'end_time', 'date']
LOCATION_FEATURES = ['location', 'coordinates', 'address']

def normalize_profile_data(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes user profile data to ensure consistent format for AI processing
    
    Args:
        profile_data: Raw user profile data
        
    Returns:
        Dict containing normalized profile data
    """
    # Validate input data structure
    schema = UserProfileSchema()
    valid, errors = schema.validate(profile_data)
    
    if not valid:
        logger.warning(f"Invalid profile data: {errors}")
        # Try to normalize anyway but log the warning
    
    # Create a copy to avoid modifying the original
    normalized_data = profile_data.copy()
    
    # Normalize personality traits
    if 'personalityTraits' in normalized_data:
        normalized_traits = []
        for trait in normalized_data['personalityTraits']:
            normalized_trait = trait.copy()
            # Ensure trait scores are between 0 and 1
            if 'score' in normalized_trait:
                normalized_trait['score'] = max(0, min(float(normalized_trait['score']), 1))
            normalized_traits.append(normalized_trait)
        normalized_data['personalityTraits'] = normalized_traits
    
    # Normalize interests
    if 'interests' in normalized_data:
        normalized_interests = []
        for interest in normalized_data['interests']:
            normalized_interest = interest.copy()
            # Ensure interest level is between 1 and 5
            if 'level' in normalized_interest:
                normalized_interest['level'] = max(1, min(int(normalized_interest['level']), 5))
            # Normalize category to lowercase
            if 'category' in normalized_interest:
                normalized_interest['category'] = normalized_interest['category'].lower()
            normalized_interests.append(normalized_interest)
        normalized_data['interests'] = normalized_interests
    
    # Clean and normalize text fields
    if 'bio' in normalized_data:
        normalized_data['bio'] = clean_text_data(normalized_data['bio'])
    
    if 'name' in normalized_data:
        normalized_data['name'] = clean_text_data(normalized_data['name'])
    
    # Normalize location data if present
    if 'location' in normalized_data:
        normalized_data['location'] = normalize_location_data(normalized_data, ['location'])['location']
    
    # Handle communication style normalization
    if 'communicationStyle' in normalized_data:
        comm_style = normalized_data['communicationStyle']
        normalized_comm_style = {}
        
        # Ensure all required communication styles are present
        for style in PERSONALITY_CONFIG['communication_styles']:
            if style in comm_style:
                # Ensure style values are between 0 and 1
                normalized_comm_style[style] = max(0, min(float(comm_style[style]), 1))
            else:
                # Default to 0.5 if style is missing
                normalized_comm_style[style] = 0.5
        
        normalized_data['communicationStyle'] = normalized_comm_style
    
    # Ensure datetime fields are in ISO format
    for field in ['createdAt', 'updatedAt']:
        if field in normalized_data:
            normalized_data = normalize_temporal_data(normalized_data, [field])
    
    return normalized_data

def normalize_tribe_data(tribe_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes tribe data to ensure consistent format for AI processing
    
    Args:
        tribe_data: Raw tribe data
        
    Returns:
        Dict containing normalized tribe data
    """
    # Validate input data structure
    schema = TribeSchema()
    valid, errors = schema.validate(tribe_data)
    
    if not valid:
        logger.warning(f"Invalid tribe data: {errors}")
        # Try to normalize anyway but log the warning
    
    # Create a copy to avoid modifying the original
    normalized_data = tribe_data.copy()
    
    # Clean and normalize text fields
    if 'name' in normalized_data:
        normalized_data['name'] = clean_text_data(normalized_data['name'])
    
    if 'description' in normalized_data:
        normalized_data['description'] = clean_text_data(normalized_data['description'])
    
    # Normalize location data if present
    if 'location' in normalized_data:
        normalized_data['location'] = normalize_location_data(normalized_data, ['location'])['location']
    
    # Normalize member data
    if 'members' in normalized_data:
        normalized_members = []
        for member in normalized_data['members']:
            normalized_member = member.copy()
            
            # Ensure role is lowercase
            if 'role' in normalized_member:
                normalized_member['role'] = normalized_member['role'].lower()
            
            # Ensure joinedAt is in ISO format
            if 'joinedAt' in normalized_member:
                try:
                    dt = datetime.fromisoformat(normalized_member['joinedAt'].replace('Z', '+00:00'))
                    normalized_member['joinedAt'] = dt.isoformat()
                except (ValueError, AttributeError):
                    # If parsing fails, keep the original value
                    pass
            
            normalized_members.append(normalized_member)
        
        normalized_data['members'] = normalized_members
    
    # Normalize tribe interests
    if 'interests' in normalized_data:
        normalized_interests = []
        for interest in normalized_data['interests']:
            normalized_interest = interest.copy()
            
            # Ensure interest level is between 1 and 5
            if 'level' in normalized_interest:
                normalized_interest['level'] = max(1, min(int(normalized_interest['level']), 5))
            
            # Normalize category to lowercase
            if 'category' in normalized_interest:
                normalized_interest['category'] = normalized_interest['category'].lower()
            
            normalized_interests.append(normalized_interest)
        
        normalized_data['interests'] = normalized_interests
    
    # Normalize activities if present
    if 'activities' in normalized_data:
        normalized_activities = []
        for activity in normalized_data['activities']:
            normalized_activity = activity.copy()
            
            # Ensure type is lowercase
            if 'type' in normalized_activity:
                normalized_activity['type'] = normalized_activity['type'].lower()
            
            # Ensure timestamp is in ISO format
            if 'timestamp' in normalized_activity:
                try:
                    dt = datetime.fromisoformat(normalized_activity['timestamp'].replace('Z', '+00:00'))
                    normalized_activity['timestamp'] = dt.isoformat()
                except (ValueError, AttributeError):
                    # If parsing fails, keep the original value
                    pass
            
            normalized_activities.append(normalized_activity)
        
        normalized_data['activities'] = normalized_activities
    
    # Ensure maxMembers is within bounds
    if 'maxMembers' in normalized_data:
        normalized_data['maxMembers'] = max(
            MATCHING_CONFIG['min_tribe_size'], 
            min(int(normalized_data['maxMembers']), MATCHING_CONFIG['max_tribe_size'])
        )
    else:
        # Set default if not provided
        normalized_data['maxMembers'] = MATCHING_CONFIG['max_tribe_size']
    
    # Ensure status is valid
    if 'status' in normalized_data:
        valid_statuses = ['forming', 'active', 'inactive', 'dissolved']
        if normalized_data['status'].lower() not in valid_statuses:
            normalized_data['status'] = 'forming'  # Default to forming if invalid
        else:
            normalized_data['status'] = normalized_data['status'].lower()
    
    # Ensure datetime fields are in ISO format
    if 'createdAt' in normalized_data:
        normalized_data = normalize_temporal_data(normalized_data, ['createdAt'])
    
    return normalized_data

def normalize_event_data(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes event data to ensure consistent format for AI processing
    
    Args:
        event_data: Raw event data
        
    Returns:
        Dict containing normalized event data
    """
    # Validate input data structure
    schema = EventSchema()
    valid, errors = schema.validate(event_data)
    
    if not valid:
        logger.warning(f"Invalid event data: {errors}")
        # Try to normalize anyway but log the warning
    
    # Create a copy to avoid modifying the original
    normalized_data = event_data.copy()
    
    # Clean and normalize text fields
    if 'name' in normalized_data:
        normalized_data['name'] = clean_text_data(normalized_data['name'])
    
    if 'description' in normalized_data:
        normalized_data['description'] = clean_text_data(normalized_data['description'])
    
    # Normalize location data
    if 'location' in normalized_data:
        normalized_data['location'] = normalize_location_data(normalized_data, ['location'])['location']
    
    # Normalize venue data if present
    if 'venue' in normalized_data and isinstance(normalized_data['venue'], dict):
        venue = normalized_data['venue']
        normalized_venue = venue.copy()
        
        if 'name' in venue:
            normalized_venue['name'] = clean_text_data(venue['name'])
        
        if 'location' in venue:
            normalized_venue['location'] = normalize_location_data({'location': venue['location']}, ['location'])['location']
        
        normalized_data['venue'] = normalized_venue
    
    # Normalize temporal data
    for field in ['startTime', 'endTime']:
        if field in normalized_data:
            normalized_data = normalize_temporal_data(normalized_data, [field])
    
    # Normalize attendees if present
    if 'attendees' in normalized_data:
        normalized_attendees = []
        for attendee in normalized_data['attendees']:
            normalized_attendee = attendee.copy()
            
            # Ensure rsvpStatus is lowercase and valid
            if 'rsvpStatus' in normalized_attendee:
                valid_statuses = ['going', 'maybe', 'not_going', 'no_response']
                status = normalized_attendee['rsvpStatus'].lower()
                normalized_attendee['rsvpStatus'] = status if status in valid_statuses else 'no_response'
            
            # Ensure rsvpTime is in ISO format
            if 'rsvpTime' in normalized_attendee:
                try:
                    dt = datetime.fromisoformat(normalized_attendee['rsvpTime'].replace('Z', '+00:00'))
                    normalized_attendee['rsvpTime'] = dt.isoformat()
                except (ValueError, AttributeError):
                    # If parsing fails, keep the original value
                    pass
            
            # Ensure checkedInAt is in ISO format
            if 'checkedInAt' in normalized_attendee:
                try:
                    dt = datetime.fromisoformat(normalized_attendee['checkedInAt'].replace('Z', '+00:00'))
                    normalized_attendee['checkedInAt'] = dt.isoformat()
                except (ValueError, AttributeError):
                    # If parsing fails, keep the original value
                    pass
            
            normalized_attendees.append(normalized_attendee)
        
        normalized_data['attendees'] = normalized_attendees
    
    # Normalize cost if present
    if 'cost' in normalized_data:
        try:
            normalized_data['cost'] = max(0, float(normalized_data['cost']))
        except (ValueError, TypeError):
            normalized_data['cost'] = 0.0
    
    # Ensure status is valid
    if 'status' in normalized_data:
        valid_statuses = ['scheduled', 'canceled', 'completed']
        if normalized_data['status'].lower() not in valid_statuses:
            normalized_data['status'] = 'scheduled'  # Default to scheduled if invalid
        else:
            normalized_data['status'] = normalized_data['status'].lower()
    
    # Normalize weather data if present
    if 'weatherData' in normalized_data and isinstance(normalized_data['weatherData'], dict):
        normalized_data['weatherData'] = normalized_data['weatherData']  # Just keep as is for now
    
    return normalized_data

def clean_text_data(text: str, lowercase: bool = False, max_length: int = None) -> str:
    """
    Cleans and normalizes text data by removing special characters, 
    extra whitespace, and standardizing format
    
    Args:
        text: Input text to clean
        lowercase: Whether to convert text to lowercase
        max_length: Maximum length of text (truncate if longer)
        
    Returns:
        Cleaned text string
    """
    if not isinstance(text, str):
        return ""
    
    # Remove special characters except for basic punctuation
    cleaned_text = re.sub(r'[^\w\s.,!?\'"-]', '', text)
    
    # Remove extra whitespace
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    
    # Convert to lowercase if specified
    if lowercase:
        cleaned_text = cleaned_text.lower()
    
    # Truncate if specified
    if max_length and len(cleaned_text) > max_length:
        cleaned_text = cleaned_text[:max_length]
    
    return cleaned_text

def normalize_numeric_features(data: Dict[str, Any], features: List[str] = None, 
                              min_val: float = 0.0, max_val: float = 1.0) -> Dict[str, Any]:
    """
    Normalizes numeric features to a specified range, typically 0-1
    
    Args:
        data: Input data dictionary
        features: List of feature names to normalize (uses NUMERIC_FEATURES if None)
        min_val: Minimum value for normalization range
        max_val: Maximum value for normalization range
        
    Returns:
        Data with normalized numeric features
    """
    if features is None:
        features = NUMERIC_FEATURES
    
    normalized_data = data.copy()
    
    for feature in features:
        if feature in normalized_data and normalized_data[feature] is not None:
            try:
                # Convert to float to ensure numeric
                value = float(normalized_data[feature])
                
                # Apply min-max normalization to the given range
                if isinstance(value, (int, float)):
                    # For simplicity, assuming original range is 0-100
                    # In a real implementation, you might determine the min/max from data distribution
                    original_min, original_max = 0, 100
                    
                    # Handle edge case of min=max
                    if original_min == original_max:
                        normalized_value = min_val
                    else:
                        normalized_value = (value - original_min) / (original_max - original_min) * (max_val - min_val) + min_val
                    
                    # Clip to ensure within range
                    normalized_value = max(min_val, min(normalized_value, max_val))
                    normalized_data[feature] = normalized_value
            except (ValueError, TypeError):
                # If conversion fails, leave as is
                pass
    
    return normalized_data

def normalize_categorical_features(data: Dict[str, Any], features: List[str] = None, 
                                  valid_categories: Dict[str, List[str]] = None) -> Dict[str, Any]:
    """
    Normalizes categorical features by ensuring consistent format and valid categories
    
    Args:
        data: Input data dictionary
        features: List of feature names to normalize (uses CATEGORICAL_FEATURES if None)
        valid_categories: Dictionary mapping features to their valid category values
        
    Returns:
        Data with normalized categorical features
    """
    if features is None:
        features = CATEGORICAL_FEATURES
    
    normalized_data = data.copy()
    
    for feature in features:
        if feature in normalized_data and normalized_data[feature] is not None:
            try:
                # Convert to string and lowercase
                value = str(normalized_data[feature]).lower().strip()
                
                # Check against valid categories if provided
                if valid_categories and feature in valid_categories:
                    if value not in valid_categories[feature]:
                        # Use default value if invalid
                        if valid_categories[feature]:
                            value = valid_categories[feature][0]  # Use first valid value as default
                
                normalized_data[feature] = value
            except (ValueError, TypeError, AttributeError):
                # If conversion fails, leave as is
                pass
    
    return normalized_data

def normalize_temporal_data(data: Dict[str, Any], features: List[str] = None, 
                           target_timezone: str = None) -> Dict[str, Any]:
    """
    Normalizes temporal data to consistent ISO format and handles timezone conversion
    
    Args:
        data: Input data dictionary
        features: List of feature names to normalize (uses TEMPORAL_FEATURES if None)
        target_timezone: Target timezone for conversion (if None, uses UTC)
        
    Returns:
        Data with normalized temporal features
    """
    if features is None:
        features = TEMPORAL_FEATURES
    
    normalized_data = data.copy()
    
    for feature in features:
        if feature in normalized_data and normalized_data[feature] is not None:
            try:
                # Parse the datetime string to a datetime object
                dt_str = normalized_data[feature]
                
                # Handle 'Z' UTC indicator
                if isinstance(dt_str, str) and dt_str.endswith('Z'):
                    dt_str = dt_str.replace('Z', '+00:00')
                
                dt = datetime.fromisoformat(dt_str)
                
                # Convert timezone if specified (omitted for simplicity)
                # This would require additional library like pytz
                
                # Format to ISO 8601
                normalized_data[feature] = dt.isoformat()
            except (ValueError, TypeError, AttributeError):
                # If parsing fails, leave as is
                logger.debug(f"Failed to normalize temporal data for {feature}: {normalized_data[feature]}")
    
    return normalized_data

def normalize_location_data(data: Dict[str, Any], features: List[str] = None) -> Dict[str, Any]:
    """
    Normalizes location data to ensure consistent format with coordinates and address components
    
    Args:
        data: Input data dictionary
        features: List of feature names to normalize (uses LOCATION_FEATURES if None)
        
    Returns:
        Data with normalized location features
    """
    if features is None:
        features = LOCATION_FEATURES
    
    normalized_data = data.copy()
    
    for feature in features:
        if feature in normalized_data and normalized_data[feature] is not None:
            location_data = normalized_data[feature]
            
            if not isinstance(location_data, dict):
                # Skip if not a dictionary
                continue
            
            normalized_location = location_data.copy()
            
            # Ensure coordinates are in standard format
            if 'latitude' in normalized_location and 'longitude' in normalized_location:
                try:
                    lat = float(normalized_location['latitude'])
                    lng = float(normalized_location['longitude'])
                    
                    # Validate coordinate ranges
                    lat = max(-90, min(lat, 90))
                    lng = max(-180, min(lng, 180))
                    
                    normalized_location['latitude'] = lat
                    normalized_location['longitude'] = lng
                except (ValueError, TypeError):
                    # If conversion fails, use default coordinates (0,0)
                    normalized_location['latitude'] = 0.0
                    normalized_location['longitude'] = 0.0
            
            # Normalize address components if present
            if 'address' in normalized_location and isinstance(normalized_location['address'], dict):
                address = normalized_location['address']
                normalized_address = {}
                
                for key, value in address.items():
                    if isinstance(value, str):
                        normalized_address[key] = value.strip()
                    else:
                        normalized_address[key] = value
                
                normalized_location['address'] = normalized_address
            
            normalized_data[feature] = normalized_location
    
    return normalized_data

def handle_missing_values(data: Dict[str, Any], default_values: Dict[str, Any] = None, 
                         strategy: str = 'default') -> Dict[str, Any]:
    """
    Handles missing values in data by applying appropriate defaults or imputation strategies
    
    Args:
        data: Input data dictionary
        default_values: Dictionary of default values to use for missing fields
        strategy: Strategy for handling missing values ('default', 'mean', 'median', 'mode')
        
    Returns:
        Data with missing values handled
    """
    if default_values is None:
        default_values = {}
    
    normalized_data = data.copy()
    
    # Apply defaults for missing values
    if strategy == 'default':
        for key, default_value in default_values.items():
            if key not in normalized_data or normalized_data[key] is None:
                normalized_data[key] = default_value
    elif strategy == 'mean':
        # Would compute mean of available numeric values (simplified implementation)
        pass
    elif strategy == 'median':
        # Would compute median of available numeric values (simplified implementation)
        pass
    elif strategy == 'mode':
        # Would use most common value for categorical data (simplified implementation)
        pass
    
    return normalized_data

def transform_features_for_model(data: Dict[str, Any], model_type: str, 
                                model_config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Transforms features into format suitable for specific AI models
    
    Args:
        data: Input data dictionary
        model_type: Type of model ('text', 'numeric', 'categorical')
        model_config: Configuration parameters for the model
        
    Returns:
        Transformed data ready for model input
    """
    if model_config is None:
        model_config = {}
    
    transformed_data = data.copy()
    
    # Apply model-specific transformations
    if model_type == 'text':
        # For text models, join relevant text fields
        text_fields = model_config.get('text_fields', TEXT_FEATURES)
        text_content = []
        
        for field in text_fields:
            if field in transformed_data and transformed_data[field]:
                text_content.append(str(transformed_data[field]))
        
        transformed_data['text_content'] = ' '.join(text_content)
    
    elif model_type == 'numeric':
        # For numeric models, ensure all features are properly scaled
        numeric_fields = model_config.get('numeric_fields', NUMERIC_FEATURES)
        scaling_method = model_config.get('scaling', 'minmax')
        
        if scaling_method == 'minmax':
            transformed_data = normalize_numeric_features(
                transformed_data, 
                features=numeric_fields,
                min_val=model_config.get('min_val', 0.0),
                max_val=model_config.get('max_val', 1.0)
            )
        elif scaling_method == 'standard':
            # Standard scaling would be implemented here
            # Requires fitted StandardScaler
            pass
    
    elif model_type == 'categorical':
        # For categorical models, ensure proper encoding
        cat_fields = model_config.get('categorical_fields', CATEGORICAL_FEATURES)
        valid_categories = model_config.get('valid_categories', {})
        
        transformed_data = normalize_categorical_features(
            transformed_data,
            features=cat_fields,
            valid_categories=valid_categories
        )
    
    return transformed_data

def batch_normalize_profiles(profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalizes multiple user profiles in batch for efficient processing
    
    Args:
        profiles: List of profile data dictionaries
        
    Returns:
        List of normalized profile data dictionaries
    """
    if not profiles:
        return []
    
    normalized_profiles = []
    
    # Process using pandas for vectorized operations if large batch
    if len(profiles) > 100:
        try:
            # Convert to DataFrame for vectorized operations
            df = pd.DataFrame(profiles)
            
            # Apply normalization to each profile
            normalized_profiles = [normalize_profile_data(profile) for profile in df.to_dict('records')]
            
        except Exception as e:
            logger.error(f"Error in batch profile normalization: {e}")
            # Fall back to regular processing
            normalized_profiles = [normalize_profile_data(profile) for profile in profiles]
    else:
        # For smaller batches, just process them directly
        normalized_profiles = [normalize_profile_data(profile) for profile in profiles]
    
    return normalized_profiles

def batch_normalize_tribes(tribes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalizes multiple tribes in batch for efficient processing
    
    Args:
        tribes: List of tribe data dictionaries
        
    Returns:
        List of normalized tribe data dictionaries
    """
    if not tribes:
        return []
    
    normalized_tribes = []
    
    # Process using pandas for vectorized operations if large batch
    if len(tribes) > 100:
        try:
            # Convert to DataFrame for vectorized operations
            df = pd.DataFrame(tribes)
            
            # Apply normalization to each tribe
            normalized_tribes = [normalize_tribe_data(tribe) for tribe in df.to_dict('records')]
            
        except Exception as e:
            logger.error(f"Error in batch tribe normalization: {e}")
            # Fall back to regular processing
            normalized_tribes = [normalize_tribe_data(tribe) for tribe in tribes]
    else:
        # For smaller batches, just process them directly
        normalized_tribes = [normalize_tribe_data(tribe) for tribe in tribes]
    
    return normalized_tribes

def batch_normalize_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalizes multiple events in batch for efficient processing
    
    Args:
        events: List of event data dictionaries
        
    Returns:
        List of normalized event data dictionaries
    """
    if not events:
        return []
    
    normalized_events = []
    
    # Process using pandas for vectorized operations if large batch
    if len(events) > 100:
        try:
            # Convert to DataFrame for vectorized operations
            df = pd.DataFrame(events)
            
            # Apply normalization to each event
            normalized_events = [normalize_event_data(event) for event in df.to_dict('records')]
            
        except Exception as e:
            logger.error(f"Error in batch event normalization: {e}")
            # Fall back to regular processing
            normalized_events = [normalize_event_data(event) for event in events]
    else:
        # For smaller batches, just process them directly
        normalized_events = [normalize_event_data(event) for event in events]
    
    return normalized_events

class DataNormalizer:
    """
    Class for normalizing various data types with configurable strategies
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the DataNormalizer with configuration
        
        Args:
            config: Configuration dictionary for normalization strategies
        """
        self._normalizers = {
            'profile': normalize_profile_data,
            'tribe': normalize_tribe_data,
            'event': normalize_event_data
        }
        
        self._default_values = {
            'profile': {},
            'tribe': {},
            'event': {}
        }
        
        self._schemas = {
            'profile': UserProfileSchema(),
            'tribe': TribeSchema(),
            'event': EventSchema()
        }
        
        # Apply custom configuration if provided
        if config:
            if 'default_values' in config:
                for data_type, defaults in config['default_values'].items():
                    self._default_values[data_type] = defaults
        
        logger.debug("DataNormalizer initialized with custom configuration")
    
    def normalize(self, data: Dict[str, Any], data_type: str) -> Dict[str, Any]:
        """
        Normalize data based on its type
        
        Args:
            data: Data to normalize
            data_type: Type of data (profile, tribe, event)
            
        Returns:
            Normalized data
        """
        if data_type not in self._normalizers:
            logger.warning(f"Unknown data type: {data_type}. Using raw data.")
            return data
        
        # Validate data structure
        if data_type in self._schemas:
            valid, errors = self._schemas[data_type].validate(data)
            if not valid:
                logger.warning(f"Invalid {data_type} data: {errors}")
        
        # Apply the appropriate normalizer
        normalized_data = self._normalizers[data_type](data)
        
        # Handle missing values
        if data_type in self._default_values:
            normalized_data = handle_missing_values(
                normalized_data, 
                default_values=self._default_values[data_type]
            )
        
        return normalized_data
    
    def register_normalizer(self, data_type: str, normalizer_function: Callable) -> None:
        """
        Register a custom normalizer function for a data type
        
        Args:
            data_type: Type of data to register normalizer for
            normalizer_function: Function that takes data and returns normalized data
        """
        self._normalizers[data_type] = normalizer_function
        logger.info(f"Registered custom normalizer for {data_type}")
    
    def set_default_values(self, data_type: str, default_values: Dict[str, Any]) -> None:
        """
        Set default values for a data type
        
        Args:
            data_type: Type of data to set defaults for
            default_values: Dictionary of default values
        """
        self._default_values[data_type] = default_values
        logger.info(f"Updated default values for {data_type}")
    
    def batch_normalize(self, data_items: List[Dict[str, Any]], data_type: str) -> List[Dict[str, Any]]:
        """
        Normalize multiple data items in batch
        
        Args:
            data_items: List of data items to normalize
            data_type: Type of data (profile, tribe, event)
            
        Returns:
            List of normalized data items
        """
        if not data_items:
            return []
        
        normalized_items = []
        
        for item in data_items:
            try:
                normalized_item = self.normalize(item, data_type)
                normalized_items.append(normalized_item)
            except Exception as e:
                logger.error(f"Error normalizing {data_type} item: {e}")
                # Include the original item to avoid data loss
                normalized_items.append(item)
        
        return normalized_items


class FeatureTransformer:
    """
    Class for transforming features for different AI models
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the FeatureTransformer with configuration
        
        Args:
            config: Configuration dictionary for transformation strategies
        """
        self._transformers = {}
        self._scalers = {
            'standard': StandardScaler(),
            'minmax': MinMaxScaler()
        }
        self._encoders = {}
        
        # Setup basic transformers
        self._transformers = {
            'text': self._transform_text,
            'numeric': self._transform_numeric,
            'categorical': self._transform_categorical
        }
        
        # Apply custom configuration if provided
        if config:
            # Could customize based on config parameters
            pass
        
        logger.debug("FeatureTransformer initialized")
    
    def transform(self, data: Dict[str, Any], model_type: str) -> Dict[str, Any]:
        """
        Transform features for a specific model
        
        Args:
            data: Data to transform
            model_type: Type of model to transform for
            
        Returns:
            Transformed data
        """
        if model_type not in self._transformers:
            logger.warning(f"Unknown model type: {model_type}. Using raw data.")
            return data
        
        # Apply the appropriate transformer
        transformed_data = self._transformers[model_type](data)
        
        return transformed_data
    
    def register_transformer(self, model_type: str, transformer_function: Callable) -> None:
        """
        Register a custom transformer function for a model type
        
        Args:
            model_type: Type of model to register transformer for
            transformer_function: Function that takes data and returns transformed data
        """
        self._transformers[model_type] = transformer_function
        logger.info(f"Registered custom transformer for {model_type}")
    
    def fit_scalers(self, training_data: List[Dict[str, Any]]) -> None:
        """
        Fit scalers on training data
        
        Args:
            training_data: List of data items to fit scalers on
        """
        if not training_data:
            logger.warning("No training data provided for fitting scalers")
            return
        
        try:
            # Extract numeric features for fitting
            numeric_features = []
            for item in training_data:
                features = {}
                for feature in NUMERIC_FEATURES:
                    if feature in item and isinstance(item[feature], (int, float)):
                        features[feature] = item[feature]
                if features:
                    numeric_features.append(features)
            
            if not numeric_features:
                logger.warning("No numeric features found in training data")
                return
            
            # Convert to DataFrame for easier handling
            df = pd.DataFrame(numeric_features)
            
            # Fit standard scaler
            if 'standard' in self._scalers:
                self._scalers['standard'].fit(df.fillna(0))
            
            # Fit minmax scaler
            if 'minmax' in self._scalers:
                self._scalers['minmax'].fit(df.fillna(0))
            
            logger.info(f"Fitted scalers on {len(numeric_features)} samples")
            
        except Exception as e:
            logger.error(f"Error fitting scalers: {e}")
    
    def fit_encoders(self, training_data: List[Dict[str, Any]]) -> None:
        """
        Fit encoders on training data
        
        Args:
            training_data: List of data items to fit encoders on
        """
        if not training_data:
            logger.warning("No training data provided for fitting encoders")
            return
        
        try:
            # Extract categorical features for fitting
            categorical_features = {}
            for item in training_data:
                for feature in CATEGORICAL_FEATURES:
                    if feature in item and item[feature] is not None:
                        if feature not in categorical_features:
                            categorical_features[feature] = []
                        categorical_features[feature].append(str(item[feature]).lower())
            
            if not categorical_features:
                logger.warning("No categorical features found in training data")
                return
            
            # Build unique value sets for each feature
            for feature, values in categorical_features.items():
                self._encoders[feature] = list(set(values))
            
            logger.info(f"Fitted encoders for {len(categorical_features)} categorical features")
            
        except Exception as e:
            logger.error(f"Error fitting encoders: {e}")
    
    def _transform_text(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform text features
        
        Args:
            data: Data to transform
            
        Returns:
            Transformed data
        """
        transformed = data.copy()
        
        # Extract text fields
        text_content = []
        for field in TEXT_FEATURES:
            if field in transformed and transformed[field]:
                # Clean text
                clean_text = clean_text_data(str(transformed[field]))
                text_content.append(clean_text)
                transformed[f"clean_{field}"] = clean_text
        
        # Combine all text for models that need a single text field
        if text_content:
            transformed["combined_text"] = " ".join(text_content)
        
        return transformed
    
    def _transform_numeric(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform numeric features
        
        Args:
            data: Data to transform
            
        Returns:
            Transformed data
        """
        transformed = data.copy()
        
        # Extract and scale numeric features
        numeric_features = {}
        for feature in NUMERIC_FEATURES:
            if feature in transformed and isinstance(transformed[feature], (int, float)):
                numeric_features[feature] = transformed[feature]
        
        if numeric_features:
            # Apply min-max scaling (0-1 range)
            for feature, value in numeric_features.items():
                # Simple scaling without using fitted scaler for demonstration
                transformed[f"scaled_{feature}"] = max(0, min(float(value) / 100, 1))
        
        return transformed
    
    def _transform_categorical(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform categorical features
        
        Args:
            data: Data to transform
            
        Returns:
            Transformed data
        """
        transformed = data.copy()
        
        # Normalize categorical features
        for feature in CATEGORICAL_FEATURES:
            if feature in transformed and transformed[feature]:
                # Simple normalization to lowercase
                transformed[feature] = str(transformed[feature]).lower().strip()
                
                # Apply one-hot encoding if encoder is available
                if feature in self._encoders:
                    categories = self._encoders[feature]
                    value = transformed[feature]
                    
                    # Create one-hot encoding
                    for category in categories:
                        transformed[f"{feature}_{category}"] = 1 if value == category else 0
        
        return transformed
    
    def batch_transform(self, data_items: List[Dict[str, Any]], model_type: str) -> List[Dict[str, Any]]:
        """
        Transform multiple data items in batch
        
        Args:
            data_items: List of data items to transform
            model_type: Type of model to transform for
            
        Returns:
            List of transformed data items
        """
        if not data_items:
            return []
        
        transformed_items = []
        
        for item in data_items:
            try:
                transformed_item = self.transform(item, model_type)
                transformed_items.append(transformed_item)
            except Exception as e:
                logger.error(f"Error transforming item for {model_type}: {e}")
                # Include the original item to avoid data loss
                transformed_items.append(item)
        
        return transformed_items


class TextPreprocessor:
    """
    Class for preprocessing text data for AI models
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TextPreprocessor with configuration
        
        Args:
            config: Configuration dictionary for text preprocessing
        """
        self._cleaners = {}
        self._tokenizers = {}
        self._stopwords = set()
        
        # Load stopwords
        # In a real implementation, would load from a file or library
        self._stopwords = {'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were'}
        
        # Setup basic cleaners
        self._cleaners = {
            'default': self.clean,
            'conversation': lambda text: self.clean(text, lowercase=True),
            'topic': lambda text: self.clean(text, remove_punctuation=True)
        }
        
        # Setup basic tokenizers
        self._tokenizers = {
            'word': lambda text: text.split(),
            'sentence': lambda text: re.split(r'[.!?]', text)
        }
        
        # Apply custom configuration if provided
        if config:
            if 'stopwords' in config:
                self._stopwords.update(config['stopwords'])
        
        logger.debug("TextPreprocessor initialized")
    
    def preprocess(self, text: str, purpose: str = 'default') -> str:
        """
        Preprocess text for a specific purpose
        
        Args:
            text: Text to preprocess
            purpose: Purpose of preprocessing (default, conversation, topic)
            
        Returns:
            Preprocessed text
        """
        if not isinstance(text, str):
            return ""
        
        # Apply basic cleaning
        cleaned_text = clean_text_data(text)
        
        # Apply purpose-specific preprocessing
        if purpose == 'conversation':
            # For conversation, lowercase and remove some punctuation
            cleaned_text = self.clean(cleaned_text, lowercase=True, remove_punctuation=False)
        elif purpose == 'topic':
            # For topics, remove stopwords and normalize
            cleaned_text = self.remove_stopwords(self.clean(cleaned_text, lowercase=True))
        elif purpose == 'search':
            # For search queries, aggressive normalization
            cleaned_text = self.clean(cleaned_text, lowercase=True, remove_punctuation=True, remove_numbers=True)
            cleaned_text = self.remove_stopwords(cleaned_text)
        
        return cleaned_text
    
    def clean(self, text: str, lowercase: bool = False, remove_punctuation: bool = False, 
             remove_numbers: bool = False) -> str:
        """
        Clean text by removing noise and standardizing format
        
        Args:
            text: Text to clean
            lowercase: Whether to convert to lowercase
            remove_punctuation: Whether to remove punctuation
            remove_numbers: Whether to remove numbers
            
        Returns:
            Cleaned text
        """
        if not isinstance(text, str):
            return ""
        
        cleaned_text = text
        
        # Convert to lowercase if requested
        if lowercase:
            cleaned_text = cleaned_text.lower()
        
        # Remove punctuation if requested
        if remove_punctuation:
            cleaned_text = re.sub(r'[^\w\s]', '', cleaned_text)
        
        # Remove numbers if requested
        if remove_numbers:
            cleaned_text = re.sub(r'\d+', '', cleaned_text)
        
        # Remove extra whitespace
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        return cleaned_text
    
    def tokenize(self, text: str, level: str = 'word') -> List[str]:
        """
        Tokenize text into words or sentences
        
        Args:
            text: Text to tokenize
            level: Tokenization level (word, sentence)
            
        Returns:
            List of tokens
        """
        if not isinstance(text, str):
            return []
        
        # Clean text first
        cleaned_text = self.clean(text)
        
        # Apply appropriate tokenizer
        if level == 'word':
            tokens = cleaned_text.split()
        elif level == 'sentence':
            tokens = re.split(r'[.!?]', cleaned_text)
            # Remove empty strings
            tokens = [token.strip() for token in tokens if token.strip()]
        else:
            logger.warning(f"Unknown tokenization level: {level}. Using word level.")
            tokens = cleaned_text.split()
        
        return tokens
    
    def remove_stopwords(self, text: str) -> str:
        """
        Remove stopwords from text
        
        Args:
            text: Text to remove stopwords from
            
        Returns:
            Text with stopwords removed
        """
        if not isinstance(text, str):
            return ""
        
        # Tokenize into words
        tokens = self.tokenize(text, level='word')
        
        # Filter out stopwords
        filtered_tokens = [token for token in tokens if token.lower() not in self._stopwords]
        
        # Rejoin into text
        filtered_text = ' '.join(filtered_tokens)
        
        return filtered_text
    
    def batch_preprocess(self, texts: List[str], purpose: str = 'default') -> List[str]:
        """
        Preprocess multiple text items in batch
        
        Args:
            texts: List of text items to preprocess
            purpose: Purpose of preprocessing
            
        Returns:
            List of preprocessed texts
        """
        if not texts:
            return []
        
        preprocessed_texts = []
        
        for text in texts:
            try:
                preprocessed_text = self.preprocess(text, purpose)
                preprocessed_texts.append(preprocessed_text)
            except Exception as e:
                logger.error(f"Error preprocessing text: {e}")
                # Include the original text to avoid data loss
                preprocessed_texts.append(text if isinstance(text, str) else "")
        
        return preprocessed_texts