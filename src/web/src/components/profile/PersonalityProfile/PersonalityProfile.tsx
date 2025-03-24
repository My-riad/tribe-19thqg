import React, { useState, useEffect, useMemo } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import {
  Container,
  SectionTitle,
  TraitsContainer,
  TraitRow,
  TraitLabel,
  TraitBarContainer,
  TraitBarBackground,
  AnimatedTraitBarFill,
  CommunicationStyleContainer,
  CommunicationStyleText,
  CompatibilityContainer,
  CompatibilityScore,
  CompatibilityLabel,
  getTraitColor
} from './PersonalityProfile.styles';
import { useProfile } from '../../../hooks/useProfile';
import { PersonalityTraitName, PersonalityTrait } from '../../../types/profile.types';

/**
 * Props for the PersonalityProfile component
 */
interface PersonalityProfileProps {
  traits?: PersonalityTrait[];
  title?: string;
  showCompatibility?: boolean;
  compatibilityScore?: number;
  compatibilityLabel?: string;
  testID?: string;
}

/**
 * Formats a trait name from enum format to a readable display format
 * @param traitName The trait name to format
 * @returns Formatted trait name
 */
const formatTraitName = (traitName: string): string => {
  // Convert enum/snake_case to Title Case
  return String(traitName)
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Generates a description of the user's communication style based on personality traits
 * @param traits Array of personality traits
 * @returns Communication style description
 */
const getCommunicationStyleDescription = (traits: PersonalityTrait[]): string => {
  // Find communication style trait if it exists
  const communicationStyleTrait = traits.find(
    trait => trait.traitName === PersonalityTraitName.COMMUNICATION_STYLE
  );
  
  if (communicationStyleTrait) {
    const score = communicationStyleTrait.score;
    if (score > 0.8) {
      return "You're a highly effective communicator who adapts well to different situations. You express ideas clearly and listen attentively, making you great at facilitating group discussions and ensuring everyone feels heard.";
    } else if (score > 0.6) {
      return "You communicate confidently in most situations and balance speaking and listening well. You're able to express your thoughts clearly while being receptive to others' perspectives.";
    } else if (score > 0.4) {
      return "You have a balanced communication style that adapts to different contexts. Sometimes you take the lead in conversations, while other times you prefer to listen and reflect before responding.";
    } else if (score > 0.2) {
      return "You tend to be more reserved in your communication, often preferring to listen and observe before sharing your thoughts. You communicate thoughtfully and may express yourself better in smaller groups.";
    } else {
      return "You have a contemplative communication style and may prefer written or one-on-one communication over group settings. You listen carefully and think deeply before responding.";
    }
  }
  
  // If no direct communication style trait, infer from other traits
  const extraversion = traits.find(trait => trait.traitName === PersonalityTraitName.EXTRAVERSION);
  const agreeableness = traits.find(trait => trait.traitName === PersonalityTraitName.AGREEABLENESS);
  const assertiveness = traits.find(trait => trait.traitName === PersonalityTraitName.ASSERTIVENESS);
  
  const extraversionScore = extraversion ? extraversion.score : 0.5;
  const agreeablenessScore = agreeableness ? agreeableness.score : 0.5;
  const assertivenessScore = assertiveness ? assertiveness.score : 0.5;
  
  if (extraversionScore > 0.7 && assertivenessScore > 0.6) {
    return "You communicate openly and directly, often taking the lead in conversations. You express your thoughts confidently and enjoy engaging with others in lively discussions.";
  } else if (extraversionScore > 0.6 && agreeablenessScore > 0.7) {
    return "You have a warm and engaging communication style that puts others at ease. You're attentive to others' perspectives and excel at creating harmony in group conversations.";
  } else if (extraversionScore < 0.4 && agreeablenessScore > 0.6) {
    return "You communicate thoughtfully and prefer to listen first before sharing your views. You're supportive of others in conversation and value creating a positive atmosphere.";
  } else if (assertivenessScore > 0.7 && agreeablenessScore < 0.4) {
    return "You communicate directly and focus on efficiency in conversations. You're comfortable expressing disagreement and prioritize clarity over social harmony.";
  } else if (extraversionScore < 0.3 && assertivenessScore < 0.3) {
    return "You have a reserved communication style and may prefer written communication or one-on-one conversations. You think carefully before speaking and offer meaningful insights when you do share.";
  } else {
    return "You have a balanced approach to communication that adapts based on the situation. You can be both an attentive listener and an engaging speaker, depending on what the context requires.";
  }
};

/**
 * Component that displays a user's personality profile with trait visualization
 */
const PersonalityProfile: React.FC<PersonalityProfileProps> = ({
  traits: propTraits,
  title = "MY PERSONALITY",
  showCompatibility = false,
  compatibilityScore = 0,
  compatibilityLabel = "Compatibility",
  testID = "personality-profile"
}) => {
  // Get profile data from context if traits are not provided as props
  const { personalityTraits: profileTraits } = useProfile();
  const traits = propTraits || profileTraits;
  
  // Create animated values for each trait bar
  const [animatedValues, setAnimatedValues] = useState<Record<string, Animated.Value>>({});
  
  // Sort traits by score in descending order for display
  const sortedTraits = useMemo(() => {
    return [...traits].sort((a, b) => b.score - a.score);
  }, [traits]);
  
  // Initialize animated values on mount or when traits change
  useEffect(() => {
    const newValues: Record<string, Animated.Value> = {};
    
    // Create a new Animated.Value for each trait, starting at 0
    sortedTraits.forEach(trait => {
      newValues[trait.id] = new Animated.Value(0);
    });
    
    setAnimatedValues(newValues);
    
    // Animate all trait bars when component mounts or traits change
    const animations = sortedTraits.map(trait => {
      return Animated.timing(newValues[trait.id], {
        toValue: trait.score,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false // We're animating width which isn't supported by native driver
      });
    });
    
    // Run all animations in parallel with staggered start
    Animated.stagger(150, animations).start();
    
    // Cleanup function to stop animations if component unmounts
    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [sortedTraits]);
  
  // Generate communication style description
  const communicationStyleDescription = useMemo(() => {
    return getCommunicationStyleDescription(traits);
  }, [traits]);
  
  // If no traits are available, don't render the component
  if (!traits || traits.length === 0) {
    return null;
  }
  
  return (
    <Container testID={testID} accessible={true} accessibilityLabel="Personality Profile">
      <SectionTitle accessibilityRole="header">{title}</SectionTitle>
      
      {/* Traits visualization */}
      <TraitsContainer>
        {sortedTraits.map(trait => (
          <TraitRow 
            key={trait.id} 
            accessible={true} 
            accessibilityLabel={`${formatTraitName(trait.traitName)} ${Math.round(trait.score * 100)}%`}
          >
            <TraitLabel>{formatTraitName(trait.traitName)}</TraitLabel>
            <TraitBarContainer>
              <TraitBarBackground>
                <AnimatedTraitBarFill
                  color={getTraitColor(trait.score)}
                  style={{ 
                    width: animatedValues[trait.id]?.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }}
                />
              </TraitBarBackground>
            </TraitBarContainer>
          </TraitRow>
        ))}
      </TraitsContainer>
      
      {/* Communication style section */}
      <CommunicationStyleContainer 
        accessible={true} 
        accessibilityLabel={`Communication Style: ${communicationStyleDescription}`}
      >
        <SectionTitle>COMMUNICATION STYLE</SectionTitle>
        <CommunicationStyleText>{communicationStyleDescription}</CommunicationStyleText>
      </CommunicationStyleContainer>
      
      {/* Compatibility section (conditional) */}
      {showCompatibility && (
        <CompatibilityContainer 
          accessible={true} 
          accessibilityLabel={`${compatibilityLabel} ${compatibilityScore}%`}
        >
          <CompatibilityScore>{compatibilityScore}%</CompatibilityScore>
          <CompatibilityLabel>{compatibilityLabel}</CompatibilityLabel>
        </CompatibilityContainer>
      )}
    </Container>
  );
};

export default PersonalityProfile;