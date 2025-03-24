import styled from 'styled-components/native';
import { View, Text, TextInput, SafeAreaView, Platform } from 'react-native';
import {
  theme,
  colors,
  spacing,
  typography,
  shadows,
  getResponsiveSpacing,
  isSmallDevice
} from '../../../theme';

// Main container for the entire member list screen
export const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Styled container for the screen header with title and member count
export const Header = styled(View)`
  padding: ${theme.spacing.md}px;
  padding-bottom: ${theme.spacing.sm}px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

// Styled text component for the screen title
export const Title = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.text.primary};
  flex: 1;
`;

// Styled container for the search input field
export const SearchContainer = styled(View)`
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  background-color: ${theme.colors.background.default};
`;

// Styled text input component for searching members
export const SearchInput = styled(TextInput)`
  background-color: ${theme.colors.background.subtle};
  border-radius: ${Platform.OS === 'ios' ? 8 : 4}px;
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.primary};
  border-width: 1px;
  border-color: ${theme.colors.border.light};
`;

// Styled container for filter options
export const FilterContainer = styled(View)`
  flex-direction: row;
  padding: ${theme.spacing.xs}px ${theme.spacing.md}px;
  background-color: ${theme.colors.background.default};
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
`;

// Styled button component for filter selection
export const FilterButton = styled(View)<{ selected?: boolean }>`
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: 16px;
  margin-right: ${theme.spacing.sm}px;
  background-color: ${props => props.selected ? theme.colors.primary.main : theme.colors.background.subtle};
`;

// Styled container for empty state when no members match filters
export const EmptyStateContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl}px;
`;

// Styled text component for empty state message
export const EmptyStateText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  text-align: center;
`;