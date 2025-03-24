import styled from 'styled-components/native';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../../theme';

// Main container for the profile screen with full flex and default background color
export const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for profile content with bottom padding
export const ScrollContent = styled(ScrollView)`
  flex: 1;
  padding-bottom: ${theme.spacing.xl}px;
`;

// Header section for profile with centered alignment and subtle shadow
export const ProfileHeader = styled(View)`
  align-items: center;
  padding: ${theme.spacing.lg}px ${theme.spacing.md}px;
  background-color: ${theme.colors.background.paper};
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
  ${theme.shadows.sm}
`;

// Circular profile image with responsive sizing and primary color border
export const ProfileImage = styled(Image)`
  width: ${theme.isSmallDevice() ? 100 : 120}px;
  height: ${theme.isSmallDevice() ? 100 : 120}px;
  border-radius: ${theme.isSmallDevice() ? 50 : 60}px;
  margin-bottom: ${theme.spacing.md}px;
  border-width: 3px;
  border-color: ${theme.colors.primary.main};
`;

// Container for profile information with centered alignment
export const ProfileInfo = styled(View)`
  align-items: center;
  width: 100%;
`;

// User name text with heading style and centered alignment
export const ProfileName = styled(Text)`
  ${theme.typography.textStyles.h2};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.xs}px;
  text-align: center;
`;

// User location text with body style and secondary text color
export const ProfileLocation = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.xs}px;
  text-align: center;
`;

// User bio text with body style and horizontal padding
export const ProfileBio = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.primary};
  text-align: center;
  margin-top: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.lg}px;
`;

// Section title text with heading style and appropriate margins
export const SectionTitle = styled(Text)`
  ${theme.typography.textStyles.h3};
  color: ${theme.colors.text.primary};
  margin-top: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.sm}px;
  margin-horizontal: ${theme.spacing.md}px;
`;

// Action button with support for primary and secondary styles
export const ActionButton = styled(TouchableOpacity)`
  background-color: ${props => props.secondary ? theme.colors.background.paper : theme.colors.primary.main};
  padding-vertical: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.md}px;
  border-radius: ${theme.spacing.sm}px;
  align-items: center;
  justify-content: center;
  margin-top: ${theme.spacing.md}px;
  margin-horizontal: ${theme.spacing.md}px;
  flex-direction: row;
  ${props => !props.secondary ? theme.shadows.sm : `
    border-width: 1px;
    border-color: ${theme.colors.border.main};
  `}
`;