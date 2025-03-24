import styled from 'styled-components/native';
import { Animated, FlatList, View, Text, TextInput, Platform } from 'react-native';
import { theme } from '../../../theme';

// Define interface for message bubble style properties
interface MessageBubbleStyles {
  backgroundColor: string;
  textColor: string;
  alignment: 'flex-start' | 'flex-end';
}

/**
 * Returns the appropriate styles for a message bubble based on sender type and message type
 */
const getMessageBubbleStyles = (isCurrentUser: boolean, messageType?: string): MessageBubbleStyles => {
  // AI assistant message styles
  if (messageType === 'AI') {
    return {
      backgroundColor: theme.colors.primary.light,
      textColor: theme.colors.text.contrast,
      alignment: 'flex-start',
    };
  }
  
  // System message styles
  if (messageType === 'system') {
    return {
      backgroundColor: theme.colors.background.subtle,
      textColor: theme.colors.text.secondary,
      alignment: 'center',
    };
  }
  
  // Current user message styles
  if (isCurrentUser) {
    return {
      backgroundColor: theme.colors.primary.main,
      textColor: theme.colors.text.contrast,
      alignment: 'flex-end',
    };
  }
  
  // Other user message styles
  return {
    backgroundColor: theme.colors.background.subtle,
    textColor: theme.colors.text.primary,
    alignment: 'flex-start',
  };
};

// Styled container component for the entire chat interface
export const Container = styled(View)`
  flex: 1;
  background-color: ${theme.colors.background.default};
`;

// Styled container for the messages list with appropriate horizontal padding
export const ChatContainer = styled(View)`
  flex: 1;
  padding-horizontal: ${theme.spacing.sm}px;
`;

// Styled FlatList component for rendering chat messages with vertical padding
export const MessagesList = styled(FlatList)`
  flex: 1;
  padding-vertical: ${theme.spacing.sm}px;
`;

// Styled container for individual message with alignment based on sender
export const MessageContainer = styled(View)`
  margin-vertical: ${theme.spacing.xs}px;
  align-items: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
`;

// Styled bubble component for message content with dynamic styling based on sender and message type
export const MessageBubble = styled(View)`
  background-color: ${props => getMessageBubbleStyles(props.isCurrentUser, props.messageType).backgroundColor};
  border-radius: ${theme.spacing.md}px;
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  max-width: 80%;
  ${props => props.messageType === 'AI' ? theme.shadows.sm : ''}
`;

// Styled text component for message content with dynamic text color
export const MessageText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${props => getMessageBubbleStyles(props.isCurrentUser, props.messageType).textColor};
`;

// Styled text component for message timestamp
export const MessageTime = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.xs}px;
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.xs}px;
  align-self: flex-end;
`;

// Styled text component for sender's name
export const SenderName = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.xs}px;
`;

// Styled container for the message input area with platform-specific shadow
export const InputContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.sm}px;
  background-color: ${theme.colors.background.paper};
  border-top-width: 1px;
  border-top-color: ${theme.colors.border.light};
  ${Platform.OS === 'ios' ? theme.shadows.sm : ''}
`;

// Styled text input for composing messages with platform-specific padding
export const MessageInput = styled(TextInput)`
  flex: 1;
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.md}px;
  color: ${theme.colors.text.primary};
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.lg}px;
  padding-horizontal: ${theme.spacing.md}px;
  padding-vertical: ${Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.xs}px;
  max-height: ${theme.spacing.xxl * 2}px;
`;

// Styled button for sending messages with appropriate size and styling
export const SendButton = styled(View)`
  margin-left: ${theme.spacing.sm}px;
  width: ${theme.spacing.xl}px;
  height: ${theme.spacing.xl}px;
  border-radius: ${theme.spacing.xl / 2}px;
  background-color: ${theme.colors.primary.main};
  align-items: center;
  justify-content: center;
  ${theme.shadows.sm}
`;

// Styled component for showing typing indicators with animation support
export const TypingIndicator = styled(Animated.View)`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  margin-vertical: ${theme.spacing.xs}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.spacing.md}px;
  align-self: flex-start;
`;

// Styled container for empty chat state with centered content
export const EmptyStateContainer = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
`;

// Styled component for date separators between message groups
export const DateSeparator = styled(View)`
  align-items: center;
  margin-vertical: ${theme.spacing.md}px;
`;

// Styled text component for date separator text
export const DateSeparatorText = styled(Text)`
  font-family: ${theme.typography.fontFamily.primary};
  font-size: ${theme.typography.fontSize.sm}px;
  color: ${theme.colors.text.secondary};
  background-color: ${theme.colors.background.subtle};
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: ${theme.spacing.sm}px;
`;