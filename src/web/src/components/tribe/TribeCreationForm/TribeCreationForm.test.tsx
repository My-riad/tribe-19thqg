import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v^12.1.2
import { act } from 'react-test-renderer'; // react-test-renderer v^18.2.0
import TribeCreationForm from './TribeCreationForm';
import { Provider } from 'react-redux'; // react-redux v^8.1.0
import { configureStore } from '@reduxjs/toolkit'; // @reduxjs/toolkit v^1.9.5
import { createTribe } from '../../../store/thunks/tribeThunks';
import { tribeActions } from '../../../store/slices/tribeSlice';
import { mediaService } from '../../../services/mediaService';
import { locationService } from '../../../services/locationService';
import { TribePrivacy } from '../../../types/tribe.types';

// Mock the mediaService module
jest.mock('../../../services/mediaService', () => ({
  mediaService: {
    pickImage: jest.fn(() => Promise.resolve({ uri: 'mockedImageUri', width: 200, height: 200 })),
    uploadTribeImage: jest.fn(() => Promise.resolve({ success: true, mediaUrl: 'mockedUploadedImageUrl' })),
  },
}));

// Mock the locationService module
jest.mock('../../../services/locationService', () => ({
  locationService: {
    getUserLocation: jest.fn(() => Promise.resolve({ latitude: 47.6062, longitude: -122.3321 })),
    searchLocationByAddress: jest.fn(() => Promise.resolve({ latitude: 47.6062, longitude: -122.3321 })),
  },
}));

// Mock the Redux store thunks
jest.mock('../../../store/thunks/tribeThunks', () => ({
  createTribe: jest.fn(() => ({}))
}));

describe('TribeCreationForm', () => {
  // Setup mocks for dependencies
  let mockPickImage: jest.SpyInstance;
  let mockUploadTribeImage: jest.SpyInstance;
  let mockGetUserLocation: jest.SpyInstance;
  let mockSearchLocationByAddress: jest.SpyInstance;
  let mockCreateTribe: jest.Mock;
  let mockResetTribeCreationStatus: jest.SpyInstance;

  // Configure mock Redux store
  let store: any;

  beforeEach(() => {
    // Reset all mocks
    mockPickImage = jest.spyOn(mediaService, 'pickImage');
    mockUploadTribeImage = jest.spyOn(mediaService, 'uploadTribeImage');
    mockGetUserLocation = jest.spyOn(locationService, 'getUserLocation');
    mockSearchLocationByAddress = jest.spyOn(locationService, 'searchLocationByAddress');
    mockCreateTribe = createTribe as jest.Mock;
    mockResetTribeCreationStatus = jest.spyOn(tribeActions, 'resetTribeCreationStatus');

    // Set up mock implementations for services
    mockPickImage.mockResolvedValue({ uri: 'mockedImageUri', width: 200, height: 200 });
    mockUploadTribeImage.mockResolvedValue({ success: true, mediaUrl: 'mockedUploadedImageUrl' });
    mockGetUserLocation.mockResolvedValue({ latitude: 47.6062, longitude: -122.3321 });
    mockSearchLocationByAddress.mockResolvedValue({ latitude: 47.6062, longitude: -122.3321 });
    mockCreateTribe.mockImplementation(() => ({} as any));
    mockResetTribeCreationStatus.mockImplementation(() => ({ type: 'reset' } as any));

    // Configure mock Redux store
    store = configureStore({
      reducer: (state: any = {}, action: any) => {
        return {
          tribes: {
            tribeCreationStatus: 'IDLE',
          },
        };
      },
    });
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    // Render the TribeCreationForm component with Redux Provider
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Verify that all form elements are present
    expect(getByPlaceholderText('Enter tribe name')).toBeDefined();
    expect(getByPlaceholderText('Enter tribe description')).toBeDefined();
    expect(getByPlaceholderText('Enter location')).toBeDefined();
    expect(getByText('Privacy')).toBeDefined();
    expect(getByText('Interests')).toBeDefined();
    expect(getByText('Create Tribe')).toBeDefined();
    expect(getByText('Cancel')).toBeDefined();

    // Check that initial form state is correct
    expect(mockPickImage).not.toHaveBeenCalled();
    expect(mockUploadTribeImage).not.toHaveBeenCalled();
    expect(mockGetUserLocation).not.toHaveBeenCalled();
    expect(mockSearchLocationByAddress).not.toHaveBeenCalled();
    expect(mockCreateTribe).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    // Render the TribeCreationForm component
    const { getByText } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Submit the form without filling required fields
    const createButton = getByText('Create Tribe');
    fireEvent.press(createButton);

    // Verify that validation errors are displayed
    await waitFor(() => {
      expect(getByText('This field is required.')).toBeDefined();
    });
  });

  it('handles image selection', async () => {
    // Render the TribeCreationForm component
    const { getByText, getByRole } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Trigger the image selection button
    const uploadButton = getByText('Upload Tribe Photo');
    fireEvent.press(uploadButton);

    // Verify that the image picker is called
    expect(mockPickImage).toHaveBeenCalled();

    // Verify that the selected image is displayed
    await waitFor(() => {
      expect(getByRole('image')).toBeDefined();
    });
  });

  it('handles location selection', async () => {
    // Render the TribeCreationForm component
    const { getByPlaceholderText } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Enter a location in the location input field
    const locationInput = getByPlaceholderText('Enter location');
    fireEvent.changeText(locationInput, 'Seattle, WA');

    // Verify that the location is geocoded
    await waitFor(() => {
      expect(mockSearchLocationByAddress).toHaveBeenCalledWith('Seattle, WA');
    });
  });

  it('handles interest selection', async () => {
    // Render the TribeCreationForm component
    const { getByText } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Select primary and secondary interests
    const hikingInterest = getByText('Hiking');
    fireEvent.press(hikingInterest);

    // Verify that the selected interests are displayed
    await waitFor(() => {
      expect(getByText('Hiking')).toBeDefined();
    });
  });

  it('submits the form with valid data', async () => {
    // Create a mock onCancel function
    const mockOnSuccess = jest.fn();

    // Render the TribeCreationForm component
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <TribeCreationForm onSuccess={mockOnSuccess} />
      </Provider>
    );

    // Fill all required fields with valid data
    fireEvent.changeText(getByPlaceholderText('Enter tribe name'), 'Weekend Explorers');
    fireEvent.changeText(getByPlaceholderText('Enter tribe description'), 'A group for weekend adventures');
    fireEvent.changeText(getByPlaceholderText('Enter location'), 'Seattle, WA');

    // Submit the form
    const createButton = getByText('Create Tribe');
    fireEvent.press(createButton);

    // Verify that createTribe action is dispatched with correct data
    await waitFor(() => {
      expect(mockCreateTribe).toHaveBeenCalled();
    });

    // Check that success callback is called after submission
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles submission errors', async () => {
    // Mock failed image upload or API error
    mockUploadTribeImage.mockRejectedValue(new Error('Upload failed'));

    // Render the TribeCreationForm component
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Fill all required fields with valid data
    fireEvent.changeText(getByPlaceholderText('Enter tribe name'), 'Weekend Explorers');
    fireEvent.changeText(getByPlaceholderText('Enter tribe description'), 'A group for weekend adventures');
    fireEvent.changeText(getByPlaceholderText('Enter location'), 'Seattle, WA');

    // Submit the form
    const createButton = getByText('Create Tribe');
    fireEvent.press(createButton);

    // Verify that error state is shown
    await waitFor(() => {
      expect(getByText('Failed to create tribe. Please try again.')).toBeDefined();
    });
  });

  it('resets form after successful submission', async () => {
    // Mock successful form submission
    mockCreateTribe.mockImplementation(() => Promise.resolve({
      payload: {
        id: '123',
        name: 'Test Tribe',
        description: 'Test Description',
        location: 'Test Location',
        coordinates: { latitude: 0, longitude: 0 },
        imageUrl: 'test.jpg',
        coverImageUrl: 'test.jpg',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        primaryInterests: [],
        secondaryInterests: [],
      }
    }) as any);

    // Render the TribeCreationForm component
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <TribeCreationForm />
      </Provider>
    );

    // Fill all required fields with valid data
    fireEvent.changeText(getByPlaceholderText('Enter tribe name'), 'Weekend Explorers');
    fireEvent.changeText(getByPlaceholderText('Enter tribe description'), 'A group for weekend adventures');
    fireEvent.changeText(getByPlaceholderText('Enter location'), 'Seattle, WA');

    // Submit the form
    const createButton = getByText('Create Tribe');
    fireEvent.press(createButton);

    // Verify that resetTribeCreationStatus action is dispatched
    await waitFor(() => {
      expect(mockResetTribeCreationStatus).toHaveBeenCalled();
    });
  });

  it('calls onCancel when cancel button is pressed', () => {
    // Create a mock onCancel function
    const mockOnCancel = jest.fn();

    // Render the TribeCreationForm component with onCancel prop
    const { getByText } = render(
      <Provider store={store}>
        <TribeCreationForm onCancel={mockOnCancel} />
      </Provider>
    );

    // Press the cancel button
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    // Verify that onCancel function is called
    expect(mockOnCancel).toHaveBeenCalled();
  });
});