import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

// Props for filter button styled components
interface FilterButtonProps {
  active: boolean;
}

interface FilterButtonTextProps {
  active: boolean;
}

// Main container for the attendees list
export const Container = styled(View)`
  width: 100%;
  margin-bottom: ${spacing.md}px;
`;

// Horizontally scrollable container for filter buttons
export const FilterContainer = styled(ScrollView).attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
})`
  margin-bottom: ${spacing.sm}px;
`;

// Styled button for filtering attendees by RSVP status
export const FilterButton = styled(TouchableOpacity)<FilterButtonProps>`
  padding-horizontal: ${spacing.sm}px;
  padding-vertical: ${spacing.xs}px;
  border-radius: 20px;
  margin-right: ${spacing.sm}px;
  background-color: ${props => props.active ? colors.primary.main : colors.background.subtle};
`;

// Text component for filter button labels
export const FilterButtonText = styled(Text)<FilterButtonTextProps>`
  ${typography.textStyles.caption};
  color: ${props => props.active ? colors.primary.contrast : colors.text.secondary};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
`;

// Container for empty state message
export const EmptyStateContainer = styled(View)`
  padding: ${spacing.lg}px;
  align-items: center;
  justify-content: center;
`;

// Text component for empty state message
export const EmptyStateText = styled(Text)`
  ${typography.textStyles.body};
  color: ${colors.text.secondary};
  text-align: center;
`;

// Container for individual attendee items
export const AttendeeItemContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: ${spacing.xs}px;
`;

// Container for attendee name and RSVP status
export const AttendeeInfo = styled(View)`
  flex: 1;
  margin-left: ${spacing.sm}px;
  justify-content: center;
`;

// Text component for attendee name
export const AttendeeName = styled(Text)`
  ${typography.textStyles.body};
  color: ${colors.text.primary};
  font-weight: 500;
`;

// Container for attendee RSVP status indicator
export const AttendeeStatus = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.xs}px;
`;

// Container for attendee check-in status and timestamp
export const CheckInStatus = styled(View)`
  align-items: flex-end;
  justify-content: center;
`;

// Text component for check-in timestamp
export const CheckInText = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.text.secondary};
  margin-top: ${spacing.xs}px;
`;

// Text component for displaying additional attendees count
export const AdditionalAttendeesText = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.text.secondary};
  text-align: center;
  margin-top: ${spacing.sm}px;
  margin-bottom: ${spacing.sm}px;
`;