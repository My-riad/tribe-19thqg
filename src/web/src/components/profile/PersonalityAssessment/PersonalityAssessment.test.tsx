import React from 'react'; // react v18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // @testing-library/react-native v12.0.0
import { PersonalityAssessment } from './PersonalityAssessment'; // Import the component being tested
import { profileApi } from '../../../api/profileApi'; // Import API client for mocking API calls
import { useProfile } from '../../../hooks/useProfile'; // Import profile hook for mocking
import { updateAssessmentProgress } from '../../../store/thunks/profileThunks'; // Import Redux thunk for mocking
import { PersonalityAssessmentQuestion } from '../../../types/profile.types'; // Import type definition for test data
import { jest } from 'jest'; // jest v29.2.1

// Mock data for personality assessment questions used in tests
const mockQuestions: PersonalityAssessmentQuestion[] = [
  {
    id: '1',
    text: 'I consider myself more of a:',
    options: [
      { id: '1a', text: 'Planner', value: 1 },
      { id: '1b', text: 'Spontaneous person', value: 5 },
    ],
    traitName: 'ORGANIZATION',
    weight: 1,
  },
  {
    id: '2',
    text: 'In social situations, I am usually:',
    options: [
      { id: '2a', text: 'Outgoing', value: 5 },
      { id: '2b', text: 'Reserved', value: 1 },
    ],
    traitName: 'EXTRAVERSION',
    weight: 1,
  },
];

// Mock implementation of the profile context returned by useProfile hook
const mockProfileContext = {
  profile: null,
  personalityTraits: [],
  interests: [],
  loading: false,
  error: null,
  isAssessmentComplete: false,
  areInterestsSelected: false,
  getProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  submitAssessment: jest.fn().mockResolvedValue([]),
  updateUserInterests: jest.fn(),
  getUserInterests: jest.fn(),
  uploadAvatar: jest.fn(),
  clearProfileError: jest.fn(),
  profileCompletionPercentage: 0,
};

// Mock API call to fetch personality assessment questions
jest.mock('../../../api/profileApi', () => ({
  profileApi: {
    getPersonalityAssessment: jest.fn().mockResolvedValue({ data: mockQuestions }),
    submitPersonalityAssessment: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock useProfile hook to return test context
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: jest.fn().mockReturnValue(mockProfileContext),
}));

// Mock Redux dispatch thunk for updating assessment progress
jest.mock('../../../store/thunks/profileThunks', () => ({
  updateAssessmentProgress: jest.fn(),
}));

describe('PersonalityAssessment', () => {
  beforeEach(() => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockClear();
    (profileApi.submitPersonalityAssessment as jest.Mock).mockClear();
    (useProfile as jest.Mock).mockClear();
    (updateAssessmentProgress as jest.Mock).mockClear();

    (useProfile as jest.Mock).mockReturnValue(mockProfileContext);
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });
    (profileApi.submitPersonalityAssessment as jest.Mock).mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with questions', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });

    const { getByText, queryByTestId } = render(<PersonalityAssessment />);

    await waitFor(() => {
      expect(getByText(mockQuestions[0].text)).toBeTruthy();
      expect(getByText(mockQuestions[0].options[0].text)).toBeTruthy();
      expect(getByText(mockQuestions[0].options[1].text)).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
      expect(queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('shows loading indicator while fetching questions', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: mockQuestions });
        }, 500);
      });
    });

    const { queryByTestId, getByTestId } = render(<PersonalityAssessment />);

    expect(getByTestId('loading-indicator')).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeNull();
    });
  });

  it('shows error message when API call fails', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<PersonalityAssessment />);

    await waitFor(() => {
      expect(getByText('Error: API Error')).toBeTruthy();
    });
  });

  it('allows selecting an option', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });

    const { getByText } = render(<PersonalityAssessment />);

    await waitFor(() => {
      const option = getByText(mockQuestions[0].options[0].text);
      fireEvent.press(option);
      expect(getByText(mockQuestions[0].options[0].text)).toBeTruthy();
    });
  });

  it('navigates to next question when Next is clicked', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });

    const { getByText } = render(<PersonalityAssessment />);

    await waitFor(() => {
      const option = getByText(mockQuestions[0].options[0].text);
      fireEvent.press(option);
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);
      expect(getByText(mockQuestions[1].text)).toBeTruthy();
    });
  });

  it('navigates to previous question when Back is clicked', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });

    const { getByText } = render(<PersonalityAssessment />);

    await waitFor(() => {
      const option = getByText(mockQuestions[0].options[0].text);
      fireEvent.press(option);
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);
      expect(getByText(mockQuestions[1].text)).toBeTruthy();
      const backButton = getByText('Back');
      fireEvent.press(backButton);
      expect(getByText(mockQuestions[0].text)).toBeTruthy();
    });
  });

  it('updates progress correctly', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });

    const { getByText } = render(<PersonalityAssessment />);

    await waitFor(() => {
      const option = getByText(mockQuestions[0].options[0].text);
      fireEvent.press(option);
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);
      expect(updateAssessmentProgress).toHaveBeenCalledWith(1 / mockQuestions.length);
    });
  });

  it('submits assessment when all questions are answered', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });
    const mockSubmitAssessment = jest.fn().mockResolvedValue(undefined);
    (useProfile as jest.Mock).mockReturnValue({
      ...mockProfileContext,
      submitAssessment: mockSubmitAssessment,
    });

    const { getByText } = render(<PersonalityAssessment onComplete={() => {}} />);

    await waitFor(() => {
      const option1 = getByText(mockQuestions[0].options[0].text);
      fireEvent.press(option1);
      const nextButton = getByText('Next');
      fireEvent.press(nextButton);

      const option2 = getByText(mockQuestions[1].options[0].text);
      fireEvent.press(option2);
      const submitButton = getByText('Submit');
      fireEvent.press(submitButton);

      expect(mockSubmitAssessment).toHaveBeenCalled();
    });
  });

  it('calls onBack when Back is clicked on first question', async () => {
    (profileApi.getPersonalityAssessment as jest.Mock).mockResolvedValue({ data: mockQuestions });
    const onBackMock = jest.fn();
    const { getByText } = render(<PersonalityAssessment onBack={onBackMock} />);

    await waitFor(() => {
      const backButton = getByText('Back');
      fireEvent.press(backButton);
      expect(onBackMock).toHaveBeenCalled();
    });
  });
});