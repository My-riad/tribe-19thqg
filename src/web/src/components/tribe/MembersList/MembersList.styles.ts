import styled from 'styled-components';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

/**
 * Available display modes for the members list
 */
export type DisplayMode = 'list' | 'grid' | 'row';

/**
 * Props for styled components that need conditional styling
 */
export interface StyledProps {
  isCreator?: boolean;
  isCurrentUser?: boolean;
  status?: string; // Can be 'active', 'inactive', etc.
}

/**
 * Number of columns to display in grid mode
 */
export const GRID_COLUMNS = 3;

/**
 * Main container for the MembersList component
 */
export const Container = styled(View)`
  width: 100%;
  margin-bottom: ${spacing.lg}px;
`;

/**
 * Styled component for the section title
 */
export const Title = styled(Text)`
  ${typography.textStyles.h3};
  color: ${colors.text.primary};
  margin-bottom: ${spacing.sm}px;
`;

/**
 * Container for the list of members
 */
export const MembersContainer = styled(View)`
  width: 100%;
`;

/**
 * Styled component for individual member items in list mode
 */
export const MemberItem = styled(TouchableOpacity)<StyledProps>`
  flex-direction: row;
  align-items: center;
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.md}px;
  background-color: ${props => 
    props.isCurrentUser ? colors.background.subtle : colors.background.paper
  };
  border-radius: 8px;
  margin-bottom: ${spacing.sm}px;
`;

/**
 * Container for member text information (name, role)
 */
export const MemberInfo = styled(View)`
  flex: 1;
  margin-left: ${spacing.md}px;
`;

/**
 * Styled component for member names
 */
export const MemberName = styled(Text)<StyledProps>`
  ${typography.textStyles.body};
  font-weight: ${props => 
    props.isCreator || props.isCurrentUser ? typography.fontWeight.semiBold : typography.fontWeight.regular
  };
  color: ${colors.text.primary};
`;

/**
 * Styled component for member roles
 */
export const MemberRole = styled(Text)<StyledProps>`
  ${typography.textStyles.caption};
  color: ${props => 
    props.isCreator ? colors.primary.main : colors.text.secondary
  };
  margin-top: ${spacing.xs}px;
`;

/**
 * Container for member avatars
 */
export const AvatarContainer = styled(View)<StyledProps>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${colors.background.subtle};
  justify-content: center;
  align-items: center;
  overflow: hidden;
  ${props => props.isCreator && `
    border-width: 2px;
    border-color: ${colors.primary.main};
  `}
`;

/**
 * Button to expand collapsed member list
 */
export const ViewAllButton = styled(TouchableOpacity)`
  padding-vertical: ${spacing.sm}px;
  padding-horizontal: ${spacing.md}px;
  align-items: center;
  justify-content: center;
  margin-top: ${spacing.xs}px;
`;

/**
 * Text for the view all button
 */
export const ViewAllText = styled(Text)`
  ${typography.textStyles.caption};
  color: ${colors.primary.main};
  font-weight: ${typography.fontWeight.medium};
`;

/**
 * Grid layout for compact member display
 */
export const MembersGrid = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  margin-horizontal: -${spacing.xs}px;
`;

/**
 * Horizontal scrollable row for member display
 */
export const MembersRow = styled(ScrollView).attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: {
    paddingHorizontal: spacing.xs,
  },
})`
  width: 100%;
  margin-vertical: ${spacing.sm}px;
`;

/**
 * Individual member item in grid layout
 */
export const GridItem = styled(TouchableOpacity)<StyledProps>`
  width: ${100 / GRID_COLUMNS}%;
  padding: ${spacing.xs}px;
  align-items: center;
  margin-bottom: ${spacing.sm}px;
`;

/**
 * Individual member item in row layout
 */
export const RowItem = styled(TouchableOpacity)<StyledProps>`
  align-items: center;
  margin-horizontal: ${spacing.xs}px;
  width: 70px;
`;

/**
 * Visual indicator for member status
 */
export const StatusIndicator = styled(View)<StyledProps>`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: ${props => {
    if (props.status === 'active') return colors.success.main;
    if (props.status === 'away') return colors.warning.main;
    if (props.status === 'inactive') return colors.neutral[400];
    return colors.neutral[400];
  }};
  border-width: 1.5px;
  border-color: ${colors.background.paper};
`;