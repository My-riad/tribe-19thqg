import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v^11.5.0
import { act } from 'react-test-renderer'; // react-test-renderer v^18.2.0
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v^1.9.5
import InterestSelection from './InterestSelection';
import { updateInterests } from '../../../store/thunks/profileThunks';
import { InterestCategory, Interest } from '../../../types/profile.types';
import { profileReducer, profileActions } from '../../../store/slices/profileSlice';

// Mock Redux store for testing
const mockStore = configureStore({
  reducer: {
    profile: profileReducer,
  },
});

// Mock interest data for testing
const mockInterests: Interest[] = [
  { id: '1', profileId: 'user1', category: InterestCategory.OUTDOOR_ADVENTURES, name: 'Hiking', level: 5 },
  { id: '2', profileId: 'user1', category: InterestCategory.FOOD_DINING, name: 'Restaurants', level: 5 },
];

// Mock implementation of the updateInterests thunk
const mockUpdateInterests = jest.fn();

// Mock callback function for testing onComplete prop
const mockOnComplete = jest.fn();

// Helper function to render a component with Redux store
const renderWithRedux = (
  component: React.ReactElement,
  initialState?: object
) => {
  const store = configureStore({
    reducer: {
      profile: profileReducer,
    },
    preloadedState: {
      profile: {
        ...profileReducer(undefined, { type: '' }), // Ensure default state is included
        ...initialState,
      },
    },
  });

  return {
    ...render(
      component
    ),
    store,
  };
};

describe('InterestSelection component', () => {
  it('renders correctly with default props', () => {
    const { getByText, getByTestId } = renderWithRedux(<InterestSelection />);
    expect(getByText('Select Your Interests')).toBeTruthy();
    expect(getByText('Choose activities that resonate with you to connect with like-minded people.')).toBeTruthy();
    expect(getByTestId('submit-interests-button')).toBeDisabled();
  });

  it('allows selecting and deselecting interests', () => {
    const { getByText } = renderWithRedux(<InterestSelection />);
    const hikingInterest = getByText('Hiking');

    fireEvent.press(hikingInterest);
    expect(hikingInterest).toBeTruthy();

    fireEvent.press(hikingInterest);
    expect(hikingInterest).toBeTruthy();
  });

  it('enables submit button when minimum interests are selected', () => {
    const { getByText, getByTestId } = renderWithRedux(<InterestSelection minRequired={2} />);
    const hikingInterest = getByText('Hiking');
    const campingInterest = getByText('Camping');
    const submitButton = getByTestId('submit-interests-button');

    expect(submitButton).toBeDisabled();

    fireEvent.press(hikingInterest);
    fireEvent.press(campingInterest);

    expect(submitButton).not.toBeDisabled();
  });

  it('limits selection to maximum allowed interests', () => {
    const { getByText } = renderWithRedux(<InterestSelection maxAllowed={3} />);
    const hikingInterest = getByText('Hiking');
    const campingInterest = getByText('Camping');
    const kayakingInterest = getByText('Kayaking');
    const rockClimbingInterest = getByText('Rock Climbing');

    fireEvent.press(hikingInterest);
    fireEvent.press(campingInterest);
    fireEvent.press(kayakingInterest);
    fireEvent.press(rockClimbingInterest);

    expect(rockClimbingInterest).toBeTruthy();
  });

  it('displays selected count correctly', () => {
    const { getByText } = renderWithRedux(<InterestSelection />);
    const hikingInterest = getByText('Hiking');
    const campingInterest = getByText('Camping');

    expect(getByText('0 / 10 selected')).toBeTruthy();

    fireEvent.press(hikingInterest);
    fireEvent.press(campingInterest);

    expect(getByText('2 / 10 selected')).toBeTruthy();
  });

  it('dispatches updateInterests when submitting', async () => {
    const { getByText, getByTestId, store } = renderWithRedux(<InterestSelection minRequired={1} />, {
      interests: [],
    });

    const dispatch = jest.spyOn(store, 'dispatch');
    const hikingInterest = getByText('Hiking');
    fireEvent.press(hikingInterest);

    const submitButton = getByTestId('submit-interests-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onComplete callback after successful submission', async () => {
    const mockOnComplete = jest.fn();
    const { getByText, getByTestId, store } = renderWithRedux(
      <InterestSelection minRequired={1} onComplete={mockOnComplete} />, {
        interests: [],
      }
    );

    const dispatch = jest.spyOn(store, 'dispatch');
    const hikingInterest = getByText('Hiking');
    fireEvent.press(hikingInterest);

    const submitButton = getByTestId('submit-interests-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(0);
    });
  });

  it('shows loading indicator during submission', () => {
    const { getByTestId } = renderWithRedux(<InterestSelection minRequired={1} />, {
      loading: true,
    });
    const submitButton = getByTestId('submit-interests-button');
    expect(submitButton).toBeDisabled();
  });

  it('initializes with existing interests from Redux state', () => {
    const { getByText } = renderWithRedux(<InterestSelection />, {
      interests: mockInterests,
    });

    expect(getByText('Hiking')).toBeTruthy();
    expect(getByText('Restaurants')).toBeTruthy();
  });
});