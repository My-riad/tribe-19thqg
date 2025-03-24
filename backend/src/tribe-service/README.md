# Tribe Service

A microservice responsible for managing tribes (small groups of 4-8 users), tribe memberships, tribe chat, and tribe activities within the Tribe platform.

## Overview

The Tribe Service is a core component of the Tribe platform that handles all tribe-related operations. It provides APIs for creating, retrieving, updating, and deleting tribes, as well as managing tribe memberships, chat messages, and activity tracking.

## Features

- Tribe creation and management
- Tribe membership management with role-based permissions
- Real-time tribe chat with support for text, images, and AI-generated prompts
- Activity tracking for tribe engagement metrics
- Tribe search and discovery
- AI-powered tribe recommendations
- Tribe interest management

## Architecture

The Tribe Service follows a microservice architecture pattern and is built using Node.js with Express. It uses Prisma ORM for database operations and communicates with other services through RESTful APIs.

## Models

### TribeModel
- **Description**: Manages tribe entities including creation, retrieval, updates, and deletion
- **Key Methods**:
  - `create`: Create a new tribe
  - `findById`: Find a tribe by ID
  - `findByUserId`: Find tribes by user ID
  - `search`: Search tribes based on criteria
  - `update`: Update tribe information
  - `updateStatus`: Update tribe status
  - `addInterest`: Add an interest to a tribe
  - `removeInterest`: Remove an interest from a tribe
  - `delete`: Delete a tribe
  - `getRecommendations`: Get tribe recommendations

### MemberModel
- **Description**: Manages tribe memberships including roles and status
- **Key Methods**:
  - `create`: Add a member to a tribe
  - `findById`: Find a membership by ID
  - `findByTribeId`: Find members by tribe ID
  - `findByUserId`: Find all tribes a user is a member of
  - `findByTribeAndUser`: Find a specific member in a tribe
  - `update`: Update member information
  - `updateLastActive`: Update member's last active timestamp
  - `countByTribeId`: Count members in a tribe
  - `countByUserId`: Count tribes a user is a member of
  - `delete`: Remove a member from a tribe

### ChatModel
- **Description**: Manages tribe chat messages with support for different message types
- **Key Methods**:
  - `createMessage`: Create a new chat message
  - `getMessage`: Get a message by ID
  - `getMessages`: Get messages for a tribe
  - `getMessagesByUser`: Get messages sent by a user
  - `getMessagesByType`: Get messages of a specific type
  - `markAsRead`: Mark a message as read
  - `markAllAsRead`: Mark all messages as read
  - `getUnreadCount`: Get count of unread messages
  - `deleteMessage`: Delete a message
  - `searchMessages`: Search for messages

### ActivityModel
- **Description**: Manages tribe activity records for engagement tracking
- **Key Methods**:
  - `create`: Record a new activity
  - `findById`: Find an activity by ID
  - `findByTribeId`: Find activities for a tribe
  - `findByUserId`: Find activities by a user
  - `findRecent`: Find recent activities
  - `countByTribeId`: Count activities for a tribe
  - `getActivityStats`: Get activity statistics
  - `delete`: Delete an activity record

## API Endpoints

### Tribes

| Method | Endpoint | Description | Auth | Request | Response |
|--------|----------|-------------|------|---------|----------|
| POST | `/api/tribes` | Create a new tribe | Required | ITribeCreate | ITribeResponse (201 Created) |
| GET | `/api/tribes/:id` | Get a tribe by ID | Required | - | ITribeResponse (200 OK) |
| GET | `/api/tribes/:id/details` | Get detailed tribe information | Required | - | ITribeDetailResponse (200 OK) |
| GET | `/api/tribes/user` | Get tribes a user belongs to | Required | page, limit, status | { tribes: ITribeResponse[], total: number } (200 OK) |
| GET | `/api/tribes/search` | Search for tribes | Optional | ITribeSearchParams | { tribes: ITribeResponse[], total: number } (200 OK) |
| PUT | `/api/tribes/:id` | Update tribe information | Required (Creator) | ITribeUpdate | ITribeResponse (200 OK) |
| PATCH | `/api/tribes/:id/status` | Update tribe status | Required (Creator) | { status: TribeStatus } | ITribeResponse (200 OK) |
| POST | `/api/tribes/:id/interests` | Add an interest to a tribe | Required (Creator) | { category, name, isPrimary } | ITribeInterest (201 Created) |
| DELETE | `/api/tribes/:id/interests/:interestId` | Remove an interest | Required (Creator) | - | { success: true } (200 OK) |
| DELETE | `/api/tribes/:id` | Delete a tribe | Required (Creator) | - | { success: true } (200 OK) |

### Members and Recommendations

| Method | Endpoint | Description | Auth | Request | Response |
|--------|----------|-------------|------|---------|----------|
| GET | `/api/tribes/:id/members` | Get tribe members | Required | status, role, page, limit | { members: IMemberResponse[], total: number } (200 OK) |
| GET | `/api/tribes/recommendations` | Get tribe recommendations | Required | interests, lat, lng, maxDistance, limit, offset | ITribeResponse[] (200 OK) |
| GET | `/api/tribes/ai-recommendations` | Get AI recommendations | Required | limit, offset | ITribeResponse[] (200 OK) |
| GET | `/api/tribes/:id/join-eligibility` | Check join eligibility | Required | - | { eligible: boolean, reason?: string } (200 OK) |

### Engagement, Chat, and Activities

| Method | Endpoint | Description | Auth | Request | Response |
|--------|----------|-------------|------|---------|----------|
| GET | `/api/tribes/:id/engagement` | Get engagement metrics | Required | startDate, endDate | { metrics: object } (200 OK) |
| GET | `/api/tribes/:id/chat` | Get chat messages | Required (Member) | page, limit, beforeId, afterId | { messages: IChatMessage[], total: number } (200 OK) |
| POST | `/api/tribes/:id/chat` | Send a chat message | Required (Member) | { content, messageType?, metadata? } | IChatMessage (201 Created) |
| GET | `/api/tribes/:id/activities` | Get tribe activities | Required (Member) | limit, offset, activityTypes | ITribeActivity[] (200 OK) |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Port on which the service will run | 3003 | No |
| DATABASE_URL | PostgreSQL connection string | - | Yes |
| JWT_SECRET | Secret for JWT validation | - | Yes |
| LOG_LEVEL | Logging level (debug, info, warn, error) | info | No |
| AI_ORCHESTRATION_SERVICE_URL | URL for the AI Orchestration Service | - | Yes |

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables in `.env` file

3. Run database migrations:
   ```
   npx prisma migrate dev
   ```

4. Start the service:
   ```
   npm run dev
   ```

## Testing

- Run unit tests:
  ```
  npm test
  ```

- Run integration tests:
  ```
  npm run test:integration
  ```

- Run all tests with coverage:
  ```
  npm run test:coverage
  ```

## Deployment

1. Build the service:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm start
   ```

3. Docker build:
   ```
   docker build -t tribe-service .
   ```

4. Docker run:
   ```
   docker run -p 3003:3003 tribe-service
   ```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework for API endpoints |
| @prisma/client | ^4.16.0 | ORM for database operations |
| socket.io | ^4.7.0 | Real-time communication for chat |
| jsonwebtoken | ^9.0.0 | JWT authentication |
| axios | ^1.4.0 | HTTP client for service communication |

## Related Services

| Service | Purpose |
|---------|---------|
| Auth Service | User authentication and authorization |
| Profile Service | User profile and personality data |
| Matching Service | AI-powered user matching algorithms |
| AI Orchestration Service | AI capabilities for engagement and recommendations |
| Event Service | Event planning and management |
| Notification Service | User notifications for tribe activities |