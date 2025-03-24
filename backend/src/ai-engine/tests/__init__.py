import os
import json
from pathlib import Path

# Define path to test fixtures directory
FIXTURES_DIR = Path(__file__).parent / 'fixtures'

# Global dictionary to store loaded test data
TEST_DATA = {
    'user_profiles': [],
    'tribes': [],
    'events': [],
    'personality_assessments': [],
    'engagement_contexts': [],
    'weather_data': []
}

def load_test_data(fixture_name: str) -> dict:
    """
    Loads test data from JSON fixture files for use in tests.
    
    Args:
        fixture_name: Name of the fixture file without extension
    
    Returns:
        Loaded test data from the specified fixture
    """
    fixture_path = FIXTURES_DIR / f"{fixture_name}.json"
    
    if not fixture_path.exists():
        raise FileNotFoundError(f"Test fixture not found: {fixture_path}")
    
    with open(fixture_path, 'r') as f:
        data = json.load(f)
    
    return data

def create_test_user_profile(overrides: dict = None) -> dict:
    """
    Creates a test user profile with customizable attributes.
    
    Args:
        overrides: Dictionary of attributes to override in the base profile
    
    Returns:
        Test user profile with default values overridden by provided attributes
    """
    overrides = overrides or {}
    base_profile = load_test_data('user_profiles')[0]
    base_profile.update(overrides)
    return base_profile

def create_test_tribe(overrides: dict = None) -> dict:
    """
    Creates a test tribe with customizable attributes.
    
    Args:
        overrides: Dictionary of attributes to override in the base tribe
    
    Returns:
        Test tribe with default values overridden by provided attributes
    """
    overrides = overrides or {}
    base_tribe = load_test_data('tribes')[0]
    base_tribe.update(overrides)
    return base_tribe

def create_test_event(overrides: dict = None) -> dict:
    """
    Creates a test event with customizable attributes.
    
    Args:
        overrides: Dictionary of attributes to override in the base event
    
    Returns:
        Test event with default values overridden by provided attributes
    """
    overrides = overrides or {}
    base_event = load_test_data('events')[0]
    base_event.update(overrides)
    return base_event

def create_test_personality_assessment(overrides: dict = None) -> dict:
    """
    Creates a test personality assessment with customizable responses.
    
    Args:
        overrides: Dictionary of attributes to override in the base assessment
    
    Returns:
        Test personality assessment with default values overridden by provided responses
    """
    overrides = overrides or {}
    base_assessment = load_test_data('personality_assessments')[0]
    base_assessment.update(overrides)
    return base_assessment

def create_test_engagement_context(overrides: dict = None) -> dict:
    """
    Creates a test engagement context with customizable attributes.
    
    Args:
        overrides: Dictionary of attributes to override in the base context
    
    Returns:
        Test engagement context with default values overridden by provided attributes
    """
    overrides = overrides or {}
    base_context = load_test_data('engagement_contexts')[0]
    base_context.update(overrides)
    return base_context

def create_test_weather_data(overrides: dict = None) -> dict:
    """
    Creates test weather data with customizable attributes.
    
    Args:
        overrides: Dictionary of attributes to override in the base weather data
    
    Returns:
        Test weather data with default values overridden by provided attributes
    """
    overrides = overrides or {}
    base_weather = load_test_data('weather_data')[0]
    base_weather.update(overrides)
    return base_weather

def setup_test_data():
    """
    Initializes all test data by loading fixtures.
    """
    # Load all fixture files into TEST_DATA
    for category in TEST_DATA.keys():
        try:
            TEST_DATA[category] = load_test_data(category)
        except FileNotFoundError:
            # Create empty fixture if it doesn't exist
            print(f"Warning: No fixture found for {category}")

# Initialize test data when module is imported
setup_test_data()