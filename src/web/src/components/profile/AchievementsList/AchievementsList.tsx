import React, { useMemo } from 'react'; // react v18.2.0
import { FlatList, ListRenderItemInfo, View, Text } from 'react-native'; // react-native v0.70.0
import { format } from 'date-fns'; // date-fns v2.29.3

import {
  Container,
  Title,
  AchievementsList as StyledAchievementsList,
  AchievementItem,
  AchievementIcon,
  AchievementContent,
  AchievementName,
  AchievementDescription,
  AchievementDate,
  EmptyStateContainer,
  EmptyStateText,
} from './AchievementsList.styles';
import Badge from '../../ui/Badge/Badge';
import Card from '../../ui/Card/Card';
import { useProfile } from '../../../hooks/useProfile';
import { Achievement } from '../../../types/profile.types';

/**
 * Props interface for the AchievementsList component
 */
export interface AchievementsListProps {
  achievements?: Achievement[];
  title?: string;
  layout?: 'grid' | 'list';
  compact?: boolean;
  maxItems?: number;
  showEmptyState?: boolean;
  testID?: string;
}

/**
 * Default title for the achievements section
 */
const DEFAULT_TITLE = 'Achievements';

/**
 * Message displayed when no achievements are available
 */
const EMPTY_STATE_MESSAGE =
  'No achievements yet. Complete activities and challenges to earn achievements!';

/**
 * Renders an individual achievement item with appropriate styling based on layout
 * @param info - ListRenderItemInfo object containing item data
 * @param layout - Layout style ('grid' or 'list')
 * @param compact - Whether to display in compact mode
 * @returns Rendered achievement item
 */
const renderAchievementItem = (
  info: ListRenderItemInfo<Achievement>,
  layout: string,
  compact: boolean
): JSX.Element => {
  const { item: achievement } = info;
  const awardDate = format(new Date(achievement.awardedAt), 'MMMM dd, yyyy');
  const achievementIcon = getAchievementIcon(achievement.category);

  return (
    <AchievementItem layout={layout} compact={compact}>
      {achievementIcon && (
        <AchievementIcon layout={layout}>
          {achievementIcon}
        </AchievementIcon>
      )}
      <AchievementContent layout={layout}>
        <AchievementName layout={layout}>{achievement.name}</AchievementName>
        <AchievementDescription layout={layout} compact={compact}>
          {achievement.description}
        </AchievementDescription>
        <AchievementDate layout={layout} compact={compact}>
          Awarded on {awardDate}
        </AchievementDate>
      </AchievementContent>
    </AchievementItem>
  );
};

/**
 * Returns the appropriate icon component based on achievement category
 * @param category - Achievement category
 * @returns Icon component for the achievement
 */
const getAchievementIcon = (category: string): JSX.Element => {
  switch (category) {
    case 'Social':
      return <Badge type="achievement" variant="primary" icon={<Text>👥</Text>} />;
    case 'Explorer':
      return <Badge type="achievement" variant="secondary" icon={<Text>🗺️</Text>} />;
    case 'Consistent':
      return <Badge type="achievement" variant="success" icon={<Text>📅</Text>} />;
    default:
      return <Badge type="achievement" variant="warning" icon={<Text>🏆</Text>} />;
  }
};

/**
 * Component that displays a list of user achievements in either grid or list layout
 * @param props - AchievementsListProps object
 * @returns Rendered AchievementsList component
 */
const AchievementsList: React.FC<AchievementsListProps> = ({
  achievements,
  title = DEFAULT_TITLE,
  layout = 'list',
  compact = false,
  maxItems,
  showEmptyState = true,
  testID = 'achievements-list',
}) => {
  const { achievements: profileAchievements } = useProfile();

  // Use achievements from profile state if not provided via props
  const achievementData = useMemo(() => {
    return achievements || profileAchievements || [];
  }, [achievements, profileAchievements]);

  // Apply maxItems limit if specified
  const limitedAchievements = useMemo(() => {
    return maxItems ? achievementData.slice(0, maxItems) : achievementData;
  }, [achievementData, maxItems]);

  // Render item function for FlatList
  const renderItem = (info: ListRenderItemInfo<Achievement>) =>
    renderAchievementItem(info, layout, compact);

  // Render empty state if no achievements and showEmptyState is true
  if (limitedAchievements.length === 0 && showEmptyState) {
    return (
      <Container testID={testID}>
        <Title>{title}</Title>
        <EmptyStateContainer>
          <EmptyStateText>{EMPTY_STATE_MESSAGE}</EmptyStateText>
        </EmptyStateContainer>
      </Container>
    );
  }

  return (
    <Container testID={testID}>
      <Title>{title}</Title>
      <StyledAchievementsList
        data={limitedAchievements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={layout === 'grid' ? 2 : 1}
        horizontal={layout === 'list'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        layout={layout}
        compact={compact}
        testID={`${testID}-list`}
      />
    </Container>
  );
};

export default AchievementsList;
export type { AchievementsListProps };