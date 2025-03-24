import React from 'react'; // React v18.0.0+
import { View, Text, Image, TouchableOpacity } from 'react-native'; // React Native v0.70.0+

import {
  TribeCardContainer,
  TribeCardTouchable,
  TribeImageContainer,
  TribeImage,
  TribeContent,
  TribeName,
  TribeDescription,
  TribeMeta,
  TribeMetaText,
  TribeFooter,
  CompatibilityBadge,
  StatusIndicator,
  InterestTagsContainer,
} from './TribeCard.styles';
import { Tribe, TribeStatus } from '../../../types/tribe.types';
import Badge from '../../ui/Badge/Badge';
import { Avatar, AvatarGroup } from '../../ui/Avatar/Avatar';
import { NavigationService } from '../../../navigation/NavigationService';
import { ROUTES } from '../../../constants/navigationRoutes';
import { useTribes } from '../../../hooks/useTribes';

/**
 * Interface defining the props for the TribeCard component
 */
interface TribeCardProps {
  tribe: Tribe;
  variant?: 'standard' | 'compact' | 'featured';
  onPress?: (tribeId: string) => void;
  showCompatibility?: boolean;
  showMembers?: boolean;
  showStatus?: boolean;
  maxDescriptionLines?: number;
  testID?: string;
}

/**
 * A card component that displays tribe information and handles navigation to tribe details
 * @param props - The props object containing tribe data and configuration options
 * @returns Rendered TribeCard component
 */
const TribeCard: React.FC<TribeCardProps> = (props) => {
  // LD1: Destructure props including tribe data, variant, onPress, etc.
  const {
    tribe,
    variant = 'standard',
    onPress,
    showCompatibility = true,
    showMembers = true,
    showStatus = true,
    maxDescriptionLines = 2,
    testID,
  } = props;

  // LD1: Extract tribe properties like name, description, memberCount, location, etc.
  const {
    id,
    name,
    description,
    memberCount,
    location,
    imageUrl,
    compatibilityScore,
    status,
    members,
    primaryInterests,
  } = tribe;

  // LD1: Define handlePress function to navigate to tribe details when card is tapped
  const handlePress = () => {
    // IE1: Check that NavigationService.navigateToTribe is used correctly based on the source files provided to you.
    NavigationService.navigateToTribe(ROUTES.TRIBE.TRIBE_DETAIL, { tribeId: id });
  };

  // LD1: Function to format the member count with appropriate text
  const formatMemberCount = (count: number): string => {
    return `${count} member${count !== 1 ? 's' : ''}`;
  };

  // LD1: Function to truncate description text to a specified length
  const truncateDescription = (description: string, maxLength: number): string => {
    if (description.length > maxLength) {
      return description.substring(0, maxLength) + '...';
    }
    return description;
  };

  // LD1: Render TribeCardContainer with appropriate variant
  return (
    <TribeCardContainer variant={variant} testID={testID}>
      {/* LD1: Render TribeCardTouchable to make the card interactive */}
      <TribeCardTouchable onPress={onPress ? () => onPress(id) : handlePress} accessible={true} accessibilityRole="button">
        {/* LD1: Render TribeImageContainer with TribeImage if imageUrl is available */}
        {imageUrl && (
          <TribeImageContainer variant={variant}>
            <TribeImage source={{ uri: imageUrl }} />
          </TribeImageContainer>
        )}

        {/* LD1: Render TribeContent with TribeName, TribeDescription, and TribeMeta */}
        <TribeContent>
          <TribeName>{name}</TribeName>
          <TribeDescription numberOfLines={maxDescriptionLines}>{description}</TribeDescription>
          <TribeMeta>
            {/* LD1: Render status indicator if showStatus is true */}
            {showStatus && status && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <StatusIndicator status={status} />
                <TribeMetaText>{status}</TribeMetaText>
              </View>
            )}
            <TribeMetaText>{formatMemberCount(memberCount)}</TribeMetaText>
            <TribeMetaText>{truncateDescription(location, 20)}</TribeMetaText>
          </TribeMeta>
        </TribeContent>

        {/* LD1: Render TribeFooter with compatibility score if available */}
        <TribeFooter hasBorder={showCompatibility || showMembers}>
          {showCompatibility && compatibilityScore !== undefined && (
            <CompatibilityBadge score={compatibilityScore}>
              <Text style={{ color: 'white' }}>{compatibilityScore}% Match</Text>
            </CompatibilityBadge>
          )}

          {/* LD1: Render member avatars using AvatarGroup if members are available */}
          {showMembers && members && members.length > 0 && (
            <AvatarGroup
              avatars={members.map((member) => ({
                source: member.profile.avatarUrl,
                name: member.profile.name,
              }))}
            />
          )}
        </TribeFooter>
      </TribeCardTouchable>
    </TribeCardContainer>
  );
};

/**
 * Formats the member count with appropriate text
 * @param count - The number of members
 * @returns Formatted member count text
 */
const formatMemberCount = (count: number): string => {
  return `${count} member${count !== 1 ? 's' : ''}`;
};

/**
 * Truncates description text to a specified length
 * @param description - The description text
 * @param maxLength - The maximum length of the description
 * @returns Truncated description with ellipsis if needed
 */
const truncateDescription = (description: string, maxLength: number): string => {
  if (description.length > maxLength) {
    return description.substring(0, maxLength) + '...';
  }
  return description;
};

export default TribeCard;