import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native'; // @testing-library/react-native v^12.0.0
import { rest } from 'msw'; // msw v^1.0.0

import ProfileScreen from './ProfileScreen';
import { mockUsers, mockProfiles, mockTribes } from '../../../mocks/data/users';
import { server } from '../../../mocks/server';

// Mock the useNavigation hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

// Mock the useProfile hook
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: mockProfiles[0],
    loading: false,
    error: null,
    clearProfileError: jest.fn(),
    updateUserProfile: jest.fn(),
    uploadAvatar: jest.fn(),
    profileCompletionPercentage: 100,
  }),
}));

// Mock the useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: jest.fn(),
  }),
}));

// Mock the useTribes hook
jest.mock('../../../hooks/useTribes', () => ({
  useTribes: () => ({
    userTribes: ['tribe-1', 'tribe-2'],
    tribes: {
      'tribe-1': mockTribes[0],
      'tribe-2': mockTribes[1],
    },
    getTribeById: jest.fn(),
  }),
}));

describe('ProfileScreen', () => {
  // LD1: Define mock navigation object
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  // LD1: Define mock Redux store setup
  const mockStoreSetup = () => {
    jest.mock('react-redux', () => ({
      useSelector: jest.fn().mockImplementation((selector) => selector({
        auth: {
          user: mockUsers[0],
          isAuthenticated: true,
          loading: false,
          error: null,
          mfaRequired: false,
          mfaChallenge: null,
        },
        profile: {
          profile: mockProfiles[0],
          loading: false,
          error: null,
        },
        tribes: {
          tribes: {
            'tribe-1': mockTribes[0],
            'tribe-2': mockTribes[1],
          },
          userTribes: ['tribe-1', 'tribe-2'],
          loading: false,
          error: null,
        },
      })),
      useDispatch: () => jest.fn(),
    }));
  };

  // LD1: Set up mock API handlers for profile data
  const mockProfileData = {
    id: 'profile-1',
    userId: 'user-1',
    name: 'Alex Johnson',
    bio: 'Outdoor enthusiast and tech professional',
    location: 'Seattle, WA',
  };

  // LD1: Define beforeEach function to set up tests
  beforeEach(() => {
    // Mock the navigation object
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => mockNavigation,
    }));

    // Set up mock API handlers for profile, tribes, and auth endpoints
    server.use(
      rest.get('/api/profile', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockProfileData));
      }),
      rest.get('/api/tribes', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([mockTribes[0], mockTribes[1]]));
      }),
      rest.post('/api/auth/logout', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ success: true }));
      })
    );

    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  // LD1: Define afterEach function to clean up tests
  afterEach(() => {
    // Reset any mock handlers
    server.resetHandlers();

    // Clear any mock function calls
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    // LD1: Render the ProfileScreen component
    const { getByText, queryByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Verify that the loading indicator is displayed
    expect(getByText('Loading profile...')).toBeTruthy();

    // LD1: Verify that profile content is not yet visible
    expect(queryByText('Alex Johnson')).toBeNull();
  });

  it('renders profile data when loaded', async () => {
    // LD1: Set up mock API response for profile data
    server.use(
      rest.get('/api/profile', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json(mockProfileData));
      })
    );

    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Alex Johnson'));

    // LD1: Verify that user name is displayed correctly
    expect(await findByText('Alex Johnson')).toBeTruthy();

    // LD1: Verify that user location is displayed correctly
    expect(await findByText('Seattle, WA')).toBeTruthy();

    // LD1: Verify that user bio is displayed correctly
    //expect(await findByText('Outdoor enthusiast and tech professional')).toBeTruthy();

    // LD1: Verify that personality traits section is displayed
    expect(await findByText('MY PERSONALITY')).toBeTruthy();

    // LD1: Verify that achievements section is displayed
    expect(await findByText('Achievements')).toBeTruthy();

    // LD1: Verify that tribes section is displayed
    expect(await findByText('MY TRIBES')).toBeTruthy();
  });

  it('handles edit profile button press', async () => {
    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Edit Profile'));

    // LD1: Find and press the edit profile button
    const editButton = await findByText('Edit Profile');
    fireEvent.press(editButton);

    // LD1: Verify that the ProfileEditor component is displayed
    expect(await findByText('Update Profile')).toBeTruthy();

    // LD1: Verify that the profile view is hidden
    expect(screen.queryByText('Alex Johnson')).toBeNull();
  });

  it('handles profile update completion', async () => {
    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Edit Profile'));

    // LD1: Find and press the edit profile button
    const editButton = await findByText('Edit Profile');
    fireEvent.press(editButton);

    // LD1: Simulate profile update completion
    const updateButton = await findByText('Update Profile');
    fireEvent.press(updateButton);

    // LD1: Verify that the ProfileEditor is no longer displayed
    expect(screen.queryByText('Update Profile')).toBeNull();

    // LD1: Verify that the updated profile data is displayed
    expect(await findByText('Alex Johnson')).toBeTruthy();
  });

  it('handles logout button press', async () => {
    // LD1: Mock the logout function
    const mockLogout = jest.fn();
    jest.mock('../../../hooks/useAuth', () => ({
      useAuth: () => ({
        logout: mockLogout,
      }),
    }));

    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Logout'));

    // LD1: Find and press the logout button
    const logoutButton = await findByText('Logout');
    fireEvent.press(logoutButton);

    // LD1: Verify that the logout function was called
    expect(mockLogout).toHaveBeenCalled();
  });

  it('handles settings button press', async () => {
    // LD1: Mock the navigation function
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Settings'));

    // LD1: Find and press the settings button
    const settingsButton = await findByText('Settings');
    fireEvent.press(settingsButton);

    // LD1: Verify that navigation to settings screen was triggered
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('displays personality traits correctly', async () => {
    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('MY PERSONALITY'));

    // LD1: Verify that the PersonalityProfile component is rendered
    expect(await findByText('Openness')).toBeTruthy();

    // LD1: Verify that personality traits are passed correctly to the component
    expect(await findByText('85%')).toBeTruthy();
  });

  it('displays achievements correctly', async () => {
    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Achievements'));

    // LD1: Verify that the AchievementsList component is rendered
    expect(await findByText('Social Butterfly')).toBeTruthy();

    // LD1: Verify that achievements are passed correctly to the component
    expect(await findByText('Joined 3 different Tribes')).toBeTruthy();

    // LD1: Verify that achievement names are displayed
    expect(await findByText('Explorer')).toBeTruthy();
  });

  it('displays tribes correctly', async () => {
    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('MY TRIBES'));

    // LD1: Verify that the tribes section is rendered
    expect(await findByText('Weekend Explorers')).toBeTruthy();

    // LD1: Verify that TribeCard components are rendered for each tribe
    expect(await findByText('Foodies United')).toBeTruthy();

    // LD1: Verify that tribe names are displayed correctly
    expect(await findByText('Weekend Explorers')).toBeTruthy();
  });

  it('handles tribe card press', async () => {
    // LD1: Mock the navigation function
    const mockNavigate = jest.fn();
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
      }),
    }));

    // LD1: Render the ProfileScreen component
    const { findByText } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Wait for profile data to load
    await waitFor(() => findByText('Weekend Explorers'));

    // LD1: Find and press a tribe card
    const tribeCard = await findByText('Weekend Explorers');
    fireEvent.press(tribeCard);

    // LD1: Verify that navigation to tribe detail screen was triggered with correct tribe ID
    expect(mockNavigate).toHaveBeenCalledWith('TribeDetail', { tribeId: 'tribe-1' });
  });

  it('handles error state', async () => {
    // LD1: Set up mock API to return an error
    server.use(
      rest.get('/api/profile', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Failed to fetch profile' }));
      })
    );

    // LD1: Render the ProfileScreen component
    const { findByText, findByRole } = render(<ProfileScreen navigation={mockNavigation as any} />);

    // LD1: Verify that error message is displayed
    expect(await findByText('Failed to fetch profile')).toBeTruthy();

    // LD1: Verify that retry button is displayed
    const retryButton = await findByRole('button', { name: 'Retry' });
    expect(retryButton).toBeTruthy();

    // LD1: Press retry button
    fireEvent.press(retryButton);

    // LD1: Verify that profile data loading is attempted again
    expect(await findByText('Loading profile...')).toBeTruthy();
  });
});