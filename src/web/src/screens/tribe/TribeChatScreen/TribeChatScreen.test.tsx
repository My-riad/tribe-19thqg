import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native ^11.5.0
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { jest } from '@jest/globals'; // jest ^29.2.1
import { NavigationContainer } from '@react-navigation/native'; // @react-navigation/native ^6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0

import TribeChatScreen from './TribeChatScreen'; // Import the component being tested
import { store } from '../../../store/store'; // Import Redux store for testing with Provider
import { initChatListeners, removeChatListeners, syncOfflineMessages } from '../../../store/thunks/chatThunks'; // Import chat thunk for mocking
import { getTribe } from '../../../store/thunks/tribeThunks'; // Import tribe thunk for mocking
import { offlineService } from '../../../services/offlineService'; // Import offline service for mocking

// Mock chat thunks to verify they are called correctly
jest.mock('../../../store/thunks/chatThunks', () => ({
  initChatListeners: jest.fn(),
  removeChatListeners: jest.fn(),
  syncOfflineMessages: jest.fn(),
}));

// Mock tribe thunks to verify they are called correctly
jest.mock('../../../store/thunks/tribeThunks', () => ({
  getTribe: jest.fn(),
}));

// Mock offline service to test online/offline behavior
jest.mock('../../../services/offlineService', () => ({
  offlineService: {
    isOffline: jest.fn(),
  },
}));

// Mock navigation hooks and functions
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      goBack: jest.fn(),
      navigate: jest.fn(),
    }),
    useRoute: () => ({
      params: { tribeId: 'test-tribe-id' },
    }),
  };
});

// Mock tribe ID for testing
const mockTribeId = 'test-tribe-id';

// Mock tribe data for testing
const mockTribe = { id: 'test-tribe-id', name: 'Test Tribe', memberCount: 5 };

// Mock initial Redux state for testing
const mockInitialState = {
  chat: { loading: false, error: null, messages: {}, activeChat: null },
  tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
};

// Stack navigator for testing navigation
const Stack = createStackNavigator();

/**
 * Setup function to create a test renderer with all required providers
 * @param { initialState, params }
 * @returns { Rendered component with utilities }
 */
const setup = ({ initialState, params }: { initialState?: any; params?: any } = {}) => {
  // Create a mock navigation stack with TribeChatScreen
  const MockNavigator = () => (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="TribeChat" component={TribeChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  // Set up mock route params with tribeId if provided
  const route = { params: { tribeId: mockTribeId, ...params } };

  // Render the component wrapped in NavigationContainer and Redux Provider
  const renderResult = render(
    <Provider store={store}>
      <MockNavigator />
    </Provider>
  );

  // Return the rendered component and utilities
  return {
    ...renderResult,
  };
};

describe('TribeChatScreen component', () => {
  beforeEach(() => {
    (initChatListeners as jest.Mock).mockClear();
    (removeChatListeners as jest.Mock).mockClear();
    (syncOfflineMessages as jest.Mock).mockClear();
    (getTribe as jest.Mock).mockClear();
    (offlineService.isOffline as jest.Mock).mockReturnValue(false);

    (getTribe as jest.Mock).mockImplementation(() => ({
      unwrap: () => Promise.resolve(mockTribe),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', async () => {
    // Set up initial state with loading: true
    const initialState = {
      chat: { loading: true, error: null, messages: {}, activeChat: null },
      tribe: { tribes: {}, loading: false, error: null }
    };

    // Render the component with setup function
    const { getByTestId } = setup({ initialState });

    // Verify that loading indicator is displayed
    expect(getByTestId('loading-indicator')).toBeTruthy();

    // Verify that chat content is not displayed
    expect(() => getByTestId('chat-content')).toThrow();
  });

  it('renders tribe chat when data is loaded', async () => {
    // Set up initial state with loading: false and mock tribe data
    const initialState = {
      chat: { loading: false, error: null, messages: {}, activeChat: null },
      tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
    };

    // Render the component with setup function
    const { getByText, getByTestId } = setup({ initialState });

    // Verify that tribe name is displayed in header
    expect(getByText('Test Tribe')).toBeTruthy();

    // Verify that TribeChat component is rendered
    expect(getByTestId('chat-content')).toBeTruthy();

    // Verify that loading indicator is not displayed
    expect(() => getByTestId('loading-indicator')).toThrow();
  });

  it('renders error state correctly', async () => {
    // Set up initial state with error message
    const initialState = {
      chat: { loading: false, error: 'Failed to load tribe', messages: {}, activeChat: null },
      tribe: { tribes: {}, loading: false, error: null }
    };

    // Render the component with setup function
    const { getByText, getByTestId } = setup({ initialState });

    // Verify that error message is displayed
    expect(getByText('Failed to load tribe')).toBeTruthy();

    // Verify that retry button is displayed
    expect(getByTestId('retry-button')).toBeTruthy();

    // Verify that chat content is not displayed
    expect(() => getByTestId('chat-content')).toThrow();
  });

  it('initializes chat listeners on mount', async () => {
    // Set up initial state with mock tribe data
    const initialState = {
      chat: { loading: false, error: null, messages: {}, activeChat: null },
      tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
    };

    // Render the component with setup function
    setup({ initialState });

    // Verify that initChatListeners thunk was dispatched
    expect(initChatListeners).toHaveBeenCalled();

    // Verify that getTribe thunk was dispatched with correct tribeId
    expect(getTribe).toHaveBeenCalledWith(mockTribeId);
  });

  it('removes chat listeners on unmount', async () => {
    // Set up initial state with mock tribe data
    const initialState = {
      chat: { loading: false, error: null, messages: {}, activeChat: null },
      tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
    };

    // Render the component with setup function
    const { unmount } = setup({ initialState });

    // Unmount the component
    unmount();

    // Verify that removeChatListeners thunk was dispatched
    expect(removeChatListeners).toHaveBeenCalled();
  });

  it('syncs offline messages when online', async () => {
    // Mock offlineService.isOffline to return false (online)
    (offlineService.isOffline as jest.Mock).mockReturnValue(false);

    // Set up initial state with mock tribe data
    const initialState = {
      chat: { loading: false, error: null, messages: {}, activeChat: null },
      tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
    };

    // Render the component with setup function
    setup({ initialState });

    // Verify that syncOfflineMessages thunk was dispatched
    expect(syncOfflineMessages).toHaveBeenCalled();
  });

  it('handles back button press', async () => {
    // Set up initial state with mock tribe data
    const initialState = {
      chat: { loading: false, error: null, messages: {}, activeChat: null },
      tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
    };

    // Render the component with setup function
    const { getByTestId } = setup({ initialState });

    // Mock navigation
    const navigation = { goBack: jest.fn() };
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue(navigation);

    // Find back button and fire press event
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    // Verify that navigation.goBack was called
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('handles retry button press', async () => {
    // Set up initial state with error message
    const initialState = {
      chat: { loading: false, error: 'Failed to load tribe', messages: {}, activeChat: null },
      tribe: { tribes: {}, loading: false, error: null }
    };

    // Render the component with setup function
    const { getByTestId } = setup({ initialState });

    // Find retry button and fire press event
    const retryButton = getByTestId('retry-button');
    fireEvent.press(retryButton);

    // Verify that getTribe thunk was dispatched with correct tribeId
    expect(getTribe).toHaveBeenCalledWith(mockTribeId);

    // Verify that initChatListeners thunk was dispatched
    expect(initChatListeners).toHaveBeenCalled();
  });

  it('handles member list button press', async () => {
    // Set up initial state with mock tribe data
    const initialState = {
      chat: { loading: false, error: null, messages: {}, activeChat: null },
      tribe: { tribes: { 'test-tribe-id': mockTribe }, loading: false, error: null }
    };

    // Render the component with setup function
    const { getByTestId } = setup({ initialState });

    // Mock navigation
    const navigation = { navigate: jest.fn() };
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue(navigation);

    // Find member count button and fire press event
    const memberCountButton = getByTestId('member-count-button');
    fireEvent.press(memberCountButton);

    // Verify that navigation.navigate was called with 'MemberList' and correct params
    expect(navigation.navigate).toHaveBeenCalledWith('MemberList', { tribeId: mockTribeId });
  });
});