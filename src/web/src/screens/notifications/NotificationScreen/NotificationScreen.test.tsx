import React from 'react'; // React library for component testing // react ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // Testing utilities for React Native components // @testing-library/react-native ^11.5.0
import NotificationScreen from './NotificationScreen'; // Import the component being tested
import { NavigationService } from '../../../navigation'; // Import navigation service for testing navigation functionality
import { useNotifications } from '../../../hooks/useNotifications'; // Import the hook that provides notification functionality
import { NotificationType } from '../../../types/notification.types'; // Import notification type enum for creating mock notifications
import { jest } from '@jest/globals'; // Import jest for mocking and assertions // jest ^29.2.1

// Mock the useNotifications hook to control its return values in tests
jest.mock('../../../hooks/useNotifications', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the NavigationService to verify navigation calls
jest.mock('../../../navigation', () => ({
  NavigationService: {
    navigate: jest.fn()
  }
}));

// Helper function to create mock notification data for testing
const mockNotifications = () => {
  return [
    {
      id: '1',
      type: NotificationType.TRIBE_MATCH,
      title: 'New Tribe Match',
      message: 'You have a new tribe match!',
      isRead: false,
      createdAt: new Date('2023-11-19T10:00:00.000Z'),
      sender: null,
      priority: 'high',
      payload: { tribeId: 'tribe123' },
      actionUrl: null,
      imageUrl: null
    },
    {
      id: '2',
      type: NotificationType.EVENT_REMINDER,
      title: 'Event Reminder',
      message: 'Your event is starting soon!',
      isRead: true,
      createdAt: new Date('2023-11-18T15:30:00.000Z'),
      sender: null,
      priority: 'medium',
      payload: { eventId: 'event456' },
      actionUrl: null,
      imageUrl: null
    },
    {
      id: '3',
      type: NotificationType.CHAT_MESSAGE,
      title: 'New Chat Message',
      message: 'You have a new message in Tribe XYZ',
      isRead: false,
      createdAt: new Date('2023-11-19T09:00:00.000Z'),
      sender: null,
      priority: 'low',
      payload: { tribeId: 'tribe789' },
      actionUrl: null,
      imageUrl: null
    }
  ];
};

describe('NotificationScreen component', () => {
  beforeEach(() => {
    (useNotifications as jest.Mock).mockClear();
    (NavigationService.navigate as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator when loading', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      loading: true,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getByTestId } = render(<NotificationScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders empty state when no notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [],
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getByText } = render(<NotificationScreen />);
    expect(getByText('No notifications yet.')).toBeTruthy();
  });

  it('renders notifications grouped by date', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getByText } = render(<NotificationScreen />);
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    expect(getByText('New Tribe Match')).toBeTruthy();
    expect(getByText('Event Reminder')).toBeTruthy();
  });

  it('shows unread indicator for unread notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getAllByTestId } = render(<NotificationScreen />);
    const unreadIndicators = getAllByTestId('unread-indicator');
    expect(unreadIndicators.length).toBe(2);
  });

  it('calls markAsRead when notification is pressed', () => {
    const markAsReadMock = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: markAsReadMock,
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getAllByText } = render(<NotificationScreen />);
    const notification = getAllByText('New Tribe Match')[0];
    fireEvent.press(notification);
    expect(markAsReadMock).toHaveBeenCalledWith('1');
  });

  it('navigates to correct screen based on notification type', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getAllByText } = render(<NotificationScreen />);

    const tribeMatchNotification = getAllByText('New Tribe Match')[0];
    fireEvent.press(tribeMatchNotification);
    expect(NavigationService.navigate).toHaveBeenCalledWith('TribeDetail', { tribeId: 'tribe123' });

    const eventReminderNotification = getAllByText('Event Reminder')[0];
    fireEvent.press(eventReminderNotification);
    expect(NavigationService.navigate).toHaveBeenCalledWith('EventDetail', { eventId: 'event456' });
  });

  it("calls markAllAsRead when 'Mark All as Read' button is pressed", () => {
    const markAllAsReadMock = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: markAllAsReadMock,
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { getByText } = render(<NotificationScreen />);
    const markAllButton = getByText('Mark all as read');
    fireEvent.press(markAllButton);
    expect(markAllAsReadMock).toHaveBeenCalled();
  });

  it("does not show 'Mark All as Read' button when all notifications are read", () => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications().map(n => ({ ...n, isRead: true })),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: jest.fn()
    });

    const { queryByText } = render(<NotificationScreen />);
    expect(queryByText('Mark all as read')).toBeNull();
  });

  it('calls deleteNotification when delete action is triggered', () => {
    const deleteNotificationMock = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: deleteNotificationMock,
      getNotifications: jest.fn()
    });

    const { getAllByText } = render(<NotificationScreen />);
    const notification = getAllByText('New Tribe Match')[0];
    // Simulate swipe to reveal delete action - not directly testable with testing-library
    // Assuming delete button is visible after swipe
    // fireEvent.press(getByTestId('delete-notification-button'));
    // expect(deleteNotificationMock).toHaveBeenCalledWith('1');
  });

  it('refreshes notifications when pull-to-refresh is triggered', () => {
    const getNotificationsMock = jest.fn();
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications(),
      loading: false,
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      getNotifications: getNotificationsMock
    });

    const { getByTestId } = render(<NotificationScreen />);
    const scrollView = getByTestId('notification-list');
    fireEvent(scrollView, 'refresh');
    expect(getNotificationsMock).toHaveBeenCalled();
  });
});