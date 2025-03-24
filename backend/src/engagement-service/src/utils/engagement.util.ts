import mongoose from 'mongoose';
import {
  EngagementType,
  EngagementStatus,
  EngagementTrigger,
  IEngagementResponse,
  IEngagementDocument
} from '../models/engagement.model';
import { PromptType, PromptCategory } from '../models/prompt.model';
import { ChallengeType, ChallengeStatus } from '../models/challenge.model';
import {
  validateString,
  validateObject,
  validateArray
} from '../../../shared/src/utils/validation.util';
import {
  isValidDate,
  addDaysToDate,
  formatDate,
  getDaysBetweenDates
} from '../../../shared/src/utils/date.util';
import { ApiError } from '../../../shared/src/errors/api.error';

/**
 * Maps engagement types to corresponding prompt types for content generation
 * 
 * @param engagementType - The engagement type to map
 * @returns The corresponding prompt type for the engagement type
 */
export const mapEngagementTypeToPromptType = (engagementType: EngagementType): PromptType => {
  switch (engagementType) {
    case EngagementType.CONVERSATION_PROMPT:
      return PromptType.CONVERSATION_STARTER;
    case EngagementType.ACTIVITY_SUGGESTION:
      return PromptType.ACTIVITY_SUGGESTION;
    case EngagementType.GROUP_CHALLENGE:
      return PromptType.GROUP_CHALLENGE;
    case EngagementType.POLL_QUESTION:
      return PromptType.POLL_QUESTION;
    case EngagementType.MEETUP_SUGGESTION:
      return PromptType.ACTIVITY_SUGGESTION;
    default:
      return PromptType.CONVERSATION_STARTER;
  }
};

/**
 * Calculates the response rate for an engagement or collection of engagements
 * 
 * @param engagements - Single engagement document or array of engagement documents
 * @returns Response rate as a percentage (0-100)
 */
export const calculateResponseRate = (
  engagements: IEngagementDocument | IEngagementDocument[]
): number => {
  if (!engagements) {
    return 0;
  }

  // Handle single engagement
  if (!Array.isArray(engagements)) {
    // If we have metadata about tribe size, use it
    const tribeSize = engagements.metadata?.tribeSize 
      ? Number(engagements.metadata.tribeSize)
      : 0;
      
    // If there's no tribe size data or it's invalid, can't calculate rate
    if (!tribeSize || isNaN(tribeSize) || tribeSize <= 0) {
      return engagements.responses.length > 0 ? 100 : 0;
    }
    
    return (engagements.responses.length / tribeSize) * 100;
  }
  
  // Handle array of engagements
  if (engagements.length === 0) {
    return 0;
  }
  
  // Calculate average response rate across all engagements
  let totalResponseRate = 0;
  let validEngagements = 0;
  
  for (const engagement of engagements) {
    const tribeSize = engagement.metadata?.tribeSize 
      ? Number(engagement.metadata.tribeSize)
      : 0;
    
    if (tribeSize && !isNaN(tribeSize) && tribeSize > 0) {
      totalResponseRate += (engagement.responses.length / tribeSize) * 100;
      validEngagements++;
    } else if (engagement.responses.length > 0) {
      totalResponseRate += 100;
      validEngagements++;
    }
  }
  
  return validEngagements > 0 ? totalResponseRate / validEngagements : 0;
};

/**
 * Calculates the expiry date for an engagement based on its type and creation date
 * 
 * @param type - The engagement type
 * @param creationDate - The date the engagement was created
 * @returns The calculated expiry date for the engagement
 */
export const getEngagementExpiryDate = (
  type: EngagementType,
  creationDate: Date
): Date => {
  if (!isValidDate(creationDate)) {
    throw new ApiError('Invalid creation date provided for engagement expiry calculation');
  }
  
  let expiryDays: number;
  
  // Set expiry period based on engagement type
  switch (type) {
    case EngagementType.CONVERSATION_PROMPT:
      expiryDays = 3; // 3 days for conversation prompts
      break;
    case EngagementType.ACTIVITY_SUGGESTION:
      expiryDays = 7; // 7 days for activity suggestions
      break;
    case EngagementType.GROUP_CHALLENGE:
      expiryDays = 14; // 14 days for group challenges
      break;
    case EngagementType.POLL_QUESTION:
      expiryDays = 2; // 2 days for poll questions
      break;
    case EngagementType.MEETUP_SUGGESTION:
      expiryDays = 5; // 5 days for meetup suggestions
      break;
    default:
      expiryDays = 7; // Default to 7 days
  }
  
  return addDaysToDate(creationDate, expiryDays);
};

/**
 * Formats an engagement document into a standardized response object for API clients
 * 
 * @param engagement - The engagement document to format
 * @param userId - Optional user ID to check if the user has responded
 * @returns Formatted engagement response object
 */
export const formatEngagementForResponse = (
  engagement: IEngagementDocument,
  userId?: string
): IEngagementResponse => {
  if (!engagement) {
    throw new ApiError('Cannot format null or undefined engagement');
  }
  
  const responseCount = engagement.responses.length;
  const userHasResponded = userId 
    ? engagement.responses.some(response => response.userId === userId)
    : false;
  
  return {
    id: engagement._id.toString(),
    tribeId: engagement.tribeId,
    type: engagement.type,
    content: engagement.content,
    status: engagement.status,
    trigger: engagement.trigger,
    createdBy: engagement.createdBy,
    deliveredAt: engagement.deliveredAt,
    expiresAt: engagement.expiresAt,
    responseCount,
    userHasResponded,
    responses: engagement.responses,
    aiGenerated: engagement.aiGenerated,
    metadata: engagement.metadata,
    createdAt: engagement.createdAt,
    updatedAt: engagement.updatedAt
  };
};

/**
 * Groups engagements by their type and returns counts for each type
 * 
 * @param engagements - Array of engagement documents to categorize
 * @returns Object with engagement types as keys and counts as values
 */
export const categorizeEngagementsByType = (
  engagements: IEngagementDocument[]
): Record<string, number> => {
  if (!engagements || !Array.isArray(engagements)) {
    return {};
  }
  
  const result: Record<string, number> = {};
  
  for (const engagement of engagements) {
    const type = engagement.type;
    result[type] = (result[type] || 0) + 1;
  }
  
  return result;
};

/**
 * Groups engagements by their status and returns counts for each status
 * 
 * @param engagements - Array of engagement documents to categorize
 * @returns Object with engagement statuses as keys and counts as values
 */
export const categorizeEngagementsByStatus = (
  engagements: IEngagementDocument[]
): Record<string, number> => {
  if (!engagements || !Array.isArray(engagements)) {
    return {};
  }
  
  const result: Record<string, number> = {};
  
  for (const engagement of engagements) {
    const status = engagement.status;
    result[status] = (result[status] || 0) + 1;
  }
  
  return result;
};

/**
 * Identifies the most active responders in a collection of engagements
 * 
 * @param engagements - Array of engagement documents to analyze
 * @param limit - Maximum number of top responders to return (default: 5)
 * @returns Array of top responders with their response counts
 */
export const identifyTopResponders = (
  engagements: IEngagementDocument[],
  limit: number = 5
): Array<{userId: string, responseCount: number}> => {
  if (!engagements || !Array.isArray(engagements)) {
    return [];
  }
  
  const responderMap = new Map<string, number>();
  
  // Count responses by user
  for (const engagement of engagements) {
    for (const response of engagement.responses) {
      const userId = response.userId;
      responderMap.set(userId, (responderMap.get(userId) || 0) + 1);
    }
  }
  
  // Convert map to array and sort by response count (descending)
  const topResponders = Array.from(responderMap.entries())
    .map(([userId, responseCount]) => ({ userId, responseCount }))
    .sort((a, b) => b.responseCount - a.responseCount)
    .slice(0, limit);
  
  return topResponders;
};

/**
 * Calculates engagement trends over time based on historical engagement data
 * 
 * @param engagements - Array of engagement documents to analyze
 * @param timeframeInDays - Number of days to include in the trend analysis (default: 30)
 * @returns Array of daily engagement metrics
 */
export const calculateEngagementTrends = (
  engagements: IEngagementDocument[],
  timeframeInDays: number = 30
): Array<{date: string, count: number, responseRate: number}> => {
  if (!engagements || !Array.isArray(engagements)) {
    return [];
  }
  
  // Determine date range
  const endDate = new Date();
  const startDate = addDaysToDate(endDate, -timeframeInDays);
  
  // Filter engagements within the timeframe
  const filteredEngagements = engagements.filter(engagement => 
    engagement.createdAt >= startDate && engagement.createdAt <= endDate
  );
  
  // Group engagements by date
  const engagementsByDate: Record<string, IEngagementDocument[]> = {};
  
  for (const engagement of filteredEngagements) {
    const dateStr = formatDate(engagement.createdAt);
    if (!engagementsByDate[dateStr]) {
      engagementsByDate[dateStr] = [];
    }
    engagementsByDate[dateStr].push(engagement);
  }
  
  // Create array of dates within the timeframe
  const result: Array<{date: string, count: number, responseRate: number}> = [];
  
  // Create a date iterator starting from the start date
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const dateEngagements = engagementsByDate[dateStr] || [];
    
    result.push({
      date: dateStr,
      count: dateEngagements.length,
      responseRate: calculateResponseRate(dateEngagements)
    });
    
    // Move to next day
    currentDate = addDaysToDate(currentDate, 1);
  }
  
  return result;
};

/**
 * Analyzes engagement data to detect patterns in user engagement behavior
 * 
 * @param engagements - Array of engagement documents to analyze
 * @returns Object containing detected engagement patterns
 */
export const detectEngagementPatterns = (
  engagements: IEngagementDocument[]
): object => {
  if (!engagements || !Array.isArray(engagements) || engagements.length === 0) {
    return {
      patterns: [],
      timeOfDay: {},
      dayOfWeek: {},
      engagementTypeEffectiveness: {},
      recommendedTimes: [],
      recommendedTypes: []
    };
  }
  
  // Initialize data structures for analysis
  const responsesByHour: Record<number, {count: number, total: number}> = {};
  const responsesByDay: Record<number, {count: number, total: number}> = {};
  const responsesByType: Record<string, {count: number, total: number}> = {};
  
  // Initialize hours and days
  for (let hour = 0; hour < 24; hour++) {
    responsesByHour[hour] = { count: 0, total: 0 };
  }
  
  for (let day = 0; day < 7; day++) {
    responsesByDay[day] = { count: 0, total: 0 };
  }
  
  // Analyze engagements
  for (const engagement of engagements) {
    const type = engagement.type;
    
    // Initialize type if not exists
    if (!responsesByType[type]) {
      responsesByType[type] = { count: 0, total: 0 };
    }
    
    const hasResponses = engagement.responses.length > 0;
    responsesByType[type].total += 1;
    if (hasResponses) {
      responsesByType[type].count += 1;
    }
    
    // Analyze delivery time if available
    if (engagement.deliveredAt) {
      const hour = engagement.deliveredAt.getHours();
      const day = engagement.deliveredAt.getDay();
      
      responsesByHour[hour].total += 1;
      responsesByDay[day].total += 1;
      
      if (hasResponses) {
        responsesByHour[hour].count += 1;
        responsesByDay[day].count += 1;
      }
    }
  }
  
  // Calculate response rates
  const hourlyResponseRates: Record<number, number> = {};
  const dailyResponseRates: Record<number, number> = {};
  const typeResponseRates: Record<string, number> = {};
  
  for (let hour = 0; hour < 24; hour++) {
    const { count, total } = responsesByHour[hour];
    hourlyResponseRates[hour] = total > 0 ? (count / total) * 100 : 0;
  }
  
  for (let day = 0; day < 7; day++) {
    const { count, total } = responsesByDay[day];
    dailyResponseRates[day] = total > 0 ? (count / total) * 100 : 0;
  }
  
  for (const type in responsesByType) {
    const { count, total } = responsesByType[type];
    typeResponseRates[type] = total > 0 ? (count / total) * 100 : 0;
  }
  
  // Identify optimal times (top 3 hours)
  const optimalHours = Object.entries(hourlyResponseRates)
    .filter(([_, rate]) => rate > 0)
    .sort(([_, rateA], [__, rateB]) => rateB - rateA)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  // Identify optimal days (top 2 days)
  const optimalDays = Object.entries(dailyResponseRates)
    .filter(([_, rate]) => rate > 0)
    .sort(([_, rateA], [__, rateB]) => rateB - rateA)
    .slice(0, 2)
    .map(([day]) => parseInt(day));
  
  // Identify most effective engagement types
  const effectiveTypes = Object.entries(typeResponseRates)
    .filter(([_, rate]) => rate > 0)
    .sort(([_, rateA], [__, rateB]) => rateB - rateA)
    .map(([type]) => type);
  
  // Convert day numbers to day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const optimalDayNames = optimalDays.map(day => dayNames[day]);
  
  // Format optimal hours in 12-hour format
  const optimalTimeStrings = optimalHours.map(hour => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}${period}`;
  });
  
  // Build recommended time slots combining days and hours
  const recommendedTimes = optimalDayNames.flatMap(day => 
    optimalTimeStrings.map(time => `${day} at ${time}`)
  );
  
  return {
    patterns: [
      optimalHours.length > 0 ? `Higher engagement observed at ${optimalTimeStrings.join(', ')}` : null,
      optimalDays.length > 0 ? `Higher engagement observed on ${optimalDayNames.join(', ')}` : null,
      effectiveTypes.length > 0 ? `Most effective engagement type: ${effectiveTypes[0]}` : null
    ].filter(Boolean),
    timeOfDay: hourlyResponseRates,
    dayOfWeek: dailyResponseRates.map((rate, index) => ({ day: dayNames[index], responseRate: rate })),
    engagementTypeEffectiveness: typeResponseRates,
    recommendedTimes,
    recommendedTypes: effectiveTypes
  };
};

/**
 * Determines if a new engagement should be generated for a tribe based on activity levels
 * 
 * @param recentEngagements - Array of recent engagement documents for the tribe
 * @param tribeActivityLevel - Activity level score for the tribe (1-10)
 * @param daysSinceLastEngagement - Days since the last engagement was created
 * @returns True if a new engagement should be generated, false otherwise
 */
export const shouldGenerateEngagement = (
  recentEngagements: IEngagementDocument[],
  tribeActivityLevel: number,
  daysSinceLastEngagement: number
): boolean => {
  // Validate inputs
  if (!Array.isArray(recentEngagements)) {
    return false;
  }
  
  if (isNaN(tribeActivityLevel) || tribeActivityLevel < 1 || tribeActivityLevel > 10) {
    tribeActivityLevel = 5; // Default to medium activity level
  }
  
  if (isNaN(daysSinceLastEngagement) || daysSinceLastEngagement < 0) {
    return true; // If we can't determine days since last engagement, default to generating one
  }
  
  // Check if there are any active engagements (pending or delivered)
  const hasActiveEngagements = recentEngagements.some(engagement => 
    engagement.status === EngagementStatus.PENDING || 
    engagement.status === EngagementStatus.DELIVERED
  );
  
  // If there are active engagements, don't generate a new one
  if (hasActiveEngagements) {
    return false;
  }
  
  // Calculate engagement frequency based on tribe activity level
  // Higher activity level = shorter time between engagements
  // Scale: 1 (lowest activity) = 7 days, 10 (highest activity) = 1 day
  const engagementFrequency = Math.max(1, Math.ceil(8 - (tribeActivityLevel * 0.7)));
  
  // Generate if enough time has passed since last engagement
  return daysSinceLastEngagement >= engagementFrequency;
};

/**
 * Recommends the most appropriate engagement type based on tribe context and history
 * 
 * @param tribeContext - Object containing tribe context information
 * @param engagementHistory - Array of previous engagement documents for the tribe
 * @returns The recommended engagement type
 */
export const recommendEngagementType = (
  tribeContext: object,
  engagementHistory: IEngagementDocument[]
): EngagementType => {
  // Validate inputs
  if (!tribeContext || typeof tribeContext !== 'object') {
    tribeContext = {};
  }
  
  if (!engagementHistory || !Array.isArray(engagementHistory)) {
    engagementHistory = [];
  }
  
  // Extract context information with defaults
  const {
    activityLevel = 5, // 1-10 scale
    hasUpcomingEvents = false,
    daysSinceLastMeetup = 14,
    interestCategories = [],
    personalityTraits = []
  } = tribeContext as any;
  
  // Get the most recent engagement type to avoid repetition
  const mostRecentEngagement = engagementHistory.length > 0 
    ? engagementHistory.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0]
    : null;
  
  const mostRecentType = mostRecentEngagement?.type;
  
  // Calculate type weights based on context and history
  const typeWeights: Record<EngagementType, number> = {
    [EngagementType.CONVERSATION_PROMPT]: 10,
    [EngagementType.ACTIVITY_SUGGESTION]: 10,
    [EngagementType.GROUP_CHALLENGE]: 10,
    [EngagementType.POLL_QUESTION]: 10,
    [EngagementType.MEETUP_SUGGESTION]: 10
  };
  
  // Analyze engagement history
  if (engagementHistory.length > 0) {
    // Calculate response rates by type
    const responseRatesByType: Record<string, {responses: number, total: number}> = {};
    
    for (const engagement of engagementHistory) {
      const type = engagement.type;
      
      if (!responseRatesByType[type]) {
        responseRatesByType[type] = { responses: 0, total: 0 };
      }
      
      responseRatesByType[type].total += 1;
      if (engagement.responses.length > 0) {
        responseRatesByType[type].responses += 1;
      }
    }
    
    // Adjust weights based on historical response rates
    for (const type in responseRatesByType) {
      const { responses, total } = responseRatesByType[type];
      const responseRate = total > 0 ? (responses / total) * 100 : 0;
      
      // Increase weight for types with higher response rates
      if (responseRate > 70) {
        typeWeights[type as EngagementType] += 5;
      } else if (responseRate > 50) {
        typeWeights[type as EngagementType] += 3;
      } else if (responseRate < 30) {
        typeWeights[type as EngagementType] -= 3;
      }
    }
  }
  
  // Activity level adjustments
  if (activityLevel <= 3) {
    // For low activity tribes, prioritize conversation prompts and polls
    typeWeights[EngagementType.CONVERSATION_PROMPT] += 5;
    typeWeights[EngagementType.POLL_QUESTION] += 3;
    typeWeights[EngagementType.GROUP_CHALLENGE] -= 2;
  } else if (activityLevel >= 7) {
    // For high activity tribes, prioritize challenges and meetups
    typeWeights[EngagementType.GROUP_CHALLENGE] += 4;
    typeWeights[EngagementType.MEETUP_SUGGESTION] += 5;
  } else {
    // For medium activity, prefer activity suggestions
    typeWeights[EngagementType.ACTIVITY_SUGGESTION] += 3;
  }
  
  // Event-based adjustments
  if (hasUpcomingEvents) {
    // Don't suggest meetups if there's already an upcoming event
    typeWeights[EngagementType.MEETUP_SUGGESTION] -= 5;
  } else if (daysSinceLastMeetup > 21) {
    // Encourage meetups if it's been a while
    typeWeights[EngagementType.MEETUP_SUGGESTION] += 5;
  }
  
  // Avoid repeating the most recent engagement type
  if (mostRecentType) {
    typeWeights[mostRecentType] -= 7;
  }
  
  // Select the type with the highest weight
  let highestWeight = -1;
  let recommendedType = EngagementType.CONVERSATION_PROMPT; // Default
  
  for (const type in typeWeights) {
    if (typeWeights[type as EngagementType] > highestWeight) {
      highestWeight = typeWeights[type as EngagementType];
      recommendedType = type as EngagementType;
    }
  }
  
  return recommendedType;
};

/**
 * Validates engagement content for appropriateness and quality
 * 
 * @param content - The engagement content to validate
 * @param type - The type of engagement the content is for
 * @returns True if content is valid, false otherwise
 */
export const validateEngagementContent = (
  content: string,
  type: EngagementType
): boolean => {
  try {
    // Basic validation
    validateString(content);
    
    // Check content length
    const minLength = 10;
    let maxLength = 500;
    
    // Adjust max length based on engagement type
    if (type === EngagementType.CONVERSATION_PROMPT) {
      maxLength = 300;
    } else if (type === EngagementType.GROUP_CHALLENGE) {
      maxLength = 1000; // Challenges may need more detailed instructions
    }
    
    if (content.length < minLength || content.length > maxLength) {
      return false;
    }
    
    // Check for prohibited content
    const prohibitedPatterns = [
      /^\s*$/,                         // Empty or whitespace only
      /([A-Za-z0-9])\1{5,}/,           // Repetitive characters (e.g., "aaaaaa")
      /<\/?[a-z][\s\S]*>/i,            // HTML tags
      /http[s]?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/ // URLs
    ];
    
    for (const pattern of prohibitedPatterns) {
      if (pattern.test(content)) {
        return false;
      }
    }
    
    // Type-specific validation
    switch (type) {
      case EngagementType.CONVERSATION_PROMPT:
        // For conversation prompts, check if it ends with a question or involves a call to action
        if (!content.includes('?') && !/\bwould\b|\bshare\b|\bdiscuss\b|\btell\b/i.test(content)) {
          return false;
        }
        break;
        
      case EngagementType.ACTIVITY_SUGGESTION:
      case EngagementType.MEETUP_SUGGESTION:
        // For activity/meetup suggestions, check for actionable content
        if (!/\bdo\b|\btry\b|\bvisit\b|\bgo\b|\bexplore\b|\battend\b|\bjoin\b/i.test(content)) {
          return false;
        }
        break;
        
      case EngagementType.GROUP_CHALLENGE:
        // For challenges, check for clear instructions or goals
        if (!/\bchallenge\b|\bcomplete\b|\btry\b|\bcreate\b|\bshare\b|\bgoal\b/i.test(content)) {
          return false;
        }
        break;
        
      case EngagementType.POLL_QUESTION:
        // For poll questions, check for question format
        if (!content.includes('?')) {
          return false;
        }
        break;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};