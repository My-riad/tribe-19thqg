// Barrel file that exports all tribe-related components from a single entry point, simplifying imports throughout the application.
// This file aggregates and re-exports the ActivityFeed, AIPrompt, MembersList, TribeCard, TribeChat, and TribeCreationForm components.

// IE1: Importing the ActivityFeed component from its module.
import ActivityFeed from './ActivityFeed';
// IE1: Importing the AIPrompt component from its module.
import AIPrompt from './AIPrompt';
// IE1: Importing the MembersList component from its module.
import MembersList, { MembersListProps } from './MembersList';
// IE1: Importing the TribeCard component and its props from its module.
import TribeCard, { TribeCardProps } from './TribeCard';
// IE1: Importing the TribeChat component from its module.
import TribeChat from './TribeChat';
// IE1: Importing the TribeCreationForm component and its props from its module.
import { TribeCreationForm, TribeCreationFormProps } from './TribeCreationForm';

// Exporting the ActivityFeed component for use in other modules.
export { ActivityFeed };
// Exporting the AIPrompt component for use in other modules.
export { AIPrompt };
// Exporting the MembersList component for use in other modules.
export { MembersList };
// Exporting the MembersListProps interface for type checking.
export type { MembersListProps };
// Exporting the TribeCard component for use in other modules.
export { TribeCard };
// Exporting the TribeCardProps interface for type checking.
export type { TribeCardProps };
// Exporting the TribeChat component for use in other modules.
export { TribeChat };
// Exporting the TribeCreationForm component for use in other modules.
export { TribeCreationForm };
// Exporting the TribeCreationFormProps interface for type checking.
export type { TribeCreationFormProps };