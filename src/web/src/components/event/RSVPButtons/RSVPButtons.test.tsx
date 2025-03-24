import React from 'react'; // react ^18.0.0
import { render, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native ^12.0.0
import { act } from 'react-test-renderer'; // react-test-renderer ^18.0.0

import RSVPButtons from './RSVPButtons';
import { RSVPStatus } from '../../../types/event.types';
import useEvents from '../../../hooks/useEvents';

// Mock the useEvents hook to control its behavior in tests
jest.mock('../../../hooks/useEvents', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    rsvpToEvent: jest.fn(),
    loading: false
  }))
}));

describe('RSVPButtons', () => {
  let rsvpToEventMock: jest.Mock;
  let onStatusChangeMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks between tests to ensure clean state
    rsvpToEventMock = jest.fn();
    onStatusChangeMock = jest.fn();

    (useEvents as jest.Mock).mockImplementation(() => ({
      rsvpToEvent: rsvpToEventMock,
      loading: false
    }));
  });

  it('renders correctly with default state', () => {
    const { getByText, getByTestId } = render(
      <RSVPButtons eventId="123" onStatusChange={onStatusChangeMock} />
    );

    // Verify that all three buttons (Going, Maybe, Can't Go) are rendered
    expect(getByText('Going')).toBeTruthy();
    expect(getByText('Maybe')).toBeTruthy();
    expect(getByText("Can't Go")).toBeTruthy();

    // Verify that none of the buttons are selected by default
    expect(getByTestId('going-button')).not.toHaveProp('isSelected', true);
    expect(getByTestId('maybe-button')).not.toHaveProp('isSelected', true);
    expect(getByTestId('not-going-button')).not.toHaveProp('isSelected', true);
  });

  it('renders with the correct initial status selected', () => {
    const { getByText, getByTestId } = render(
      <RSVPButtons eventId="123" initialStatus={RSVPStatus.GOING} onStatusChange={onStatusChangeMock} />
    );

    // Verify that the Going button is selected
    expect(getByTestId('going-button')).toHaveProp('isSelected', true);

    // Verify that the other buttons are not selected
    expect(getByTestId('maybe-button')).not.toHaveProp('isSelected', true);
    expect(getByTestId('not-going-button')).not.toHaveProp('isSelected', true);
  });

  it('handles button press correctly', async () => {
    const { getByText } = render(
      <RSVPButtons eventId="123" onStatusChange={onStatusChangeMock} />
    );

    // Simulate a press on the Going button
    await act(async () => {
      fireEvent.press(getByText('Going'));
    });

    // Verify that the rsvpToEvent function was called with the correct parameters
    expect(rsvpToEventMock).toHaveBeenCalledWith('123', RSVPStatus.GOING);

    // Verify that the onStatusChange callback was called with the correct status
    expect(onStatusChangeMock).toHaveBeenCalledWith(RSVPStatus.GOING);
  });

  it('disables buttons when disabled prop is true', () => {
    const { getByText } = render(
      <RSVPButtons eventId="123" disabled={true} onStatusChange={onStatusChangeMock} />
    );

    const goingButton = getByText('Going');
    const maybeButton = getByText('Maybe');
    const notGoingButton = getByText("Can't Go");

    // Verify that all buttons have the disabled style
    expect(goingButton).toHaveProp('disabled', true);
    expect(maybeButton).toHaveProp('disabled', true);
    expect(notGoingButton).toHaveProp('disabled', true);

    // Simulate a press on the Going button
    fireEvent.press(goingButton);

    // Verify that the rsvpToEvent function was not called
    expect(rsvpToEventMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when submitting RSVP', () => {
    (useEvents as jest.Mock).mockImplementation(() => ({
      rsvpToEvent: jest.fn(),
      loading: true
    }));

    const { getByTestId } = render(
      <RSVPButtons eventId="123" onStatusChange={onStatusChangeMock} />
    );

    // Verify that the loading indicator is displayed
    expect(getByTestId('loading-indicator')).toBeTruthy();

    // Verify that the buttons are disabled during loading
    expect(getByTestId('going-button')).toHaveProp('disabled', true);
    expect(getByTestId('maybe-button')).toHaveProp('disabled', true);
    expect(getByTestId('not-going-button')).toHaveProp('disabled', true);
  });

  it('allows changing RSVP status', async () => {
    const { getByText, getByTestId } = render(
      <RSVPButtons eventId="123" initialStatus={RSVPStatus.GOING} onStatusChange={onStatusChangeMock} />
    );

    // Verify that the Going button is selected
    expect(getByTestId('going-button')).toHaveProp('isSelected', true);

    // Simulate a press on the Maybe button
    await act(async () => {
      fireEvent.press(getByText('Maybe'));
    });

    // Verify that the Maybe button becomes selected and Going is deselected
    expect(getByTestId('maybe-button')).toHaveProp('isSelected', true);
    expect(getByTestId('going-button')).not.toHaveProp('isSelected', true);

    // Verify that the rsvpToEvent function was called with the correct parameters
    expect(rsvpToEventMock).toHaveBeenCalledWith('123', RSVPStatus.MAYBE);

    // Verify that the onStatusChange callback was called with the new status
    expect(onStatusChangeMock).toHaveBeenCalledWith(RSVPStatus.MAYBE);
  });

  it('renders with full width when fullWidth prop is true', () => {
    const { getByTestId } = render(
      <RSVPButtons eventId="123" fullWidth={true} onStatusChange={onStatusChangeMock} />
    );

    const container = getByTestId('rsvp-buttons-container');

    // Verify that the container has the full width style
    expect(container).toHaveStyle({ width: '100%' });

    // Verify that the buttons are properly sized for full width layout
    expect(getByTestId('going-button')).toHaveStyle({ flex: 1 });
    expect(getByTestId('maybe-button')).toHaveStyle({ flex: 1 });
    expect(getByTestId('not-going-button')).toHaveStyle({ flex: 1 });
  });
});