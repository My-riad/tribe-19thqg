# Event Service API

## Introduction

The Event Service provides a comprehensive API for managing events, discovering local activities, generating personalized recommendations, and integrating weather data for optimal event planning. This service is a core component of the Tribe platform, enabling users to transition from digital connections to real-world meetups.

### Base URL

All API endpoints are relative to: `https://api.tribeapp.com/api/v1/events`

### Authentication

All endpoints require a valid JWT token in the Authorization header: `Authorization: Bearer {token}`

### Response Format

All responses are returned in JSON format with standard HTTP status codes. Successful responses include a `data` field containing the requested information. Error responses include `error` and `message` fields.

## Event Management

Endpoints for creating, retrieving, updating, and deleting events.

### Get Event by ID

Retrieves detailed information about a specific event.

**Endpoint:** `GET /events/{eventId}`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event
- `includeAttendees` (boolean, optional, default: false): Whether to include attendee information in the response

**Responses:**
- 200 OK: Event details retrieved successfully
- 404 Not Found: Event not found

**Example:**
```
GET /events/123e4567-e89b-12d3-a456-426614174000?includeAttendees=true
```

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Trail Hike @ Discovery Park",
    "description": "Let's explore the new lighthouse trail and have a picnic after. Bring water and snacks!",
    "tribeId": "789e0123-e45b-67d8-a901-234567890000",
    "createdBy": "456e7890-e12b-34d5-a678-901234567000",
    "eventType": "IN_PERSON",
    "status": "SCHEDULED",
    "visibility": "TRIBE_ONLY",
    "startTime": "2023-07-15T10:00:00Z",
    "endTime": "2023-07-15T14:00:00Z",
    "location": "Discovery Park, Seattle",
    "coordinates": {
      "latitude": 47.6568,
      "longitude": -122.4143
    },
    "weatherData": {
      "temperature": 75,
      "conditions": "Sunny",
      "precipitation": 0,
      "windSpeed": 5
    },
    "cost": 0,
    "paymentRequired": false,
    "maxAttendees": 8,
    "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
    "attendees": [
      {
        "userId": "456e7890-e12b-34d5-a678-901234567000",
        "rsvpStatus": "GOING",
        "rsvpTime": "2023-07-01T15:30:00Z",
        "hasCheckedIn": false
      },
      {
        "userId": "567e8901-e23b-45d6-a789-012345678000",
        "rsvpStatus": "GOING",
        "rsvpTime": "2023-07-02T10:15:00Z",
        "hasCheckedIn": false
      }
    ]
  }
}
```

### Get Events by Tribe ID

Retrieves all events for a specific tribe.

**Endpoint:** `GET /events/tribe/{tribeId}`

**Parameters:**
- `tribeId` (string, required): Unique identifier of the tribe
- `status` (string, optional): Filter by event status (DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Events retrieved successfully

**Example:**
```
GET /events/tribe/789e0123-e45b-67d8-a901-234567890000?status=SCHEDULED&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T10:00:00Z",
        "endTime": "2023-07-15T14:00:00Z",
        "location": "Discovery Park, Seattle",
        "status": "SCHEDULED",
        "eventType": "IN_PERSON"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Events by User ID

Retrieves all events a user is attending or has created.

**Endpoint:** `GET /events/user/{userId}`

**Parameters:**
- `userId` (string, required): Unique identifier of the user
- `status` (string, optional): Filter by event status (DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Events retrieved successfully

**Example:**
```
GET /events/user/456e7890-e12b-34d5-a678-901234567000?status=SCHEDULED&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T10:00:00Z",
        "endTime": "2023-07-15T14:00:00Z",
        "location": "Discovery Park, Seattle",
        "status": "SCHEDULED",
        "eventType": "IN_PERSON"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Search Events

Searches for events based on various criteria.

**Endpoint:** `GET /events/search`

**Parameters:**
- `query` (string, optional): Text search query for event name and description
- `tribeId` (string, optional): Filter by tribe ID
- `userId` (string, optional): Filter by user ID (creator or attendee)
- `status` (string, optional): Filter by event status
- `eventType` (string, optional): Filter by event type (IN_PERSON, VIRTUAL, HYBRID)
- `categories` (string[], optional): Filter by event categories (comma-separated)
- `latitude` (number, optional): Latitude for location-based search
- `longitude` (number, optional): Longitude for location-based search
- `radius` (number, optional, default: 10): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `maxCost` (number, optional): Maximum event cost
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Search results retrieved successfully

**Example:**
```
GET /events/search?query=hike&categories=OUTDOOR_ACTIVITIES,NATURE&startDate=2023-07-01&maxCost=20&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T10:00:00Z",
        "endTime": "2023-07-15T14:00:00Z",
        "location": "Discovery Park, Seattle",
        "status": "SCHEDULED",
        "eventType": "IN_PERSON",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
        "cost": 0
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Create Event

Creates a new event.

**Endpoint:** `POST /events`

**Parameters:**
- `name` (string, required): Event name
- `description` (string, required): Event description
- `tribeId` (string, required): ID of the tribe hosting the event
- `eventType` (string, required): Event type (IN_PERSON, VIRTUAL, HYBRID)
- `visibility` (string, optional, default: TRIBE_ONLY): Event visibility (TRIBE_ONLY, PUBLIC)
- `startTime` (string (ISO date), required): Event start time
- `endTime` (string (ISO date), required): Event end time
- `location` (string, required): Event location description
- `coordinates` (object, optional): Event location coordinates
  - `latitude` (number): Latitude coordinate
  - `longitude` (number): Longitude coordinate
- `venueId` (string, optional): ID of the venue (if applicable)
- `cost` (number, optional, default: 0): Event cost per person
- `paymentRequired` (boolean, optional, default: false): Whether payment is required to attend
- `maxAttendees` (number, optional): Maximum number of attendees
- `categories` (string[], optional): Event categories
- `metadata` (object, optional): Additional event metadata

**Responses:**
- 201 Created: Event created successfully
- 400 Bad Request: Invalid request data

**Example:**
```
POST /events
```

```json
{
  "name": "Trail Hike @ Discovery Park",
  "description": "Let's explore the new lighthouse trail and have a picnic after. Bring water and snacks!",
  "tribeId": "789e0123-e45b-67d8-a901-234567890000",
  "eventType": "IN_PERSON",
  "visibility": "TRIBE_ONLY",
  "startTime": "2023-07-15T10:00:00Z",
  "endTime": "2023-07-15T14:00:00Z",
  "location": "Discovery Park, Seattle",
  "coordinates": {
    "latitude": 47.6568,
    "longitude": -122.4143
  },
  "cost": 0,
  "paymentRequired": false,
  "maxAttendees": 8,
  "categories": ["OUTDOOR_ACTIVITIES", "NATURE"]
}
```

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Trail Hike @ Discovery Park",
    "description": "Let's explore the new lighthouse trail and have a picnic after. Bring water and snacks!",
    "tribeId": "789e0123-e45b-67d8-a901-234567890000",
    "createdBy": "456e7890-e12b-34d5-a678-901234567000",
    "eventType": "IN_PERSON",
    "status": "DRAFT",
    "visibility": "TRIBE_ONLY",
    "startTime": "2023-07-15T10:00:00Z",
    "endTime": "2023-07-15T14:00:00Z",
    "location": "Discovery Park, Seattle",
    "coordinates": {
      "latitude": 47.6568,
      "longitude": -122.4143
    },
    "cost": 0,
    "paymentRequired": false,
    "maxAttendees": 8,
    "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
    "createdAt": "2023-07-01T12:00:00Z"
  }
}
```

### Update Event

Updates an existing event.

**Endpoint:** `PUT /events/{eventId}`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event
- `name` (string, optional): Event name
- `description` (string, optional): Event description
- `eventType` (string, optional): Event type (IN_PERSON, VIRTUAL, HYBRID)
- `visibility` (string, optional): Event visibility (TRIBE_ONLY, PUBLIC)
- `startTime` (string (ISO date), optional): Event start time
- `endTime` (string (ISO date), optional): Event end time
- `location` (string, optional): Event location description
- `coordinates` (object, optional): Event location coordinates
  - `latitude` (number): Latitude coordinate
  - `longitude` (number): Longitude coordinate
- `venueId` (string, optional): ID of the venue (if applicable)
- `cost` (number, optional): Event cost per person
- `paymentRequired` (boolean, optional): Whether payment is required to attend
- `maxAttendees` (number, optional): Maximum number of attendees
- `categories` (string[], optional): Event categories
- `metadata` (object, optional): Additional event metadata

**Responses:**
- 200 OK: Event updated successfully
- 400 Bad Request: Invalid request data
- 404 Not Found: Event not found

**Example:**
```
PUT /events/123e4567-e89b-12d3-a456-426614174000
```

```json
{
  "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
  "description": "Let's explore the new lighthouse trail and have a picnic after. Bring water, snacks, and sunscreen!",
  "startTime": "2023-07-15T09:30:00Z",
  "endTime": "2023-07-15T14:30:00Z"
}
```

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
    "description": "Let's explore the new lighthouse trail and have a picnic after. Bring water, snacks, and sunscreen!",
    "tribeId": "789e0123-e45b-67d8-a901-234567890000",
    "createdBy": "456e7890-e12b-34d5-a678-901234567000",
    "eventType": "IN_PERSON",
    "status": "DRAFT",
    "visibility": "TRIBE_ONLY",
    "startTime": "2023-07-15T09:30:00Z",
    "endTime": "2023-07-15T14:30:00Z",
    "location": "Discovery Park, Seattle",
    "coordinates": {
      "latitude": 47.6568,
      "longitude": -122.4143
    },
    "cost": 0,
    "paymentRequired": false,
    "maxAttendees": 8,
    "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
    "updatedAt": "2023-07-02T15:30:00Z"
  }
}
```

### Update Event Status

Updates the status of an event.

**Endpoint:** `PATCH /events/{eventId}/status`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event
- `status` (string, required): New event status (DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED)

**Responses:**
- 200 OK: Event status updated successfully
- 400 Bad Request: Invalid status transition
- 404 Not Found: Event not found

**Example:**
```
PATCH /events/123e4567-e89b-12d3-a456-426614174000/status
```

```json
{
  "status": "SCHEDULED"
}
```

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
    "status": "SCHEDULED",
    "updatedAt": "2023-07-03T10:15:00Z"
  }
}
```

### Delete Event

Deletes an event.

**Endpoint:** `DELETE /events/{eventId}`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event

**Responses:**
- 200 OK: Event deleted successfully
- 404 Not Found: Event not found

**Example:**
```
DELETE /events/123e4567-e89b-12d3-a456-426614174000
```

```json
{
  "data": {
    "message": "Event deleted successfully"
  }
}
```

### Get Upcoming Events

Retrieves upcoming events based on date range.

**Endpoint:** `GET /events/upcoming`

**Parameters:**
- `startDate` (string (ISO date), optional, default: current date): Filter events starting on or after this date
- `endDate` (string (ISO date), optional, default: current date + 30 days): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Upcoming events retrieved successfully

**Example:**
```
GET /events/upcoming?startDate=2023-07-01&endDate=2023-07-31&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "status": "SCHEDULED",
        "eventType": "IN_PERSON"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Check Event Conflicts

Checks for scheduling conflicts for a tribe or user.

**Endpoint:** `POST /events/conflicts`

**Parameters:**
- `tribeId` (string, optional): ID of the tribe to check for conflicts
- `userId` (string, optional): ID of the user to check for conflicts
- `startTime` (string (ISO date), required): Start time to check for conflicts
- `endTime` (string (ISO date), required): End time to check for conflicts
- `excludeEventId` (string, optional): Event ID to exclude from conflict check

**Responses:**
- 200 OK: Conflict check completed successfully
- 400 Bad Request: Invalid request parameters

**Example:**
```
POST /events/conflicts
```

```json
{
  "tribeId": "789e0123-e45b-67d8-a901-234567890000",
  "startTime": "2023-07-15T09:00:00Z",
  "endTime": "2023-07-15T15:00:00Z"
}
```

```json
{
  "data": {
    "hasConflict": true,
    "conflictingEvents": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z"
      }
    ]
  }
}
```

## Attendee Management

Endpoints for managing event attendees, RSVPs, and check-ins.

### Get Event Attendees

Retrieves all attendees for an event.

**Endpoint:** `GET /events/{eventId}/attendees`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event

**Responses:**
- 200 OK: Attendees retrieved successfully
- 404 Not Found: Event not found

**Example:**
```
GET /events/123e4567-e89b-12d3-a456-426614174000/attendees
```

```json
{
  "data": [
    {
      "id": "abc12345-de67-89f0-1234-56789abcdef0",
      "eventId": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "456e7890-e12b-34d5-a678-901234567000",
      "user": {
        "id": "456e7890-e12b-34d5-a678-901234567000",
        "name": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "rsvpStatus": "GOING",
      "rsvpTime": "2023-07-01T15:30:00Z",
      "hasCheckedIn": false,
      "paymentStatus": "NOT_REQUIRED"
    },
    {
      "id": "def67890-12ab-34cd-5678-90efabcdef12",
      "eventId": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "567e8901-e23b-45d6-a789-012345678000",
      "user": {
        "id": "567e8901-e23b-45d6-a789-012345678000",
        "name": "Jane Smith",
        "avatarUrl": "https://example.com/avatar2.jpg"
      },
      "rsvpStatus": "GOING",
      "rsvpTime": "2023-07-02T10:15:00Z",
      "hasCheckedIn": false,
      "paymentStatus": "NOT_REQUIRED"
    }
  ]
}
```

### Update Attendee RSVP

Updates the RSVP status for an attendee.

**Endpoint:** `PUT /events/{eventId}/attendees/{userId}/rsvp`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event
- `userId` (string, required): Unique identifier of the user
- `status` (string, required): RSVP status (GOING, MAYBE, NOT_GOING, NO_RESPONSE)

**Responses:**
- 200 OK: RSVP status updated successfully
- 400 Bad Request: Invalid RSVP status
- 404 Not Found: Event or attendee not found

**Example:**
```
PUT /events/123e4567-e89b-12d3-a456-426614174000/attendees/456e7890-e12b-34d5-a678-901234567000/rsvp
```

```json
{
  "status": "GOING"
}
```

```json
{
  "data": {
    "id": "abc12345-de67-89f0-1234-56789abcdef0",
    "eventId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "456e7890-e12b-34d5-a678-901234567000",
    "rsvpStatus": "GOING",
    "rsvpTime": "2023-07-05T14:20:00Z",
    "hasCheckedIn": false,
    "paymentStatus": "NOT_REQUIRED"
  }
}
```

### Update Attendee Check-in

Updates the check-in status for an attendee.

**Endpoint:** `PUT /events/{eventId}/attendees/{userId}/checkin`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event
- `userId` (string, required): Unique identifier of the user
- `hasCheckedIn` (boolean, required): Whether the user has checked in
- `coordinates` (object, optional): Check-in location coordinates
  - `latitude` (number): Latitude coordinate
  - `longitude` (number): Longitude coordinate

**Responses:**
- 200 OK: Check-in status updated successfully
- 400 Bad Request: Invalid check-in data or user not RSVP'd as GOING or MAYBE
- 404 Not Found: Event or attendee not found

**Example:**
```
PUT /events/123e4567-e89b-12d3-a456-426614174000/attendees/456e7890-e12b-34d5-a678-901234567000/checkin
```

```json
{
  "hasCheckedIn": true,
  "coordinates": {
    "latitude": 47.6568,
    "longitude": -122.4143
  }
}
```

```json
{
  "data": {
    "id": "abc12345-de67-89f0-1234-56789abcdef0",
    "eventId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "456e7890-e12b-34d5-a678-901234567000",
    "rsvpStatus": "GOING",
    "rsvpTime": "2023-07-05T14:20:00Z",
    "hasCheckedIn": true,
    "checkedInAt": "2023-07-15T10:05:00Z",
    "paymentStatus": "NOT_REQUIRED"
  }
}
```

### Get Event Attendance Statistics

Retrieves attendance statistics for an event.

**Endpoint:** `GET /events/{eventId}/attendance-stats`

**Parameters:**
- `eventId` (string, required): Unique identifier of the event

**Responses:**
- 200 OK: Attendance statistics retrieved successfully
- 404 Not Found: Event not found

**Example:**
```
GET /events/123e4567-e89b-12d3-a456-426614174000/attendance-stats
```

```json
{
  "data": {
    "totalAttendees": 5,
    "going": 3,
    "maybe": 1,
    "notGoing": 1,
    "noResponse": 0,
    "checkedIn": 2,
    "attendanceRate": 0.67,
    "responseRate": 1.0
  }
}
```

## Event Discovery

Endpoints for discovering events based on various criteria.

### Discover Events by Location

Finds events near a specific location.

**Endpoint:** `GET /discover/nearby`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `radius` (number, optional, default: 10): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Nearby events retrieved successfully
- 400 Bad Request: Invalid coordinates or radius

**Example:**
```
GET /discover/nearby?latitude=47.6062&longitude=-122.3321&radius=5&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "coordinates": {
          "latitude": 47.6568,
          "longitude": -122.4143
        },
        "distance": 4.8
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Discover Events by Interest

Finds events matching specific interest categories.

**Endpoint:** `GET /discover/interests`

**Parameters:**
- `categories` (string[], required): Interest categories (comma-separated)
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Interest-based events retrieved successfully
- 400 Bad Request: Invalid categories

**Example:**
```
GET /discover/interests?categories=OUTDOOR_ACTIVITIES,NATURE&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Discover Weather-Based Events

Finds events suitable for current or forecasted weather conditions.

**Endpoint:** `GET /discover/weather`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `date` (string (ISO date), optional, default: current date): Date for weather forecast
- `preferOutdoor` (boolean, optional, default: false): Whether to prefer outdoor activities in good weather
- `preferIndoor` (boolean, optional, default: false): Whether to prefer indoor activities in bad weather
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Weather-based events retrieved successfully
- 400 Bad Request: Invalid coordinates or date

**Example:**
```
GET /discover/weather?latitude=47.6062&longitude=-122.3321&date=2023-07-15&preferOutdoor=true&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "eventType": "IN_PERSON",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1,
    "weather": {
      "date": "2023-07-15",
      "temperature": 75,
      "conditions": "Sunny",
      "precipitation": 0,
      "windSpeed": 5,
      "isOutdoorFriendly": true
    }
  }
}
```

### Discover Popular Events

Finds trending or popular events.

**Endpoint:** `GET /discover/popular`

**Parameters:**
- `latitude` (number, optional): Latitude coordinate for location-based filtering
- `longitude` (number, optional): Longitude coordinate for location-based filtering
- `radius` (number, optional, default: 25): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Popular events retrieved successfully

**Example:**
```
GET /discover/popular?latitude=47.6062&longitude=-122.3321&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "attendeeCount": 15,
        "popularity": 0.85
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Discover Budget-Friendly Events

Finds free or low-cost events.

**Endpoint:** `GET /discover/budget`

**Parameters:**
- `maxCost` (number, optional, default: 0): Maximum event cost
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Budget-friendly events retrieved successfully

**Example:**
```
GET /discover/budget?maxCost=10&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "cost": 0
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Discover Events for Timeframe

Finds events within a specific date/time range.

**Endpoint:** `GET /discover/timeframe`

**Parameters:**
- `startDate` (string (ISO date), required): Start date for timeframe
- `endDate` (string (ISO date), required): End date for timeframe
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Time-based events retrieved successfully
- 400 Bad Request: Invalid date range

**Example:**
```
GET /discover/timeframe?startDate=2023-07-15&endDate=2023-07-16&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

## Event Recommendations

Endpoints for personalized event recommendations.

### Get Personalized Recommendations

Retrieves personalized event recommendations for a user.

**Endpoint:** `GET /recommendations/user/{userId}`

**Parameters:**
- `userId` (string, required): Unique identifier of the user
- `latitude` (number, optional): Latitude coordinate for location-based recommendations
- `longitude` (number, optional): Longitude coordinate for location-based recommendations
- `radius` (number, optional, default: 25): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Personalized recommendations retrieved successfully
- 400 Bad Request: Invalid parameters

**Example:**
```
GET /recommendations/user/456e7890-e12b-34d5-a678-901234567000?latitude=47.6062&longitude=-122.3321&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
        "relevanceScore": 0.92,
        "matchReason": "Based on your interest in outdoor activities"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Tribe Recommendations

Retrieves event recommendations for a tribe.

**Endpoint:** `GET /recommendations/tribe/{tribeId}`

**Parameters:**
- `tribeId` (string, required): Unique identifier of the tribe
- `latitude` (number, optional): Latitude coordinate for location-based recommendations
- `longitude` (number, optional): Longitude coordinate for location-based recommendations
- `radius` (number, optional, default: 25): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Tribe recommendations retrieved successfully
- 400 Bad Request: Invalid parameters

**Example:**
```
GET /recommendations/tribe/789e0123-e45b-67d8-a901-234567890000?latitude=47.6062&longitude=-122.3321&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
        "relevanceScore": 0.88,
        "matchReason": "Based on your tribe's interest in outdoor activities"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Weather-Based Recommendations

Retrieves event recommendations based on weather conditions.

**Endpoint:** `GET /recommendations/weather`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `date` (string (ISO date), optional, default: current date): Date for weather forecast
- `preferOutdoor` (boolean, optional, default: false): Whether to prefer outdoor activities in good weather
- `preferIndoor` (boolean, optional, default: false): Whether to prefer indoor activities in bad weather
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Weather-based recommendations retrieved successfully
- 400 Bad Request: Invalid coordinates or date

**Example:**
```
GET /recommendations/weather?latitude=47.6062&longitude=-122.3321&date=2023-07-15&preferOutdoor=true&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
        "weatherSuitability": 0.95,
        "matchReason": "Perfect weather for hiking"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1,
    "weather": {
      "date": "2023-07-15",
      "temperature": 75,
      "conditions": "Sunny",
      "precipitation": 0,
      "windSpeed": 5,
      "isOutdoorFriendly": true
    }
  }
}
```

### Get Budget-Friendly Recommendations

Retrieves recommendations for free or low-cost events.

**Endpoint:** `GET /recommendations/budget`

**Parameters:**
- `maxCost` (number, optional, default: 10): Maximum event cost
- `latitude` (number, optional): Latitude coordinate for location-based filtering
- `longitude` (number, optional): Longitude coordinate for location-based filtering
- `radius` (number, optional, default: 25): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Budget-friendly recommendations retrieved successfully

**Example:**
```
GET /recommendations/budget?maxCost=10&latitude=47.6062&longitude=-122.3321&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "cost": 0,
        "matchReason": "Free outdoor activity"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Spontaneous Recommendations

Retrieves recommendations for spontaneous activities happening soon.

**Endpoint:** `GET /recommendations/spontaneous`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `radius` (number, optional, default: 10): Search radius in miles
- `hoursAhead` (number, optional, default: 6): Hours ahead to look for events
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Spontaneous recommendations retrieved successfully
- 400 Bad Request: Invalid coordinates

**Example:**
```
GET /recommendations/spontaneous?latitude=47.6062&longitude=-122.3321&radius=10&hoursAhead=6&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "distance": 4.8,
        "startsIn": "3 hours",
        "matchReason": "Happening soon near you"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Recommendations by Interest

Retrieves event recommendations based on specific interests.

**Endpoint:** `GET /recommendations/interests`

**Parameters:**
- `interests` (string[], required): Interest categories (comma-separated)
- `latitude` (number, optional): Latitude coordinate for location-based filtering
- `longitude` (number, optional): Longitude coordinate for location-based filtering
- `radius` (number, optional, default: 25): Search radius in miles
- `startDate` (string (ISO date), optional): Filter events starting on or after this date
- `endDate` (string (ISO date), optional): Filter events ending on or before this date
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Interest-based recommendations retrieved successfully
- 400 Bad Request: Invalid interests

**Example:**
```
GET /recommendations/interests?interests=OUTDOOR_ACTIVITIES,NATURE&latitude=47.6062&longitude=-122.3321&startDate=2023-07-01&page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Trail Hike @ Discovery Park - Lighthouse Trail",
        "description": "Let's explore the new lighthouse trail and have a picnic after.",
        "startTime": "2023-07-15T09:30:00Z",
        "endTime": "2023-07-15T14:30:00Z",
        "location": "Discovery Park, Seattle",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
        "matchReason": "Matches your outdoor activity interest"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Get Similar Event Recommendations

Retrieves recommendations for events similar to a specified event.

**Endpoint:** `GET /recommendations/similar/{eventId}`

**Parameters:**
- `eventId` (string, required): Unique identifier of the reference event
- `page` (number, optional, default: 1): Page number for pagination
- `limit` (number, optional, default: 10): Number of events per page

**Responses:**
- 200 OK: Similar event recommendations retrieved successfully
- 404 Not Found: Reference event not found

**Example:**
```
GET /recommendations/similar/123e4567-e89b-12d3-a456-426614174000?page=1&limit=10
```

```json
{
  "data": {
    "events": [
      {
        "id": "234f5678-f90a-23e4-b567-789012345000",
        "name": "Sunset Hike @ Carkeek Park",
        "description": "Join us for a beautiful sunset hike at Carkeek Park.",
        "startTime": "2023-07-22T18:30:00Z",
        "endTime": "2023-07-22T21:30:00Z",
        "location": "Carkeek Park, Seattle",
        "categories": ["OUTDOOR_ACTIVITIES", "NATURE"],
        "similarityScore": 0.89,
        "matchReason": "Similar outdoor hiking activity"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

## Weather Services

Endpoints for retrieving weather data and weather-based activity suggestions.

### Get Current Weather

Retrieves current weather data for a specific location.

**Endpoint:** `GET /weather/current`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate

**Responses:**
- 200 OK: Weather data retrieved successfully
- 400 Bad Request: Invalid coordinates
- 503 Service Unavailable: Weather service unavailable

**Example:**
```
GET /weather/current?latitude=47.6062&longitude=-122.3321
```

```json
{
  "data": {
    "temperature": 75,
    "conditions": "Sunny",
    "precipitation": 0,
    "windSpeed": 5,
    "humidity": 45,
    "feelsLike": 76,
    "uvIndex": 7,
    "isOutdoorFriendly": true,
    "location": "Seattle, WA",
    "timestamp": "2023-07-15T12:00:00Z"
  }
}
```

### Get Weather Forecast

Retrieves weather forecast for a specific location.

**Endpoint:** `GET /weather/forecast`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `days` (number, optional, default: 5): Number of days to forecast

**Responses:**
- 200 OK: Forecast data retrieved successfully
- 400 Bad Request: Invalid coordinates or days parameter
- 503 Service Unavailable: Weather service unavailable

**Example:**
```
GET /weather/forecast?latitude=47.6062&longitude=-122.3321&days=3
```

```json
{
  "data": {
    "location": "Seattle, WA",
    "forecast": [
      {
        "date": "2023-07-15",
        "temperature": 75,
        "conditions": "Sunny",
        "precipitation": 0,
        "windSpeed": 5,
        "humidity": 45,
        "isOutdoorFriendly": true
      },
      {
        "date": "2023-07-16",
        "temperature": 78,
        "conditions": "Partly Cloudy",
        "precipitation": 10,
        "windSpeed": 7,
        "humidity": 50,
        "isOutdoorFriendly": true
      },
      {
        "date": "2023-07-17",
        "temperature": 72,
        "conditions": "Cloudy",
        "precipitation": 30,
        "windSpeed": 10,
        "humidity": 65,
        "isOutdoorFriendly": true
      }
    ]
  }
}
```

### Get Weather for Date

Retrieves weather forecast for a specific date and location.

**Endpoint:** `GET /weather/date`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `date` (string (ISO date), required): Date for weather forecast

**Responses:**
- 200 OK: Weather data retrieved successfully
- 400 Bad Request: Invalid coordinates or date
- 503 Service Unavailable: Weather service unavailable

**Example:**
```
GET /weather/date?latitude=47.6062&longitude=-122.3321&date=2023-07-15
```

```json
{
  "data": {
    "date": "2023-07-15",
    "temperature": 75,
    "conditions": "Sunny",
    "precipitation": 0,
    "windSpeed": 5,
    "humidity": 45,
    "isOutdoorFriendly": true,
    "location": "Seattle, WA"
  }
}
```

### Get Weather Suitability

Retrieves weather suitability scores for different activity types.

**Endpoint:** `GET /weather/suitability`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `date` (string (ISO date), optional): Date for weather forecast (defaults to current date)

**Responses:**
- 200 OK: Suitability scores retrieved successfully
- 400 Bad Request: Invalid coordinates or date
- 503 Service Unavailable: Weather service unavailable

**Example:**
```
GET /weather/suitability?latitude=47.6062&longitude=-122.3321&date=2023-07-15
```

```json
{
  "data": {
    "weather": {
      "date": "2023-07-15",
      "temperature": 75,
      "conditions": "Sunny",
      "precipitation": 0,
      "windSpeed": 5,
      "humidity": 45,
      "location": "Seattle, WA"
    },
    "suitability": {
      "outdoor": 0.95,
      "hiking": 0.92,
      "beach": 0.88,
      "sports": 0.9,
      "picnic": 0.95,
      "indoor": 0.6
    }
  }
}
```

### Suggest Activity Type

Suggests whether indoor or outdoor activities are more suitable based on weather.

**Endpoint:** `GET /weather/suggest-activity`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `date` (string (ISO date), optional): Date for weather forecast (defaults to current date)

**Responses:**
- 200 OK: Activity suggestion retrieved successfully
- 400 Bad Request: Invalid coordinates or date
- 503 Service Unavailable: Weather service unavailable

**Example:**
```
GET /weather/suggest-activity?latitude=47.6062&longitude=-122.3321&date=2023-07-15
```

```json
{
  "data": {
    "weather": {
      "date": "2023-07-15",
      "temperature": 75,
      "conditions": "Sunny",
      "precipitation": 0,
      "windSpeed": 5,
      "humidity": 45,
      "location": "Seattle, WA"
    },
    "recommendation": "Outdoor activities are highly recommended today!",
    "isOutdoorRecommended": true,
    "reason": "Sunny conditions with comfortable temperature and no precipitation"
  }
}
```

### Get Weather-Based Activities

Retrieves activity recommendations based on weather conditions.

**Endpoint:** `POST /weather/activities`

**Parameters:**
- `latitude` (number, required): Latitude coordinate
- `longitude` (number, required): Longitude coordinate
- `date` (string (ISO date), optional): Date for weather forecast (defaults to current date)
- `preferOutdoor` (boolean, optional, default: false): Whether to prefer outdoor activities in good weather
- `preferIndoor` (boolean, optional, default: false): Whether to prefer indoor activities in bad weather
- `interests` (string[], optional): Interest categories to filter activities

**Responses:**
- 200 OK: Weather-based activities retrieved successfully
- 400 Bad Request: Invalid parameters
- 503 Service Unavailable: Weather service unavailable

**Example:**
```
POST /weather/activities
```

```json
{
  "latitude": 47.6062,
  "longitude": -122.3321,
  "date": "2023-07-15",
  "preferOutdoor": true,
  "interests": ["OUTDOOR_ACTIVITIES", "NATURE"]
}
```

```json
{
  "data": {
    "weather": {
      "date": "2023-07-15",
      "temperature": 75,
      "conditions": "Sunny",
      "precipitation": 0,
      "windSpeed": 5,
      "humidity": 45,
      "location": "Seattle, WA"
    },
    "isOutdoorRecommended": true,
    "activities": {
      "recommended": [
        "Hiking at Discovery Park",
        "Picnic at Green Lake",
        "Kayaking on Lake Union",
        "Biking the Burke-Gilman Trail"
      ],
      "alternative": [
        "Visit the Seattle Aquarium",
        "Tour the Museum of Pop Culture",
        "Indoor rock climbing"
      ]
    }
  }
}
```

## Data Models

Reference documentation for data models used in the Event Service API.

### Event

The core event data model.

```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "tribeId": "string (UUID)",
  "createdBy": "string (UUID)",
  "eventType": "string (IN_PERSON, VIRTUAL, HYBRID)",
  "status": "string (DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED)",
  "visibility": "string (TRIBE_ONLY, PUBLIC)",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)",
  "location": "string",
  "coordinates": {
    "latitude": "number",
    "longitude": "number"
  },
  "venueId": "string (optional)",
  "weatherData": "IWeatherData (optional)",
  "cost": "number",
  "paymentRequired": "boolean",
  "maxAttendees": "number (optional)",
  "categories": "string[]",
  "metadata": "object (optional)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### EventAttendee

The event attendee data model.

```json
{
  "id": "string (UUID)",
  "eventId": "string (UUID)",
  "userId": "string (UUID)",
  "rsvpStatus": "string (GOING, MAYBE, NOT_GOING, NO_RESPONSE)",
  "rsvpTime": "string (ISO date)",
  "hasCheckedIn": "boolean",
  "checkedInAt": "string (ISO date) (optional)",
  "paymentStatus": "string (NOT_REQUIRED, PENDING, COMPLETED, FAILED)",
  "paymentAmount": "number (optional)",
  "paymentId": "string (optional)",
  "metadata": "object (optional)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### WeatherData

The weather data model.

```json
{
  "date": "string (ISO date) (optional)",
  "temperature": "number",
  "conditions": "string",
  "precipitation": "number",
  "windSpeed": "number",
  "humidity": "number (optional)",
  "feelsLike": "number (optional)",
  "uvIndex": "number (optional)",
  "isOutdoorFriendly": "boolean",
  "location": "string (optional)",
  "timestamp": "string (ISO date) (optional)"
}
```

### Coordinates

The geographic coordinates model.

```json
{
  "latitude": "number",
  "longitude": "number"
}
```

### EventSearchParams

Parameters for searching events.

```json
{
  "query": "string (optional)",
  "tribeId": "string (optional)",
  "userId": "string (optional)",
  "status": "string (optional)",
  "eventType": "string (optional)",
  "categories": "string[] (optional)",
  "coordinates": "ICoordinates (optional)",
  "radius": "number (optional)",
  "startDate": "string (ISO date) (optional)",
  "endDate": "string (ISO date) (optional)",
  "maxCost": "number (optional)",
  "page": "number (optional)",
  "limit": "number (optional)"
}
```

### EventRecommendationParams

Parameters for event recommendations.

```json
{
  "userId": "string (optional)",
  "tribeId": "string (optional)",
  "coordinates": "ICoordinates (optional)",
  "radius": "number (optional)",
  "startDate": "string (ISO date) (optional)",
  "endDate": "string (ISO date) (optional)",
  "categories": "string[] (optional)",
  "maxCost": "number (optional)",
  "page": "number (optional)",
  "limit": "number (optional)"
}
```

### WeatherBasedActivityParams

Parameters for weather-based activity recommendations.

```json
{
  "coordinates": "ICoordinates",
  "date": "string (ISO date) (optional)",
  "preferOutdoor": "boolean (optional)",
  "preferIndoor": "boolean (optional)",
  "interests": "string[] (optional)",
  "page": "number (optional)",
  "limit": "number (optional)"
}
```

## Error Handling

Information about error responses and handling.

### Error Response Format

All error responses follow a standard format.

```json
{
  "error": "string (error code)",
  "message": "string (human-readable error message)",
  "details": "object (optional, additional error details)"
}
```

Example:
```json
{
  "error": "NOT_FOUND",
  "message": "Event with ID '123e4567-e89b-12d3-a456-426614174000' not found",
  "details": {
    "resourceType": "Event",
    "resourceId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Common Error Codes

Common error codes returned by the API.

| Code | Status | Description |
|------|--------|-------------|
| BAD_REQUEST | 400 | Invalid request parameters or body |
| UNAUTHORIZED | 401 | Authentication required or invalid credentials |
| FORBIDDEN | 403 | Insufficient permissions to access the resource |
| NOT_FOUND | 404 | Requested resource not found |
| CONFLICT | 409 | Request conflicts with current state of the resource |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable (e.g., weather API) |

### Validation Errors

Validation errors include details about the specific validation failures.

```json
{
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": {
    "errors": [
      {
        "field": "name",
        "message": "Event name is required"
      },
      {
        "field": "startTime",
        "message": "Start time must be in the future"
      }
    ]
  }
}
```

## Rate Limiting

Information about API rate limiting.

### Rate Limit Headers

The API includes rate limit information in response headers.

| Header | Description |
|--------|-------------|
| X-RateLimit-Limit | Maximum number of requests allowed in the current time window |
| X-RateLimit-Remaining | Number of requests remaining in the current time window |
| X-RateLimit-Reset | Time (in seconds) until the rate limit window resets |

### Rate Limit Tiers

Different endpoints have different rate limits.

| Tier | Limit | Endpoints |
|------|-------|-----------|
| Standard | 60 requests per minute | Most read-only endpoints |
| Write Operations | 30 requests per minute | Create, update, and delete operations |
| AI Operations | 20 requests per minute | Recommendation and weather-based endpoints |

### Rate Limit Exceeded

When rate limits are exceeded, the API returns a 429 Too Many Requests response.

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Please try again later.",
  "details": {
    "retryAfter": 30
  }
}
```

## Webhooks

Information about event-related webhooks.

### Available Webhooks

Webhooks that can be configured for event notifications.

| Event | Description | Payload |
|-------|-------------|---------|
| event.created | Triggered when a new event is created | `{ "eventId": "string", "tribeId": "string", "createdBy": "string", "createdAt": "string (ISO date)" }` |
| event.updated | Triggered when an event is updated | `{ "eventId": "string", "tribeId": "string", "updatedBy": "string", "updatedAt": "string (ISO date)", "changes": "object" }` |
| event.cancelled | Triggered when an event is cancelled | `{ "eventId": "string", "tribeId": "string", "cancelledBy": "string", "cancelledAt": "string (ISO date)" }` |
| event.rsvp | Triggered when a user RSVPs to an event | `{ "eventId": "string", "tribeId": "string", "userId": "string", "rsvpStatus": "string", "rsvpTime": "string (ISO date)" }` |
| event.checkin | Triggered when a user checks in to an event | `{ "eventId": "string", "tribeId": "string", "userId": "string", "checkedInAt": "string (ISO date)" }` |

### Webhook Configuration

Information about configuring webhooks.

**Endpoint:** `POST /webhooks`

**Parameters:**
- `url` (string, required): The URL to send webhook events to
- `events` (string[], required): Array of event types to subscribe to
- `secret` (string, required): Secret key for webhook signature verification

**Example:**
```
POST /webhooks
```

```json
{
  "url": "https://example.com/webhook",
  "events": ["event.created", "event.rsvp"],
  "secret": "your_webhook_secret"
}
```

```json
{
  "data": {
    "id": "wh_123456789",
    "url": "https://example.com/webhook",
    "events": ["event.created", "event.rsvp"],
    "createdAt": "2023-07-01T12:00:00Z"
  }
}
```

### Webhook Security

Information about webhook security.

- Signature Header: `X-Tribe-Signature`
- Signature Algorithm: HMAC-SHA256
- Signature Format: `t=timestamp,v=signature`
- Verification: Compute HMAC-SHA256 of the timestamp + '.' + request body using your webhook secret as the key, and compare to the 'v' value in the signature header.