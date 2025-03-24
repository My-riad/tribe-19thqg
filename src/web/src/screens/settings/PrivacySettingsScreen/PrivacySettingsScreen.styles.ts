import styled from 'styled-components';
import { 
  View, 
  ScrollView, 
  Text, 
  Switch, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { 
  theme, 
  colors, 
  spacing, 
  typography,
  getResponsiveSpacing
} from '../../../theme';

// Main container for the entire privacy settings screen
export const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for the content
export const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

// Container for a group of related privacy settings
export const SectionContainer = styled(View)`
  margin-bottom: ${theme.spacing.lg}px;
`;

// Section header text
export const SectionTitle = styled(Text)`
  padding-horizontal: ${theme.spacing.lg}px;
  padding-vertical: ${theme.spacing.sm}px;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
`;

// Container for individual privacy setting items
export const PrivacyItemContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: ${theme.spacing.md}px;
  padding-horizontal: ${theme.spacing.lg}px;
  background-color: ${theme.colors.background.paper};
`;

// Container for privacy item text content
export const PrivacyItemContent = styled(View)`
  flex: 1;
  margin-right: ${theme.spacing.md}px;
`;

// Title text for privacy setting items
export const PrivacyItemTitle = styled(Text)`
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Description text for privacy setting items
export const PrivacyItemDescription = styled(Text)`
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
`;

// Styled toggle switch component
export const StyledSwitch = styled(Switch).attrs(props => ({
  trackColor: { false: theme.colors.neutral[300], true: theme.colors.primary.light },
  thumbColor: props.value ? theme.colors.primary.main : theme.colors.neutral[100],
}))`
  margin-left: ${theme.spacing.sm}px;
`;

// Divider line between items
export const Divider = styled(View)`
  height: 1px;
  background-color: ${theme.colors.border.light};
  margin-horizontal: ${theme.spacing.lg}px;
`;

// Container for visibility options
export const VisibilitySelector = styled(View)`
  margin-top: ${theme.spacing.sm}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.sm}px;
  overflow: hidden;
`;

// Touchable component for visibility options
export const VisibilityOption = styled(TouchableOpacity)`
  padding-vertical: ${theme.spacing.md}px;
  padding-horizontal: ${theme.spacing.lg}px;
  background-color: ${props => props.selected ? theme.colors.primary.light : 'transparent'};
`;

// Text for visibility option labels
export const VisibilityOptionText = styled(Text)`
  font-size: ${theme.typography.fontSize.md}px;
  color: ${props => props.selected ? theme.colors.primary.contrast : theme.colors.text.primary};
  font-weight: ${props => props.selected ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular};
`;

// Container for data usage settings
export const DataUsageContainer = styled(View)`
  padding: ${theme.spacing.lg}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.sm}px;
  margin-horizontal: ${theme.spacing.lg}px;
  margin-top: ${theme.spacing.md}px;
`;

// Text for warning messages
export const WarningText = styled(Text)`
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.error.main};
  margin-top: ${theme.spacing.sm}px;
`;

// Container for action buttons
export const ActionButtonContainer = styled(View)`
  margin-top: ${theme.spacing.lg}px;
  margin-horizontal: ${theme.spacing.lg}px;
`;

// Styled button for privacy actions
export const ActionButton = styled(TouchableOpacity)`
  padding-vertical: ${theme.spacing.md}px;
  padding-horizontal: ${theme.spacing.lg}px;
  background-color: ${props => props.danger ? theme.colors.error.main : theme.colors.background.subtle};
  border-radius: ${theme.spacing.sm}px;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

// Text for action buttons
export const ActionButtonText = styled(Text)`
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${props => props.danger ? theme.colors.error.contrast : theme.colors.text.primary};
`;

// Container for the save button at the bottom
export const SaveButtonContainer = styled(View)`
  padding: ${theme.spacing.lg}px;
  background-color: ${theme.colors.background.paper};
  border-top-width: 1px;
  border-top-color: ${theme.colors.border.light};
`;

// Additional styles that need StyleSheet
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default
  },
  scrollContainer: {
    flex: 1
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectedOption: {
    backgroundColor: theme.colors.primary.light
  },
  selectedText: {
    color: theme.colors.primary.contrast,
    fontWeight: theme.typography.fontWeight.medium
  },
  dangerButton: {
    backgroundColor: theme.colors.error.main
  },
  dangerText: {
    color: theme.colors.error.contrast
  }
});