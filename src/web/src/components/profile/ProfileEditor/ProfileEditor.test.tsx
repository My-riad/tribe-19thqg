import React from 'react'; // react v^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native v^11.5.0
import ProfileEditor from './ProfileEditor';
import { useProfile } from '../../../hooks/useProfile';
import { mediaService } from '../../../services/mediaService';
import { jest } from 'jest'; // jest v^29.2.1

// Mock profile data for testing
interface MockProfileData {
  name: string; // User's display name
  bio: string; // User's bio/description
  location: string; // User's location
  birthdate: string; // User's birthdate
  phoneNumber: string; // User's phone number
  maxTravelDistance: number; // Maximum distance user is willing to travel
  availableDays: string[]; // Days of the week user is available
}

// Setup function to mock dependencies before each test
const setup = () => {
  // Mock useProfile hook to return test values and mock functions
  const mockUseProfile = {
    profile: {
      name: 'Test User',
      bio: 'Test bio',
      location: 'Test location',
      birthdate: '1990-01-01',
      phoneNumber: '123-456-7890',
      maxTravelDistance: 50,
      availableDays: ['Monday', 'Wednesday', 'Friday'],
      coordinates: { latitude: 0, longitude: 0 },
      avatarUrl: 'test-avatar-url',
      coverImageUrl: 'test-cover-image-url',
      personalityTraits: [],
      interests: [],
      preferences: [],
      achievements: [],
      lastUpdated: new Date(),
      completionPercentage: 100,
      userId: 'test-user-id',
    },
    loading: false,
    error: null,
    updateUserProfile: jest.fn().mockResolvedValue({}),
    uploadAvatar: jest.fn().mockResolvedValue({ mediaUrl: 'new-avatar-url' }),
    clearProfileError: jest.fn(),
  };
  (useProfile as jest.Mock).mockReturnValue(mockUseProfile);

  // Mock mediaService.pickImage to return test image data
  const mockPickImage = jest.fn().mockResolvedValue({
    uri: 'test-image-uri',
    width: 200,
    height: 200,
  });
  (mediaService.pickImage as jest.Mock).mockImplementation(mockPickImage);

  // Mock mediaService.uploadProfileImage to return success response
  const mockUploadProfileImage = jest.fn().mockResolvedValue({
    success: true,
    mediaUrl: 'test-image-url',
  });
  (mediaService.uploadProfileImage as jest.Mock).mockImplementation(mockUploadProfileImage);

  return { mockUseProfile, mockPickImage, mockUploadProfileImage };
};

// Mock the useProfile hook
jest.mock('../../../hooks/useProfile');

// Mock the mediaService
jest.mock('../../../services/mediaService');

describe('ProfileEditor Component', () => {
  it('renders correctly with initial data', () => {
    // Arrange: Mock the useProfile hook and render the component
    const { mockUseProfile } = setup();
    const { getByPlaceholderText, getByText } = render(<ProfileEditor />);

    // Assert: Verify that form fields are populated with initial values
    expect(getByPlaceholderText('Enter your display name')).toHaveDisplayValue(mockUseProfile.profile.name);
    expect(getByPlaceholderText('Enter your location')).toHaveDisplayValue(mockUseProfile.profile.location);
    expect(getByPlaceholderText('YYYY-MM-DD')).toHaveDisplayValue(mockUseProfile.profile.birthdate);
    expect(getByPlaceholderText('Enter your phone number')).toHaveDisplayValue(mockUseProfile.profile.phoneNumber);

    // Assert: Verify that the component structure matches expectations
    expect(getByText('Test bio')).toBeDefined();
  });

  it('renders correctly without initial data', () => {
    // Arrange: Mock the useProfile hook to return null profile data
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      loading: false,
      error: null,
      updateUserProfile: jest.fn().mockResolvedValue({}),
      uploadAvatar: jest.fn().mockResolvedValue({ mediaUrl: 'new-avatar-url' }),
      clearProfileError: jest.fn(),
    });

    // Act: Render the component
    const { getByPlaceholderText } = render(<ProfileEditor />);

    // Assert: Verify that form fields are empty
    expect(getByPlaceholderText('Enter your display name')).toHaveDisplayValue('');
    expect(getByPlaceholderText('Enter your location')).toHaveDisplayValue('');
    expect(getByPlaceholderText('YYYY-MM-DD')).toHaveDisplayValue('');
    expect(getByPlaceholderText('Enter your phone number')).toHaveDisplayValue('');
  });

  it('handles input changes correctly', () => {
    // Arrange: Render the ProfileEditor component
    const { getByPlaceholderText } = render(<ProfileEditor />);

    // Act: Simulate user input in name and bio fields
    const nameInput = getByPlaceholderText('Enter your display name');
    const bioInput = getByPlaceholderText('Tell us about yourself');
    fireEvent.changeText(nameInput, 'New Name');
    fireEvent.changeText(bioInput, 'New Bio');

    // Assert: Verify that the input values are updated
    expect(nameInput).toHaveDisplayValue('New Name');
    expect(bioInput).toHaveDisplayValue('New Bio');
  });

  it('validates required fields', async () => {
    // Arrange: Render the ProfileEditor component
    const { getByText, getByRole } = render(<ProfileEditor />);

    // Act: Leave required fields empty and submit the form
    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that validation errors are displayed
    await waitFor(() => {
      expect(getByText('This field is required.')).toBeDefined();
    });
  });

  it('validates phone number format', async () => {
    // Arrange: Render the ProfileEditor component
    const { getByPlaceholderText, getByText, getByRole } = render(<ProfileEditor />);

    // Act: Enter invalid phone number and submit the form
    const phoneInput = getByPlaceholderText('Enter your phone number');
    fireEvent.changeText(phoneInput, 'invalid-phone');
    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that phone validation error is displayed
    await waitFor(() => {
      expect(getByText('Please enter a valid phone number.')).toBeDefined();
    });
  });

  it('validates birthdate for minimum age', async () => {
    // Arrange: Render the ProfileEditor component
    const { getByPlaceholderText, getByText, getByRole } = render(<ProfileEditor />);

    // Act: Enter birthdate for someone under 18 and submit the form
    const birthdateInput = getByPlaceholderText('YYYY-MM-DD');
    fireEvent.changeText(birthdateInput, '2020-01-01');
    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that age validation error is displayed
    await waitFor(() => {
      expect(getByText('You must be at least 18 years old to use this app.')).toBeDefined();
    });
  });

  it('handles avatar selection', async () => {
    // Arrange: Mock mediaService.pickImage and render the component
    const { mockPickImage } = setup();
    const { getByTestId } = render(<ProfileEditor />);

    // Act: Trigger avatar selection
    const avatarButton = getByTestId('avatar-button');
    fireEvent.press(avatarButton);

    // Assert: Verify that pickImage was called and selected image is displayed
    expect(mockPickImage).toHaveBeenCalled();
    await waitFor(() => {
      expect(getByTestId('avatar-image')).toBeDefined();
    });
  });

  it('submits form data correctly', async () => {
    // Arrange: Mock useProfile.updateUserProfile and render the component
    const { mockUseProfile } = setup();
    const { getByPlaceholderText, getByRole } = render(<ProfileEditor />);

    // Act: Fill form with valid data and submit the form
    const nameInput = getByPlaceholderText('Enter your display name');
    const locationInput = getByPlaceholderText('Enter your location');
    const birthdateInput = getByPlaceholderText('YYYY-MM-DD');
    const phoneInput = getByPlaceholderText('Enter your phone number');
    const bioInput = getByPlaceholderText('Tell us about yourself');

    fireEvent.changeText(nameInput, 'Valid Name');
    fireEvent.changeText(locationInput, 'Valid Location');
    fireEvent.changeText(birthdateInput, '1990-01-01');
    fireEvent.changeText(phoneInput, '123-456-7890');
    fireEvent.changeText(bioInput, 'Valid Bio');

    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that updateUserProfile was called with correct data
    await waitFor(() => {
      expect(mockUseProfile.updateUserProfile).toHaveBeenCalledWith({
        name: 'Valid Name',
        bio: 'Valid Bio',
        location: 'Valid Location',
        birthdate: '1990-01-01',
        phoneNumber: '123-456-7890',
        maxTravelDistance: 50,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        coordinates: { latitude: 0, longitude: 0 },
        avatarUrl: 'test-avatar-url',
        coverImageUrl: 'test-cover-image-url',
        availableTimeRanges: undefined,
      });
    });
  });

  it('uploads avatar when selected', async () => {
    // Arrange: Mock mediaService.uploadProfileImage and render the component
    const { mockUploadProfileImage, mockPickImage } = setup();
    const { getByTestId, getByRole } = render(<ProfileEditor />);

    // Act: Select avatar image and submit the form
    const avatarButton = getByTestId('avatar-button');
    fireEvent.press(avatarButton);
    await waitFor(() => {
      expect(mockPickImage).toHaveBeenCalled();
    });

    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that uploadProfileImage was called
    await waitFor(() => {
      expect(mockUploadProfileImage).toHaveBeenCalled();
    });
  });

  it('handles submission errors', async () => {
    // Arrange: Mock useProfile.updateUserProfile to throw error
    (useProfile as jest.Mock).mockReturnValue({
      profile: {
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test location',
        birthdate: '1990-01-01',
        phoneNumber: '123-456-7890',
        maxTravelDistance: 50,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        coordinates: { latitude: 0, longitude: 0 },
        avatarUrl: 'test-avatar-url',
        coverImageUrl: 'test-cover-image-url',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        userId: 'test-user-id',
      },
      loading: false,
      error: null,
      updateUserProfile: jest.fn().mockRejectedValue(new Error('API error')),
      uploadAvatar: jest.fn().mockResolvedValue({ mediaUrl: 'new-avatar-url' }),
      clearProfileError: jest.fn(),
    });
    const { getByPlaceholderText, getByRole, getByText } = render(<ProfileEditor />);

    // Act: Fill form with valid data and submit the form
    const nameInput = getByPlaceholderText('Enter your display name');
    fireEvent.changeText(nameInput, 'Valid Name');
    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that error message is displayed
    await waitFor(() => {
      expect(getByText('API error')).toBeDefined();
    });
  });

  it('calls onComplete callback on successful submission', async () => {
    // Arrange: Create mock onComplete function and render the component
    const onComplete = jest.fn();
    const { getByPlaceholderText, getByRole } = render(<ProfileEditor onComplete={onComplete} />);

    // Act: Fill form with valid data and submit the form
    const nameInput = getByPlaceholderText('Enter your display name');
    fireEvent.changeText(nameInput, 'Valid Name');
    const updateButton = getByRole('button', { name: 'Update Profile' });
    fireEvent.press(updateButton);

    // Assert: Verify that onComplete was called with updated profile
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('calls onCancel callback when cancel button is pressed', () => {
    // Arrange: Create mock onCancel function and render the component
    const onCancel = jest.fn();
    const { getByRole } = render(<ProfileEditor onCancel={onCancel} />);

    // Act: Press cancel button
    const cancelButton = getByRole('button', { name: 'Cancel' });
    fireEvent.press(cancelButton);

    // Assert: Verify that onCancel was called
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    // Arrange: Mock useProfile.updateUserProfile with delayed response
    const updateUserProfile = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve({}), 500));
    });
    (useProfile as jest.Mock).mockReturnValue({
      profile: {
        name: 'Test User',
        bio: 'Test bio',
        location: 'Test location',
        birthdate: '1990-01-01',
        phoneNumber: '123-456-7890',
        maxTravelDistance: 50,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        coordinates: { latitude: 0, longitude: 0 },
        avatarUrl: 'test-avatar-url',
        coverImageUrl: 'test-cover-image-url',
        personalityTraits: [],
        interests: [],
        preferences: [],
        achievements: [],
        lastUpdated: new Date(),
        completionPercentage: 100,
        userId: 'test-user-id',
      },
      loading: false,
      error: null,
      updateUserProfile,
      uploadAvatar: jest.fn().mockResolvedValue({ mediaUrl: 'new-avatar-url' }),
      clearProfileError: jest.fn(),
    });
    const { getByPlaceholderText, getByRole, queryByText } = render(<ProfileEditor />);

    // Act: Fill form with valid data and submit the form
    const nameInput = getByPlaceholderText('Enter your display name');
    fireEvent.changeText(nameInput, 'Valid Name');
    const updateButton = getByRole('button', { name: 'Update Profile' });

    // Trigger the submission and wrap it in act to handle state updates
    await act(async () => {
      fireEvent.press(updateButton);
    });

    // Assert: Verify that loading indicator is displayed
    expect(getByText('Updating...')).toBeDefined();

    // Wait for submission to complete
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalled();
    });

    // Assert: Verify that loading indicator is no longer displayed
    await waitFor(() => {
      expect(queryByText('Updating...')).toBeNull();
    });
  });
});