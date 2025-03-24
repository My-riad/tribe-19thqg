import styled from 'styled-components/native';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../theme';

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

const Header = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.background.paper};
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.border.light};
  ${Platform.OS === 'ios' ? theme.shadows.sm : ''}
`;

const HeaderContent = styled(View)`
  flex: 1;
  margin-horizontal: ${theme.spacing.sm}px;
`;

const HeaderTitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.lg}px;
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
`;

const HeaderSubtitle = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.xs}px;
`;

const HeaderActions = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const BackButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.sm}px;
  margin-right: ${theme.spacing.xs}px;
`;

const OptionsButton = styled(TouchableOpacity)`
  padding: ${theme.spacing.sm}px;
  margin-left: ${theme.spacing.xs}px;
`;

const Content = styled(View)`
  flex: 1;
`;

const LoadingContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const ErrorContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
`;

const ErrorText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${theme.spacing.lg}px;
`;

const RetryButton = styled(TouchableOpacity)`
  background-color: ${theme.colors.primary.main};
  padding-vertical: ${theme.spacing.sm}px;
  padding-horizontal: ${theme.spacing.lg}px;
  border-radius: ${theme.spacing.md}px;
  ${theme.shadows.sm}
`;

const RetryButtonText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.primary.contrast};
  text-align: center;
`;

const MembersIndicator = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const MembersCount = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
  margin-left: ${theme.spacing.xs}px;
`;

export {
  Container,
  Header,
  HeaderTitle,
  HeaderSubtitle,
  Content,
  LoadingContainer,
  ErrorContainer,
  ErrorText,
  RetryButton,
  RetryButtonText,
  BackButton,
  OptionsButton,
  HeaderContent,
  HeaderActions,
  MembersIndicator,
  MembersCount
};