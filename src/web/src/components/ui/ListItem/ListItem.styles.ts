import styled from 'styled-components/native';
import { Animated, View, Text } from 'react-native';
import { theme } from '../../../theme';

// Types
export type ListItemSize = 'sm' | 'md' | 'lg';
export type ListItemDensity = 'default' | 'compact';
export type ListItemPosition = 'first' | 'middle' | 'last' | 'single';

export interface ListItemSizeStyles {
  padding: number;
  paddingVertical: number;
  minHeight: number;
}

export interface PositionStyles {
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
}

// Helper functions
export const getListItemSizeStyles = (
  size: ListItemSize = 'md',
  density: ListItemDensity = 'default'
): ListItemSizeStyles => {
  let padding = theme.spacing.md;
  let minHeight = 48;
  
  if (size === 'sm') {
    padding = theme.spacing.sm;
    minHeight = 40;
  } else if (size === 'lg') {
    padding = theme.spacing.lg;
    minHeight = 56;
  }
  
  const paddingVertical = density === 'compact' ? padding / 2 : padding;
  
  return {
    padding,
    paddingVertical,
    minHeight
  };
};

export const getPositionStyles = (position?: ListItemPosition): PositionStyles => {
  const borderRadius = 8;
  
  if (!position || position === 'single') {
    return {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
    };
  }
  
  if (position === 'first') {
    return {
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  }
  
  if (position === 'last') {
    return {
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
    };
  }
  
  return {};
};

// Styled Components
export const ListItemContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  background-color: ${theme.colors.background.paper};
  ${props => getListItemSizeStyles(props.size, props.density)}
  ${props => getPositionStyles(props.position)}
  ${props => props.selected ? `background-color: ${theme.colors.primary.light}20;` : ''}
  ${props => props.disabled ? `opacity: 0.5;` : ''}
  ${props => props.borderBottom ? `border-bottom-width: 1px; border-bottom-color: ${theme.colors.border.light};` : ''}
`;

export const InteractiveListItemContainer = styled(Animated.View)`
  flex-direction: row;
  align-items: center;
  background-color: ${theme.colors.background.paper};
  ${props => getListItemSizeStyles(props.size, props.density)}
  ${props => getPositionStyles(props.position)}
  ${props => props.selected ? `background-color: ${theme.colors.primary.light}20;` : ''}
  ${props => props.disabled ? `opacity: 0.5;` : ''}
  ${props => props.borderBottom ? `border-bottom-width: 1px; border-bottom-color: ${theme.colors.border.light};` : ''}
`;

export const ExpandableListItemContainer = styled(View)`
  background-color: ${theme.colors.background.paper};
  ${props => getPositionStyles(props.position)}
  ${props => props.selected ? `background-color: ${theme.colors.primary.light}20;` : ''}
  ${props => props.disabled ? `opacity: 0.5;` : ''}
  ${props => props.borderBottom ? `border-bottom-width: 1px; border-bottom-color: ${theme.colors.border.light};` : ''}
`;

export const ListItemContent = styled(View)`
  flex: 1;
  justify-content: center;
  margin-right: ${theme.spacing.sm}px;
`;

export const ListItemTitle = styled(Text)`
  ${theme.typography.textStyles.body}
  color: ${theme.colors.text.primary};
`;

export const ListItemDescription = styled(Text)`
  ${theme.typography.textStyles.caption}
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.xs}px;
`;

export const ListItemLeading = styled(View)`
  margin-right: ${theme.spacing.md}px;
  justify-content: center;
  align-items: center;
`;

export const ListItemTrailing = styled(View)`
  margin-left: ${theme.spacing.sm}px;
  justify-content: center;
  align-items: center;
`;

export const ListItemDivider = styled(View)`
  height: 1px;
  background-color: ${theme.colors.border.light};
  margin-left: ${props => props.inset ? theme.spacing.xl : 0}px;
`;

export const ExpandedContent = styled(View)`
  padding: ${theme.spacing.md}px;
  padding-top: 0;
  background-color: ${theme.colors.background.subtle};
`;