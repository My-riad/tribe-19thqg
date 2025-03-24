import styled from 'styled-components/native';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  theme, 
  colors, 
  spacing, 
  typography, 
  shadows,
  getResponsiveSpacing,
  isSmallDevice
} from '../../../theme';

// Main container for the Discover screen with responsive padding
export const Container = styled(View)`
  flex: 1;
  background-color: ${colors.background.default};
  padding-horizontal: ${getResponsiveSpacing(spacing.md)}px;
`;

// Header section with flex layout for title and actions
export const Header = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-top: ${spacing.lg}px;
  padding-bottom: ${spacing.md}px;
`;

// Screen title with heading1 typography style
export const Title = styled(Text)`
  ${typography.textStyles.h1};
  color: ${colors.text.primary};
`;

// Container for search input with styling for visual prominence
export const SearchContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  background-color: ${colors.background.paper};
  border-radius: 8px;
  padding-horizontal: ${spacing.sm}px;
  padding-vertical: ${spacing.xs}px;
  margin-vertical: ${spacing.md}px;
  border-width: 1px;
  border-color: ${colors.border.light};
  ${shadows.sm};
`;

// Text input for search with appropriate typography and padding
export const SearchInput = styled(TextInput)`
  ${typography.textStyles.body};
  color: ${colors.text.primary};
  flex: 1;
  padding-vertical: ${spacing.xs}px;
  padding-horizontal: ${spacing.sm}px;
`;

// Search icon with appropriate color and spacing
export const SearchIcon = styled(Ionicons)`
  color: ${colors.text.secondary};
  margin-right: ${spacing.xs}px;
`;

// Container for filter buttons with wrapping support
export const FilterContainer = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: ${spacing.md}px;
`;

// Filter button with active state styling
export const FilterButton = styled(TouchableOpacity)`
  background-color: ${props => props.active ? colors.primary.main : colors.background.paper};
  border-radius: 20px;
  padding-vertical: ${spacing.xs}px;
  padding-horizontal: ${spacing.md}px;
  margin-right: ${spacing.sm}px;
  margin-bottom: ${spacing.sm}px;
  border-width: 1px;
  border-color: ${props => props.active ? colors.primary.main : colors.border.light};
  flex-direction: row;
  align-items: center;
`;

// Text for filter buttons with active state styling
export const FilterButtonText = styled(Text)`
  ${typography.textStyles.caption};
  color: ${props => props.active ? colors.text.contrast : colors.text.primary};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
`;

// Section title with appropriate typography and spacing
export const SectionTitle = styled(Text)`
  ${typography.textStyles.h3};
  color: ${colors.text.primary};
  margin-top: ${spacing.lg}px;
  margin-bottom: ${spacing.md}px;
  font-weight: bold;
`;

// Container for tribe listings
export const TribeListContainer = styled(View)`
  flex: 1;
  margin-bottom: ${spacing.lg}px;
`;

// Container for empty state with centered content
export const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-vertical: ${spacing.xl}px;
`;

// Text for empty state messages
export const EmptyStateText = styled(Text)`
  ${typography.textStyles.body};
  color: ${colors.text.secondary};
  text-align: center;
  margin-bottom: ${spacing.lg}px;
`;

// Button for creating a new tribe with prominent styling
export const CreateTribeButton = styled(TouchableOpacity)`
  background-color: ${colors.primary.main};
  border-radius: 25px;
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.lg}px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  margin-vertical: ${spacing.md}px;
  ${shadows.md};
`;

// Text for create tribe button with appropriate typography
export const CreateTribeButtonText = styled(Text)`
  ${typography.textStyles.button};
  color: ${colors.text.contrast};
  font-weight: bold;
  margin-left: ${spacing.xs}px;
`;

// Container for loading state with centered content
export const LoadingContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-vertical: ${spacing.xl}px;
`;