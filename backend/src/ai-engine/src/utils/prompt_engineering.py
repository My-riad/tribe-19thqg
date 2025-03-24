import logging
import json
import re
from typing import Dict, List, Any, Union, Optional, Tuple
import string

from ..config.settings import (
    MODEL_CONFIGS,
    MATCHING_CONFIG,
    PERSONALITY_CONFIG,
    ENGAGEMENT_CONFIG,
    RECOMMENDATION_CONFIG
)
from .data_preprocessing import clean_text_data

# Set up logger
logger = logging.getLogger(__name__)

# Define prompt templates for different use cases
PROMPT_TEMPLATES = {
    'matching': {
        'user_tribe': 'You are an AI matchmaker for a social platform called Tribe. Your task is to analyze a user profile and determine compatibility with potential tribes based on personality traits, interests, and communication styles.\n\nUser Profile:\n{user_profile}\n\nPotential Tribes:\n{tribes}\n\nAnalyze the compatibility between the user and each tribe. Consider personality balance, shared interests, and communication style compatibility. Provide a compatibility score (0-100) for each tribe and explain your reasoning.\n\nFormat your response as a JSON array with objects containing tribeId, compatibilityScore, and compatibilityReasoning.\n\nResponse:',
        'tribe_formation': 'You are an AI matchmaker for a social platform called Tribe. Your task is to form balanced and compatible tribes from a pool of users based on their personality traits, interests, and communication styles.\n\nUser Profiles:\n{user_profiles}\n\nRequirements:\n- Each tribe should have between {min_tribe_size} and {max_tribe_size} members\n- Tribes should be psychologically balanced with complementary personality traits\n- Members should have some shared interests but also bring diversity\n- Communication styles should be compatible\n\nForm tribes that maximize overall compatibility and engagement potential. For each tribe, provide a list of member IDs, an overall compatibility score (0-100), and a brief explanation of why these members would work well together.\n\nFormat your response as a JSON array of tribe objects, each containing memberId array, compatibilityScore, and formationReasoning.\n\nResponse:',
        'compatibility': 'You are an AI matchmaker for a social platform called Tribe. Your task is to analyze the compatibility between a user and another user or tribe.\n\nUser Profile:\n{user_profile}\n\nTarget ({target_type}):\n{target}\n\nAnalyze the compatibility between the user and the target based on the following dimensions:\n1. Personality Compatibility: How well their personality traits complement each other\n2. Interest Overlap: Shared interests and activities\n3. Communication Style: Compatibility in how they communicate and interact\n4. Values Alignment: Shared values and priorities\n\nFor each dimension, provide a compatibility score (0-100) and a brief explanation. Then provide an overall compatibility score and summary.\n\nFormat your response as a JSON object with dimensions (containing score and reasoning for each) and overall (containing score and summary).\n\nResponse:'
    },
    'personality': {
        'assessment': 'You are an AI personality analyst for a social platform called Tribe. Your task is to analyze assessment responses and generate a comprehensive personality profile.\n\nAssessment Data:\n{assessment_data}\n\nAnalyze the responses to identify the following:\n1. Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) with scores (0-100)\n2. Communication style (Direct, Analytical, Intuitive, Functional)\n3. Social preferences (Group size, activity types, social energy)\n4. Key strengths and potential growth areas in social settings\n\nProvide a comprehensive personality profile that would be useful for matching this person with compatible groups.\n\nFormat your response as a JSON object with traits, communicationStyle, socialPreferences, and insights sections.\n\nResponse:',
        'communication_style': 'You are an AI communication analyst for a social platform called Tribe. Your task is to analyze interaction data and identify the user\'s communication style.\n\nInteraction Data:\n{interaction_data}\n\nAnalyze the data to identify the following aspects of communication style:\n1. Directness (Direct vs. Indirect)\n2. Information Processing (Analytical vs. Intuitive)\n3. Expression Style (Expressive vs. Reserved)\n4. Conflict Approach (Accommodating vs. Confrontational)\n\nFor each aspect, provide a score (0-100) indicating where they fall on the spectrum and a brief explanation based on the evidence.\n\nFormat your response as a JSON object with each aspect containing a score and explanation.\n\nResponse:',
        'interests': 'You are an AI interest analyst for a social platform called Tribe. Your task is to analyze a user\'s profile data and categorize their interests.\n\nProfile Data:\n{profile_data}\n\nAnalyze the data to identify and categorize the user\'s interests into the following categories:\n- Outdoor Activities\n- Arts & Culture\n- Food & Dining\n- Sports & Fitness\n- Games & Entertainment\n- Learning & Education\n- Technology\n- Wellness & Mindfulness\n\nFor each category, provide a relevance score (0-100) and list specific interests within that category.\n\nFormat your response as a JSON object with categories as keys, each containing a score and interests array.\n\nResponse:'
    },
    'engagement': {
        'prompts': 'You are an AI engagement specialist for a social platform called Tribe. Your task is to generate conversation prompts for a tribe based on their profiles and interaction history.\n\nTribe Data:\n{tribe_data}\n\nGenerate {count} engaging conversation prompts of type "{prompt_type}" that will spark meaningful interaction among tribe members. Consider their shared interests, personality traits, and previous interactions.\n\nEach prompt should be specific to this tribe\'s composition and interests, not generic. Aim to deepen connections and encourage participation from all members, especially those who may be more reserved.\n\nFormat your response as a JSON array of prompt objects, each with a prompt text and a brief explanation of why this prompt would work well for this tribe.\n\nResponse:',
        'challenges': 'You are an AI engagement specialist for a social platform called Tribe. Your task is to generate a group challenge for a tribe based on their profiles and shared interests.\n\nTribe Data:\n{tribe_data}\n\nGenerate an engaging group challenge of type "{challenge_type}" that tribe members can participate in together. The challenge should:\n1. Be accessible to all members regardless of personality type\n2. Incorporate shared interests identified in their profiles\n3. Encourage meaningful interaction and bonding\n4. Be specific to this tribe\'s unique composition, not generic\n\nProvide a title, detailed description, suggested timeframe, and expected outcomes for the challenge.\n\nFormat your response as a JSON object with title, description, timeframe, expectedOutcomes, and personalizedReasoning fields.\n\nResponse:',
        'activities': 'You are an AI activity specialist for a social platform called Tribe. Your task is to suggest activities for a tribe based on their profiles and shared interests.\n\nTribe Data:\n{tribe_data}\n\nSuggest {count} engaging activities of type "{activity_type}" that this tribe could do together. Consider their shared interests, personality composition, and group dynamics.\n\nEach activity should:\n1. Appeal to the specific interests and preferences of this tribe\n2. Be accessible to all members\n3. Encourage meaningful interaction and connection\n4. Be specific and actionable, not generic\n\nFormat your response as a JSON array of activity objects, each with a title, description, and personalizationReason explaining why this activity suits this specific tribe.\n\nResponse:'
    },
    'recommendation': {
        'events': 'You are an AI event specialist for a social platform called Tribe. Your task is to recommend local events for a tribe based on their profiles and shared interests.\n\nTribe Data:\n{tribe_data}\n\nLocation: {location}\nDate Range: {date_range}\n\nRecommend {count} events in the specified location and date range that would appeal to this tribe based on their shared interests and group composition. Consider the mix of personality types and preferences when making recommendations.\n\nFor each event, provide a title, description, date/time, venue, estimated cost, and explanation of why it would be a good fit for this specific tribe.\n\nFormat your response as a JSON array of event objects with appropriate fields and a matchReason explaining the personalized recommendation.\n\nResponse:',
        'weather_activities': 'You are an AI activity specialist for a social platform called Tribe. Your task is to recommend weather-appropriate activities for a tribe based on their profiles and current weather conditions.\n\nTribe Data:\n{tribe_data}\n\nLocation: {location}\nWeather Conditions: {weather_data}\n\nRecommend {count} activities that are appropriate for the current weather conditions and would appeal to this tribe based on their shared interests and group composition.\n\nFor each activity, provide a title, description, whether it\'s indoor or outdoor, estimated cost, and explanation of why it suits both the weather conditions and this specific tribe\'s preferences.\n\nFormat your response as a JSON array of activity objects with appropriate fields and a weatherAppropriateReason explaining why it works for these conditions.\n\nResponse:',
        'budget_options': 'You are an AI budget specialist for a social platform called Tribe. Your task is to recommend budget-friendly options for a tribe based on their profiles and specified budget.\n\nTribe Data:\n{tribe_data}\n\nLocation: {location}\nBudget: ${budget} total\n\nRecommend {count} budget-friendly activities or events in the specified location that would appeal to this tribe based on their shared interests and stay within the specified budget.\n\nFor each option, provide a title, description, estimated cost per person, total cost for the tribe, and explanation of why it would be a good fit for this specific tribe while being budget-conscious.\n\nFormat your response as a JSON array of option objects with appropriate fields and a budgetJustification explaining how it provides value within the constraints.\n\nResponse:'
    }
}

# Define model-specific instructions for optimal prompting
MODEL_SPECIFIC_INSTRUCTIONS = {
    'openai/gpt-4': {
        'instruction_format': 'concise and precise',
        'output_format_emphasis': 'high',
        'system_message': 'You are an AI assistant for the Tribe platform, providing structured responses for social matchmaking and engagement. Always respond in the exact JSON format requested.'
    },
    'openai/gpt-3.5-turbo': {
        'instruction_format': 'detailed and explicit',
        'output_format_emphasis': 'very high',
        'system_message': 'You are an AI assistant for the Tribe platform. Your responses MUST be in valid JSON format exactly as specified. Focus on providing accurate, structured data for social matchmaking and engagement.'
    },
    'anthropic/claude-2': {
        'instruction_format': 'conversational but structured',
        'output_format_emphasis': 'high',
        'system_message': 'You are Claude, an AI assistant for the Tribe platform. Please provide helpful, structured responses for social matchmaking and engagement. Always use the exact JSON format requested.'
    },
    'anthropic/claude-instant-1': {
        'instruction_format': 'very explicit and detailed',
        'output_format_emphasis': 'extremely high',
        'system_message': 'You are Claude, an AI assistant for the Tribe platform. You MUST respond in valid JSON format exactly as specified. Focus on providing accurate, structured data for social matchmaking and engagement.'
    }
}

# Define prompt categories
PROMPT_CATEGORIES = ['matching', 'personality', 'engagement', 'recommendation']


def optimize_prompt_for_model(prompt: str, model_name: str) -> str:
    """
    Optimize a prompt for a specific AI model based on its characteristics and requirements.
    
    Args:
        prompt: The original prompt text
        model_name: The name of the AI model to optimize for
        
    Returns:
        Optimized prompt text for the specified model
    """
    # Clean the prompt text
    cleaned_prompt = clean_text_data(prompt)
    
    # Get model-specific instructions
    model_instructions = MODEL_SPECIFIC_INSTRUCTIONS.get(
        model_name, 
        MODEL_SPECIFIC_INSTRUCTIONS.get('openai/gpt-4')  # Default to GPT-4 if model not found
    )
    
    # Adjust prompt based on model's instruction format preference
    instruction_format = model_instructions.get('instruction_format')
    if instruction_format == 'detailed and explicit':
        # Make instructions more explicit
        cleaned_prompt = cleaned_prompt.replace(
            "Format your response as", 
            "IMPORTANT: You MUST format your response EXACTLY as"
        )
    elif instruction_format == 'very explicit and detailed':
        # Make instructions very explicit with emphasis
        cleaned_prompt = cleaned_prompt.replace(
            "Format your response as", 
            "CRITICAL INSTRUCTION: You MUST format your response EXACTLY as"
        )
    
    # Emphasize output format requirements based on model's needs
    output_emphasis = model_instructions.get('output_format_emphasis')
    if output_emphasis == 'high':
        if 'JSON' in cleaned_prompt:
            cleaned_prompt += "\n\nEnsure your response is valid JSON and follows the exact format specified above."
    elif output_emphasis == 'very high':
        if 'JSON' in cleaned_prompt:
            cleaned_prompt += "\n\nCRITICAL: Your response MUST be valid JSON following the EXACT format specified above. Do not include any explanation or text outside the JSON structure."
    elif output_emphasis == 'extremely high':
        if 'JSON' in cleaned_prompt:
            cleaned_prompt += "\n\nCRITICAL: Your response MUST be valid JSON following the EXACT format specified above. DO NOT include ANY explanation, markdown formatting, or text outside the JSON structure. ONLY respond with the JSON."
    
    # Add model-specific system message if applicable
    if 'system_message' in model_instructions:
        # For models that support system messages, we would include this in the API call
        # This is handled by the model calling code, but we note it here
        pass
    
    return cleaned_prompt


def get_prompt_template(category: str, prompt_type: str) -> str:
    """
    Get a prompt template for a specific category and type.
    
    Args:
        category: The prompt category (matching, personality, engagement, recommendation)
        prompt_type: The specific type of prompt within the category
        
    Returns:
        The prompt template string
        
    Raises:
        ValueError: If the category or prompt type doesn't exist
    """
    # Validate the category
    if category not in PROMPT_CATEGORIES:
        raise ValueError(f"Invalid prompt category: {category}. Must be one of: {', '.join(PROMPT_CATEGORIES)}")
    
    # Get templates for the category
    category_templates = PROMPT_TEMPLATES.get(category, {})
    
    # Check if prompt type exists
    if prompt_type not in category_templates:
        raise ValueError(f"Invalid prompt type '{prompt_type}' for category '{category}'. Available types: {', '.join(category_templates.keys())}")
    
    return category_templates[prompt_type]


def format_prompt(template: str, data: Dict[str, Any]) -> str:
    """
    Format a prompt template with provided data.
    
    Args:
        template: The prompt template string with placeholders
        data: Dictionary containing values for the placeholders
        
    Returns:
        Formatted prompt string
    """
    try:
        # Use string.format() to replace placeholders with data
        formatted = template.format(**data)
        
        # Clean the formatted prompt
        cleaned = clean_text_data(formatted)
        
        return cleaned
    except KeyError as e:
        # Handle missing data gracefully
        logger.warning(f"Missing data for prompt template: {e}")
        # Try to format with available data, using empty strings for missing values
        for key in re.findall(r'\{([^{}]*)\}', template):
            if key not in data:
                data[key] = ""
        
        return clean_text_data(template.format(**data))
    except Exception as e:
        logger.error(f"Error formatting prompt template: {e}")
        return template  # Return the original template if formatting fails


def get_matching_prompt(matching_type: str, data: Dict[str, Any], options: Dict[str, Any] = None) -> str:
    """
    Generate a prompt for matchmaking operations.
    
    Args:
        matching_type: Type of matching operation (user_tribe, tribe_formation, compatibility)
        data: Data to include in the prompt
        options: Additional options for prompt generation
        
    Returns:
        Formatted matching prompt
    """
    if options is None:
        options = {}
    
    # Get the appropriate template
    template = get_prompt_template('matching', matching_type)
    
    # Prepare data for template formatting based on matching type
    prompt_data = {}
    
    if matching_type == 'user_tribe':
        # Format user profile and tribes data
        if 'user_profile' in data:
            prompt_data['user_profile'] = json.dumps(data['user_profile'], indent=2)
        if 'tribes' in data:
            prompt_data['tribes'] = json.dumps(data['tribes'], indent=2)
    
    elif matching_type == 'tribe_formation':
        # Format user profiles and tribe size requirements
        if 'user_profiles' in data:
            prompt_data['user_profiles'] = json.dumps(data['user_profiles'], indent=2)
        
        # Set min and max tribe sizes from options or defaults
        prompt_data['min_tribe_size'] = options.get('min_tribe_size', MATCHING_CONFIG['min_tribe_size'])
        prompt_data['max_tribe_size'] = options.get('max_tribe_size', MATCHING_CONFIG['max_tribe_size'])
    
    elif matching_type == 'compatibility':
        # Format user profile and target data
        if 'user_profile' in data:
            prompt_data['user_profile'] = json.dumps(data['user_profile'], indent=2)
        if 'target' in data:
            prompt_data['target'] = json.dumps(data['target'], indent=2)
        
        # Set target type (user or tribe)
        prompt_data['target_type'] = options.get('target_type', 'user')
    
    # Update with any additional data provided
    prompt_data.update({k: v for k, v in data.items() if k not in prompt_data})
    
    # Format the template with the prepared data
    return format_prompt(template, prompt_data)


def get_personality_prompt(analysis_type: str, data: Dict[str, Any]) -> str:
    """
    Generate a prompt for personality analysis operations.
    
    Args:
        analysis_type: Type of personality analysis (assessment, communication_style, interests)
        data: Data to include in the prompt
        
    Returns:
        Formatted personality analysis prompt
    """
    # Get the appropriate template
    template = get_prompt_template('personality', analysis_type)
    
    # Prepare data for template formatting based on analysis type
    prompt_data = {}
    
    if analysis_type == 'assessment':
        # Format assessment data
        if 'assessment_data' in data:
            prompt_data['assessment_data'] = json.dumps(data['assessment_data'], indent=2)
    
    elif analysis_type == 'communication_style':
        # Format interaction data
        if 'interaction_data' in data:
            prompt_data['interaction_data'] = json.dumps(data['interaction_data'], indent=2)
    
    elif analysis_type == 'interests':
        # Format profile data
        if 'profile_data' in data:
            prompt_data['profile_data'] = json.dumps(data['profile_data'], indent=2)
    
    # Update with any additional data provided
    prompt_data.update({k: v for k, v in data.items() if k not in prompt_data})
    
    # Format the template with the prepared data
    return format_prompt(template, prompt_data)


def get_engagement_prompt(engagement_type: str, tribe_data: Dict[str, Any], options: Dict[str, Any] = None) -> str:
    """
    Generate a prompt for engagement generation operations.
    
    Args:
        engagement_type: Type of engagement (prompts, challenges, activities)
        tribe_data: Tribe data to include in the prompt
        options: Additional options for prompt generation
        
    Returns:
        Formatted engagement prompt
    """
    if options is None:
        options = {}
    
    # Get the appropriate template
    template = get_prompt_template('engagement', engagement_type)
    
    # Prepare data for template formatting
    prompt_data = {
        'tribe_data': json.dumps(tribe_data, indent=2)
    }
    
    if engagement_type == 'prompts':
        # Add prompt type and count
        prompt_data['prompt_type'] = options.get('prompt_type', 'conversation')
        prompt_data['count'] = options.get('count', 3)
    
    elif engagement_type == 'challenges':
        # Add challenge type
        prompt_data['challenge_type'] = options.get('challenge_type', 'social')
    
    elif engagement_type == 'activities':
        # Add activity type and count
        prompt_data['activity_type'] = options.get('activity_type', 'indoor')
        prompt_data['count'] = options.get('count', 3)
    
    # Update with any additional options provided
    prompt_data.update({k: v for k, v in options.items() if k not in prompt_data})
    
    # Format the template with the prepared data
    return format_prompt(template, prompt_data)


def get_recommendation_prompt(recommendation_type: str, tribe_data: Dict[str, Any], options: Dict[str, Any] = None) -> str:
    """
    Generate a prompt for recommendation operations.
    
    Args:
        recommendation_type: Type of recommendation (events, weather_activities, budget_options)
        tribe_data: Tribe data to include in the prompt
        options: Additional options for prompt generation
        
    Returns:
        Formatted recommendation prompt
    """
    if options is None:
        options = {}
    
    # Get the appropriate template
    template = get_prompt_template('recommendation', recommendation_type)
    
    # Prepare data for template formatting
    prompt_data = {
        'tribe_data': json.dumps(tribe_data, indent=2)
    }
    
    if recommendation_type == 'events':
        # Add location, date range, and count
        prompt_data['location'] = options.get('location', 'Seattle, WA')
        prompt_data['date_range'] = options.get('date_range', 'next 7 days')
        prompt_data['count'] = options.get('count', 3)
    
    elif recommendation_type == 'weather_activities':
        # Add location, weather data, and count
        prompt_data['location'] = options.get('location', 'Seattle, WA')
        prompt_data['weather_data'] = json.dumps(options.get('weather_data', {}), indent=2)
        prompt_data['count'] = options.get('count', 3)
    
    elif recommendation_type == 'budget_options':
        # Add location, budget, and count
        prompt_data['location'] = options.get('location', 'Seattle, WA')
        prompt_data['budget'] = options.get('budget', 100)
        prompt_data['count'] = options.get('count', 3)
    
    # Update with any additional options provided
    prompt_data.update({k: v for k, v in options.items() if k not in prompt_data})
    
    # Format the template with the prepared data
    return format_prompt(template, prompt_data)


def extract_json_from_response(response: str) -> Dict[str, Any]:
    """
    Extract JSON data from an AI model response.
    
    Args:
        response: The raw response text from the AI model
        
    Returns:
        Extracted JSON data as a Python dictionary or list
    """
    # Clean the response text
    cleaned_response = clean_text_data(response)
    
    # Try to find JSON content within code blocks or at the end of the response
    json_pattern = r'```(?:json)?\s*([\s\S]*?)```|(\{[\s\S]*\}|\[[\s\S]*\])'
    matches = re.findall(json_pattern, cleaned_response)
    
    # Extract the JSON string from the matches
    json_str = None
    for match in matches:
        # Each match is a tuple of capture groups
        for group in match:
            if group and (group.strip().startswith('{') or group.strip().startswith('[')):
                json_str = group.strip()
                break
        if json_str:
            break
    
    # If no match found in code blocks, try to extract JSON directly
    if not json_str:
        try:
            # Look for JSON objects or arrays directly
            start_idx = cleaned_response.find('{') if '{' in cleaned_response else cleaned_response.find('[')
            end_idx = cleaned_response.rfind('}') if '}' in cleaned_response else cleaned_response.rfind(']')
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = cleaned_response[start_idx:end_idx+1]
        except Exception as e:
            logger.warning(f"Failed to extract JSON directly from response: {e}")
    
    # Parse the JSON string
    if json_str:
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse extracted JSON: {e}")
    
    logger.warning(f"Could not extract valid JSON from response")
    return {}  # Return empty dict if extraction fails


def validate_prompt_response(response: str, expected_format: str, required_fields: List[str]) -> bool:
    """
    Validate that an AI response matches the expected format and contains required fields.
    
    Args:
        response: The raw response text from the AI model
        expected_format: The expected format ('object' or 'array')
        required_fields: List of field names that must be present in the response
        
    Returns:
        True if the response is valid, False otherwise
    """
    # Extract JSON from the response
    data = extract_json_from_response(response)
    
    # Check if data is empty
    if not data:
        logger.warning("Response validation failed: No valid JSON extracted")
        return False
    
    # Check if the data matches the expected format
    if expected_format == 'object' and not isinstance(data, dict):
        logger.warning(f"Response validation failed: Expected object, got {type(data)}")
        return False
    
    if expected_format == 'array' and not isinstance(data, list):
        logger.warning(f"Response validation failed: Expected array, got {type(data)}")
        return False
    
    # For array format, check the first item
    if expected_format == 'array' and data:
        if not isinstance(data[0], dict):
            logger.warning(f"Response validation failed: Expected array of objects")
            return False
        
        data = data[0]  # Use the first item for field validation
    
    # Check for required fields
    for field in required_fields:
        if field not in data:
            logger.warning(f"Response validation failed: Missing required field '{field}'")
            return False
    
    return True


class PromptTemplate:
    """
    Class representing a prompt template with placeholders for dynamic content.
    """
    
    def __init__(self, template: str, category: str, prompt_type: str, 
                 required_placeholders: List[str] = None, default_values: Dict[str, Any] = None):
        """
        Initialize a prompt template with template text and metadata.
        
        Args:
            template: The template text with placeholders
            category: The category of the prompt (matching, personality, etc.)
            prompt_type: The specific type within the category
            required_placeholders: List of placeholders that must be provided
            default_values: Default values for optional placeholders
        """
        self._template = template
        self._category = category
        self._type = prompt_type
        self._required_placeholders = required_placeholders or []
        self._default_values = default_values or {}
        
        # Validate the template format and placeholders
        self._validate_template()
    
    def _validate_template(self):
        """Validate the template format and extract placeholders."""
        # Extract all placeholders from the template
        placeholders = self.extract_placeholders()
        
        # Check that required placeholders are in the template
        missing = [p for p in self._required_placeholders if p not in placeholders]
        if missing:
            raise ValueError(f"Required placeholders {missing} not found in template")
    
    def format(self, data: Dict[str, Any]) -> str:
        """
        Format the template with provided data.
        
        Args:
            data: Dictionary containing values for the placeholders
            
        Returns:
            Formatted prompt string
            
        Raises:
            ValueError: If required placeholders are missing from data
        """
        # Validate that all required placeholders are available
        if not self.validate_data(data):
            missing = self.get_missing_placeholders(data)
            raise ValueError(f"Missing required placeholders: {missing}")
        
        # Merge data with default values, with data taking precedence
        format_data = {**self._default_values, **data}
        
        # Format the template
        try:
            formatted = self._template.format(**format_data)
            
            # Clean the formatted prompt
            cleaned = clean_text_data(formatted)
            
            return cleaned
        except KeyError as e:
            # This shouldn't happen since we validated the data
            logger.error(f"Unexpected KeyError while formatting template: {e}")
            raise
    
    def validate_data(self, data: Dict[str, Any]) -> bool:
        """
        Validate that data contains all required placeholders.
        
        Args:
            data: Dictionary containing values for the placeholders
            
        Returns:
            True if all required placeholders are available, False otherwise
        """
        # Check that all required placeholders are in data or default values
        for placeholder in self._required_placeholders:
            if placeholder not in data and placeholder not in self._default_values:
                return False
        
        return True
    
    def get_missing_placeholders(self, data: Dict[str, Any]) -> List[str]:
        """
        Get list of required placeholders missing from data.
        
        Args:
            data: Dictionary containing values for the placeholders
            
        Returns:
            List of missing placeholders
        """
        missing = []
        for placeholder in self._required_placeholders:
            if placeholder not in data and placeholder not in self._default_values:
                missing.append(placeholder)
        
        return missing
    
    def extract_placeholders(self) -> List[str]:
        """
        Extract all placeholders from the template.
        
        Returns:
            List of placeholder names
        """
        # Use regex to find all {placeholder} patterns
        placeholder_pattern = r'\{([^{}]*)\}'
        matches = re.findall(placeholder_pattern, self._template)
        
        # Remove format specifications like {placeholder:s}
        placeholders = [m.split(':')[0] for m in matches]
        
        return list(set(placeholders))  # Return unique placeholders


class PromptLibrary:
    """
    Class for managing a collection of prompt templates.
    """
    
    def __init__(self):
        """Initialize the prompt library with default templates."""
        # Initialize templates dictionary
        self._templates = {category: {} for category in PROMPT_CATEGORIES}
        
        # Load default templates
        for category, types in PROMPT_TEMPLATES.items():
            for prompt_type, template_text in types.items():
                template = PromptTemplate(
                    template=template_text,
                    category=category,
                    prompt_type=prompt_type
                )
                self._templates[category][prompt_type] = template
        
        # Initialize default values
        self._default_values = {category: {} for category in PROMPT_CATEGORIES}
        
        logger.debug("Prompt library initialized with default templates")
    
    def get_template(self, category: str, prompt_type: str) -> PromptTemplate:
        """
        Get a prompt template by category and type.
        
        Args:
            category: The prompt category
            prompt_type: The specific type within the category
            
        Returns:
            PromptTemplate object
            
        Raises:
            ValueError: If the category or prompt type doesn't exist
        """
        if category not in self._templates:
            raise ValueError(f"Invalid prompt category: {category}")
        
        if prompt_type not in self._templates[category]:
            raise ValueError(f"Invalid prompt type '{prompt_type}' for category '{category}'")
        
        return self._templates[category][prompt_type]
    
    def add_template(self, template: PromptTemplate) -> None:
        """
        Add a new prompt template to the library.
        
        Args:
            template: PromptTemplate object to add
        """
        category = template._category
        prompt_type = template._type
        
        if category not in self._templates:
            self._templates[category] = {}
        
        self._templates[category][prompt_type] = template
        logger.info(f"Added template: {category}/{prompt_type}")
    
    def remove_template(self, category: str, prompt_type: str) -> bool:
        """
        Remove a prompt template from the library.
        
        Args:
            category: The prompt category
            prompt_type: The specific type within the category
            
        Returns:
            True if the template was removed, False if not found
        """
        if category not in self._templates:
            return False
        
        if prompt_type not in self._templates[category]:
            return False
        
        del self._templates[category][prompt_type]
        logger.info(f"Removed template: {category}/{prompt_type}")
        return True
    
    def set_default_values(self, category: str, prompt_type: str, default_values: Dict[str, Any]) -> None:
        """
        Set default values for template placeholders.
        
        Args:
            category: The prompt category
            prompt_type: The specific type within the category
            default_values: Dictionary of default values
        """
        if category not in self._default_values:
            self._default_values[category] = {}
        
        if prompt_type not in self._default_values[category]:
            self._default_values[category][prompt_type] = {}
        
        self._default_values[category][prompt_type].update(default_values)
        logger.info(f"Updated default values for {category}/{prompt_type}")
    
    def format_prompt(self, category: str, prompt_type: str, data: Dict[str, Any]) -> str:
        """
        Format a prompt template with provided data.
        
        Args:
            category: The prompt category
            prompt_type: The specific type within the category
            data: Data to include in the prompt
            
        Returns:
            Formatted prompt string
        """
        # Get the template
        template = self.get_template(category, prompt_type)
        
        # Get default values for this template
        default_values = {}
        if category in self._default_values and prompt_type in self._default_values[category]:
            default_values = self._default_values[category][prompt_type]
        
        # Merge default values with provided data
        merged_data = {**default_values, **data}
        
        # Format the template
        return template.format(merged_data)


class MatchingPromptGenerator:
    """
    Specialized class for generating prompts for matchmaking operations.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the matching prompt generator.
        
        Args:
            config: Configuration for the generator (optional)
        """
        self._prompt_library = PromptLibrary()
        self._matching_config = config.get('matching_config', MATCHING_CONFIG) if config else MATCHING_CONFIG
        
        logger.debug("MatchingPromptGenerator initialized")
    
    def generate_user_tribe_matching_prompt(self, user_profile: Dict[str, Any], tribes: List[Dict[str, Any]]) -> str:
        """
        Generate a prompt for matching a user to tribes.
        
        Args:
            user_profile: User profile data
            tribes: List of tribe data
            
        Returns:
            Formatted prompt for user-tribe matching
        """
        # Format the data as JSON strings
        data = {
            'user_profile': json.dumps(user_profile, indent=2),
            'tribes': json.dumps(tribes, indent=2)
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('matching', 'user_tribe', data)
    
    def generate_tribe_formation_prompt(self, user_profiles: List[Dict[str, Any]], 
                                        min_tribe_size: int = None, max_tribe_size: int = None) -> str:
        """
        Generate a prompt for forming tribes from user profiles.
        
        Args:
            user_profiles: List of user profile data
            min_tribe_size: Minimum tribe size (default from config)
            max_tribe_size: Maximum tribe size (default from config)
            
        Returns:
            Formatted prompt for tribe formation
        """
        # Use configuration defaults if not provided
        if min_tribe_size is None:
            min_tribe_size = self._matching_config['min_tribe_size']
        
        if max_tribe_size is None:
            max_tribe_size = self._matching_config['max_tribe_size']
        
        # Format the data
        data = {
            'user_profiles': json.dumps(user_profiles, indent=2),
            'min_tribe_size': min_tribe_size,
            'max_tribe_size': max_tribe_size
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('matching', 'tribe_formation', data)
    
    def generate_compatibility_analysis_prompt(self, user_profile: Dict[str, Any], 
                                               target: Dict[str, Any], target_type: str = None) -> str:
        """
        Generate a prompt for analyzing compatibility between user and target.
        
        Args:
            user_profile: User profile data
            target: Target profile data (user or tribe)
            target_type: Type of target ('user' or 'tribe')
            
        Returns:
            Formatted prompt for compatibility analysis
        """
        # Default to 'user' if not specified
        if target_type is None:
            target_type = 'user' if 'personalityTraits' in target else 'tribe'
        
        # Format the data
        data = {
            'user_profile': json.dumps(user_profile, indent=2),
            'target': json.dumps(target, indent=2),
            'target_type': target_type
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('matching', 'compatibility', data)


class PersonalityPromptGenerator:
    """
    Specialized class for generating prompts for personality analysis operations.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the personality prompt generator.
        
        Args:
            config: Configuration for the generator (optional)
        """
        self._prompt_library = PromptLibrary()
        self._personality_config = config.get('personality_config', PERSONALITY_CONFIG) if config else PERSONALITY_CONFIG
        
        logger.debug("PersonalityPromptGenerator initialized")
    
    def generate_assessment_prompt(self, assessment_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing personality assessment data.
        
        Args:
            assessment_data: Assessment response data
            
        Returns:
            Formatted prompt for personality assessment
        """
        # Format the data
        data = {
            'assessment_data': json.dumps(assessment_data, indent=2)
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('personality', 'assessment', data)
    
    def generate_communication_style_prompt(self, interaction_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing communication style.
        
        Args:
            interaction_data: User interaction data
            
        Returns:
            Formatted prompt for communication style analysis
        """
        # Format the data
        data = {
            'interaction_data': json.dumps(interaction_data, indent=2)
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('personality', 'communication_style', data)
    
    def generate_interests_analysis_prompt(self, profile_data: Dict[str, Any]) -> str:
        """
        Generate a prompt for analyzing and categorizing interests.
        
        Args:
            profile_data: User profile data
            
        Returns:
            Formatted prompt for interests analysis
        """
        # Format the data
        data = {
            'profile_data': json.dumps(profile_data, indent=2)
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('personality', 'interests', data)


class EngagementPromptGenerator:
    """
    Specialized class for generating prompts for engagement operations.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the engagement prompt generator.
        
        Args:
            config: Configuration for the generator (optional)
        """
        self._prompt_library = PromptLibrary()
        self._engagement_config = config.get('engagement_config', ENGAGEMENT_CONFIG) if config else ENGAGEMENT_CONFIG
        
        logger.debug("EngagementPromptGenerator initialized")
    
    def generate_conversation_prompts_prompt(self, tribe_data: Dict[str, Any], 
                                            prompt_type: str, count: int = 3) -> str:
        """
        Generate a prompt for creating conversation starters.
        
        Args:
            tribe_data: Tribe data including member profiles
            prompt_type: Type of conversation prompt
            count: Number of prompts to generate
            
        Returns:
            Formatted prompt for conversation prompts generation
        """
        # Validate prompt type
        if prompt_type not in self._engagement_config['prompt_types']:
            logger.warning(f"Invalid prompt type: {prompt_type}. Using 'conversation' instead.")
            prompt_type = 'conversation'
        
        # Format the data
        data = {
            'tribe_data': json.dumps(tribe_data, indent=2),
            'prompt_type': prompt_type,
            'count': count
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('engagement', 'prompts', data)
    
    def generate_group_challenge_prompt(self, tribe_data: Dict[str, Any], challenge_type: str) -> str:
        """
        Generate a prompt for creating a group challenge.
        
        Args:
            tribe_data: Tribe data including member profiles
            challenge_type: Type of challenge
            
        Returns:
            Formatted prompt for group challenge generation
        """
        # Validate challenge type
        if challenge_type not in self._engagement_config['challenge_types']:
            logger.warning(f"Invalid challenge type: {challenge_type}. Using 'social' instead.")
            challenge_type = 'social'
        
        # Format the data
        data = {
            'tribe_data': json.dumps(tribe_data, indent=2),
            'challenge_type': challenge_type
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('engagement', 'challenges', data)
    
    def generate_activity_suggestions_prompt(self, tribe_data: Dict[str, Any], 
                                            activity_type: str, count: int = 3) -> str:
        """
        Generate a prompt for suggesting activities.
        
        Args:
            tribe_data: Tribe data including member profiles
            activity_type: Type of activity
            count: Number of activities to suggest
            
        Returns:
            Formatted prompt for activity suggestions
        """
        # Validate activity type
        if activity_type not in self._engagement_config['activity_categories']:
            logger.warning(f"Invalid activity type: {activity_type}. Using 'indoor' instead.")
            activity_type = 'indoor'
        
        # Format the data
        data = {
            'tribe_data': json.dumps(tribe_data, indent=2),
            'activity_type': activity_type,
            'count': count
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('engagement', 'activities', data)


class RecommendationPromptGenerator:
    """
    Specialized class for generating prompts for recommendation operations.
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the recommendation prompt generator.
        
        Args:
            config: Configuration for the generator (optional)
        """
        self._prompt_library = PromptLibrary()
        self._recommendation_config = config.get('recommendation_config', RECOMMENDATION_CONFIG) if config else RECOMMENDATION_CONFIG
        
        logger.debug("RecommendationPromptGenerator initialized")
    
    def generate_event_recommendations_prompt(self, tribe_data: Dict[str, Any], 
                                             location: str, date_range: str, count: int = 3) -> str:
        """
        Generate a prompt for recommending events.
        
        Args:
            tribe_data: Tribe data including member profiles
            location: Location for event recommendations
            date_range: Date range for events
            count: Number of events to recommend
            
        Returns:
            Formatted prompt for event recommendations
        """
        # Format the data
        data = {
            'tribe_data': json.dumps(tribe_data, indent=2),
            'location': location,
            'date_range': date_range,
            'count': count
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('recommendation', 'events', data)
    
    def generate_weather_activities_prompt(self, tribe_data: Dict[str, Any], 
                                          location: str, weather_data: Dict[str, Any], count: int = 3) -> str:
        """
        Generate a prompt for recommending weather-appropriate activities.
        
        Args:
            tribe_data: Tribe data including member profiles
            location: Location for activity recommendations
            weather_data: Weather conditions data
            count: Number of activities to recommend
            
        Returns:
            Formatted prompt for weather-appropriate activities
        """
        # Format the data
        data = {
            'tribe_data': json.dumps(tribe_data, indent=2),
            'location': location,
            'weather_data': json.dumps(weather_data, indent=2),
            'count': count
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('recommendation', 'weather_activities', data)
    
    def generate_budget_options_prompt(self, tribe_data: Dict[str, Any], 
                                      location: str, budget: float, count: int = 3) -> str:
        """
        Generate a prompt for recommending budget-friendly options.
        
        Args:
            tribe_data: Tribe data including member profiles
            location: Location for activity recommendations
            budget: Total budget amount
            count: Number of options to recommend
            
        Returns:
            Formatted prompt for budget-friendly options
        """
        # Format the data
        data = {
            'tribe_data': json.dumps(tribe_data, indent=2),
            'location': location,
            'budget': budget,
            'count': count
        }
        
        # Get the formatted prompt
        return self._prompt_library.format_prompt('recommendation', 'budget_options', data)