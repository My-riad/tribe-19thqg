import React, { useState, useCallback, useMemo } from 'react'; // react ^18.2.0
import { FlatList, TouchableOpacity, View, Text } from 'react-native'; // react-native ^0.70.0

import Avatar, { AvatarGroup } from '../../ui/Avatar';
import Badge from '../../ui/Badge';
import ListItem from '../../ui/ListItem';
import useAuth from '../../../hooks/useAuth';
import useTribes from '../../../hooks/useTribes';
import { TribeMember, MemberRole, MemberStatus } from '../../../types/tribe.types';
import { 
  Container, 
  Title, 
  MembersContainer, 
  MemberItem, 
  MemberInfo, 
  MemberName, 
  AvatarContainer,
  ViewAllButton,
  ViewAllText,
  MembersGrid,
  MembersRow,
  GridItem,
  RowItem,
  StatusIndicator,
  StyledProps
} from './MembersList.styles';
import { DisplayMode, GRID_COLUMNS } from './MembersList.styles';

/**
 * Interface defining the props for the MembersList component
 */
interface MembersListProps {
  members: TribeMember[];
  title?: string;
  displayMode?: DisplayMode;
  maxVisible?: number;
  onMemberPress?: (member: TribeMember) => void;
  selectedMemberId?: string;
  showRoles?: boolean;
  collapsible?: boolean;
  tribeId?: string;
  testID?: string;
}

/**
 * A component that displays a list of tribe members with various display options
 */
const MembersList = ({
  members,
  title,
  displayMode = 'list',
  maxVisible = 5,
  onMemberPress,
  selectedMemberId,
  showRoles = true,
  collapsible = false,
  tribeId,
  testID
}: MembersListProps): JSX.Element => {
  // Get current user information using useAuth hook
  const { user } = useAuth();

  // Get tribe-related functions using useTribes hook
  const { getTribeMembers } = useTribes();

  // Set up state for expanded view when collapsible is true
  const [expanded, setExpanded] = useState(false);

  // Calculate visible members based on maxVisible and expanded state
  const visibleMembers = useMemo(() => {
    if (!collapsible || expanded) {
      return members;
    } else {
      return members.slice(0, maxVisible);
    }
  }, [members, collapsible, expanded, maxVisible]);

  // Create a memoized function to handle member selection
  const handleMemberPress = useCallback((member: TribeMember) => {
    if (onMemberPress) {
      onMemberPress(member);
    }
  }, [onMemberPress]);

  // Create a memoized function to get role badge for each member
  const getRoleBadge = useCallback((role: MemberRole) => {
    switch (role) {
      case MemberRole.CREATOR:
        return <Badge variant="primary">Creator</Badge>;
      case MemberRole.ADMIN:
        return <Badge variant="secondary">Admin</Badge>;
      case MemberRole.MEMBER:
        return showRoles ? <Badge>Member</Badge> : null;
      default:
        return null;
    }
  }, [showRoles]);

  // Create a memoized function to get status indicator for each member
  const getStatusIndicator = useCallback((status: MemberStatus) => {
    switch (status) {
      case MemberStatus.ACTIVE:
        return <StatusIndicator status="active" />;
      case MemberStatus.INACTIVE:
        return <StatusIndicator status="inactive" />;
      default:
        return <StatusIndicator status="inactive" />;
    }
  }, []);

  // Render the appropriate layout based on displayMode
  if (displayMode === 'list') {
    return (
      <Container testID={testID}>
        {title && <Title>{title}</Title>}
        <MembersContainer>
          {visibleMembers.map((member) => (
            <ListItem
              key={member.id}
              title={member.profile.name}
              description={showRoles ? member.role : undefined}
              leadingElement={
                <AvatarContainer isCreator={member.role === MemberRole.CREATOR} testID={`${testID}-avatar-${member.profile.name}`}>
                  <Avatar source={{ uri: member.profile.avatarUrl }} name={member.profile.name} />
                  {getStatusIndicator(member.status)}
                </AvatarContainer>
              }
              trailingElement={getRoleBadge(member.role)}
              onPress={() => handleMemberPress(member)}
              selected={selectedMemberId === member.id}
              testID={`${testID}-member-item-${member.profile.name}`}
            />
          ))}
          {collapsible && members.length > maxVisible && !expanded && (
            <ViewAllButton onPress={() => setExpanded(true)} testID={`${testID}-view-all-button`}>
              <ViewAllText>View All</ViewAllText>
            </ViewAllButton>
          )}
        </MembersContainer>
      </Container>
    );
  } else if (displayMode === 'grid') {
    return (
      <Container testID={testID}>
        {title && <Title>{title}</Title>}
        <MembersGrid>
          {visibleMembers.map((member, index) => (
            <GridItem key={member.id} onPress={() => handleMemberPress(member)} testID={`${testID}-grid-item-${index}`}>
              <AvatarContainer testID={`${testID}-avatar-${member.profile.name}`}>
                <Avatar source={{ uri: member.profile.avatarUrl }} name={member.profile.name} size="sm" />
                {getStatusIndicator(member.status)}
              </AvatarContainer>
              <MemberName>{member.profile.name}</MemberName>
            </GridItem>
          ))}
        </MembersGrid>
      </Container>
    );
  } else if (displayMode === 'row') {
    return (
      <Container testID={testID}>
        {title && <Title>{title}</Title>}
        <MembersRow>
          {visibleMembers.map((member, index) => (
            <RowItem key={member.id} onPress={() => handleMemberPress(member)} testID={`${testID}-row-item-${index}`}>
              <AvatarContainer testID={`${testID}-avatar-${member.profile.name}`}>
                <Avatar source={{ uri: member.profile.avatarUrl }} name={member.profile.name} size="sm" />
                {getStatusIndicator(member.status)}
              </AvatarContainer>
              <MemberName>{member.profile.name}</MemberName>
            </RowItem>
          ))}
        </MembersRow>
      </Container>
    );
  } else {
    return <Text>Invalid Display Mode</Text>;
  }
};

export default MembersList;