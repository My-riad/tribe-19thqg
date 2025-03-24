import React from 'react'; // react ^18.2.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0
import { act } from 'react-test-renderer'; // react-test-renderer ^18.2.0
import { Provider } from 'react-redux'; // react-redux ^8.0.5
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import LoginScreen from './LoginScreen';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/navigationRoutes';
import { store } from '../../../store/store';

// Mock the useAuth hook for testing
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the useNavigation hook for testing
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

type MockedUseAuth = {
  login: jest.Mock;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;
};

type MockedUseNavigation = {
  navigate: jest.Mock;
};

type MockedUseRoute = {
  params: any;
};

describe('LoginScreen', () => {
  let mockedUseAuth: MockedUseAuth;
  let mockedUseNavigation: MockedUseNavigation;
  let mockedUseRoute: MockedUseRoute;

  beforeEach(() => {
    mockedUseAuth = {
      login: jest.fn(),
      loading: false,
      error: null,
      mfaRequired: false,
    };

    (useAuth as jest.Mock).mockReturnValue(mockedUseAuth);

    mockedUseNavigation = {
      navigate: jest.fn(),
    };
    (useNavigation as jest.Mock).mockReturnValue(mockedUseNavigation);

    mockedUseRoute = {
      params: {},
    };
    (useRoute as jest.Mock).mockReturnValue(mockedUseRoute);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <NavigationContainer>
          {component}
        </NavigationContainer>
      </Provider>
    );
  };

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);

    expect(getByText('Tribe')).toBeTruthy();
    expect(getByText('Meaningful connections in your local community')).toBeTruthy();
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
    expect(getByPlaceholderText('Enter password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Create one')).toBeTruthy();
  });

  it('should handle login submission', async () => {
    mockedUseAuth.login.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);
    const emailInput = getByPlaceholderText('Enter email');
    const passwordInput = getByPlaceholderText('Enter password');
    const signInButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'Password123!');

    act(() => {
      fireEvent.press(signInButton);
    });

    expect(mockedUseAuth.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
      rememberMe: false,
    });
  });

  it('should display error message when login fails', () => {
    mockedUseAuth.error = 'Invalid credentials';
    (useAuth as jest.Mock).mockReturnValue(mockedUseAuth);

    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  it('should navigate to registration screen', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    const createOneLink = getByText('Create one');

    fireEvent.press(createOneLink);

    expect(mockedUseNavigation.navigate).toHaveBeenCalledWith(ROUTES.AUTH.REGISTRATION);
  });

  it('should handle MFA requirement', () => {
    mockedUseAuth.mfaRequired = true;
    mockedUseAuth.mfaChallenge = {
      challengeId: '123',
      method: 'sms',
      destination: '+15551234567',
      expiresAt: Date.now() + 300000,
    };
    (useAuth as jest.Mock).mockReturnValue(mockedUseAuth);

    const { getByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Verify MFA')).toBeTruthy();
    expect(getByText('Enter the code sent to +15551234567')).toBeTruthy();
    expect(getByPlaceholderText('Enter code')).toBeTruthy();
  });

  it('should pre-fill email from route params', () => {
    mockedUseRoute.params = { email: 'prefilled@example.com' };
    (useRoute as jest.Mock).mockReturnValue(mockedUseRoute);

    const { getByDisplayValue } = renderWithProviders(<LoginScreen />);
    expect(getByDisplayValue('prefilled@example.com')).toBeTruthy();
  });
});