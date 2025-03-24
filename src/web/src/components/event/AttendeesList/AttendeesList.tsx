import React, { useState, useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

import {
  Container,
  ListHeader,
  FilterContainer,
  EmptyStateContainer
} from './AttendeesList.styles';
import Avatar from '../../ui/Avatar';
import Badge from '../../ui/Badge';
import ListItem from '../../ui/ListItem';
import Button from '../../ui/Button';

import { EventAttendee, RSVPStatus } from '../../../types/event.types';

// Define the type for filter options
type FilterOption = 'all' | RSVPStatus.GOING | RSVPStatus.MAYBE | RSVPStatus.NOT_GOING;

// Props for the AttendeesList component
interface AttendeesListProps {
  attendees: EventAttendee[];
  isOrganizer?: boolean;
  eventId: string;
  onCheckIn?: (attendeeId: string) => void;
  onRemoveAttendee?: (attendeeId: string) => void;
}

const AttendeesList = ({
  attendees,
  isOrganizer = false,
  eventId,
  onCheckIn,
  onRemoveAttendee
}: AttendeesListProps): JSX.Element => {
  // State for filtering attendees by RSVP status
  const [filter, setFilter] = useState<FilterOption>('all');

  // Filter attendees based on selected filter
  const filteredAttendees = useMemo(() => {
    if (filter === 'all') {
      return attendees;
    }
    return attendees.filter(attendee => attendee.rsvpStatus === filter);
  }, [attendees, filter]);

  // Render empty state when no attendees match the filter
  const renderEmptyState = () => (
    <EmptyStateContainer>
      <Text>No attendees found matching the selected filter.</Text>
    </EmptyStateContainer>
  );

  // Helper to get the appropriate badge variant for RSVP status
  const getRsvpBadgeVariant = (status: RSVPStatus) => {
    switch (status) {
      case RSVPStatus.GOING:
        return 'success';
      case RSVPStatus.MAYBE:
        return 'warning';
      case RSVPStatus.NOT_GOING:
        return 'error';
      default:
        return 'secondary';
    }
  };

  // Helper to get human-readable RSVP status text
  const getRsvpStatusText = (status: RSVPStatus) => {
    switch (status) {
      case RSVPStatus.GOING:
        return 'Going';
      case RSVPStatus.MAYBE:
        return 'Maybe';
      case RSVPStatus.NOT_GOING:
        return 'Not Going';
      case RSVPStatus.NO_RESPONSE:
        return 'No Response';
      default:
        return 'Unknown';
    }
  };

  // Render an individual attendee item
  const renderAttendeeItem = ({ item }: { item: EventAttendee }) => {
    // Build a description text if the attendee has checked in
    const getDescription = () => {
      if (item.hasCheckedIn && item.checkedInAt) {
        return `Checked in at ${new Date(item.checkedInAt).toLocaleTimeString()}`;
      }
      return undefined;
    };

    return (
      <ListItem
        title={item.profile.name}
        description={getDescription()}
        variant="standard"
        leadingElement={
          <Avatar
            source={item.profile.avatarUrl ? { uri: item.profile.avatarUrl } : undefined}
            name={item.profile.name}
            size="md"
          />
        }
        trailingElement={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Badge
              variant={getRsvpBadgeVariant(item.rsvpStatus)}
              size="sm"
              type="status"
            >
              {getRsvpStatusText(item.rsvpStatus)}
            </Badge>
            
            {isOrganizer && (
              <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                {!item.hasCheckedIn && item.rsvpStatus === RSVPStatus.GOING && onCheckIn && (
                  <Button
                    variant="tertiary"
                    size="sm"
                    onPress={() => onCheckIn(item.userId)}
                    accessibilityLabel={`Check in ${item.profile.name}`}
                  >
                    Check In
                  </Button>
                )}
                
                {item.hasCheckedIn && (
                  <Badge variant="success" size="sm" type="status">
                    Checked In
                  </Badge>
                )}
                
                {onRemoveAttendee && (
                  <Button
                    variant="tertiary"
                    size="sm"
                    onPress={() => onRemoveAttendee(item.userId)}
                    style={{ marginLeft: 8 }}
                    accessibilityLabel={`Remove ${item.profile.name} from event`}
                  >
                    Remove
                  </Button>
                )}
              </View>
            )}
          </View>
        }
        accessibilityLabel={`${item.profile.name}, ${getRsvpStatusText(item.rsvpStatus)}${item.hasCheckedIn ? ', Checked In' : ''}`}
      />
    );
  };

  return (
    <Container>
      <ListHeader>Attendees ({attendees.length})</ListHeader>
      
      <FilterContainer>
        <Button
          variant={filter === 'all' ? 'primary' : 'tertiary'}
          size="sm"
          onPress={() => setFilter('all')}
          accessibilityLabel="Show all attendees"
        >
          All
        </Button>
        <Button
          variant={filter === RSVPStatus.GOING ? 'primary' : 'tertiary'}
          size="sm"
          onPress={() => setFilter(RSVPStatus.GOING)}
          accessibilityLabel="Show only attendees who are going"
        >
          Going
        </Button>
        <Button
          variant={filter === RSVPStatus.MAYBE ? 'primary' : 'tertiary'}
          size="sm"
          onPress={() => setFilter(RSVPStatus.MAYBE)}
          accessibilityLabel="Show only attendees who might be going"
        >
          Maybe
        </Button>
        <Button
          variant={filter === RSVPStatus.NOT_GOING ? 'primary' : 'tertiary'}
          size="sm"
          onPress={() => setFilter(RSVPStatus.NOT_GOING)}
          accessibilityLabel="Show only attendees who are not going"
        >
          Not Going
        </Button>
      </FilterContainer>
      
      <FlatList
        data={filteredAttendees}
        renderItem={renderAttendeeItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        accessibilityLabel={`List of ${filteredAttendees.length} attendees`}
      />
    </Container>
  );
};

export default AttendeesList;