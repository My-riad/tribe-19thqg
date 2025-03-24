import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AIPrompt from './AIPrompt';
import { engagementApi, EngagementType } from '../../../api/engagementApi';

// Mock the engagementApi.respondToEngagement function
jest.mock('../../../api/engagementApi', () => ({
  ...jest.requireActual('../../../api/engagementApi'),
  engagementApi: {
    respondToEngagement: jest.fn().mockResolvedValue({ success: true }),
  },
  EngagementType: {
    CONVERSATION_PROMPT: 'CONVERSATION_PROMPT',
    ACTIVITY_SUGGESTION: 'ACTIVITY_SUGGESTION',
    GROUP_CHALLENGE: 'GROUP_CHALLENGE',
    ICE_BREAKER: 'ICE_BREAKER',
    POLL: 'POLL',
  },
}));

// Interface for mock engagement data used in tests
interface MockEngagement {
  id: string;
  tribeId: string;
  type: EngagementType;
  content: string;
  title: string;
  status: string;
  trigger: string;
  deliveredAt: Date;
  expiresAt: Date;
  responseCount: number;
  responses: any[];
  hasUserResponded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for a conversation prompt engagement
const mockConversationPrompt: MockEngagement = {
  id: 'prompt-123',
  tribeId: 'tribe-123',
  type: EngagementType.CONVERSATION_PROMPT,
  title: 'Ice Breaker',
  content: 'If you could hike anywhere in the world, where would it be and why?',
  status: 'DELIVERED',
  trigger: 'AI_INITIATED',
  deliveredAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
  responseCount: 0,
  responses: [],
  hasUserResponded: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock data for an activity suggestion engagement
const mockActivitySuggestion: MockEngagement = {
  id: 'activity-123',
  tribeId: 'tribe-123',
  type: EngagementType.ACTIVITY_SUGGESTION,
  title: 'Weekend Activity',
  content: 'The weather looks great this weekend. How about a hike at Discovery Park?',
  status: 'DELIVERED',
  trigger: 'AI_INITIATED',
  deliveredAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  responseCount: 0,
  responses: [],
  hasUserResponded: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock data for a group challenge engagement
const mockChallenge: MockEngagement = {
  id: 'challenge-123',
  tribeId: 'tribe-123',
  type: EngagementType.GROUP_CHALLENGE,
  title: 'Photo Challenge',
  content: 'Take a photo of something interesting on your way to work tomorrow and share it with the group!',
  status: 'DELIVERED',
  trigger: 'AI_INITIATED',
  deliveredAt: new Date(),
  expiresAt: new Date(Date.now() + 86400000),
  responseCount: 0,
  responses: [],
  hasUserResponded: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AIPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversation prompt correctly', () => {
    const { getByText, getByTestId } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        testID="aiPrompt"
      />
    );

    expect(getByTestId('aiPrompt')).toBeTruthy();
    expect(getByText('Tribe Assistant')).toBeTruthy();
    expect(getByText('If you could hike anywhere in the world, where would it be and why?')).toBeTruthy();
    expect(getByText('Respond')).toBeTruthy();
    expect(getByText('Skip')).toBeTruthy();
    expect(getByText('Suggest another')).toBeTruthy();
  });

  it('renders activity suggestion correctly', () => {
    const { getByText, getByTestId } = render(
      <AIPrompt
        engagement={mockActivitySuggestion}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        testID="aiPrompt"
      />
    );

    expect(getByTestId('aiPrompt')).toBeTruthy();
    expect(getByText('Tribe Assistant')).toBeTruthy();
    expect(getByText('The weather looks great this weekend. How about a hike at Discovery Park?')).toBeTruthy();
    expect(getByText('Respond')).toBeTruthy();
  });

  it('renders challenge correctly', () => {
    const { getByText, getByTestId } = render(
      <AIPrompt
        engagement={mockChallenge}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        testID="aiPrompt"
      />
    );

    expect(getByTestId('aiPrompt')).toBeTruthy();
    expect(getByText('Tribe Assistant')).toBeTruthy();
    expect(getByText('Take a photo of something interesting on your way to work tomorrow and share it with the group!')).toBeTruthy();
    expect(getByText('Respond')).toBeTruthy();
  });

  it('calls onRespond when respond button is pressed', async () => {
    const mockOnRespond = jest.fn();
    
    const { getByText } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={mockOnRespond}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
      />
    );

    fireEvent.press(getByText('Respond'));
    
    await waitFor(() => {
      expect(engagementApi.respondToEngagement).toHaveBeenCalledWith(
        mockConversationPrompt.id,
        expect.objectContaining({
          responseType: 'respond',
        })
      );
      expect(mockOnRespond).toHaveBeenCalledWith(mockConversationPrompt.id, 'respond', undefined);
    });
  });

  it('calls onSkip when skip button is pressed', () => {
    const mockOnSkip = jest.fn();
    
    const { getByText } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={mockOnSkip}
        onSuggestAnother={jest.fn()}
      />
    );

    fireEvent.press(getByText('Skip'));
    expect(mockOnSkip).toHaveBeenCalledWith(mockConversationPrompt.id);
  });

  it('calls onSuggestAnother when suggest another button is pressed', () => {
    const mockOnSuggestAnother = jest.fn();
    
    const { getByText } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={mockOnSuggestAnother}
      />
    );

    fireEvent.press(getByText('Suggest another'));
    expect(mockOnSuggestAnother).toHaveBeenCalled();
  });

  it('shows loading state when responding', async () => {
    // Mock a delayed response
    (engagementApi.respondToEngagement as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    const { getByText } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
      />
    );

    fireEvent.press(getByText('Respond'));
    
    // Should show loading state immediately
    expect(getByText('Responding...')).toBeTruthy();
    
    // Wait for the response to complete
    await waitFor(() => {
      expect(getByText('Respond')).toBeTruthy();
    });
  });

  it('handles errors when responding', async () => {
    // Mock an error response
    (engagementApi.respondToEngagement as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const { getByText } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
      />
    );

    fireEvent.press(getByText('Respond'));
    
    await waitFor(() => {
      expect(getByText('Failed to send response. Please try again.')).toBeTruthy();
    });
  });

  it('displays timestamp when showTimestamp is true', () => {
    // We'll check if the component structure is different with and without timestamp
    const { toJSON: toJSONWithTimestamp } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        showTimestamp={true}
      />
    );
    
    const { toJSON: toJSONWithoutTimestamp } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        showTimestamp={false}
      />
    );
    
    // Component structures should be different when timestamp is enabled vs. disabled
    expect(JSON.stringify(toJSONWithTimestamp())).not.toEqual(JSON.stringify(toJSONWithoutTimestamp()));
  });

  it('applies animations when animationEnabled is true', () => {
    // This test just verifies that the component renders successfully with animations enabled or disabled
    
    // With animations enabled
    const { unmount: unmountAnimated } = render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        animationEnabled={true}
      />
    );
    unmountAnimated();
    
    // With animations disabled
    render(
      <AIPrompt
        engagement={mockConversationPrompt}
        onRespond={jest.fn()}
        onSkip={jest.fn()}
        onSuggestAnother={jest.fn()}
        animationEnabled={false}
      />
    );
    
    // If we get here without errors, the test passes
    expect(true).toBeTruthy();
  });
});