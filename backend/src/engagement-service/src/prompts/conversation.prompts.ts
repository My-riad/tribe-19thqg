import { PromptType, PromptCategory, IPromptCreate } from '../models/prompt.model';

/**
 * General conversation starters suitable for most contexts and groups
 * These are broadly applicable and meant to generate light to medium engagement
 */
export const GENERAL_CONVERSATION_STARTERS: IPromptCreate[] = [
  {
    content: "What's something you're looking forward to this week?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['general', 'future', 'positive', 'personal'],
    interestCategories: [],
    personalityTraits: ['Social', 'Optimistic'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.85,
      engagementLevel: 'medium'
    }
  },
  {
    content: 'If you could instantly master any skill, what would you choose and why?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['general', 'skills', 'hypothetical', 'aspirational'],
    interestCategories: [],
    personalityTraits: ['Curious', 'Growth-oriented'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.82,
      engagementLevel: 'medium'
    }
  },
  {
    content: "What's a small thing that made you smile recently?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['general', 'positive', 'reflection', 'gratitude'],
    interestCategories: [],
    personalityTraits: ['Appreciative', 'Positive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.88,
      engagementLevel: 'medium'
    }
  },
  {
    content: "What's your favorite local spot that most people don't know about?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['general', 'local', 'recommendations', 'hidden gems'],
    interestCategories: ['Urban Exploration'],
    personalityTraits: ['Knowledgeable', 'Adventurous'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.8,
      engagementLevel: 'high',
      localFocus: true
    }
  },
  {
    content: "What's something you've changed your mind about in the last few years?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['general', 'reflection', 'growth', 'perspective'],
    interestCategories: [],
    personalityTraits: ['Reflective', 'Open-minded'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.75,
      engagementLevel: 'high'
    }
  }
];

/**
 * Interest-based conversation starters that are targeted at specific hobby or activity categories
 * These use dynamic placeholders ({{interestCategory}}) that can be replaced with specific interests
 */
export const INTEREST_BASED_CONVERSATION_STARTERS: IPromptCreate[] = [
  {
    content: 'For those interested in {{interestCategory}}, what first sparked your passion for it?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.INTEREST_BASED,
    tags: ['interests', 'origins', 'passion', 'personal'],
    interestCategories: ['Outdoor Adventures', 'Arts & Culture', 'Food & Dining', 'Sports & Fitness', 'Games & Entertainment', 'Learning & Education', 'Technology', 'Wellness & Mindfulness'],
    personalityTraits: ['Passionate', 'Expressive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.85,
      engagementLevel: 'high',
      requiresInterestMatch: true
    }
  },
  {
    content: "What's a recent development or trend in {{interestCategory}} that you find exciting or concerning?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.INTEREST_BASED,
    tags: ['interests', 'trends', 'current events', 'opinions'],
    interestCategories: ['Outdoor Adventures', 'Arts & Culture', 'Food & Dining', 'Sports & Fitness', 'Games & Entertainment', 'Learning & Education', 'Technology', 'Wellness & Mindfulness'],
    personalityTraits: ['Knowledgeable', 'Analytical'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.78,
      engagementLevel: 'high',
      requiresInterestMatch: true
    }
  },
  {
    content: "For our {{interestCategory}} enthusiasts, what's something in this area you'd like to try but haven't had the chance yet?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.INTEREST_BASED,
    tags: ['interests', 'aspirations', 'bucket list', 'future'],
    interestCategories: ['Outdoor Adventures', 'Arts & Culture', 'Food & Dining', 'Sports & Fitness', 'Games & Entertainment', 'Learning & Education', 'Technology', 'Wellness & Mindfulness'],
    personalityTraits: ['Adventurous', 'Curious'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.82,
      engagementLevel: 'medium',
      requiresInterestMatch: true
    }
  },
  {
    content: "What's a common misconception about {{interestCategory}} that you'd like to clear up?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.INTEREST_BASED,
    tags: ['interests', 'misconceptions', 'knowledge sharing', 'expertise'],
    interestCategories: ['Outdoor Adventures', 'Arts & Culture', 'Food & Dining', 'Sports & Fitness', 'Games & Entertainment', 'Learning & Education', 'Technology', 'Wellness & Mindfulness'],
    personalityTraits: ['Knowledgeable', 'Passionate'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.75,
      engagementLevel: 'high',
      requiresInterestMatch: true
    }
  },
  {
    content: "Who's someone you admire in the field of {{interestCategory}} and what do you appreciate about their work or contribution?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.INTEREST_BASED,
    tags: ['interests', 'admiration', 'influences', 'inspiration'],
    interestCategories: ['Outdoor Adventures', 'Arts & Culture', 'Food & Dining', 'Sports & Fitness', 'Games & Entertainment', 'Learning & Education', 'Technology', 'Wellness & Mindfulness'],
    personalityTraits: ['Appreciative', 'Knowledgeable'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.77,
      engagementLevel: 'medium',
      requiresInterestMatch: true
    }
  }
];

/**
 * Personality-based conversation starters that focus on member traits and characteristics
 * These use dynamic placeholders ({{personalityTrait}}) that can be replaced with specific traits
 */
export const PERSONALITY_BASED_CONVERSATION_STARTERS: IPromptCreate[] = [
  {
    content: 'For our more {{personalityTrait}} members, how does this trait show up in your everyday life?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.PERSONALITY_BASED,
    tags: ['personality', 'self-awareness', 'reflection', 'traits'],
    interestCategories: [],
    personalityTraits: ['Adventurous', 'Creative', 'Analytical', 'Social', 'Reflective', 'Practical'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.75,
      engagementLevel: 'high',
      requiresPersonalityMatch: true
    }
  },
  {
    content: 'How has being {{personalityTrait}} helped you in challenging situations?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.PERSONALITY_BASED,
    tags: ['personality', 'challenges', 'strengths', 'resilience'],
    interestCategories: [],
    personalityTraits: ['Adaptable', 'Persistent', 'Optimistic', 'Analytical', 'Calm', 'Resourceful'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.78,
      engagementLevel: 'high',
      requiresPersonalityMatch: true
    }
  },
  {
    content: "For those who identify as more {{personalityTrait}}, what's a complementary trait you admire in others?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.PERSONALITY_BASED,
    tags: ['personality', 'complementary traits', 'admiration', 'balance'],
    interestCategories: [],
    personalityTraits: ['Introverted', 'Extroverted', 'Analytical', 'Creative', 'Practical', 'Spontaneous'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.72,
      engagementLevel: 'medium',
      requiresPersonalityMatch: true
    }
  },
  {
    content: 'How do you think your {{personalityTrait}} nature influences your preferences in {{interestCategory}}?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.PERSONALITY_BASED,
    tags: ['personality', 'interests', 'connections', 'self-awareness'],
    interestCategories: ['Outdoor Adventures', 'Arts & Culture', 'Food & Dining', 'Sports & Fitness', 'Games & Entertainment', 'Learning & Education', 'Technology', 'Wellness & Mindfulness'],
    personalityTraits: ['Adventurous', 'Creative', 'Analytical', 'Social', 'Reflective', 'Practical'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.7,
      engagementLevel: 'high',
      requiresPersonalityMatch: true,
      requiresInterestMatch: true
    }
  },
  {
    content: 'For our more {{personalityTrait}} members, has this trait changed or evolved over time for you?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.PERSONALITY_BASED,
    tags: ['personality', 'growth', 'change', 'self-awareness'],
    interestCategories: [],
    personalityTraits: ['Adventurous', 'Creative', 'Analytical', 'Social', 'Reflective', 'Practical'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.73,
      engagementLevel: 'high',
      requiresPersonalityMatch: true
    }
  }
];

/**
 * Event-related conversation starters focused on past or upcoming meetups
 * These use dynamic placeholders ({{eventType}}, {{venue}}) that can be replaced with specific event details
 */
export const EVENT_RELATED_CONVERSATION_STARTERS: IPromptCreate[] = [
  {
    content: 'What are you most looking forward to about our upcoming {{eventType}} at {{venue}}?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.EVENT_RELATED,
    tags: ['event', 'anticipation', 'meetup', 'planning'],
    interestCategories: [],
    personalityTraits: ['Social', 'Enthusiastic'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.85,
      engagementLevel: 'high',
      requiresUpcomingEvent: true
    }
  },
  {
    content: 'What was your favorite moment from our recent {{eventType}} at {{venue}}?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.EVENT_RELATED,
    tags: ['event', 'reflection', 'memories', 'appreciation'],
    interestCategories: [],
    personalityTraits: ['Appreciative', 'Reflective'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.82,
      engagementLevel: 'high',
      requiresRecentEvent: true
    }
  },
  {
    content: "For our upcoming {{eventType}}, is there anything specific you'd like to know or discuss beforehand?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.EVENT_RELATED,
    tags: ['event', 'planning', 'questions', 'preparation'],
    interestCategories: [],
    personalityTraits: ['Practical', 'Organized'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.75,
      engagementLevel: 'medium',
      requiresUpcomingEvent: true
    }
  },
  {
    content: 'If you could plan our next tribe meetup, what kind of event would you organize?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.EVENT_RELATED,
    tags: ['event', 'planning', 'ideas', 'future'],
    interestCategories: [],
    personalityTraits: ['Creative', 'Social'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.78,
      engagementLevel: 'high',
      ideaGeneration: true
    }
  },
  {
    content: "What's one thing you learned or discovered from our {{eventType}} that you might not have otherwise?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.EVENT_RELATED,
    tags: ['event', 'learning', 'discovery', 'reflection'],
    interestCategories: [],
    personalityTraits: ['Curious', 'Reflective'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.77,
      engagementLevel: 'medium',
      requiresRecentEvent: true
    }
  }
];

/**
 * Ice breaker prompts specifically designed for newly formed groups or first interactions
 * These are low-pressure questions that are easy to answer and create a comfortable atmosphere
 */
export const ICE_BREAKER_PROMPTS: IPromptCreate[] = [
  {
    content: "What's your go-to comfort food and is there a story behind why?",
    type: PromptType.ICE_BREAKER,
    category: PromptCategory.GENERAL,
    tags: ['ice breaker', 'food', 'comfort', 'personal'],
    interestCategories: ['Food & Dining'],
    personalityTraits: ['Social', 'Expressive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.9,
      engagementLevel: 'medium',
      newGroupFocus: true
    }
  },
  {
    content: "What's a small, everyday thing that brings you joy?",
    type: PromptType.ICE_BREAKER,
    category: PromptCategory.GENERAL,
    tags: ['ice breaker', 'joy', 'everyday', 'appreciation'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Appreciative', 'Positive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.88,
      engagementLevel: 'medium',
      newGroupFocus: true
    }
  },
  {
    content: "What's a book, movie, or show you've enjoyed recently?",
    type: PromptType.ICE_BREAKER,
    category: PromptCategory.GENERAL,
    tags: ['ice breaker', 'entertainment', 'recommendations', 'current'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Expressive', 'Appreciative'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.85,
      engagementLevel: 'medium',
      newGroupFocus: true
    }
  },
  {
    content: 'If you had a free day with no obligations, how would you spend it?',
    type: PromptType.ICE_BREAKER,
    category: PromptCategory.GENERAL,
    tags: ['ice breaker', 'free time', 'preferences', 'hypothetical'],
    interestCategories: [],
    personalityTraits: ['Expressive', 'Reflective'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.87,
      engagementLevel: 'medium',
      newGroupFocus: true
    }
  },
  {
    content: "What's something you're curious about or interested in learning more about lately?",
    type: PromptType.ICE_BREAKER,
    category: PromptCategory.GENERAL,
    tags: ['ice breaker', 'curiosity', 'learning', 'interests'],
    interestCategories: ['Learning & Education'],
    personalityTraits: ['Curious', 'Growth-oriented'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.83,
      engagementLevel: 'medium',
      newGroupFocus: true
    }
  }
];

/**
 * Deep conversation starters for more established groups that have built trust
 * These prompts encourage vulnerability and meaningful sharing between members
 */
export const DEEP_CONVERSATION_STARTERS: IPromptCreate[] = [
  {
    content: "What's a belief or perspective you've significantly changed in your life, and what led to that change?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['deep', 'beliefs', 'change', 'growth'],
    interestCategories: [],
    personalityTraits: ['Reflective', 'Open-minded'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.7,
      engagementLevel: 'high',
      intimacyLevel: 'high',
      establishedGroupFocus: true
    }
  },
  {
    content: "What's a life experience that has significantly shaped who you are today?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['deep', 'experiences', 'identity', 'reflection'],
    interestCategories: [],
    personalityTraits: ['Reflective', 'Self-aware'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.68,
      engagementLevel: 'high',
      intimacyLevel: 'high',
      establishedGroupFocus: true
    }
  },
  {
    content: "What's something you're working on improving about yourself right now?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['deep', 'self-improvement', 'growth', 'goals'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Growth-oriented', 'Self-aware'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.72,
      engagementLevel: 'high',
      intimacyLevel: 'medium',
      establishedGroupFocus: true
    }
  },
  {
    content: "What's a value or principle that guides many of your decisions?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['deep', 'values', 'principles', 'decision-making'],
    interestCategories: [],
    personalityTraits: ['Principled', 'Reflective'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.65,
      engagementLevel: 'high',
      intimacyLevel: 'high',
      establishedGroupFocus: true
    }
  },
  {
    content: "What's something you've been reconsidering or questioning lately in your life?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['deep', 'questioning', 'uncertainty', 'reflection'],
    interestCategories: [],
    personalityTraits: ['Reflective', 'Open-minded'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.63,
      engagementLevel: 'high',
      intimacyLevel: 'high',
      establishedGroupFocus: true
    }
  }
];

/**
 * Light conversation starters for casual engagement without requiring deep reflection
 * Ideal for maintaining regular engagement with low-pressure, fun interactions
 */
export const LIGHT_CONVERSATION_STARTERS: IPromptCreate[] = [
  {
    content: "What's a simple pleasure or small joy you've experienced recently?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['light', 'joy', 'simple pleasures', 'positivity'],
    interestCategories: [],
    personalityTraits: ['Appreciative', 'Positive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.85,
      engagementLevel: 'medium',
      intimacyLevel: 'low'
    }
  },
  {
    content: "What's something funny or amusing that happened to you recently?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['light', 'humor', 'stories', 'everyday'],
    interestCategories: [],
    personalityTraits: ['Humorous', 'Expressive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.82,
      engagementLevel: 'medium',
      intimacyLevel: 'low'
    }
  },
  {
    content: 'If you could have any animal as a pet (with no issues of care or space), what would you choose?',
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['light', 'animals', 'hypothetical', 'fun'],
    interestCategories: [],
    personalityTraits: ['Playful', 'Imaginative'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.88,
      engagementLevel: 'medium',
      intimacyLevel: 'low'
    }
  },
  {
    content: "What's a song that always puts you in a good mood?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['light', 'music', 'mood', 'favorites'],
    interestCategories: ['Arts & Culture'],
    personalityTraits: ['Expressive', 'Positive'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.85,
      engagementLevel: 'medium',
      intimacyLevel: 'low'
    }
  },
  {
    content: "What's a small luxury or treat you enjoy?",
    type: PromptType.CONVERSATION_STARTER,
    category: PromptCategory.GENERAL,
    tags: ['light', 'treats', 'self-care', 'enjoyment'],
    interestCategories: ['Wellness & Mindfulness', 'Food & Dining'],
    personalityTraits: ['Appreciative', 'Self-aware'],
    aiGenerated: false,
    metadata: {
      responseRate: 0.83,
      engagementLevel: 'medium',
      intimacyLevel: 'low'
    }
  }
];

/**
 * Combined collection of all conversation prompts for use in the engagement service
 * This makes it easier to import all prompts at once when needed for seeding or lookup
 */
export const conversationPrompts: IPromptCreate[] = [
  ...GENERAL_CONVERSATION_STARTERS,
  ...INTEREST_BASED_CONVERSATION_STARTERS,
  ...PERSONALITY_BASED_CONVERSATION_STARTERS,
  ...EVENT_RELATED_CONVERSATION_STARTERS,
  ...ICE_BREAKER_PROMPTS,
  ...DEEP_CONVERSATION_STARTERS,
  ...LIGHT_CONVERSATION_STARTERS
];