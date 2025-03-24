import React from 'react'; // react v18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v11.5.0
import AchievementsList from './AchievementsList';
import { useProfile } from '../../../hooks/useProfile';
import { Achievement } from '../../../types/profile.types';

// Mock the useProfile hook to control the achievements data returned for testing
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: jest.fn()
}));

/**
 * Creates an array of mock achievement data for testing
 * @param count The number of mock achievements to create
 * @returns An array of mock achievement objects
 */
const mockAchievements = (count: number): Achievement[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `achievement-${i + 1}`,
    userId: 'user-123',
    name: `Achievement ${i + 1}`,
    description: `Description for Achievement ${i + 1}`,
    category: i % 3 === 0 ? 'Social' : i % 3 === 1 ? 'Explorer' : 'Consistent',
    iconUrl: `icon-url-${i + 1}`,
    awardedAt: new Date(),
    pointValue: 10 * (i + 1),
    metadata: {}
  }));
};

describe('AchievementsList', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    (useProfile as jest.Mock).mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    // Mock useProfile hook to return empty achievements array
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });

    // Render AchievementsList component with default props
    render(<AchievementsList />);

    // Verify the component renders with default title
    expect(screen.getByText('Achievements')).toBeDefined();

    // Verify empty state message is displayed
    expect(screen.getByText('No achievements yet. Complete activities and challenges to earn achievements!')).toBeDefined();
  });

  it('renders achievements in list layout', () => {
    // Create mock achievements array
    const achievements = mockAchievements(3);

    // Render AchievementsList with list layout and mock achievements
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList achievements={achievements} layout="list" />);

    // Verify each achievement name and description is displayed
    achievements.forEach(achievement => {
      expect(screen.getByText(achievement.name)).toBeDefined();
      expect(screen.getByText(achievement.description)).toBeDefined();
    });

    // Verify achievements are rendered in list layout
    const list = screen.getByTestId('achievements-list-list');
    expect(list).toBeDefined();
  });

  it('renders achievements in grid layout', () => {
    // Create mock achievements array
    const achievements = mockAchievements(4);

    // Render AchievementsList with grid layout and mock achievements
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList achievements={achievements} layout="grid" />);

    // Verify each achievement name is displayed
    achievements.forEach(achievement => {
      expect(screen.getByText(achievement.name)).toBeDefined();
    });

    // Verify achievements are rendered in grid layout
    const list = screen.getByTestId('achievements-list-list');
    expect(list).toBeDefined();
  });

  it('renders with compact mode', () => {
    // Create mock achievements array
    const achievements = mockAchievements(2);

    // Render AchievementsList with compact mode enabled
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList achievements={achievements} compact />);

    // Verify achievement names are displayed
    achievements.forEach(achievement => {
      expect(screen.getByText(achievement.name)).toBeDefined();
    });

    // Verify achievement descriptions are not displayed in compact mode
    achievements.forEach(achievement => {
      expect(() => screen.getByText(achievement.description)).toThrow();
    });
  });

  it('limits the number of achievements displayed when maxItems is set', () => {
    // Create mock achievements array with more items than the limit
    const achievements = mockAchievements(5);

    // Render AchievementsList with maxItems prop set
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList achievements={achievements} maxItems={3} />);

    // Verify only the specified number of achievements are rendered
    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`Achievement ${i + 1}`)).toBeDefined();
    }
    expect(() => screen.getByText('Achievement 4')).toThrow();
    expect(() => screen.getByText('Achievement 5')).toThrow();
  });

  it('uses achievements from useProfile when not provided via props', () => {
    // Create mock achievements array
    const achievements = mockAchievements(3);

    // Mock useProfile hook to return the mock achievements
    (useProfile as jest.Mock).mockReturnValue({ achievements });

    // Render AchievementsList without providing achievements prop
    render(<AchievementsList />);

    // Verify achievements from useProfile hook are displayed
    achievements.forEach(achievement => {
      expect(screen.getByText(achievement.name)).toBeDefined();
    });
  });

  it('displays custom title when provided', () => {
    // Render AchievementsList with custom title prop
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList title="My Awesome Achievements" />);

    // Verify the custom title is displayed instead of default
    expect(screen.getByText('My Awesome Achievements')).toBeDefined();
    expect(() => screen.getByText('Achievements')).toThrow();
  });

  it('does not show empty state when showEmptyState is false', () => {
    // Render AchievementsList with empty achievements and showEmptyState set to false
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList achievements={[]} showEmptyState={false} />);

    // Verify empty state message is not displayed
    expect(() => screen.getByText('No achievements yet. Complete activities and challenges to earn achievements!')).toThrow();
  });

  it('renders achievement icons correctly based on category', () => {
    // Create mock achievements with different categories
    const achievements = [
      {
        id: 'social-achievement',
        userId: 'user-123',
        name: 'Social Butterfly',
        description: 'Joined 3 tribes',
        category: 'Social',
        iconUrl: 'social-icon',
        awardedAt: new Date(),
        pointValue: 30,
        metadata: {}
      },
      {
        id: 'explorer-achievement',
        userId: 'user-123',
        name: 'Explorer',
        description: 'Attended 5 events',
        category: 'Explorer',
        iconUrl: 'explorer-icon',
        awardedAt: new Date(),
        pointValue: 50,
        metadata: {}
      },
      {
        id: 'consistent-achievement',
        userId: 'user-123',
        name: 'Consistent',
        description: '3-week attendance streak',
        category: 'Consistent',
        iconUrl: 'consistent-icon',
        awardedAt: new Date(),
        pointValue: 40,
        metadata: {}
      }
    ];

    // Render AchievementsList with these achievements
    (useProfile as jest.Mock).mockReturnValue({ achievements: [] });
    render(<AchievementsList achievements={achievements} />);

    // Verify each achievement has the correct icon based on its category
    expect(screen.getByText('\ud83d\udc65')).toBeDefined();
    expect(screen.getByText('\ud83d\uddfa\ufe0f')).toBeDefined();
    expect(screen.getByText('\ud83d\udcc5')).toBeDefined();
  });
});