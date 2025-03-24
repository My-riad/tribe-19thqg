import styled from 'styled-components/native';
import { View, Text, Animated } from 'react-native';
import { theme } from '../../../theme';

/**
 * Returns the appropriate color for a trait based on its score
 * @param score Trait score value (0-1)
 * @returns Color value from theme.colors
 */
const getTraitColor = (score: number): string => {
  if (score > 0.7) {
    return theme.colors.primary.main; // High score
  } else if (score >= 0.4) {
    return theme.colors.secondary.main; // Medium score
  } else {
    return theme.colors.neutral[500]; // Low score
  }
};

// Main container for the personality profile component
const Container = styled(View)`
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.md}px;
`;

// Title text for the personality profile section
const SectionTitle = styled(Text)`
  font-size: ${theme.typography.heading3.fontSize}px;
  font-weight: ${theme.typography.heading3.fontWeight};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md}px;
`;

// Container for the list of personality traits
const TraitsContainer = styled(View)`
  margin-top: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.md}px;
`;

// Container for an individual trait row
const TraitRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
`;

// Styled component for trait name
const TraitLabel = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  font-weight: ${theme.typography.body.fontWeight};
  color: ${theme.colors.text.primary};
  width: 120px;
  ${theme.isSmallDevice() ? 'width: 100px;' : ''}
`;

// Styled container for the trait visualization bar
const TraitBarContainer = styled(View)`
  flex: 1;
  height: 16px;
  margin-left: ${theme.spacing.sm}px;
`;

// Styled component for the background of trait bars
const TraitBarBackground = styled(View)`
  height: 100%;
  width: 100%;
  background-color: ${theme.colors.neutral[200]};
  border-radius: 8px;
  overflow: hidden;
`;

// Animated component for the filled portion of trait bars
const AnimatedTraitBarFill = styled(Animated.View)`
  height: 100%;
  border-radius: 8px;
  background-color: ${props => props.color || theme.colors.primary.main};
`;

// Styled container for communication style section
const CommunicationStyleContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.sm}px;
  border-left-width: 4px;
  border-left-color: ${theme.colors.primary.main};
`;

// Styled text component for communication style description
const CommunicationStyleText = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  color: ${theme.colors.text.secondary};
  line-height: 22px;
`;

// Styled container for compatibility metrics section
const CompatibilityContainer = styled(View)`
  margin-top: ${theme.spacing.md}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.sm}px;
`;

// Styled component for displaying compatibility percentage
const CompatibilityScore = styled(Text)`
  font-size: ${theme.typography.heading2.fontSize}px;
  font-weight: ${theme.typography.heading2.fontWeight};
  color: ${theme.colors.primary.main};
`;

// Styled component for compatibility label
const CompatibilityLabel = styled(Text)`
  font-size: ${theme.typography.body.fontSize}px;
  color: ${theme.colors.text.secondary};
  margin-left: ${theme.spacing.sm}px;
`;

export {
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
  CompatibilityLabel
};