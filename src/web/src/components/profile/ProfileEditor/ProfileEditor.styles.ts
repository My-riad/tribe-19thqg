import styled from 'styled-components/native';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { 
  theme,
  colors, 
  spacing, 
  typography, 
  shadows,
  isSmallDevice
} from '../../../theme';

export const Container = styled(View)`
  flex: 1;
  background-color: ${colors.background.default};
  padding: ${spacing.md}px;
`;

export const ScrollContainer = styled(ScrollView)`
  flex: 1;
`;

export const FormSection = styled(View)`
  background-color: ${colors.background.paper};
  border-radius: ${spacing.sm}px;
  padding: ${spacing.md}px;
  margin-bottom: ${spacing.md}px;
  shadow-color: ${shadows.sm.shadowColor};
  shadow-offset: ${shadows.sm.shadowOffset.width}px ${shadows.sm.shadowOffset.height}px;
  shadow-opacity: ${shadows.sm.shadowOpacity};
  shadow-radius: ${shadows.sm.shadowRadius}px;
  elevation: ${shadows.sm.elevation};
`;

export const SectionTitle = styled(Text)`
  font-size: ${typography.fontSize.h3}px;
  font-weight: ${typography.fontWeight.semiBold};
  color: ${colors.text.primary};
  margin-bottom: ${spacing.md}px;
`;

export const FormRow = styled(View)`
  margin-bottom: ${spacing.md}px;
`;

export const FormLabel = styled(Text)`
  font-size: ${typography.fontSize.body}px;
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.primary};
  margin-bottom: ${spacing.xs}px;
`;

export const ErrorText = styled(Text)`
  font-size: ${typography.fontSize.caption}px;
  color: ${colors.error.main};
  margin-top: ${spacing.xs}px;
`;

export const PhotoContainer = styled(View)`
  align-items: center;
  margin-bottom: ${spacing.lg}px;
`;

export const PhotoPlaceholder = styled(View)`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${colors.neutral[200]};
  justify-content: center;
  align-items: center;
  margin-bottom: ${spacing.sm}px;
`;

export const PhotoImage = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  margin-bottom: ${spacing.sm}px;
`;

export const PhotoButton = styled(TouchableOpacity)`
  background-color: ${colors.primary.light};
  padding-vertical: ${spacing.xs}px;
  padding-horizontal: ${spacing.sm}px;
  border-radius: ${spacing.xs}px;
`;

export const PhotoButtonText = styled(Text)`
  color: ${colors.primary.contrast};
  font-size: ${typography.fontSize.button}px;
  font-weight: ${typography.fontWeight.medium};
`;

export const SectionTabs = styled(View)`
  flex-direction: row;
  margin-bottom: ${spacing.md}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.border.light};
`;

export const SectionTab = styled(TouchableOpacity)`
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.md}px;
  border-bottom-width: 2px;
  border-bottom-color: ${props => props.active ? colors.primary.main : 'transparent'};
`;

export const SectionTabText = styled(Text)`
  font-size: ${typography.fontSize.body}px;
  font-weight: ${props => props.active ? typography.fontWeight.bold : typography.fontWeight.regular};
  color: ${props => props.active ? colors.primary.main : colors.text.secondary};
`;

export const ButtonContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  margin-top: ${spacing.lg}px;
  padding-bottom: ${Platform.OS === 'ios' ? spacing.xl : spacing.md}px;
`;