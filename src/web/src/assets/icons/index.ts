import React from 'react';
import { SvgProps } from 'react-native-svg'; // v13.0.0

// Main navigation icons
export const HomeIcon: React.FC<SvgProps> = (props) => {
  // In a real implementation, this would render actual SVG markup
  return null; // Simplified for this exercise
};

export const DiscoverIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const EventsIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const ChatIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const ProfileIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// UI status icons
export const NotificationIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const SettingsIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Action icons
export const AddIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const CheckIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const CloseIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Navigation icons
export const BackIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const ForwardIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Content icons
export const LocationIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const CalendarIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const ClockIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Status indicators
export const InfoIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const WarningIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const ErrorIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const SuccessIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Content action icons
export const EditIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const DeleteIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const ShareIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const LikeIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const CommentIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// User and group icons
export const GroupIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Media icons
export const CameraIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const GalleryIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Message icons
export const SendIcon: React.FC<SvgProps> = (props) => {
  return null;
};

// Content organization icons
export const FilterIcon: React.FC<SvgProps> = (props) => {
  return null;
};

export const SortIcon: React.FC<SvgProps> = (props) => {
  return null;
};

/**
 * Collection of weather condition icons for event planning
 */
export const WeatherIcons: Record<string, React.FC<SvgProps>> = {
  sunny: (props) => null,
  cloudy: (props) => null,
  rainy: (props) => null,
  snowy: (props) => null,
  stormy: (props) => null,
  partlyCloudy: (props) => null,
  windy: (props) => null,
  foggy: (props) => null,
};

/**
 * Collection of interest category icons for user profiles
 */
export const InterestIcons: Record<string, React.FC<SvgProps>> = {
  outdoorAdventures: (props) => null,
  artsAndCulture: (props) => null,
  foodAndDining: (props) => null,
  sportsAndFitness: (props) => null,
  gamesAndEntertainment: (props) => null,
  learningAndEducation: (props) => null,
  technology: (props) => null,
  wellnessAndMindfulness: (props) => null,
};

/**
 * Collection of achievement icons for gamification
 */
export const AchievementIcons: Record<string, React.FC<SvgProps>> = {
  socialButterfly: (props) => null,
  explorer: (props) => null,
  consistent: (props) => null,
  organizer: (props) => null,
  contributor: (props) => null,
  eventMaster: (props) => null,
  communityBuilder: (props) => null,
};

/**
 * Collection of social media icons for authentication
 */
export const SocialIcons: Record<string, React.FC<SvgProps>> = {
  google: (props) => null,
  apple: (props) => null,
  facebook: (props) => null,
  twitter: (props) => null,
};

// Create a map of all available icons for lookup
const icons: Record<string, React.FC<SvgProps>> = {
  home: HomeIcon,
  discover: DiscoverIcon,
  events: EventsIcon,
  chat: ChatIcon,
  profile: ProfileIcon,
  notification: NotificationIcon,
  settings: SettingsIcon,
  add: AddIcon,
  check: CheckIcon,
  close: CloseIcon,
  back: BackIcon,
  forward: ForwardIcon,
  location: LocationIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  info: InfoIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  success: SuccessIcon,
  edit: EditIcon,
  delete: DeleteIcon,
  share: ShareIcon,
  like: LikeIcon,
  comment: CommentIcon,
  group: GroupIcon,
  camera: CameraIcon,
  gallery: GalleryIcon,
  send: SendIcon,
  filter: FilterIcon,
  sort: SortIcon,
};

// Add collection icons with prefixes
Object.entries(WeatherIcons).forEach(([key, value]) => {
  icons[`weather-${key}`] = value;
});

Object.entries(InterestIcons).forEach(([key, value]) => {
  icons[`interest-${key}`] = value;
});

Object.entries(AchievementIcons).forEach(([key, value]) => {
  icons[`achievement-${key}`] = value;
});

Object.entries(SocialIcons).forEach(([key, value]) => {
  icons[`social-${key}`] = value;
});

/**
 * Array of all available icon names for reference
 */
export const iconNames: string[] = Object.keys(icons);

/**
 * Retrieves an icon component by its name
 * @param name - The name of the icon to retrieve
 * @param props - Optional props to apply to the icon
 * @returns The requested icon component with merged props or undefined if not found
 */
export const getIconByName = (
  name: string,
  props?: SvgProps
): React.FC<SvgProps> | undefined => {
  const IconComponent = icons[name.toLowerCase()];
  if (!IconComponent) return undefined;
  
  return (iconProps: SvgProps) => (
    <IconComponent {...iconProps} {...props} />
  );
};