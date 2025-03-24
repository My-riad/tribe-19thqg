import styled from 'styled-components';
import { View, ScrollView, Text, Switch, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';
import { colors, spacing, typography, getResponsiveSpacing } from '../../../theme';

// Main container for the entire notification settings screen with full height and default background color
const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for notification settings content
const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

// Section title text with appropriate spacing, color, and typography
const SectionTitle = styled(Text)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.sm}px;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  margin-top: ${theme.spacing.md}px;
`;

// Container for grouping related notification settings with card-like appearance
const SectionContainer = styled(View)`
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.xs}px;
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  overflow: hidden;
`;

// Container for individual notification setting items with horizontal layout
const NotificationItemContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${theme.spacing.md}px;
  padding-horizontal: ${theme.spacing.lg}px;
`;

// Container for notification item text content, taking available space
const NotificationItemContent = styled(View)`
  flex: 1;
  margin-right: ${theme.spacing.md}px;
`;

// Text component for notification setting item titles with appropriate typography
const NotificationItemTitle = styled(Text)`
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Text component for notification setting item descriptions with smaller, secondary text style
const NotificationItemDescription = styled(Text)`
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
`;

// Styled switch component with custom track and thumb colors based on state
const StyledSwitch = styled(Switch).attrs(props => ({
  trackColor: {
    false: theme.colors.background.inactive,
    true: theme.colors.primary.default
  },
  thumbColor: props.value
    ? theme.colors.background.paper
    : theme.colors.background.paper,
}))`
  margin-left: ${theme.spacing.sm}px;
`;

// Horizontal divider line between notification items
const Divider = styled(View)`
  height: 1px;
  background-color: ${theme.colors.border.light};
  margin-horizontal: ${theme.spacing.lg}px;
`;

// Container for the global notification toggle with prominent styling
const GlobalToggleContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${theme.spacing.lg}px;
  padding-horizontal: ${theme.spacing.lg}px;
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.xs}px;
  margin-horizontal: ${theme.spacing.lg}px;
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
`;

// Text component for the global toggle label with prominent typography
const GlobalToggleText = styled(Text)`
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
`;

// Container for notification frequency selection options
const FrequencySelector = styled(View)`
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.spacing.xs}px;
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.md}px;
`;

// Touchable component for frequency option selection
const FrequencyOption = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.lg}px;
`;

// Text component for frequency option labels with state-based styling
const FrequencyOptionText = styled(Text)`
  font-size: ${theme.typography.fontSize.md}px;
  color: ${props => props.selected ? theme.colors.primary.default : theme.colors.text.primary};
  font-weight: ${props => props.selected ? theme.typography.fontWeight.bold : theme.typography.fontWeight.regular};
  margin-left: ${theme.spacing.sm}px;
`;

// Container for the save button with appropriate spacing and responsive bottom margin
const SaveButtonContainer = styled(View)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.lg}px;
  margin-bottom: ${getResponsiveSpacing(theme.spacing.xl)}px;
`;

export {
  Container,
  ScrollContainer,
  SectionTitle,
  SectionContainer,
  NotificationItemContainer,
  NotificationItemContent,
  NotificationItemTitle,
  NotificationItemDescription,
  StyledSwitch,
  Divider,
  GlobalToggleContainer,
  GlobalToggleText,
  FrequencySelector,
  FrequencyOption,
  FrequencyOptionText,
  SaveButtonContainer
};