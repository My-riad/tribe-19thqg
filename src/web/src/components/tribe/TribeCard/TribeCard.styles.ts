import styled from 'styled-components/native';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { theme, isSmallDevice } from '../../../theme';
import { TribeStatus } from '../../../types/tribe.types';

/**
 * Determines the appropriate color for compatibility badge based on score
 * @param score - Compatibility score (0-100)
 * @returns Color from theme based on compatibility level
 */
export const getCompatibilityBadgeColor = (score: number): string => {
  if (score >= 90) {
    return theme.colors.success.main; // High compatibility (≥90%)
  } else if (score >= 70) {
    return theme.colors.primary.main; // Good compatibility (≥70%)
  } else if (score >= 50) {
    return theme.colors.warning.main; // Moderate compatibility (≥50%)
  } else {
    return theme.colors.neutral[500]; // Low compatibility (<50%)
  }
};

/**
 * Styled container component for the tribe card with different variants
 */
export const TribeCardContainer = styled(View)`
  background-color: ${theme.colors.background.paper};
  border-radius: ${props => props.variant === 'compact' ? 8 : 12}px;
  overflow: hidden;
  margin-bottom: ${theme.spacing.md}px;
  ${props => props.variant === 'featured' ? `
    border-width: 2px;
    border-color: ${theme.colors.primary.main};
    ${theme.shadows.md};
  ` : `
    border-width: 1px;
    border-color: ${theme.colors.border.light};
    ${theme.shadows.sm};
  `}
  width: 100%;
`;

/**
 * Touchable wrapper for interactive tribe cards
 */
export const TribeCardTouchable = styled(TouchableOpacity)`
  flex: 1;
  width: 100%;
`;

/**
 * Container for the tribe image with height based on variant
 */
export const TribeImageContainer = styled(View)`
  height: ${props => props.variant === 'compact' ? 80 : 120}px;
  width: 100%;
  background-color: ${theme.colors.neutral[200]};
`;

/**
 * Styled component for the tribe image
 */
export const TribeImage = styled(Image)`
  height: 100%;
  width: 100%;
  resize-mode: cover;
`;

/**
 * Container for tribe information content
 */
export const TribeContent = styled(View)`
  padding: ${theme.spacing.md}px;
  flex: 1;
`;

/**
 * Styled component for the tribe name
 */
export const TribeName = styled(Text)`
  ${theme.typography.heading3};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

/**
 * Styled component for the tribe description with optional line limiting
 */
export const TribeDescription = styled(Text)`
  ${theme.typography.body};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.sm}px;
  ${props => props.numberOfLines && `
    height: ${props.numberOfLines * 20}px;
  `}
`;

/**
 * Container for tribe metadata (member count, location)
 */
export const TribeMeta = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
`;

/**
 * Styled component for tribe metadata text
 */
export const TribeMetaText = styled(Text)`
  ${theme.typography.caption};
  color: ${theme.colors.text.secondary};
  margin-right: ${theme.spacing.md}px;
`;

/**
 * Container for the bottom section of the tribe card with optional top border
 */
export const TribeFooter = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-top: ${theme.spacing.sm}px;
  ${props => props.hasBorder && `
    border-top-width: 1px;
    border-top-color: ${theme.colors.border.light};
  `}
`;

/**
 * Styled component for displaying compatibility score with color based on score value
 */
export const CompatibilityBadge = styled(View)`
  background-color: ${props => getCompatibilityBadgeColor(props.score)};
  border-radius: 12px;
  padding-horizontal: ${theme.spacing.sm}px;
  padding-vertical: ${theme.spacing.xs}px;
  align-items: center;
  justify-content: center;
`;

/**
 * Styled text component for compatibility score
 */
export const CompatibilityText = styled(Text)`
  ${theme.typography.caption};
  font-weight: bold;
  color: ${theme.colors.text.contrast};
`;

/**
 * Container for interest tags with wrapping support
 */
export const InterestTagsContainer = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: ${theme.spacing.xs}px;
`;

/**
 * Styled component for tribe status indicator with color based on status
 */
export const StatusIndicator = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => statusColors[props.status] || theme.colors.neutral[500]};
  margin-right: ${theme.spacing.xs}px;
`;

/**
 * Object mapping tribe status to color values for visual indicators
 */
export const statusColors = {
  [TribeStatus.FORMATION]: theme.colors.neutral[500],
  [TribeStatus.ACTIVE]: theme.colors.primary.main,
  [TribeStatus.ENGAGED]: theme.colors.primary.dark,
  [TribeStatus.ESTABLISHED]: theme.colors.success.main,
  [TribeStatus.THRIVING]: theme.colors.success.dark,
  [TribeStatus.AT_RISK]: theme.colors.warning.main,
  [TribeStatus.INACTIVE]: theme.colors.error.light,
  [TribeStatus.DISSOLVED]: theme.colors.neutral[700]
};