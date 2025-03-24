import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect
} from 'react'; // react ^18.2.0
import {
  ActivityIndicator,
} from 'react-native'; // react-native ^0.70.0
import { useNavigation, useRoute } from '@react-navigation/native'; // @react-navigation/native ^6.0.0
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // react-native-vector-icons/MaterialCommunityIcons ^9.2.0

import {
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
} from './TribeChatScreen.styles';
import TribeChat from '../../../components/tribe/TribeChat/TribeChat';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { initChatListeners, removeChatListeners, syncOfflineMessages } from '../../../store/thunks/chatThunks';
import { getTribe } from '../../../store/thunks/tribeThunks';
import { offlineService } from '../../../services/offlineService';
import { TribeNavigationProp } from '../../../types/navigation.types';
import { RouteProp } from '@react-navigation/native';

// Define the type for the route prop containing parameters for the TribeChatScreen
type TribeChatScreenRouteProp = RouteProp<TribeStackParamList, 'TribeChat'>;

/**
 * Main screen component for tribe chat functionality
 */
const TribeChatScreen = (): JSX.Element => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<TribeNavigationProp>();

  // Get route parameters using useRoute hook
  const route = useRoute<TribeChatScreenRouteProp>();

  // Extract tribeId from route parameters
  const { tribeId } = route.params;

  // Initialize component state for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the Redux dispatch function using useAppDispatch
  const dispatch = useAppDispatch();

  // Select chat state from Redux store using useAppSelector
  const chatState = useAppSelector((state) => state.chat);

  // Select tribe state from Redux store using useAppSelector
  const tribeState = useAppSelector((state) => state.tribes);

  // Get tribe details from the tribe state
  const tribe = tribeState.tribes[tribeId];

  // Set up effect to initialize chat listeners when component mounts
  useLayoutEffect(() => {
    dispatch(initChatListeners());
    return () => {
      dispatch(removeChatListeners());
    };
  }, [dispatch]);

  // Set up effect to load tribe details if not already loaded
  useEffect(() => {
    if (!tribe) {
      setLoading(true);
      setError(null);
      dispatch(getTribe(tribeId))
        .unwrap()
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dispatch, tribe, tribeId]);

  // Set up effect to sync offline messages when online
  useEffect(() => {
    if (!offlineService.isOffline()) {
      dispatch(syncOfflineMessages());
    }
  }, [dispatch]);

  // Create handler for navigating back
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Create handler for opening member list
  const handleMemberPress = useCallback(() => {
    navigation.navigate('MemberList', { tribeId });
  }, [navigation, tribeId]);

  // Create handler for retrying after error
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    dispatch(getTribe(tribeId))
      .unwrap()
      .then(() => {
        dispatch(initChatListeners());
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch, tribeId]);

  // Create handler for opening chat options
  const handleOptionsPress = useCallback(() => {
    // Show options menu or modal with chat settings
  }, []);

  // Render screen container with appropriate styling
  return (
    <Container>
      {/* Render header with tribe name, member count, back button, and options button */}
      <Header>
        <HeaderContent>
          <BackButton onPress={handleBack}>
            <Icon name="arrow-left" size={24} color="#000" />
          </BackButton>
          <HeaderTitle>{tribe ? tribe.name : 'Loading...'}</HeaderTitle>
          {tribe && (
            <HeaderSubtitle>
              <MembersIndicator>
                <Icon name="account-multiple" size={16} color="#000" />
                <MembersCount>{tribe.memberCount} Members</MembersCount>
              </MembersIndicator>
            </HeaderSubtitle>
          )}
        </HeaderContent>
        <HeaderActions>
          <OptionsButton onPress={handleOptionsPress}>
            <Icon name="dots-vertical" size={24} color="#000" />
          </OptionsButton>
        </HeaderActions>
      </Header>

      {/* Render loading indicator when loading */}
      {loading && (
        <LoadingContainer>
          <ActivityIndicator size="large" color="#000" />
        </LoadingContainer>
      )}

      {/* Render error message and retry button when error occurs */}
      {error && (
        <ErrorContainer>
          <ErrorText>{error}</ErrorText>
          <RetryButton onPress={handleRetry}>
            <RetryButtonText>Retry</RetryButtonText>
          </RetryButton>
        </ErrorContainer>
      )}

      {/* Render TribeChat component when loaded successfully */}
      {!loading && !error && tribe && (
        <Content>
          <TribeChat
            tribeId={tribeId}
            tribeName={tribe.name}
            memberCount={tribe.memberCount}
            onBack={handleBack}
            onMemberPress={handleMemberPress}
            showHeader={false}
          />
        </Content>
      )}
    </Container>
  );
};

export default TribeChatScreen;