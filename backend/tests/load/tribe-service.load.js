import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Global configuration
const BASE_URL = process.env.TRIBE_SERVICE_URL || 'http://localhost:3003';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 50 },   // Scale down to 50 users
    { duration: '30s', target: 0 }    // Scale down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.01'],    // Less than 1% of requests can fail
    'checks': ['rate>0.95']              // 95% of checks must pass
  }
};

// Custom metrics for tracking performance of different operations
const createTribeTrend = new Trend('create_tribe_duration');
const getTribeTrend = new Trend('get_tribe_duration');
const searchTribesTrend = new Trend('search_tribes_duration');
const updateTribeTrend = new Trend('update_tribe_duration');
const addMemberTrend = new Trend('add_member_duration');
const getTribeMembersTrend = new Trend('get_tribe_members_duration');
const sendMessageTrend = new Trend('send_message_duration');
const getMessagesTrend = new Trend('get_messages_duration');
const createActivityTrend = new Trend('create_activity_duration');
const getTribeActivitiesTrend = new Trend('get_tribe_activities_duration');
const generateAIPromptTrend = new Trend('generate_ai_prompt_duration');
const getTribeRecommendationsTrend = new Trend('get_tribe_recommendations_duration');

// Helper functions for generating test data
function generateRandomTribe() {
  const tribeNames = [
    'Weekend Explorers', 'Foodies United', 'Tech Enthusiasts',
    'Book Club', 'Photography Club', 'Hiking Enthusiasts',
    'Board Game Crew', 'Urban Adventurers', 'Movie Buffs',
    'Fitness Friends', 'Art Appreciation', 'Music Lovers'
  ];
  
  const descriptions = [
    'A group for exploring hiking trails and outdoor activities',
    'Food enthusiasts exploring local restaurants and cuisines',
    'Technology discussions and project collaborations',
    'Regular meetups to discuss books and literature',
    'Photography enthusiasts sharing techniques and locations',
    'Exploring local hiking trails and nature spots',
    'Weekly board game nights and strategy discussions',
    'Discovering hidden gems in the city',
    'Film discussions and movie nights',
    'Workout buddies and fitness motivation',
    'Art gallery visits and creative discussions',
    'Live music events and music appreciation'
  ];
  
  const locations = [
    'Seattle, WA', 'Portland, OR', 'San Francisco, CA',
    'New York, NY', 'Austin, TX', 'Chicago, IL',
    'Denver, CO', 'Boston, MA', 'Washington, DC',
    'Los Angeles, CA', 'Atlanta, GA', 'Miami, FL'
  ];
  
  const nameIndex = Math.floor(Math.random() * tribeNames.length);
  
  return {
    name: tribeNames[nameIndex],
    description: descriptions[nameIndex],
    location: locations[Math.floor(Math.random() * locations.length)],
    coordinates: {
      latitude: (Math.random() * 180 - 90).toFixed(6),
      longitude: (Math.random() * 360 - 180).toFixed(6)
    },
    maxMembers: Math.floor(Math.random() * 5) + 4, // 4-8 members
    privacy: Math.random() > 0.5 ? 'PUBLIC' : 'PRIVATE',
    imageUrl: `https://example.com/tribe-images/${Math.floor(Math.random() * 20)}.jpg`
  };
}

function generateRandomMessage(tribeId, userId) {
  const messageContents = [
    'Hey everyone! How is your day going?',
    'Anyone free this weekend for a meetup?',
    'I found a great place for our next gathering!',
    'Has anyone tried that new restaurant downtown?',
    'Looking forward to seeing you all soon!',
    'What do you all think about our last meetup?',
    'I have a suggestion for our next activity.',
    'Sorry I missed the last event, how was it?',
    'Happy to be part of this tribe!',
    'Does anyone have recommendations for good hiking trails?'
  ];
  
  return {
    tribeId,
    userId,
    content: messageContents[Math.floor(Math.random() * messageContents.length)],
    messageType: 'TEXT',
    metadata: {
      clientTimestamp: new Date().toISOString()
    }
  };
}

function generateRandomActivity(tribeId, userId) {
  const activityTypes = [
    'JOIN', 'LEAVE', 'MESSAGE', 'EVENT_CREATE', 'EVENT_UPDATE',
    'EVENT_CANCEL', 'MEMBER_INVITE', 'MEMBER_REMOVE', 'TRIBE_UPDATE'
  ];
  
  const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
  let description = '';
  let metadata = {};
  
  switch (activityType) {
    case 'JOIN':
      description = 'User joined the tribe';
      break;
    case 'LEAVE':
      description = 'User left the tribe';
      break;
    case 'MESSAGE':
      description = 'User sent a message';
      metadata = { messagePreview: 'Hello everyone!' };
      break;
    case 'EVENT_CREATE':
      description = 'User created a new event';
      metadata = {
        eventName: 'Weekend Hike',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      break;
    case 'TRIBE_UPDATE':
      description = 'Tribe information was updated';
      metadata = { changedFields: ['description', 'imageUrl'] };
      break;
    default:
      description = `Activity of type ${activityType}`;
  }
  
  return {
    tribeId,
    userId,
    activityType,
    description,
    metadata
  };
}

// API Request Functions
function createTribe(tribeData, userId) {
  const payload = { ...tribeData, createdBy: userId };
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
  };
  
  const response = http.post(`${BASE_URL}/tribes`, JSON.stringify(payload), params);
  createTribeTrend.add(response.timings.duration);
  
  return response;
}

function getTribe(tribeId) {
  const response = http.get(`${BASE_URL}/tribes/${tribeId}`);
  getTribeTrend.add(response.timings.duration);
  
  return response;
}

function getTribeDetails(tribeId, userId) {
  const params = {
    headers: {
      'X-User-ID': userId
    }
  };
  
  const response = http.get(`${BASE_URL}/tribes/${tribeId}/details`, params);
  getTribeTrend.add(response.timings.duration);
  
  return response;
}

function searchTribes(searchParams) {
  const queryString = Object.entries(searchParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const response = http.get(`${BASE_URL}/tribes/search?${queryString}`);
  searchTribesTrend.add(response.timings.duration);
  
  return response;
}

function updateTribe(tribeId, updateData, userId) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
  };
  
  const response = http.put(
    `${BASE_URL}/tribes/${tribeId}`,
    JSON.stringify(updateData),
    params
  );
  updateTribeTrend.add(response.timings.duration);
  
  return response;
}

function addMember(tribeId, userId) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
  };
  
  const payload = { userId };
  const response = http.post(
    `${BASE_URL}/tribes/${tribeId}/members`,
    JSON.stringify(payload),
    params
  );
  addMemberTrend.add(response.timings.duration);
  
  return response;
}

function getTribeMembers(tribeId, options = {}) {
  const queryString = Object.entries(options)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const response = http.get(`${BASE_URL}/tribes/${tribeId}/members${queryString ? '?' + queryString : ''}`);
  getTribeMembersTrend.add(response.timings.duration);
  
  return response;
}

function sendMessage(tribeId, messageData, userId) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
  };
  
  const response = http.post(
    `${BASE_URL}/tribes/${tribeId}/messages`,
    JSON.stringify(messageData),
    params
  );
  sendMessageTrend.add(response.timings.duration);
  
  return response;
}

function getMessages(tribeId, options = {}) {
  const queryString = Object.entries(options)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const response = http.get(`${BASE_URL}/tribes/${tribeId}/messages${queryString ? '?' + queryString : ''}`);
  getMessagesTrend.add(response.timings.duration);
  
  return response;
}

function createActivity(activityData) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': activityData.userId
    }
  };
  
  const response = http.post(
    `${BASE_URL}/activities`,
    JSON.stringify(activityData),
    params
  );
  createActivityTrend.add(response.timings.duration);
  
  return response;
}

function getTribeActivities(tribeId, options = {}) {
  const queryString = Object.entries(options)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const response = http.get(`${BASE_URL}/tribes/${tribeId}/activities${queryString ? '?' + queryString : ''}`);
  getTribeActivitiesTrend.add(response.timings.duration);
  
  return response;
}

function generateAIPrompt(tribeId, userId, context) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
  };
  
  const payload = {
    context,
    promptType: context.promptType || 'CONVERSATION'
  };
  
  const response = http.post(
    `${BASE_URL}/tribes/${tribeId}/messages/ai-prompt`,
    JSON.stringify(payload),
    params
  );
  generateAIPromptTrend.add(response.timings.duration);
  
  return response;
}

function getTribeRecommendations(userId, options = {}) {
  const params = {
    headers: {
      'X-User-ID': userId
    }
  };
  
  const queryString = Object.entries(options)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const response = http.get(
    `${BASE_URL}/tribes/recommendations${queryString ? '?' + queryString : ''}`,
    params
  );
  getTribeRecommendationsTrend.add(response.timings.duration);
  
  return response;
}

// Test Scenarios
function tribeCreationScenario() {
  // Generate random user ID
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;
  
  // Generate random tribe data
  const tribeData = generateRandomTribe();
  
  // Create a new tribe
  const createResponse = createTribe(tribeData, userId);
  check(createResponse, {
    'tribe creation successful': (r) => r.status === 201,
    'tribe creation returns tribe ID': (r) => r.json('id') !== undefined
  });
  
  // Extract tribe ID
  const tribeId = createResponse.json('id');
  
  // Get the created tribe
  const getResponse = getTribe(tribeId);
  check(getResponse, {
    'get tribe successful': (r) => r.status === 200,
    'get tribe returns correct data': (r) => r.json('name') === tribeData.name
  });
  
  // Update the tribe
  const updateData = {
    description: `Updated: ${tribeData.description}`
  };
  const updateResponse = updateTribe(tribeId, updateData, userId);
  check(updateResponse, {
    'update tribe successful': (r) => r.status === 200,
    'update tribe returns updated data': (r) => r.json('description') === updateData.description
  });
  
  // Simulate user thinking time
  sleep(1);
}

function tribeMembershipScenario() {
  // Generate random user IDs
  const creatorId = `user_${Math.floor(Math.random() * 1000000)}`;
  const memberId = `user_${Math.floor(Math.random() * 1000000)}`;
  
  // Create a new tribe
  const tribeData = generateRandomTribe();
  const createResponse = createTribe(tribeData, creatorId);
  check(createResponse, {
    'tribe creation successful': (r) => r.status === 201
  });
  
  const tribeId = createResponse.json('id');
  
  // Add a member to the tribe
  const addMemberResponse = addMember(tribeId, memberId);
  check(addMemberResponse, {
    'add member successful': (r) => r.status === 201,
    'add member returns membership data': (r) => r.json('userId') === memberId
  });
  
  // Get tribe members
  const getMembersResponse = getTribeMembers(tribeId);
  check(getMembersResponse, {
    'get members successful': (r) => r.status === 200,
    'get members includes added member': (r) => {
      const members = r.json();
      return Array.isArray(members) && members.some(m => m.userId === memberId);
    }
  });
  
  // Simulate user thinking time
  sleep(1);
}

function tribeSearchScenario() {
  // Generate random search parameters
  const searchParams = {
    query: ['hiking', 'food', 'tech', 'books', 'photography'][Math.floor(Math.random() * 5)],
    location: ['Seattle', 'Portland', 'San Francisco', 'New York', 'Austin'][Math.floor(Math.random() * 5)],
    limit: 10,
    offset: 0
  };
  
  // Search for tribes
  const searchResponse = searchTribes(searchParams);
  check(searchResponse, {
    'search tribes successful': (r) => r.status === 200,
    'search tribes returns array': (r) => Array.isArray(r.json())
  });
  
  // Simulate user thinking time
  sleep(1);
}

function tribeChatScenario() {
  // Generate random user IDs
  const creatorId = `user_${Math.floor(Math.random() * 1000000)}`;
  const memberId = `user_${Math.floor(Math.random() * 1000000)}`;
  
  // Create a new tribe
  const tribeData = generateRandomTribe();
  const createResponse = createTribe(tribeData, creatorId);
  const tribeId = createResponse.json('id');
  
  // Add member to tribe
  addMember(tribeId, memberId);
  
  // Send a message
  const messageData = generateRandomMessage(tribeId, memberId);
  const sendMessageResponse = sendMessage(tribeId, messageData, memberId);
  check(sendMessageResponse, {
    'send message successful': (r) => r.status === 201,
    'send message returns message ID': (r) => r.json('id') !== undefined
  });
  
  // Get messages
  const getMessagesResponse = getMessages(tribeId, { limit: 10, offset: 0 });
  check(getMessagesResponse, {
    'get messages successful': (r) => r.status === 200,
    'get messages returns array': (r) => Array.isArray(r.json())
  });
  
  // Simulate user thinking time
  sleep(1);
}

function tribeActivityScenario() {
  // Generate random user ID
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;
  
  // Create a new tribe
  const tribeData = generateRandomTribe();
  const createResponse = createTribe(tribeData, userId);
  const tribeId = createResponse.json('id');
  
  // Create activity
  const activityData = generateRandomActivity(tribeId, userId);
  const createActivityResponse = createActivity(activityData);
  check(createActivityResponse, {
    'create activity successful': (r) => r.status === 201,
    'create activity returns activity ID': (r) => r.json('id') !== undefined
  });
  
  // Get tribe activities
  const getActivitiesResponse = getTribeActivities(tribeId, { limit: 20, offset: 0 });
  check(getActivitiesResponse, {
    'get activities successful': (r) => r.status === 200,
    'get activities returns array': (r) => Array.isArray(r.json())
  });
  
  // Simulate user thinking time
  sleep(1);
}

function aiEngagementScenario() {
  // Generate random user ID
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;
  
  // Create a new tribe
  const tribeData = generateRandomTribe();
  const createResponse = createTribe(tribeData, userId);
  const tribeId = createResponse.json('id');
  
  // Generate AI prompt
  const context = {
    promptType: ['CONVERSATION', 'ACTIVITY', 'ICEBREAKER'][Math.floor(Math.random() * 3)],
    recentActivity: 'LOW',
    previousTopics: ['hiking', 'food', 'movies']
  };
  
  const promptResponse = generateAIPrompt(tribeId, userId, context);
  check(promptResponse, {
    'generate AI prompt successful': (r) => r.status === 200,
    'generate AI prompt returns content': (r) => r.json('content') !== undefined
  });
  
  // Simulate user thinking time
  sleep(1);
}

function tribeRecommendationScenario() {
  // Generate random user ID
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;
  
  // Get recommendations
  const options = {
    limit: 5,
    includeReasons: true
  };
  
  const recommendationsResponse = getTribeRecommendations(userId, options);
  check(recommendationsResponse, {
    'get recommendations successful': (r) => r.status === 200,
    'get recommendations returns array': (r) => Array.isArray(r.json())
  });
  
  // Simulate user thinking time
  sleep(1);
}

// Main test function that randomly selects a scenario to execute
export default function() {
  const scenarioSelector = Math.floor(Math.random() * 7);
  
  switch (scenarioSelector) {
    case 0:
      tribeCreationScenario();
      break;
    case 1:
      tribeMembershipScenario();
      break;
    case 2:
      tribeSearchScenario();
      break;
    case 3:
      tribeChatScenario();
      break;
    case 4:
      tribeActivityScenario();
      break;
    case 5:
      aiEngagementScenario();
      break;
    case 6:
      tribeRecommendationScenario();
      break;
  }
}