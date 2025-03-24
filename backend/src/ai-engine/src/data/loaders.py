import logging
import json
import aiohttp
import asyncio
from typing import Dict, List, Any, Union, Optional, Callable
import pandas as pd
import os
import hashlib
import time
from datetime import datetime

from .schemas import (
    UserProfileSchema,
    TribeSchema,
    EventSchema,
    PromptSchema,
    ResponseSchema
)
from ..config.settings import (
    DATA_SOURCES,
    CACHE_ENABLED,
    CACHE_TTL
)
from ..utils.data_preprocessing import (
    normalize_profile_data,
    normalize_tribe_data,
    normalize_event_data
)

# Set up logger
logger = logging.getLogger(__name__)

# Global cache dictionary
DATA_CACHE = {}

def load_json_file(file_path: str) -> Dict[str, Any]:
    """
    Load data from a JSON file

    Args:
        file_path: Path to the JSON file

    Returns:
        Loaded JSON data as a dictionary

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return data
    except FileNotFoundError:
        logger.error(f"JSON file not found: {file_path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in file {file_path}: {e}")
        raise

def save_json_file(file_path: str, data: Dict[str, Any]) -> bool:
    """
    Save data to a JSON file

    Args:
        file_path: Path to save the JSON file
        data: Data to save

    Returns:
        True if successful, False otherwise
    """
    try:
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving JSON file {file_path}: {e}")
        return False

def load_csv_file(file_path: str, options: Dict[str, Any] = None) -> pd.DataFrame:
    """
    Load data from a CSV file

    Args:
        file_path: Path to the CSV file
        options: Options for pandas read_csv

    Returns:
        Loaded CSV data as a DataFrame

    Raises:
        FileNotFoundError: If the file doesn't exist
        pd.errors.ParserError: If the CSV file is malformed
    """
    if options is None:
        options = {}
    
    try:
        df = pd.read_csv(file_path, **options)
        return df
    except FileNotFoundError:
        logger.error(f"CSV file not found: {file_path}")
        raise
    except Exception as e:
        logger.error(f"Error loading CSV file {file_path}: {e}")
        raise

def get_cached_data(cache_key: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached data if available and not expired

    Args:
        cache_key: Unique key for the cached data

    Returns:
        Cached data if available and not expired, None otherwise
    """
    if not CACHE_ENABLED:
        return None
    
    if cache_key not in DATA_CACHE:
        return None
    
    cache_entry = DATA_CACHE[cache_key]
    timestamp = cache_entry.get('timestamp', 0)
    current_time = time.time()
    
    # Check if cache has expired
    if current_time - timestamp > CACHE_TTL:
        logger.debug(f"Cache expired for key: {cache_key}")
        return None
    
    logger.debug(f"Cache hit for key: {cache_key}")
    return cache_entry.get('data')

def cache_data(cache_key: str, data: Dict[str, Any]) -> None:
    """
    Cache data with expiration

    Args:
        cache_key: Unique key for the data
        data: Data to cache
    """
    if not CACHE_ENABLED:
        return
    
    DATA_CACHE[cache_key] = {
        'data': data,
        'timestamp': time.time()
    }
    logger.debug(f"Data cached with key: {cache_key}")

def clear_cache() -> None:
    """
    Clear the data cache
    """
    global DATA_CACHE
    DATA_CACHE = {}
    logger.info("Data cache cleared")

def generate_cache_key(data_type: str, params: Dict[str, Any]) -> str:
    """
    Generate a unique cache key based on parameters

    Args:
        data_type: Type of data being cached
        params: Parameters used to fetch the data

    Returns:
        Unique cache key as a string
    """
    # Create a dictionary with data type and params
    key_dict = {
        'data_type': data_type,
        'params': params
    }
    
    # Convert to JSON string and hash
    key_str = json.dumps(key_dict, sort_keys=True)
    return hashlib.md5(key_str.encode()).hexdigest()

class DataLoader:
    """
    Base class for data loaders with common functionality for loading,
    validating, and caching data
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the DataLoader with configuration

        Args:
            config: Configuration dictionary
        """
        self._logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
        if config is None:
            config = {}
        
        # Use DATA_SOURCES if defined, otherwise use an empty dict as fallback
        default_data_sources = getattr(DATA_SOURCES, {})
        
        self._data_sources = config.get('data_sources', default_data_sources)
        self._cache_enabled = config.get('cache_enabled', CACHE_ENABLED)
        self._cache_ttl = config.get('cache_ttl', CACHE_TTL)
        
        self._logger.debug("DataLoader initialized")
    
    def load(self, source_name: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Load data from a specified source

        Args:
            source_name: Name of the data source
            params: Parameters for the data source

        Returns:
            Loaded data

        Raises:
            ValueError: If the source name is not found
        """
        if params is None:
            params = {}
        
        # Check if source exists
        if source_name not in self._data_sources:
            raise ValueError(f"Source '{source_name}' not found in data sources")
        
        source_config = self._data_sources[source_name]
        source_type = source_config.get('type', 'unknown')
        
        # Generate cache key
        cache_key = generate_cache_key(source_name, params)
        
        # Check cache first
        cached_data = get_cached_data(cache_key)
        if cached_data:
            self._logger.debug(f"Using cached data for source: {source_name}")
            return cached_data
        
        # Load data based on source type
        if source_type == 'file':
            data = self._load_from_file(source_config, params)
        elif source_type == 'api':
            data = self._load_from_api(source_config, params)
        elif source_type == 'database':
            data = self._load_from_database(source_config, params)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")
        
        # Validate data
        data_type = source_config.get('data_type', 'unknown')
        validated_data = self._validate_data(data, data_type)
        
        # Cache the validated data
        cache_data(cache_key, validated_data)
        
        return validated_data
    
    async def async_load(self, source_name: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Asynchronously load data from a specified source

        Args:
            source_name: Name of the data source
            params: Parameters for the data source

        Returns:
            Loaded data

        Raises:
            ValueError: If the source name is not found
        """
        if params is None:
            params = {}
        
        # Check if source exists
        if source_name not in self._data_sources:
            raise ValueError(f"Source '{source_name}' not found in data sources")
        
        source_config = self._data_sources[source_name]
        source_type = source_config.get('type', 'unknown')
        
        # Generate cache key
        cache_key = generate_cache_key(source_name, params)
        
        # Check cache first
        cached_data = get_cached_data(cache_key)
        if cached_data:
            self._logger.debug(f"Using cached data for source: {source_name}")
            return cached_data
        
        # Load data based on source type
        if source_type == 'api':
            data = await self._async_load_from_api(source_config, params)
        elif source_type == 'file':
            # File operations are typically synchronous
            data = self._load_from_file(source_config, params)
        elif source_type == 'database':
            # For simplicity, database operations are synchronous in this implementation
            # In a real implementation, you would use an async database client
            data = self._load_from_database(source_config, params)
        else:
            raise ValueError(f"Unsupported source type: {source_type}")
        
        # Validate data
        data_type = source_config.get('data_type', 'unknown')
        validated_data = self._validate_data(data, data_type)
        
        # Cache the validated data
        cache_data(cache_key, validated_data)
        
        return validated_data
    
    async def batch_load(self, source_name: str, param_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Load multiple data items in batch

        Args:
            source_name: Name of the data source
            param_list: List of parameter dictionaries for each item

        Returns:
            List of loaded data items
        """
        if not param_list:
            return []
        
        # Check if source exists
        if source_name not in self._data_sources:
            raise ValueError(f"Source '{source_name}' not found in data sources")
        
        # Create tasks for each parameter set
        tasks = [self.async_load(source_name, params) for params in param_list]
        
        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self._logger.error(f"Error loading item {i}: {result}")
                processed_results.append(None)
            else:
                processed_results.append(result)
        
        return processed_results
    
    def _load_from_file(self, source_config: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load data from a file source

        Args:
            source_config: Configuration for the file source
            params: Parameters for loading the file

        Returns:
            Loaded data
        """
        file_path = source_config.get('path', '')
        
        # Apply parameter substitution to file path if needed
        if '{' in file_path and '}' in file_path:
            try:
                file_path = file_path.format(**params)
            except KeyError as e:
                self._logger.error(f"Missing parameter for file path: {e}")
                raise ValueError(f"Missing parameter for file path: {e}")
        
        # Determine file type from extension
        file_extension = os.path.splitext(file_path)[1].lower()
        
        if file_extension == '.json':
            data = load_json_file(file_path)
        elif file_extension in ['.csv', '.tsv']:
            csv_options = source_config.get('options', {})
            df = load_csv_file(file_path, csv_options)
            
            # Convert DataFrame to dictionary format
            if source_config.get('format', 'records') == 'records':
                data = df.to_dict('records')
            else:
                data = df.to_dict()
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        # Apply transformations if specified
        if 'transform' in source_config and callable(source_config['transform']):
            data = source_config['transform'](data, params)
        
        return data
    
    def _load_from_api(self, source_config: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load data from an API source

        Args:
            source_config: Configuration for the API source
            params: Parameters for the API request

        Returns:
            Loaded data
        """
        # Create an async function and run it synchronously
        async def fetch():
            endpoint = source_config.get('endpoint', '')
            method = source_config.get('method', 'GET').upper()
            headers = source_config.get('headers', {})
            
            # Apply parameter substitution to endpoint if needed
            if '{' in endpoint and '}' in endpoint:
                try:
                    endpoint = endpoint.format(**params)
                except KeyError as e:
                    self._logger.error(f"Missing parameter for API endpoint: {e}")
                    raise ValueError(f"Missing parameter for API endpoint: {e}")
            
            # Prepare request parameters
            request_params = {}
            if 'query_params' in source_config:
                request_params = source_config['query_params'].copy()
                
            # Add additional parameters from params
            for key, value in params.items():
                if key not in ['endpoint']:
                    request_params[key] = value
            
            # Prepare request body
            body = None
            if method in ['POST', 'PUT', 'PATCH'] and 'body' in source_config:
                body = source_config['body'].copy()
                
                # Apply parameter substitution to body
                for key, value in params.items():
                    if key in body:
                        body[key] = value
            
            # Send HTTP request asynchronously
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.request(
                        method=method,
                        url=endpoint,
                        params=request_params,
                        headers=headers,
                        json=body,
                        timeout=aiohttp.ClientTimeout(total=source_config.get('timeout', 30))
                    ) as response:
                        response.raise_for_status()
                        return await response.json()
            except Exception as e:
                self._logger.error(f"API request failed: {e}")
                raise
        
        # Run the async function in a new event loop
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            data = loop.run_until_complete(fetch())
            loop.close()
        except Exception as e:
            self._logger.error(f"API request execution failed: {e}")
            raise
        
        # Apply transformations if specified
        if 'transform' in source_config and callable(source_config['transform']):
            data = source_config['transform'](data, params)
        
        return data
    
    async def _async_load_from_api(self, source_config: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Asynchronously load data from an API source

        Args:
            source_config: Configuration for the API source
            params: Parameters for the API request

        Returns:
            Loaded data
        """
        endpoint = source_config.get('endpoint', '')
        method = source_config.get('method', 'GET').upper()
        headers = source_config.get('headers', {})
        
        # Apply parameter substitution to endpoint if needed
        if '{' in endpoint and '}' in endpoint:
            try:
                endpoint = endpoint.format(**params)
            except KeyError as e:
                self._logger.error(f"Missing parameter for API endpoint: {e}")
                raise ValueError(f"Missing parameter for API endpoint: {e}")
        
        # Prepare request parameters
        request_params = {}
        if 'query_params' in source_config:
            request_params = source_config['query_params'].copy()
            
        # Add additional parameters from params
        for key, value in params.items():
            if key not in ['endpoint']:
                request_params[key] = value
        
        # Prepare request body
        body = None
        if method in ['POST', 'PUT', 'PATCH'] and 'body' in source_config:
            body = source_config['body'].copy()
            
            # Apply parameter substitution to body
            for key, value in params.items():
                if key in body:
                    body[key] = value
        
        # Send HTTP request asynchronously
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method=method,
                    url=endpoint,
                    params=request_params,
                    headers=headers,
                    json=body,
                    timeout=aiohttp.ClientTimeout(total=source_config.get('timeout', 30))
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
        except Exception as e:
            self._logger.error(f"Async API request failed: {e}")
            raise
        
        # Apply transformations if specified
        if 'transform' in source_config and callable(source_config['transform']):
            data = source_config['transform'](data, params)
        
        return data
    
    def _load_from_database(self, source_config: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load data from a database source

        Args:
            source_config: Configuration for the database source
            params: Parameters for the database query

        Returns:
            Loaded data
        """
        query = source_config.get('query', '')
        
        # Apply parameter substitution to query if needed
        if '{' in query and '}' in query:
            try:
                query = query.format(**params)
            except KeyError as e:
                self._logger.error(f"Missing parameter for database query: {e}")
                raise ValueError(f"Missing parameter for database query: {e}")
        
        # In a real implementation, you would connect to the database and execute the query
        # For now, we'll just log a warning
        self._logger.warning("Database loading not implemented. Configure a connection in a real implementation.")
        
        # Placeholder for database query result
        # In a real implementation, this would be the result of the database query
        data = source_config.get('mock_data', {})
        
        # Apply transformations if specified
        if 'transform' in source_config and callable(source_config['transform']):
            data = source_config['transform'](data, params)
        
        return data
    
    def _validate_data(self, data: Dict[str, Any], data_type: str) -> Dict[str, Any]:
        """
        Validate loaded data against a schema

        Args:
            data: Data to validate
            data_type: Type of data for schema selection

        Returns:
            Validated data
        """
        # Select appropriate schema based on data type
        schema = None
        
        if data_type == 'user_profile':
            schema = UserProfileSchema()
        elif data_type == 'tribe':
            schema = TribeSchema()
        elif data_type == 'event':
            schema = EventSchema()
        elif data_type == 'prompt':
            schema = PromptSchema()
        elif data_type == 'response':
            schema = ResponseSchema()
        
        # If no schema is available, return data as is
        if schema is None:
            self._logger.warning(f"No schema available for data type: {data_type}")
            return data
        
        # Validate data against schema
        valid, errors = schema.validate(data)
        
        if not valid:
            self._logger.warning(f"Validation errors for {data_type}: {errors}")
            # In a production environment, you might want to raise an exception
            # or attempt to fix the data based on the errors
        
        return data

class UserProfileLoader(DataLoader):
    """
    Specialized loader for user profile data with methods for loading
    individual profiles and batches
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the UserProfileLoader

        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self._schema = UserProfileSchema()
    
    def load_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Load a user profile by ID

        Args:
            user_id: ID of the user to load

        Returns:
            User profile data
        """
        params = {'user_id': user_id}
        
        profile_data = self.load('user_profile', params)
        
        # Apply normalization
        normalized_data = normalize_profile_data(profile_data)
        
        return normalized_data
    
    async def async_load_profile(self, user_id: str) -> Dict[str, Any]:
        """
        Asynchronously load a user profile by ID

        Args:
            user_id: ID of the user to load

        Returns:
            User profile data
        """
        params = {'user_id': user_id}
        
        profile_data = await self.async_load('user_profile', params)
        
        # Apply normalization
        normalized_data = normalize_profile_data(profile_data)
        
        return normalized_data
    
    async def load_profiles(self, user_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Load multiple user profiles by ID

        Args:
            user_ids: List of user IDs to load

        Returns:
            List of user profile data
        """
        param_list = [{'user_id': uid} for uid in user_ids]
        
        profiles = await self.batch_load('user_profile', param_list)
        
        # Apply normalization to each profile
        normalized_profiles = [
            normalize_profile_data(profile) if profile else None
            for profile in profiles
        ]
        
        return normalized_profiles
    
    def load_profiles_by_criteria(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Load user profiles matching specified criteria

        Args:
            criteria: Criteria for filtering profiles

        Returns:
            List of matching user profile data
        """
        profiles_data = self.load('user_profiles_search', criteria)
        
        # Apply normalization to each profile
        if isinstance(profiles_data, list):
            normalized_profiles = [
                normalize_profile_data(profile)
                for profile in profiles_data
            ]
            return normalized_profiles
        else:
            self._logger.warning("Expected list of profiles, got something else")
            return []

class TribeLoader(DataLoader):
    """
    Specialized loader for tribe data with methods for loading
    individual tribes and batches
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TribeLoader

        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self._schema = TribeSchema()
    
    def load_tribe(self, tribe_id: str) -> Dict[str, Any]:
        """
        Load a tribe by ID

        Args:
            tribe_id: ID of the tribe to load

        Returns:
            Tribe data
        """
        params = {'tribe_id': tribe_id}
        
        tribe_data = self.load('tribe', params)
        
        # Apply normalization
        normalized_data = normalize_tribe_data(tribe_data)
        
        return normalized_data
    
    async def async_load_tribe(self, tribe_id: str) -> Dict[str, Any]:
        """
        Asynchronously load a tribe by ID

        Args:
            tribe_id: ID of the tribe to load

        Returns:
            Tribe data
        """
        params = {'tribe_id': tribe_id}
        
        tribe_data = await self.async_load('tribe', params)
        
        # Apply normalization
        normalized_data = normalize_tribe_data(tribe_data)
        
        return normalized_data
    
    async def load_tribes(self, tribe_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Load multiple tribes by ID

        Args:
            tribe_ids: List of tribe IDs to load

        Returns:
            List of tribe data
        """
        param_list = [{'tribe_id': tid} for tid in tribe_ids]
        
        tribes = await self.batch_load('tribe', param_list)
        
        # Apply normalization to each tribe
        normalized_tribes = [
            normalize_tribe_data(tribe) if tribe else None
            for tribe in tribes
        ]
        
        return normalized_tribes
    
    def load_tribes_by_criteria(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Load tribes matching specified criteria

        Args:
            criteria: Criteria for filtering tribes

        Returns:
            List of matching tribe data
        """
        tribes_data = self.load('tribes_search', criteria)
        
        # Apply normalization to each tribe
        if isinstance(tribes_data, list):
            normalized_tribes = [
                normalize_tribe_data(tribe)
                for tribe in tribes_data
            ]
            return normalized_tribes
        else:
            self._logger.warning("Expected list of tribes, got something else")
            return []
    
    def load_user_tribes(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Load all tribes that a user belongs to

        Args:
            user_id: ID of the user

        Returns:
            List of tribe data
        """
        params = {'user_id': user_id}
        
        tribes_data = self.load('user_tribes', params)
        
        # Apply normalization to each tribe
        if isinstance(tribes_data, list):
            normalized_tribes = [
                normalize_tribe_data(tribe)
                for tribe in tribes_data
            ]
            return normalized_tribes
        else:
            self._logger.warning("Expected list of tribes, got something else")
            return []

class EventLoader(DataLoader):
    """
    Specialized loader for event data with methods for loading
    individual events and batches
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the EventLoader

        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self._schema = EventSchema()
    
    def load_event(self, event_id: str) -> Dict[str, Any]:
        """
        Load an event by ID

        Args:
            event_id: ID of the event to load

        Returns:
            Event data
        """
        params = {'event_id': event_id}
        
        event_data = self.load('event', params)
        
        # Apply normalization
        normalized_data = normalize_event_data(event_data)
        
        return normalized_data
    
    async def async_load_event(self, event_id: str) -> Dict[str, Any]:
        """
        Asynchronously load an event by ID

        Args:
            event_id: ID of the event to load

        Returns:
            Event data
        """
        params = {'event_id': event_id}
        
        event_data = await self.async_load('event', params)
        
        # Apply normalization
        normalized_data = normalize_event_data(event_data)
        
        return normalized_data
    
    async def load_events(self, event_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Load multiple events by ID

        Args:
            event_ids: List of event IDs to load

        Returns:
            List of event data
        """
        param_list = [{'event_id': eid} for eid in event_ids]
        
        events = await self.batch_load('event', param_list)
        
        # Apply normalization to each event
        normalized_events = [
            normalize_event_data(event) if event else None
            for event in events
        ]
        
        return normalized_events
    
    def load_events_by_criteria(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Load events matching specified criteria

        Args:
            criteria: Criteria for filtering events

        Returns:
            List of matching event data
        """
        events_data = self.load('events_search', criteria)
        
        # Apply normalization to each event
        if isinstance(events_data, list):
            normalized_events = [
                normalize_event_data(event)
                for event in events_data
            ]
            return normalized_events
        else:
            self._logger.warning("Expected list of events, got something else")
            return []
    
    def load_tribe_events(self, tribe_id: str) -> List[Dict[str, Any]]:
        """
        Load all events for a specific tribe

        Args:
            tribe_id: ID of the tribe

        Returns:
            List of event data
        """
        params = {'tribe_id': tribe_id}
        
        events_data = self.load('tribe_events', params)
        
        # Apply normalization to each event
        if isinstance(events_data, list):
            normalized_events = [
                normalize_event_data(event)
                for event in events_data
            ]
            return normalized_events
        else:
            self._logger.warning("Expected list of events, got something else")
            return []
    
    def load_local_events(self, location: Dict[str, Any], radius: float) -> List[Dict[str, Any]]:
        """
        Load events near a specific location

        Args:
            location: Location dictionary with latitude and longitude
            radius: Radius in miles to search within

        Returns:
            List of event data
        """
        params = {
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude'),
            'radius': radius
        }
        
        events_data = self.load('local_events', params)
        
        # Apply normalization to each event
        if isinstance(events_data, list):
            normalized_events = [
                normalize_event_data(event)
                for event in events_data
            ]
            return normalized_events
        else:
            self._logger.warning("Expected list of events, got something else")
            return []

class WeatherLoader(DataLoader):
    """
    Specialized loader for weather data with methods for loading
    current and forecast weather
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the WeatherLoader

        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
    
    def load_current_weather(self, location: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load current weather for a location

        Args:
            location: Location dictionary with latitude and longitude

        Returns:
            Current weather data
        """
        params = {
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude')
        }
        
        weather_data = self.load('current_weather', params)
        
        return weather_data
    
    def load_weather_forecast(self, location: Dict[str, Any], days: int = 7) -> List[Dict[str, Any]]:
        """
        Load weather forecast for a location

        Args:
            location: Location dictionary with latitude and longitude
            days: Number of days for the forecast

        Returns:
            Weather forecast data
        """
        params = {
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude'),
            'days': days
        }
        
        forecast_data = self.load('weather_forecast', params)
        
        return forecast_data
    
    async def async_load_weather_forecast(self, location: Dict[str, Any], days: int = 7) -> List[Dict[str, Any]]:
        """
        Asynchronously load weather forecast for a location

        Args:
            location: Location dictionary with latitude and longitude
            days: Number of days for the forecast

        Returns:
            Weather forecast data
        """
        params = {
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude'),
            'days': days
        }
        
        forecast_data = await self.async_load('weather_forecast', params)
        
        return forecast_data

class PromptLoader(DataLoader):
    """
    Specialized loader for AI prompt templates with methods for loading
    and customizing prompts
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the PromptLoader

        Args:
            config: Configuration dictionary
        """
        super().__init__(config)
        self._schema = PromptSchema()
    
    def load_prompt_template(self, template_name: str) -> Dict[str, Any]:
        """
        Load a prompt template by name

        Args:
            template_name: Name of the template to load

        Returns:
            Prompt template data
        """
        params = {'template_name': template_name}
        
        template_data = self.load('prompt_template', params)
        
        return template_data
    
    def load_prompt_templates_by_category(self, category: str) -> List[Dict[str, Any]]:
        """
        Load prompt templates by category

        Args:
            category: Category of templates to load

        Returns:
            List of prompt template data
        """
        params = {'category': category}
        
        templates_data = self.load('prompt_templates_by_category', params)
        
        # Ensure we have a list of templates
        if isinstance(templates_data, list):
            return templates_data
        else:
            self._logger.warning("Expected list of prompt templates, got something else")
            return []