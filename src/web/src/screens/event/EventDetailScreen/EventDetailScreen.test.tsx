import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { NavigationContainer } from '@react-navigation/native'; // @react-navigation/native ^6.0.0
import { createStackNavigator } from '@react-navigation/stack'; // @react-navigation/stack ^6.0.0
import { EventDetailScreen } from './EventDetailScreen'; // Import the component being tested
import EventDetails from '../../../components/event/EventDetails';
import { mockEvent, mockAttendees } from '../../../mocks/data/events';
import { store } from '../../../store/store';
import { eventActions } from '../../../store/slices/eventSlice';
import { fetchEventById, getEventAttendees } from '../../../store/thunks/eventThunks';
import { jest } from '@jest/globals'; // jest ^29.2.1

// Mock navigation object for testing navigation interactions
const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Mock route object with event ID parameter
const route = { params: { eventId: 'event-123' } };

// Mock Redux dispatch function for testing action dispatches
const dispatch = jest.fn();

// Mock EventDetails component to verify props passed to it
jest.mock('../../../components/event/EventDetails', () => {
  const MockEventDetails = jest.fn(() => null);
  return {
    __esModule: true,
    default: MockEventDetails,
  };
});

// Helper function to render the EventDetailScreen with necessary providers and mocks
const setup = (props = {}) => {
  // Create a mock navigation stack with EventDetailScreen
  const Stack = createStackNavigator();
  const TestStack = () => (
    <Stack.Navigator>
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );

  // Set up route params with eventId
  const initialRouteName = 'EventDetail';
  const screenOptions = { route: { params: { eventId: 'event-123' } } };

  // Render the component with Redux Provider and NavigationContainer
  const renderResult = render(
    <Provider store={store}>
      <NavigationContainer>
        <TestStack />
      </NavigationContainer>
    </Provider>
  );

  // Return the rendered component utilities
  return {
    ...renderResult,
  };
};

describe('EventDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    // Dispatch setLoading(true) to set loading state
    store.dispatch(eventActions.setLoading(true));

    // Render the EventDetailScreen component
    setup();

    // Verify that the loading indicator is displayed
    expect(screen.getByTestId('loading-indicator')).toBeDefined();
  });

  it('renders error state correctly', () => {
    // Dispatch setLoading(false) to clear loading state
    store.dispatch(eventActions.setLoading(false));

    // Dispatch setError('Error loading event') to set error state
    store.dispatch(eventActions.setError('Error loading event'));

    // Render the EventDetailScreen component
    setup();

    // Verify that the error message is displayed
    expect(screen.getByText('Error loading event')).toBeDefined();
  });

  it('renders event details correctly', () => {
    // Dispatch setCurrentEvent(mockEvent) to set current event
    store.dispatch(eventActions.setCurrentEvent(mockEvent));

    // Dispatch setEventAttendees(mockAttendees) to set attendees
    store.dispatch(eventActions.setEventAttendees(mockAttendees));

    // Render the EventDetailScreen component
    setup();

    // Verify that the EventDetails component is rendered with correct props
    expect(EventDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-123',
        isOrganizer: false,
        onBack: expect.any(Function),
        onChatPress: expect.any(Function),
      }),
      expect.anything()
    );
  });

  it('fetches event data on mount', () => {
    // Mock the dispatch function
    const dispatchMock = jest.spyOn(store, 'dispatch');

    // Render the EventDetailScreen component
    setup();

    // Verify that fetchEventById and getEventAttendees were dispatched with correct parameters
    expect(dispatchMock).toHaveBeenCalledWith(fetchEventById('event-123'));
    expect(dispatchMock).toHaveBeenCalledWith(getEventAttendees({ eventId: 'event-123' }));
  });

  it('updates header title with event name', () => {
    // Mock the navigation.setOptions function
    const setOptionsMock = jest.fn();
    navigation.setOptions = setOptionsMock;

    // Dispatch setCurrentEvent(mockEvent) to set current event
    store.dispatch(eventActions.setCurrentEvent(mockEvent));

    // Render the EventDetailScreen component
    setup();

    // Verify that navigation.setOptions was called with the event name in the title
    expect(setOptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headerTitle: mockEvent.name,
      })
    );
  });
});