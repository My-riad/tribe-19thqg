import React, { useState, useEffect, useCallback } from 'react'; // react ^18.0.0
import { ActivityIndicator } from 'react-native'; // react-native ^0.70.0
import { CheckIcon, HelpOutlineIcon, CloseIcon } from '@expo/vector-icons/MaterialIcons'; // @expo/vector-icons/MaterialIcons ^13.0.0

import {
  Container,
  RSVPButton,
  RSVPButtonText,
  RSVPButtonIcon,
} from './RSVPButtons.styles';
import { RSVPStatus } from '../../../types/event.types';
import { useEvents } from '../../../hooks/useEvents';

/**
 * Props for the RSVPButtons component
 */
interface RSVPButtonsProps {
  eventId: string;
  initialStatus?: RSVPStatus;
  onStatusChange?: (status: RSVPStatus) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

/**
 * Component that displays buttons for users to indicate their RSVP status for an event
 */
const RSVPButtons: React.FC<RSVPButtonsProps> = ({
  eventId,
  initialStatus,
  onStatusChange,
  disabled,
  fullWidth,
}) => {
  // Initialize state for the selected RSVP status
  const [selectedStatus, setSelectedStatus] = useState<RSVPStatus>(
    initialStatus || RSVPStatus.NO_RESPONSE
  );

  // Get rsvpToEvent function and loading state from useEvents hook
  const { rsvpToEvent, loading } = useEvents();

  /**
   * Function to handle RSVP button presses and update the RSVP status
   * @param status The new RSVP status
   */
  const handleRSVP = useCallback(
    async (status: RSVPStatus) => {
      // Optimistically update the selected status locally
      setSelectedStatus(status);

      try {
        // Call the rsvpToEvent function to update the RSVP status on the server
        await rsvpToEvent(eventId, status);

        // Call the onStatusChange callback if provided
        if (onStatusChange) {
          onStatusChange(status);
        }
      } catch (error) {
        // If there was an error, revert to the previous status
        setSelectedStatus(selectedStatus);
        console.error('Failed to update RSVP status:', error);
      }
    },
    [eventId, onStatusChange, rsvpToEvent, selectedStatus]
  );

  // Use useEffect to update the local state when initialStatus prop changes
  useEffect(() => {
    setSelectedStatus(initialStatus || RSVPStatus.NO_RESPONSE);
  }, [initialStatus]);

  return (
    <Container fullWidth={fullWidth}>
      <RSVPButton
        status={RSVPStatus.GOING}
        isSelected={selectedStatus === RSVPStatus.GOING}
        onPress={() => handleRSVP(RSVPStatus.GOING)}
        disabled={disabled || loading}
        fullWidth={fullWidth}
      >
        <RSVPButtonIcon>
          {selectedStatus === RSVPStatus.GOING ? (
            <CheckIcon name="check" size={20} color="white" />
          ) : (
            <CheckIcon name="check" size={20} color="black" />
          )}
        </RSVPButtonIcon>
        <RSVPButtonText status={RSVPStatus.GOING} isSelected={selectedStatus === RSVPStatus.GOING} disabled={disabled || loading}>
          {loading && selectedStatus === RSVPStatus.GOING ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            'Going'
          )}
        </RSVPButtonText>
      </RSVPButton>

      <RSVPButton
        status={RSVPStatus.MAYBE}
        isSelected={selectedStatus === RSVPStatus.MAYBE}
        onPress={() => handleRSVP(RSVPStatus.MAYBE)}
        disabled={disabled || loading}
        fullWidth={fullWidth}
      >
        <RSVPButtonIcon>
          {selectedStatus === RSVPStatus.MAYBE ? (
            <HelpOutlineIcon name="help-outline" size={20} color="white" />
          ) : (
            <HelpOutlineIcon name="help-outline" size={20} color="black" />
          )}
        </RSVPButtonIcon>
        <RSVPButtonText status={RSVPStatus.MAYBE} isSelected={selectedStatus === RSVPStatus.MAYBE} disabled={disabled || loading}>
          {loading && selectedStatus === RSVPStatus.MAYBE ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            'Maybe'
          )}
        </RSVPButtonText>
      </RSVPButton>

      <RSVPButton
        status={RSVPStatus.NOT_GOING}
        isSelected={selectedStatus === RSVPStatus.NOT_GOING}
        onPress={() => handleRSVP(RSVPStatus.NOT_GOING)}
        disabled={disabled || loading}
        fullWidth={fullWidth}
      >
        <RSVPButtonIcon>
          {selectedStatus === RSVPStatus.NOT_GOING ? (
            <CloseIcon name="close" size={20} color="white" />
          ) : (
            <CloseIcon name="close" size={20} color="black" />
          )}
        </RSVPButtonIcon>
        <RSVPButtonText status={RSVPStatus.NOT_GOING} isSelected={selectedStatus === RSVPStatus.NOT_GOING} disabled={disabled || loading}>
          {loading && selectedStatus === RSVPStatus.NOT_GOING ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            "Can't Go"
          )}
        </RSVPButtonText>
      </RSVPButton>
    </Container>
  );
};

export default RSVPButtons;