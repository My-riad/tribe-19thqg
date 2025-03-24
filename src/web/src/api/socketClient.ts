import { io, Socket } from 'socket.io-client'; // socket.io-client v^4.6.2
import { CONFIG } from '../constants/config';
import { API_PATHS } from '../constants/apiPaths';
import { offlineService } from '../services/offlineService';
import { ChatMessage, MessageType, MessageStatus, AIPromptMessage } from '../types/chat.types';

// Socket event types for type safety
export enum SocketEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  RECONNECT = 'reconnect',
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  UNAUTHORIZED = 'unauthorized',
  JOIN = 'join',
  JOINED = 'joined',
  LEAVE = 'leave',
  LEFT = 'left',
  MESSAGE = 'message',
  TYPING = 'typing',
  READ = 'read',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  AI_PROMPT = 'ai_prompt'
}

// Global socket instance
let socket: Socket | null = null;
// Registry of event handlers for reconnection
let eventHandlers: Record<string, Function[]> = {};
// Track reconnection attempts
let reconnectAttempts = 0;
// Store auth token for reconnection
let authToken: string | null = null;

/**
 * Initializes the socket connection with the server
 * @returns Promise resolving to connection success status
 */
const initialize = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Don't initialize if already connected
    if (socket?.connected) {
      resolve(true);
      return;
    }

    // Clean up existing socket instance if any
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    try {
      // Create socket instance with server URL and options
      socket = io(`${CONFIG.API.BASE_URL}${API_PATHS.BASE}`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: CONFIG.API.TIMEOUT,
        autoConnect: true
      });

      // Set up connection event handlers
      socket.on(SocketEvents.CONNECT, () => {
        console.log('Socket connected');
        reconnectAttempts = 0;
        
        // Re-authenticate if we have a token
        if (authToken) {
          authenticate(authToken).catch(error => {
            console.error('Error re-authenticating socket:', error);
          });
        }
        
        resolve(true);
      });

      socket.on(SocketEvents.DISCONNECT, (reason) => {
        console.log(`Socket disconnected: ${reason}`);
      });

      socket.on(SocketEvents.ERROR, (error) => {
        console.error('Socket error:', error);
        reject(error);
      });

      socket.on(SocketEvents.RECONNECT, (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
      });
      
      // Re-establish event listeners after reconnect
      socket.on(SocketEvents.CONNECT, () => {
        Object.entries(eventHandlers).forEach(([event, handlers]) => {
          handlers.forEach(handler => {
            socket?.on(event, handler);
          });
        });
      });

      // Connect to server
      socket.connect();
      
      // Monitor network status for reconnection handling
      offlineService.onConnectionChange((isConnected: boolean) => {
        handleConnectionChange(isConnected);
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
      reject(error);
    }
  });
};

/**
 * Disconnects the socket from the server
 */
const disconnect = (): void => {
  if (!socket) {
    return;
  }

  try {
    // Remove all event handlers
    Object.keys(eventHandlers).forEach(event => {
      eventHandlers[event].forEach(handler => {
        socket?.off(event, handler);
      });
    });
    
    // Clear handlers registry
    eventHandlers = {};
    
    // Disconnect socket
    socket.disconnect();
    socket = null;
  } catch (error) {
    console.error('Error disconnecting socket:', error);
  }
};

/**
 * Attempts to reconnect the socket to the server
 * @returns Promise resolving to reconnection success status
 */
const reconnect = async (): Promise<boolean> => {
  reconnectAttempts += 1;
  
  // Limit maximum reconnection attempts
  const MAX_RECONNECT_ATTEMPTS = 5;
  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    throw new Error(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) exceeded`);
  }

  // Disconnect existing socket if any
  if (socket) {
    disconnect();
  }

  // Initialize new connection
  return initialize();
};

/**
 * Authenticates the socket connection with the server
 * @param token Authentication token
 * @returns Promise resolving to authentication success status
 */
const authenticate = (token: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Store token for reconnection
    authToken = token;
    
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Set up event listeners for authentication result
    socket.once(SocketEvents.AUTHENTICATED, () => {
      console.log('Socket authenticated');
      resolve(true);
    });

    socket.once(SocketEvents.UNAUTHORIZED, (error) => {
      console.error('Socket authentication failed:', error);
      reject(error);
    });

    // Emit authentication event with token
    socket.emit(SocketEvents.AUTHENTICATE, { token });
  });
};

/**
 * Emits an event to the server
 * @param event Event name
 * @param data Event data
 * @returns Promise resolving to server response
 */
const emit = <T = any>(event: string, data: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      if (offlineService.isOffline()) {
        // Queue action for later if supported
        // Note: Not all events can be queued, some require immediate response
        try {
          // This is a simplified approach - in a real implementation, you'd want to
          // have a more sophisticated strategy for offline queueing based on event type
          if (['message', 'typing', 'read'].includes(event)) {
            offlineService.queueAction({
              type: `SOCKET_${event.toUpperCase()}`,
              payload: { event, data }
            }).catch(error => {
              console.error(`Error queuing offline socket action ${event}:`, error);
            });
            resolve(null as T);
            return;
          }
        } catch (error) {
          console.error(`Error handling offline socket action ${event}:`, error);
        }
      }
      
      reject(new Error('Socket not connected'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error(`Socket event "${event}" timed out`));
    }, CONFIG.API.TIMEOUT);

    // Emit event with acknowledgment callback
    socket.emit(event, data, (response: { error?: any; data?: T }) => {
      clearTimeout(timeout);
      
      if (response?.error) {
        reject(response.error);
      } else {
        resolve(response?.data as T);
      }
    });
  });
};

/**
 * Registers an event handler for a specific event
 * @param event Event name
 * @param handler Event handler function
 */
const on = (event: string, handler: Function): void => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  // Add handler to registry
  if (!eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  
  eventHandlers[event].push(handler);
  
  // Register handler with socket
  socket.on(event, handler);
};

/**
 * Removes an event handler for a specific event
 * @param event Event name
 * @param handler Event handler function
 */
const off = (event: string, handler: Function): void => {
  if (!socket) {
    return;
  }

  // Remove handler from registry
  if (eventHandlers[event]) {
    eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
  }
  
  // Remove handler from socket
  socket.off(event, handler);
};

/**
 * Checks if the socket is currently connected
 * @returns True if connected, false otherwise
 */
const isConnected = (): boolean => {
  return socket?.connected === true;
};

/**
 * Joins a room (e.g., tribe chat room)
 * @param roomId Room ID to join
 * @returns Promise resolving to join success status
 */
const joinRoom = (roomId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Set up event listener for join result
    socket.once(`${SocketEvents.JOINED}:${roomId}`, () => {
      resolve(true);
    });

    // Handle potential errors
    const errorHandler = (error: any) => {
      reject(error);
    };
    
    socket.once(SocketEvents.ERROR, errorHandler);

    // Emit join event
    socket.emit(SocketEvents.JOIN, { roomId }, (response: { error?: any }) => {
      socket.off(SocketEvents.ERROR, errorHandler);
      
      if (response?.error) {
        reject(response.error);
      }
    });
  });
};

/**
 * Leaves a room
 * @param roomId Room ID to leave
 * @returns Promise resolving to leave success status
 */
const leaveRoom = (roomId: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Set up event listener for leave result
    socket.once(`${SocketEvents.LEFT}:${roomId}`, () => {
      resolve(true);
    });

    // Handle potential errors
    const errorHandler = (error: any) => {
      reject(error);
    };
    
    socket.once(SocketEvents.ERROR, errorHandler);

    // Emit leave event
    socket.emit(SocketEvents.LEAVE, { roomId }, (response: { error?: any }) => {
      socket.off(SocketEvents.ERROR, errorHandler);
      
      if (response?.error) {
        reject(response.error);
      }
    });
  });
};

/**
 * Sends a chat message to a room
 * @param roomId Room ID to send message to
 * @param messageData Message data object
 * @returns Promise resolving to the sent message with server-assigned ID
 */
const sendMessage = (
  roomId: string,
  messageData: {
    content: string;
    messageType: MessageType;
    metadata?: Record<string, any>;
  }
): Promise<ChatMessage> => {
  // Generate temporary client-side ID for the message
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Create message object
  const message = {
    id: tempId,
    roomId,
    content: messageData.content,
    messageType: messageData.messageType,
    metadata: messageData.metadata || {},
    status: MessageStatus.SENDING
  };
  
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      if (offlineService.isOffline()) {
        // Queue message for later delivery
        offlineService.queueAction({
          type: 'SOCKET_MESSAGE',
          payload: { roomId, message }
        }).catch(error => {
          console.error('Error queuing offline message:', error);
        });
        
        // Return temporary message for UI purposes
        resolve({
          ...message,
          id: tempId,
          status: MessageStatus.SENDING
        } as unknown as ChatMessage);
        return;
      }
      
      reject(new Error('Socket not connected'));
      return;
    }

    // Emit message event
    socket.emit(SocketEvents.MESSAGE, { roomId, message }, (response: { error?: any; message?: ChatMessage }) => {
      if (response?.error) {
        reject(response.error);
      } else {
        resolve(response?.message as ChatMessage);
      }
    });
  });
};

// Last typing indicator timestamp to throttle typing events
let lastTypingEmit = 0;

/**
 * Sends a typing indicator to a room
 * @param roomId Room ID to send indicator to
 * @param isTyping True if user is typing, false otherwise
 */
const sendTypingIndicator = (roomId: string, isTyping: boolean): void => {
  if (!socket || !socket.connected) {
    return;
  }

  // Throttle typing events to prevent excessive emissions
  const now = Date.now();
  const THROTTLE_MS = CONFIG.TIMEOUTS.CHAT_TYPING_INDICATOR / 2; // Half the display time
  
  if (isTyping && now - lastTypingEmit < THROTTLE_MS) {
    return;
  }
  
  lastTypingEmit = now;

  // Emit typing event
  socket.emit(SocketEvents.TYPING, { roomId, isTyping });
};

/**
 * Marks messages as read in a room
 * @param roomId Room ID
 * @param messageIds Array of message IDs to mark as read
 * @returns Promise resolving to success status
 */
const markMessagesAsRead = (roomId: string, messageIds: string[]): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Emit read event
    socket.emit(SocketEvents.READ, { roomId, messageIds }, (response: { error?: any; success?: boolean }) => {
      if (response?.error) {
        reject(response.error);
      } else {
        resolve(response?.success || false);
      }
    });
  });
};

/**
 * Handles changes in network connectivity
 * @param isConnected True if network is connected, false if disconnected
 */
const handleConnectionChange = (isConnected: boolean): void => {
  if (isConnected) {
    // If network is connected but socket is disconnected, reconnect
    if (socket && !socket.connected) {
      reconnect().catch(error => {
        console.error('Error reconnecting socket after network change:', error);
      });
    } else if (!socket) {
      initialize().catch(error => {
        console.error('Error initializing socket after network change:', error);
      });
    }
  } else {
    // If network is disconnected, disconnect the socket
    // to prevent constant reconnection attempts
    if (socket && socket.connected) {
      disconnect();
    }
  }
};

// Export socket client functions
export const socketClient = {
  initialize,
  disconnect,
  reconnect,
  authenticate,
  emit,
  on,
  off,
  isConnected,
  joinRoom,
  leaveRoom,
  sendMessage,
  sendTypingIndicator,
  markMessagesAsRead
};