import styled from 'styled-components/native';
import { View, Text, FlatList, Dimensions } from 'react-native';
import { theme, isSmallDevice, getResponsiveSpacing } from '../../../theme';

/**
 * Calculates the width of grid items based on screen width and compact mode
 * @param compact Whether the component is in compact mode
 * @returns Width in pixels for grid items
 */
const getGridItemWidth = (compact: boolean): number => {
  const { width } = Dimensions.get('window');
  const padding = theme.spacing.xs * 2; // Horizontal padding for the list
  const margins = theme.spacing.xs * 2; // Horizontal margins for each item
  
  // Determine number of columns based on screen width and compact mode
  const numColumns = isSmallDevice() 
    ? 2 
    : compact 
      ? 3 
      : width >= 768 
        ? 4 
        : 3;
  
  // Calculate item width based on available space and number of columns
  return (width - padding - (margins * numColumns)) / numColumns;
};

export const Container = styled(View)`
  margin-vertical: ${getResponsiveSpacing('md')}px;
`;

export const Title = styled(Text)`
  font-size: ${theme.typography.heading3.fontSize}px;
  font-weight: ${theme.typography.heading3.fontWeight};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.sm}px;
`;

export const AchievementsList = styled(FlatList)`
  width: 100%;
  ${props => props.layout === 'grid' ? `
    padding-horizontal: ${theme.spacing.xs}px;
  ` : ''}
`;

export const AchievementItem = styled(View)`
  background-color: ${theme.colors.background.paper};
  border-radius: ${theme.borderRadius.md}px;
  overflow: hidden;
  ${theme.shadows.sm}
  margin-bottom: ${theme.spacing.sm}px;
  ${props => props.layout === 'grid' ? `
    width: ${props => getGridItemWidth(props.compact)}px;
    margin-horizontal: ${theme.spacing.xs}px;
    margin-bottom: ${theme.spacing.sm}px;
  ` : `
    flex-direction: row;
    padding: ${theme.spacing.sm}px;
    margin-bottom: ${theme.spacing.xs}px;
  `}
`;

export const AchievementIcon = styled(View)`
  width: ${props => props.layout === 'grid' ? 60 : 50}px;
  height: ${props => props.layout === 'grid' ? 60 : 50}px;
  border-radius: ${props => props.layout === 'grid' ? theme.borderRadius.lg : theme.borderRadius.md}px;
  background-color: ${theme.colors.primary.light};
  align-items: center;
  justify-content: center;
  ${props => props.layout === 'grid' ? `
    margin-top: ${theme.spacing.md}px;
    margin-bottom: ${theme.spacing.sm}px;
    align-self: center;
  ` : `
    margin-right: ${theme.spacing.sm}px;
  `}
`;

export const AchievementContent = styled(View)`
  ${props => props.layout === 'grid' ? `
    padding: ${theme.spacing.sm}px;
    align-items: center;
  ` : `
    flex: 1;
    justify-content: center;
  `}
`;

export const AchievementName = styled(Text)`
  font-size: ${theme.typography.subtitle1.fontSize}px;
  font-weight: ${theme.typography.subtitle1.fontWeight};
  color: ${theme.colors.text.primary};
  ${props => props.layout === 'grid' ? `
    text-align: center;
    margin-bottom: ${theme.spacing.xs}px;
  ` : ''}
`;

export const AchievementDescription = styled(Text)`
  font-size: ${theme.typography.body2.fontSize}px;
  color: ${theme.colors.text.secondary};
  ${props => props.layout === 'grid' ? `
    text-align: center;
    margin-bottom: ${theme.spacing.xs}px;
  ` : ''}
  ${props => props.compact ? `
    display: ${props.layout === 'grid' ? 'none' : 'flex'};
  ` : ''}
`;

export const AchievementDate = styled(Text)`
  font-size: ${theme.typography.caption.fontSize}px;
  color: ${theme.colors.text.tertiary};
  ${props => props.layout === 'grid' ? `
    text-align: center;
    margin-bottom: ${theme.spacing.sm}px;
  ` : ''}
  ${props => props.compact ? `
    display: ${props.layout === 'grid' ? 'none' : 'flex'};
  ` : ''}
`;

export const EmptyStateContainer = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
  background-color: ${theme.colors.background.subtle};
  border-radius: ${theme.borderRadius.md}px;
  margin-vertical: ${theme.spacing.md}px;
`;

export const EmptyStateText = styled(Text)`
  font-size: ${theme.typography.body1.fontSize}px;
  color: ${theme.colors.text.secondary};
  text-align: center;
`;