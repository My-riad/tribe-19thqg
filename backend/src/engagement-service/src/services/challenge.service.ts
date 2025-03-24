import mongoose from 'mongoose';
import axios from 'axios';
import { 
  Challenge, 
  IChallengeDocument, 
  IChallengeCreate, 
  IChallengeUpdate, 
  IChallengeResponse,
  IChallengeParticipation,
  ChallengeType,
  ChallengeStatus
} from '../models/challenge.model';
import { EngagementType, EngagementTrigger } from '../models/engagement.model';
import { challengePrompts } from '../prompts/challenge.prompts';
import { logger } from '../../../shared/src/utils/logger.util';
import { ApiError } from '../../../shared/src/errors/api.error';
import metrics from '../../../config/metrics';

/**
 * Creates a new challenge for a tribe
 * @param challengeData - The challenge data for creation
 * @returns The created challenge
 */
async function createChallenge(challengeData: IChallengeCreate): Promise<IChallengeResponse> {
  try {
    logger.info('Creating new challenge', { tribeId: challengeData.tribeId, type: challengeData.type });
    
    // Set default status if not provided
    if (!challengeData.status) {
      challengeData.status = ChallengeStatus.PENDING;
    }
    
    // Create and save the challenge
    const challenge = new Challenge(challengeData);
    await challenge.save();
    
    logger.info('Challenge created successfully', { challengeId: challenge._id });
    return formatChallengeResponse(challenge);
  } catch (error) {
    logger.error('Error creating challenge', error);
    if (error.name === 'ValidationError') {
      throw ApiError.badRequest('Invalid challenge data: ' + error.message);
    }
    throw ApiError.internal('Failed to create challenge', { error: error.message });
  }
}

/**
 * Retrieves a challenge by its ID
 * @param challengeId - The ID of the challenge to retrieve
 * @param userId - Optional user ID to check participation status
 * @returns The challenge with user participation data
 */
async function getChallenge(challengeId: string, userId?: string): Promise<IChallengeResponse> {
  try {
    logger.info('Retrieving challenge', { challengeId, userId });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    logger.info('Challenge retrieved successfully', { challengeId });
    return formatChallengeResponse(challenge, userId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error retrieving challenge', error);
    throw ApiError.internal('Failed to retrieve challenge', { error: error.message });
  }
}

/**
 * Updates an existing challenge
 * @param challengeId - The ID of the challenge to update
 * @param updateData - The data to update the challenge with
 * @returns The updated challenge
 */
async function updateChallenge(challengeId: string, updateData: IChallengeUpdate): Promise<IChallengeResponse> {
  try {
    logger.info('Updating challenge', { challengeId, updateData });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    // Update only the fields that are provided
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        challenge[key] = updateData[key];
      }
    });
    
    await challenge.save();
    
    logger.info('Challenge updated successfully', { challengeId });
    return formatChallengeResponse(challenge);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error updating challenge', error);
    if (error.name === 'ValidationError') {
      throw ApiError.badRequest('Invalid update data: ' + error.message);
    }
    throw ApiError.internal('Failed to update challenge', { error: error.message });
  }
}

/**
 * Deletes a challenge by its ID
 * @param challengeId - The ID of the challenge to delete
 */
async function deleteChallenge(challengeId: string): Promise<void> {
  try {
    logger.info('Deleting challenge', { challengeId });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    await Challenge.deleteOne({ _id: challengeId });
    
    logger.info('Challenge deleted successfully', { challengeId });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error deleting challenge', error);
    throw ApiError.internal('Failed to delete challenge', { error: error.message });
  }
}

/**
 * Lists challenges based on filter criteria
 * @param filters - The filters to apply
 * @param pagination - The pagination parameters
 * @param userId - Optional user ID to check participation status
 * @returns List of challenges and total count
 */
async function listChallenges(
  filters: {
    tribeId?: string;
    type?: ChallengeType;
    status?: ChallengeStatus;
    createdBy?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    userId?: string;
    aiGenerated?: boolean;
  },
  pagination: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  },
  userId?: string
): Promise<{ challenges: IChallengeResponse[]; total: number }> {
  try {
    logger.info('Listing challenges', { filters, pagination });
    
    // Build query based on filters
    const query: any = {};
    
    if (filters.tribeId) {
      query.tribeId = filters.tribeId;
    }
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }
    
    if (filters.aiGenerated !== undefined) {
      query.aiGenerated = filters.aiGenerated;
    }
    
    // Date range filters
    if (filters.startDateFrom || filters.startDateTo) {
      query.startDate = {};
      if (filters.startDateFrom) {
        query.startDate.$gte = filters.startDateFrom;
      }
      if (filters.startDateTo) {
        query.startDate.$lte = filters.startDateTo;
      }
    }
    
    if (filters.endDateFrom || filters.endDateTo) {
      query.endDate = {};
      if (filters.endDateFrom) {
        query.endDate.$gte = filters.endDateFrom;
      }
      if (filters.endDateTo) {
        query.endDate.$lte = filters.endDateTo;
      }
    }
    
    // Filter by participation
    if (filters.userId) {
      query.participants = filters.userId;
    }
    
    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    
    // Apply sorting
    const sortBy = pagination.sortBy || 'createdAt';
    const sortDirection = pagination.sortDirection || 'desc';
    const sort: any = {};
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const [challenges, total] = await Promise.all([
      Challenge.find(query).sort(sort).skip(skip).limit(limit),
      Challenge.countDocuments(query)
    ]);
    
    logger.info('Challenges retrieved successfully', { count: challenges.length, total });
    
    return {
      challenges: challenges.map(challenge => formatChallengeResponse(challenge, userId)),
      total
    };
  } catch (error) {
    logger.error('Error listing challenges', error);
    throw ApiError.internal('Failed to list challenges', { error: error.message });
  }
}

/**
 * Adds a user as a participant in a challenge
 * @param challengeId - The ID of the challenge
 * @param userId - The ID of the user to add as participant
 * @returns The updated challenge with the new participant
 */
async function participateInChallenge(challengeId: string, userId: string): Promise<IChallengeResponse> {
  try {
    logger.info('Adding participant to challenge', { challengeId, userId });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    // Check if challenge is still active
    if (challenge.status === ChallengeStatus.COMPLETED || challenge.status === ChallengeStatus.CANCELLED) {
      throw ApiError.badRequest('Cannot participate in a completed or cancelled challenge');
    }
    
    // Check if user is already a participant
    if (challenge.participants.includes(userId)) {
      logger.info('User is already a participant', { challengeId, userId });
      return formatChallengeResponse(challenge, userId);
    }
    
    // Add user to participants
    challenge.participants.push(userId);
    await challenge.save();
    
    // Track participation metrics
    const challengeMetrics = metrics.createServiceMetrics('engagement_challenge');
    challengeMetrics.requestCounter.inc({ 
      endpoint: 'challenge', 
      method: 'participate' 
    });
    
    logger.info('User added as participant successfully', { challengeId, userId });
    return formatChallengeResponse(challenge, userId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error adding participant to challenge', error);
    throw ApiError.internal('Failed to add participant to challenge', { error: error.message });
  }
}

/**
 * Marks a challenge as completed by a user
 * @param challengeId - The ID of the challenge
 * @param userId - The ID of the user completing the challenge
 * @param completionData - Optional data about the completion (evidence, etc.)
 * @returns The updated challenge with completion data
 */
async function completeChallenge(
  challengeId: string, 
  userId: string, 
  completionData: { 
    evidence?: string 
  } = {}
): Promise<IChallengeResponse> {
  try {
    logger.info('Marking challenge as completed by user', { challengeId, userId });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    if (!userId) {
      throw ApiError.badRequest('User ID is required');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    // Check if challenge is still active
    if (challenge.status === ChallengeStatus.COMPLETED || challenge.status === ChallengeStatus.CANCELLED) {
      throw ApiError.badRequest('Cannot complete a challenge that is already completed or cancelled');
    }
    
    // Check if user is a participant
    if (!challenge.participants.includes(userId)) {
      throw ApiError.badRequest('User is not a participant in this challenge');
    }
    
    // Check if user has already completed the challenge
    const alreadyCompleted = challenge.completedBy.some(completion => completion.userId === userId);
    if (alreadyCompleted) {
      logger.info('User has already completed this challenge', { challengeId, userId });
      return formatChallengeResponse(challenge, userId);
    }
    
    // Add completion data
    challenge.completedBy.push({
      userId,
      completedAt: new Date(),
      evidence: completionData.evidence
    });
    
    // Check if all participants have completed, and if so, update challenge status
    if (challenge.participants.length > 0 && 
        challenge.participants.length === challenge.completedBy.length) {
      challenge.status = ChallengeStatus.COMPLETED;
    }
    
    await challenge.save();
    
    // Track completion metrics
    const challengeMetrics = metrics.createServiceMetrics('engagement_challenge');
    challengeMetrics.requestCounter.inc({ 
      endpoint: 'challenge', 
      method: 'complete' 
    });
    
    logger.info('Challenge marked as completed by user', { challengeId, userId });
    return formatChallengeResponse(challenge, userId);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error completing challenge', error);
    throw ApiError.internal('Failed to complete challenge', { error: error.message });
  }
}

/**
 * Generates a new AI-powered challenge for a tribe
 * @param tribeId - The ID of the tribe to generate a challenge for
 * @param type - The type of challenge to generate
 * @returns The generated challenge
 */
async function generateChallenge(tribeId: string, type: ChallengeType): Promise<IChallengeResponse> {
  try {
    logger.info('Generating challenge for tribe', { tribeId, type });
    
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    
    // Get tribe data (this would fetch tribe details from the tribe service)
    // For now, we'll mock this part
    const tribeData = {
      id: tribeId,
      name: 'Tribe Name', // This would be fetched from tribe service
      members: [], // This would include member profiles
      interests: ['Outdoor Adventures', 'Photography'], // Example interests
      recentActivities: [] // Recent tribe activities
    };
    
    // Determine whether to use AI or template-based generation
    // For this implementation, we'll use a simple rule: 70% AI, 30% template-based
    const useAI = Math.random() < 0.7;
    
    let challengeContent;
    
    if (useAI) {
      logger.info('Using AI to generate challenge content', { tribeId, type });
      challengeContent = await generateAIChallenge(type, tribeData);
    } else {
      logger.info('Using templates to generate challenge content', { tribeId, type });
      challengeContent = await generateTemplateBasedChallenge(type, tribeData);
    }
    
    // Create the challenge
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Default to 1-week challenges
    
    const challengeData: IChallengeCreate = {
      tribeId,
      title: challengeContent.title,
      description: challengeContent.description,
      type,
      status: ChallengeStatus.PENDING,
      startDate: new Date(),
      endDate,
      createdBy: 'system', // This would be configurable
      pointValue: 10, // Default point value
      aiGenerated: useAI,
      metadata: challengeContent.metadata || {}
    };
    
    const challenge = new Challenge(challengeData);
    await challenge.save();
    
    logger.info('Challenge generated successfully', { challengeId: challenge._id });
    return formatChallengeResponse(challenge);
  } catch (error) {
    logger.error('Error generating challenge', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal('Failed to generate challenge', { error: error.message });
  }
}

/**
 * Activates a challenge, making it visible to tribe members
 * @param challengeId - The ID of the challenge to activate
 * @returns The activated challenge
 */
async function activateChallenge(challengeId: string): Promise<IChallengeResponse> {
  try {
    logger.info('Activating challenge', { challengeId });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    if (challenge.status !== ChallengeStatus.PENDING) {
      throw ApiError.badRequest('Only pending challenges can be activated');
    }
    
    challenge.status = ChallengeStatus.ACTIVE;
    await challenge.save();
    
    logger.info('Challenge activated successfully', { challengeId });
    return formatChallengeResponse(challenge);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error activating challenge', error);
    throw ApiError.internal('Failed to activate challenge', { error: error.message });
  }
}

/**
 * Cancels an active challenge
 * @param challengeId - The ID of the challenge to cancel
 * @returns The cancelled challenge
 */
async function cancelChallenge(challengeId: string): Promise<IChallengeResponse> {
  try {
    logger.info('Cancelling challenge', { challengeId });
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      throw ApiError.badRequest('Invalid challenge ID');
    }
    
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      throw ApiError.notFound('Challenge not found');
    }
    
    if (challenge.status !== ChallengeStatus.ACTIVE && challenge.status !== ChallengeStatus.PENDING) {
      throw ApiError.badRequest('Only active or pending challenges can be cancelled');
    }
    
    challenge.status = ChallengeStatus.CANCELLED;
    await challenge.save();
    
    logger.info('Challenge cancelled successfully', { challengeId });
    return formatChallengeResponse(challenge);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error cancelling challenge', error);
    throw ApiError.internal('Failed to cancel challenge', { error: error.message });
  }
}

/**
 * Checks and updates the status of challenges based on their end dates
 */
async function checkChallengeStatus(): Promise<void> {
  try {
    logger.info('Checking and updating challenge statuses');
    
    // Find active challenges where end date has passed
    const now = new Date();
    const expiredChallenges = await Challenge.find({
      status: ChallengeStatus.ACTIVE,
      endDate: { $lt: now }
    });
    
    if (expiredChallenges.length === 0) {
      logger.info('No expired challenges found');
      return;
    }
    
    // Update all expired challenges to COMPLETED status
    const updateResult = await Challenge.updateMany(
      { _id: { $in: expiredChallenges.map(c => c._id) } },
      { $set: { status: ChallengeStatus.COMPLETED } }
    );
    
    logger.info('Expired challenges updated to completed status', {
      count: updateResult.modifiedCount
    });
    
    // Track expired challenges in metrics
    const challengeMetrics = metrics.createServiceMetrics('engagement_challenge');
    challengeMetrics.requestCounter.inc({
      endpoint: 'challenge',
      method: 'expire'
    }, expiredChallenges.length);
    
  } catch (error) {
    logger.error('Error checking challenge status', error);
    // We don't throw here since this is typically called by a scheduled job
  }
}

/**
 * Gets challenge metrics for a tribe
 * @param tribeId - The ID of the tribe to get metrics for
 * @param timeRange - Optional time range for metrics
 * @returns Challenge metrics for the tribe
 */
async function getChallengeMetrics(
  tribeId: string,
  timeRange?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<object> {
  try {
    logger.info('Getting challenge metrics for tribe', { tribeId, timeRange });
    
    if (!tribeId) {
      throw ApiError.badRequest('Tribe ID is required');
    }
    
    // Build query based on tribe ID and time range
    const query: any = { tribeId };
    
    if (timeRange) {
      if (timeRange.startDate || timeRange.endDate) {
        query.createdAt = {};
        if (timeRange.startDate) {
          query.createdAt.$gte = timeRange.startDate;
        }
        if (timeRange.endDate) {
          query.createdAt.$lte = timeRange.endDate;
        }
      }
    }
    
    // Get challenges for this tribe
    const challenges = await Challenge.find(query);
    
    // Calculate metrics
    const totalChallenges = challenges.length;
    
    // Calculate completion rate
    const completedChallenges = challenges.filter(c => c.status === ChallengeStatus.COMPLETED);
    const completionRate = totalChallenges > 0 ? completedChallenges.length / totalChallenges : 0;
    
    // Calculate challenges by type
    const challengesByType: Record<string, number> = {};
    challenges.forEach(c => {
      challengesByType[c.type] = (challengesByType[c.type] || 0) + 1;
    });
    
    // Calculate participation metrics
    const participationMap = new Map<string, number>();
    challenges.forEach(c => {
      c.participants.forEach(userId => {
        participationMap.set(userId, (participationMap.get(userId) || 0) + 1);
      });
    });
    
    // Get top participants
    const topParticipants = Array.from(participationMap.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get recent challenges
    const recentChallenges = challenges
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(c => formatChallengeResponse(c));
    
    // Compile metrics
    const metrics = {
      totalChallenges,
      completionRate,
      challengesByType,
      topParticipants,
      recentChallenges,
      timeRange: {
        startDate: timeRange?.startDate || challenges[challenges.length - 1]?.createdAt || new Date(),
        endDate: timeRange?.endDate || new Date()
      }
    };
    
    logger.info('Challenge metrics retrieved successfully', { tribeId });
    return metrics;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting challenge metrics', error);
    throw ApiError.internal('Failed to get challenge metrics', { error: error.message });
  }
}

/**
 * Generates challenge content using predefined templates
 * @param type - The type of challenge to generate
 * @param tribeData - Data about the tribe to personalize the challenge
 * @returns The generated challenge content
 */
async function generateTemplateBasedChallenge(
  type: ChallengeType,
  tribeData: any
): Promise<{ title: string; description: string; metadata: any }> {
  logger.info('Generating template-based challenge', { type });
  
  // Select appropriate templates based on challenge type
  let eligibleTemplates = challengePrompts.filter(p => {
    // Match by challenge type
    let typeMatch = false;
    
    switch (type) {
      case ChallengeType.PHOTO:
        typeMatch = p.content.toLowerCase().includes('photo');
        break;
      case ChallengeType.CREATIVE:
        typeMatch = p.content.toLowerCase().includes('creativ');
        break;
      case ChallengeType.SOCIAL:
        typeMatch = p.content.toLowerCase().includes('social') || 
                     p.content.toLowerCase().includes('share');
        break;
      case ChallengeType.EXPLORATION:
        typeMatch = p.content.toLowerCase().includes('explor');
        break;
      case ChallengeType.LEARNING:
        typeMatch = p.content.toLowerCase().includes('learn') || 
                     p.content.toLowerCase().includes('skill');
        break;
      case ChallengeType.WELLNESS:
        typeMatch = p.content.toLowerCase().includes('wellness') || 
                     p.content.toLowerCase().includes('health');
        break;
      default:
        typeMatch = true; // Default to include all if type doesn't match
    }
    
    return typeMatch;
  });
  
  // If no eligible templates found, use all templates
  if (eligibleTemplates.length === 0) {
    eligibleTemplates = challengePrompts;
  }
  
  // Further filter by tribe interests if available
  if (tribeData.interests && tribeData.interests.length > 0) {
    const interestFiltered = eligibleTemplates.filter(p => {
      return p.interestCategories.some(interest => 
        tribeData.interests.includes(interest)
      );
    });
    
    // Only use interest-filtered templates if we found some
    if (interestFiltered.length > 0) {
      eligibleTemplates = interestFiltered;
    }
  }
  
  // Select a random template from the eligible ones
  const randomIndex = Math.floor(Math.random() * eligibleTemplates.length);
  const selectedTemplate = eligibleTemplates[randomIndex];
  
  // Process template variables
  let content = selectedTemplate.content;
  
  // Replace {{interestCategory}} with actual tribe interest
  if (content.includes('{{interestCategory}}') && tribeData.interests && tribeData.interests.length > 0) {
    const randomInterest = tribeData.interests[Math.floor(Math.random() * tribeData.interests.length)];
    content = content.replace(/{{interestCategory}}/g, randomInterest);
  }
  
  // Replace {{theme}} with a random theme if available in metadata
  if (content.includes('{{theme}}') && selectedTemplate.metadata && selectedTemplate.metadata.themes) {
    const themes = selectedTemplate.metadata.themes;
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    content = content.replace(/{{theme}}/g, randomTheme);
  }
  
  // Replace other variables as needed
  content = content.replace(/{{location\/activity}}/g, 'your last meetup');
  content = content.replace(/{{deadline}}/g, 'next Friday');
  content = content.replace(/{{cuisineType\/ingredient\/theme}}/g, 'your favorite cuisine');
  content = content.replace(/{{song\/poem\/artwork}}/g, 'a favorite song');
  
  // Generate a title from content
  const title = content.split(':')[0].trim();
  const description = content.includes(':') ? content.split(':')[1].trim() : content;
  
  return {
    title,
    description,
    metadata: {
      ...selectedTemplate.metadata,
      templateId: selectedTemplate._id,
      generationMethod: 'template'
    }
  };
}

/**
 * Generates challenge content using AI via the orchestration service
 * @param type - The type of challenge to generate
 * @param tribeData - Data about the tribe to personalize the challenge
 * @returns The AI-generated challenge content
 */
async function generateAIChallenge(
  type: ChallengeType,
  tribeData: any
): Promise<{ title: string; description: string; metadata: any }> {
  try {
    logger.info('Generating AI challenge', { type });
    
    // Prepare the request payload for the AI orchestration service
    const payload = {
      prompt: {
        type: 'challenge_generation',
        challengeType: type,
        tribeContext: {
          id: tribeData.id,
          name: tribeData.name,
          interests: tribeData.interests,
          memberCount: tribeData.members.length,
          recentActivities: tribeData.recentActivities
        }
      },
      options: {
        maxTokens: 500,
        temperature: 0.7
      }
    };
    
    // Get the AI orchestration service URL from environment or configuration
    const aiOrchestrationUrl = process.env.AI_ORCHESTRATION_URL || 'http://ai-orchestration-service/api/generate';
    
    // Call the AI orchestration service
    const response = await axios.post(aiOrchestrationUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });
    
    if (!response.data || !response.data.result) {
      throw new Error('Invalid response from AI orchestration service');
    }
    
    // Process the AI response
    const aiResponse = response.data.result;
    
    // Extract title and description
    let title, description;
    
    if (aiResponse.title && aiResponse.description) {
      // If the AI returned structured data
      title = aiResponse.title;
      description = aiResponse.description;
    } else if (typeof aiResponse === 'string') {
      // If the AI returned a plain string, try to parse it
      const lines = aiResponse.split('\n').filter(line => line.trim());
      
      if (lines.length >= 2) {
        title = lines[0];
        description = lines.slice(1).join('\n');
      } else {
        // Fallback if we can't extract a clear title/description
        title = `${type} Challenge`;
        description = aiResponse;
      }
    } else {
      throw new Error('Unexpected AI response format');
    }
    
    return {
      title,
      description,
      metadata: {
        aiGenerated: true,
        generationMethod: 'ai',
        model: response.data.model || 'unknown',
        promptTokens: response.data.usage?.promptTokens,
        completionTokens: response.data.usage?.completionTokens
      }
    };
  } catch (error) {
    logger.error('Error generating AI challenge', error);
    
    // Fall back to template-based challenge generation
    logger.info('Falling back to template-based challenge generation');
    return generateTemplateBasedChallenge(type, tribeData);
  }
}

/**
 * Formats a challenge document into a response object
 * @param challenge - The challenge document to format
 * @param userId - Optional user ID to check participation status
 * @returns Formatted challenge response
 */
function formatChallengeResponse(challenge: IChallengeDocument, userId?: string): IChallengeResponse {
  // Calculate participant and completion counts
  const participantCount = challenge.participants.length;
  const completionCount = challenge.completedBy.length;
  
  // Check if the specified user is participating and has completed
  let userParticipation: IChallengeParticipation = {
    isParticipating: false,
    hasCompleted: false,
    completedAt: null,
    evidence: null
  };
  
  if (userId) {
    userParticipation.isParticipating = challenge.participants.includes(userId);
    
    if (userParticipation.isParticipating) {
      const completion = challenge.completedBy.find(c => c.userId === userId);
      if (completion) {
        userParticipation.hasCompleted = true;
        userParticipation.completedAt = completion.completedAt;
        userParticipation.evidence = completion.evidence;
      }
    }
  }
  
  // Format the response
  return {
    id: challenge._id.toString(),
    tribeId: challenge.tribeId,
    title: challenge.title,
    description: challenge.description,
    type: challenge.type,
    status: challenge.status,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    createdBy: challenge.createdBy,
    participantCount,
    completionCount,
    pointValue: challenge.pointValue,
    aiGenerated: challenge.aiGenerated,
    userParticipation,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt
  };
}

/**
 * Service class for managing challenges in the Tribe platform
 */
export class ChallengeService {
  private aiOrchestrationUrl: string;
  
  constructor() {
    this.aiOrchestrationUrl = process.env.AI_ORCHESTRATION_URL || 'http://ai-orchestration-service/api/generate';
  }
  
  /**
   * Creates a new challenge
   * @param challengeData - The challenge data for creation
   * @returns The created challenge
   */
  async createChallenge(challengeData: IChallengeCreate): Promise<IChallengeResponse> {
    return createChallenge(challengeData);
  }
  
  /**
   * Gets a challenge by ID
   * @param challengeId - The ID of the challenge
   * @param userId - Optional user ID to check participation status
   * @returns The challenge
   */
  async getChallenge(challengeId: string, userId?: string): Promise<IChallengeResponse> {
    return getChallenge(challengeId, userId);
  }
  
  /**
   * Updates a challenge
   * @param challengeId - The ID of the challenge
   * @param updateData - The data to update the challenge with
   * @returns The updated challenge
   */
  async updateChallenge(challengeId: string, updateData: IChallengeUpdate): Promise<IChallengeResponse> {
    return updateChallenge(challengeId, updateData);
  }
  
  /**
   * Deletes a challenge
   * @param challengeId - The ID of the challenge
   */
  async deleteChallenge(challengeId: string): Promise<void> {
    return deleteChallenge(challengeId);
  }
  
  /**
   * Lists challenges with filtering
   * @param filters - The filters to apply
   * @param pagination - The pagination parameters
   * @param userId - Optional user ID to check participation status
   * @returns List of challenges and total count
   */
  async listChallenges(
    filters: any,
    pagination: any,
    userId?: string
  ): Promise<{ challenges: IChallengeResponse[]; total: number }> {
    return listChallenges(filters, pagination, userId);
  }
  
  /**
   * Adds a user as a participant in a challenge
   * @param challengeId - The ID of the challenge
   * @param userId - The ID of the user
   * @returns The updated challenge
   */
  async participateInChallenge(challengeId: string, userId: string): Promise<IChallengeResponse> {
    return participateInChallenge(challengeId, userId);
  }
  
  /**
   * Marks a challenge as completed by a user
   * @param challengeId - The ID of the challenge
   * @param userId - The ID of the user
   * @param completionData - Optional completion data
   * @returns The updated challenge
   */
  async completeChallenge(
    challengeId: string,
    userId: string,
    completionData: any = {}
  ): Promise<IChallengeResponse> {
    return completeChallenge(challengeId, userId, completionData);
  }
  
  /**
   * Generates an AI-powered challenge
   * @param tribeId - The ID of the tribe
   * @param type - The type of challenge
   * @returns The generated challenge
   */
  async generateChallenge(tribeId: string, type: ChallengeType): Promise<IChallengeResponse> {
    return generateChallenge(tribeId, type);
  }
  
  /**
   * Activates a challenge
   * @param challengeId - The ID of the challenge
   * @returns The activated challenge
   */
  async activateChallenge(challengeId: string): Promise<IChallengeResponse> {
    return activateChallenge(challengeId);
  }
  
  /**
   * Cancels an active challenge
   * @param challengeId - The ID of the challenge
   * @returns The cancelled challenge
   */
  async cancelChallenge(challengeId: string): Promise<IChallengeResponse> {
    return cancelChallenge(challengeId);
  }
  
  /**
   * Checks and updates challenge statuses
   */
  async checkChallengeStatus(): Promise<void> {
    return checkChallengeStatus();
  }
  
  /**
   * Gets challenge metrics for a tribe
   * @param tribeId - The ID of the tribe
   * @param timeRange - Optional time range
   * @returns Challenge metrics
   */
  async getChallengeMetrics(
    tribeId: string,
    timeRange?: any
  ): Promise<object> {
    return getChallengeMetrics(tribeId, timeRange);
  }
}

// Create and export a singleton instance
export default new ChallengeService();