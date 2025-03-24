import logging
import re
from typing import Dict, List, Any, Tuple, Callable
from datetime import datetime
import jsonschema
from jsonschema.exceptions import ValidationError

from ..config.settings import (
    PERSONALITY_CONFIG,
    MATCHING_CONFIG,
    ENGAGEMENT_CONFIG,
    RECOMMENDATION_CONFIG
)

# Set up logger
logger = logging.getLogger(__name__)

def validate_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate data against a JSON schema.
    
    Args:
        data: The data to validate
        schema: The JSON schema to validate against
        
    Returns:
        Tuple containing:
        - bool: True if validation passed, False otherwise
        - list: List of validation error messages, empty if validation passed
    """
    try:
        jsonschema.validate(instance=data, schema=schema)
        return True, []
    except ValidationError as e:
        logger.debug(f"Schema validation error: {e}")
        error_messages = []
        for error in [e]:  # Wrap in list to maintain extensibility
            error_messages.append(str(error))
        return False, error_messages

def validate_personality_trait(trait_name: str, score: float) -> bool:
    """
    Validate a personality trait name and score.
    
    Args:
        trait_name: Name of the personality trait
        score: Score value for the trait
        
    Returns:
        bool: True if the trait is valid, False otherwise
    """
    if trait_name not in PERSONALITY_CONFIG['trait_categories']:
        logger.debug(f"Invalid personality trait name: {trait_name}")
        return False
    
    if not isinstance(score, (int, float)) or not (0 <= score <= 1):
        logger.debug(f"Invalid personality trait score: {score}")
        return False
    
    return True

def validate_interest(category: str, name: str, level: int) -> bool:
    """
    Validate an interest category and level.
    
    Args:
        category: Interest category
        name: Interest name
        level: Interest level (1-5)
        
    Returns:
        bool: True if the interest is valid, False otherwise
    """
    if category not in PERSONALITY_CONFIG['interest_categories']:
        logger.debug(f"Invalid interest category: {category}")
        return False
    
    if not isinstance(name, str) or not name.strip():
        logger.debug(f"Invalid interest name: {name}")
        return False
    
    if not isinstance(level, int) or not (1 <= level <= 5):
        logger.debug(f"Invalid interest level: {level}")
        return False
    
    return True

def validate_location(location: Dict[str, Any]) -> bool:
    """
    Validate location data with coordinates.
    
    Args:
        location: Location data dictionary
        
    Returns:
        bool: True if the location is valid, False otherwise
    """
    # Check required fields
    if not isinstance(location, dict):
        logger.debug("Location must be a dictionary")
        return False
    
    if 'latitude' not in location or 'longitude' not in location:
        logger.debug("Location must include latitude and longitude")
        return False
    
    # Validate coordinates
    lat = location['latitude']
    lng = location['longitude']
    
    if not isinstance(lat, (int, float)) or not (-90 <= lat <= 90):
        logger.debug(f"Invalid latitude: {lat}")
        return False
    
    if not isinstance(lng, (int, float)) or not (-180 <= lng <= 180):
        logger.debug(f"Invalid longitude: {lng}")
        return False
    
    # Validate address if present
    if 'address' in location and not isinstance(location['address'], dict):
        logger.debug("Address must be a dictionary")
        return False
    
    return True

def validate_datetime(datetime_str: str) -> bool:
    """
    Validate a datetime string in ISO format.
    
    Args:
        datetime_str: Datetime string in ISO format
        
    Returns:
        bool: True if the datetime is valid, False otherwise
    """
    try:
        datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        return True
    except (ValueError, AttributeError):
        logger.debug(f"Invalid datetime: {datetime_str}")
        return False


class BaseSchema:
    """
    Base class for all schema validators with common functionality.
    """
    _schema: Dict[str, Any] = {}
    _validators: Dict[str, Callable] = {}
    
    def __init__(self):
        """Initialize the BaseSchema."""
        self._schema = {}
        self._validators = {}
    
    def validate(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate data against the schema.
        
        Args:
            data: The data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        # First validate against JSON schema
        valid, errors = validate_schema(data, self._schema)
        if not valid:
            return False, errors
        
        # Apply custom field validators
        all_errors = []
        for field, validator_func in self._validators.items():
            if field in data:
                field_valid, field_errors = validator_func(data[field])
                if not field_valid:
                    all_errors.extend([f"{field}: {err}" for err in field_errors])
        
        return len(all_errors) == 0, all_errors
    
    def normalize(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize data to conform to the schema.
        
        Args:
            data: The data to normalize
            
        Returns:
            dict: Normalized data
        """
        # Create a copy of the input data
        normalized = data.copy()
        
        # Apply default values for missing fields
        if 'properties' in self._schema:
            for prop, schema in self._schema['properties'].items():
                if prop not in normalized and 'default' in schema:
                    normalized[prop] = schema['default']
        
        return normalized
    
    def register_validator(self, field_name: str, validator_function: Callable) -> None:
        """
        Register a custom field validator function.
        
        Args:
            field_name: The field name to validate
            validator_function: Function that takes the field value and returns (valid, errors)
        """
        self._validators[field_name] = validator_function
        logger.debug(f"Registered validator for field: {field_name}")


class UserProfileSchema(BaseSchema):
    """Schema validator for user profile data."""
    
    def __init__(self):
        """Initialize the UserProfileSchema with profile validation rules."""
        super().__init__()
        
        # Define JSON schema for user profiles
        self._schema = {
            "type": "object",
            "required": ["id", "name", "personalityTraits", "interests", "communicationStyle"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "bio": {"type": "string"},
                "location": {"type": "object"},
                "birthdate": {"type": "string", "format": "date"},
                "personalityTraits": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "interests": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "communicationStyle": {"type": "object"},
                "avatarUrl": {"type": "string"},
                "createdAt": {"type": "string", "format": "date-time"},
                "updatedAt": {"type": "string", "format": "date-time"}
            }
        }
        
        # Register custom validators
        self.register_validator("personalityTraits", self.validate_personality_traits)
        self.register_validator("interests", self.validate_interests)
        self.register_validator("communicationStyle", self.validate_communication_style)
        self.register_validator("location", lambda loc: (validate_location(loc), ["Invalid location"]) if not validate_location(loc) else (True, []))
    
    def validate_profile(self, profile_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a complete user profile.
        
        Args:
            profile_data: The profile data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        return self.validate(profile_data)
    
    def validate_personality_traits(self, traits: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate personality traits in a profile.
        
        Args:
            traits: List of personality trait objects
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(traits, list):
            return False, ["Personality traits must be a list"]
        
        errors = []
        trait_names = set()
        
        for i, trait in enumerate(traits):
            if not isinstance(trait, dict):
                errors.append(f"Trait {i} must be an object")
                continue
                
            if "name" not in trait or "score" not in trait:
                errors.append(f"Trait {i} must have name and score")
                continue
            
            trait_name = trait["name"]
            trait_score = trait["score"]
            
            trait_names.add(trait_name)
            
            if not validate_personality_trait(trait_name, trait_score):
                errors.append(f"Invalid trait: {trait_name} with score {trait_score}")
        
        # Check if all required traits are present
        required_traits = set(PERSONALITY_CONFIG['trait_categories'])
        missing_traits = required_traits - trait_names
        
        if missing_traits:
            errors.append(f"Missing required traits: {', '.join(missing_traits)}")
        
        return len(errors) == 0, errors
    
    def validate_interests(self, interests: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate interests in a profile.
        
        Args:
            interests: List of interest objects
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(interests, list):
            return False, ["Interests must be a list"]
        
        errors = []
        
        for i, interest in enumerate(interests):
            if not isinstance(interest, dict):
                errors.append(f"Interest {i} must be an object")
                continue
                
            if "category" not in interest or "name" not in interest or "level" not in interest:
                errors.append(f"Interest {i} must have category, name, and level")
                continue
            
            category = interest["category"]
            name = interest["name"]
            level = interest["level"]
            
            if not validate_interest(category, name, level):
                errors.append(f"Invalid interest: {category}/{name} with level {level}")
        
        return len(errors) == 0, errors
    
    def validate_communication_style(self, communication_style: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate communication style in a profile.
        
        Args:
            communication_style: Communication style object
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(communication_style, dict):
            return False, ["Communication style must be an object"]
        
        errors = []
        
        # Check if all required style attributes are present
        required_styles = set(PERSONALITY_CONFIG['communication_styles'])
        provided_styles = set(communication_style.keys())
        
        missing_styles = required_styles - provided_styles
        if missing_styles:
            errors.append(f"Missing required communication styles: {', '.join(missing_styles)}")
        
        # Validate style values
        for style, value in communication_style.items():
            if style not in required_styles:
                errors.append(f"Unknown communication style: {style}")
                continue
                
            if not isinstance(value, (int, float)) or not (0 <= value <= 1):
                errors.append(f"Invalid value for {style}: {value}. Must be between 0 and 1.")
        
        return len(errors) == 0, errors


class TribeSchema(BaseSchema):
    """Schema validator for tribe data."""
    
    def __init__(self):
        """Initialize the TribeSchema with tribe validation rules."""
        super().__init__()
        
        # Define JSON schema for tribes
        self._schema = {
            "type": "object",
            "required": ["id", "name", "description", "members", "createdAt"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "location": {"type": "object"},
                "imageUrl": {"type": "string"},
                "members": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "activities": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "interests": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "createdAt": {"type": "string", "format": "date-time"},
                "createdBy": {"type": "string"},
                "status": {"type": "string", "enum": ["forming", "active", "inactive", "dissolved"]},
                "maxMembers": {"type": "integer", "default": MATCHING_CONFIG['max_tribe_size']}
            }
        }
        
        # Register custom validators
        self.register_validator("members", self.validate_members)
        self.register_validator("activities", self.validate_activities)
        self.register_validator("interests", self.validate_tribe_interests)
        self.register_validator("location", lambda loc: (validate_location(loc), ["Invalid location"]) if not validate_location(loc) else (True, []))
    
    def validate_tribe(self, tribe_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a complete tribe.
        
        Args:
            tribe_data: The tribe data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        return self.validate(tribe_data)
    
    def validate_members(self, members: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate tribe members list.
        
        Args:
            members: List of member objects
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(members, list):
            return False, ["Members must be a list"]
        
        errors = []
        
        # Check member count
        if len(members) < MATCHING_CONFIG['min_tribe_size']:
            errors.append(f"Tribe must have at least {MATCHING_CONFIG['min_tribe_size']} members")
        
        if len(members) > MATCHING_CONFIG['max_tribe_size']:
            errors.append(f"Tribe cannot have more than {MATCHING_CONFIG['max_tribe_size']} members")
        
        # Validate each member
        for i, member in enumerate(members):
            if not isinstance(member, dict):
                errors.append(f"Member {i} must be an object")
                continue
                
            if "userId" not in member or "role" not in member or "joinedAt" not in member:
                errors.append(f"Member {i} must have userId, role, and joinedAt")
                continue
            
            # Validate join date
            if not validate_datetime(member["joinedAt"]):
                errors.append(f"Invalid joinedAt date for member {i}: {member['joinedAt']}")
            
            # Validate role
            valid_roles = ["member", "creator", "admin"]
            if member["role"] not in valid_roles:
                errors.append(f"Invalid role for member {i}: {member['role']}. Must be one of: {', '.join(valid_roles)}")
        
        return len(errors) == 0, errors
    
    def validate_activities(self, activities: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate tribe activities list.
        
        Args:
            activities: List of activity objects
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(activities, list):
            return False, ["Activities must be a list"]
        
        errors = []
        
        for i, activity in enumerate(activities):
            if not isinstance(activity, dict):
                errors.append(f"Activity {i} must be an object")
                continue
                
            if "type" not in activity or "timestamp" not in activity:
                errors.append(f"Activity {i} must have type and timestamp")
                continue
            
            # Validate activity type
            valid_types = ["event", "chat", "challenge", "meetup"]
            if activity["type"] not in valid_types:
                errors.append(f"Invalid activity type for activity {i}: {activity['type']}. "
                             f"Must be one of: {', '.join(valid_types)}")
            
            # Validate timestamp
            if not validate_datetime(activity["timestamp"]):
                errors.append(f"Invalid timestamp for activity {i}: {activity['timestamp']}")
        
        return len(errors) == 0, errors
    
    def validate_tribe_interests(self, interests: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate tribe collective interests.
        
        Args:
            interests: List of interest objects
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(interests, list):
            return False, ["Interests must be a list"]
        
        errors = []
        
        for i, interest in enumerate(interests):
            if not isinstance(interest, dict):
                errors.append(f"Interest {i} must be an object")
                continue
                
            if "category" not in interest or "name" not in interest or "level" not in interest:
                errors.append(f"Interest {i} must have category, name, and level")
                continue
            
            category = interest["category"]
            name = interest["name"]
            level = interest["level"]
            
            if not validate_interest(category, name, level):
                errors.append(f"Invalid interest: {category}/{name} with level {level}")
        
        return len(errors) == 0, errors


class EventSchema(BaseSchema):
    """Schema validator for event data."""
    
    def __init__(self):
        """Initialize the EventSchema with event validation rules."""
        super().__init__()
        
        # Define JSON schema for events
        self._schema = {
            "type": "object",
            "required": ["id", "name", "startTime", "location", "tribeId"],
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "location": {"type": "object"},
                "venue": {"type": "object"},
                "startTime": {"type": "string", "format": "date-time"},
                "endTime": {"type": "string", "format": "date-time"},
                "tribeId": {"type": "string"},
                "createdBy": {"type": "string"},
                "attendees": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "weatherData": {"type": "object"},
                "status": {"type": "string", "enum": ["scheduled", "canceled", "completed"]},
                "cost": {"type": "number", "minimum": 0},
                "paymentStatus": {"type": "string"},
                "media": {
                    "type": "array",
                    "items": {"type": "object"}
                }
            }
        }
        
        # Register custom validators
        self.register_validator("venue", self.validate_venue)
        self.register_validator("attendees", self.validate_attendees)
        self.register_validator("location", lambda loc: (validate_location(loc), ["Invalid location"]) if not validate_location(loc) else (True, []))
    
    def validate_event(self, event_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a complete event.
        
        Args:
            event_data: The event data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        # Basic schema validation
        valid, errors = self.validate(event_data)
        if not valid:
            return False, errors
        
        # Additional validation for start/end times
        if "startTime" in event_data and "endTime" in event_data:
            time_valid, time_errors = self.validate_event_time(
                event_data["startTime"], event_data["endTime"]
            )
            if not time_valid:
                valid = False
                errors.extend(time_errors)
        
        return valid, errors
    
    def validate_venue(self, venue: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate event venue data.
        
        Args:
            venue: Venue object
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(venue, dict):
            return False, ["Venue must be an object"]
        
        errors = []
        
        # Check required fields
        required_fields = ["name", "location"]
        missing_fields = [field for field in required_fields if field not in venue]
        
        if missing_fields:
            errors.append(f"Venue is missing required fields: {', '.join(missing_fields)}")
        
        # Validate location
        if "location" in venue and not validate_location(venue["location"]):
            errors.append("Invalid venue location")
        
        return len(errors) == 0, errors
    
    def validate_attendees(self, attendees: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate event attendees list.
        
        Args:
            attendees: List of attendee objects
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(attendees, list):
            return False, ["Attendees must be a list"]
        
        errors = []
        
        for i, attendee in enumerate(attendees):
            if not isinstance(attendee, dict):
                errors.append(f"Attendee {i} must be an object")
                continue
                
            if "userId" not in attendee or "rsvpStatus" not in attendee:
                errors.append(f"Attendee {i} must have userId and rsvpStatus")
                continue
            
            # Validate RSVP status
            valid_statuses = ["going", "maybe", "not_going", "no_response"]
            if attendee["rsvpStatus"] not in valid_statuses:
                errors.append(f"Invalid RSVP status for attendee {i}: {attendee['rsvpStatus']}. "
                             f"Must be one of: {', '.join(valid_statuses)}")
            
            # Validate RSVP time if present
            if "rsvpTime" in attendee and not validate_datetime(attendee["rsvpTime"]):
                errors.append(f"Invalid RSVP time for attendee {i}: {attendee['rsvpTime']}")
            
            # Validate check-in status if present
            if "hasCheckedIn" in attendee and not isinstance(attendee["hasCheckedIn"], bool):
                errors.append(f"hasCheckedIn must be a boolean for attendee {i}")
            
            # Validate check-in time if present
            if "checkedInAt" in attendee and not validate_datetime(attendee["checkedInAt"]):
                errors.append(f"Invalid check-in time for attendee {i}: {attendee['checkedInAt']}")
        
        return len(errors) == 0, errors
    
    def validate_event_time(self, start_time: str, end_time: str) -> Tuple[bool, List[str]]:
        """
        Validate event start and end times.
        
        Args:
            start_time: Event start time in ISO format
            end_time: Event end time in ISO format
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        errors = []
        
        # Validate datetime formats
        if not validate_datetime(start_time):
            errors.append(f"Invalid start time: {start_time}")
        
        if not validate_datetime(end_time):
            errors.append(f"Invalid end time: {end_time}")
        
        # If both times are valid, check that end time is after start time
        if len(errors) == 0:
            try:
                start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                
                if end <= start:
                    errors.append("End time must be after start time")
            except (ValueError, AttributeError):
                # This shouldn't happen since we already validated the datetime formats
                errors.append("Error comparing start and end times")
        
        return len(errors) == 0, errors


class PersonalityTraitSchema(BaseSchema):
    """Schema validator for personality trait data."""
    
    def __init__(self):
        """Initialize the PersonalityTraitSchema with trait validation rules."""
        super().__init__()
        
        # Define JSON schema for personality traits
        self._schema = {
            "type": "object",
            "required": ["name", "score"],
            "properties": {
                "name": {"type": "string"},
                "score": {"type": "number", "minimum": 0, "maximum": 1},
                "assessedAt": {"type": "string", "format": "date-time"}
            }
        }
    
    def validate_trait_name(self, trait_name: str) -> bool:
        """
        Validate a personality trait name.
        
        Args:
            trait_name: Name of the personality trait
            
        Returns:
            bool: True if valid, False otherwise
        """
        return trait_name in PERSONALITY_CONFIG['trait_categories']
    
    def validate_score(self, score: float) -> bool:
        """
        Validate a personality trait score.
        
        Args:
            score: Score value for the trait
            
        Returns:
            bool: True if valid, False otherwise
        """
        return isinstance(score, (int, float)) and 0 <= score <= 1


class InterestSchema(BaseSchema):
    """Schema validator for interest data."""
    
    def __init__(self):
        """Initialize the InterestSchema with interest validation rules."""
        super().__init__()
        
        # Define JSON schema for interests
        self._schema = {
            "type": "object",
            "required": ["category", "name", "level"],
            "properties": {
                "category": {"type": "string"},
                "name": {"type": "string"},
                "level": {"type": "integer", "minimum": 1, "maximum": 5}
            }
        }
    
    def validate_category(self, category: str) -> bool:
        """
        Validate an interest category.
        
        Args:
            category: Interest category
            
        Returns:
            bool: True if valid, False otherwise
        """
        return category in PERSONALITY_CONFIG['interest_categories']
    
    def validate_level(self, level: int) -> bool:
        """
        Validate an interest level.
        
        Args:
            level: Interest level (1-5)
            
        Returns:
            bool: True if valid, False otherwise
        """
        return isinstance(level, int) and 1 <= level <= 5


class LocationSchema(BaseSchema):
    """Schema validator for location data."""
    
    def __init__(self):
        """Initialize the LocationSchema with location validation rules."""
        super().__init__()
        
        # Define JSON schema for locations
        self._schema = {
            "type": "object",
            "required": ["latitude", "longitude"],
            "properties": {
                "latitude": {"type": "number", "minimum": -90, "maximum": 90},
                "longitude": {"type": "number", "minimum": -180, "maximum": 180},
                "address": {"type": "object"},
                "name": {"type": "string"},
                "placeId": {"type": "string"}
            }
        }
    
    def validate_latitude(self, latitude: float) -> bool:
        """
        Validate a latitude value.
        
        Args:
            latitude: Latitude coordinate
            
        Returns:
            bool: True if valid, False otherwise
        """
        return isinstance(latitude, (int, float)) and -90 <= latitude <= 90
    
    def validate_longitude(self, longitude: float) -> bool:
        """
        Validate a longitude value.
        
        Args:
            longitude: Longitude coordinate
            
        Returns:
            bool: True if valid, False otherwise
        """
        return isinstance(longitude, (int, float)) and -180 <= longitude <= 180
    
    def validate_address(self, address: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate address components.
        
        Args:
            address: Address object
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(address, dict):
            return False, ["Address must be an object"]
        
        errors = []
        
        # Check for common address components
        address_components = ["street", "city", "state", "country", "postalCode"]
        
        # Postal code pattern (basic check, should be refined for specific countries)
        if "postalCode" in address:
            postal_code = address["postalCode"]
            if not re.match(r'^\d{5}(-\d{4})?$', postal_code):  # Basic US format
                errors.append(f"Invalid postal code format: {postal_code}")
        
        return len(errors) == 0, errors


class PromptSchema(BaseSchema):
    """Schema validator for AI prompt data."""
    
    def __init__(self):
        """Initialize the PromptSchema with prompt validation rules."""
        super().__init__()
        
        # Define JSON schema for prompts
        self._schema = {
            "type": "object",
            "required": ["type", "parameters"],
            "properties": {
                "type": {"type": "string"},
                "parameters": {"type": "object"},
                "context": {"type": "object"},
                "priority": {"type": "integer", "minimum": 1, "maximum": 5, "default": 3},
                "createdAt": {"type": "string", "format": "date-time"}
            }
        }
        
        # Register custom validators
        self.register_validator("type", lambda t: (self.validate_prompt_type(t), ["Invalid prompt type"]) if not self.validate_prompt_type(t) else (True, []))
    
    def validate_prompt_type(self, prompt_type: str) -> bool:
        """
        Validate a prompt type.
        
        Args:
            prompt_type: Type of prompt
            
        Returns:
            bool: True if valid, False otherwise
        """
        return prompt_type in ENGAGEMENT_CONFIG['prompt_types']
    
    def validate_prompt_parameters(self, parameters: Dict[str, Any], prompt_type: str) -> Tuple[bool, List[str]]:
        """
        Validate prompt parameters.
        
        Args:
            parameters: Prompt parameters
            prompt_type: Type of prompt
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(parameters, dict):
            return False, ["Parameters must be an object"]
        
        errors = []
        
        # Different parameter requirements based on prompt type
        if prompt_type == "conversation":
            if "topic" not in parameters:
                errors.append("Conversation prompt must include topic")
                
        elif prompt_type == "activity":
            if "category" not in parameters:
                errors.append("Activity prompt must include category")
                
            if "category" in parameters and parameters["category"] not in ENGAGEMENT_CONFIG['activity_categories']:
                errors.append(f"Invalid activity category: {parameters['category']}")
                
        elif prompt_type == "challenge":
            if "challengeType" not in parameters:
                errors.append("Challenge prompt must include challengeType")
                
            if "challengeType" in parameters and parameters["challengeType"] not in ENGAGEMENT_CONFIG['challenge_types']:
                errors.append(f"Invalid challenge type: {parameters['challengeType']}")
                
        elif prompt_type == "reflection":
            if "focusArea" not in parameters:
                errors.append("Reflection prompt must include focusArea")
        
        return len(errors) == 0, errors


class ResponseSchema(BaseSchema):
    """Schema validator for AI response data."""
    
    def __init__(self):
        """Initialize the ResponseSchema with response validation rules."""
        super().__init__()
        
        # Define JSON schema for AI responses
        self._schema = {
            "type": "object",
            "required": ["promptId", "type", "content"],
            "properties": {
                "promptId": {"type": "string"},
                "type": {"type": "string"},
                "content": {"type": "object"},
                "createdAt": {"type": "string", "format": "date-time"},
                "metadata": {"type": "object"}
            }
        }
    
    def validate_response(self, response_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a complete AI response.
        
        Args:
            response_data: The response data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        # Basic schema validation
        valid, errors = self.validate(response_data)
        if not valid:
            return False, errors
        
        # Additional validation for content based on response type
        if "type" in response_data and "content" in response_data:
            content_valid, content_errors = self.validate_response_content(
                response_data["content"], response_data["type"]
            )
            if not content_valid:
                valid = False
                errors.extend(content_errors)
        
        return valid, errors
    
    def validate_response_content(self, content: Dict[str, Any], response_type: str) -> Tuple[bool, List[str]]:
        """
        Validate response content based on type.
        
        Args:
            content: Response content object
            response_type: Type of response
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(content, dict):
            return False, ["Content must be an object"]
        
        errors = []
        
        # Different content requirements based on response type
        if response_type == "conversation":
            if "message" not in content:
                errors.append("Conversation response must include message")
                
        elif response_type == "activity":
            if "activityName" not in content or "description" not in content:
                errors.append("Activity response must include activityName and description")
                
        elif response_type == "challenge":
            if "challengeName" not in content or "description" not in content:
                errors.append("Challenge response must include challengeName and description")
                
        elif response_type == "recommendation":
            if "items" not in content or not isinstance(content["items"], list):
                errors.append("Recommendation response must include items array")
        
        return len(errors) == 0, errors


class MatchResultSchema(BaseSchema):
    """Schema validator for matching result data."""
    
    def __init__(self):
        """Initialize the MatchResultSchema with match result validation rules."""
        super().__init__()
        
        # Define JSON schema for match results
        self._schema = {
            "type": "object",
            "required": ["userId", "tribeId", "compatibilityScore", "matchFactors"],
            "properties": {
                "userId": {"type": "string"},
                "tribeId": {"type": "string"},
                "compatibilityScore": {"type": "number", "minimum": 0, "maximum": 1},
                "matchFactors": {"type": "object"},
                "createdAt": {"type": "string", "format": "date-time"},
                "expiresAt": {"type": "string", "format": "date-time"}
            }
        }
        
        # Register custom validators
        self.register_validator("compatibilityScore", lambda s: (self.validate_compatibility_score(s), ["Invalid compatibility score"]) if not self.validate_compatibility_score(s) else (True, []))
        self.register_validator("matchFactors", self.validate_match_factors)
    
    def validate_match_result(self, match_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a complete match result.
        
        Args:
            match_data: The match result data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        return self.validate(match_data)
    
    def validate_compatibility_score(self, score: float) -> bool:
        """
        Validate a compatibility score.
        
        Args:
            score: Compatibility score
            
        Returns:
            bool: True if valid, False otherwise
        """
        return isinstance(score, (int, float)) and 0 <= score <= 1
    
    def validate_match_factors(self, factors: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate match factor scores.
        
        Args:
            factors: Match factors object
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(factors, dict):
            return False, ["Match factors must be an object"]
        
        errors = []
        
        # Check required factor categories
        required_factors = ["personality", "interests", "location", "availability"]
        missing_factors = [factor for factor in required_factors if factor not in factors]
        
        if missing_factors:
            errors.append(f"Missing required match factors: {', '.join(missing_factors)}")
        
        # Validate factor scores
        for factor, score in factors.items():
            if not isinstance(score, (int, float)) or not (0 <= score <= 1):
                errors.append(f"Invalid score for factor {factor}: {score}. Must be between 0 and 1.")
        
        return len(errors) == 0, errors


class RecommendationSchema(BaseSchema):
    """Schema validator for recommendation data."""
    
    def __init__(self):
        """Initialize the RecommendationSchema with recommendation validation rules."""
        super().__init__()
        
        # Define JSON schema for recommendations
        self._schema = {
            "type": "object",
            "required": ["tribeId", "type", "items", "relevanceFactors"],
            "properties": {
                "tribeId": {"type": "string"},
                "userId": {"type": "string"},
                "type": {"type": "string"},
                "items": {
                    "type": "array",
                    "items": {"type": "object"}
                },
                "relevanceFactors": {"type": "object"},
                "createdAt": {"type": "string", "format": "date-time"},
                "expiresAt": {"type": "string", "format": "date-time"}
            }
        }
        
        # Register custom validators
        self.register_validator("type", lambda t: (self.validate_recommendation_type(t), ["Invalid recommendation type"]) if not self.validate_recommendation_type(t) else (True, []))
        self.register_validator("relevanceFactors", self.validate_relevance_factors)
    
    def validate_recommendation(self, recommendation_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate a complete recommendation.
        
        Args:
            recommendation_data: The recommendation data to validate
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        return self.validate(recommendation_data)
    
    def validate_recommendation_type(self, recommendation_type: str) -> bool:
        """
        Validate a recommendation type.
        
        Args:
            recommendation_type: Type of recommendation
            
        Returns:
            bool: True if valid, False otherwise
        """
        return recommendation_type in RECOMMENDATION_CONFIG['event_types']
    
    def validate_relevance_score(self, score: float) -> bool:
        """
        Validate a recommendation relevance score.
        
        Args:
            score: Relevance score
            
        Returns:
            bool: True if valid, False otherwise
        """
        return isinstance(score, (int, float)) and 0 <= score <= 1
    
    def validate_relevance_factors(self, factors: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate recommendation relevance factors.
        
        Args:
            factors: Relevance factors object
            
        Returns:
            Tuple containing:
            - bool: True if validation passed, False otherwise
            - list: List of validation error messages, empty if validation passed
        """
        if not isinstance(factors, dict):
            return False, ["Relevance factors must be an object"]
        
        errors = []
        
        # Validate factor scores
        for factor, score in factors.items():
            if not isinstance(score, (int, float)) or not (0 <= score <= 1):
                errors.append(f"Invalid score for factor {factor}: {score}. Must be between 0 and 1.")
        
        return len(errors) == 0, errors