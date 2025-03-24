import styled from 'styled-components/native';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { theme } from '../../../theme';
import { isSmallDevice } from '../../../theme';

// Main container for the event details screen
export const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Scrollable container for event content
export const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

// Container for the event header section
export const HeaderContainer = styled(View)`
  margin-bottom: ${theme.spacing.medium}px;
`;

// Styled component for the event image
export const EventImage = styled(Image)`
  width: 100%;
  height: 200px;
  border-radius: ${theme.borderRadius.small}px;
`;

// Styled component for the event title
export const EventTitle = styled(Text)`
  ${theme.typography.textStyles.h2};
  margin-top: ${theme.spacing.small}px;
  color: ${theme.colors.text.primary};
`;

// Styled container for content sections
export const SectionContainer = styled(View)`
  margin-bottom: ${theme.spacing.large}px;
  padding-horizontal: ${theme.spacing.medium}px;
`;

// Styled component for section titles
export const SectionTitle = styled(Text)`
  ${theme.typography.textStyles.h3};
  margin-bottom: ${theme.spacing.small}px;
  color: ${theme.colors.text.primary};
`;

// Styled component for event description text
export const DescriptionText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.medium}px;
`;

// Styled row component for information display
export const InfoRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.small}px;
`;

// Styled component for information labels
export const InfoLabel = styled(Text)`
  ${theme.typography.textStyles.body};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  width: 80px;
`;

// Styled component for information values
export const InfoValue = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.text.secondary};
  flex: 1;
`;

// Styled container for action buttons
export const ActionButtonsContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${theme.spacing.large}px;
  padding-horizontal: ${theme.spacing.medium}px;
  margin-bottom: ${theme.spacing.large}px;
`;

// Styled container for organizer information
export const OrganizerContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.medium}px;
`;

// Styled container for organizer details
export const OrganizerInfo = styled(View)`
  margin-left: ${theme.spacing.small}px;
`;

// Styled component for organizer name
export const OrganizerName = styled(Text)`
  ${theme.typography.textStyles.body};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
`;

// Styled component for organizer role
export const OrganizerRole = styled(Text)`
  ${theme.typography.textStyles.caption};
  color: ${theme.colors.text.secondary};
`;

// Styled container for error states
export const ErrorContainer = styled(View)`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.large}px;
`;

// Styled component for error messages
export const ErrorText = styled(Text)`
  ${theme.typography.textStyles.body};
  color: ${theme.colors.error.main};
  text-align: center;
  margin-top: ${theme.spacing.medium}px;
`;

// Styled container for attendees section
export const AttendeesSectionContainer = styled(View)`
  margin-bottom: ${theme.spacing.medium}px;
`;

// Styled container for RSVP buttons
export const RSVPContainer = styled(View)`
  margin-top: ${theme.spacing.medium}px;
  margin-bottom: ${theme.spacing.medium}px;
  align-items: center;
`;

// Styled container for weather information
export const WeatherContainer = styled(View)`
  margin-bottom: ${theme.spacing.medium}px;
  padding: ${theme.spacing.small}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.borderRadius.small}px;
`;