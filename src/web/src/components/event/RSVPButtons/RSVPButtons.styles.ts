import styled from 'styled-components/native';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { RSVPStatus } from '../../../types/event.types';

/**
 * Interface for RSVP button color configuration
 */
interface ButtonColors {
  background: string;
  text: string;
  border?: string;
}

/**
 * Returns the appropriate colors for an RSVP button based on its status and selection state
 */
const getButtonColors = (
  status: string,
  isSelected: boolean,
  disabled: boolean
): ButtonColors => {
  // Return disabled colors if button is disabled
  if (disabled) {
    return {
      background: theme.colors.background.disabled,
      text: theme.colors.text.disabled,
      border: theme.colors.border.light
    };
  }

  // Return appropriate colors based on selection state and status
  if (isSelected) {
    switch (status) {
      case RSVPStatus.GOING:
        return {
          background: theme.colors.success.light,
          text: theme.colors.success.dark
        };
      case RSVPStatus.MAYBE:
        return {
          background: theme.colors.warning.light,
          text: theme.colors.warning.dark
        };
      case RSVPStatus.NOT_GOING:
        return {
          background: theme.colors.error.light,
          text: theme.colors.error.dark
        };
      default:
        return {
          background: theme.colors.primary.light,
          text: theme.colors.primary.dark
        };
    }
  }

  // Default colors for unselected state
  return {
    background: theme.colors.background.paper,
    text: theme.colors.text.primary,
    border: theme.colors.border.light
  };
};

/**
 * Styled container for the RSVP buttons group with horizontal layout
 */
export const Container = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  margin-vertical: ${theme.spacing.sm}px;
`;

/**
 * Styled touchable component for RSVP buttons with appropriate styling based on selection state
 */
export const RSVPButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${props => getButtonColors(props.status, props.isSelected, props.disabled).background};
  border-radius: ${theme.spacing.xs}px;
  padding-horizontal: ${theme.spacing.sm}px;
  padding-vertical: ${theme.spacing.xs}px;
  margin-horizontal: ${theme.spacing.xxs}px;
  opacity: ${props => props.disabled ? 0.6 : 1};
  flex: ${props => props.fullWidth ? 1 : 'auto'};
  ${props => props.isSelected ? theme.shadows.sm : 'none'}
`;

/**
 * Styled text component for RSVP button labels with appropriate text styling based on selection state
 */
export const RSVPButtonText = styled(Text)`
  color: ${props => getButtonColors(props.status, props.isSelected, props.disabled).text};
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${props => props.isSelected ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  text-align: center;
`;

/**
 * Styled container for RSVP button icons with appropriate spacing
 */
export const RSVPButtonIcon = styled(View)`
  margin-right: ${theme.spacing.xs}px;
  align-items: center;
  justify-content: center;
`;