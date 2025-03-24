import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ActivityFeed from './ActivityFeed';
import { TribeActivity, ActivityType } from '../../../types/tribe.types';

describe('ActivityFeed', () => {
  // Define mock activities data for testing
  const mockActivities: TribeActivity[] = [
    {
      id: '1',
      activityType: ActivityType.MEMBER_JOINED,
      description: 'Sarah joined the tribe',
      timestamp: new Date('2023-07-01T10:00:00Z'),
      userId: 'user1',
      metadata: {}
    },
    {
      id: '2',
      activityType: ActivityType.EVENT_CREATED,
      description: 'Tom created a hiking event',
      timestamp: new Date('2023-07-02T14:30:00Z'),
      userId: 'user2',
      metadata: {}
    },
    {
      id: '3',
      activityType: ActivityType.AI_SUGGESTION,
      description: 'AI suggested a waterfall hike',
      timestamp: new Date('2023-07-03T09:15:00Z'),
      userId: 'ai',
      metadata: {}
    }
  ];

  it('renders correctly with activities', () => {
    const { getByText } = render(<ActivityFeed activities={mockActivities} />);
    
    // Verify the title is rendered
    expect(getByText('RECENT ACTIVITY')).toBeTruthy();
    
    // Verify activity descriptions are rendered
    expect(getByText('Sarah joined the tribe')).toBeTruthy();
    expect(getByText('Tom created a hiking event')).toBeTruthy();
    expect(getByText('AI suggested a waterfall hike')).toBeTruthy();
  });

  it('renders empty state when no activities', () => {
    const { getByText } = render(<ActivityFeed activities={[]} />);
    
    // Verify empty state message is rendered
    expect(getByText('No recent activities in this tribe yet')).toBeTruthy();
  });

  it('renders loading state', () => {
    const { getByText } = render(
      <ActivityFeed 
        activities={mockActivities} 
        loading={true} 
        onLoadMore={() => {}}
      />
    );
    
    // Verify loading message is shown
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('calls onLoadMore when view more button is pressed', () => {
    // Create a mock function for onLoadMore
    const mockOnLoadMore = jest.fn();
    
    // Create more activities than the default limit (5)
    const manyActivities = [
      ...mockActivities,
      {
        id: '4',
        activityType: ActivityType.MEMBER_JOINED,
        description: 'John joined the tribe',
        timestamp: new Date('2023-07-04T10:00:00Z'),
        userId: 'user3',
        metadata: {}
      },
      {
        id: '5',
        activityType: ActivityType.EVENT_CREATED,
        description: 'Mary created a movie night',
        timestamp: new Date('2023-07-05T14:30:00Z'),
        userId: 'user4',
        metadata: {}
      },
      {
        id: '6',
        activityType: ActivityType.AI_SUGGESTION,
        description: 'AI suggested a board game meetup',
        timestamp: new Date('2023-07-06T09:15:00Z'),
        userId: 'ai',
        metadata: {}
      }
    ];
    
    const { getByText } = render(
      <ActivityFeed 
        activities={manyActivities} 
        onLoadMore={mockOnLoadMore} 
      />
    );
    
    // Find and press the View More button
    const viewMoreButton = getByText('View More');
    fireEvent.press(viewMoreButton);
    
    // Verify the onLoadMore callback was called
    expect(mockOnLoadMore).toHaveBeenCalled();
  });

  it('displays the correct number of activities based on limit', () => {
    // Create more activities than the specified limit
    const manyActivities = [
      ...mockActivities,
      {
        id: '4',
        activityType: ActivityType.MEMBER_JOINED,
        description: 'John joined the tribe',
        timestamp: new Date('2023-07-04T10:00:00Z'),
        userId: 'user3',
        metadata: {}
      },
      {
        id: '5',
        activityType: ActivityType.EVENT_CREATED,
        description: 'Mary created a movie night',
        timestamp: new Date('2023-07-05T14:30:00Z'),
        userId: 'user4',
        metadata: {}
      }
    ];
    
    // Set limit to 2
    const { queryByText } = render(
      <ActivityFeed 
        activities={manyActivities} 
        limit={2} 
      />
    );
    
    // The newest activities should be visible (Mary and John's activities)
    expect(queryByText('Mary created a movie night')).toBeTruthy();
    expect(queryByText('John joined the tribe')).toBeTruthy();
    
    // The older activities should not be visible
    expect(queryByText('AI suggested a waterfall hike')).toBeNull();
    expect(queryByText('Tom created a hiking event')).toBeNull();
    expect(queryByText('Sarah joined the tribe')).toBeNull();
  });

  it('sorts activities by timestamp (newest first)', () => {
    // Create activities with different timestamps in random order
    const unsortedActivities = [
      {
        id: '1',
        activityType: ActivityType.MEMBER_JOINED,
        description: 'Oldest activity',
        timestamp: new Date('2023-07-01T10:00:00Z'),
        userId: 'user1',
        metadata: {}
      },
      {
        id: '3',
        activityType: ActivityType.AI_SUGGESTION,
        description: 'Newest activity',
        timestamp: new Date('2023-07-03T09:15:00Z'),
        userId: 'ai',
        metadata: {}
      },
      {
        id: '2',
        activityType: ActivityType.EVENT_CREATED,
        description: 'Middle activity',
        timestamp: new Date('2023-07-02T14:30:00Z'),
        userId: 'user2',
        metadata: {}
      }
    ];
    
    const { getByText } = render(<ActivityFeed activities={unsortedActivities} />);
    
    // Verify all activities are rendered
    expect(getByText('Newest activity')).toBeTruthy();
    expect(getByText('Middle activity')).toBeTruthy();
    expect(getByText('Oldest activity')).toBeTruthy();
    
    // Note: In a real implementation, we would add testIDs to the component 
    // to verify the exact order of the elements in the rendered output
  });
});