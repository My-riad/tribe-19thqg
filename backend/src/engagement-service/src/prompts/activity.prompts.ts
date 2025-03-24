import { PromptType, PromptCategory, IPromptCreate } from '../models/prompt.model';

/**
 * Collection of outdoor activity suggestion prompts for Tribe engagement
 */
export const OUTDOOR_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: 'How about a group hike at {{localTrail}} this weekend? The weather looks perfect for outdoor adventures!',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['outdoor', 'hiking', 'nature', 'weekend'],
    interestCategories: ['Outdoor Adventures'],
    personalityTraits: ['Adventurous', 'Active'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'moderate'
    }
  },
  {
    content: "Anyone interested in a bike ride along {{localBikePath}}? It's a great way to explore the city together!",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['outdoor', 'biking', 'exploration', 'active'],
    interestCategories: ['Outdoor Adventures', 'Sports & Fitness'],
    personalityTraits: ['Active', 'Adventurous'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-3 hours',
      physicalIntensity: 'moderate'
    }
  },
  {
    content: "Let's have a picnic at {{localPark}} on {{dayOfWeek}}! Everyone can bring something to share.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['outdoor', 'picnic', 'food', 'social'],
    interestCategories: ['Outdoor Adventures', 'Food & Dining'],
    personalityTraits: ['Social', 'Relaxed'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low'
    }
  },
  {
    content: 'How about we try {{outdoorActivity}} at {{localVenue}}? It could be a fun way to challenge ourselves as a group!',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['outdoor', 'adventure', 'challenge', 'group activity'],
    interestCategories: ['Outdoor Adventures', 'Sports & Fitness'],
    personalityTraits: ['Adventurous', 'Competitive'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'high'
    }
  },
  {
    content: "There's a beautiful sunset viewpoint at {{localSpot}}. Should we plan an evening gathering there this week?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['outdoor', 'sunset', 'relaxing', 'nature'],
    interestCategories: ['Outdoor Adventures', 'Photography'],
    personalityTraits: ['Appreciative', 'Relaxed'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'low',
      timeOfDay: 'evening'
    }
  }
];

/**
 * Collection of indoor activity suggestion prompts for Tribe engagement
 */
export const INDOOR_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: 'Would anyone be interested in a board game night at {{localCafe}} this {{dayOfWeek}}?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['indoor', 'board games', 'cafe', 'evening'],
    interestCategories: ['Games & Entertainment'],
    personalityTraits: ['Social', 'Competitive'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'low'
    }
  },
  {
    content: "There's an interesting workshop on {{workshopTopic}} at {{localVenue}} next week. Should we sign up as a group?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['indoor', 'workshop', 'learning', 'skill'],
    interestCategories: ['Learning & Education', 'Arts & Culture'],
    personalityTraits: ['Curious', 'Creative'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low'
    }
  },
  {
    content: "How about we check out the new {{exhibitType}} exhibit at {{localMuseum}}? It's getting great reviews!",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['indoor', 'museum', 'art', 'culture'],
    interestCategories: ['Arts & Culture'],
    personalityTraits: ['Intellectual', 'Appreciative'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-3 hours',
      physicalIntensity: 'low'
    }
  },
  {
    content: 'Anyone up for a movie night? {{newRelease}} is playing at {{localTheater}} this weekend.',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['indoor', 'movie', 'entertainment', 'weekend'],
    interestCategories: ['Games & Entertainment'],
    personalityTraits: ['Relaxed', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low'
    }
  },
  {
    content: "Let's try an escape room challenge at {{localVenue}}! It would be a great way to test our teamwork.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['indoor', 'escape room', 'puzzle', 'teamwork'],
    interestCategories: ['Games & Entertainment'],
    personalityTraits: ['Analytical', 'Collaborative'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'low',
      groupSize: '4-8'
    }
  }
];

/**
 * Collection of food-related activity suggestion prompts for Tribe engagement
 */
export const FOOD_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: "Let's try that new {{cuisineType}} restaurant, {{restaurantName}}! I've heard their {{specialDish}} is amazing.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['food', 'dining', 'restaurant', 'cuisine'],
    interestCategories: ['Food & Dining'],
    personalityTraits: ['Adventurous', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1.5-2.5 hours',
      physicalIntensity: 'low',
      priceRange: '$$-$$$'
    }
  },
  {
    content: 'How about a cooking class together? {{localCookingSchool}} is offering a {{cuisineType}} workshop next {{dayOfWeek}}.',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['food', 'cooking', 'class', 'learning'],
    interestCategories: ['Food & Dining', 'Learning & Education'],
    personalityTraits: ['Creative', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low',
      priceRange: '$$-$$$'
    }
  },
  {
    content: "There's a food festival happening at {{localVenue}} this weekend. Should we check it out together?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['food', 'festival', 'weekend', 'variety'],
    interestCategories: ['Food & Dining', 'Arts & Culture'],
    personalityTraits: ['Adventurous', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'low',
      priceRange: '$-$$'
    }
  },
  {
    content: "Let's do a progressive dinner! We could visit different restaurants for appetizers, main course, and dessert.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['food', 'dining', 'adventure', 'social'],
    interestCategories: ['Food & Dining', 'Urban Exploration'],
    personalityTraits: ['Social', 'Adventurous'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '3-4 hours',
      physicalIntensity: 'low',
      priceRange: '$$-$$$'
    }
  },
  {
    content: 'Anyone interested in a wine/beer tasting at {{localVenue}}? They have a great selection of local options.',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['food', 'drinks', 'tasting', 'social'],
    interestCategories: ['Food & Dining'],
    personalityTraits: ['Social', 'Appreciative'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1.5-2.5 hours',
      physicalIntensity: 'low',
      priceRange: '$$',
      ageRestriction: '21+'
    }
  }
];

/**
 * Collection of cultural activity suggestion prompts for Tribe engagement
 */
export const CULTURAL_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: "There's a {{performanceType}} performance at {{localVenue}} next {{dayOfWeek}}. Would anyone be interested in going?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['culture', 'performance', 'arts', 'evening'],
    interestCategories: ['Arts & Culture'],
    personalityTraits: ['Appreciative', 'Intellectual'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low',
      priceRange: '$$-$$$'
    }
  },
  {
    content: "Let's visit the {{exhibitName}} exhibition at {{localMuseum}}. It's only here until {{endDate}}!",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['culture', 'museum', 'art', 'exhibition'],
    interestCategories: ['Arts & Culture', 'Learning & Education'],
    personalityTraits: ['Intellectual', 'Appreciative'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1.5-2.5 hours',
      physicalIntensity: 'low',
      priceRange: '$-$$'
    }
  },
  {
    content: "There's a cultural festival celebrating {{cultureName}} heritage at {{localVenue}} this weekend. Should we experience it together?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['culture', 'festival', 'diversity', 'weekend'],
    interestCategories: ['Arts & Culture', 'Food & Dining'],
    personalityTraits: ['Curious', 'Open-minded'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'low',
      priceRange: '$-$$'
    }
  },
  {
    content: "How about we take a guided tour of {{historicalSite}}? It's a fascinating part of our local history.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['culture', 'history', 'tour', 'learning'],
    interestCategories: ['Arts & Culture', 'Learning & Education'],
    personalityTraits: ['Intellectual', 'Curious'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'low',
      priceRange: '$-$$'
    }
  },
  {
    content: '{{localTheater}} is showing a classic/independent film this {{dayOfWeek}}. Anyone interested in watching it together?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.INTEREST_BASED,
    tags: ['culture', 'film', 'cinema', 'evening'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Intellectual', 'Appreciative'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low',
      priceRange: '$-$$'
    }
  }
];

/**
 * Collection of seasonal activity suggestion prompts for Tribe engagement
 */
export const SEASONAL_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: "{{season}} is here! Let's go {{seasonalActivity}} at {{localVenue}} while we can.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.SEASONAL,
    tags: ['seasonal', 'outdoors', 'limited time', 'weather'],
    interestCategories: ['Outdoor Adventures'],
    personalityTraits: ['Spontaneous', 'Active'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'moderate',
      seasonality: 'specific'
    }
  },
  {
    content: 'The {{seasonalFruit/Vegetable}} are in season! How about we visit {{localFarmersMarket}} this weekend?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.SEASONAL,
    tags: ['seasonal', 'food', 'market', 'weekend'],
    interestCategories: ['Food & Dining', 'Outdoor Adventures'],
    personalityTraits: ['Appreciative', 'Health-conscious'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'low',
      seasonality: 'specific'
    }
  },
  {
    content: '{{holidayName}} is coming up! Should we plan a tribe celebration at {{localVenue}}?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.SEASONAL,
    tags: ['holiday', 'celebration', 'seasonal', 'social'],
    interestCategories: ['Arts & Culture', 'Food & Dining'],
    personalityTraits: ['Social', 'Festive'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'low',
      seasonality: 'holiday'
    }
  },
  {
    content: 'The {{seasonalEvent}} is happening at {{localVenue}} this month. It only comes once a year - should we go?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.SEASONAL,
    tags: ['seasonal', 'event', 'annual', 'special'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Spontaneous', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-5 hours',
      physicalIntensity: 'low to moderate',
      seasonality: 'annual'
    }
  },
  {
    content: "It's the perfect time of year for {{seasonalActivity}}! Anyone interested in trying it at {{localSpot}}?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.SEASONAL,
    tags: ['seasonal', 'outdoors', 'activity', 'weather'],
    interestCategories: ['Outdoor Adventures', 'Sports & Fitness'],
    personalityTraits: ['Active', 'Adventurous'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'moderate to high',
      seasonality: 'specific'
    }
  }
];

/**
 * Collection of budget-friendly activity suggestion prompts for Tribe engagement
 */
export const LOW_COST_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: "Let's have a potluck picnic at {{localPark}}! Everyone brings one dish to share.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['budget', 'food', 'outdoors', 'social'],
    interestCategories: ['Food & Dining', 'Outdoor Adventures'],
    personalityTraits: ['Social', 'Practical'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low',
      priceRange: '$'
    }
  },
  {
    content: 'Did you know {{localMuseum/Attraction}} has free admission on {{dayOfWeek}}? We could go together!',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['budget', 'culture', 'free', 'indoor'],
    interestCategories: ['Arts & Culture', 'Learning & Education'],
    personalityTraits: ['Practical', 'Intellectual'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'low',
      priceRange: 'free'
    }
  },
  {
    content: 'How about a game night at {{publicSpace/MemberHome}}? We can each bring our favorite games.',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['budget', 'games', 'social', 'evening'],
    interestCategories: ['Games & Entertainment'],
    personalityTraits: ['Social', 'Playful'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'low',
      priceRange: 'free-$'
    }
  },
  {
    content: "There's a free {{eventType}} happening at {{localVenue}} this {{dayOfWeek}}. Should we check it out?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['budget', 'free', 'event', 'local'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Practical', 'Curious'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-3 hours',
      physicalIntensity: 'low',
      priceRange: 'free'
    }
  },
  {
    content: "Let's explore the {{localNeighborhood}} area together! We could do a self-guided walking tour and discover new spots.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['budget', 'exploration', 'walking', 'urban'],
    interestCategories: ['Urban Exploration', 'Outdoor Adventures'],
    personalityTraits: ['Curious', 'Active'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'moderate',
      priceRange: 'free'
    }
  }
];

/**
 * Collection of weather-dependent activity suggestion prompts for Tribe engagement
 */
export const WEATHER_BASED_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: "It's going to be sunny and warm this {{dayOfWeek}}! Perfect weather for {{outdoorActivity}} at {{localSpot}}.",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.WEATHER_BASED,
    tags: ['weather', 'sunny', 'outdoors', 'warm'],
    interestCategories: ['Outdoor Adventures'],
    personalityTraits: ['Active', 'Spontaneous'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'moderate',
      weatherCondition: 'sunny'
    }
  },
  {
    content: 'Rainy day forecast for {{dayOfWeek}}. How about we visit {{indoorVenue}} instead of our usual outdoor activities?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.WEATHER_BASED,
    tags: ['weather', 'rainy', 'indoor', 'alternative'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Adaptable', 'Practical'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-3 hours',
      physicalIntensity: 'low',
      weatherCondition: 'rainy'
    }
  },
  {
    content: 'Snow is in the forecast! Anyone up for {{winterActivity}} at {{localSpot}} this weekend?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.WEATHER_BASED,
    tags: ['weather', 'snow', 'winter', 'outdoors'],
    interestCategories: ['Outdoor Adventures', 'Sports & Fitness'],
    personalityTraits: ['Adventurous', 'Active'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'moderate to high',
      weatherCondition: 'snowy'
    }
  },
  {
    content: "It's going to be extremely hot this {{dayOfWeek}}. Let's cool off with {{coolingActivity}} at {{localSpot}}!",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.WEATHER_BASED,
    tags: ['weather', 'hot', 'cooling', 'summer'],
    interestCategories: ['Outdoor Adventures', 'Wellness & Mindfulness'],
    personalityTraits: ['Practical', 'Adaptable'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low to moderate',
      weatherCondition: 'hot'
    }
  },
  {
    content: "Perfect mild weather this weekend! It's ideal for {{outdoorActivity}} at {{localSpot}} - who's interested?",
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.WEATHER_BASED,
    tags: ['weather', 'mild', 'outdoors', 'weekend'],
    interestCategories: ['Outdoor Adventures', 'Sports & Fitness'],
    personalityTraits: ['Active', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'moderate',
      weatherCondition: 'mild'
    }
  }
];

/**
 * Collection of spontaneous activity suggestion prompts for Tribe engagement
 */
export const SPONTANEOUS_ACTIVITY_PROMPTS: IPromptCreate[] = [
  {
    content: 'Anyone free tonight for a spontaneous {{activityType}} at {{localVenue}}?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['spontaneous', 'last-minute', 'evening', 'social'],
    interestCategories: ['Games & Entertainment', 'Food & Dining'],
    personalityTraits: ['Spontaneous', 'Social'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-3 hours',
      physicalIntensity: 'low',
      timeframe: 'same-day'
    }
  },
  {
    content: 'I just heard about a pop-up {{eventType}} happening at {{localVenue}} today! Anyone want to check it out?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['spontaneous', 'pop-up', 'limited-time', 'opportunity'],
    interestCategories: ['Arts & Culture', 'Food & Dining'],
    personalityTraits: ['Spontaneous', 'Curious'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'low',
      timeframe: 'same-day'
    }
  },
  {
    content: 'The weather just cleared up unexpectedly! Anyone up for a quick {{outdoorActivity}} at {{localSpot}}?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.WEATHER_BASED,
    tags: ['spontaneous', 'weather', 'outdoors', 'quick'],
    interestCategories: ['Outdoor Adventures'],
    personalityTraits: ['Spontaneous', 'Active'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '1-2 hours',
      physicalIntensity: 'moderate',
      timeframe: 'same-day',
      weatherDependent: true
    }
  },
  {
    content: '{{localVenue}} just had a cancellation and can accommodate our group tonight! Should we grab this opportunity?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['spontaneous', 'opportunity', 'evening', 'reservation'],
    interestCategories: ['Food & Dining', 'Games & Entertainment'],
    personalityTraits: ['Spontaneous', 'Decisive'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-3 hours',
      physicalIntensity: 'low',
      timeframe: 'same-day'
    }
  },
  {
    content: 'I have an extra {{numberOfTickets}} tickets to {{eventName}} {{timeframe}}. Anyone interested in joining?',
    type: PromptType.ACTIVITY_SUGGESTION,
    category: PromptCategory.GENERAL,
    tags: ['spontaneous', 'tickets', 'opportunity', 'limited'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Spontaneous', 'Generous'],
    aiGenerated: false,
    metadata: {
      estimatedDuration: '2-4 hours',
      physicalIntensity: 'low',
      timeframe: 'short-notice'
    }
  }
];

/**
 * Combined array of all activity prompts for seeding and retrieval
 */
export const activityPrompts: IPromptCreate[] = [
  ...OUTDOOR_ACTIVITY_PROMPTS,
  ...INDOOR_ACTIVITY_PROMPTS,
  ...FOOD_ACTIVITY_PROMPTS,
  ...CULTURAL_ACTIVITY_PROMPTS,
  ...SEASONAL_ACTIVITY_PROMPTS,
  ...LOW_COST_ACTIVITY_PROMPTS,
  ...WEATHER_BASED_ACTIVITY_PROMPTS,
  ...SPONTANEOUS_ACTIVITY_PROMPTS
];