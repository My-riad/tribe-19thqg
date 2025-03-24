import styled from 'styled-components/native';
import { View, Text, ScrollView } from 'react-native';
import { 
  theme, 
  colors, 
  spacing, 
  typography, 
  shadows,
  getResponsiveSpacing
} from '../../../theme';

/**
 * Main container for the tribe creation form
 * Provides scrollable area with responsive padding
 */
export const FormContainer = styled(ScrollView)`
  flex: 1;
  padding: ${getResponsiveSpacing('lg')}px;
  background-color: ${theme.colors.background.default};
`;

/**
 * Container for grouping related form elements
 * Provides consistent spacing between form sections
 */
export const FormSection = styled(View)`
  margin-bottom: ${theme.spacing.xl}px;
`;

/**
 * Text component for section titles
 * Uses typography settings from theme for consistent styling
 */
export const SectionTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md}px;
`;

/**
 * Container for the tribe image upload area
 * Circular design with dashed border to indicate upload functionality
 */
export const ImageUploadContainer = styled(View)`
  align-items: center;
  justify-content: center;
  height: 150px;
  width: 150px;
  border-radius: 75px;
  background-color: ${theme.colors.background.subtle};
  border: 1px dashed ${theme.colors.border.main};
  align-self: center;
  margin-bottom: ${theme.spacing.lg}px;
  overflow: hidden;
`;

/**
 * Container for form action buttons
 * Arranges buttons in a row with space between
 */
export const ButtonContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.xl}px;
  margin-bottom: ${theme.spacing.xl}px;
`;