import React, { useState, useEffect, useCallback } from 'react';
import { Animated, Easing, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  Container,
  AnimatedContainer,
  PromptContainer,
  PromptHeader,
  AIIndicator,
  PromptTitle,
  PromptContent,
  PromptActions,
  ActionButton,
  ActionButtonText
} from './AIPrompt.styles';
import Button from '../../ui/Button/Button';
import Card from '../../ui/Card/Card';

import { engagementApi, EngagementType, Engagement } from '../../../api/engagementApi';
import { theme } from '../../../theme';

// Types for component props and state
interface AIPromptProps {
  engagement: Engagement;
  onRespond: (engagementId: string, responseType: string, content?: string) => void;
  onSkip: (engagementId: string) => void;
  onSuggestAnother: () => void;
  showTimestamp?: boolean;
  animationEnabled?: boolean;
  testID?: string;
}

interface AIPromptState {
  hasResponded: boolean;
  isResponding: boolean;
  responseType: string | null;
  error: string | null;
}

// Animation configuration constants
const ENTRANCE_ANIMATION_CONFIG = {
  duration: 300,
  easing: Easing.out(Easing.back(1.5)),
  useNativeDriver: true
};

const PULSE_ANIMATION_CONFIG = {
  duration: 2000,
  easing: Easing.inOut(Easing.sine),
  useNativeDriver: true
};

/**
 * Formats a timestamp for display in the prompt header
 * @param timestamp The timestamp to format
 * @returns Formatted time string (e.g., "10:15 AM")
 */
const formatTimestamp = (timestamp: Date): string => {
  if (!timestamp) return '';
  
  try {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

/**
 * Returns the appropriate icon based on engagement type
 * @param type The engagement type
 * @returns Icon name for the specified type
 */
const getPromptIcon = (type: EngagementType): string => {
  switch (type) {
    case EngagementType.CONVERSATION_PROMPT:
      return 'chat-processing';
    case EngagementType.ACTIVITY_SUGGESTION:
      return 'calendar-star';
    case EngagementType.GROUP_CHALLENGE:
      return 'flag-checkered';
    case EngagementType.ICE_BREAKER:
      return 'snowflake';
    case EngagementType.POLL:
      return 'poll';
    default:
      return 'robot';
  }
};

/**
 * A component that displays AI-generated prompts, challenges, and suggestions in tribe chats
 * with interactive response options.
 */
const AIPrompt = ({
  engagement,
  onRespond,
  onSkip,
  onSuggestAnother,
  showTimestamp = true,
  animationEnabled = true,
  testID
}: AIPromptProps) => {
  // Animation values
  const scale = React.useRef(new Animated.Value(0.9)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const pulseValue = React.useRef(new Animated.Value(1)).current;
  
  // Component state
  const [state, setState] = useState<AIPromptState>({
    hasResponded: engagement.hasUserResponded,
    isResponding: false,
    responseType: null,
    error: null
  });
  
  // Setup entrance animation when component mounts
  useEffect(() => {
    if (animationEnabled) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          ...ENTRANCE_ANIMATION_CONFIG
        }),
        Animated.timing(scale, {
          toValue: 1,
          ...ENTRANCE_ANIMATION_CONFIG
        })
      ]).start();
      
      // Setup pulse animation for attention
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.03,
            ...PULSE_ANIMATION_CONFIG
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            ...PULSE_ANIMATION_CONFIG
          })
        ])
      );
      
      pulseAnimation.start();
      
      // Cleanup function
      return () => {
        pulseAnimation.stop();
      };
    } else {
      // If animations disabled, set to final values
      opacity.setValue(1);
      scale.setValue(1);
    }
  }, [animationEnabled, opacity, scale, pulseValue]);
  
  /**
   * Handles user response to the prompt
   * @param responseType The type of response
   * @param content Optional response content
   */
  const handleRespond = useCallback(async (responseType: string, content?: string) => {
    if (state.isResponding) return;
    
    setState(prev => ({ ...prev, isResponding: true }));
    
    try {
      // Call the API to record the response
      await engagementApi.respondToEngagement(
        engagement.id,
        {
          userId: 'currentUser', // This would be obtained from auth context
          content: content || '',
          responseType,
          timestamp: new Date()
        }
      );
      
      // Update local state
      setState(prev => ({
        ...prev,
        hasResponded: true,
        isResponding: false,
        responseType
      }));
      
      // Notify parent component
      onRespond(engagement.id, responseType, content);
    } catch (error) {
      console.error('Error responding to engagement:', error);
      setState(prev => ({
        ...prev,
        isResponding: false,
        error: 'Failed to send response. Please try again.'
      }));
    }
  }, [engagement.id, onRespond, state.isResponding]);
  
  // Handle skip action
  const handleSkip = useCallback(() => {
    if (state.isResponding) return;
    onSkip(engagement.id);
  }, [engagement.id, onSkip, state.isResponding]);
  
  // Determine prompt type based on engagement type
  const promptType = (() => {
    switch (engagement.type) {
      case EngagementType.CONVERSATION_PROMPT:
      case EngagementType.ICE_BREAKER:
        return 'conversation';
      case EngagementType.GROUP_CHALLENGE:
        return 'challenge';
      case EngagementType.ACTIVITY_SUGGESTION:
        return 'activity';
      case EngagementType.POLL:
        return 'suggestion';
      default:
        return 'conversation';
    }
  })();
  
  // Get appropriate icon
  const promptIcon = getPromptIcon(engagement.type);
  
  // Format timestamp
  const formattedTimestamp = showTimestamp ? formatTimestamp(engagement.deliveredAt) : '';
  
  // Animation style
  const animatedStyle = {
    opacity,
    transform: [
      { scale: Animated.multiply(scale, pulseValue) }
    ]
  };
  
  // Accessibility props
  const accessibilityLabel = `AI prompt: ${engagement.content.slice(0, 50)}${engagement.content.length > 50 ? '...' : ''}`;
  const accessibilityHint = 'You can respond, skip, or request another suggestion';
  
  return (
    <Container testID={testID}>
      <AnimatedContainer style={animatedStyle}>
        <PromptContainer 
          promptType={promptType}
          accessible={true}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole="alert"
        >
          <PromptHeader promptType={promptType}>
            <AIIndicator>
              <Icon 
                name={promptIcon} 
                size={20} 
                color={theme.colors.primary.main}
                accessibilityLabel={`${promptType} prompt icon`}
              />
              <PromptTitle>Tribe Assistant</PromptTitle>
            </AIIndicator>
            
            {showTimestamp && formattedTimestamp && (
              <Text style={{ 
                fontSize: theme.typography.fontSize.small, 
                color: theme.colors.text.secondary,
                marginLeft: theme.spacing.sm
              }}>
                {formattedTimestamp}
              </Text>
            )}
          </PromptHeader>
          
          <PromptContent>
            {engagement.content}
          </PromptContent>
          
          {state.error && (
            <View style={{ 
              padding: theme.spacing.sm, 
              backgroundColor: theme.colors.error.light,
              marginTop: theme.spacing.xs
            }}>
              <Text style={{ color: theme.colors.error.dark }}>
                {state.error}
              </Text>
            </View>
          )}
          
          {!state.hasResponded && (
            <PromptActions promptType={promptType}>
              <ActionButton 
                onPress={handleSkip}
                disabled={state.isResponding}
                accessibilityLabel="Skip this prompt"
                accessibilityRole="button"
              >
                <ActionButtonText>Skip</ActionButtonText>
              </ActionButton>
              
              <ActionButton 
                onPress={handleSuggestAnother}
                disabled={state.isResponding}
                accessibilityLabel="Get another suggestion"
                accessibilityRole="button"
              >
                <ActionButtonText>Suggest another</ActionButtonText>
              </ActionButton>
              
              <ActionButton 
                onPress={() => handleRespond('respond')}
                primary
                disabled={state.isResponding}
                accessibilityLabel="Respond to this prompt"
                accessibilityRole="button"
              >
                <ActionButtonText primary>
                  {state.isResponding ? 'Responding...' : 'Respond'}
                </ActionButtonText>
              </ActionButton>
            </PromptActions>
          )}
        </PromptContainer>
      </AnimatedContainer>
    </Container>
  );
};

export default AIPrompt;