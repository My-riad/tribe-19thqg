import React from 'react'; // react ^18.2.0
import ChatScreen from './ChatScreen';
// Import the ChatScreen component for re-export

/**
 * Index file that exports the ChatScreen component as the default export,
 * serving as the entry point for the ChatScreen module in the main section
 * of the Tribe application.
 */
const MainChatScreen: React.FC = () => {
  return <ChatScreen />;
};

export default MainChatScreen;
// Re-export the ChatScreen component as the default export for easy importing by other modules