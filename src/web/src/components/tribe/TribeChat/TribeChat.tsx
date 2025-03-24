import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'; // react ^18.2.0
import {
  FlatList,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'; // react-native ^0.70.0
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // react-native-vector-icons/MaterialCommunityIcons ^9.2.0
import debounce from 'lodash'; // lodash ^4.17.21

import {
  Container,
  ChatHeader,
  MessagesList,
  MessageItem,
  MessageBubble,
  MessageText,
  MessageTime,
  InputContainer,
  TypingIndicator,
  DateSeparator,
  ChatContainer,
} from './TribeChat.styles';
import Avatar from '../../ui/Avatar/Avatar';
import Button from '../../ui/Button/Button';
import Input from '../../ui/Input/Input';
import AIPrompt from '../AIPrompt/AIPrompt';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  joinTribeChat,
  leaveTribeChat,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  sendTypingIndicator,
  requestAIPrompt,
  respondToAIPrompt,
} from '../../../store/thunks/chatThunks';
import {
  ChatMessage,
  MessageType,
  AIPromptMessage,
  AIPromptType,
  AIPromptAction,
} from '../../../types/chat.types';
import { useAuth } from '../../../hooks/useAuth';
import { socketClient } from '../../../api/socketClient';
import { theme } from '../../../theme';
import { formatDate } from '../../../utils/dateTime';
import { offlineService } from '../../../services/offlineService';

/**
 * Props for the TribeChat component
 */
interface TribeChatProps {
  tribeId: string;
  tribeName: string;
  memberCount: number;
  onBack: () => void;
  onMemberPress: () => void;
  showHeader: boolean;
  testID?: string;
}

/**
 * State interface for the TribeChat component
 */
interface TribeChatState {
  messageInput: string;
  isTyping: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  error: string | null;
}

/**
 * Main component for tribe chat functionality
 */
const TribeChat = (props: TribeChatProps): JSX.Element => {
  // Destructure props
  const { tribeId, tribeName, memberCount, onBack, onMemberPress, showHeader, testID } = props;

  // Component state
  const [state, setState] = useState<TribeChatState>({
    messageInput: '',
    isTyping: false,
    isLoadingMore: false,
    hasMoreMessages: true,
    error: null,
  });

  // Redux dispatch and selectors
  const dispatch = useAppDispatch();
  const chatState = useAppSelector((state) => state.chat);
  const { user } = useAuth();

  // Refs for message list
  const messageListRef = useRef<FlatList<ChatMessage>>(null);

  // Memoized messages for the current tribe
  const messages = useMemo(() => {
    return chatState.messages[tribeId] || [];
  }, [chatState.messages, tribeId]);

  // Memoized AI prompts for the current tribe
  const aiPrompts = useMemo(() => {
    return chatState.aiPrompts[tribeId] || [];
  }, [chatState.aiPrompts, tribeId]);

  // Memoized typing users for the current tribe
  const typingUsers = useMemo(() => {
    return chatState.typingUsers[tribeId] || [];
  }, [chatState.typingUsers, tribeId]);

  // Effect to join tribe chat room on mount
  useEffect(() => {
    dispatch(joinTribeChat(tribeId));
    return () => {
      dispatch(leaveTribeChat(tribeId));
    };
  }, [dispatch, tribeId]);

  // Effect to load initial chat messages
  useEffect(() => {
    dispatch(getChatMessages({ tribeId, limit: 20, before: null }));
  }, [dispatch, tribeId]);

  // Effect to mark messages as read when viewed
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter((msg) => !msg.isFromCurrentUser && msg.status !== MessageStatus.READ)
        .map((msg) => msg.id);
      if (unreadMessageIds.length > 0) {
        dispatch(markMessagesAsRead({ tribeId, messageIds: unreadMessageIds }));
      }
    }
  }, [dispatch, messages, tribeId]);

  // Effect to scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  // Debounced typing indicator handler
  const debouncedTypingIndicator = useCallback(
    debounce((isTyping: boolean) => {
      dispatch(sendTypingIndicator({ tribeId, isTyping }));
    }, 500),
    [dispatch, tribeId]
  );

  // Message input change handler
  const handleInputChange = (text: string) => {
    setState((prev) => ({ ...prev, messageInput: text }));
    debouncedTypingIndicator(text.length > 0);
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (state.messageInput.trim() === '') return;

    const messageRequest: SendMessageRequest = {
      tribeId: tribeId,
      content: state.messageInput,
      messageType: MessageType.TEXT,
      metadata: null,
    };

    try {
      await dispatch(sendMessage(messageRequest)).unwrap();
      setState((prev) => ({ ...prev, messageInput: '' }));
    } catch (error) {
      console.error('Error sending message:', error);
      setState((prev) => ({ ...prev, error: 'Failed to send message' }));
    }
  };

  // Request AI prompt handler
  const handleRequestAIPrompt = async (promptType: AIPromptType) => {
    try {
      await dispatch(requestAIPrompt({ tribeId, promptType, context: null })).unwrap();
    } catch (error) {
      console.error('Error requesting AI prompt:', error);
      setState((prev) => ({ ...prev, error: 'Failed to request AI prompt' }));
    }
  };

  // Respond to AI prompt handler
  const handleRespondToPrompt = async (promptId: string, action: AIPromptAction, response: string = '') => {
    if (!user) return;
    try {
      await dispatch(respondToAIPrompt({ promptId, userId: user.id, action, response })).unwrap();
    } catch (error) {
      console.error('Error responding to AI prompt:', error);
      setState((prev) => ({ ...prev, error: 'Failed to respond to AI prompt' }));
    }
  };

  // Scroll to bottom function
  const scrollToBottom = (animated: boolean = true) => {
    if (messageListRef.current) {
      messageListRef.current.scrollToEnd({ animated });
    }
  };

  // Render message item
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.isFromCurrentUser;
    const messageTime = formatDate(item.sentAt, 'h:mm a');
    const messageStatusIcon =
      item.status === MessageStatus.SENT ? 'check' : item.status === MessageStatus.DELIVERED ? 'check-all' : 'clock';

    return (
      <MessageItem key={item.id} isCurrentUser={isCurrentUser}>
        {!isCurrentUser && <Avatar source={{ uri: item.senderAvatar }} size="sm" />}
        <MessageBubble isCurrentUser={isCurrentUser} messageType={item.messageType}>
          <MessageText isCurrentUser={isCurrentUser} messageType={item.messageType}>
            {item.content}
          </MessageText>
        </MessageBubble>
        <MessageTime>
          {messageTime} <MessageStatus name={messageStatusIcon} size={12} color={theme.colors.text.secondary} />
        </MessageTime>
      </MessageItem>
    );
  };

  // Render AI prompt
  const renderAIPrompt = (prompt: AIPromptMessage): JSX.Element => {
    return (
      <AIPrompt
        engagement={prompt}
        onRespond={handleRespondToPrompt}
        onSkip={() => {}}
        onSuggestAnother={() => {}}
      />
    );
  };

  // Render date separator
  const renderDateSeparator = (date: Date): JSX.Element => {
    const formattedDateString = formatDate(date, 'MMMM d, yyyy');
    return (
      <DateSeparator>
        <Text>{formattedDateString}</Text>
      </DateSeparator>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = (typingUsers: string[]): JSX.Element | null => {
    if (typingUsers.length === 0) return null;

    const typingText =
      typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} users are typing...`;

    return (
      <TypingIndicator>
        <Text>{typingText}</Text>
      </TypingIndicator>
    );
  };

  return (
    <Container testID={testID}>
      {showHeader && (
        <ChatHeader>
          <TouchableOpacity onPress={onBack}>
            <Icon name="arrow-left" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text>{tribeName}</Text>
          <TouchableOpacity onPress={onMemberPress}>
            <Icon name="account-multiple" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </ChatHeader>
      )}

      <ChatContainer>
        <MessagesList
          ref={messageListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            chatState.loading && <ActivityIndicator size="small" color={theme.colors.primary.main} />
          }
          ListEmptyComponent={
            !chatState.loading && <Text>No messages yet. Be the first to say something!</Text>
          }
          inverted
        />
      </ChatContainer>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <InputContainer>
          <Input
            placeholder="Type a message..."
            value={state.messageInput}
            onChangeText={handleInputChange}
            clearable
            testID="message-input"
          />
          <Button onPress={handleSendMessage} testID="send-button">
            <Icon name="send" size={24} color={theme.colors.primary.contrast} />
          </Button>
        </InputContainer>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default TribeChat;
export type { TribeChatProps };