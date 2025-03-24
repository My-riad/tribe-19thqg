import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AttendeesList from './AttendeesList';
import { RSVPStatus } from '../../../types/event.types';

// Mock data for testing the AttendeesList component
const mockAttendees = [
  {
    id: '1',
    userId: 'user1',
    eventId: 'event1',
    profile: {
      id: 'profile1',
      userId: 'user1',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar1.jpg',
    },
    rsvpStatus: RSVPStatus.GOING,
    rsvpTime: new Date('2023-01-01T10:00:00Z'),
    hasCheckedIn: false,
    checkedInAt: null,
  },
  {
    id: '2',
    userId: 'user2',
    eventId: 'event1',
    profile: {
      id: 'profile2',
      userId: 'user2',
      name: 'Jane Smith',
      avatarUrl: 'https://example.com/avatar2.jpg',
    },
    rsvpStatus: RSVPStatus.MAYBE,
    rsvpTime: new Date('2023-01-01T11:00:00Z'),
    hasCheckedIn: false,
    checkedInAt: null,
  },
  {
    id: '3',
    userId: 'user3',
    eventId: 'event1',
    profile: {
      id: 'profile3',
      userId: 'user3',
      name: 'Bob Johnson',
      avatarUrl: 'https://example.com/avatar3.jpg',
    },
    rsvpStatus: RSVPStatus.NOT_GOING,
    rsvpTime: new Date('2023-01-01T12:00:00Z'),
    hasCheckedIn: false,
    checkedInAt: null,
  },
  {
    id: '4',
    userId: 'user4',
    eventId: 'event1',
    profile: {
      id: 'profile4',
      userId: 'user4',
      name: 'Alice Brown',
      avatarUrl: 'https://example.com/avatar4.jpg',
    },
    rsvpStatus: RSVPStatus.GOING,
    rsvpTime: new Date('2023-01-01T13:00:00Z'),
    hasCheckedIn: true,
    checkedInAt: new Date('2023-01-02T10:00:00Z'),
  },
];

// Mock callback functions
const mockOnCheckIn = jest.fn();
const mockOnRemoveAttendee = jest.fn();

describe('AttendeesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with attendees', () => {
    const { getByText, getAllByText, queryByAccessibilityLabel, getByAccessibilityLabel } = render(
      <AttendeesList
        attendees={mockAttendees}
        eventId="event1"
        isOrganizer={true}
        onCheckIn={mockOnCheckIn}
        onRemoveAttendee={mockOnRemoveAttendee}
      />
    );

    // Check if component renders correctly
    expect(getByText('Attendees (4)')).toBeTruthy();
    
    // Check if attendees are displayed
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Jane Smith')).toBeTruthy();
    expect(getByText('Bob Johnson')).toBeTruthy();
    expect(getByText('Alice Brown')).toBeTruthy();
    
    // Check if RSVP statuses are displayed
    expect(getAllByText('Going').length).toBe(2);
    expect(getByText('Maybe')).toBeTruthy();
    expect(getByText('Not Going')).toBeTruthy();
    
    // Check if check-in status is displayed correctly
    expect(getByAccessibilityLabel('Alice Brown, Going, Checked In')).toBeTruthy();
    expect(getByAccessibilityLabel('John Doe, Going')).toBeTruthy();
    
    // Check-in button should only be shown for non-checked-in attendees with RSVP status "GOING"
    expect(getByAccessibilityLabel('Check in John Doe')).toBeTruthy();
    expect(queryByAccessibilityLabel('Check in Alice Brown')).toBeNull(); // Already checked in
    expect(queryByAccessibilityLabel('Check in Jane Smith')).toBeNull(); // RSVP status is MAYBE
    expect(queryByAccessibilityLabel('Check in Bob Johnson')).toBeNull(); // RSVP status is NOT_GOING
  });

  it('displays empty state when no attendees', () => {
    const { getByText } = render(
      <AttendeesList
        attendees={[]}
        eventId="event1"
        isOrganizer={true}
        onCheckIn={mockOnCheckIn}
        onRemoveAttendee={mockOnRemoveAttendee}
      />
    );

    // Check if empty state message is displayed
    expect(getByText('No attendees found matching the selected filter.')).toBeTruthy();
    expect(getByText('Attendees (0)')).toBeTruthy();
  });

  it('filters attendees by RSVP status', async () => {
    const { getByText, getAllByText, queryByText, getByAccessibilityLabel } = render(
      <AttendeesList
        attendees={mockAttendees}
        eventId="event1"
        isOrganizer={true}
        onCheckIn={mockOnCheckIn}
        onRemoveAttendee={mockOnRemoveAttendee}
      />
    );

    // Initially all attendees should be displayed
    expect(getAllByText(/John Doe|Jane Smith|Bob Johnson|Alice Brown/).length).toBe(4);
    
    // Filter to show only 'Going' attendees
    fireEvent.press(getByAccessibilityLabel('Show only attendees who are going'));
    
    // Should only show 'Going' attendees
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Alice Brown')).toBeTruthy();
      expect(queryByText('Jane Smith')).toBeNull();
      expect(queryByText('Bob Johnson')).toBeNull();
    });
    
    // Filter to show only 'Maybe' attendees
    fireEvent.press(getByAccessibilityLabel('Show only attendees who might be going'));
    
    // Should only show 'Maybe' attendees
    await waitFor(() => {
      expect(queryByText('John Doe')).toBeNull();
      expect(queryByText('Alice Brown')).toBeNull();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(queryByText('Bob Johnson')).toBeNull();
    });
    
    // Filter to show only 'Not Going' attendees
    fireEvent.press(getByAccessibilityLabel('Show only attendees who are not going'));
    
    // Should only show 'Not Going' attendees
    await waitFor(() => {
      expect(queryByText('John Doe')).toBeNull();
      expect(queryByText('Alice Brown')).toBeNull();
      expect(queryByText('Jane Smith')).toBeNull();
      expect(getByText('Bob Johnson')).toBeTruthy();
    });
    
    // Switch back to show all attendees
    fireEvent.press(getByAccessibilityLabel('Show all attendees'));
    
    // All attendees should be displayed again
    await waitFor(() => {
      expect(getAllByText(/John Doe|Jane Smith|Bob Johnson|Alice Brown/).length).toBe(4);
    });
  });

  it('calls onCheckIn when check-in button is pressed', () => {
    const { getByAccessibilityLabel } = render(
      <AttendeesList
        attendees={mockAttendees}
        eventId="event1"
        isOrganizer={true}
        onCheckIn={mockOnCheckIn}
        onRemoveAttendee={mockOnRemoveAttendee}
      />
    );
    
    // Get the check-in button for the first attendee (John Doe) by accessibility label
    const checkInButton = getByAccessibilityLabel('Check in John Doe');
    
    // Press the check-in button
    fireEvent.press(checkInButton);
    
    // Verify that onCheckIn was called with the correct attendee ID
    expect(mockOnCheckIn).toHaveBeenCalledWith('user1');
    expect(mockOnCheckIn).toHaveBeenCalledTimes(1);
  });

  it('calls onRemoveAttendee when remove button is pressed', () => {
    const { getByAccessibilityLabel } = render(
      <AttendeesList
        attendees={mockAttendees}
        eventId="event1"
        isOrganizer={true}
        onCheckIn={mockOnCheckIn}
        onRemoveAttendee={mockOnRemoveAttendee}
      />
    );
    
    // Get the remove button for the first attendee (John Doe) by accessibility label
    const removeButton = getByAccessibilityLabel('Remove John Doe from event');
    
    // Press the remove button
    fireEvent.press(removeButton);
    
    // Verify that onRemoveAttendee was called with the correct attendee ID
    expect(mockOnRemoveAttendee).toHaveBeenCalledWith('user1');
    expect(mockOnRemoveAttendee).toHaveBeenCalledTimes(1);
  });

  it('does not show organizer actions for non-organizers', () => {
    const { queryByAccessibilityLabel } = render(
      <AttendeesList
        attendees={mockAttendees}
        eventId="event1"
        isOrganizer={false}
        onCheckIn={mockOnCheckIn}
        onRemoveAttendee={mockOnRemoveAttendee}
      />
    );
    
    // Check-in and remove buttons should not be displayed for non-organizers
    expect(queryByAccessibilityLabel('Check in John Doe')).toBeNull();
    expect(queryByAccessibilityLabel('Remove John Doe from event')).toBeNull();
  });
});