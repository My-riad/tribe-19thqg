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
  RefreshControl,
} from 'react-native'; // react-native ^0.70.0
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // react-native-vector-icons/MaterialCommunityIcons ^9.2.0
import { useNavigation, useIsFocused } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import debounce from 'lodash'; // lodash ^4.17.21

import {
  Container,
  Header,
  HeaderTitle,
  EmptyStateContainer,
  EmptyStateText,
} from './ChatScreen.styles';
import TribeChat from '../../../components/tribe/TribeChat/TribeChat';
import Card from '../../../components/ui/Card/Card';
import Avatar from '../../../components/ui/Avatar/Avatar';
import Badge from '../../../components/ui/Badge/Badge';
import LoadingIndicator from '../../../components/ui/LoadingIndicator/LoadingIndicator';
import Button from '../../../components/ui/Button/Button';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  initChatListeners,
  removeChatListeners,
  syncOfflineMessages,
} from '../../../store/thunks/chatThunks';
import { actions } from '../../../store/slices/chatSlice';
import { getUserTribes } from '../../../store/thunks/tribeThunks';
import { useAuth } from '../../../hooks/useAuth';
import { useOffline } from '../../../hooks/useOffline';
import { socketClient } from '../../../api/socketClient';
import { theme } from '../../../theme';
import { formatDate } from '../../../utils/dateTime';
import {
  ChatMessage,
  MessageType,
  AIPromptMessage,
  AIPromptType,
  AIPromptAction,
  MessageStatus,
  SendMessageRequest,
} from '../../../types/chat.types';

/**
 * Props for the ChatScreen component
 */
interface ChatScreenProps {
  testID?: string;
}

/**
 * Main component for the Chat screen that displays a list of tribe chats
 */
const ChatScreen = (props: ChatScreenProps): JSX.Element => {
  // Initialize component state for loading, refreshing, and active chat
  const [refreshing, setRefreshing] = useState(false);

  // Get the Redux dispatch function using useAppDispatch
  const dispatch = useAppDispatch();

  // Get navigation functions using useNavigation
  const navigation = useNavigation();

  // Get screen focus state using useIsFocused
  const isFocused = useIsFocused();

  // Get authentication state using useAuth
  const { user } = useAuth();

  // Get offline state using useOffline
  const { isOffline, syncOfflineData } = useOffline();

  // Select chat and tribe state from Redux store using useAppSelector
  const chatState = useAppSelector((state) => state.chat);
  const tribeState = useAppSelector((state) => state.tribes);

  // Create memoized list of user tribes with chat data
  const userTribesWithChat = useMemo(() => {
    return tribeState.userTribes.map((tribeId) => tribeState.tribes[tribeId]);
  }, [tribeState.tribes, tribeState.userTribes]);

  // Set up effect to initialize chat listeners when component mounts
  useEffect(() => {
    if (isFocused) {
      dispatch(initChatListeners());
    }
    return () => {
      dispatch(removeChatListeners());
    };
  }, [dispatch, isFocused]);

  // Set up effect to sync offline messages when connection is restored
  useEffect(() => {
    if (!isOffline && isFocused) {
      syncOfflineData().catch((error) => {
        console.error('Error syncing offline messages:', error);
      });
    }
  }, [dispatch, isOffline, syncOfflineData, isFocused]);

  // Set up effect to load user tribes when component mounts or refreshes
  useEffect(() => {
    if (isFocused) {
      dispatch(getUserTribes());
    }
  }, [dispatch, isFocused]);

  // Create handler for refreshing tribe list
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(getUserTribes()).unwrap();
    } catch (error) {
      console.error('Error refreshing tribe list:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Create handler for selecting a tribe chat
  const handleSelectTribe = useCallback(
    (tribeId: string) => {
      dispatch(actions.setActiveChat(tribeId));
      navigation.navigate('TribeChat', { tribeId });
    },
    [dispatch, navigation]
  );

  // Create handler for rendering an empty state when user has no tribes
  const renderEmptyState = useCallback(() => {
    return (
      <EmptyStateContainer>
        <EmptyStateText>
          You are not a member of any tribes yet. Join a tribe to start
          chatting!
        </EmptyStateText>
        <Button onPress={() => navigation.navigate('Discover')}>
          Discover Tribes
        </Button>
      </EmptyStateContainer>
    );
  }, [navigation]);

  // Render container with appropriate styling
  return (
    <Container testID={props.testID}>
      {/* Render list of tribe chats with FlatList */}
      {userTribesWithChat.length > 0 ? (
        <FlatList
          data={userTribesWithChat}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectTribe(item.id)}>
              <Card>
                <View>
                  <Text>{item.name}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        renderEmptyState()
      )}
    </Container>
  );
};

export default ChatScreen;