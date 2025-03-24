import { rest } from 'msw';
import { HttpResponse } from 'msw';

// Import mock data
import { 
  mockUsers, getUserById, getProfileByUserId, getUsersWithCompletedProfiles, searchUsers 
} from './data/users';
import { 
  mockTribes, getTribeById, getTribesByUserId, getTribeSuggestions, searchTribes 
} from './data/tribes';
import { 
  mockEvents, getEventById, getEventsByTribeId, getUpcomingEvents, getEventSuggestions, getOptimalTimeSlots 
} from './data/events';
import { 
  mockNotifications, getNotificationById, getUnreadNotifications, getRecentNotifications 
} from './data/notifications';
import { 
  mockChatMessages, mockAIPrompts, getChatMessagesByTribeId, getAIPromptsByTribeId, getActiveAIPromptsByTribeId 
} from './data/chats';
import { API_PATHS } from '../constants/apiPaths';

// In-memory storage for auth tokens
const authTokens = new Map();

// Helper function to create a standardized success response
const createSuccessResponse = (data: any) => {
  return {
    success: true,
    data,
    error: null
  };
};

// Helper function to create a standardized error response
const createErrorResponse = (message: string, code: string, status: number) => {
  const error = {
    message,
    code
  };
  
  return new HttpResponse(
    JSON.stringify({
      success: false,
      data: null,
      error
    }),
    { status }
  );
};

// Simulate network delay for more realistic API behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handlers = [
  // Authentication handlers
  rest.post(API_PATHS.AUTH.LOGIN, async ({ request }) => {
    await delay(500);
    
    const { email, password } = await request.json();
    
    // Find user with matching email
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return createErrorResponse('Invalid email or password', 'AUTH_INVALID_CREDENTIALS', 401);
    }
    
    // In a real app, we would verify the password hash
    // For the mock, we'll just assume any password is correct
    
    // Generate a mock token
    const token = `mock-token-${user.id}-${Date.now()}`;
    const refreshToken = `mock-refresh-${user.id}-${Date.now()}`;
    
    // Store token for later verification
    authTokens.set(user.id, {
      token,
      refreshToken,
      expiresAt: Date.now() + 900000 // 15 minutes
    });
    
    return HttpResponse.json(createSuccessResponse({
      user,
      tokens: {
        accessToken: token,
        refreshToken,
        expiresIn: 900 // 15 minutes in seconds
      }
    }));
  }),

  rest.post(API_PATHS.AUTH.REGISTER, async ({ request }) => {
    await delay(500);
    
    const { email, password, name } = await request.json();
    
    // Check if user already exists
    if (mockUsers.some(u => u.email === email)) {
      return createErrorResponse('Email already in use', 'AUTH_EMAIL_IN_USE', 400);
    }
    
    // Create a new user
    const newUser = {
      id: `user-${mockUsers.length + 1}`,
      email,
      name,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      profileCompleted: false,
      hasCompletedOnboarding: false,
      mfaEnabled: false,
      preferredMfaMethod: null
    };
    
    // Generate a mock token
    const token = `mock-token-${newUser.id}-${Date.now()}`;
    const refreshToken = `mock-refresh-${newUser.id}-${Date.now()}`;
    
    // Store token for later verification
    authTokens.set(newUser.id, {
      token,
      refreshToken,
      expiresAt: Date.now() + 900000 // 15 minutes
    });
    
    return HttpResponse.json(createSuccessResponse({
      user: newUser,
      tokens: {
        accessToken: token,
        refreshToken,
        expiresIn: 900 // 15 minutes in seconds
      }
    }));
  }),

  rest.post(API_PATHS.AUTH.REFRESH, async ({ request }) => {
    await delay(500);
    
    const { refreshToken } = await request.json();
    
    // Find user with matching refresh token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.refreshToken === refreshToken) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Invalid refresh token', 'AUTH_INVALID_TOKEN', 401);
    }
    
    const user = getUserById(userId);
    if (!user) {
      return createErrorResponse('User not found', 'AUTH_USER_NOT_FOUND', 401);
    }
    
    // Generate a new token
    const newToken = `mock-token-${user.id}-${Date.now()}`;
    const newRefreshToken = `mock-refresh-${user.id}-${Date.now()}`;
    
    // Update stored tokens
    authTokens.set(user.id, {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: Date.now() + 900000 // 15 minutes
    });
    
    return HttpResponse.json(createSuccessResponse({
      tokens: {
        accessToken: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 900 // 15 minutes in seconds
      }
    }));
  }),

  rest.post(API_PATHS.AUTH.LOGOUT, async ({ request }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return HttpResponse.json(createSuccessResponse(true));
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        authTokens.delete(id);
        break;
      }
    }
    
    return HttpResponse.json(createSuccessResponse(true));
  }),

  // Profile handlers
  rest.get(API_PATHS.PROFILE.GET, async ({ request }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const profile = getProfileByUserId(userId);
    if (!profile) {
      return createErrorResponse('Profile not found', 'PROFILE_NOT_FOUND', 404);
    }
    
    return HttpResponse.json(createSuccessResponse(profile));
  }),

  rest.put(API_PATHS.PROFILE.UPDATE, async ({ request }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const profile = getProfileByUserId(userId);
    if (!profile) {
      return createErrorResponse('Profile not found', 'PROFILE_NOT_FOUND', 404);
    }
    
    const updates = await request.json();
    
    // In a real implementation, we would update the profile in the database
    // For the mock, we'll just return the updated profile
    const updatedProfile = {
      ...profile,
      ...updates,
      lastUpdated: new Date()
    };
    
    return HttpResponse.json(createSuccessResponse(updatedProfile));
  }),

  rest.post(API_PATHS.PROFILE.ASSESSMENT, async ({ request }) => {
    await delay(1000);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const profile = getProfileByUserId(userId);
    if (!profile) {
      return createErrorResponse('Profile not found', 'PROFILE_NOT_FOUND', 404);
    }
    
    const { responses } = await request.json();
    
    // In a real implementation, we would process the assessment responses
    // and update the personality traits in the profile
    
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'Assessment completed successfully',
      completionPercentage: 100
    }));
  }),

  // Tribe handlers
  rest.get(API_PATHS.TRIBE.GET_ALL, async ({ request }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const tribes = getTribesByUserId(userId);
    
    return HttpResponse.json(createSuccessResponse(tribes));
  }),

  rest.get('/api/tribes/search', async ({ request }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    // Parse search params from URL
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const location = url.searchParams.get('location') || '';
    const interests = url.searchParams.getAll('interests');
    
    // Apply search filters
    const results = searchTribes({
      query,
      location,
      interests
    });
    
    return HttpResponse.json(createSuccessResponse(results));
  }),

  rest.get('/api/tribes/:tribeId', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    return HttpResponse.json(createSuccessResponse(tribe));
  }),

  rest.post(API_PATHS.TRIBE.CREATE, async ({ request }) => {
    await delay(800);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const tribeData = await request.json();
    
    // In a real implementation, we would create a new tribe in the database
    // For the mock, we'll just return a success response with a mockup tribe
    const newTribe = {
      id: `tribe-${mockTribes.length + 1}`,
      ...tribeData,
      createdAt: new Date(),
      createdBy: userId,
      status: 'FORMATION',
      memberCount: 1,
      members: [
        {
          id: `member-${mockTribes.length + 1}-1`,
          tribeId: `tribe-${mockTribes.length + 1}`,
          userId,
          profile: getProfileByUserId(userId),
          role: 'CREATOR',
          status: 'ACTIVE',
          joinedAt: new Date(),
          lastActive: new Date(),
          compatibilityScores: {},
          engagementScore: 0
        }
      ],
      activities: [],
      goals: [],
      lastActivity: new Date(),
      upcomingEventCount: 0,
      isAiGenerated: false,
      metadata: {}
    };
    
    return HttpResponse.json(createSuccessResponse(newTribe));
  }),

  rest.post('/api/tribes/:tribeId/join', async ({ request, params }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    // Check if user is already a member
    if (tribe.members.some(member => member.userId === userId)) {
      return createErrorResponse('User is already a member of this tribe', 'TRIBE_ALREADY_MEMBER', 400);
    }
    
    // Check if tribe is at max capacity
    if (tribe.memberCount >= tribe.maxMembers) {
      return createErrorResponse('Tribe is at maximum capacity', 'TRIBE_AT_CAPACITY', 400);
    }
    
    // In a real implementation, we would add the user to the tribe in the database
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'Successfully joined tribe',
      tribeId
    }));
  }),

  rest.post('/api/tribes/:tribeId/leave', async ({ request, params }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    // Check if user is a member
    if (!tribe.members.some(member => member.userId === userId)) {
      return createErrorResponse('User is not a member of this tribe', 'TRIBE_NOT_MEMBER', 400);
    }
    
    // Check if user is the creator
    const isCreator = tribe.members.some(member => member.userId === userId && member.role === 'CREATOR');
    if (isCreator && tribe.members.length > 1) {
      return createErrorResponse('Creator cannot leave tribe with active members', 'TRIBE_CREATOR_CANNOT_LEAVE', 400);
    }
    
    // In a real implementation, we would remove the user from the tribe in the database
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'Successfully left tribe',
      tribeId
    }));
  }),

  rest.get('/api/tribes/suggestions', async ({ request }) => {
    await delay(1000);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const suggestions = getTribeSuggestions(userId);
    
    return HttpResponse.json(createSuccessResponse(suggestions));
  }),

  // Event handlers
  rest.get(API_PATHS.EVENT.BASE, async ({ request }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const tribeId = url.searchParams.get('tribeId');
    
    let events;
    if (tribeId) {
      events = getEventsByTribeId(tribeId);
    } else {
      // Get events from all tribes the user is a member of
      const tribes = getTribesByUserId(userId);
      events = [];
      
      for (const tribe of tribes) {
        const tribeEvents = getEventsByTribeId(tribe.id);
        events.push(...tribeEvents);
      }
      
      // Sort by start time (ascending)
      events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    
    return HttpResponse.json(createSuccessResponse(events));
  }),

  rest.get('/api/events/:eventId', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { eventId } = params;
    
    const event = getEventById(eventId as string);
    if (!event) {
      return createErrorResponse('Event not found', 'EVENT_NOT_FOUND', 404);
    }
    
    return HttpResponse.json(createSuccessResponse(event));
  }),

  rest.post(API_PATHS.EVENT.CREATE, async ({ request }) => {
    await delay(800);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const eventData = await request.json();
    
    // Validate that the tribe exists
    const tribe = getTribeById(eventData.tribeId);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    // Check if user is a member of the tribe
    if (!tribe.members.some(member => member.userId === userId)) {
      return createErrorResponse('User is not a member of this tribe', 'TRIBE_NOT_MEMBER', 403);
    }
    
    // In a real implementation, we would create a new event in the database
    // For the mock, we'll just return a success response with a mockup event
    const newEvent = {
      id: `event-${mockEvents.length + 1}`,
      ...eventData,
      tribe,
      createdBy: userId,
      createdAt: new Date(),
      status: 'SCHEDULED',
      attendees: [
        {
          id: `attendee-${mockEvents.length + 1}-1`,
          eventId: `event-${mockEvents.length + 1}`,
          userId,
          profile: getProfileByUserId(userId),
          rsvpStatus: 'GOING',
          rsvpTime: new Date(),
          hasCheckedIn: false,
          checkedInAt: null,
          paymentStatus: 'NOT_REQUIRED'
        }
      ],
      attendeeCount: 1,
      userRsvpStatus: 'GOING',
      isAiGenerated: false,
      metadata: {}
    };
    
    return HttpResponse.json(createSuccessResponse(newEvent));
  }),

  rest.post('/api/events/:eventId/rsvp', async ({ request, params }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { eventId } = params;
    
    const event = getEventById(eventId as string);
    if (!event) {
      return createErrorResponse('Event not found', 'EVENT_NOT_FOUND', 404);
    }
    
    const { status } = await request.json();
    
    // In a real implementation, we would update the RSVP status in the database
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'RSVP updated successfully',
      eventId,
      status
    }));
  }),

  rest.get('/api/events/suggestions', async ({ request }) => {
    await delay(1000);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const tribeId = url.searchParams.get('tribeId');
    
    if (!tribeId) {
      return createErrorResponse('Tribe ID is required', 'INVALID_PARAMETERS', 400);
    }
    
    const suggestions = getEventSuggestions(tribeId);
    
    return HttpResponse.json(createSuccessResponse(suggestions));
  }),

  rest.get('/api/events/optimal-times', async ({ request }) => {
    await delay(800);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const tribeId = url.searchParams.get('tribeId');
    
    if (!tribeId) {
      return createErrorResponse('Tribe ID is required', 'INVALID_PARAMETERS', 400);
    }
    
    const optimalTimeSlots = getOptimalTimeSlots(tribeId);
    
    return HttpResponse.json(createSuccessResponse(optimalTimeSlots));
  }),

  // Chat handlers
  rest.get('/api/tribes/:tribeId/chat', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    const messages = getChatMessagesByTribeId(tribeId as string);
    
    return HttpResponse.json(createSuccessResponse(messages));
  }),

  rest.post('/api/tribes/:tribeId/chat', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    const { content, messageType, metadata } = await request.json();
    
    const user = getUserById(userId);
    if (!user) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }
    
    const profile = getProfileByUserId(userId);
    
    // In a real implementation, we would store the message in the database
    // For the mock, we'll just return a success response with a mockup message
    const newMessage = {
      id: `msg-${Date.now()}`,
      tribeId: tribeId as string,
      senderId: userId,
      senderName: user.name,
      senderAvatar: profile?.avatarUrl || 'default_avatar.jpg',
      content,
      messageType,
      status: 'DELIVERED',
      sentAt: new Date(),
      deliveredAt: new Date(),
      readAt: null,
      metadata,
      isFromCurrentUser: true
    };
    
    return HttpResponse.json(createSuccessResponse(newMessage));
  }),

  rest.get('/api/tribes/:tribeId/prompts', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    const prompts = getActiveAIPromptsByTribeId(tribeId as string);
    
    return HttpResponse.json(createSuccessResponse(prompts));
  }),

  rest.post('/api/tribes/:tribeId/prompts/:promptId/respond', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { tribeId, promptId } = params;
    
    const tribe = getTribeById(tribeId as string);
    if (!tribe) {
      return createErrorResponse('Tribe not found', 'TRIBE_NOT_FOUND', 404);
    }
    
    const prompts = getAIPromptsByTribeId(tribeId as string);
    const prompt = prompts.find(p => p.id === promptId);
    
    if (!prompt) {
      return createErrorResponse('Prompt not found', 'PROMPT_NOT_FOUND', 404);
    }
    
    const { action, response } = await request.json();
    
    // In a real implementation, we would update the prompt in the database
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'Prompt response recorded',
      promptId,
      action
    }));
  }),

  // Notification handlers
  rest.get(API_PATHS.NOTIFICATION.GET_ALL, async ({ request }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const notifications = getRecentNotifications(limit);
    
    return HttpResponse.json(createSuccessResponse(notifications));
  }),

  rest.get('/api/notifications/unread', async ({ request }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find user with matching token
    let userId = null;
    for (const [id, tokens] of authTokens.entries()) {
      if (tokens.token === token) {
        userId = id;
        break;
      }
    }
    
    if (!userId) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const unreadNotifications = getUnreadNotifications();
    
    return HttpResponse.json(createSuccessResponse(unreadNotifications));
  }),

  rest.post('/api/notifications/:notificationId/read', async ({ request, params }) => {
    await delay(300);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    const { notificationId } = params;
    
    const notification = getNotificationById(notificationId as string);
    if (!notification) {
      return createErrorResponse('Notification not found', 'NOTIFICATION_NOT_FOUND', 404);
    }
    
    // In a real implementation, we would update the notification in the database
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'Notification marked as read',
      notificationId
    }));
  }),

  rest.post('/api/notifications/read-all', async ({ request }) => {
    await delay(500);
    
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Unauthorized', 'AUTH_UNAUTHORIZED', 401);
    }
    
    // In a real implementation, we would update all notifications in the database
    // For the mock, we'll just return a success response
    return HttpResponse.json(createSuccessResponse({
      message: 'All notifications marked as read'
    }));
  })
];