# Event Service

## Overview

The Event Service is a microservice responsible for event discovery, recommendations, weather-based activity suggestions, and event management within the Tribe platform. It provides a comprehensive set of APIs for creating, managing, and discovering events, as well as generating personalized event recommendations based on user preferences, tribe interests, and contextual factors like weather conditions.

## Key Features

- **Event Management**: Create, read, update, and delete events
- **RSVP & Attendance Tracking**: Manage event attendance and check-ins
- **Event Discovery**: Search and filter events based on various criteria
- **AI-Powered Recommendations**: Personalized event recommendations for users and tribes
- **Weather-Based Suggestions**: Activity recommendations based on current and forecasted weather
- **External Event Integration**: Discover events from Eventbrite, Meetup, and other sources
- **Budget-Friendly Options**: Find free or low-cost events and activities

## Architecture

The Event Service follows a microservice architecture pattern with the following components:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Manage data access and persistence
- **Integrations**: Connect to external APIs
- **Validations**: Ensure data integrity

## API Endpoints

### Event Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/events` | Get all events with pagination and filtering |
| GET | `/api/v1/events/:id` | Get a specific event by ID |
| POST | `/api/v1/events` | Create a new event |
| PUT | `/api/v1/events/:id` | Update an existing event |
| PATCH | `/api/v1/events/:id/status` | Update event status |
| DELETE | `/api/v1/events/:id` | Delete an event |
| GET | `/api/v1/events/tribe/:tribeId` | Get all events for a specific tribe |
| GET | `/api/v1/events/user/:userId` | Get all events a user is attending or created |
| GET | `/api/v1/events/upcoming` | Get upcoming events |
| GET | `/api/v1/events/:id/attendees` | Get all attendees for an event |
| PATCH | `/api/v1/events/:id/attendees/:userId/rsvp` | Update RSVP status for an attendee |
| PATCH | `/api/v1/events/:id/attendees/:userId/checkin` | Update check-in status for an attendee |
| GET | `/api/v1/events/:id/attendance-stats` | Get attendance statistics for an event |
| POST | `/api/v1/events/conflicts` | Check for scheduling conflicts |

### Event Discovery

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/events/discover` | Search for events based on various criteria |
| GET | `/api/v1/events/discover/nearby` | Find events near a specific location |
| GET | `/api/v1/events/discover/interests` | Find events matching specific interest categories |
| GET | `/api/v1/events/discover/weather` | Find events suitable for current or forecasted weather conditions |
| GET | `/api/v1/events/discover/popular` | Find trending or popular events |
| GET | `/api/v1/events/discover/budget` | Find free or low-cost events |
| GET | `/api/v1/events/discover/timeframe` | Find events within a specific date/time range |
| DELETE | `/api/v1/events/discover/cache` | Clear the discovery cache |

### Event Recommendations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/events/recommendations/user/:userId` | Get personalized event recommendations for a user |
| GET | `/api/v1/events/recommendations/tribe/:tribeId` | Get event recommendations for a tribe |
| GET | `/api/v1/events/recommendations/weather` | Get weather-based event recommendations |
| GET | `/api/v1/events/recommendations/budget` | Get budget-friendly event recommendations |
| GET | `/api/v1/events/recommendations/spontaneous` | Get recommendations for spontaneous activities happening soon |
| GET | `/api/v1/events/recommendations/interests` | Get event recommendations based on specific interests |
| GET | `/api/v1/events/recommendations/similar/:eventId` | Get recommendations for events similar to a specified event |
| GET | `/api/v1/events/recommendations/popular` | Get recommendations for trending or popular events |
| DELETE | `/api/v1/events/recommendations/cache` | Clear the recommendation cache |

### Weather API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/weather/current` | Get current weather data for a specific location |
| GET | `/api/v1/weather/forecast` | Get weather forecast for a specific location |
| GET | `/api/v1/weather/date` | Get weather forecast for a specific date and location |
| GET | `/api/v1/weather/suitability` | Get weather suitability scores for different activity types |
| GET | `/api/v1/weather/suggest-activity` | Suggest whether indoor or outdoor activities are more suitable based on weather |
| POST | `/api/v1/weather/activities` | Get activity recommendations based on weather conditions |

### Health and Metrics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/metrics` | Prometheus metrics endpoint |

## Data Models

### Event

Core event data model:

- `id`: string - Unique identifier
- `name`: string - Event name
- `description`: string - Event description
- `tribeId`: string - ID of the tribe organizing the event
- `createdBy`: string - ID of the user who created the event
- `eventType`: EventType - Type of event (IN_PERSON, VIRTUAL, HYBRID)
- `status`: EventStatus - Status of the event (DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
- `visibility`: EventVisibility - Visibility of the event (TRIBE_ONLY, PUBLIC)
- `startTime`: Date - Event start time
- `endTime`: Date - Event end time
- `location`: string - Event location description
- `coordinates`: ICoordinates - Geographic coordinates of the event
- `venueId`: string - ID of the venue
- `weatherData`: IWeatherData - Weather information for the event
- `cost`: number - Event cost
- `paymentRequired`: boolean - Whether payment is required
- `maxAttendees`: number - Maximum number of attendees
- `categories`: InterestCategory[] - Event categories
- `metadata`: Record<string, any> - Additional event metadata

### Attendee

Event attendee data model:

- `id`: string - Unique identifier
- `eventId`: string - ID of the event
- `userId`: string - ID of the user
- `rsvpStatus`: RSVPStatus - RSVP status (GOING, MAYBE, NOT_GOING, NO_RESPONSE)
- `rsvpTime`: Date - Time of RSVP
- `hasCheckedIn`: boolean - Whether the user has checked in
- `checkedInAt`: Date - Time of check-in
- `checkedInCoordinates`: ICoordinates - Coordinates of check-in location

### Venue

Venue data model:

- `id`: string - Unique identifier
- `name`: string - Venue name
- `description`: string - Venue description
- `address`: string - Venue address
- `coordinates`: ICoordinates - Geographic coordinates of the venue
- `capacity`: number - Venue capacity
- `amenities`: string[] - Available amenities
- `photos`: string[] - Venue photos
- `rating`: number - Venue rating
- `priceLevel`: number - Price level indicator
- `contactInfo`: string - Contact information
- `website`: string - Venue website
- `openingHours`: Record<string, string> - Opening hours by day
- `metadata`: Record<string, any> - Additional venue metadata

## External Integrations

### Eventbrite API

Integration with Eventbrite API for event discovery and ticket booking:

- Search for events based on various criteria
- Get event details by ID
- Find events by location
- Find events by category
- Get popular events

**Configuration**: Requires `EVENTBRITE_API_KEY` environment variable

### Meetup API

Integration with Meetup API for discovering local group events:

- Search for events based on various criteria
- Get event details by ID
- Find events by location
- Find events by category
- Get upcoming events

**Configuration**: Requires `MEETUP_API_KEY` environment variable

### Google Places API

Integration with Google Places API for venue information:

- Get venue details
- Search for venues by location
- Get venue photos
- Get venue reviews

**Configuration**: Requires `GOOGLE_PLACES_API_KEY` environment variable

### OpenWeatherMap API

Integration with OpenWeatherMap API for weather data:

- Get current weather
- Get weather forecast
- Get historical weather data

**Configuration**: Requires `OPENWEATHERMAP_API_KEY` environment variable

## Dependencies

### Internal Services

- **AI Orchestration Service**: Provides AI capabilities for event recommendations and personalization
- **Profile Service**: Provides user profile data for personalized recommendations
- **Tribe Service**: Provides tribe data for group-based recommendations
- **Notification Service**: Sends notifications for event updates and reminders

### External Libraries

- express ^4.18.2 - Web framework for creating the HTTP server and API routes
- axios ^1.4.0 - HTTP client for making requests to external event APIs
- node-cache ^5.1.2 - In-memory caching for API responses and event data
- @prisma/client ^4.16.0 - Database ORM for interacting with the PostgreSQL database
- prom-client ^14.2.0 - Prometheus client for metrics collection and exposure

## Environment Variables

| Name | Description | Default | Required |
|------|-------------|---------|----------|
| PORT | Port on which the service will listen | 3003 | No |
| NODE_ENV | Environment (development, staging, production) | development | No |
| DATABASE_URL | PostgreSQL connection string | - | Yes |
| EVENTBRITE_API_KEY | API key for Eventbrite integration | - | Yes |
| MEETUP_API_KEY | API key for Meetup integration | - | Yes |
| GOOGLE_PLACES_API_KEY | API key for Google Places integration | - | Yes |
| OPENWEATHERMAP_API_KEY | API key for OpenWeatherMap integration | - | Yes |
| EVENT_CACHE_TTL | Time-to-live for event cache in seconds | 3600 | No |
| WEATHER_CACHE_TTL | Time-to-live for weather cache in seconds | 1800 | No |
| LOG_LEVEL | Logging level (debug, info, warn, error) | info | No |
| AI_ORCHESTRATION_SERVICE_URL | URL for the AI Orchestration Service | - | Yes |

## Setup Instructions

### Local Development

1. Clone the repository
2. Navigate to the event-service directory: `cd backend/src/event-service`
3. Install dependencies: `npm install`
4. Create a `.env` file based on `.env.example`
5. Start the service: `npm run dev`

### Testing

1. Run unit tests: `npm test`
2. Run integration tests: `npm run test:integration`
3. Run all tests with coverage: `npm run test:coverage`

### Deployment

1. Build the service: `npm run build`
2. Start the service: `npm start`
3. For Docker deployment: `docker build -t tribe-event-service .`

## Metrics and Monitoring

### Prometheus Metrics

The service exposes the following metrics at the `/metrics` endpoint:

- `http_request_duration_seconds` - Histogram of request durations
- `http_requests_total` - Counter of total requests by endpoint and status
- `event_discovery_duration_seconds` - Histogram of event discovery operation durations
- `event_recommendation_duration_seconds` - Histogram of recommendation operation durations
- `external_api_request_duration_seconds` - Histogram of external API request durations
- `external_api_requests_total` - Counter of external API requests by endpoint and status

### Health Check

The service provides a health check endpoint at `/health` which checks:

- Database connectivity
- External API connectivity (Eventbrite, Meetup, etc.)
- Memory usage
- CPU usage

### Logging

The service uses structured JSON logging with the following fields:

- timestamp
- level
- message
- service
- correlationId
- requestId
- userId
- path
- method
- statusCode
- responseTime

## Contributing

Please refer to the main repository's contributing guidelines.

## License

This project is proprietary and confidential. Unauthorized copying, transferring, or reproduction of the contents of this repository, via any medium, is strictly prohibited.