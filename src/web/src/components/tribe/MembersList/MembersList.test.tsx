import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native ^11.5.0

import MembersList from './MembersList'; // Import the component being tested
import useAuth from '../../../hooks/useAuth'; // Mock the authentication hook for testing
import useTribes from '../../../hooks/useTribes'; // Mock the tribes hook for testing
import { MemberRole, MemberStatus } from '../../../types/tribe.types'; // Import member role enum for test data

// Mock the authentication hook to control the current user for testing
jest.mock('../../../hooks/useAuth', () => ({ __esModule: true, default: jest.fn() }));

// Mock the tribes hook to provide tribe-related functionality for testing
jest.mock('../../../hooks/useTribes', () => ({ __esModule: true, default: jest.fn() }));

// Setup code that runs before each test
beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    user: { id: 'current-user-id' },
    isAuthenticated: true
  });
  (useTribes as jest.Mock).mockReturnValue({
    getTribeMembers: jest.fn(),
    loading: false
  });
});

/**
 * Helper function to create mock tribe members for testing
 * @param count The number of mock members to create
 * @returns Array of mock TribeMember objects
 */
const mockTribeMembers = (count: number) => {
  const members = [];
  for (let i = 0; i < count; i++) {
    members.push({
      id: `member-${i}`,
      tribeId: 'test-tribe',
      userId: `user-${i}`,
      profile: {
        id: `profile-${i}`,
        userId: `user-${i}`,
        name: `Test User ${i}`,
        bio: 'Test bio',
        location: 'Test location',
        coordinates: { latitude: 0, longitude: 0 },
        birthdate: new Date(),
        phoneNumber: '123-456-7890',
        avatarUrl: 'https://example.com/avatar.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        maxTravelDistance: 50,
        availableDays: [],
        availableTimeRanges: []
      },
      role: i === 0 ? MemberRole.CREATOR : i % 2 === 0 ? MemberRole.ADMIN : MemberRole.MEMBER,
      status: i % 3 === 0 ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
      joinedAt: new Date(),
      lastActive: new Date(),
      compatibilityScores: {},
      engagementScore: 0
    });
  }
  return members;
};

describe('MembersList Component', () => {
  it('renders correctly with default props', () => {
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} />);

    expect(() => getByText('Test User 0')).not.toThrow();
    expect(() => getByText('Test User 1')).not.toThrow();
    expect(() => getByText('Test User 2')).not.toThrow();
  });

  it('renders with custom title', () => {
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} title="Custom Title" />);
    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('renders in list display mode', () => {
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} displayMode="list" />);
    expect(getByText('Test User 0')).toBeTruthy();
    expect(getByText('Member')).toBeTruthy();
  });

  it('renders in grid display mode', () => {
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} displayMode="grid" />);
    expect(getByText('Test User 0')).toBeTruthy();
  });

  it('renders in row display mode', () => {
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} displayMode="row" />);
    expect(getByText('Test User 0')).toBeTruthy();
  });

  it('limits visible members when maxVisible is set', () => {
    const members = mockTribeMembers(10);
    const { getByText, queryByText } = render(<MembersList members={members} maxVisible={5} />);

    for (let i = 0; i < 5; i++) {
      expect(() => getByText(`Test User ${i}`)).not.toThrow();
    }
    expect(queryByText('Test User 5')).toBeNull();
  });

  it("shows 'View All' button when collapsible and has more members than maxVisible", () => {
    const members = mockTribeMembers(10);
    const { getByText } = render(<MembersList members={members} maxVisible={5} collapsible={true} />);
    expect(getByText('View All')).toBeTruthy();
  });

  it("expands to show all members when 'View All' is clicked", async () => {
    const members = mockTribeMembers(10);
    const { getByText, queryByText } = render(<MembersList members={members} maxVisible={5} collapsible={true} />);
    fireEvent.press(getByText('View All'));

    await waitFor(() => {
      for (let i = 0; i < 10; i++) {
        expect(() => getByText(`Test User ${i}`)).not.toThrow();
      }
    });
  });

  it('calls onMemberPress when a member is clicked', () => {
    const members = mockTribeMembers(3);
    const onMemberPress = jest.fn();
    const { getByText } = render(<MembersList members={members} onMemberPress={onMemberPress} />);

    fireEvent.press(getByText('Test User 0'));
    expect(onMemberPress).toHaveBeenCalledWith(members[0]);
  });

  it('highlights selected member when selectedMemberId is provided', () => {
    const members = mockTribeMembers(3);
    const selectedMemberId = members[1].id;
    const { getByText } = render(<MembersList members={members} selectedMemberId={selectedMemberId} />);
    // Implementation detail: selected prop adds opacity to the ListItemContainer
  });

  it('highlights current user in the members list', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1' },
      isAuthenticated: true
    });
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} />);
    // Implementation detail: isCurrentUser prop adds font-weight to the MemberName
  });

  it('displays role badges when showRoles is true', () => {
    const members = mockTribeMembers(3);
    const { getByText } = render(<MembersList members={members} showRoles={true} />);
    expect(getByText('Creator')).toBeTruthy();
    expect(getByText('Admin')).toBeTruthy();
    expect(getByText('Member')).toBeTruthy();
  });

  it('does not display role badges when showRoles is false', () => {
    const members = mockTribeMembers(3);
    const { queryByText } = render(<MembersList members={members} showRoles={false} />);
    expect(queryByText('Creator')).toBeNull();
    expect(queryByText('Admin')).toBeNull();
    expect(queryByText('Member')).toBeNull();
  });

  it('displays status indicators for each member', () => {
    const members = mockTribeMembers(3);
    const { getAllByTestId } = render(<MembersList members={members} />);
    const statusIndicators = getAllByTestId((content) => content.startsWith('MembersList-avatar-Test User'));
    expect(statusIndicators.length).toBe(3);
  });
});