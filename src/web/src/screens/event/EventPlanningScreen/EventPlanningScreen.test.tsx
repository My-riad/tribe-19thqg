import React from 'react'; // react v18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native v12.1.2
import { EventPlanningScreen } from './EventPlanningScreen'; // Import the component being tested
import EventCreationForm from '../../../components/event/EventCreationForm/EventCreationForm'; // Import the form component for mocking
import { eventApi } from '../../../api/eventApi'; // Import the event API for mocking
import useTribes from '../../../hooks/useTribes'; // Import the useTribes hook for mocking
import LoadingIndicator from '../../../components/ui/LoadingIndicator/LoadingIndicator'; // Import the loading indicator component for testing loading states
import { NavigationContainer } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack v6.0.0
import { EventTypes } from '../../../types/event.types';
import { useNavigation, useRoute } from '@react-navigation/native'; // @react-navigation/native
import { RouteProp } from '@react-navigation/native'; // @react-navigation/native

// Mock navigation hooks for testing
jest.mock('@react-navigation/native', () => ({ // @react-navigation/native
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

// Mock useTribes hook for testing
jest.mock('../../../hooks/useTribes', () => jest.fn());

// Mock event API for testing
jest.mock('../../../api/eventApi', () => ({
  eventApi: {
    getEvent: jest.fn(),
  },
}));

// Mock data for testing
const mockTribe = { // Mock tribe data for testing
  id: 'tribe-123',
  name: 'Test Tribe',
  description: 'A test tribe for unit testing',
  members: [],
  createdAt: '2023-06-15T10:00:00Z',
  createdBy: 'user-123',
};

const mockEvent = { // Mock event data for testing
  id: 'event-123',
  name: 'Test Event',
  description: 'A test event for unit testing',
  eventType: EventTypes.EventType.OUTDOOR_ACTIVITY,
  location: 'Test Location',
  coordinates: { latitude: 47.6062, longitude: -122.3321 },
  startTime: '2023-07-15T10:00:00Z',
  endTime: '2023-07-15T12:00:00Z',
  tribeId: 'tribe-123',
  createdBy: 'user-123',
  status: 'SCHEDULED',
} as EventTypes.Event;

/**
 * Creates a mock navigation object for testing
 * @returns Mock navigation object with navigate, goBack, and setOptions methods
 */
const mockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
});

/**
 * Creates a mock route object for testing
 * @param params 
 * @returns Mock route object with params property
 */
const mockRoute = (params: any) => ({
  params: params,
});

/**
 * Sets up navigation mocks for testing
 */
const setupNavigationMocks = () => {
  (useNavigation as jest.Mock).mockReturnValue(mockNavigation());
  (useRoute as jest.Mock).mockReturnValue(mockRoute({}));
};

/**
 * Sets up useTribes hook mock for testing
 * @param mockReturnValue 
 */
const setupTribesMock = (mockReturnValue: any) => {
  (useTribes as jest.Mock).mockReturnValue(mockReturnValue);
};

/**
 * Sets up eventApi mock for testing
 * @param mockEvent 
 */
const setupEventApiMock = (mockEvent: any) => {
  (eventApi.getEvent as jest.Mock).mockResolvedValue(mockEvent ? { success: true, data: mockEvent } : { success: true, data: {} });
};

/**
 * Renders the component with navigation context for testing
 * @param routeParams 
 * @returns Rendered component with testing utilities
 */
const renderWithNavigation = (routeParams: any) => {
  const Stack = createStackNavigator();

  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="EventPlanning" component={() => <EventPlanningScreen />} initialParams={routeParams} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('EventPlanningScreen', () => {
  it('renders correctly for creating a new event', () => {
    setupNavigationMocks();
    setupTribesMock({ tribes: [mockTribe], userTribes: [mockTribe.id] });

    const { getByTestId } = renderWithNavigation({ tribeId: mockTribe.id });

    expect(getByTestId('event-creation-form')).toBeTruthy();
    expect((useNavigation as jest.Mock).mock.results[0].value.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Create Event',
      })
    );
  });

  it('renders correctly for editing an existing event', () => {
    setupNavigationMocks();
    setupTribesMock({ tribes: [mockTribe], userTribes: [mockTribe.id] });
    setupEventApiMock(mockEvent);

    const { getByTestId } = renderWithNavigation({ tribeId: mockTribe.id, eventId: mockEvent.id });

    expect(getByTestId('event-creation-form')).toBeTruthy();
    expect((useNavigation as jest.Mock).mock.results[0].value.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Edit Event',
      })
    );
  });

  it('shows loading indicator while fetching event data', async () => {
    setupNavigationMocks();
    setupTribesMock({ tribes: [mockTribe], userTribes: [mockTribe.id] });
    setupEventApiMock(new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockEvent }), 500)));

    const { getByTestId } = renderWithNavigation({ tribeId: mockTribe.id, eventId: mockEvent.id });

    expect(getByTestId('loading-indicator')).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId('event-creation-form')).toBeTruthy();
    });
  });

  it('shows error message when event fetch fails', async () => {
    setupNavigationMocks();
    setupTribesMock({ tribes: [mockTribe], userTribes: [mockTribe.id] });
    (eventApi.getEvent as jest.Mock).mockRejectedValue(new Error('Failed to fetch event'));

    const { findByText } = renderWithNavigation({ tribeId: mockTribe.id, eventId: mockEvent.id });

    const errorMessage = await findByText('Error: Failed to fetch event');
    expect(errorMessage).toBeTruthy();
  });

  it('navigates back on successful event creation', () => {
    setupNavigationMocks();
    setupTribesMock({ tribes: [mockTribe], userTribes: [mockTribe.id] });

    const { getByTestId } = renderWithNavigation({ tribeId: mockTribe.id });
    const eventCreationForm = getByTestId('event-creation-form');

    const onSuccess = (eventCreationForm as any).props.onSuccess;
    onSuccess({});

    expect((useNavigation as jest.Mock).mock.results[0].value.goBack).toHaveBeenCalled();
  });

  it('navigates back on cancel', () => {
    setupNavigationMocks();
    setupTribesMock({ tribes: [mockTribe], userTribes: [mockTribe.id] });

    const { getByTestId } = renderWithNavigation({ tribeId: mockTribe.id });
    const eventCreationForm = getByTestId('event-creation-form');

    const onCancel = (eventCreationForm as any).props.onCancel;
    onCancel();

    expect((useNavigation as jest.Mock).mock.results[0].value.goBack).toHaveBeenCalled();
  });
});