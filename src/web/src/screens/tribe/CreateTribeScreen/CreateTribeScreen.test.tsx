import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'; // @testing-library/react-native v^12.1.2
import { CreateTribeScreen } from './CreateTribeScreen';
import { ROUTES } from '../../../constants/navigationRoutes';
import { tribeActions } from '../../../store/slices/tribeSlice';
import { Provider } from 'react-redux'; // react-redux v^8.1.1
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v^1.9.5
import { TribeCreationForm } from '../../../components/tribe/TribeCreationForm';
import { NavigationProp } from '@react-navigation/native';

// Mock React Navigation hooks and components
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));

// Mock the TribeCreationForm component
jest.mock('../../../components/tribe/TribeCreationForm', () => {
  const MockTribeCreationForm = ({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) => {
    (MockTribeCreationForm as any).handleSuccess = onSuccess;
    (MockTribeCreationForm as any).handleCancel = onCancel;
    return <mock-tribe-creation-form />;
  };
  return {
    __esModule: true,
    default: MockTribeCreationForm,
  };
});

// Mock useDispatch hook to return a jest.fn() for tracking dispatched actions
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

describe('CreateTribeScreen', () => {
  let mockStore: any;
  let mockNavigation: { goBack: jest.Mock; navigate: jest.Mock };
  let dispatchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock navigation object
    mockNavigation = {
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    // Set up mock Redux store with initial state
    mockStore = configureStore({
      reducer: (state: any = { tribe: { tribeCreationStatus: 'IDLE', error: null, loading: false } }) => state,
    });

    dispatchMock = jest.fn();
    (require('react-redux').useDispatch as jest.Mock).mockReturnValue(dispatchMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // Render the CreateTribeScreen component with mock store
    const { getByText, getByTestId } = render(
      <Provider store={mockStore}>
        <CreateTribeScreen />
      </Provider>
    );

    // Verify the screen title is displayed
    expect(getByText('Create a Tribe')).toBeTruthy();

    // Verify the back button is displayed
    expect(getByTestId('arrow-back')).toBeTruthy();

    // Verify the TribeCreationForm component is rendered
    expect(screen.getByType(TribeCreationForm)).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    // Render the CreateTribeScreen component with mock store
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <CreateTribeScreen />
      </Provider>
    );

    // Find the back button
    const backButton = getByTestId('arrow-back');

    // Fire press event on the back button
    fireEvent.press(backButton);

    // Verify navigation.goBack was called
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('calls handleSuccess when form submission is successful', async () => {
    // Set up mock store with successful tribe creation status
    mockStore = configureStore({
      reducer: (state: any = { tribe: { tribeCreationStatus: 'SUCCESS', error: null, loading: false } }) => state,
    });

    // Render the CreateTribeScreen component with mock store
    render(
      <Provider store={mockStore}>
        <CreateTribeScreen />
      </Provider>
    );

    // Simulate successful form submission by calling the onSuccess prop of TribeCreationForm
    (TribeCreationForm as any).handleSuccess();

    // Verify navigation to discovery screen
    expect(mockNavigation.navigate).toHaveBeenCalledWith(ROUTES.MAIN.DISCOVER);
  });

  it('calls handleCancel when form is cancelled', () => {
    // Render the CreateTribeScreen component with mock store
    render(
      <Provider store={mockStore}>
        <CreateTribeScreen />
      </Provider>
    );

    // Simulate form cancellation by calling the onCancel prop of TribeCreationForm
    (TribeCreationForm as any).handleCancel();

    // Verify navigation.goBack was called
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('resets tribe creation status on unmount', () => {
    // Render the CreateTribeScreen component with mock store
    const { unmount } = render(
      <Provider store={mockStore}>
        <CreateTribeScreen />
      </Provider>
    );

    // Unmount the component
    unmount();

    // Verify resetTribeCreationStatus action was dispatched
    expect(dispatchMock).toHaveBeenCalledWith(tribeActions.resetTribeCreationStatus());
  });
});