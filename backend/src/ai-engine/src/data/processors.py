import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from typing import Dict, List, Any, Union, Optional, Tuple
import json

# Internal imports
from ..data.schemas import (
    UserProfileSchema, 
    TribeSchema, 
    EventSchema, 
    PromptSchema, 
    ResponseSchema
)
from ..config.settings import (
    PERSONALITY_TRAITS,
    INTEREST_CATEGORIES,
    MODEL_CONFIGS
)
from ..utils.data_preprocessing import (
    normalize_profile_data,
    normalize_tribe_data,
    normalize_event_data,
    clean_text_data,
    normalize_numeric_features,
    normalize_categorical_features
)

# Set up logger
logger = logging.getLogger(__name__)

def extract_personality_features(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and transform personality traits into feature vectors
    
    Args:
        profile_data: User profile data including personality traits
        
    Returns:
        Dictionary of extracted personality features
    """
    if not profile_data or 'personalityTraits' not in profile_data:
        logger.warning("Missing personality traits in profile data")
        return {}
    
    try:
        # Extract personality traits
        traits = profile_data.get('personalityTraits', [])
        
        # Initialize feature dictionary with default values
        features = {
            'trait_scores': {},
            'dominant_trait': None,
            'trait_balance': 0.0,
            'trait_diversity': 0.0
        }
        
        # Process each trait
        trait_scores = []
        for trait in traits:
            trait_name = trait.get('name')
            trait_score = trait.get('score')
            
            if trait_name and trait_score is not None:
                features['trait_scores'][trait_name] = float(trait_score)
                trait_scores.append(float(trait_score))
        
        # Calculate derived features
        if trait_scores:
            # Find dominant trait
            if features['trait_scores']:
                features['dominant_trait'] = max(
                    features['trait_scores'], 
                    key=features['trait_scores'].get
                )
            
            # Calculate trait balance (std deviation, lower means more balanced)
            if len(trait_scores) > 1:
                features['trait_balance'] = 1.0 - min(1.0, np.std(trait_scores))
            
            # Calculate trait diversity (range of values)
            if len(trait_scores) > 1:
                features['trait_diversity'] = max(0.0, min(1.0, max(trait_scores) - min(trait_scores)))
        
        return features
    
    except Exception as e:
        logger.error(f"Error extracting personality features: {str(e)}")
        return {}

def extract_interest_features(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and transform interests into feature vectors
    
    Args:
        profile_data: User profile data including interests
        
    Returns:
        Dictionary of extracted interest features
    """
    if not profile_data or 'interests' not in profile_data:
        logger.warning("Missing interests in profile data")
        return {}
    
    try:
        # Extract interests
        interests = profile_data.get('interests', [])
        
        # Initialize feature dictionary
        features = {
            'interest_categories': {},
            'interest_levels': {},
            'top_interests': [],
            'interest_diversity': 0.0,
            'interest_intensity': 0.0
        }
        
        # Group interests by category
        category_interests = {}
        for interest in interests:
            category = interest.get('category')
            name = interest.get('name')
            level = interest.get('level')
            
            if category and name and level is not None:
                if category not in category_interests:
                    category_interests[category] = []
                
                category_interests[category].append({
                    'name': name,
                    'level': int(level)
                })
                
                # Store interest level
                features['interest_levels'][name] = int(level)
        
        # Store categories and count interests in each
        for category, interests_list in category_interests.items():
            features['interest_categories'][category] = len(interests_list)
            
            # Find top interests (level 4-5) in each category
            top_in_category = [
                interest['name'] for interest in interests_list 
                if interest['level'] >= 4
            ]
            
            features['top_interests'].extend(top_in_category)
        
        # Calculate interest diversity (number of categories)
        features['interest_diversity'] = min(1.0, len(category_interests) / len(INTEREST_CATEGORIES))
        
        # Calculate interest intensity (average level across all interests)
        if features['interest_levels']:
            avg_level = sum(features['interest_levels'].values()) / len(features['interest_levels'])
            features['interest_intensity'] = (avg_level - 1) / 4  # Scale from 1-5 to 0-1
        
        return features
    
    except Exception as e:
        logger.error(f"Error extracting interest features: {str(e)}")
        return {}

def extract_communication_style_features(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and transform communication style into feature vectors
    
    Args:
        profile_data: User profile data including communication style
        
    Returns:
        Dictionary of extracted communication style features
    """
    if not profile_data or 'communicationStyle' not in profile_data:
        logger.warning("Missing communication style in profile data")
        return {}
    
    try:
        # Extract communication style
        comm_style = profile_data.get('communicationStyle', {})
        
        # Initialize feature dictionary
        features = {
            'communication_preferences': {},
            'primary_style': None,
            'style_balance': 0.0
        }
        
        # Process each communication style dimension
        style_scores = []
        for style, score in comm_style.items():
            if score is not None:
                features['communication_preferences'][style] = float(score)
                style_scores.append(float(score))
        
        # Calculate derived features
        if style_scores:
            # Find primary communication style
            if features['communication_preferences']:
                features['primary_style'] = max(
                    features['communication_preferences'], 
                    key=features['communication_preferences'].get
                )
            
            # Calculate style balance (std deviation, lower means more balanced)
            if len(style_scores) > 1:
                features['style_balance'] = 1.0 - min(1.0, np.std(style_scores))
        
        return features
    
    except Exception as e:
        logger.error(f"Error extracting communication style features: {str(e)}")
        return {}

def extract_tribe_features(tribe_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and transform tribe data into feature vectors
    
    Args:
        tribe_data: Tribe data
        
    Returns:
        Dictionary of extracted tribe features
    """
    if not tribe_data:
        logger.warning("Empty tribe data")
        return {}
    
    try:
        # Initialize feature dictionary
        features = {
            'basic_attributes': {},
            'composition': {},
            'activity_patterns': {},
            'collective_interests': {},
            'collective_personality': {}
        }
        
        # Extract basic attributes
        features['basic_attributes'] = {
            'name': tribe_data.get('name', ''),
            'description': tribe_data.get('description', ''),
            'size': len(tribe_data.get('members', [])),
            'status': tribe_data.get('status', 'forming'),
            'age_days': 0  # Will calculate if createdAt is available
        }
        
        # Calculate tribe age if creation date is available
        if 'createdAt' in tribe_data:
            try:
                from datetime import datetime
                created_at = datetime.fromisoformat(
                    tribe_data['createdAt'].replace('Z', '+00:00')
                )
                now = datetime.now()
                delta = now - created_at
                features['basic_attributes']['age_days'] = delta.days
            except (ValueError, TypeError):
                pass  # Keep default value
        
        # Analyze member composition
        members = tribe_data.get('members', [])
        features['composition'] = {
            'total_members': len(members),
            'role_distribution': {},
            'join_distribution': {}  # Will contain time-based joining patterns
        }
        
        # Count members by role
        for member in members:
            role = member.get('role', 'member')
            if role not in features['composition']['role_distribution']:
                features['composition']['role_distribution'][role] = 0
            features['composition']['role_distribution'][role] += 1
        
        # Analyze activity patterns
        activities = tribe_data.get('activities', [])
        activity_types = {}
        activity_recency = []
        
        for activity in activities:
            # Count by activity type
            activity_type = activity.get('type')
            if activity_type:
                if activity_type not in activity_types:
                    activity_types[activity_type] = 0
                activity_types[activity_type] += 1
            
            # Track activity timestamps for recency analysis
            if 'timestamp' in activity:
                try:
                    from datetime import datetime
                    timestamp = datetime.fromisoformat(
                        activity['timestamp'].replace('Z', '+00:00')
                    )
                    activity_recency.append(timestamp)
                except (ValueError, TypeError):
                    pass
        
        features['activity_patterns'] = {
            'total_activities': len(activities),
            'activity_types': activity_types,
            'activity_frequency': len(activities) / max(1, features['basic_attributes']['age_days']),
            'has_recent_activity': False  # Will update if recent activities exist
        }
        
        # Check for recent activity (within 7 days)
        if activity_recency:
            from datetime import datetime
            now = datetime.now()
            most_recent = max(activity_recency)
            delta = now - most_recent
            features['activity_patterns']['has_recent_activity'] = delta.days <= 7
        
        # Analyze collective interests
        interests = tribe_data.get('interests', [])
        interest_categories = {}
        interest_levels = {}
        
        for interest in interests:
            category = interest.get('category')
            name = interest.get('name')
            level = interest.get('level')
            
            if category and name and level is not None:
                if category not in interest_categories:
                    interest_categories[category] = []
                
                interest_categories[category].append({
                    'name': name,
                    'level': int(level)
                })
                
                interest_levels[name] = int(level)
        
        features['collective_interests'] = {
            'categories': interest_categories,
            'top_interests': [
                name for name, level in interest_levels.items() if level >= 4
            ],
            'diversity': min(1.0, len(interest_categories) / len(INTEREST_CATEGORIES))
        }
        
        return features
    
    except Exception as e:
        logger.error(f"Error extracting tribe features: {str(e)}")
        return {}

def extract_event_features(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract and transform event data into feature vectors
    
    Args:
        event_data: Event data
        
    Returns:
        Dictionary of extracted event features
    """
    if not event_data:
        logger.warning("Empty event data")
        return {}
    
    try:
        # Initialize feature dictionary
        features = {
            'basic_attributes': {},
            'temporal_features': {},
            'location_features': {},
            'weather_features': {},
            'attendance_metrics': {}
        }
        
        # Extract basic attributes
        features['basic_attributes'] = {
            'name': event_data.get('name', ''),
            'description': event_data.get('description', ''),
            'type': event_data.get('type', 'other'),
            'status': event_data.get('status', 'scheduled'),
            'cost': float(event_data.get('cost', 0))
        }
        
        # Extract temporal features
        if 'startTime' in event_data:
            try:
                from datetime import datetime
                start_time = datetime.fromisoformat(
                    event_data['startTime'].replace('Z', '+00:00')
                )
                
                features['temporal_features'] = {
                    'start_time': event_data['startTime'],
                    'day_of_week': start_time.weekday(),
                    'hour_of_day': start_time.hour,
                    'is_weekend': start_time.weekday() >= 5,
                    'is_evening': 17 <= start_time.hour < 22,
                    'duration_hours': 0  # Will update if endTime is available
                }
                
                # Calculate duration if end time is available
                if 'endTime' in event_data:
                    try:
                        end_time = datetime.fromisoformat(
                            event_data['endTime'].replace('Z', '+00:00')
                        )
                        delta = end_time - start_time
                        features['temporal_features']['duration_hours'] = delta.seconds / 3600
                    except (ValueError, TypeError):
                        pass
            
            except (ValueError, TypeError):
                features['temporal_features'] = {}
        
        # Extract location features
        if 'location' in event_data:
            location = event_data['location']
            features['location_features'] = {
                'has_coordinates': 'latitude' in location and 'longitude' in location,
                'has_address': 'address' in location and isinstance(location['address'], dict)
            }
            
            if features['location_features']['has_coordinates']:
                features['location_features']['latitude'] = location['latitude']
                features['location_features']['longitude'] = location['longitude']
        
        # Extract venue features if available
        if 'venue' in event_data and isinstance(event_data['venue'], dict):
            venue = event_data['venue']
            features['location_features']['venue_name'] = venue.get('name', '')
            features['location_features']['venue_type'] = venue.get('type', '')
        
        # Extract weather features if available
        if 'weatherData' in event_data and isinstance(event_data['weatherData'], dict):
            weather = event_data['weatherData']
            features['weather_features'] = {
                'condition': weather.get('condition', ''),
                'temperature': float(weather.get('temperature', 0)),
                'precipitation_chance': float(weather.get('precipitationChance', 0)),
                'is_suitable_for_outdoor': False  # Will calculate based on conditions
            }
            
            # Determine if weather is suitable for outdoor activities
            if features['weather_features']['condition'].lower() in ['clear', 'sunny', 'partly cloudy']:
                if features['weather_features']['precipitation_chance'] < 0.3:
                    if 15 <= features['weather_features']['temperature'] <= 30:  # Celsius
                        features['weather_features']['is_suitable_for_outdoor'] = True
        
        # Extract attendance metrics
        attendees = event_data.get('attendees', [])
        
        going_count = 0
        maybe_count = 0
        not_going_count = 0
        
        for attendee in attendees:
            status = attendee.get('rsvpStatus', '').lower()
            if status == 'going':
                going_count += 1
            elif status == 'maybe':
                maybe_count += 1
            elif status == 'not_going':
                not_going_count += 1
        
        features['attendance_metrics'] = {
            'total_invited': len(attendees),
            'going_count': going_count,
            'maybe_count': maybe_count,
            'not_going_count': not_going_count,
            'response_rate': (going_count + maybe_count + not_going_count) / max(1, len(attendees)),
            'attendance_rate': going_count / max(1, len(attendees))
        }
        
        return features
    
    except Exception as e:
        logger.error(f"Error extracting event features: {str(e)}")
        return {}

def calculate_compatibility_features(user_profile: Dict[str, Any], tribe_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate compatibility features between a user and a tribe
    
    Args:
        user_profile: User profile data
        tribe_data: Tribe data
        
    Returns:
        Dictionary of compatibility features
    """
    if not user_profile or not tribe_data:
        logger.warning("Missing user profile or tribe data for compatibility calculation")
        return {}
    
    try:
        # Extract features from user profile and tribe
        user_personality = extract_personality_features(user_profile)
        user_interests = extract_interest_features(user_profile)
        user_communication = extract_communication_style_features(user_profile)
        
        tribe_features = extract_tribe_features(tribe_data)
        
        # Initialize compatibility features
        compatibility = {
            'overall_score': 0.0,
            'personality_compatibility': 0.0,
            'interest_overlap': 0.0,
            'communication_compatibility': 0.0,
            'location_proximity': 0.0,
            'compatibility_factors': {}
        }
        
        # Calculate personality compatibility
        if user_personality and 'collective_personality' in tribe_features:
            # Here we'd implement a more sophisticated personality compatibility algorithm
            # For now, we'll use a placeholder value
            compatibility['personality_compatibility'] = 0.75  # Placeholder
        
        # Calculate interest overlap
        if user_interests and 'collective_interests' in tribe_features:
            user_top_interests = set(user_interests.get('top_interests', []))
            tribe_top_interests = set(tribe_features.get('collective_interests', {}).get('top_interests', []))
            
            if user_top_interests and tribe_top_interests:
                # Calculate Jaccard similarity (intersection over union)
                intersection = len(user_top_interests.intersection(tribe_top_interests))
                union = len(user_top_interests.union(tribe_top_interests))
                
                if union > 0:
                    compatibility['interest_overlap'] = intersection / union
        
        # Calculate communication style compatibility
        if user_communication and 'communication_preferences' in user_communication:
            # Here we'd implement a more sophisticated compatibility algorithm
            # For now, we'll use a placeholder value
            compatibility['communication_compatibility'] = 0.8  # Placeholder
        
        # Calculate location proximity if location data is available
        if ('location' in user_profile and 'location' in tribe_data and
            'latitude' in user_profile['location'] and 'longitude' in user_profile['location'] and
            'latitude' in tribe_data['location'] and 'longitude' in tribe_data['location']):
            
            from math import radians, cos, sin, asin, sqrt
            
            # Haversine formula for distance calculation
            def haversine(lat1, lon1, lat2, lon2):
                R = 6371  # Earth radius in kilometers
                
                dlat = radians(lat2 - lat1)
                dlon = radians(lon2 - lon1)
                lat1, lat2 = radians(lat1), radians(lat2)
                
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * asin(sqrt(a))
                
                return R * c
            
            # Calculate distance between user and tribe
            user_lat = user_profile['location']['latitude']
            user_lon = user_profile['location']['longitude']
            tribe_lat = tribe_data['location']['latitude']
            tribe_lon = tribe_data['location']['longitude']
            
            distance_km = haversine(user_lat, user_lon, tribe_lat, tribe_lon)
            
            # Convert distance to proximity score (closer = higher score)
            # We'll consider distances up to 50km, with 0km being a perfect 1.0
            # and 50km or more being 0.0
            max_distance = 50.0  # km
            compatibility['location_proximity'] = max(0.0, 1.0 - (distance_km / max_distance))
        
        # Calculate overall compatibility score as weighted average of components
        weights = {
            'personality_compatibility': 0.35,
            'interest_overlap': 0.30,
            'communication_compatibility': 0.20,
            'location_proximity': 0.15
        }
        
        weighted_sum = sum(
            compatibility[factor] * weight
            for factor, weight in weights.items()
        )
        
        compatibility['overall_score'] = weighted_sum
        compatibility['compatibility_factors'] = weights
        
        return compatibility
    
    except Exception as e:
        logger.error(f"Error calculating compatibility features: {str(e)}")
        return {'overall_score': 0.0}

def prepare_matching_input(user_profile: Dict[str, Any], tribes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Prepare input data for the matching model
    
    Args:
        user_profile: User profile data
        tribes: List of tribe data
        
    Returns:
        Prepared input for matching model
    """
    if not user_profile or not tribes:
        logger.warning("Missing user profile or tribes for matching input preparation")
        return {}
    
    try:
        # Extract user features
        user_features = {
            'personality': extract_personality_features(user_profile),
            'interests': extract_interest_features(user_profile),
            'communication': extract_communication_style_features(user_profile)
        }
        
        # Build compatibility data for each tribe
        tribe_compatibilities = []
        
        for tribe in tribes:
            # Extract tribe features
            tribe_features = extract_tribe_features(tribe)
            
            # Calculate compatibility between user and tribe
            compatibility = calculate_compatibility_features(user_profile, tribe)
            
            tribe_compatibilities.append({
                'tribe_id': tribe.get('id', ''),
                'tribe_name': tribe.get('name', ''),
                'tribe_size': len(tribe.get('members', [])),
                'compatibility_score': compatibility.get('overall_score', 0.0),
                'compatibility_factors': compatibility,
                'tribe_features': tribe_features
            })
        
        # Sort tribes by compatibility score (descending)
        tribe_compatibilities.sort(
            key=lambda x: x['compatibility_score'],
            reverse=True
        )
        
        # Prepare the final input structure
        matching_input = {
            'user': {
                'id': user_profile.get('id', ''),
                'features': user_features
            },
            'tribes': tribe_compatibilities,
            'parameters': {
                'min_compatibility_threshold': 0.7,
                'max_recommendations': 5
            }
        }
        
        return matching_input
    
    except Exception as e:
        logger.error(f"Error preparing matching input: {str(e)}")
        return {}

def prepare_tribe_formation_input(user_profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Prepare input data for the tribe formation model
    
    Args:
        user_profiles: List of user profile data
        
    Returns:
        Prepared input for tribe formation model
    """
    if not user_profiles:
        logger.warning("No user profiles provided for tribe formation input preparation")
        return {}
    
    try:
        # Extract features for each user
        users_with_features = []
        
        for profile in user_profiles:
            # Extract user features
            user_features = {
                'personality': extract_personality_features(profile),
                'interests': extract_interest_features(profile),
                'communication': extract_communication_style_features(profile)
            }
            
            users_with_features.append({
                'id': profile.get('id', ''),
                'name': profile.get('name', ''),
                'features': user_features,
                'location': profile.get('location', {})
            })
        
        # Calculate pairwise compatibility between all users
        pairwise_compatibility = []
        
        for i, user1 in enumerate(user_profiles):
            for j, user2 in enumerate(user_profiles):
                if i < j:  # Only calculate once for each pair
                    # Create a simplified "tribe" from user2 for compatibility calculation
                    dummy_tribe = {
                        'id': user2.get('id', ''),
                        'name': user2.get('name', ''),
                        'description': user2.get('bio', ''),
                        'members': [{'userId': user2.get('id', '')}],
                        'location': user2.get('location', {}),
                        'interests': user2.get('interests', []),
                        'personalityTraits': user2.get('personalityTraits', [])
                    }
                    
                    compatibility = calculate_compatibility_features(user1, dummy_tribe)
                    
                    pairwise_compatibility.append({
                        'user1_id': user1.get('id', ''),
                        'user2_id': user2.get('id', ''),
                        'compatibility_score': compatibility.get('overall_score', 0.0)
                    })
        
        # Generate initial clustering suggestions
        # This is a simplified approach - in a real system, we'd use a more sophisticated
        # clustering algorithm based on the compatibility scores
        
        # Prepare the final input structure
        formation_input = {
            'users': users_with_features,
            'pairwise_compatibility': pairwise_compatibility,
            'parameters': {
                'min_tribe_size': 4,
                'max_tribe_size': 8,
                'min_compatibility_threshold': 0.5,
                'location_weight': 0.3,
                'interest_weight': 0.3,
                'personality_weight': 0.4
            }
        }
        
        return formation_input
    
    except Exception as e:
        logger.error(f"Error preparing tribe formation input: {str(e)}")
        return {}

def prepare_engagement_input(tribe_data: Dict[str, Any], member_profiles: List[Dict[str, Any]], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare input data for the engagement model
    
    Args:
        tribe_data: Tribe data
        member_profiles: List of member profile data
        context: Contextual information for engagement
        
    Returns:
        Prepared input for engagement model
    """
    if not tribe_data or not member_profiles:
        logger.warning("Missing tribe data or member profiles for engagement input preparation")
        return {}
    
    try:
        # Extract tribe features
        tribe_features = extract_tribe_features(tribe_data)
        
        # Extract features for each member
        members_with_features = []
        
        for profile in member_profiles:
            # Extract member features
            member_features = {
                'personality': extract_personality_features(profile),
                'interests': extract_interest_features(profile),
                'communication': extract_communication_style_features(profile)
            }
            
            members_with_features.append({
                'id': profile.get('id', ''),
                'name': profile.get('name', ''),
                'features': member_features
            })
        
        # Process context information
        processed_context = {
            'current_engagement_level': context.get('engagement_level', 'medium'),
            'recent_activities': context.get('recent_activities', []),
            'time_since_last_activity': context.get('time_since_last_activity', 0),
            'upcoming_events': context.get('upcoming_events', []),
            'weather_conditions': context.get('weather_conditions', {}),
            'previous_prompts': context.get('previous_prompts', [])
        }
        
        # Determine prompt types based on engagement level
        prompt_types = []
        
        if processed_context['current_engagement_level'] == 'low':
            # For low engagement, focus on conversation starters and simple activities
            prompt_types = ['conversation', 'simple_activity']
        elif processed_context['current_engagement_level'] == 'medium':
            # For medium engagement, suggest more involved activities and challenges
            prompt_types = ['activity', 'challenge', 'conversation']
        else:  # high engagement
            # For high engagement, focus on meetup planning and deeper discussions
            prompt_types = ['meetup', 'challenge', 'deep_conversation']
        
        # Prepare the final input structure
        engagement_input = {
            'tribe': {
                'id': tribe_data.get('id', ''),
                'name': tribe_data.get('name', ''),
                'description': tribe_data.get('description', ''),
                'features': tribe_features
            },
            'members': members_with_features,
            'context': processed_context,
            'parameters': {
                'prompt_types': prompt_types,
                'num_suggestions': 3,
                'max_prompt_history': 10
            }
        }
        
        return engagement_input
    
    except Exception as e:
        logger.error(f"Error preparing engagement input: {str(e)}")
        return {}

def prepare_recommendation_input(tribe_data: Dict[str, Any], events: List[Dict[str, Any]], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare input data for the recommendation model
    
    Args:
        tribe_data: Tribe data
        events: List of event data
        context: Contextual information for recommendations
        
    Returns:
        Prepared input for recommendation model
    """
    if not tribe_data or not events:
        logger.warning("Missing tribe data or events for recommendation input preparation")
        return {}
    
    try:
        # Extract tribe features
        tribe_features = extract_tribe_features(tribe_data)
        
        # Extract features for each event
        events_with_features = []
        
        for event in events:
            # Extract event features
            event_features = extract_event_features(event)
            
            events_with_features.append({
                'id': event.get('id', ''),
                'name': event.get('name', ''),
                'features': event_features
            })
        
        # Process context information
        processed_context = {
            'weather_forecast': context.get('weather_forecast', {}),
            'time_of_day': context.get('time_of_day', ''),
            'day_of_week': context.get('day_of_week', ''),
            'budget_constraints': context.get('budget_constraints', {}),
            'previous_events': context.get('previous_events', []),
            'location_constraints': context.get('location_constraints', {})
        }
        
        # Calculate initial event relevance scores
        for event_with_features in events_with_features:
            # Here we'd implement a more sophisticated relevance scoring algorithm
            # For now, we'll use a placeholder relevance score
            event_with_features['relevance_score'] = 0.75  # Placeholder
        
        # Sort events by relevance score (descending)
        events_with_features.sort(
            key=lambda x: x['relevance_score'],
            reverse=True
        )
        
        # Prepare the final input structure
        recommendation_input = {
            'tribe': {
                'id': tribe_data.get('id', ''),
                'name': tribe_data.get('name', ''),
                'features': tribe_features
            },
            'events': events_with_features,
            'context': processed_context,
            'parameters': {
                'max_recommendations': 5,
                'min_relevance_threshold': 0.6,
                'include_weather_sensitive': True,
                'include_explanations': True
            }
        }
        
        return recommendation_input
    
    except Exception as e:
        logger.error(f"Error preparing recommendation input: {str(e)}")
        return {}

def process_matching_output(model_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process and structure the output from the matching model
    
    Args:
        model_output: Raw output from the matching model
        
    Returns:
        Processed matching results
    """
    if not model_output:
        logger.warning("Empty model output for matching processing")
        return {}
    
    try:
        # Initialize processed results
        processed_results = {
            'matches': [],
            'match_count': 0,
            'explanation': ''
        }
        
        # Extract matches from model output
        if 'matches' in model_output and isinstance(model_output['matches'], list):
            matches = model_output['matches']
            
            processed_matches = []
            for match in matches:
                processed_match = {
                    'tribe_id': match.get('tribe_id', ''),
                    'tribe_name': match.get('tribe_name', ''),
                    'compatibility_score': float(match.get('compatibility_score', 0)),
                    'match_factors': match.get('match_factors', {}),
                    'explanation': match.get('explanation', '')
                }
                
                processed_matches.append(processed_match)
            
            # Sort by compatibility score (descending)
            processed_matches.sort(
                key=lambda x: x['compatibility_score'],
                reverse=True
            )
            
            processed_results['matches'] = processed_matches
            processed_results['match_count'] = len(processed_matches)
        
        # Extract explanation if available
        if 'explanation' in model_output:
            processed_results['explanation'] = model_output['explanation']
        
        return processed_results
    
    except Exception as e:
        logger.error(f"Error processing matching output: {str(e)}")
        return {'matches': [], 'match_count': 0}

def process_tribe_formation_output(model_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process and structure the output from the tribe formation model
    
    Args:
        model_output: Raw output from the tribe formation model
        
    Returns:
        Processed tribe formation results
    """
    if not model_output:
        logger.warning("Empty model output for tribe formation processing")
        return {}
    
    try:
        # Initialize processed results
        processed_results = {
            'tribes': [],
            'tribe_count': 0,
            'unassigned_users': [],
            'explanation': ''
        }
        
        # Extract formed tribes from model output
        if 'tribes' in model_output and isinstance(model_output['tribes'], list):
            tribes = model_output['tribes']
            
            processed_tribes = []
            for tribe in tribes:
                processed_tribe = {
                    'tribe_id': tribe.get('tribe_id', ''),
                    'name': tribe.get('name', ''),
                    'members': tribe.get('members', []),
                    'member_count': len(tribe.get('members', [])),
                    'balance_metrics': tribe.get('balance_metrics', {}),
                    'compatibility_metrics': tribe.get('compatibility_metrics', {}),
                    'explanation': tribe.get('explanation', '')
                }
                
                processed_tribes.append(processed_tribe)
            
            processed_results['tribes'] = processed_tribes
            processed_results['tribe_count'] = len(processed_tribes)
        
        # Extract unassigned users if available
        if 'unassigned_users' in model_output:
            processed_results['unassigned_users'] = model_output['unassigned_users']
        
        # Extract explanation if available
        if 'explanation' in model_output:
            processed_results['explanation'] = model_output['explanation']
        
        return processed_results
    
    except Exception as e:
        logger.error(f"Error processing tribe formation output: {str(e)}")
        return {'tribes': [], 'tribe_count': 0, 'unassigned_users': []}

def process_engagement_output(model_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process and structure the output from the engagement model
    
    Args:
        model_output: Raw output from the engagement model
        
    Returns:
        Processed engagement suggestions
    """
    if not model_output:
        logger.warning("Empty model output for engagement processing")
        return {}
    
    try:
        # Initialize processed results
        processed_results = {
            'prompts': [],
            'prompt_count': 0,
            'categories': {},
            'explanation': ''
        }
        
        # Extract engagement prompts from model output
        if 'prompts' in model_output and isinstance(model_output['prompts'], list):
            prompts = model_output['prompts']
            
            processed_prompts = []
            categories = {}
            
            for prompt in prompts:
                prompt_type = prompt.get('type', 'other')
                
                processed_prompt = {
                    'prompt_id': prompt.get('prompt_id', ''),
                    'type': prompt_type,
                    'content': prompt.get('content', ''),
                    'relevance_score': float(prompt.get('relevance_score', 0)),
                    'context_factors': prompt.get('context_factors', {}),
                    'explanation': prompt.get('explanation', '')
                }
                
                processed_prompts.append(processed_prompt)
                
                # Count prompts by category
                if prompt_type not in categories:
                    categories[prompt_type] = 0
                categories[prompt_type] += 1
            
            # Sort by relevance score (descending)
            processed_prompts.sort(
                key=lambda x: x['relevance_score'],
                reverse=True
            )
            
            processed_results['prompts'] = processed_prompts
            processed_results['prompt_count'] = len(processed_prompts)
            processed_results['categories'] = categories
        
        # Extract explanation if available
        if 'explanation' in model_output:
            processed_results['explanation'] = model_output['explanation']
        
        return processed_results
    
    except Exception as e:
        logger.error(f"Error processing engagement output: {str(e)}")
        return {'prompts': [], 'prompt_count': 0}

def process_recommendation_output(model_output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process and structure the output from the recommendation model
    
    Args:
        model_output: Raw output from the recommendation model
        
    Returns:
        Processed event recommendations
    """
    if not model_output:
        logger.warning("Empty model output for recommendation processing")
        return {}
    
    try:
        # Initialize processed results
        processed_results = {
            'recommendations': [],
            'recommendation_count': 0,
            'categories': {},
            'explanation': ''
        }
        
        # Extract recommendations from model output
        if 'recommendations' in model_output and isinstance(model_output['recommendations'], list):
            recommendations = model_output['recommendations']
            
            processed_recommendations = []
            categories = {}
            
            for recommendation in recommendations:
                event_type = recommendation.get('type', 'other')
                
                processed_recommendation = {
                    'event_id': recommendation.get('event_id', ''),
                    'name': recommendation.get('name', ''),
                    'type': event_type,
                    'relevance_score': float(recommendation.get('relevance_score', 0)),
                    'relevance_factors': recommendation.get('relevance_factors', {}),
                    'explanation': recommendation.get('explanation', '')
                }
                
                processed_recommendations.append(processed_recommendation)
                
                # Count recommendations by category
                if event_type not in categories:
                    categories[event_type] = 0
                categories[event_type] += 1
            
            # Sort by relevance score (descending)
            processed_recommendations.sort(
                key=lambda x: x['relevance_score'],
                reverse=True
            )
            
            processed_results['recommendations'] = processed_recommendations
            processed_results['recommendation_count'] = len(processed_recommendations)
            processed_results['categories'] = categories
        
        # Extract explanation if available
        if 'explanation' in model_output:
            processed_results['explanation'] = model_output['explanation']
        
        return processed_results
    
    except Exception as e:
        logger.error(f"Error processing recommendation output: {str(e)}")
        return {'recommendations': [], 'recommendation_count': 0}

class DataProcessor:
    """
    Base class for data processors with common functionality
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the DataProcessor with configuration
        
        Args:
            config: Configuration parameters
        """
        # Initialize logger
        self._logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
        # Initialize processor dictionaries
        self._processors = {}
        self._feature_extractors = {}
        
        # Store configuration
        self._config = config or {}
        
        self._logger.debug(f"Initialized {self.__class__.__name__} with config: {self._config}")
    
    def process(self, data: Dict[str, Any], data_type: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Process data based on its type
        
        Args:
            data: Data to process
            data_type: Type of data to process
            options: Processing options
            
        Returns:
            Processed data
        """
        if not data:
            self._logger.warning(f"Empty data for {data_type} processing")
            return {}
        
        if data_type not in self._processors:
            self._logger.warning(f"No processor registered for data type: {data_type}")
            return data
        
        options = options or {}
        
        try:
            return self._processors[data_type](data, options)
        except Exception as e:
            self._logger.error(f"Error processing {data_type} data: {str(e)}")
            return data
    
    def extract_features(self, data: Dict[str, Any], data_type: str, feature_types: List[str] = None) -> Dict[str, Any]:
        """
        Extract features from data based on its type
        
        Args:
            data: Data to extract features from
            data_type: Type of data
            feature_types: Types of features to extract
            
        Returns:
            Extracted features
        """
        if not data:
            self._logger.warning(f"Empty data for {data_type} feature extraction")
            return {}
        
        feature_types = feature_types or list(self._feature_extractors.keys())
        
        features = {}
        
        for feature_type in feature_types:
            if feature_type in self._feature_extractors:
                try:
                    features[feature_type] = self._feature_extractors[feature_type](data)
                except Exception as e:
                    self._logger.error(f"Error extracting {feature_type} features: {str(e)}")
                    features[feature_type] = {}
            else:
                self._logger.warning(f"No extractor registered for feature type: {feature_type}")
        
        return features
    
    def register_processor(self, data_type: str, processor_function: callable) -> None:
        """
        Register a custom processor function for a specific data type
        
        Args:
            data_type: Type of data to register processor for
            processor_function: Processing function
        """
        self._processors[data_type] = processor_function
        self._logger.info(f"Registered processor for data type: {data_type}")
    
    def register_feature_extractor(self, feature_type: str, extractor_function: callable) -> None:
        """
        Register a custom feature extractor for a specific feature type
        
        Args:
            feature_type: Type of features to register extractor for
            extractor_function: Feature extraction function
        """
        self._feature_extractors[feature_type] = extractor_function
        self._logger.info(f"Registered feature extractor for feature type: {feature_type}")
    
    def batch_process(self, data_items: List[Dict[str, Any]], data_type: str, options: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Process multiple data items in batch
        
        Args:
            data_items: List of data items to process
            data_type: Type of data to process
            options: Processing options
            
        Returns:
            List of processed data items
        """
        if not data_items:
            return []
        
        processed_items = []
        
        for item in data_items:
            processed_item = self.process(item, data_type, options)
            processed_items.append(processed_item)
        
        return processed_items

class ProfileProcessor(DataProcessor):
    """
    Specialized processor for user profile data
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the ProfileProcessor
        
        Args:
            config: Configuration parameters
        """
        super().__init__(config)
        
        # Initialize schema validator
        self._schema = UserProfileSchema()
        
        # Register default processors
        self.register_processor('profile', self.process_profile)
        
        # Register default feature extractors
        self.register_feature_extractor('personality', extract_personality_features)
        self.register_feature_extractor('interests', extract_interest_features)
        self.register_feature_extractor('communication', extract_communication_style_features)
    
    def process_profile(self, profile_data: Dict[str, Any], target_model: str = None) -> Dict[str, Any]:
        """
        Process a user profile for AI model input
        
        Args:
            profile_data: User profile data
            target_model: Target model for processing
            
        Returns:
            Processed profile data
        """
        if not profile_data:
            return {}
        
        # Normalize profile data
        normalized_profile = normalize_profile_data(profile_data)
        
        # Extract features based on target model
        features = {}
        
        if target_model == 'matching':
            # For matching, we need personality, interests, and communication style
            features = self.extract_features(
                normalized_profile, 
                'profile', 
                ['personality', 'interests', 'communication']
            )
        elif target_model == 'engagement':
            # For engagement, we focus more on interests and communication
            features = self.extract_features(
                normalized_profile, 
                'profile', 
                ['interests', 'communication']
            )
        else:
            # Default: extract all features
            features = self.extract_features(
                normalized_profile, 
                'profile'
            )
        
        # Combine normalized profile with extracted features
        processed_profile = {
            'basic_info': {
                'id': normalized_profile.get('id', ''),
                'name': normalized_profile.get('name', ''),
                'bio': normalized_profile.get('bio', ''),
                'location': normalized_profile.get('location', {})
            },
            'features': features
        }
        
        return processed_profile
    
    def extract_profile_features(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract comprehensive features from a user profile
        
        Args:
            profile_data: User profile data
            
        Returns:
            Extracted features
        """
        # Extract various feature types
        personality_features = extract_personality_features(profile_data)
        interest_features = extract_interest_features(profile_data)
        communication_features = extract_communication_style_features(profile_data)
        
        # Extract demographic and location features
        demographic_features = {}
        
        if 'birthdate' in profile_data:
            try:
                from datetime import datetime
                birthdate = datetime.fromisoformat(
                    profile_data['birthdate'].replace('Z', '+00:00')
                )
                now = datetime.now()
                age = now.year - birthdate.year - ((now.month, now.day) < (birthdate.month, birthdate.day))
                demographic_features['age'] = age
            except (ValueError, TypeError):
                pass
        
        location_features = {}
        
        if 'location' in profile_data and isinstance(profile_data['location'], dict):
            location = profile_data['location']
            
            if 'latitude' in location and 'longitude' in location:
                location_features['has_coordinates'] = True
                location_features['latitude'] = location['latitude']
                location_features['longitude'] = location['longitude']
            else:
                location_features['has_coordinates'] = False
        
        # Combine all features
        all_features = {
            'personality': personality_features,
            'interests': interest_features,
            'communication': communication_features,
            'demographic': demographic_features,
            'location': location_features
        }
        
        return all_features
    
    def batch_process_profiles(self, profiles: List[Dict[str, Any]], target_model: str = None) -> List[Dict[str, Any]]:
        """
        Process multiple user profiles in batch
        
        Args:
            profiles: List of profile data
            target_model: Target model for processing
            
        Returns:
            List of processed profiles
        """
        processed_profiles = []
        
        for profile in profiles:
            processed_profile = self.process_profile(profile, target_model)
            processed_profiles.append(processed_profile)
        
        return processed_profiles

class TribeProcessor(DataProcessor):
    """
    Specialized processor for tribe data
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the TribeProcessor
        
        Args:
            config: Configuration parameters
        """
        super().__init__(config)
        
        # Initialize schema validator
        self._schema = TribeSchema()
        
        # Register default processors
        self.register_processor('tribe', self.process_tribe)
        
        # Register default feature extractors
        self.register_feature_extractor('tribe', extract_tribe_features)
    
    def process_tribe(self, tribe_data: Dict[str, Any], target_model: str = None) -> Dict[str, Any]:
        """
        Process a tribe for AI model input
        
        Args:
            tribe_data: Tribe data
            target_model: Target model for processing
            
        Returns:
            Processed tribe data
        """
        if not tribe_data:
            return {}
        
        # Normalize tribe data
        normalized_tribe = normalize_tribe_data(tribe_data)
        
        # Extract features
        features = extract_tribe_features(normalized_tribe)
        
        # Process based on target model
        if target_model == 'matching':
            # For matching, focus on tribe composition and collective traits
            processed_tribe = {
                'basic_info': {
                    'id': normalized_tribe.get('id', ''),
                    'name': normalized_tribe.get('name', ''),
                    'description': normalized_tribe.get('description', ''),
                    'size': len(normalized_tribe.get('members', [])),
                    'status': normalized_tribe.get('status', 'forming')
                },
                'features': features
            }
        elif target_model == 'engagement':
            # For engagement, include additional activity and interaction data
            processed_tribe = {
                'basic_info': {
                    'id': normalized_tribe.get('id', ''),
                    'name': normalized_tribe.get('name', ''),
                    'description': normalized_tribe.get('description', ''),
                    'size': len(normalized_tribe.get('members', [])),
                    'status': normalized_tribe.get('status', 'forming')
                },
                'members': normalized_tribe.get('members', []),
                'activities': normalized_tribe.get('activities', []),
                'features': features
            }
        else:
            # Default processing
            processed_tribe = {
                'basic_info': {
                    'id': normalized_tribe.get('id', ''),
                    'name': normalized_tribe.get('name', ''),
                    'description': normalized_tribe.get('description', ''),
                    'size': len(normalized_tribe.get('members', [])),
                    'status': normalized_tribe.get('status', 'forming')
                },
                'members': normalized_tribe.get('members', []),
                'activities': normalized_tribe.get('activities', []),
                'interests': normalized_tribe.get('interests', []),
                'features': features
            }
        
        return processed_tribe
    
    def extract_tribe_features(self, tribe_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract comprehensive features from a tribe
        
        Args:
            tribe_data: Tribe data
            
        Returns:
            Extracted features
        """
        # Use the standalone function for tribe feature extraction
        return extract_tribe_features(tribe_data)
    
    def analyze_tribe_balance(self, tribe_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze the psychological balance of a tribe
        
        Args:
            tribe_data: Tribe data including member profiles
            
        Returns:
            Balance metrics
        """
        if not tribe_data or 'members' not in tribe_data:
            return {'balance_score': 0.0}
        
        try:
            members = tribe_data.get('members', [])
            member_profiles = tribe_data.get('member_profiles', [])
            
            # If member_profiles not provided, we can't analyze balance
            if not member_profiles:
                return {'balance_score': 0.0, 'error': 'Missing member profiles'}
            
            # Calculate trait distributions
            trait_distributions = {}
            communication_styles = {}
            interest_categories = {}
            
            for profile in member_profiles:
                # Analyze personality traits
                traits = profile.get('personalityTraits', [])
                for trait in traits:
                    trait_name = trait.get('name')
                    trait_score = trait.get('score')
                    
                    if trait_name and trait_score is not None:
                        if trait_name not in trait_distributions:
                            trait_distributions[trait_name] = []
                        
                        trait_distributions[trait_name].append(float(trait_score))
                
                # Analyze communication styles
                if 'communicationStyle' in profile:
                    for style, score in profile['communicationStyle'].items():
                        if style not in communication_styles:
                            communication_styles[style] = []
                        
                        communication_styles[style].append(float(score))
                
                # Analyze interests
                interests = profile.get('interests', [])
                for interest in interests:
                    category = interest.get('category')
                    
                    if category:
                        if category not in interest_categories:
                            interest_categories[category] = 0
                        
                        interest_categories[category] += 1
            
            # Calculate trait balance (std deviation for each trait)
            trait_balance = {}
            for trait, scores in trait_distributions.items():
                if len(scores) > 1:
                    # Lower std dev means more balanced
                    std_dev = np.std(scores)
                    # Convert to balance score (0-1, higher is better)
                    trait_balance[trait] = max(0.0, min(1.0, 1.0 - std_dev))
            
            # Calculate communication style compatibility
            style_balance = {}
            for style, scores in communication_styles.items():
                if len(scores) > 1:
                    std_dev = np.std(scores)
                    style_balance[style] = max(0.0, min(1.0, 1.0 - std_dev))
            
            # Calculate interest diversity
            interest_diversity = len(interest_categories) / len(INTEREST_CATEGORIES)
            
            # Calculate overall balance score
            trait_balance_avg = (
                sum(trait_balance.values()) / len(trait_balance)
                if trait_balance else 0.0
            )
            
            style_balance_avg = (
                sum(style_balance.values()) / len(style_balance)
                if style_balance else 0.0
            )
            
            # Weights for different factors
            weights = {
                'trait_balance': 0.4,
                'style_balance': 0.3,
                'interest_diversity': 0.3
            }
            
            overall_balance = (
                trait_balance_avg * weights['trait_balance'] +
                style_balance_avg * weights['style_balance'] +
                interest_diversity * weights['interest_diversity']
            )
            
            return {
                'balance_score': overall_balance,
                'trait_balance': trait_balance,
                'style_balance': style_balance,
                'interest_diversity': interest_diversity,
                'trait_distributions': trait_distributions,
                'communication_styles': communication_styles,
                'interest_categories': interest_categories
            }
            
        except Exception as e:
            self._logger.error(f"Error analyzing tribe balance: {str(e)}")
            return {'balance_score': 0.0, 'error': str(e)}
    
    def batch_process_tribes(self, tribes: List[Dict[str, Any]], target_model: str = None) -> List[Dict[str, Any]]:
        """
        Process multiple tribes in batch
        
        Args:
            tribes: List of tribe data
            target_model: Target model for processing
            
        Returns:
            List of processed tribes
        """
        processed_tribes = []
        
        for tribe in tribes:
            processed_tribe = self.process_tribe(tribe, target_model)
            processed_tribes.append(processed_tribe)
        
        return processed_tribes

class EventProcessor(DataProcessor):
    """
    Specialized processor for event data
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the EventProcessor
        
        Args:
            config: Configuration parameters
        """
        super().__init__(config)
        
        # Initialize schema validator
        self._schema = EventSchema()
        
        # Register default processors
        self.register_processor('event', self.process_event)
        
        # Register default feature extractors
        self.register_feature_extractor('event', extract_event_features)
    
    def process_event(self, event_data: Dict[str, Any], target_model: str = None) -> Dict[str, Any]:
        """
        Process an event for AI model input
        
        Args:
            event_data: Event data
            target_model: Target model for processing
            
        Returns:
            Processed event data
        """
        if not event_data:
            return {}
        
        # Normalize event data
        normalized_event = normalize_event_data(event_data)
        
        # Extract features
        features = extract_event_features(normalized_event)
        
        # Process based on target model
        if target_model == 'recommendation':
            # For recommendation, focus on relevance factors
            processed_event = {
                'basic_info': {
                    'id': normalized_event.get('id', ''),
                    'name': normalized_event.get('name', ''),
                    'description': normalized_event.get('description', ''),
                    'status': normalized_event.get('status', 'scheduled'),
                    'start_time': normalized_event.get('startTime', ''),
                    'location': normalized_event.get('location', {})
                },
                'features': features
            }
        else:
            # Default processing
            processed_event = {
                'basic_info': {
                    'id': normalized_event.get('id', ''),
                    'name': normalized_event.get('name', ''),
                    'description': normalized_event.get('description', ''),
                    'status': normalized_event.get('status', 'scheduled'),
                    'start_time': normalized_event.get('startTime', ''),
                    'end_time': normalized_event.get('endTime', ''),
                    'location': normalized_event.get('location', {})
                },
                'venue': normalized_event.get('venue', {}),
                'attendees': normalized_event.get('attendees', []),
                'weather_data': normalized_event.get('weatherData', {}),
                'features': features
            }
        
        return processed_event
    
    def extract_event_features(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract comprehensive features from an event
        
        Args:
            event_data: Event data
            
        Returns:
            Extracted features
        """
        # Use the standalone function for event feature extraction
        return extract_event_features(event_data)
    
    def calculate_event_tribe_compatibility(self, event_data: Dict[str, Any], tribe_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate compatibility between an event and a tribe
        
        Args:
            event_data: Event data
            tribe_data: Tribe data
            
        Returns:
            Compatibility metrics
        """
        if not event_data or not tribe_data:
            return {'compatibility_score': 0.0}
        
        try:
            # Extract event and tribe features
            event_features = extract_event_features(event_data)
            tribe_features = extract_tribe_features(tribe_data)
            
            # Initialize compatibility metrics
            compatibility = {
                'overall_score': 0.0,
                'interest_alignment': 0.0,
                'location_convenience': 0.0,
                'timing_compatibility': 0.0,
                'cost_compatibility': 0.0
            }
            
            # Calculate interest alignment
            if ('collective_interests' in tribe_features and 
                'top_interests' in tribe_features['collective_interests']):
                
                tribe_interests = set(tribe_features['collective_interests']['top_interests'])
                
                # Extract event keywords from name and description
                event_keywords = set()
                
                if 'name' in event_data and event_data['name']:
                    event_keywords.update(clean_text_data(event_data['name'], lowercase=True).split())
                
                if 'description' in event_data and event_data['description']:
                    event_keywords.update(clean_text_data(event_data['description'], lowercase=True).split())
                
                # Calculate basic text similarity (could be improved with NLP techniques)
                if tribe_interests and event_keywords:
                    interest_terms = ' '.join(tribe_interests).lower().split()
                    matches = sum(1 for term in interest_terms if term in event_keywords)
                    compatibility['interest_alignment'] = min(1.0, matches / len(interest_terms) if interest_terms else 0)
            
            # Calculate location convenience
            if ('location' in event_data and 'location' in tribe_data and
                'latitude' in event_data['location'] and 'longitude' in event_data['location'] and
                'latitude' in tribe_data['location'] and 'longitude' in tribe_data['location']):
                
                from math import radians, cos, sin, asin, sqrt
                
                # Haversine formula for distance calculation
                def haversine(lat1, lon1, lat2, lon2):
                    R = 6371  # Earth radius in kilometers
                    
                    dlat = radians(lat2 - lat1)
                    dlon = radians(lon2 - lon1)
                    lat1, lat2 = radians(lat1), radians(lat2)
                    
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a))
                    
                    return R * c
                
                # Calculate distance between event and tribe
                event_lat = event_data['location']['latitude']
                event_lon = event_data['location']['longitude']
                tribe_lat = tribe_data['location']['latitude']
                tribe_lon = tribe_data['location']['longitude']
                
                distance_km = haversine(event_lat, event_lon, tribe_lat, tribe_lon)
                
                # Convert distance to convenience score (closer = higher score)
                # We'll consider distances up to 20km, with 0km being a perfect 1.0
                # and 20km or more being 0.0
                max_distance = 20.0  # km
                compatibility['location_convenience'] = max(0.0, 1.0 - (distance_km / max_distance))
            
            # Calculate timing compatibility
            if 'startTime' in event_data:
                try:
                    from datetime import datetime
                    start_time = datetime.fromisoformat(
                        event_data['startTime'].replace('Z', '+00:00')
                    )
                    
                    # Assume weekends and evenings (after work) are more compatible
                    is_weekend = start_time.weekday() >= 5
                    is_evening = 17 <= start_time.hour < 22
                    
                    # Simple scoring based on time factors
                    if is_weekend:
                        compatibility['timing_compatibility'] += 0.6
                    elif is_evening:
                        compatibility['timing_compatibility'] += 0.4
                    else:
                        compatibility['timing_compatibility'] += 0.2
                    
                    # Add a bit more for Saturday (most popular day)
                    if start_time.weekday() == 5:  # Saturday
                        compatibility['timing_compatibility'] += 0.2
                    
                    # Cap at 1.0
                    compatibility['timing_compatibility'] = min(1.0, compatibility['timing_compatibility'])
                    
                except (ValueError, TypeError):
                    compatibility['timing_compatibility'] = 0.5  # Default if parsing fails
            
            # Calculate cost compatibility (assumes lower cost is better)
            if 'cost' in event_data:
                try:
                    cost = float(event_data['cost'])
                    
                    # Convert cost to compatibility score (lower cost = higher score)
                    # We'll consider costs up to $100, with $0 being a perfect 1.0
                    # and $100 or more being 0.0
                    max_cost = 100.0
                    compatibility['cost_compatibility'] = max(0.0, 1.0 - (cost / max_cost))
                except (ValueError, TypeError):
                    compatibility['cost_compatibility'] = 0.5  # Default if parsing fails
            
            # Calculate overall compatibility score with weighted components
            weights = {
                'interest_alignment': 0.4,
                'location_convenience': 0.3,
                'timing_compatibility': 0.2,
                'cost_compatibility': 0.1
            }
            
            weighted_sum = sum(
                compatibility[factor] * weight
                for factor, weight in weights.items()
            )
            
            compatibility['overall_score'] = weighted_sum
            compatibility['component_weights'] = weights
            
            return compatibility
        
        except Exception as e:
            self._logger.error(f"Error calculating event-tribe compatibility: {str(e)}")
            return {'compatibility_score': 0.0, 'error': str(e)}
    
    def batch_process_events(self, events: List[Dict[str, Any]], target_model: str = None) -> List[Dict[str, Any]]:
        """
        Process multiple events in batch
        
        Args:
            events: List of event data
            target_model: Target model for processing
            
        Returns:
            List of processed events
        """
        processed_events = []
        
        for event in events:
            processed_event = self.process_event(event, target_model)
            processed_events.append(processed_event)
        
        return processed_events

class MatchingProcessor(DataProcessor):
    """
    Specialized processor for matchmaking operations
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the MatchingProcessor
        
        Args:
            config: Configuration parameters
        """
        super().__init__(config)
        
        # Initialize profile and tribe processors
        self._profile_processor = ProfileProcessor(config)
        self._tribe_processor = TribeProcessor(config)
        
        # Register default processors
        self.register_processor('matching', self.prepare_user_tribe_matching)
        self.register_processor('tribe_formation', self.prepare_tribe_formation)
    
    def prepare_user_tribe_matching(self, user_profile: Dict[str, Any], tribes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare data for matching a user to tribes
        
        Args:
            user_profile: User profile data
            tribes: List of tribe data
            
        Returns:
            Prepared matching input
        """
        # Process user profile
        processed_profile = self._profile_processor.process_profile(user_profile, 'matching')
        
        # Process each tribe
        processed_tribes = self._tribe_processor.batch_process_tribes(tribes, 'matching')
        
        # Calculate compatibility for each user-tribe pair
        compatibilities = []
        
        for tribe in tribes:
            compatibility = calculate_compatibility_features(user_profile, tribe)
            
            compatibilities.append({
                'tribe_id': tribe.get('id', ''),
                'tribe_name': tribe.get('name', ''),
                'compatibility_score': compatibility.get('overall_score', 0.0),
                'compatibility_factors': compatibility
            })
        
        # Sort by compatibility score (descending)
        compatibilities.sort(
            key=lambda x: x['compatibility_score'],
            reverse=True
        )
        
        # Prepare the final matching input
        matching_input = {
            'user': processed_profile,
            'tribes': processed_tribes,
            'compatibilities': compatibilities,
            'parameters': {
                'min_compatibility_threshold': 0.7,
                'max_recommendations': 5
            }
        }
        
        return matching_input
    
    def prepare_tribe_formation(self, user_profiles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare data for forming new tribes from users
        
        Args:
            user_profiles: List of user profile data
            
        Returns:
            Prepared tribe formation input
        """
        # Process user profiles
        processed_profiles = self._profile_processor.batch_process_profiles(user_profiles, 'matching')
        
        # Calculate pairwise compatibility between all users
        pairwise_compatibility = []
        
        for i, user1 in enumerate(user_profiles):
            for j, user2 in enumerate(user_profiles):
                if i < j:  # Only calculate once for each pair
                    # Create a simplified "tribe" from user2 for compatibility calculation
                    dummy_tribe = {
                        'id': user2.get('id', ''),
                        'name': user2.get('name', ''),
                        'description': user2.get('bio', ''),
                        'members': [{'userId': user2.get('id', '')}],
                        'location': user2.get('location', {}),
                        'interests': user2.get('interests', []),
                        'personalityTraits': user2.get('personalityTraits', [])
                    }
                    
                    compatibility = calculate_compatibility_features(user1, dummy_tribe)
                    
                    pairwise_compatibility.append({
                        'user1_id': user1.get('id', ''),
                        'user2_id': user2.get('id', ''),
                        'compatibility_score': compatibility.get('overall_score', 0.0),
                        'compatibility_factors': compatibility
                    })
        
        # Prepare the tribe formation input
        formation_input = {
            'users': processed_profiles,
            'pairwise_compatibility': pairwise_compatibility,
            'parameters': {
                'min_tribe_size': 4,
                'max_tribe_size': 8,
                'min_compatibility_threshold': 0.5
            }
        }
        
        return formation_input
    
    def process_matching_results(self, model_output: Dict[str, Any], matching_type: str = 'user_tribe') -> Dict[str, Any]:
        """
        Process and structure matching model results
        
        Args:
            model_output: Raw output from matching model
            matching_type: Type of matching (user_tribe or tribe_formation)
            
        Returns:
            Processed matching results
        """
        if matching_type == 'user_tribe':
            return process_matching_output(model_output)
        elif matching_type == 'tribe_formation':
            return process_tribe_formation_output(model_output)
        else:
            self._logger.warning(f"Unknown matching type: {matching_type}")
            return {}
    
    def calculate_compatibility_score(self, user_features: Dict[str, Any], tribe_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate a comprehensive compatibility score
        
        Args:
            user_features: User features
            tribe_features: Tribe features
            
        Returns:
            Compatibility scores and factors
        """
        # This is a wrapper around the standalone compatibility calculation function
        # that works with already extracted features
        
        compatibility = {
            'overall_score': 0.0,
            'personality_compatibility': 0.0,
            'interest_overlap': 0.0,
            'communication_compatibility': 0.0,
            'location_proximity': 0.0
        }
        
        try:
            # Calculate personality compatibility
            if 'personality' in user_features and 'collective_personality' in tribe_features:
                user_personality = user_features['personality']
                tribe_personality = tribe_features['collective_personality']
                
                # Here we'd implement a more sophisticated compatibility algorithm
                # For now, we'll use a placeholder value
                compatibility['personality_compatibility'] = 0.75  # Placeholder
            
            # Calculate interest overlap
            if 'interests' in user_features and 'collective_interests' in tribe_features:
                user_interests = user_features['interests']
                tribe_interests = tribe_features['collective_interests']
                
                if 'top_interests' in user_interests and 'top_interests' in tribe_interests:
                    user_top = set(user_interests['top_interests'])
                    tribe_top = set(tribe_interests['top_interests'])
                    
                    if user_top and tribe_top:
                        # Calculate Jaccard similarity (intersection over union)
                        intersection = len(user_top.intersection(tribe_top))
                        union = len(user_top.union(tribe_top))
                        
                        if union > 0:
                            compatibility['interest_overlap'] = intersection / union
            
            # Calculate communication compatibility
            if 'communication' in user_features:
                # Here we'd implement a more sophisticated compatibility algorithm
                # For now, we'll use a placeholder value
                compatibility['communication_compatibility'] = 0.8  # Placeholder
            
            # Calculate location proximity
            if ('location' in user_features and 'location' in tribe_features and
                'has_coordinates' in user_features['location'] and user_features['location']['has_coordinates'] and
                'has_coordinates' in tribe_features['location'] and tribe_features['location']['has_coordinates']):
                
                # Already calculated feature
                compatibility['location_proximity'] = 0.85  # Placeholder
            
            # Calculate overall compatibility score
            weights = {
                'personality_compatibility': 0.35,
                'interest_overlap': 0.30,
                'communication_compatibility': 0.20,
                'location_proximity': 0.15
            }
            
            weighted_sum = sum(
                compatibility[factor] * weight
                for factor, weight in weights.items()
            )
            
            compatibility['overall_score'] = weighted_sum
            compatibility['component_weights'] = weights
            
            return compatibility
            
        except Exception as e:
            self._logger.error(f"Error calculating compatibility score: {str(e)}")
            return {'overall_score': 0.0, 'error': str(e)}

class EngagementProcessor(DataProcessor):
    """
    Specialized processor for engagement operations
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the EngagementProcessor
        
        Args:
            config: Configuration parameters
        """
        super().__init__(config)
        
        # Initialize tribe and profile processors
        self._tribe_processor = TribeProcessor(config)
        self._profile_processor = ProfileProcessor(config)
        
        # Register default processors
        self.register_processor('engagement', self.prepare_engagement_prompt)
    
    def prepare_engagement_prompt(self, tribe_data: Dict[str, Any], member_profiles: List[Dict[str, Any]], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare data for generating engagement prompts
        
        Args:
            tribe_data: Tribe data
            member_profiles: List of member profile data
            context: Contextual information for engagement
            
        Returns:
            Prepared engagement input
        """
        # Process tribe data
        processed_tribe = self._tribe_processor.process_tribe(tribe_data, 'engagement')
        
        # Process member profiles
        processed_members = self._profile_processor.batch_process_profiles(member_profiles, 'engagement')
        
        # Process context information
        processed_context = {
            'current_engagement_level': context.get('engagement_level', 'medium'),
            'recent_activities': context.get('recent_activities', []),
            'time_since_last_activity': context.get('time_since_last_activity', 0),
            'upcoming_events': context.get('upcoming_events', []),
            'weather_conditions': context.get('weather_conditions', {}),
            'previous_prompts': context.get('previous_prompts', [])
        }
        
        # Determine prompt types based on engagement level
        prompt_types = []
        
        if processed_context['current_engagement_level'] == 'low':
            # For low engagement, focus on conversation starters and simple activities
            prompt_types = ['conversation', 'simple_activity']
        elif processed_context['current_engagement_level'] == 'medium':
            # For medium engagement, suggest more involved activities and challenges
            prompt_types = ['activity', 'challenge', 'conversation']
        else:  # high engagement
            # For high engagement, focus on meetup planning and deeper discussions
            prompt_types = ['meetup', 'challenge', 'deep_conversation']
        
        # Prepare the engagement input
        engagement_input = {
            'tribe': processed_tribe,
            'members': processed_members,
            'context': processed_context,
            'parameters': {
                'prompt_types': prompt_types,
                'num_suggestions': 3
            }
        }
        
        return engagement_input
    
    def analyze_engagement_level(self, tribe_data: Dict[str, Any], activity_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze the current engagement level of a tribe
        
        Args:
            tribe_data: Tribe data
            activity_history: List of activity data
            
        Returns:
            Engagement metrics
        """
        if not tribe_data or not activity_history:
            return {'engagement_level': 'low'}
        
        try:
            # Initialize engagement metrics
            metrics = {
                'message_frequency': 0.0,
                'message_distribution': {},
                'response_rates': {},
                'event_participation': 0.0,
                'active_members': 0,
                'inactive_members': 0,
                'overall_engagement': 0.0
            }
            
            # Extract member information
            members = tribe_data.get('members', [])
            member_ids = {member.get('userId') for member in members if 'userId' in member}
            member_count = len(member_ids)
            
            if member_count == 0:
                return {'engagement_level': 'low'}
            
            # Count activities by type and by member
            activity_counts = {}
            member_activity_counts = {member_id: 0 for member_id in member_ids}
            
            from datetime import datetime, timedelta
            now = datetime.now()
            
            # Define time windows
            recent_window = now - timedelta(days=7)  # Last 7 days
            
            recent_activity_count = 0
            
            for activity in activity_history:
                activity_type = activity.get('type')
                user_id = activity.get('userId')
                
                # Count by activity type
                if activity_type:
                    if activity_type not in activity_counts:
                        activity_counts[activity_type] = 0
                    activity_counts[activity_type] += 1
                
                # Count by member
                if user_id in member_ids:
                    member_activity_counts[user_id] += 1
                
                # Check if activity is recent
                if 'timestamp' in activity:
                    try:
                        timestamp = datetime.fromisoformat(
                            activity['timestamp'].replace('Z', '+00:00')
                        )
                        if timestamp >= recent_window:
                            recent_activity_count += 1
                    except (ValueError, TypeError):
                        pass
            
            # Calculate message frequency (messages per day)
            if 'message' in activity_counts:
                # Assume history covers 30 days if no explicit timeframe
                days_covered = 30
                metrics['message_frequency'] = activity_counts['message'] / days_covered
            
            # Calculate message distribution across members
            # Higher values mean more balanced participation
            if member_count > 1:
                message_counts = []
                for member_id in member_ids:
                    message_counts.append(member_activity_counts.get(member_id, 0))
                
                # Calculate Gini coefficient (measure of inequality)
                # 0 means perfect equality, 1 means perfect inequality
                message_counts.sort()
                n = len(message_counts)
                if n > 0 and sum(message_counts) > 0:
                    # Calculate Gini coefficient
                    gini = sum((2 * i - n - 1) * message_counts[i] for i in range(n))
                    gini = gini / (n * sum(message_counts))
                    
                    # Convert to distribution score (1 - gini)
                    # Higher value means more equal distribution
                    metrics['message_distribution'] = 1 - gini
            
            # Calculate event participation rate
            if 'event' in activity_counts and 'event_attended' in activity_counts:
                events_created = activity_counts['event']
                events_attended = activity_counts['event_attended']
                
                if events_created > 0:
                    metrics['event_participation'] = events_attended / (events_created * member_count)
            
            # Identify active and inactive members
            active_threshold = 5  # Minimum activities to be considered active
            
            for member_id, count in member_activity_counts.items():
                if count >= active_threshold:
                    metrics['active_members'] += 1
                else:
                    metrics['inactive_members'] += 1
            
            # Calculate overall engagement score
            # Weighted combination of various metrics
            weights = {
                'message_frequency': 0.3,
                'message_distribution': 0.2,
                'event_participation': 0.3,
                'active_ratio': 0.2
            }
            
            # Calculate active member ratio
            active_ratio = metrics['active_members'] / member_count if member_count > 0 else 0
            
            # Normalize message frequency (cap at 5 messages per day)
            normalized_frequency = min(1.0, metrics['message_frequency'] / 5)
            
            weighted_sum = (
                normalized_frequency * weights['message_frequency'] +
                metrics['message_distribution'] * weights['message_distribution'] +
                metrics['event_participation'] * weights['event_participation'] +
                active_ratio * weights['active_ratio']
            )
            
            metrics['overall_engagement'] = weighted_sum
            
            # Determine engagement level
            if metrics['overall_engagement'] < 0.3:
                engagement_level = 'low'
            elif metrics['overall_engagement'] < 0.7:
                engagement_level = 'medium'
            else:
                engagement_level = 'high'
            
            metrics['engagement_level'] = engagement_level
            metrics['recent_activity_count'] = recent_activity_count
            
            return metrics
        
        except Exception as e:
            self._logger.error(f"Error analyzing engagement level: {str(e)}")
            return {'engagement_level': 'low', 'error': str(e)}
    
    def process_engagement_results(self, model_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and structure engagement model results
        
        Args:
            model_output: Raw output from engagement model
            
        Returns:
            Processed engagement suggestions
        """
        return process_engagement_output(model_output)

class RecommendationProcessor(DataProcessor):
    """
    Specialized processor for recommendation operations
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the RecommendationProcessor
        
        Args:
            config: Configuration parameters
        """
        super().__init__(config)
        
        # Initialize tribe and event processors
        self._tribe_processor = TribeProcessor(config)
        self._event_processor = EventProcessor(config)
        
        # Register default processors
        self.register_processor('recommendation', self.prepare_event_recommendations)
    
    def prepare_event_recommendations(self, tribe_data: Dict[str, Any], events: List[Dict[str, Any]], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare data for generating event recommendations
        
        Args:
            tribe_data: Tribe data
            events: List of event data
            context: Contextual information for recommendations
            
        Returns:
            Prepared recommendation input
        """
        # Process tribe data
        processed_tribe = self._tribe_processor.process_tribe(tribe_data, 'recommendation')
        
        # Process events
        processed_events = self._event_processor.batch_process_events(events, 'recommendation')
        
        # Process context information
        processed_context = {
            'weather_forecast': context.get('weather_forecast', {}),
            'time_of_day': context.get('time_of_day', ''),
            'day_of_week': context.get('day_of_week', ''),
            'budget_constraints': context.get('budget_constraints', {}),
            'previous_events': context.get('previous_events', []),
            'location_constraints': context.get('location_constraints', {})
        }
        
        # Calculate event relevance for each event
        for i, event in enumerate(processed_events):
            event_relevance = self.calculate_event_relevance(
                processed_tribe.get('features', {}),
                event.get('features', {}),
                processed_context
            )
            
            processed_events[i]['relevance'] = event_relevance
        
        # Sort events by relevance score (descending)
        processed_events.sort(
            key=lambda x: x.get('relevance', {}).get('overall_score', 0),
            reverse=True
        )
        
        # Prepare the recommendation input
        recommendation_input = {
            'tribe': processed_tribe,
            'events': processed_events,
            'context': processed_context,
            'parameters': {
                'max_recommendations': 5,
                'min_relevance_threshold': 0.6
            }
        }
        
        return recommendation_input
    
    def calculate_event_relevance(self, tribe_features: Dict[str, Any], event_features: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate relevance scores for events based on tribe preferences
        
        Args:
            tribe_features: Tribe features
            event_features: Event features
            context: Contextual information
            
        Returns:
            Relevance scores and factors
        """
        if not tribe_features or not event_features:
            return {'overall_score': 0.0}
        
        try:
            # Initialize relevance metrics
            relevance = {
                'overall_score': 0.0,
                'interest_alignment': 0.0,
                'location_convenience': 0.0,
                'timing_compatibility': 0.0,
                'weather_compatibility': 0.0,
                'cost_factor': 0.0
            }
            
            # Calculate interest alignment
            if ('collective_interests' in tribe_features and 
                'top_interests' in tribe_features['collective_interests']):
                
                tribe_interests = set(tribe_features['collective_interests']['top_interests'])
                
                # Extract event keywords from basic attributes
                if 'basic_attributes' in event_features:
                    event_name = event_features['basic_attributes'].get('name', '')
                    event_description = event_features['basic_attributes'].get('description', '')
                    
                    event_keywords = set()
                    
                    if event_name:
                        event_keywords.update(clean_text_data(event_name, lowercase=True).split())
                    
                    if event_description:
                        event_keywords.update(clean_text_data(event_description, lowercase=True).split())
                    
                    # Calculate basic text similarity (could be improved with NLP techniques)
                    if tribe_interests and event_keywords:
                        interest_terms = ' '.join(tribe_interests).lower().split()
                        matches = sum(1 for term in interest_terms if any(term in keyword for keyword in event_keywords))
                        relevance['interest_alignment'] = min(1.0, matches / len(interest_terms) if interest_terms else 0)
            
            # Calculate location convenience
            if ('location_features' in event_features and 
                'location' in context.get('location_constraints', {})):
                
                # Check if we have coordinates for both
                if ('has_coordinates' in event_features['location_features'] and 
                    event_features['location_features']['has_coordinates'] and
                    'latitude' in context['location_constraints']['location'] and 
                    'longitude' in context['location_constraints']['location']):
                    
                    event_lat = event_features['location_features']['latitude']
                    event_lon = event_features['location_features']['longitude']
                    constraint_lat = context['location_constraints']['location']['latitude']
                    constraint_lon = context['location_constraints']['location']['longitude']
                    
                    from math import radians, cos, sin, asin, sqrt
                    
                    # Haversine formula for distance calculation
                    def haversine(lat1, lon1, lat2, lon2):
                        R = 6371  # Earth radius in kilometers
                        
                        dlat = radians(lat2 - lat1)
                        dlon = radians(lon2 - lon1)
                        lat1, lat2 = radians(lat1), radians(lat2)
                        
                        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                        c = 2 * asin(sqrt(a))
                        
                        return R * c
                    
                    distance_km = haversine(event_lat, event_lon, constraint_lat, constraint_lon)
                    
                    # Convert distance to convenience score (closer = higher score)
                    max_distance = context['location_constraints'].get('max_distance_km', 20.0)
                    relevance['location_convenience'] = max(0.0, 1.0 - (distance_km / max_distance))
            
            # Calculate timing compatibility
            if 'temporal_features' in event_features:
                temporal = event_features['temporal_features']
                
                # Default to medium compatibility
                relevance['timing_compatibility'] = 0.5
                
                # Check if event matches preferred day of week
                if 'day_of_week' in context and 'day_of_week' in temporal:
                    if context['day_of_week'] == temporal['day_of_week']:
                        relevance['timing_compatibility'] += 0.3
                
                # Check if event matches preferred time of day
                if 'time_of_day' in context and 'is_evening' in temporal:
                    if (context['time_of_day'] == 'evening' and temporal['is_evening']) or \
                       (context['time_of_day'] == 'day' and not temporal['is_evening']):
                        relevance['timing_compatibility'] += 0.2
                
                # Cap at 1.0
                relevance['timing_compatibility'] = min(1.0, relevance['timing_compatibility'])
            
            # Calculate weather compatibility
            if 'weather_features' in event_features and 'weather_forecast' in context:
                weather = event_features['weather_features']
                forecast = context['weather_forecast']
                
                # Default to medium compatibility
                relevance['weather_compatibility'] = 0.5
                
                # Check if weather conditions match
                if 'condition' in weather and 'condition' in forecast:
                    if weather['condition'] == forecast['condition']:
                        relevance['weather_compatibility'] += 0.3
                
                # Check if event is suitable for forecasted weather
                if 'is_suitable_for_outdoor' in weather and 'is_suitable_for_outdoor' in forecast:
                    if weather['is_suitable_for_outdoor'] == forecast['is_suitable_for_outdoor']:
                        relevance['weather_compatibility'] += 0.2
                
                # Cap at 1.0
                relevance['weather_compatibility'] = min(1.0, relevance['weather_compatibility'])
            
            # Calculate cost factor
            if 'basic_attributes' in event_features and 'budget_constraints' in context:
                cost = event_features['basic_attributes'].get('cost', 0.0)
                budget = context['budget_constraints'].get('max_budget', 100.0)
                
                # Convert cost to budget compatibility (lower cost = higher score)
                if budget > 0:
                    relevance['cost_factor'] = max(0.0, 1.0 - (cost / budget))
            
            # Calculate overall relevance score
            weights = {
                'interest_alignment': 0.35,
                'location_convenience': 0.25,
                'timing_compatibility': 0.15,
                'weather_compatibility': 0.15,
                'cost_factor': 0.10
            }
            
            weighted_sum = sum(
                relevance[factor] * weight
                for factor, weight in weights.items()
            )
            
            relevance['overall_score'] = weighted_sum
            relevance['component_weights'] = weights
            
            return relevance
        
        except Exception as e:
            self._logger.error(f"Error calculating event relevance: {str(e)}")
            return {'overall_score': 0.0, 'error': str(e)}
    
    def process_recommendation_results(self, model_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and structure recommendation model results
        
        Args:
            model_output: Raw output from recommendation model
            
        Returns:
            Processed recommendations
        """
        return process_recommendation_output(model_output)

class FeatureExtractor:
    """
    Utility class for extracting features from various data types
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the FeatureExtractor
        
        Args:
            config: Configuration parameters
        """
        # Initialize logger
        self._logger = logging.getLogger(f"{__name__}.FeatureExtractor")
        
        # Initialize extractors and transformers
        self._extractors = {}
        self._transformers = {}
        
        # Store configuration
        self._config = config or {}
        
        # Register default extractors
        self._extractors = {
            'personality': extract_personality_features,
            'interests': extract_interest_features,
            'communication': extract_communication_style_features,
            'tribe': extract_tribe_features,
            'event': extract_event_features
        }
        
        # Register default transformers
        self._transformers = {
            'matching': self._transform_for_matching,
            'engagement': self._transform_for_engagement,
            'recommendation': self._transform_for_recommendation
        }
        
        self._logger.debug("FeatureExtractor initialized")
    
    def extract(self, data: Dict[str, Any], feature_type: str) -> Dict[str, Any]:
        """
        Extract features from data based on feature type
        
        Args:
            data: Data to extract features from
            feature_type: Type of features to extract
            
        Returns:
            Extracted features
        """
        if not data:
            self._logger.warning(f"Empty data for {feature_type} feature extraction")
            return {}
        
        if feature_type not in self._extractors:
            self._logger.warning(f"No extractor registered for feature type: {feature_type}")
            return {}
        
        try:
            return self._extractors[feature_type](data)
        except Exception as e:
            self._logger.error(f"Error extracting {feature_type} features: {str(e)}")
            return {}
    
    def transform(self, features: Dict[str, Any], model_type: str) -> Dict[str, Any]:
        """
        Transform features for a specific model
        
        Args:
            features: Features to transform
            model_type: Type of model to transform for
            
        Returns:
            Transformed features
        """
        if not features:
            self._logger.warning(f"Empty features for {model_type} transformation")
            return {}
        
        if model_type not in self._transformers:
            self._logger.warning(f"No transformer registered for model type: {model_type}")
            return features
        
        try:
            return self._transformers[model_type](features)
        except Exception as e:
            self._logger.error(f"Error transforming features for {model_type}: {str(e)}")
            return features
    
    def register_extractor(self, feature_type: str, extractor_function: callable) -> None:
        """
        Register a custom feature extractor
        
        Args:
            feature_type: Type of features to register extractor for
            extractor_function: Feature extraction function
        """
        self._extractors[feature_type] = extractor_function
        self._logger.info(f"Registered feature extractor for type: {feature_type}")
    
    def register_transformer(self, model_type: str, transformer_function: callable) -> None:
        """
        Register a custom feature transformer
        
        Args:
            model_type: Type of model to register transformer for
            transformer_function: Feature transformation function
        """
        self._transformers[model_type] = transformer_function
        self._logger.info(f"Registered feature transformer for model: {model_type}")
    
    def _transform_for_matching(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Transform features for matching models"""
        transformed = features.copy()
        
        # Add any matching-specific transformations here
        
        return transformed
    
    def _transform_for_engagement(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Transform features for engagement models"""
        transformed = features.copy()
        
        # Add any engagement-specific transformations here
        
        return transformed
    
    def _transform_for_recommendation(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Transform features for recommendation models"""
        transformed = features.copy()
        
        # Add any recommendation-specific transformations here
        
        return transformed