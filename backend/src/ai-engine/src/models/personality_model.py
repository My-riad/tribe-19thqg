import logging
import json
from typing import Dict, List, Any, Optional
import asyncio

from ..adapters.model_adapter import create_model_adapter, ModelAdapter
from ..config.settings import PERSONALITY_CONFIG, DEFAULT_MODEL, MODEL_CONFIGS
from ..utils.data_preprocessing import normalize_profile_data, clean_text_data
from ..utils.prompt_engineering import get_personality_prompt, PersonalityPromptGenerator, extract_json_from_response

# Set up logger
logger = logging.getLogger(__name__)

# Define trait and communication style categories
TRAIT_CATEGORIES = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
COMMUNICATION_STYLES = ['direct', 'analytical', 'intuitive', 'functional']


class PersonalityModel:
    """Core model for analyzing personality traits, communication styles, and interests from user data"""
    
    def __init__(self, config: Dict = None):
        """
        Initialize the personality model with configuration
        
        Args:
            config: Configuration dictionary for the model
        """
        # Store configuration or initialize empty dict if None
        self._config = config or {}
        
        # Set default model from config or settings.DEFAULT_MODEL
        self._default_model = self._config.get('default_model', DEFAULT_MODEL)
        
        # Initialize model adapter using create_model_adapter
        adapter_config = self._config.get('model_adapter', {})
        self._model_adapter = create_model_adapter(adapter_config)
        
        # Initialize prompt generator with configuration
        prompt_config = self._config.get('prompt_generator', {})
        self._prompt_generator = PersonalityPromptGenerator(prompt_config)
        
        # Set up logging
        logger.debug("Personality model initialized")
    
    def analyze_assessment(self, assessment_data: Dict, model_name: str = None) -> Dict:
        """
        Analyze personality assessment responses to generate a personality profile
        
        Args:
            assessment_data: User's responses to personality assessment
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing personality profile with traits, communication style, and social preferences
        """
        # Set model_name to provided value or default_model
        model = model_name or self._default_model
        
        # Clean and normalize assessment data
        normalized_data = normalize_profile_data(assessment_data)
        
        # Generate assessment prompt using prompt_generator
        prompt = self._prompt_generator.generate_assessment_prompt(normalized_data)
        
        # Call model adapter to generate response
        try:
            response = self._model_adapter.generate_text(prompt, model_name=model)
            
            # Extract and parse JSON from model response
            profile_data = extract_json_from_response(response)
            
            # Validate response structure and required fields
            if not profile_data or not isinstance(profile_data, dict):
                logger.error("Invalid response format from model")
                return {}
                
            # Check for required sections in the profile
            required_sections = ['traits', 'communicationStyle', 'socialPreferences']
            for section in required_sections:
                if section not in profile_data:
                    logger.warning(f"Missing required section in profile: {section}")
                    profile_data[section] = {}
            
            return profile_data
        
        except Exception as e:
            logger.error(f"Error analyzing assessment: {str(e)}")
            return {}
    
    def analyze_communication_style(self, interaction_data: Dict, model_name: str = None) -> Dict:
        """
        Analyze interaction data to determine a user's communication style
        
        Args:
            interaction_data: Data about the user's communication patterns
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing communication style analysis with directness, information processing,
            expression, and conflict approach
        """
        # Set model_name to provided value or default_model
        model = model_name or self._default_model
        
        # Clean and normalize interaction data
        normalized_data = clean_text_data(json.dumps(interaction_data))
        interaction_data_clean = json.loads(normalized_data)
        
        # Generate communication style prompt using prompt_generator
        prompt = self._prompt_generator.generate_communication_style_prompt(interaction_data_clean)
        
        # Call model adapter to generate response
        try:
            response = self._model_adapter.generate_text(prompt, model_name=model)
            
            # Extract and parse JSON from model response
            style_data = extract_json_from_response(response)
            
            # Validate response structure and required fields
            if not style_data or not isinstance(style_data, dict):
                logger.error("Invalid response format from model")
                return {}
                
            # Check for required aspects of communication style
            required_aspects = ['directness', 'informationProcessing', 'expressionStyle', 'conflictApproach']
            for aspect in required_aspects:
                if aspect not in style_data:
                    logger.warning(f"Missing required aspect in communication style: {aspect}")
                    style_data[aspect] = {'score': 50, 'explanation': 'No data available'}
            
            return style_data
        
        except Exception as e:
            logger.error(f"Error analyzing communication style: {str(e)}")
            return {}
    
    def analyze_interests(self, profile_data: Dict, model_name: str = None) -> Dict:
        """
        Analyze profile data to categorize and score user interests
        
        Args:
            profile_data: User profile data containing interest information
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing categorized interests with relevance scores
        """
        # Set model_name to provided value or default_model
        model = model_name or self._default_model
        
        # Clean and normalize profile data
        normalized_data = normalize_profile_data(profile_data)
        
        # Generate interests analysis prompt using prompt_generator
        prompt = self._prompt_generator.generate_interests_analysis_prompt(normalized_data)
        
        # Call model adapter to generate response
        try:
            response = self._model_adapter.generate_text(prompt, model_name=model)
            
            # Extract and parse JSON from model response
            interests_data = extract_json_from_response(response)
            
            # Validate response structure and required fields
            if not interests_data or not isinstance(interests_data, dict):
                logger.error("Invalid response format from model")
                return {}
                
            # Ensure all interest categories are present
            interest_categories = PERSONALITY_CONFIG['interest_categories']
            for category in interest_categories:
                normalized_category = category.lower().replace(' ', '')
                if normalized_category not in interests_data:
                    logger.warning(f"Missing interest category: {category}")
                    interests_data[normalized_category] = {'score': 0, 'interests': []}
            
            return interests_data
        
        except Exception as e:
            logger.error(f"Error analyzing interests: {str(e)}")
            return {}
    
    def update_profile_from_behavior(self, current_profile: Dict, behavior_data: Dict, model_name: str = None) -> Dict:
        """
        Update personality profile based on observed user behavior
        
        Args:
            current_profile: Current personality profile
            behavior_data: New behavioral data to incorporate
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Updated personality profile
        """
        # Set model_name to provided value or default_model
        model = model_name or self._default_model
        
        # Clean and normalize current profile and behavior data
        normalized_profile = normalize_profile_data(current_profile)
        normalized_behavior = clean_text_data(json.dumps(behavior_data))
        behavior_data_clean = json.loads(normalized_behavior)
        
        # Prepare prompt with current profile and new behavior data
        prompt_data = {
            "current_profile": normalized_profile,
            "behavior_data": behavior_data_clean
        }
        
        # Create prompt for updating profile based on behavior
        prompt = (
            "You are an AI personality analyst for a social platform called Tribe. Your task is to update a user's "
            "personality profile based on new behavioral data.\n\n"
            f"Current Profile:\n{json.dumps(normalized_profile, indent=2)}\n\n"
            f"New Behavioral Data:\n{json.dumps(behavior_data_clean, indent=2)}\n\n"
            "Analyze the new behavioral data and update the personality profile accordingly. Consider how the new "
            "data might refine or change the existing personality traits, communication style, and interests.\n\n"
            "Provide an updated personality profile in the same structure as the current profile, with adjusted "
            "values based on the new data.\n\n"
            "Format your response as a JSON object with the same structure as the current profile."
        )
        
        # Call model adapter to generate response
        try:
            response = self._model_adapter.generate_text(prompt, model_name=model)
            
            # Extract and parse JSON from model response
            updated_profile = extract_json_from_response(response)
            
            # Validate response structure and required fields
            if not updated_profile or not isinstance(updated_profile, dict):
                logger.error("Invalid response format from model")
                return current_profile  # Return original profile if update fails
            
            # Merge updated profile with current profile, prioritizing new insights
            merged_profile = {**current_profile, **updated_profile}
            
            return merged_profile
        
        except Exception as e:
            logger.error(f"Error updating profile from behavior: {str(e)}")
            return current_profile  # Return original profile if update fails
    
    def get_compatibility_factors(self, profile: Dict) -> Dict:
        """
        Extract key compatibility factors from a personality profile for matchmaking
        
        Args:
            profile: Personality profile
            
        Returns:
            Dict containing compatibility factors for matchmaking
        """
        compatibility_factors = {
            "personality": {},
            "communication": {},
            "interests": {},
            "social_preferences": {}
        }
        
        # Extract personality traits
        if "traits" in profile:
            traits = profile["traits"]
            for trait_name, trait_data in traits.items():
                if isinstance(trait_data, dict) and "score" in trait_data:
                    compatibility_factors["personality"][trait_name] = trait_data["score"]
                elif isinstance(trait_data, (int, float)):
                    compatibility_factors["personality"][trait_name] = trait_data
        
        # Extract communication style
        if "communicationStyle" in profile:
            comm_style = profile["communicationStyle"]
            for style_name, style_data in comm_style.items():
                if isinstance(style_data, dict) and "score" in style_data:
                    compatibility_factors["communication"][style_name] = style_data["score"]
                elif isinstance(style_data, (int, float)):
                    compatibility_factors["communication"][style_name] = style_data
        
        # Extract interests
        if "interests" in profile:
            interests = profile["interests"]
            for category, category_data in interests.items():
                if isinstance(category_data, dict) and "score" in category_data:
                    compatibility_factors["interests"][category] = category_data["score"]
        
        # Extract social preferences
        if "socialPreferences" in profile:
            social_prefs = profile["socialPreferences"]
            for pref_name, pref_value in social_prefs.items():
                compatibility_factors["social_preferences"][pref_name] = pref_value
        
        # Normalize all scores to 0-1 range
        for category in ["personality", "communication", "interests"]:
            for key, value in compatibility_factors[category].items():
                if isinstance(value, (int, float)) and value > 1:
                    compatibility_factors[category][key] = value / 100
        
        return compatibility_factors
    
    async def async_analyze_assessment(self, assessment_data: Dict, model_name: str = None) -> Dict:
        """
        Asynchronously analyze personality assessment responses
        
        Args:
            assessment_data: User's responses to personality assessment
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            Dict containing personality profile with traits, communication style, and social preferences
        """
        # Set model_name to provided value or default_model
        model = model_name or self._default_model
        
        # Clean and normalize assessment data
        normalized_data = normalize_profile_data(assessment_data)
        
        # Generate assessment prompt using prompt_generator
        prompt = self._prompt_generator.generate_assessment_prompt(normalized_data)
        
        # Call model adapter to asynchronously generate response
        try:
            response = await self._model_adapter.async_generate_text(prompt, model_name=model)
            
            # Extract and parse JSON from model response
            profile_data = extract_json_from_response(response)
            
            # Validate response structure and required fields
            if not profile_data or not isinstance(profile_data, dict):
                logger.error("Invalid response format from model")
                return {}
                
            # Check for required sections in the profile
            required_sections = ['traits', 'communicationStyle', 'socialPreferences']
            for section in required_sections:
                if section not in profile_data:
                    logger.warning(f"Missing required section in profile: {section}")
                    profile_data[section] = {}
            
            return profile_data
        
        except Exception as e:
            logger.error(f"Error in async assessment analysis: {str(e)}")
            return {}
    
    async def batch_analyze_assessments(self, assessment_data_list: List[Dict], model_name: str = None) -> List[Dict]:
        """
        Analyze multiple personality assessments in batch
        
        Args:
            assessment_data_list: List of assessment data dictionaries
            model_name: Optional model name to use, defaults to self._default_model
            
        Returns:
            List of personality profiles
        """
        # Set model_name to provided value or default_model
        model = model_name or self._default_model
        
        # Create tasks for each assessment
        tasks = []
        for assessment_data in assessment_data_list:
            task = self.async_analyze_assessment(assessment_data, model_name=model)
            tasks.append(task)
        
        # Run tasks concurrently
        try:
            profiles = await asyncio.gather(*tasks)
            return profiles
        except Exception as e:
            logger.error(f"Error in batch assessment analysis: {str(e)}")
            
            # Try to process each assessment individually to avoid total failure
            profiles = []
            for assessment_data in assessment_data_list:
                try:
                    profile = await self.async_analyze_assessment(assessment_data, model_name=model)
                    profiles.append(profile)
                except Exception as e:
                    logger.error(f"Error processing individual assessment: {str(e)}")
                    profiles.append({})  # Add empty profile as placeholder
            
            return profiles
    
    def close(self):
        """
        Close resources used by the model
        """
        if hasattr(self, '_model_adapter'):
            self._model_adapter.close()
        logger.debug("Personality model resources closed")


class PersonalityProfileBuilder:
    """Helper class for building and updating personality profiles"""
    
    def __init__(self):
        """Initialize an empty personality profile builder"""
        self._traits = {}
        self._communication_style = {}
        self._interests = {}
        self._social_preferences = {}
        self._insights = {}
        
        self._logger = logging.getLogger(__name__)
    
    def add_trait(self, trait_name: str, score: float, description: str = None) -> 'PersonalityProfileBuilder':
        """
        Add or update a personality trait
        
        Args:
            trait_name: Name of the personality trait
            score: Trait score (0-100)
            description: Optional description of the trait
            
        Returns:
            Self reference for method chaining
        """
        # Validate trait name
        if trait_name not in TRAIT_CATEGORIES:
            self._logger.warning(f"Invalid trait name: {trait_name}")
            return self
        
        # Normalize score to 0-100 range
        normalized_score = max(0, min(float(score), 100))
        
        # Add or update trait
        self._traits[trait_name] = {
            "score": normalized_score,
            "description": description or ""
        }
        
        return self
    
    def add_communication_style(self, style_name: str, score: float, description: str = None) -> 'PersonalityProfileBuilder':
        """
        Add or update communication style attributes
        
        Args:
            style_name: Name of the communication style aspect
            score: Style score (0-100)
            description: Optional description
            
        Returns:
            Self reference for method chaining
        """
        # Validate style name
        if style_name not in COMMUNICATION_STYLES:
            self._logger.warning(f"Invalid communication style: {style_name}")
            return self
        
        # Normalize score to 0-100 range
        normalized_score = max(0, min(float(score), 100))
        
        # Add or update style
        self._communication_style[style_name] = {
            "score": normalized_score,
            "description": description or ""
        }
        
        return self
    
    def add_interest(self, category: str, score: float, specific_interests: List[str] = None) -> 'PersonalityProfileBuilder':
        """
        Add or update an interest category
        
        Args:
            category: Interest category name
            score: Interest score (0-100)
            specific_interests: List of specific interests in this category
            
        Returns:
            Self reference for method chaining
        """
        # Normalize category name
        normalized_category = category.lower().replace(' ', '_')
        
        # Normalize score to 0-100 range
        normalized_score = max(0, min(float(score), 100))
        
        # Add or update interest category
        self._interests[normalized_category] = {
            "score": normalized_score,
            "interests": specific_interests or []
        }
        
        return self
    
    def add_social_preference(self, preference_name: str, value: Any, description: str = None) -> 'PersonalityProfileBuilder':
        """
        Add or update a social preference
        
        Args:
            preference_name: Name of the preference
            value: Preference value (can be any type)
            description: Optional description
            
        Returns:
            Self reference for method chaining
        """
        # Normalize preference name
        normalized_name = preference_name.lower().replace(' ', '_')
        
        # Add or update preference
        self._social_preferences[normalized_name] = {
            "value": value,
            "description": description or ""
        }
        
        return self
    
    def add_insight(self, category: str, insight: str) -> 'PersonalityProfileBuilder':
        """
        Add an insight about the personality profile
        
        Args:
            category: Category of the insight
            insight: The insight text
            
        Returns:
            Self reference for method chaining
        """
        # Normalize category name
        normalized_category = category.lower().replace(' ', '_')
        
        # Initialize category if it doesn't exist
        if normalized_category not in self._insights:
            self._insights[normalized_category] = []
        
        # Add insight to category
        self._insights[normalized_category].append(insight)
        
        return self
    
    @classmethod
    def from_assessment(cls, assessment_result: Dict) -> 'PersonalityProfileBuilder':
        """
        Build a profile from AI assessment results
        
        Args:
            assessment_result: The AI assessment result dictionary
            
        Returns:
            PersonalityProfileBuilder with populated data
        """
        builder = cls()
        
        # Extract and add traits
        if "traits" in assessment_result:
            traits = assessment_result["traits"]
            for trait_name, trait_data in traits.items():
                if isinstance(trait_data, dict) and "score" in trait_data:
                    description = trait_data.get("description", "")
                    builder.add_trait(trait_name, trait_data["score"], description)
                elif isinstance(trait_data, (int, float)):
                    builder.add_trait(trait_name, trait_data)
        
        # Extract and add communication style
        if "communicationStyle" in assessment_result:
            comm_style = assessment_result["communicationStyle"]
            for style_name, style_data in comm_style.items():
                if isinstance(style_data, dict) and "score" in style_data:
                    description = style_data.get("explanation", style_data.get("description", ""))
                    builder.add_communication_style(style_name, style_data["score"], description)
                elif isinstance(style_data, (int, float)):
                    builder.add_communication_style(style_name, style_data)
        
        # Extract and add interests
        if "interests" in assessment_result:
            interests = assessment_result["interests"]
            for category, category_data in interests.items():
                if isinstance(category_data, dict) and "score" in category_data:
                    specific_interests = category_data.get("interests", [])
                    builder.add_interest(category, category_data["score"], specific_interests)
        
        # Extract and add social preferences
        if "socialPreferences" in assessment_result:
            social_prefs = assessment_result["socialPreferences"]
            for pref_name, pref_data in social_prefs.items():
                if isinstance(pref_data, dict) and "value" in pref_data:
                    description = pref_data.get("description", "")
                    builder.add_social_preference(pref_name, pref_data["value"], description)
                else:
                    builder.add_social_preference(pref_name, pref_data)
        
        # Extract and add insights
        if "insights" in assessment_result:
            insights = assessment_result["insights"]
            for category, category_insights in insights.items():
                if isinstance(category_insights, list):
                    for insight in category_insights:
                        builder.add_insight(category, insight)
                elif isinstance(category_insights, str):
                    builder.add_insight(category, category_insights)
        
        return builder
    
    def merge(self, other_profile: Dict, weight: float = 0.5) -> 'PersonalityProfileBuilder':
        """
        Merge another profile into this one
        
        Args:
            other_profile: Another personality profile to merge
            weight: Weight to give to the other profile (0-1)
            
        Returns:
            Self reference for method chaining
        """
        # Ensure weight is between 0 and 1
        normalized_weight = max(0, min(float(weight), 1))
        self_weight = 1 - normalized_weight
        
        # Merge traits
        if "traits" in other_profile:
            for trait_name, trait_data in other_profile["traits"].items():
                if trait_name in self._traits:
                    # Weighted average for existing traits
                    current_score = self._traits[trait_name]["score"]
                    if isinstance(trait_data, dict) and "score" in trait_data:
                        new_score = trait_data["score"]
                        merged_score = (current_score * self_weight) + (new_score * normalized_weight)
                        self._traits[trait_name]["score"] = merged_score
                        
                        # Update description if provided
                        if "description" in trait_data and trait_data["description"]:
                            self._traits[trait_name]["description"] = trait_data["description"]
                    elif isinstance(trait_data, (int, float)):
                        merged_score = (current_score * self_weight) + (trait_data * normalized_weight)
                        self._traits[trait_name]["score"] = merged_score
                else:
                    # Add new trait
                    if isinstance(trait_data, dict) and "score" in trait_data:
                        self.add_trait(
                            trait_name, trait_data["score"], trait_data.get("description", "")
                        )
                    elif isinstance(trait_data, (int, float)):
                        self.add_trait(trait_name, trait_data)
        
        # Merge communication style
        if "communicationStyle" in other_profile:
            for style_name, style_data in other_profile["communicationStyle"].items():
                if style_name in self._communication_style:
                    # Weighted average for existing styles
                    current_score = self._communication_style[style_name]["score"]
                    if isinstance(style_data, dict) and "score" in style_data:
                        new_score = style_data["score"]
                        merged_score = (current_score * self_weight) + (new_score * normalized_weight)
                        self._communication_style[style_name]["score"] = merged_score
                        
                        # Update description if provided
                        if "description" in style_data and style_data["description"]:
                            self._communication_style[style_name]["description"] = style_data["description"]
                    elif isinstance(style_data, (int, float)):
                        merged_score = (current_score * self_weight) + (style_data * normalized_weight)
                        self._communication_style[style_name]["score"] = merged_score
                else:
                    # Add new style
                    if isinstance(style_data, dict) and "score" in style_data:
                        self.add_communication_style(
                            style_name, style_data["score"], 
                            style_data.get("description", style_data.get("explanation", ""))
                        )
                    elif isinstance(style_data, (int, float)):
                        self.add_communication_style(style_name, style_data)
        
        # Merge interests
        if "interests" in other_profile:
            for category, category_data in other_profile["interests"].items():
                if category in self._interests:
                    # Weighted average for existing interests
                    current_score = self._interests[category]["score"]
                    if isinstance(category_data, dict) and "score" in category_data:
                        new_score = category_data["score"]
                        merged_score = (current_score * self_weight) + (new_score * normalized_weight)
                        self._interests[category]["score"] = merged_score
                        
                        # Merge specific interests
                        if "interests" in category_data and category_data["interests"]:
                            current_interests = set(self._interests[category]["interests"])
                            new_interests = set(category_data["interests"])
                            merged_interests = list(current_interests.union(new_interests))
                            self._interests[category]["interests"] = merged_interests
                    elif isinstance(category_data, (int, float)):
                        merged_score = (current_score * self_weight) + (category_data * normalized_weight)
                        self._interests[category]["score"] = merged_score
                else:
                    # Add new interest category
                    if isinstance(category_data, dict) and "score" in category_data:
                        self.add_interest(
                            category, category_data["score"], category_data.get("interests", [])
                        )
                    elif isinstance(category_data, (int, float)):
                        self.add_interest(category, category_data)
        
        # Merge social preferences (prioritize newer data)
        if "socialPreferences" in other_profile:
            for pref_name, pref_data in other_profile["socialPreferences"].items():
                # Add or update preference
                if isinstance(pref_data, dict) and "value" in pref_data:
                    self.add_social_preference(
                        pref_name, pref_data["value"], pref_data.get("description", "")
                    )
                else:
                    self.add_social_preference(pref_name, pref_data)
        
        # Merge insights (add new, avoid duplicates)
        if "insights" in other_profile:
            for category, category_insights in other_profile["insights"].items():
                if isinstance(category_insights, list):
                    for insight in category_insights:
                        # Check if insight already exists to avoid duplicates
                        normalized_category = category.lower().replace(' ', '_')
                        if normalized_category in self._insights:
                            if insight not in self._insights[normalized_category]:
                                self.add_insight(category, insight)
                        else:
                            self.add_insight(category, insight)
                elif isinstance(category_insights, str):
                    self.add_insight(category, category_insights)
        
        return self
    
    def build(self) -> Dict:
        """
        Build the final personality profile
        
        Returns:
            Complete personality profile dictionary
        """
        import datetime
        
        profile = {
            "traits": self._traits,
            "communicationStyle": self._communication_style,
            "interests": self._interests,
            "socialPreferences": self._social_preferences,
            "insights": self._insights,
            "metadata": {
                "version": "1.0",
                "timestamp": datetime.datetime.now().isoformat()
            }
        }
        
        return profile