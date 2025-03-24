import styled from 'styled-components/native';
import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { colors, spacing, shadows, getResponsiveSpacing, isSmallDevice } from '../../../theme';

// Constants for consistent spacing
const SECTION_SPACING = theme.spacing.xl;
const ITEM_SPACING = theme.spacing.md;

// Interface for tab button styling
interface TabStyleProps {
  active?: boolean;
}

// Main container for the Events screen
export const EventsScreenContainer = styled(ScrollView)`
  flex: 1;
  background-color: ${colors.background.default};
  padding: ${getResponsiveSpacing(spacing.md)}px;
`;

// Header section for the Events screen
export const EventsHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.lg}px;
`;

// Container for each section of events
export const EventsSection = styled(View)`
  margin-bottom: ${SECTION_SPACING}px;
`;

// Section titles (THIS WEEKEND, RECOMMENDED FOR YOU, etc.)
export const SectionTitle = styled(Text)`
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.semiBold};
  color: ${colors.text.primary};
  margin-bottom: ${spacing.md}px;
`;

// Styled FlatList for event lists
export const EventsList = styled(FlatList)`
  margin-bottom: ${spacing.md}px;
`;

// Container for tab navigation
export const TabContainer = styled(View)`
  flex-direction: row;
  margin-bottom: ${spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border.light};
`;

// Tab navigation buttons
export const TabButton = styled(TouchableOpacity)<TabStyleProps>`
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.md}px;
  border-bottom-width: 2px;
  border-bottom-color: ${props => props.active ? colors.primary.main : 'transparent'};
  margin-right: ${spacing.md}px;
`;

// Tab button text
export const TabButtonText = styled(Text)<TabStyleProps>`
  color: ${props => props.active ? colors.primary.main : colors.text.secondary};
  font-weight: ${props => props.active ? theme.typography.fontWeight.semiBold : theme.typography.fontWeight.regular};
  font-size: ${theme.typography.fontSize.md}px;
`;

// Container for empty state
export const EmptyStateContainer = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${spacing.xl}px;
`;

// Text for empty state
export const EmptyStateText = styled(Text)`
  color: ${colors.text.secondary};
  font-size: ${theme.typography.fontSize.md}px;
  text-align: center;
`;

// Floating action button for creating events
export const CreateEventButton = styled(TouchableOpacity)`
  position: absolute;
  bottom: ${spacing.lg}px;
  right: ${spacing.lg}px;
  background-color: ${colors.primary.main};
  width: 56px;
  height: 56px;
  border-radius: 28px;
  justify-content: center;
  align-items: center;
  ${shadows.md}
`;

// Text for create event button (plus sign)
export const CreateEventButtonText = styled(Text)`
  color: ${colors.primary.contrast};
  font-size: ${theme.typography.fontSize.xl}px;
  font-weight: ${theme.typography.fontWeight.bold};
`;

// Container for filter options
export const FilterContainer = styled(View)`
  flex-direction: row;
  margin-bottom: ${spacing.md}px;
  flex-wrap: wrap;
`;

// Filter option buttons
export const FilterButton = styled(TouchableOpacity)<TabStyleProps>`
  background-color: ${props => props.active ? colors.primary.main : colors.background.subtle};
  padding-vertical: ${spacing.xs}px;
  padding-horizontal: ${spacing.md}px;
  border-radius: 16px;
  margin-right: ${spacing.sm}px;
  margin-bottom: ${spacing.sm}px;
`;

// Text for filter buttons
export const FilterButtonText = styled(Text)<TabStyleProps>`
  color: ${props => props.active ? colors.primary.contrast : colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm}px;
`;

// Container for loading state
export const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${spacing.xl}px;
`;