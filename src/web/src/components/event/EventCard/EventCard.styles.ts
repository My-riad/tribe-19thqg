import styled from 'styled-components/native';
import { View, Text, Image, Animated } from 'react-native';

import { theme } from '../../../theme';
const { colors, spacing, typography, shadows, isSmallDevice } = theme;

/**
 * Available event card variant options
 */
export type EventCardVariant = 'standard' | 'compact' | 'featured';

/**
 * Props interface for styled event card components
 */
export interface EventCardStyleProps {
  variant?: EventCardVariant;
  color?: string;
}

/**
 * Returns the appropriate size-related styles for an event card based on its variant
 * @param variant The card variant (standard, compact, featured)
 * @returns Object containing size-related style values
 */
function getCardSizeStyles(variant: string) {
  switch(variant) {
    case 'compact':
      return {
        height: 120,
        imageWidth: 120,
        imageHeight: 120,
        spacing: spacing.xs,
        fontSize: {
          title: typography.fontSize.md,
          day: typography.fontSize.sm,
          info: typography.fontSize.xs
        }
      };
    case 'featured':
      return {
        height: 200,
        imageWidth: '100%',
        imageHeight: 120,
        spacing: spacing.sm,
        fontSize: {
          title: typography.fontSize.lg,
          day: typography.fontSize.md,
          info: typography.fontSize.sm
        }
      };
    default: // standard
      return {
        height: 180,
        imageWidth: '100%',
        imageHeight: 100,
        spacing: spacing.sm,
        fontSize: {
          title: typography.fontSize.md,
          day: typography.fontSize.md,
          info: typography.fontSize.sm
        }
      };
  }
}

/**
 * Styled container component for the event card with different variants (standard, compact, featured)
 */
export const EventCardContainer = styled(View)`
  background-color: ${colors.background.paper};
  border-radius: ${theme.borderRadius.md}px;
  overflow: hidden;
  ${props => shadows.sm};
  margin-bottom: ${spacing.md}px;
  ${props => props.variant === 'compact' ? `
    height: 120px;
    flex-direction: row;
  ` : props.variant === 'featured' ? `
    height: 200px;
  ` : `
    height: 180px;
  `}
`;

/**
 * Styled container for interactive event cards with animation support
 */
export const InteractiveEventCardContainer = styled(Animated.View)`
  background-color: ${colors.background.paper};
  border-radius: ${theme.borderRadius.md}px;
  overflow: hidden;
  ${shadows.sm};
  margin-bottom: ${spacing.md}px;
  ${props => props.variant === 'compact' ? `
    height: 120px;
    flex-direction: row;
  ` : props.variant === 'featured' ? `
    height: 200px;
  ` : `
    height: 180px;
  `}
`;

/**
 * Styled container for the event image with different sizes based on card variant
 */
export const EventImageContainer = styled(View)`
  ${props => props.variant === 'compact' ? `
    width: 120px;
    height: 120px;
  ` : props.variant === 'featured' ? `
    width: 100%;
    height: 120px;
  ` : `
    width: 100%;
    height: 100px;
  `}
  background-color: ${colors.neutral[200]};
`;

/**
 * Styled component for the event image with cover resize mode
 */
export const EventImage = styled(Image)`
  width: 100%;
  height: 100%;
  resize-mode: cover;
`;

/**
 * Styled container for the event content with appropriate padding
 */
export const EventContentContainer = styled(View)`
  flex: 1;
  padding: ${spacing.sm}px;
  ${props => props.variant === 'compact' ? `
    padding-left: ${spacing.sm}px;
  ` : ''}
`;

/**
 * Styled component for the event header section with flex layout
 */
export const EventHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${spacing.xs}px;
`;

/**
 * Styled component for the event title with appropriate typography
 */
export const EventTitle = styled(Text)`
  ${typography.textStyles.h3};
  color: ${colors.text.primary};
  flex-shrink: 1;
  ${props => props.variant === 'compact' ? `
    font-size: ${typography.fontSize.md}px;
    margin-bottom: ${spacing.xs}px;
  ` : ''}
`;

/**
 * Styled container for the event date information
 */
export const EventDateContainer = styled(View)`
  align-items: center;
  margin-left: ${spacing.sm}px;
  ${props => props.variant === 'compact' ? `
    margin-left: ${spacing.xs}px;
  ` : ''}
`;

/**
 * Styled component for the event day text with primary color and uppercase transformation
 */
export const EventDay = styled(Text)`
  ${typography.textStyles.button};
  color: ${colors.primary.main};
  text-transform: uppercase;
  ${props => props.variant === 'compact' ? `
    font-size: ${typography.fontSize.sm}px;
  ` : ''}
`;

/**
 * Styled component for the event time text with secondary text color
 */
export const EventTime = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.text.secondary};
  ${props => props.variant === 'compact' ? `
    font-size: ${typography.fontSize.xs}px;
  ` : ''}
`;

/**
 * Styled component for the event location text with secondary text color
 */
export const EventLocation = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.text.secondary};
  margin-bottom: ${spacing.xs}px;
  ${props => props.variant === 'compact' ? `
    font-size: ${typography.fontSize.xs}px;
    margin-bottom: ${spacing.xs / 2}px;
  ` : ''}
`;

/**
 * Styled container for additional event details with flex layout
 */
export const EventDetailsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${spacing.xs}px;
`;

/**
 * Styled component for displaying the tribe organizing the event
 */
export const EventTribeInfo = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.text.secondary};
  ${props => props.variant === 'compact' ? `
    font-size: ${typography.fontSize.xs}px;
  ` : ''}
`;

/**
 * Styled component for displaying attendee information with small text style
 */
export const EventAttendeeInfo = styled(Text)`
  ${typography.textStyles.small};
  color: ${colors.text.secondary};
  margin-left: ${spacing.xs}px;
`;

/**
 * Styled component for displaying the event type as a tag with subtle background
 */
export const EventTypeTag = styled(View)`
  background-color: ${colors.neutral[100]};
  padding-horizontal: ${spacing.xs}px;
  padding-vertical: ${spacing.xs / 2}px;
  border-radius: ${theme.borderRadius.sm}px;
  margin-right: ${spacing.xs}px;
  align-self: flex-start;
`;

/**
 * Styled component for displaying the event status as a colored dot indicator
 */
export const EventStatusIndicator = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => props.color || colors.success.main};
  margin-right: ${spacing.xs}px;
`;

/**
 * Styled component for displaying weather information icon with appropriate margin
 */
export const EventWeatherIcon = styled(View)`
  margin-left: ${spacing.xs}px;
`;

/**
 * Styled component for the event card footer with flex layout
 */
export const EventFooter = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${spacing.xs}px;
  ${props => props.variant === 'compact' ? `
    margin-top: ${spacing.xs / 2}px;
  ` : ''}
`;

/**
 * Styled badge component to indicate AI-recommended events with prominent positioning
 */
export const AiRecommendationBadge = styled(View)`
  position: absolute;
  top: ${spacing.xs}px;
  right: ${spacing.xs}px;
  background-color: ${colors.secondary.main};
  padding-horizontal: ${spacing.xs}px;
  padding-vertical: ${spacing.xs / 2}px;
  border-radius: ${theme.borderRadius.sm}px;
  z-index: 1;
`;