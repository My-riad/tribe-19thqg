/**
 * Engagement Service Utilities Index
 * 
 * This file serves as a central export point for all utility functions from 
 * the engagement service's utils directory. It simplifies imports throughout 
 * the engagement service by providing a single source for utility functions.
 * 
 * These utilities support AI-driven continuous engagement features, including
 * conversation prompts, real-time group challenges, and activity suggestions
 * that maintain user engagement and encourage transitions from digital to
 * physical interactions.
 */

// Import all engagement utility functions as a namespace
import * as engagementUtil from './engagement.util';

// Re-export specific functions with their original types and signatures
export const mapEngagementTypeToPromptType = engagementUtil.mapEngagementTypeToPromptType;
export const calculateResponseRate = engagementUtil.calculateResponseRate;
export const getEngagementExpiryDate = engagementUtil.getEngagementExpiryDate;
export const formatEngagementForResponse = engagementUtil.formatEngagementForResponse;
export const categorizeEngagementsByType = engagementUtil.categorizeEngagementsByType;
export const categorizeEngagementsByStatus = engagementUtil.categorizeEngagementsByStatus;
export const identifyTopResponders = engagementUtil.identifyTopResponders;
export const calculateEngagementTrends = engagementUtil.calculateEngagementTrends;
export const detectEngagementPatterns = engagementUtil.detectEngagementPatterns;
export const shouldGenerateEngagement = engagementUtil.shouldGenerateEngagement;
export const recommendEngagementType = engagementUtil.recommendEngagementType;
export const validateEngagementContent = engagementUtil.validateEngagementContent;