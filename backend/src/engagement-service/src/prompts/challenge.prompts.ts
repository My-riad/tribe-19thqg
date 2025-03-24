import { PromptType, PromptCategory, IPromptCreate } from '../models/prompt.model';

/**
 * Collection of photo-based challenge prompts
 * These prompts encourage users to take and share photos based on different themes
 */
export const PHOTO_CHALLENGE_PROMPTS: IPromptCreate[] = [
  {
    content: 'Photo Challenge: Take a picture of something in your neighborhood that most people would walk right past without noticing. Share it with the tribe and tell us why it caught your eye!',
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['photo', 'observation', 'local', 'sharing'],
    interestCategories: ['Photography', 'Urban Exploration'],
    personalityTraits: ['Observant', 'Creative'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1-3 days',
      requiresPhoto: true
    }
  },
  {
    content: "Photo Challenge: This week, let's all capture an image that represents '{{theme}}' to us. We'll share our photos and see how differently we interpreted the theme!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['photo', 'interpretation', 'theme', 'creativity'],
    interestCategories: ['Photography', 'Arts & Culture'],
    personalityTraits: ['Creative', 'Expressive'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      requiresPhoto: true,
      themes: ['connection', 'joy', 'contrast', 'peace', 'energy', 'growth']
    }
  },
  {
    content: "Photo Scavenger Hunt: Let's each find and photograph these 5 items in our local areas: 1) Something blue 2) A unique sign 3) Something that makes you smile 4) An interesting texture 5) Something unexpected. Share as you find them!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['photo', 'scavenger hunt', 'exploration', 'observation'],
    interestCategories: ['Photography', 'Urban Exploration', 'Outdoor Adventures'],
    personalityTraits: ['Adventurous', 'Observant'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      requiresPhoto: true,
      itemCount: 5
    }
  },
  {
    content: "Before & After Challenge: Let's document a place or activity before our tribe visits/does it together, and then after. We can share the comparison photos to see how our experience changed our perspective!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['photo', 'comparison', 'perspective', 'meetup'],
    interestCategories: ['Photography', 'Outdoor Adventures'],
    personalityTraits: ['Observant', 'Reflective'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: 'event-based',
      requiresPhoto: true,
      requiresMeetup: true
    }
  },
  {
    content: "Photo Challenge: Take a picture that represents your favorite aspect of our tribe's shared interest in {{interestCategory}}. Let's see what everyone values most!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.INTEREST_BASED,
    tags: ['photo', 'interests', 'values', 'sharing'],
    interestCategories: ['Photography', 'Arts & Culture', 'Food & Dining', 'Outdoor Adventures', 'Sports & Fitness', 'Games & Entertainment'],
    personalityTraits: ['Passionate', 'Expressive'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '3-5 days',
      requiresPhoto: true
    }
  }
];

/**
 * Collection of creative challenge prompts
 * These prompts encourage creative expression through various mediums
 */
export const CREATIVE_CHALLENGE_PROMPTS: IPromptCreate[] = [
  {
    content: "Creative Challenge: Let's each create something inspired by our last meetup at {{location/activity}}. It could be a drawing, poem, short story, playlist - any creative expression! Share your creation with the tribe by {{deadline}}.",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['creative', 'expression', 'inspiration', 'sharing'],
    interestCategories: ['Arts & Culture'],
    personalityTraits: ['Creative', 'Expressive'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      requiresMeetupReference: true
    }
  },
  {
    content: "Six-Word Story Challenge: Let's each create a six-word story about {{theme}}. It's harder than it sounds to capture something meaningful in just six words!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['creative', 'writing', 'brevity', 'storytelling'],
    interestCategories: ['Arts & Culture', 'Learning & Education'],
    personalityTraits: ['Creative', 'Thoughtful'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '2-3 days',
      themes: ['friendship', 'adventure', 'discovery', 'connection', 'change', 'home']
    }
  },
  {
    content: "Collaborative Playlist: Let's create a tribe playlist together! Everyone add 2-3 songs that either 1) represent you, 2) you think others would enjoy, or 3) relate to our shared interests. We can use it at our next meetup!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['creative', 'music', 'collaboration', 'sharing'],
    interestCategories: ['Arts & Culture', 'Games & Entertainment'],
    personalityTraits: ['Expressive', 'Collaborative'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 week',
      platform: 'music streaming service'
    }
  },
  {
    content: "Recipe Exchange: Let's each share our favorite recipe related to {{cuisineType/ingredient/theme}}. Bonus points if you try someone else's recipe and share your results!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.INTEREST_BASED,
    tags: ['creative', 'cooking', 'food', 'sharing'],
    interestCategories: ['Food & Dining'],
    personalityTraits: ['Creative', 'Generous'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1-2 weeks',
      bonusChallenge: true
    }
  },
  {
    content: "Creative Interpretation: Let's each choose the same {{song/poem/artwork}} and create something inspired by it in our own medium or style. It could be a drawing, photo, short writing, etc. We'll share and see how differently we interpreted it!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['creative', 'interpretation', 'expression', 'art'],
    interestCategories: ['Arts & Culture'],
    personalityTraits: ['Creative', 'Expressive'],
    aiGenerated: false,
    metadata: {
      difficulty: 'hard',
      duration: '1 week'
    }
  }
];

/**
 * Collection of social interaction challenge prompts
 * These prompts encourage meaningful social connections within the tribe
 */
export const SOCIAL_CHALLENGE_PROMPTS: IPromptCreate[] = [
  {
    content: "Appreciation Challenge: Let's each share one thing we appreciate about every other member of our tribe. It can be something they said, did, or a quality you've noticed.",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['social', 'appreciation', 'connection', 'positivity'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Appreciative', 'Thoughtful'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1-3 days',
      strengthensConnections: true
    }
  },
  {
    content: "Random Coffee Pairs: This week, let's randomly pair up for virtual or in-person coffee/tea chats! I'll assign the pairs, and you'll have a week to schedule a 30-minute conversation to get to know each other better.",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['social', 'connection', 'conversation', 'one-on-one'],
    interestCategories: ['Food & Dining', 'Wellness & Mindfulness'],
    personalityTraits: ['Social', 'Curious'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      requiresPairing: true,
      virtualOption: true
    }
  },
  {
    content: "Pay It Forward: Let's each do one small, kind gesture for someone (in our tribe or outside it) this week. Share what you did and how it felt!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['social', 'kindness', 'community', 'reflection'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Kind', 'Generous'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 week',
      impactFocus: true
    }
  },
  {
    content: "Question Chain: I'll start by asking one tribe member a thoughtful question. They'll answer, then ask a different question to another member. Let's keep the chain going until everyone has answered and asked a question!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['social', 'questions', 'conversation', 'connection'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Curious', 'Thoughtful'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '3-5 days',
      sequential: true
    }
  },
  {
    content: "Local Recommendation Exchange: Let's each share our top recommendation for something local - a hidden gem restaurant, a beautiful walking spot, a great bookstore, etc. Bonus points if you visit someone else's recommendation!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['social', 'local', 'recommendations', 'exploration'],
    interestCategories: ['Urban Exploration', 'Food & Dining', 'Outdoor Adventures'],
    personalityTraits: ['Knowledgeable', 'Helpful'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1-2 weeks',
      bonusChallenge: true
    }
  }
];

/**
 * Collection of exploration challenge prompts
 * These prompts encourage discovery and exploration of new places
 */
export const EXPLORATION_CHALLENGE_PROMPTS: IPromptCreate[] = [
  {
    content: "Neighborhood Exploration: Let's each explore a neighborhood in our city that we've never or rarely visited. Share one interesting discovery from your exploration!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['exploration', 'urban', 'discovery', 'local'],
    interestCategories: ['Urban Exploration', 'Outdoor Adventures'],
    personalityTraits: ['Adventurous', 'Curious'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      physicalActivity: true
    }
  },
  {
    content: "New Route Challenge: This week, let's each take a different route than usual to a common destination (work, grocery store, etc.). Share one interesting thing you noticed on your new route!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['exploration', 'observation', 'routine-breaking', 'mindfulness'],
    interestCategories: ['Urban Exploration', 'Wellness & Mindfulness'],
    personalityTraits: ['Observant', 'Adaptable'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 week',
      dailyLife: true
    }
  },
  {
    content: "Local Landmark Challenge: Let's each visit a local landmark or attraction that we've never been to, despite living in the area. Share a photo or something you learned!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['exploration', 'local', 'tourism', 'discovery'],
    interestCategories: ['Urban Exploration', 'Arts & Culture'],
    personalityTraits: ['Curious', 'Adventurous'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1-2 weeks',
      physicalActivity: true
    }
  },
  {
    content: "Nature Spot Discovery: Let's each find a natural spot in our area (park, garden, waterfront, etc.) that we haven't visited before. Share what you discovered and your experience there!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['exploration', 'nature', 'outdoors', 'discovery'],
    interestCategories: ['Outdoor Adventures', 'Wellness & Mindfulness'],
    personalityTraits: ['Nature-loving', 'Adventurous'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1-2 weeks',
      physicalActivity: true,
      outdoors: true
    }
  },
  {
    content: "Cultural Exploration: Let's each experience an aspect of a culture different from our own this week (try a new cuisine, attend a cultural event, learn about traditions, etc.). Share what you learned!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['exploration', 'culture', 'diversity', 'learning'],
    interestCategories: ['Arts & Culture', 'Food & Dining'],
    personalityTraits: ['Open-minded', 'Curious'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      culturalAwareness: true
    }
  }
];

/**
 * Collection of learning challenge prompts
 * These prompts encourage skill development and knowledge sharing
 */
export const LEARNING_CHALLENGE_PROMPTS: IPromptCreate[] = [
  {
    content: "Skill-Share Challenge: Let's each spend 15-30 minutes learning a basic skill related to our shared interest in {{interestCategory}}. Share what you learned and any resources you found helpful!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.INTEREST_BASED,
    tags: ['learning', 'skills', 'development', 'sharing'],
    interestCategories: ['Learning & Education', 'Arts & Culture', 'Technology', 'Sports & Fitness'],
    personalityTraits: ['Curious', 'Growth-oriented'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1 week',
      timeCommitment: '15-30 minutes'
    }
  },
  {
    content: "Book/Article/Podcast Exchange: Let's each recommend one book, article, or podcast episode related to {{topic/interest}} and commit to checking out at least one recommendation from another member.",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.INTEREST_BASED,
    tags: ['learning', 'reading', 'listening', 'recommendations'],
    interestCategories: ['Learning & Education'],
    personalityTraits: ['Intellectual', 'Curious'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '2 weeks',
      mediaTypes: ['book', 'article', 'podcast']
    }
  },
  {
    content: "Teach Something Challenge: Let's each prepare a 3-5 minute mini-lesson on something we know about (a skill, concept, historical event, etc.) to share at our next meetup!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['learning', 'teaching', 'sharing', 'knowledge'],
    interestCategories: ['Learning & Education'],
    personalityTraits: ['Knowledgeable', 'Helpful'],
    aiGenerated: false,
    metadata: {
      difficulty: 'hard',
      duration: 'until next meetup',
      requiresMeetup: true,
      presentationLength: '3-5 minutes'
    }
  },
  {
    content: "Etymology Exploration: Let's each learn the origin of a word related to our shared interest in {{interestCategory}} and share the interesting history we discover!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.INTEREST_BASED,
    tags: ['learning', 'language', 'history', 'etymology'],
    interestCategories: ['Learning & Education'],
    personalityTraits: ['Intellectual', 'Curious'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '3-5 days',
      linguisticFocus: true
    }
  },
  {
    content: "Fact Exchange: Let's each research and share one fascinating fact related to {{topic}} that others might not know. Let's learn something new together!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['learning', 'facts', 'research', 'sharing'],
    interestCategories: ['Learning & Education'],
    personalityTraits: ['Curious', 'Intellectual'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '2-4 days',
      topics: ['local history', 'science', 'nature', 'food', 'art', 'technology']
    }
  }
];

/**
 * Collection of wellness challenge prompts
 * These prompts encourage mental and physical wellbeing practices
 */
export const WELLNESS_CHALLENGE_PROMPTS: IPromptCreate[] = [
  {
    content: "Mindfulness Moment: Let's each take 5 minutes for a mindfulness practice (meditation, deep breathing, mindful walking, etc.) for 3 days this week. Share your experience and any differences you noticed!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['wellness', 'mindfulness', 'mental health', 'reflection'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Mindful', 'Reflective'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 week',
      timeCommitment: '5 minutes',
      frequency: '3 days'
    }
  },
  {
    content: "Nature Connection: Let's each spend at least 15 minutes in nature this week, fully present (no phones). Share what you observed and how it affected your mood!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['wellness', 'nature', 'mindfulness', 'outdoors'],
    interestCategories: ['Wellness & Mindfulness', 'Outdoor Adventures'],
    personalityTraits: ['Nature-loving', 'Mindful'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 week',
      timeCommitment: '15 minutes',
      outdoors: true
    }
  },
  {
    content: "Gratitude Practice: Let's each share three things we're grateful for today - one person, one place, and one experience.",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['wellness', 'gratitude', 'positivity', 'reflection'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Appreciative', 'Positive'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 day',
      mentalWellbeing: true
    }
  },
  {
    content: "Movement Break: Let's each take a 10-minute movement break (stretch, walk, dance, etc.) during our day for 3 days this week. Share what type of movement you chose and how it felt!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['wellness', 'movement', 'physical health', 'energy'],
    interestCategories: ['Wellness & Mindfulness', 'Sports & Fitness'],
    personalityTraits: ['Active', 'Health-conscious'],
    aiGenerated: false,
    metadata: {
      difficulty: 'easy',
      duration: '1 week',
      timeCommitment: '10 minutes',
      frequency: '3 days',
      physicalActivity: true
    }
  },
  {
    content: "Digital Detox: Let's each take a 2-hour break from all screens (outside of work requirements) and do something nourishing instead. Share what you did and how it felt!",
    type: PromptType.GROUP_CHALLENGE,
    category: PromptCategory.GENERAL,
    tags: ['wellness', 'digital detox', 'presence', 'balance'],
    interestCategories: ['Wellness & Mindfulness'],
    personalityTraits: ['Mindful', 'Balanced'],
    aiGenerated: false,
    metadata: {
      difficulty: 'medium',
      duration: '1-3 days',
      timeCommitment: '2 hours',
      digitalWellbeing: true
    }
  }
];

/**
 * Combined collection of all challenge prompts
 * Used for database seeding and comprehensive challenge selection
 */
export const challengePrompts: IPromptCreate[] = [
  ...PHOTO_CHALLENGE_PROMPTS,
  ...CREATIVE_CHALLENGE_PROMPTS,
  ...SOCIAL_CHALLENGE_PROMPTS,
  ...EXPLORATION_CHALLENGE_PROMPTS,
  ...LEARNING_CHALLENGE_PROMPTS,
  ...WELLNESS_CHALLENGE_PROMPTS
];