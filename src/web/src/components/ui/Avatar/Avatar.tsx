import React from 'react';
import { Image, ImageSourcePropType, TouchableOpacity, View } from 'react-native';

import {
  AvatarContainer,
  AvatarImage,
  AvatarFallback,
  AvatarInitials,
  AvatarBadge,
  AvatarGroup as StyledAvatarGroup,
} from './Avatar.styles';
import { colors } from '../../../theme';

/**
 * Props for the Avatar component
 */
interface AvatarProps {
  source?: ImageSourcePropType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'circle' | 'rounded' | 'square';
  name?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  backgroundColor?: string;
  onPress?: () => void;
  onError?: () => void;
  onLoad?: () => void;
  loading?: boolean;
  testID?: string;
}

/**
 * Props for the AvatarGroup component
 */
interface AvatarGroupProps {
  avatars: Array<AvatarProps>;
  maxVisible?: number;
  size?: AvatarProps['size'];
  spacing?: number;
  testID?: string;
}

/**
 * Extracts initials from a name string
 * @param name The name to extract initials from
 * @returns Extracted initials (up to 2 characters)
 */
function getInitials(name?: string): string {
  if (!name) return '';

  const words = name.trim().split(' ');
  if (words.length === 0) return '';

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Returns the appropriate color for a status badge
 * @param status The status to get color for
 * @returns Color code for the status
 */
function getStatusColor(status?: string): string {
  switch (status) {
    case 'online':
      return colors.success.main;
    case 'away':
      return colors.warning.main;
    case 'busy':
      return colors.error.main;
    case 'offline':
    default:
      return colors.neutral[400];
  }
}

/**
 * A versatile avatar component that displays user or group images with fallback options
 */
function Avatar({
  source,
  size = 'md',
  variant = 'circle',
  name,
  status,
  backgroundColor,
  onPress,
  onError,
  onLoad,
  loading = false,
  testID,
}: AvatarProps): JSX.Element {
  // Calculate initials from name if provided
  const initials = React.useMemo(() => getInitials(name), [name]);
  
  // Determine background color for fallback display
  const avatarBackgroundColor = backgroundColor || 
    (name ? colors.primary.light : colors.neutral[300]);

  const avatarContent = (
    <AvatarContainer 
      size={size} 
      variant={variant} 
      backgroundColor={avatarBackgroundColor}
      testID={testID}
    >
      {/* If source is provided, render AvatarImage with the image source */}
      {source ? (
        <AvatarImage
          source={source}
          onError={onError}
          onLoad={onLoad}
          style={{ opacity: loading ? 0.5 : 1 }}
        />
      ) : (
        /* If no source, render AvatarFallback with AvatarInitials showing the calculated initials */
        <AvatarFallback backgroundColor={avatarBackgroundColor}>
          <AvatarInitials size={size}>{initials}</AvatarInitials>
        </AvatarFallback>
      )}
      
      {/* If status is provided, render AvatarBadge with the appropriate status color */}
      {status && (
        <AvatarBadge size={size} status={status} />
      )}
    </AvatarContainer>
  );

  // Render TouchableOpacity wrapper if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
}

/**
 * Displays a group of overlapping avatars
 */
function AvatarGroup({
  avatars,
  maxVisible = 3,
  size = 'md',
  spacing = 4,
  testID,
}: AvatarGroupProps): JSX.Element {
  // Calculate how many avatars to display based on maxVisible
  const visibleAvatars = avatars.slice(0, maxVisible);
  
  // Calculate if there are additional avatars not shown
  const remainingCount = avatars.length - maxVisible;

  return (
    <StyledAvatarGroup spacing={spacing} testID={testID}>
      {/* Map through visible avatars and render Avatar components with staggered positioning */}
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index > 0 ? -spacing : 0,
            zIndex: visibleAvatars.length - index,
          }}
        >
          <Avatar
            {...avatar}
            size={size}
            testID={`${testID ? testID : 'avatar-group'}-avatar-${index}`}
          />
        </View>
      ))}
      
      {/* If there are additional avatars, render a count indicator showing +N */}
      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: -spacing,
            zIndex: 0,
          }}
        >
          <Avatar
            size={size}
            backgroundColor={colors.neutral[300]}
            name={`+${remainingCount}`}
            variant="circle"
            testID={`${testID ? testID : 'avatar-group'}-remaining`}
          />
        </View>
      )}
    </StyledAvatarGroup>
  );
}

export default Avatar;
export { AvatarGroup };
export type { AvatarProps, AvatarGroupProps };