# Tribe Service API Documentation

## Introduction

The Tribe Service is a core component of the Tribe platform that manages the creation, discovery, and management of tribes (small groups of 4-8 users). It provides endpoints for tribe operations, membership management, chat functionality, and activity tracking.

## General Information

**Base URL**: `/api`

**Authentication**: All endpoints require authentication via JWT token in the Authorization header, unless specified otherwise.

**Error Handling**: The API returns standard HTTP status codes. Error responses include a JSON object with 'error' and 'message' fields.

**Rate Limiting**: API requests are limited to 100 requests per minute per user.

## Endpoints

### Tribes

Endpoints for managing tribes

#### Create a new tribe

**POST** `/tribes`

Creates a new tribe with the authenticated user as the creator.

**Request Body**:
```json
{
  "name": "Weekend Explorers",
  "description": "A group for exploring hiking trails, parks, and outdoor activities every weekend.",
  "location": "Seattle, WA",
  "coordinates": {
    "latitude": 47.6062,
    "longitude": -122.3321
  },
  "imageUrl": "https://example.com/tribe-image.jpg",
  "privacy": "PUBLIC",
  "maxMembers": 8,
  "interests": [
    {
      "category": "Outdoor Adventures",
      "name": "Hiking",
      "isPrimary": true
    },
    {
      "category": "Food & Dining",
      "name": "Picnics",
      "isPrimary": false
    }
  ]
}
```

**Response**:
- `201 Created`: Tribe created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User has reached maximum tribe limit

#### Get user's tribes

**GET** `/tribes`

Returns the tribes that the authenticated user is a member of.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Number of results per page

**Response**:
- `200 OK`: List of tribes
- `401 Unauthorized`: Missing or invalid authentication

#### Search for tribes

**GET** `/tribes/search`

Search for tribes based on various criteria.

**Query Parameters**:
- `query` (optional): Search term for tribe name/description
- `interests` (optional): Interest categories to filter by
- `latitude` (optional): Latitude for location-based search
- `longitude` (optional): Longitude for location-based search
- `maxDistance` (optional, default: 25): Maximum distance in miles
- `status` (optional): Tribe statuses to include
- `privacy` (optional): 'PUBLIC' or 'PRIVATE'
- `hasAvailableSpots` (optional): Only tribes with open spots
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Results per page

**Response**:
- `200 OK`: Search results
- `400 Bad Request`: Invalid search parameters

#### Get tribe basic information

**GET** `/tribes/:tribeId`

Get basic information about a specific tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Response**:
- `200 OK`: Tribe information
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Tribe not found

#### Get detailed tribe information

**GET** `/tribes/:tribeId/details`

Get detailed information about a tribe including members, activities, and goals.

**Path Parameters**:
- `tribeId`: Tribe ID

**Response**:
- `200 OK`: Detailed tribe information
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Tribe not found

#### Update a tribe

**PUT** `/tribes/:tribeId`

Update a tribe's information.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "name": "Weekend Explorers & Adventurers",
  "description": "Updated description",
  "location": "Bellevue, WA",
  "coordinates": {
    "latitude": 47.6101,
    "longitude": -122.2015
  },
  "imageUrl": "https://example.com/updated-image.jpg",
  "privacy": "PUBLIC",
  "maxMembers": 6
}
```

**Response**:
- `200 OK`: Tribe updated successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to update this tribe
- `404 Not Found`: Tribe not found

#### Update tribe status

**PUT** `/tribes/:tribeId/status`

Update a tribe's status.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "status": "ACTIVE"
}
```

**Response**:
- `200 OK`: Tribe status updated successfully
- `400 Bad Request`: Invalid status
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to update this tribe
- `404 Not Found`: Tribe not found

#### Add tribe interest

**POST** `/tribes/:tribeId/interests`

Add an interest to a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "category": "Sports & Fitness",
  "name": "Trail Running",
  "isPrimary": false
}
```

**Response**:
- `201 Created`: Interest added successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to update this tribe
- `404 Not Found`: Tribe not found

#### Remove tribe interest

**DELETE** `/tribes/:tribeId/interests/:interestId`

Remove an interest from a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID
- `interestId`: Interest ID

**Response**:
- `200 OK`: Interest removed successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to update this tribe
- `404 Not Found`: Tribe or interest not found

#### Delete a tribe

**DELETE** `/tribes/:tribeId`

Delete a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Response**:
- `200 OK`: Tribe deleted successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to delete this tribe
- `404 Not Found`: Tribe not found

#### Get tribe recommendations

**GET** `/tribes/recommendations`

Get tribe recommendations for the authenticated user.

**Query Parameters**:
- `interests` (optional): Interest categories to prioritize
- `latitude` (optional): Latitude for location-based recommendations
- `longitude` (optional): Longitude for location-based recommendations
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Results per page

**Response**:
- `200 OK`: Recommended tribes
- `401 Unauthorized`: Missing or invalid authentication

#### Get AI-powered tribe recommendations

**GET** `/tribes/ai-recommendations`

Get AI-powered tribe recommendations based on user's personality profile.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Results per page

**Response**:
- `200 OK`: AI-recommended tribes
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: User profile not found or incomplete

#### Check join eligibility

**GET** `/tribes/:tribeId/join-eligibility`

Check if a user can join a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Response**:
- `200 OK`: Eligibility check result
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Tribe not found

#### Get tribe engagement metrics

**GET** `/tribes/:tribeId/engagement-metrics`

Get engagement metrics for a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `period` (optional, default: 'week'): Time period ('day', 'week', 'month')
- `count` (optional, default: 4): Number of periods to include

**Response**:
- `200 OK`: Tribe engagement metrics
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

### Members

Endpoints for managing tribe membership

#### Add member to tribe

**POST** `/tribes/members`

Add a user to a tribe.

**Request Body**:
```json
{
  "tribeId": "tribe-123",
  "userId": "user-456",
  "role": "MEMBER"
}
```

**Response**:
- `201 Created`: Member added successfully
- `400 Bad Request`: Invalid request data or user cannot join tribe
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to add members
- `404 Not Found`: Tribe or user not found

#### Get membership by ID

**GET** `/tribes/memberships/:membershipId`

Get a specific membership by ID.

**Path Parameters**:
- `membershipId`: Membership ID

**Response**:
- `200 OK`: Membership details
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Membership not found

#### Get tribe members

**GET** `/tribes/:tribeId/members`

Get all members of a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `status` (optional): Filter by membership status
- `role` (optional): Filter by member role
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response**:
- `200 OK`: List of tribe members
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Tribe not found

#### Get user's tribe memberships

**GET** `/users/:userId/memberships`

Get all tribes a user is a member of.

**Path Parameters**:
- `userId`: User ID

**Query Parameters**:
- `status` (optional): Filter by membership status
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Results per page

**Response**:
- `200 OK`: List of user's tribe memberships
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to view this user's memberships
- `404 Not Found`: User not found

#### Get user's membership in a tribe

**GET** `/tribes/:tribeId/members/:userId`

Get a user's membership in a specific tribe.

**Path Parameters**:
- `tribeId`: Tribe ID
- `userId`: User ID

**Response**:
- `200 OK`: Membership details
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Tribe, user, or membership not found

#### Update membership

**PUT** `/tribes/memberships/:membershipId`

Update a membership (role or status).

**Path Parameters**:
- `membershipId`: Membership ID

**Request Body**:
```json
{
  "role": "MEMBER",
  "status": "ACTIVE"
}
```

**Response**:
- `200 OK`: Membership updated successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to update this membership
- `404 Not Found`: Membership not found

#### Update last active timestamp

**PUT** `/tribes/memberships/:membershipId/last-active`

Update the lastActive timestamp for a member.

**Path Parameters**:
- `membershipId`: Membership ID

**Response**:
- `200 OK`: Last active timestamp updated
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Membership not found

#### Remove member from tribe

**DELETE** `/tribes/memberships/:membershipId`

Remove a member from a tribe.

**Path Parameters**:
- `membershipId`: Membership ID

**Request Body**:
```json
{
  "isVoluntary": true
}
```

**Response**:
- `200 OK`: Member removed successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to remove this member
- `404 Not Found`: Membership not found

#### Accept tribe invitation

**POST** `/tribes/memberships/:membershipId/accept`

Accept a pending tribe membership invitation.

**Path Parameters**:
- `membershipId`: Membership ID

**Response**:
- `200 OK`: Membership accepted
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to accept this invitation
- `404 Not Found`: Membership not found

#### Reject tribe invitation

**POST** `/tribes/memberships/:membershipId/reject`

Reject a pending tribe membership invitation.

**Path Parameters**:
- `membershipId`: Membership ID

**Response**:
- `200 OK`: Membership rejected
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to reject this invitation
- `404 Not Found`: Membership not found

### Chat

Endpoints for tribe chat functionality

#### Send message

**POST** `/tribes/:tribeId/messages`

Send a new message to a tribe chat.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "content": "Hello everyone! Looking forward to our hike this weekend.",
  "messageType": "TEXT",
  "metadata": {
    "attachments": []
  }
}
```

**Response**:
- `201 Created`: Message sent successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Get message by ID

**GET** `/messages/:messageId`

Get a specific message by ID.

**Path Parameters**:
- `messageId`: Message ID

**Response**:
- `200 OK`: Message details
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of the tribe this message belongs to
- `404 Not Found`: Message not found

#### Get tribe messages

**GET** `/tribes/:tribeId/messages`

Get messages for a tribe with pagination.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `before` (optional): Get messages before this timestamp
- `after` (optional): Get messages after this timestamp
- `limit` (optional, default: 50): Number of messages to return

**Response**:
- `200 OK`: List of messages
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Get user's messages in a tribe

**GET** `/tribes/:tribeId/users/:userId/messages`

Get messages sent by a specific user in a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID
- `userId`: User ID

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response**:
- `200 OK`: List of user's messages
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe or user not found

#### Mark messages as read

**POST** `/messages/read`

Mark specific messages as read for the authenticated user.

**Request Body**:
```json
{
  "messageIds": ["message-123", "message-456", "message-789"]
}
```

**Response**:
- `200 OK`: Messages marked as read
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication

#### Mark all tribe messages as read

**POST** `/tribes/:tribeId/messages/read-all`

Mark all messages in a tribe as read for the authenticated user.

**Path Parameters**:
- `tribeId`: Tribe ID

**Response**:
- `200 OK`: All messages marked as read
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Get unread message count

**GET** `/tribes/:tribeId/messages/unread-count`

Get count of unread messages for the authenticated user in a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Response**:
- `200 OK`: Unread message count
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Delete message

**DELETE** `/messages/:messageId`

Delete a specific message.

**Path Parameters**:
- `messageId`: Message ID

**Response**:
- `200 OK`: Message deleted successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to delete this message
- `404 Not Found`: Message not found

#### Search messages

**GET** `/tribes/:tribeId/messages/search`

Search for messages in a tribe by content.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `query` (required): Search term
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response**:
- `200 OK`: Search results
- `400 Bad Request`: Invalid search query
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Generate AI conversation prompt

**POST** `/tribes/:tribeId/messages/ai-prompt`

Generate an AI-powered conversation prompt for a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "context": {
    "activityLevel": "low",
    "recentTopics": ["hiking", "weekend plans"]
  }
}
```

**Response**:
- `201 Created`: AI prompt generated successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

### Activities

Endpoints for tribe activity tracking

#### Create activity

**POST** `/tribes/:tribeId/activities`

Create a new tribe activity.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "userId": "user-123",
  "activityType": "MEMBER_JOINED",
  "description": "Sarah joined the tribe",
  "metadata": {
    "membershipId": "membership-456"
  }
}
```

**Response**:
- `201 Created`: Activity created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to create activities for this tribe
- `404 Not Found`: Tribe not found

#### Get activity by ID

**GET** `/activities/:activityId`

Get a specific activity by ID.

**Path Parameters**:
- `activityId`: Activity ID

**Response**:
- `200 OK`: Activity details
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of the tribe this activity belongs to
- `404 Not Found`: Activity not found

#### Get tribe activities

**GET** `/tribes/:tribeId/activities`

Get activities for a specific tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `activityTypes` (optional): Filter by activity types
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response**:
- `200 OK`: List of tribe activities
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Get user activities

**GET** `/users/:userId/activities`

Get activities performed by a specific user.

**Path Parameters**:
- `userId`: User ID

**Query Parameters**:
- `tribeId` (optional): Filter by tribe ID
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response**:
- `200 OK`: List of user activities
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to view this user's activities
- `404 Not Found`: User not found

#### Count tribe activities

**GET** `/tribes/:tribeId/activities/count`

Count activities for a specific tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `activityTypes` (optional): Filter by activity types
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)

**Response**:
- `200 OK`: Activity count
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Get tribe activity statistics

**GET** `/tribes/:tribeId/activities/stats`

Get activity statistics for a tribe.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `startDate` (optional): Start date for stats (ISO format)
- `endDate` (optional): End date for stats (ISO format)

**Response**:
- `200 OK`: Activity statistics
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

#### Create AI engagement activity

**POST** `/tribes/:tribeId/activities/ai-engagement`

Create an AI-generated engagement activity.

**Path Parameters**:
- `tribeId`: Tribe ID

**Request Body**:
```json
{
  "description": "AI suggested a weekend hike at Discovery Park",
  "metadata": {
    "activityType": "OUTDOOR",
    "location": "Discovery Park",
    "suggestedDate": "2023-07-15T10:00:00Z"
  }
}
```

**Response**:
- `201 Created`: AI engagement activity created successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to create activities for this tribe
- `404 Not Found`: Tribe not found

#### Delete activity

**DELETE** `/activities/:activityId`

Delete a specific activity.

**Path Parameters**:
- `activityId`: Activity ID

**Response**:
- `200 OK`: Activity deleted successfully
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not authorized to delete this activity
- `404 Not Found`: Activity not found

#### Get tribe activity timeline

**GET** `/tribes/:tribeId/activities/timeline`

Get a chronological timeline of tribe activities.

**Path Parameters**:
- `tribeId`: Tribe ID

**Query Parameters**:
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Results per page

**Response**:
- `200 OK`: Activity timeline
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User is not a member of this tribe
- `404 Not Found`: Tribe not found

## Data Models

### ITribe

```typescript
{
  id: string;                        // Unique identifier
  name: string;                      // Tribe name
  description: string;               // Tribe description
  location: string;                  // Location name
  coordinates: {
    latitude: number;                // Latitude coordinate
    longitude: number;               // Longitude coordinate
  };
  imageUrl: string;                  // URL to tribe image
  status: string;                    // Tribe status (FORMING, ACTIVE, AT_RISK, INACTIVE, DISSOLVED)
  privacy: string;                   // Tribe privacy setting (PUBLIC, PRIVATE)
  maxMembers: number;                // Maximum number of members (4-8)
  createdBy: string;                 // User ID of creator
  createdAt: Date;                   // Creation timestamp
  lastActive: Date;                  // Last activity timestamp
  interests: Array<TribeInterest>;   // Array of tribe interests
  members: Array<TribeMembership>;   // Array of tribe memberships
  activities: Array<TribeActivity>;  // Array of tribe activities
  goals: Array<TribeGoal>;           // Array of tribe goals
  metadata: object;                  // Additional tribe metadata
}
```

### ITribeMembership

```typescript
{
  id: string;           // Unique identifier
  tribeId: string;      // Tribe ID
  userId: string;       // User ID
  role: string;         // Member role (CREATOR, MEMBER)
  status: string;       // Membership status (PENDING, ACTIVE, INACTIVE, REMOVED, LEFT)
  joinedAt: Date;       // Join timestamp
  lastActive: Date;     // Last activity timestamp
}
```

### IChatMessage

```typescript
{
  id: string;           // Unique identifier
  tribeId: string;      // Tribe ID
  userId: string;       // Sender user ID
  content: string;      // Message content
  messageType: string;  // Message type (TEXT, IMAGE, SYSTEM, AI_PROMPT, EVENT)
  sentAt: Date;         // Sent timestamp
  isRead: boolean;      // Whether the message has been read
  metadata: object;     // Additional message metadata
}
```

### ITribeActivity

```typescript
{
  id: string;           // Unique identifier
  tribeId: string;      // Tribe ID
  userId: string;       // User ID associated with the activity
  activityType: string; // Activity type
  description: string;  // Activity description
  timestamp: Date;      // Activity timestamp
  metadata: object;     // Additional activity metadata
}
```