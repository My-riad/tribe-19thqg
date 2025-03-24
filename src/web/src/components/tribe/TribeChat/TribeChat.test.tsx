import React from 'react'; // React library for component testing // react ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // Testing utility for rendering components // @testing-library/react-native ^12.1.2
import { TribeChat } from './TribeChat'; // Import the component being tested
import { useAppDispatch, useAppSelector } from '../../../store/hooks'; // Import the typed dispatch hook for mocking
import { joinTribeChat, leaveTribeChat, getChatMessages, sendMessage, markMessagesAsRead, sendTypingIndicator, requestAIPrompt, respondToAIPrompt } from '../../../store/thunks/chatThunks'; // Import the thunks for chat actions to mock
import { MessageType, MessageStatus, AIPromptType, AIPromptAction } from '../../../types/chat.types'; // Import message type enum for test data
import { socketClient } from '../../../api/socketClient'; // Import socket client to mock connection status
import { offlineService } from '../../../services/offlineService'; // Import offline service to mock offline status
import { User } from '../../../types/auth.types';
import { useAuth } from '../../../hooks/useAuth';
import { MockedFunction } from 'jest-mock';

// Mock Redux hooks for testing component in isolation
jest.mock('../../../store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock Redux thunks to verify they are called correctly
jest.mock('../../../store/thunks/chatThunks', () => ({
  joinTribeChat: jest.fn(),
  leaveTribeChat: jest.fn(),
  getChatMessages: jest.fn(),
  sendMessage: jest.fn(),
  markMessagesAsRead: jest.fn(),
  sendTypingIndicator: jest.fn(),
  requestAIPrompt: jest.fn(),
  respondToAIPrompt: jest.fn(),
}));

// Mock socket client to control connection status in tests
jest.mock('../../../api/socketClient', () => ({
  socketClient: {
    isConnected: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    sendMessage: jest.fn(),
    sendTypingIndicator: jest.fn(),
    markMessagesAsRead: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock offline service to test offline behavior
jest.mock('../../../services/offlineService', () => ({
  offlineService: {
    isOffline: jest.fn(),
    queueAction: jest.fn(),
  },
}));

jest.mock('../../../hooks/useAuth', () => ({
    useAuth: jest.fn()
}));

// Test suite for TribeChat component
describe('TribeChat', () => {
  const mockAppDispatch = useAppDispatch as jest.Mock;
  const mockAppSelector = useAppSelector as jest.Mock;
  const mockJoinTribeChat = joinTribeChat as jest.Mock;
  const mockLeaveTribeChat = leaveTribeChat as jest.Mock;
  const mockGetChatMessages = getChatMessages as jest.Mock;
  const mockSendMessage = sendMessage as jest.Mock;
  const mockMarkMessagesAsRead = markMessagesAsRead as jest.Mock;
  const mockSendTypingIndicator = sendTypingIndicator as jest.Mock;
  const mockRequestAIPrompt = requestAIPrompt as jest.Mock;
  const mockRespondToAIPrompt = respondToAIPrompt as jest.Mock;
  const mockSocketClientIsConnected = socketClient.isConnected as jest.Mock;
  const mockOfflineServiceIsOffline = offlineService.isOffline as jest.Mock;
  const mockOfflineServiceQueueAction = offlineService.queueAction as jest.Mock;
  const mockUseAuth = useAuth as jest.Mock;

  // Test data for chat messages
  const mockMessages = [
    { id: '1', tribeId: '123', senderId: 'user1', senderName: 'User 1', senderAvatar: 'avatar1.jpg', content: 'Hello!', messageType: MessageType.TEXT, status: MessageStatus.READ, sentAt: new Date(), deliveredAt: new Date(), readAt: new Date(), metadata: null, isFromCurrentUser: true },
    { id: '2', tribeId: '123', senderId: 'user2', senderName: 'User 2', senderAvatar: 'avatar2.jpg', content: 'Hi there!', messageType: MessageType.TEXT, status: MessageStatus.DELIVERED, sentAt: new Date(), deliveredAt: new Date(), readAt: null, metadata: null, isFromCurrentUser: false },
  ];

  // Test data for AI-generated prompts
  const mockAIPrompts = [
    { id: 'ai1', tribeId: '123', promptType: AIPromptType.CONVERSATION_STARTER, content: 'What are your weekend plans?', options: null, createdAt: new Date(), expiresAt: null, respondedBy: [], skippedBy: [], metadata: null },
  ];

  // Test data for typing indicators
  const mockTypingUsers = ['User 3'];

  const mockCurrentUser: User = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        isEmailVerified: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastLogin: '2024-01-01T00:00:00.000Z',
        profileCompleted: true,
        hasCompletedOnboarding: true,
        mfaEnabled: false,
        preferredMfaMethod: null,
    };

  // Setup function that runs before each test
  beforeEach(() => {
    mockAppDispatch.mockReturnValue(jest.fn());
    mockAppSelector.mockImplementation((selector) => selector({
      chat: {
        messages: { '123': mockMessages },
        activeChat: '123',
        loading: false,
        error: null,
        typingUsers: { '123': mockTypingUsers },
        unreadCounts: { '123': 0 },
        aiPrompts: { '123': mockAIPrompts },
      },
    } as any));
    mockSocketClientIsConnected.mockReturnValue(true);
    mockOfflineServiceIsOffline.mockReturnValue(false);
    mockUseAuth.mockReturnValue({
            user: mockCurrentUser,
            isAuthenticated: true,
            loading: false,
            error: null,
            mfaRequired: false,
            mfaChallenge: null,
            login: jest.fn(),
            register: jest.fn(),
            socialLogin: jest.fn(),
            logout: jest.fn(),
            verifyMFA: jest.fn(),
            resetPassword: jest.fn(),
            updatePassword: jest.fn(),
            checkAuthStatus: jest.fn()
        });
  });

  // Cleanup function that runs after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests that the component renders correctly with default props
  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(getByText('Test Tribe')).toBeTruthy();
    expect(getByTestId('message-input')).toBeTruthy();
  });

  // Tests that the component joins the tribe chat when mounted
  it('joins tribe chat on mount', () => {
    render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(mockJoinTribeChat).toHaveBeenCalledWith("123");
    expect(mockGetChatMessages).toHaveBeenCalled();
  });

  // Tests that the component leaves the tribe chat when unmounted
  it('leaves tribe chat on unmount', () => {
    const { unmount } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    unmount();
    expect(mockLeaveTribeChat).toHaveBeenCalledWith("123");
  });

  // Tests that messages are rendered correctly in the chat
  it('renders messages correctly', () => {
    const { getByText } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(getByText('Hello!')).toBeTruthy();
    expect(getByText('Hi there!')).toBeTruthy();
  });

  // Tests that a message is sent when the send button is pressed
  it('sends message when send button pressed', async () => {
    const { getByTestId } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    const input = getByTestId('message-input');
    fireEvent.changeText(input, 'Test message');
    fireEvent.press(getByTestId('send-button'));
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
        tribeId: "123",
        content: "Test message",
        messageType: MessageType.TEXT,
      }));
    });
  });

  // Tests that typing indicators are displayed when other users are typing
  it('shows typing indicator when users are typing', () => {
    const { getByText } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(getByText('User 3 is typing...')).toBeTruthy();
  });

  // Tests that typing indicators are sent when the user types
  it('sends typing indicator when user types', async () => {
    jest.useFakeTimers();
    const { getByTestId } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    const input = getByTestId('message-input');
    fireEvent.changeText(input, 'Typing');
    expect(mockSendTypingIndicator).toHaveBeenCalledWith({ tribeId: "123", isTyping: true });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(mockSendTypingIndicator).toHaveBeenCalledWith({ tribeId: "123", isTyping: false });
    });
    jest.useRealTimers();
  });

  // Tests that AI prompts are rendered correctly in the chat
  it('renders AI prompts correctly', () => {
    const { getByText } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(getByText('What are your weekend plans?')).toBeTruthy();
  });

  // Tests that responses to AI prompts are handled correctly
  it('handles AI prompt responses', async () => {
    const { getByText } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    fireEvent.press(getByText('Respond'));
    await waitFor(() => {
      expect(mockRespondToAIPrompt).toHaveBeenCalledWith(expect.objectContaining({
        promptId: "ai1",
        userId: 'user1',
        action: AIPromptAction.RESPOND,
      }));
    });
  });

  // Tests that new AI prompts can be requested
  it('requests new AI prompts', async () => {
    const { getByText } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    fireEvent.press(getByText('Suggest another'));
    await waitFor(() => {
      expect(mockRequestAIPrompt).toHaveBeenCalledWith(expect.objectContaining({
        tribeId: "123",
      }));
    });
  });

  // Tests that messages are marked as read when viewed
  it('marks messages as read', () => {
    render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(mockMarkMessagesAsRead).toHaveBeenCalledWith(expect.objectContaining({
      tribeId: "123",
      messageIds: ["2"],
    }));
  });

  // Tests that the component handles offline mode correctly
  it('handles offline mode', async () => {
    mockSocketClientIsConnected.mockReturnValue(false);
    mockOfflineServiceIsOffline.mockReturnValue(true);
    const { getByTestId } = render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    const input = getByTestId('message-input');
    fireEvent.changeText(input, 'Offline message');
    fireEvent.press(getByTestId('send-button'));
    await waitFor(() => {
      expect(mockOfflineServiceQueueAction).toHaveBeenCalledWith(expect.objectContaining({
        type: 'SEND_MESSAGE',
        payload: expect.objectContaining({
          tribeId: "123",
          content: "Offline message",
          messageType: MessageType.TEXT,
        }),
      }));
    });
  });

  it('scrolls to bottom on new messages', () => {
    const mockScrollToEnd = jest.fn();
    jest.spyOn(React, 'useRef').mockReturnValue({ current: { scrollToEnd: mockScrollToEnd } } as any);
    render(<TribeChat tribeId="123" tribeName="Test Tribe" memberCount={2} onBack={() => {}} onMemberPress={() => {}} showHeader={true} />);
    expect(mockScrollToEnd).toHaveBeenCalled();
  });
});