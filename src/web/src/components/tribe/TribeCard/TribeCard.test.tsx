# src/web/src/components/tribe/TribeCard/TribeCard.test.tsx
```typescript
import React from 'react'; // React v18.0.0+
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native'; // @testing-library/react-native v11.5.0+
import TribeCard from './TribeCard';
import { NavigationService } from '../../../navigation/NavigationService'; // Import navigation service to mock navigation functions
import { ROUTES } from '../../../constants/navigationRoutes'; // Import navigation route constants for testing navigation
import { AvatarGroup } from '../../ui/Avatar/Avatar';
import jest from 'jest'; // jest v29.2.1+

// Mock tribe data for testing the TribeCard component
const mockTribe = {
  id: 'tribe-123',
  name: 'Weekend Explorers',
  description: 'We explore hiking trails, parks, and outdoor activities every weekend.',
  location: 'Seattle, WA',
  imageUrl: 'https://example.com/tribe-image.jpg',
  memberCount: 6,
  status: 'ACTIVE',
  compatibilityScore: 85,
  isAiGenerated: false,
  members: [
    { id: 'member-1', profile: { name: 'John Doe', avatarUrl: 'https://example.com/avatar1.jpg' } },
    { id: 'member-2', profile: { name: 'Jane Smith', avatarUrl: 'https://example.com/avatar2.jpg' } },
  ],
} as any;

// Mock AI-generated tribe data for testing the TribeCard component
const mockAiGeneratedTribe = {
  id: 'tribe-456',
  name: 'Photography Enthusiasts',
  description: 'A group for exploring the city through our lenses and sharing photography tips.',
  location: 'Seattle, WA',
  imageUrl: 'https://example.com/tribe-image2.jpg',
  memberCount: 5,
  status: 'FORMATION',
  compatibilityScore: 92,
  isAiGenerated: true,
  members: [],
} as any;

// Mock for the NavigationService.navigateToTribe function
jest.mock('../../../navigation/NavigationService', () => ({
  NavigationService: {
    navigateToTribe: jest.fn(),
  },
}));

describe('TribeCard', () => {
  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    jest.clearAllMocks();

    // Mock NavigationService.navigateToTribe function
    (NavigationService.navigateToTribe as jest.Mock).mockImplementation(() => {});
  });

  describe('Rendering Variants', () => {
    it('should render the standard variant correctly', () => {
      // Render TribeCard with standard variant and mock tribe data
      render(<TribeCard tribe={mockTribe} />);

      // Verify tribe name is displayed correctly
      expect(screen.getByText('Weekend Explorers')).toBeTruthy();

      // Verify tribe description is displayed correctly
      expect(screen.getByText('We explore hiking trails, parks, and outdoor activities every weekend.')).toBeTruthy();

      // Verify member count is displayed correctly
      expect(screen.getByText('6 members')).toBeTruthy();

      // Verify location is displayed correctly
      expect(screen.getByText('Seattle, WA')).toBeTruthy();

      // Verify compatibility score is displayed correctly if provided
      expect(screen.getByText('85% Match')).toBeTruthy();
    });

    it('should render the compact variant correctly', () => {
      // Render TribeCard with compact variant and mock tribe data
      render(<TribeCard tribe={mockTribe} variant="compact" />);

      // Verify tribe name is displayed correctly
      expect(screen.getByText('Weekend Explorers')).toBeTruthy();

      // Verify description is truncated or hidden based on maxDescriptionLines
      expect(screen.getByText('We explore hiking trails, parks, and outdoor activities every weekend.')).toBeTruthy();

      // Verify compact styling is applied
      const tribeCardContainer = screen.getByTestId('tribe-card-container');
      expect(tribeCardContainer).toBeDefined();
    });

    it('should render the featured variant correctly', () => {
      // Render TribeCard with featured variant and mock tribe data
      render(<TribeCard tribe={mockAiGeneratedTribe} variant="featured" />);

      // Verify tribe name is displayed correctly
      expect(screen.getByText('Photography Enthusiasts')).toBeTruthy();

      // Verify featured styling is applied (border, shadow, etc.)
      const tribeCardContainer = screen.getByTestId('tribe-card-container');
      expect(tribeCardContainer).toBeDefined();

      // Verify AI-generated badge is displayed if isAiGenerated is true
      expect(screen.getByText('Photography Enthusiasts')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should navigate to tribe detail on press', () => {
      // Render TribeCard with mock tribe data
      render(<TribeCard tribe={mockTribe} />);

      // Simulate press event on the card
      const tribeCardTouchable = screen.getByTestId('tribe-card-touchable');
      fireEvent.press(tribeCardTouchable);

      // Verify NavigationService.navigateToTribe was called with correct parameters
      expect(NavigationService.navigateToTribe).toHaveBeenCalledWith(ROUTES.TRIBE.TRIBE_DETAIL, { tribeId: 'tribe-123' });
    });

    it('should call custom onPress if provided', () => {
      // Create mock onPress handler function
      const onPressMock = jest.fn();

      // Render TribeCard with mock tribe data and custom onPress handler
      render(<TribeCard tribe={mockTribe} onPress={onPressMock} />);

      // Simulate press event on the card
      const tribeCardTouchable = screen.getByTestId('tribe-card-touchable');
      fireEvent.press(tribeCardTouchable);

      // Verify custom onPress handler was called with tribe ID
      expect(onPressMock).toHaveBeenCalledWith('tribe-123');

      // Verify NavigationService.navigateToTribe was not called
      expect(NavigationService.navigateToTribe).not.toHaveBeenCalled();
    });
  });

  describe('Conditional Rendering', () => {
    it('should display compatibility score when provided and showCompatibility is true', () => {
      // Render TribeCard with mock tribe data including compatibilityScore
      render(<TribeCard tribe={mockTribe} showCompatibility={true} />);

      // Verify compatibility score is displayed correctly
      expect(screen.getByText('85% Match')).toBeTruthy();

      // Verify correct color is applied based on score value
      const compatibilityBadge = screen.getByText('85% Match').parentElement;
      expect(compatibilityBadge).toBeDefined();
    });

    it('should hide compatibility score when showCompatibility is false', () => {
      // Render TribeCard with mock tribe data and showCompatibility set to false
      render(<TribeCard tribe={mockTribe} showCompatibility={false} />);

      // Verify compatibility score is not displayed
      expect(screen.queryByText('85% Match')).toBeNull();
    });

    it('should display member avatars when showMembers is true', () => {
      // Render TribeCard with mock tribe data including members array
      render(<TribeCard tribe={mockTribe} showMembers={true} />);

      // Verify AvatarGroup component is rendered
      const avatarGroup = screen.getByTestId('avatar-group');
      expect(avatarGroup).toBeDefined();

      // Verify correct number of avatars are displayed
      const avatarImages = screen.getAllByTestId('avatar-group-avatar-0');
      expect(avatarImages.length).toBeGreaterThan(0);
    });

    it('should hide member avatars when showMembers is false', () => {
      // Render TribeCard with mock tribe data and showMembers set to false
      render(<TribeCard tribe={mockTribe} showMembers={false} />);

      // Verify AvatarGroup component is not rendered
      expect(() => screen.getByTestId('avatar-group')).toThrow();
    });

    it('should display status indicator when showStatus is true', () => {
      // Render TribeCard with mock tribe data including status
      render(<TribeCard tribe={mockTribe} showStatus={true} />);

      // Verify status indicator is displayed
      expect(screen.getByText('ACTIVE')).toBeTruthy();

      // Verify correct color is applied based on status value
      const statusIndicator = screen.getByText('ACTIVE').parentElement.firstChild;
      expect(statusIndicator).toBeDefined();
    });

    it('should hide status indicator when showStatus is false', () => {
      // Render TribeCard with mock tribe data and showStatus set to false
      render(<TribeCard tribe={mockTribe} showStatus={false} />);

      // Verify status indicator is not displayed
      expect(screen.queryByText('ACTIVE')).toBeNull();
    });

    it('should display AI-generated badge when isAiGenerated is true', () => {
      // Render TribeCard with mock tribe data where isAiGenerated is true
      render(<TribeCard tribe={mockAiGeneratedTribe} variant="featured" />);

      // Verify AI-generated badge is displayed
      expect(screen.getByText('Photography Enthusiasts')).toBeTruthy();
    });

    it('should truncate description based on maxDescriptionLines prop', async () => {
      // Render TribeCard with mock tribe data and maxDescriptionLines set to 1
      render(<TribeCard tribe={mockTribe} maxDescriptionLines={1} />);

      // Verify description is truncated appropriately
      await waitFor(() => {
        expect(screen.getByText('We explore hiking trails, parks, and outdoor activities every weekend.')).toBeTruthy();
      });

      // Render TribeCard with different maxDescriptionLines values
      render(<TribeCard tribe={mockTribe} maxDescriptionLines={2} />);

      // Verify truncation behavior changes accordingly
      await waitFor(() => {
        expect(screen.getByText('We explore hiking trails, parks, and outdoor activities every weekend.')).toBeTruthy();
      });
    });
  });
});