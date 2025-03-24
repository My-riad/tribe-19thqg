import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native ^12.1.2
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit ^1.9.5
import { NavigationContainer } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import ChatScreen from '../ChatScreen';
import { actions } from '../../../store/slices/chatSlice';
import { initChatListeners, syncOfflineMessages } from '../../../store/thunks/chatThunks';
import { getUserTribes } from '../../../store/thunks/tribeThunks';
import { mockTribes } from '../../../mocks/data/tribes';
import { mockChats } from '../../../mocks/data/chats';

// Mock the navigation hooks to prevent navigation errors during testing
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useIsFocused: () => true,
}));

// Mock the useAuth hook to provide authentication state
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isAuthenticated: true,
    loading: false,
    error: null,
  }),
}));

// Mock the useOffline hook to control offline state in tests
jest.mock('../../../hooks/useOffline', () => ({
  useOffline: () => ({
    isOffline: false,
    isOfflineEnabled: true,
    checkConnection: jest.fn(),
    queueAction: jest.fn(),
    syncOfflineData: jest.fn().mockResolvedValue({ success: true, processed: 0, failed: 0 }),
    cacheData: jest.fn(),
    getCachedData: jest.fn(),
    removeCachedData: jest.fn(),
    queuedActionsCount: 0,
    getQueuedActionsCount: jest.fn().mockResolvedValue(0),
  }),
}));

// Mock the socketClient to control socket connection state
jest.mock('../../../api/socketClient', () => ({
  socketClient: {
    isConnected: jest.fn().mockReturnValue(true),
  },
}));

// Helper function to create a Redux store for testing
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: (state = initialState, action) => state,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: false,
    }),
  });
};

// Helper function to render components with necessary providers
const renderWithProviders = (ui, options = {}) => {
  const { initialState = {}, store = createTestStore(initialState), navigation = true } = options;

  const renderOptions = {
    wrapper: ({ children }) => (
      <Provider store={store}>
        {navigation ? (
          <NavigationContainer>
            {children}
          </NavigationContainer>
        ) : (
          children
        )}
      </Provider>
    ),
    ...options,
  };

  return {
    ...render(ui, renderOptions),
    store,
  };
};

describe('ChatScreen', () => {
  let store;

  beforeEach(() => {
    store = createTestStore({
      chat: {
        messages: {},
        activeChat: null,
        loading: false,
        error: null,
        typingUsers: {},
        unreadCounts: {},
        aiPrompts: {},
      },
      tribes: {
        tribes: mockTribes.reduce((acc, tribe) => ({ ...acc, [tribe.id]: tribe }), {}),
        userTribes: mockTribes.map(tribe => tribe.id),
        suggestedTribes: [],
        activeTribe: null,
        loading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
        searchError: null,
      },
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, queryByTestId } = renderWithProviders(<ChatScreen />);
    expect(getByText('Chat')).toBeTruthy();
    expect(queryByTestId('tribe-list')).toBeTruthy();
  });

  it('displays loading indicator when loading', () => {
    store = createTestStore({
      chat: {
        messages: {},
        activeChat: null,
        loading: true,
        error: null,
        typingUsers: {},
        unreadCounts: {},
        aiPrompts: {},
      },
      tribes: {
        tribes: {},
        userTribes: [],
        suggestedTribes: [],
        activeTribe: null,
        loading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
        searchError: null,
      },
    });
    const { queryByTestId } = renderWithProviders(<ChatScreen />, { store });
    expect(queryByTestId('loading-indicator')).toBeTruthy();
    expect(queryByTestId('tribe-list')).toBeFalsy();
  });

  it('displays empty state when user has no tribes', () => {
    store = createTestStore({
      chat: {
        messages: {},
        activeChat: null,
        loading: false,
        error: null,
        typingUsers: {},
        unreadCounts: {},
        aiPrompts: {},
      },
      tribes: {
        tribes: {},
        userTribes: [],
        suggestedTribes: [],
        activeTribe: null,
        loading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
        searchError: null,
      },
    });
    const { getByText } = renderWithProviders(<ChatScreen />, { store });
    expect(getByText('You are not a member of any tribes yet. Join a tribe to start chatting!')).toBeTruthy();
    expect(getByText('Discover Tribes')).toBeTruthy();
  });

  it('displays list of tribes with chat previews', () => {
    const { getByText } = renderWithProviders(<ChatScreen />, { store });
    mockTribes.forEach(tribe => {
      expect(getByText(tribe.name)).toBeTruthy();
    });
  });

  it('opens tribe chat when tribe is selected', async () => {
    const { getByText, store } = renderWithProviders(<ChatScreen />);
    const tribe = mockTribes[0];
    const tribeItem = getByText(tribe.name);
    
    await act(async () => {
      fireEvent.press(tribeItem);
    });

    expect(store.dispatch).toHaveBeenCalledWith(actions.setActiveChat(tribe.id));
    expect(store.dispatch).toHaveBeenCalledWith(actions.resetUnreadCount(tribe.id));
  });

  it('returns to tribe list when back button is pressed', async () => {
    store = createTestStore({
      chat: {
        messages: {},
        activeChat: 'tribe-1',
        loading: false,
        error: null,
        typingUsers: {},
        unreadCounts: {},
        aiPrompts: {},
      },
      tribes: {
        tribes: mockTribes.reduce((acc, tribe) => ({ ...acc, [tribe.id]: tribe }), {}),
        userTribes: mockTribes.map(tribe => tribe.id),
        suggestedTribes: [],
        activeTribe: null,
        loading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
        searchError: null,
      },
    });
    const { getByTestId, store } = renderWithProviders(<ChatScreen />, { store });
    const backButton = getByTestId('back-button');
    
    await act(async () => {
      fireEvent.press(backButton);
    });

    expect(store.dispatch).toHaveBeenCalledWith(actions.setActiveChat(null));
  });

  it('refreshes tribe list on pull-to-refresh', async () => {
    const { getByTestId, store } = renderWithProviders(<ChatScreen />);
    const flatList = getByTestId('tribe-list');
    
    await act(async () => {
      fireEvent(flatList, 'refresh');
    });

    expect(store.dispatch).toHaveBeenCalledWith(getUserTribes());
  });

  it('initializes chat listeners on mount', () => {
    const { store } = renderWithProviders(<ChatScreen />);
    expect(store.dispatch).toHaveBeenCalledWith(initChatListeners());
  });

  it('syncs offline messages when connection is restored', () => {
    jest.mock('../../../hooks/useOffline', () => ({
      useOffline: () => ({
        isOffline: true,
        isOfflineEnabled: true,
        checkConnection: jest.fn(),
        queueAction: jest.fn(),
        syncOfflineData: jest.fn().mockResolvedValue({ success: true, processed: 0, failed: 0 }),
        cacheData: jest.fn(),
        getCachedData: jest.fn(),
        removeCachedData: jest.fn(),
        queuedActionsCount: 0,
        getQueuedActionsCount: jest.fn().mockResolvedValue(0),
      }),
    }));
    const { store } = renderWithProviders(<ChatScreen />);
    expect(store.dispatch).toHaveBeenCalledWith(syncOfflineMessages());
  });

  it('displays error message when loading tribes fails', async () => {
    store = createTestStore({
      chat: {
        messages: {},
        activeChat: null,
        loading: false,
        error: 'Failed to load tribes',
        typingUsers: {},
        unreadCounts: {},
        aiPrompts: {},
      },
      tribes: {
        tribes: {},
        userTribes: [],
        suggestedTribes: [],
        activeTribe: null,
        loading: false,
        error: null,
        searchResults: [],
        searchLoading: false,
        searchError: null,
      },
    });
    const { getByText, getByTestId, store } = renderWithProviders(<ChatScreen />, { store });
    expect(getByText('Failed to load tribes')).toBeTruthy();
    const retryButton = getByTestId('retry-button');
    
    await act(async () => {
      fireEvent.press(retryButton);
    });

    expect(store.dispatch).toHaveBeenCalledWith(getUserTribes());
  });
});