import { v4 as uuidv4 } from 'uuid'; // v9.0.0
import * as Handlebars from 'handlebars'; // v4.7.7
import {
  PromptTemplate,
  PromptVariable,
  PromptData,
  RenderedPrompt,
  PromptCategory,
  PromptVariableType
} from '../models/prompt.model';
import { OrchestrationFeature } from '../models/orchestration.model';
import { estimateTokenCount } from './model.util';
import { logger } from '../../../config/logging';
import { ValidationError } from '../../../shared/src/errors/validation.error';

/**
 * Renders a prompt template by substituting variables into the template string
 * 
 * @param template - The prompt template to render
 * @param variables - Object containing variables to substitute
 * @returns The rendered template with variables substituted
 * @throws ValidationError if template rendering fails
 */
export function renderPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, any>
): string {
  if (!template || !template.template) {
    throw ValidationError.invalidInput('Template is required for rendering');
  }

  try {
    // Validate that all required variables are provided
    validatePromptVariables(template.variables, variables);
    
    // Create Handlebars template compiler
    const compiler = Handlebars.compile(template.template);
    
    // Render the template with the provided variables
    const rendered = compiler(variables);
    
    logger.debug(`Rendered template ${template.id} successfully`);
    
    return rendered;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error(`Failed to render template ${template.id}`, error as Error);
    throw ValidationError.invalidInput(`Template rendering failed: ${(error as Error).message}`);
  }
}

/**
 * Validates that all required variables are provided and have the correct types
 * 
 * @param templateVariables - Array of template variable definitions
 * @param providedVariables - Object containing provided variable values
 * @returns True if all variables are valid, throws ValidationError otherwise
 * @throws ValidationError if variable validation fails
 */
export function validatePromptVariables(
  templateVariables: PromptVariable[],
  providedVariables: Record<string, any>
): boolean {
  if (!templateVariables || !providedVariables) {
    throw ValidationError.invalidInput('Template variables and provided variables are required');
  }

  // Check each template variable
  for (const variable of templateVariables) {
    // Check if required variable exists
    if (variable.required && 
        (providedVariables[variable.name] === undefined || providedVariables[variable.name] === null)) {
      throw ValidationError.requiredField(variable.name);
    }

    // Skip validation if variable is not provided and not required
    if (providedVariables[variable.name] === undefined) {
      continue;
    }

    // Validate type of variable
    const value = providedVariables[variable.name];
    
    switch (variable.type) {
      case PromptVariableType.STRING:
        if (typeof value !== 'string') {
          throw ValidationError.invalidType(variable.name, 'string');
        }
        break;
      case PromptVariableType.NUMBER:
        if (typeof value !== 'number' || isNaN(value)) {
          throw ValidationError.invalidType(variable.name, 'number');
        }
        break;
      case PromptVariableType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw ValidationError.invalidType(variable.name, 'boolean');
        }
        break;
      case PromptVariableType.ARRAY:
        if (!Array.isArray(value)) {
          throw ValidationError.invalidType(variable.name, 'array');
        }
        break;
      case PromptVariableType.OBJECT:
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw ValidationError.invalidType(variable.name, 'object');
        }
        break;
      default:
        logger.warn(`Unknown variable type ${variable.type} for ${variable.name}`);
    }
  }

  return true;
}

/**
 * Extracts variable placeholders from a template string
 * 
 * @param templateString - The template string to extract variables from
 * @returns Array of variable names found in the template
 */
export function extractVariablesFromTemplate(templateString: string): string[] {
  if (!templateString) {
    return [];
  }

  // Regular expression to match Handlebars variables {{ varName }}
  // This handles basic variables as well as helpers like {{#if varName}}
  const variableRegex = /{{([^{].*?)}}/g;
  const matches = templateString.match(variableRegex) || [];
  
  // Extract variable names from matches and remove duplicates
  const variables = matches.map(match => {
    // Remove {{ and }} and trim whitespace
    let variable = match.replace(/{{|}}/g, '').trim();
    
    // Handle helpers like {{#if varName}} - extract just the variable name
    if (variable.startsWith('#')) {
      const parts = variable.split(/\s+/);
      // Skip the helper name (#if, #each, etc.)
      if (parts.length > 1) {
        variable = parts[1];
      }
    } else if (variable.startsWith('/')) {
      // Skip closing helpers like {{/if}}
      return '';
    } else if (variable.startsWith('else')) {
      // Skip else helpers like {{else}}
      return '';
    }
    
    // Handle nested properties like {{user.name}}
    // We'll extract just the top-level variable (user)
    if (variable.includes('.')) {
      variable = variable.split('.')[0];
    }
    
    return variable;
  }).filter(Boolean); // Remove empty strings from helper closings
  
  // Remove duplicates and return
  return [...new Set(variables)];
}

/**
 * Creates a RenderedPrompt object from a template and rendered content
 * 
 * @param template - The prompt template that was rendered
 * @param renderedContent - The rendered content
 * @param variables - The variables used in rendering
 * @returns A new RenderedPrompt object
 */
export function createRenderedPrompt(
  template: PromptTemplate,
  renderedContent: string,
  variables: Record<string, any>
): RenderedPrompt {
  const id = uuidv4();
  const tokenCount = estimateTokenCount(renderedContent);
  
  const renderedPrompt: RenderedPrompt = {
    id,
    templateId: template.id,
    content: renderedContent,
    category: template.category,
    feature: template.feature,
    variables: { ...variables }, // Make a copy to avoid references
    tokenCount,
    createdAt: new Date()
  };
  
  return renderedPrompt;
}

/**
 * Optimizes a prompt for a specific orchestration feature
 * 
 * @param promptContent - The prompt content to optimize
 * @param feature - The orchestration feature to optimize for
 * @returns The optimized prompt content
 */
export function optimizePromptForFeature(
  promptContent: string,
  feature: OrchestrationFeature
): string {
  if (!promptContent) {
    return '';
  }

  let optimized = promptContent;

  // Apply feature-specific optimizations
  switch (feature) {
    case OrchestrationFeature.MATCHING:
      // Optimize for matching by enhancing clarity for compatibility analysis
      optimized = optimized
        .replace(/match/gi, 'find compatibility between')
        .replace(/compatible/gi, 'psychologically compatible')
        .replace(/group/gi, 'tribe')
        .replace(/identify/gi, 'analyze and identify');
      break;
      
    case OrchestrationFeature.PERSONALITY_ANALYSIS:
      // Optimize for personality analysis with structure for trait extraction
      optimized = optimized
        .replace(/analyze/gi, 'perform detailed personality analysis of')
        .replace(/traits/gi, 'personality traits')
        .replace(/identify/gi, 'clearly identify and categorize')
        .replace(/personality profile/gi, 'comprehensive personality profile');
      break;
      
    case OrchestrationFeature.ENGAGEMENT:
      // Optimize for engagement with creativity and engagement potential
      optimized = optimized
        .replace(/suggest/gi, 'create engaging suggestions for')
        .replace(/activities/gi, 'interactive activities')
        .replace(/ideas/gi, 'creative ideas')
        .replace(/engagement/gi, 'meaningful engagement');
      break;
      
    case OrchestrationFeature.RECOMMENDATION:
      // Optimize for relevant and diverse recommendations
      optimized = optimized
        .replace(/recommend/gi, 'provide personalized recommendations for')
        .replace(/events/gi, 'relevant events')
        .replace(/options/gi, 'tailored options')
        .replace(/suggest/gi, 'carefully curate');
      break;
      
    case OrchestrationFeature.CONVERSATION:
      // Optimize for natural language and conversational flow
      optimized = optimized
        .replace(/respond/gi, 'engage conversationally')
        .replace(/answer/gi, 'provide a thoughtful response to')
        .replace(/user/gi, 'tribe member')
        .replace(/conversation/gi, 'meaningful dialogue');
      break;
      
    default:
      // No specific optimizations for unknown features
      logger.debug(`No specific optimizations for feature: ${feature}`);
  }

  // Apply general optimizations for all prompts
  optimized = optimized
    // Remove multiple consecutive whitespace
    .replace(/\s+/g, ' ')
    // Ensure proper spacing after punctuation
    .replace(/([.!?])\s*(\w)/g, '$1 $2')
    // Ensure consistent list formatting
    .replace(/(\d+)\.(?!\s)/g, '$1. ')
    // Trim whitespace
    .trim();

  return optimized;
}

/**
 * Validates that template variables match the placeholders in the template string
 * 
 * @param template - The prompt template to validate
 * @returns True if variables match placeholders, throws ValidationError otherwise
 * @throws ValidationError if variables don't match placeholders
 */
export function validateTemplateVariablesMatch(template: PromptTemplate): boolean {
  if (!template || !template.template) {
    throw ValidationError.invalidInput('Template is required for validation');
  }

  // Extract placeholders from template
  const placeholders = extractVariablesFromTemplate(template.template);
  
  // Get declared variable names
  const declaredVariables = template.variables.map(v => v.name);
  
  // Find placeholders that don't have a corresponding variable
  const missingVariables = placeholders.filter(p => !declaredVariables.includes(p));
  
  // Find variables that aren't used in the template
  const unusedVariables = declaredVariables.filter(v => !placeholders.includes(v));
  
  if (missingVariables.length > 0) {
    throw ValidationError.invalidInput(
      `Template contains placeholders without corresponding variables: ${missingVariables.join(', ')}`
    );
  }
  
  if (unusedVariables.length > 0) {
    throw ValidationError.invalidInput(
      `Template defines variables that aren't used in placeholders: ${unusedVariables.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Truncates a prompt to fit within a maximum token limit
 * 
 * @param promptContent - The prompt content to truncate
 * @param maxTokens - The maximum number of tokens allowed
 * @returns The truncated prompt content
 */
export function truncatePromptToMaxTokens(
  promptContent: string,
  maxTokens: number
): string {
  if (!promptContent) {
    return '';
  }

  // Calculate current token count
  const currentTokens = estimateTokenCount(promptContent);
  
  // If already within limit, return as is
  if (currentTokens <= maxTokens) {
    return promptContent;
  }
  
  logger.debug(`Truncating prompt from ${currentTokens} to ${maxTokens} tokens`);
  
  // Split by sentences to preserve meaning
  const sentences = promptContent.match(/[^.!?]+[.!?]+/g) || [];
  
  let truncated = '';
  let estimatedTokens = 0;
  
  // Add sentences until we approach the limit
  for (const sentence of sentences) {
    const sentenceTokens = estimateTokenCount(sentence);
    
    if (estimatedTokens + sentenceTokens <= maxTokens - 3) { // Reserve space for ellipsis
      truncated += sentence;
      estimatedTokens += sentenceTokens;
    } else {
      break;
    }
  }
  
  // If we couldn't even fit one sentence, truncate a sentence
  if (truncated.length === 0 && sentences.length > 0) {
    const firstSentence = sentences[0];
    // Simple word-based truncation for the first sentence
    const words = firstSentence.split(/\s+/);
    let partialSentence = '';
    
    for (const word of words) {
      const withWord = partialSentence + (partialSentence ? ' ' : '') + word;
      const withWordTokens = estimateTokenCount(withWord);
      
      if (withWordTokens <= maxTokens - 3) { // Reserve space for ellipsis
        partialSentence = withWord;
      } else {
        break;
      }
    }
    
    truncated = partialSentence;
  }
  
  // Add ellipsis to indicate truncation
  if (truncated.length < promptContent.length) {
    truncated += '...';
  }
  
  return truncated;
}

/**
 * Gets a default prompt template for a specific feature
 * 
 * @param feature - The orchestration feature
 * @param category - The prompt category (system, user, assistant)
 * @returns A default prompt template
 */
export function getDefaultPromptForFeature(
  feature: OrchestrationFeature,
  category: PromptCategory
): PromptTemplate {
  const id = `default_${feature}_${category}`;
  const now = new Date();
  
  // Create base template structure
  const baseTemplate: PromptTemplate = {
    id,
    name: `Default ${feature} ${category} prompt`,
    description: `Default template for ${feature} feature, ${category} role`,
    template: '',
    variables: [],
    category,
    feature,
    version: '1.0.0',
    active: true,
    createdAt: now,
    updatedAt: now
  };
  
  // Add feature and category-specific content
  if (category === PromptCategory.SYSTEM) {
    switch (feature) {
      case OrchestrationFeature.MATCHING:
        baseTemplate.template = `You are an expert matchmaker for the Tribe platform. Your task is to analyze user profiles and find compatible matches for tribes based on personality traits, interests, and communication styles.

Please analyze the following profiles carefully and determine compatibility scores.

User profile to match:
{{userProfile}}

Potential tribe matches:
{{tribes}}

Matching criteria:
{{matchingCriteria}}

Provide detailed analysis of why certain tribes are good matches, focusing on personality compatibility, shared interests, and communication style. Assign a percentage score (0-100%) to each tribe and rank them from most to least compatible.`;
        
        baseTemplate.variables = [
          {
            name: 'userProfile',
            type: PromptVariableType.OBJECT,
            description: 'Profile of the user to match',
            required: true
          },
          {
            name: 'tribes',
            type: PromptVariableType.ARRAY,
            description: 'Array of tribe information to match against',
            required: true
          },
          {
            name: 'matchingCriteria',
            type: PromptVariableType.OBJECT,
            description: 'Criteria for determining matches',
            required: true
          }
        ];
        break;
        
      case OrchestrationFeature.PERSONALITY_ANALYSIS:
        baseTemplate.template = `You are an expert personality analyst for the Tribe platform. Your task is to analyze user responses and communication patterns to identify personality traits, communication styles, and social preferences.

Please analyze the following assessment responses:
{{assessmentResponses}}

User profile data:
{{userProfile}}

Provide a detailed personality analysis including:
1. Key personality traits (e.g., openness, conscientiousness, extraversion, etc.) with ratings on a scale of 1-10
2. Communication style preferences and patterns
3. Social interaction preferences (group sizes, interaction frequency, etc.)
4. Group compatibility indicators and ideal tribe characteristics
5. Potential interests and activities based on personality profile
6. Recommendations for types of people they might connect well with`;
        
        baseTemplate.variables = [
          {
            name: 'assessmentResponses',
            type: PromptVariableType.OBJECT,
            description: 'User responses to personality assessment questions',
            required: true
          },
          {
            name: 'userProfile',
            type: PromptVariableType.OBJECT,
            description: 'Basic user profile information',
            required: true
          }
        ];
        break;
        
      case OrchestrationFeature.ENGAGEMENT:
        baseTemplate.template = `You are an engagement specialist for the Tribe platform. Your task is to generate conversation prompts, challenges, and activity suggestions that will foster meaningful interactions within small groups.

Tribe information:
{{tribeData}}

Member profiles:
{{memberProfiles}}

Engagement history:
{{engagementHistory}}

Activity preferences:
{{activityPreferences}}

Generate 3-5 engaging prompts or activities that:
1. Are specifically tailored to this tribe's shared interests and dynamics
2. Consider the personality traits and preferences of all members
3. Foster meaningful interaction and strengthen connections
4. Encourage transition from online interaction to in-person meetups
5. Are original and not repetitive of past activities
6. Include clear instructions and expected outcomes

For each suggestion, explain why it would be effective for this specific group.`;
        
        baseTemplate.variables = [
          {
            name: 'tribeData',
            type: PromptVariableType.OBJECT,
            description: 'Information about the tribe',
            required: true
          },
          {
            name: 'memberProfiles',
            type: PromptVariableType.ARRAY,
            description: 'Profiles of tribe members',
            required: true
          },
          {
            name: 'engagementHistory',
            type: PromptVariableType.ARRAY,
            description: 'History of previous engagements',
            required: true
          },
          {
            name: 'activityPreferences',
            type: PromptVariableType.OBJECT,
            description: 'Activity preferences for the tribe',
            required: true
          }
        ];
        break;
        
      case OrchestrationFeature.RECOMMENDATION:
        baseTemplate.template = `You are an event recommendation specialist for the Tribe platform. Your task is to suggest local events, activities, and venues that would appeal to a specific tribe based on their interests and constraints.

Tribe information:
{{tribeData}}

Member profiles:
{{memberProfiles}}

Location data:
{{location}}

Weather forecast:
{{weatherData}}

Available event options:
{{eventOptions}}

Budget constraints:
{{budgetConstraints}}

Recommend 3-5 activities that:
1. Match the tribe's collective interests and past activity preferences
2. Are appropriate for the current weather conditions
3. Fit within the specified budget constraints
4. Are geographically accessible to members
5. Accommodate the tribe size (typically 4-8 people)
6. Provide opportunities for meaningful conversation and connection

For each recommendation, include:
- Name and brief description
- Why it's a good fit for this specific tribe
- Estimated cost per person
- Best time to attend
- Any special considerations or preparations needed`;
        
        baseTemplate.variables = [
          {
            name: 'tribeData',
            type: PromptVariableType.OBJECT,
            description: 'Information about the tribe',
            required: true
          },
          {
            name: 'memberProfiles',
            type: PromptVariableType.ARRAY,
            description: 'Profiles of tribe members',
            required: true
          },
          {
            name: 'location',
            type: PromptVariableType.OBJECT,
            description: 'Geographic location information',
            required: true
          },
          {
            name: 'weatherData',
            type: PromptVariableType.OBJECT,
            description: 'Weather forecast information',
            required: true
          },
          {
            name: 'eventOptions',
            type: PromptVariableType.ARRAY,
            description: 'Available event options',
            required: true
          },
          {
            name: 'budgetConstraints',
            type: PromptVariableType.OBJECT,
            description: 'Budget limitations',
            required: true
          }
        ];
        break;
        
      case OrchestrationFeature.CONVERSATION:
        baseTemplate.template = `You are a conversation facilitator for the Tribe platform. Your task is to help maintain engaging and meaningful conversations within tribes, offering prompts and guiding discussion when needed.

Tribe information:
{{tribeData}}

Member profiles:
{{memberProfiles}}

Conversation history:
{{conversationHistory}}

Current topic:
{{currentTopic}}

Please facilitate the conversation by:
1. Providing thoughtful responses that encourage further discussion
2. Asking engaging follow-up questions that draw in multiple members
3. Bringing in relevant perspectives based on members' interests and personality traits
4. Helping navigate conversational lulls or misunderstandings
5. Keeping the conversation aligned with tribe interests and goals
6. Suggesting relevant real-world activities when appropriate
7. Being supportive, inclusive, and mindful of different communication styles

Your role is to enhance, not dominate the conversation. Aim to bring out the best in each member while fostering group cohesion.`;
        
        baseTemplate.variables = [
          {
            name: 'tribeData',
            type: PromptVariableType.OBJECT,
            description: 'Information about the tribe',
            required: true
          },
          {
            name: 'memberProfiles',
            type: PromptVariableType.ARRAY,
            description: 'Profiles of tribe members',
            required: true
          },
          {
            name: 'conversationHistory',
            type: PromptVariableType.ARRAY,
            description: 'History of previous messages',
            required: true
          },
          {
            name: 'currentTopic',
            type: PromptVariableType.STRING,
            description: 'The current conversation topic',
            required: true
          }
        ];
        break;
        
      default:
        baseTemplate.template = `You are an AI assistant for the Tribe platform. Please help with the following request.`;
        baseTemplate.variables = [];
        logger.warn(`No default system prompt defined for feature: ${feature}`);
    }
  } else if (category === PromptCategory.USER) {
    // Default user prompts are simpler as they'll often be replaced with actual user input
    baseTemplate.template = `Please help with the following request for the ${feature} feature.`;
    baseTemplate.variables = [];
  } else if (category === PromptCategory.ASSISTANT) {
    // Default assistant prompts are for priming the AI's response style
    baseTemplate.template = `I'll help you with your ${feature} request. Here's my response:`;
    baseTemplate.variables = [];
  }
  
  return baseTemplate;
}