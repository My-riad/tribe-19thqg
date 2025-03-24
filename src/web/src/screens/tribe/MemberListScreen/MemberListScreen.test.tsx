import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0
import { MemberListScreen } from '../MemberListScreen';
import MembersList from '../../../components/tribe/MembersList';
import useTribes from '../../../hooks/useTribes';
import useAuth from '../../../hooks/useAuth';
import { TribeMember, MemberRole, MemberStatus } from '../../../types/tribe.types';
import { NavigationContainer } from '@react-navigation/native'; // @react-navigation/native ^6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0
import 'jest'; // jest ^29.2.1

// Mock the useTribes and useAuth hooks for testing
jest.mock('../../../hooks/useTribes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
    useRoute: () => ({
      params: { tribeId: 'testTribeId' },
    }),
  };
});

/**
 * Helper function to create mock tribe members for testing
 * @param count The number of mock members to create
 * @returns An array of mock TribeMember objects
 */
const createMockMembers = (count: number): TribeMember[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `member-${i + 1}`,
    tribeId: 'testTribeId',
    userId: `user-${i + 1}`,
    profile: {
      id: `profile-${i + 1}`,
      userId: `user-${i + 1}`,
      name: `Test User ${i + 1}`,
      bio: 'Test bio',
      location: 'Test location',
      coordinates: { latitude: 0, longitude: 0 },
      birthdate: new Date(),
      phoneNumber: '123-456-7890',
      avatarUrl: 'http://example.com/avatar.jpg',
      coverImageUrl: 'http://example.com/cover.jpg',
      personalityTraits: [],
      interests: [],
      preferences: [],
      achievements: [],
      lastUpdated: new Date(),
      completionPercentage: 100,
      maxTravelDistance: 50,
      availableDays: [],
      availableTimeRanges: [],
    },
    role: i % 2 === 0 ? MemberRole.ADMIN : MemberRole.MEMBER,
    status: MemberStatus.ACTIVE,
    joinedAt: new Date(),
    lastActive: new Date(),
    compatibilityScores: {},
    engagementScore: 0,
  }));
};

/**
 * Helper function to set up the test component with navigation
 * @param props Additional props to pass to the MemberListScreen component
 * @returns Rendered component with testing utilities
 */
const setupTestComponent = (props = {}) => {
  const Stack = createStackNavigator();

  const TestComponent = () => (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MemberListScreen">
          {() => <MemberListScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );

  return render(<TestComponent />);
};

describe('MemberListScreen', () => {
  let mockMembers: TribeMember[];
  let mockUseTribes: jest.Mock;
  let mockUseAuth: jest.Mock;

  beforeEach(() => {
    mockMembers = createMockMembers(5);

    mockUseTribes = useTribes as jest.Mock;
    mockUseAuth = useAuth as jest.Mock;

    mockUseTribes.mockReturnValue({
      tribes: [],
      getTribeMembers: jest.fn().mockResolvedValue({ items: mockMembers }),
      getTribeById: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: { id: 'testUserId' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with members', async () => {
    const { getByText, getByPlaceholderText } = setupTestComponent();

    await waitFor(() => {
      expect(getByText('Members')).toBeDefined();
      expect(getByPlaceholderText('Search members...')).toBeDefined();
      expect(getByText('All')).toBeDefined();
      expect(getByText('Admins')).toBeDefined();
      expect(getByText('Members')).toBeDefined();
      expect(screen.getByTestId('members-list')).toBeDefined();
    });
  });

  it('shows loading indicator when fetching members', () => {
    mockUseTribes.mockReturnValue({
      tribes: [],
      getTribeMembers: jest.fn().mockResolvedValue(null),
      getTribeById: jest.fn(),
    });

    const { getByTestId } = setupTestComponent();

    expect(getByTestId('loading-indicator')).toBeDefined();
  });

  it('shows empty state when no members match filters', async () => {
    mockUseTribes.mockReturnValue({
      tribes: [],
      getTribeMembers: jest.fn().mockResolvedValue({ items: [] }),
      getTribeById: jest.fn(),
    });

    const { getByText } = setupTestComponent();

    await waitFor(() => {
      expect(getByText('No members match the current filters.')).toBeDefined();
    });
  });

  it('filters members based on search query', async () => {
    const { getByPlaceholderText } = setupTestComponent();

    const searchInput = getByPlaceholderText('Search members...');
    fireEvent.changeText(searchInput, 'Test User 1');

    await waitFor(() => {
      expect(screen.getAllByTestId(/members-list-member-item-/).length).toBe(1);
    });
  });

  it('filters members based on selected role', async () => {
    const { getByText } = setupTestComponent();

    fireEvent.press(getByText('Admins'));

    await waitFor(() => {
      expect(screen.getAllByTestId(/members-list-member-item-/).length).toBe(3);
    });
  });

  it('calls navigation when a member is selected', async () => {
    const mockNavigation = { navigate: jest.fn() };
    (useTribes as jest.Mock).mockReturnValue({
      tribes: [],
      getTribeMembers: jest.fn().mockResolvedValue({ items: mockMembers }),
      getTribeById: jest.fn(),
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'testUserId' },
    });
    (require('@react-navigation/native').useNavigation as jest.Mock).mockReturnValue(mockNavigation);

    setupTestComponent();

    await waitFor(() => {
      fireEvent.press(screen.getAllByTestId(/members-list-member-item-/)[0]);
      expect(mockNavigation.navigate).toHaveBeenCalled();
    });
  });

  it('fetches tribe members on mount', () => {
    const getTribeMembersMock = jest.fn().mockResolvedValue({ items: mockMembers });
    (useTribes as jest.Mock).mockReturnValue({
      tribes: [],
      getTribeMembers: getTribeMembersMock,
      getTribeById: jest.fn(),
    });

    setupTestComponent();

    expect(getTribeMembersMock).toHaveBeenCalledWith('testTribeId');
  });
});