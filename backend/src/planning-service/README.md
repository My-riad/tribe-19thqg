# Planning Service

AI-powered planning and coordination service for the Tribe platform that facilitates real-world meetups by handling event scheduling, availability collection, venue recommendations, and automated reminders.

## Overview

The Planning Service is a critical component of the Tribe platform that bridges the gap between digital interactions and physical meetups. It uses AI to optimize scheduling based on member availability, recommend suitable venues, and coordinate the logistics of in-person gatherings. This service works closely with the Event Service and Notification Service to create a seamless planning experience for Tribe members.

## Features

- AI-optimized time slot suggestions based on member availability
- Intelligent venue recommendations based on group preferences and requirements
- Availability collection and management for tribe members
- Voting system for time slots and venues
- Automated reminder scheduling for upcoming events
- Cross-timezone support for global tribes
- Accessibility-aware venue recommendations

## Architecture

The Planning Service follows a microservice architecture pattern and is built with Node.js and Express. It communicates with other services via RESTful APIs and uses PostgreSQL for data persistence. The service integrates with the AI Orchestration Service to leverage AI capabilities for optimized planning suggestions.

## Core Components

- **Planning Model**: Manages planning sessions and event coordination
- **Availability Model**: Handles user availability data collection and processing
- **Venue Model**: Provides venue search, recommendation, and suitability scoring
- **Scheduling Algorithms**: Optimizes time slots based on member availability
- **Reminder System**: Generates and manages event reminder schedules

## API Endpoints

- `/api/v1/planning` - Planning session management
- `/api/v1/availability` - User availability management
- `/api/v1/scheduling` - Scheduling optimization
- `/api/v1/venues` - Venue search and recommendations
- `/health` - Service health check
- `/metrics` - Service metrics for monitoring

## Getting Started

To run the Planning Service locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Start the service: `npm run dev`

The service will be available at http://localhost:3004 by default.

## Environment Variables

- `PORT` - Port number (default: 3004)
- `NODE_ENV` - Environment (development, staging, production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string for caching
- `AI_ORCHESTRATION_SERVICE_URL` - URL for AI service integration
- `GOOGLE_PLACES_API_KEY` - API key for venue data
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Docker

The service can be containerized using Docker:

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

## Testing

The service includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Key Workflows

1. **Planning Session Creation**: A tribe member initiates event planning, setting preferences and deadlines.

2. **Availability Collection**: Members submit their available time slots through the availability API.

3. **Optimal Time Suggestion**: The service analyzes availability data and uses AI to suggest optimal meeting times.

4. **Venue Recommendation**: Based on the selected time and group preferences, the service recommends suitable venues.

5. **Voting Process**: Members vote on preferred time slots and venues.

6. **Plan Finalization**: The organizer finalizes the event details based on voting results or AI suggestions.

7. **Reminder Scheduling**: The service generates a schedule of reminders for the event.

## Integration Points

- **Event Service**: For event creation and management
- **Notification Service**: For sending reminders and notifications
- **AI Orchestration Service**: For AI-powered suggestions
- **Profile Service**: For user preference and location data
- **Tribe Service**: For tribe membership and group information
- **External APIs**: Google Places API for venue data

## Monitoring

The service exposes metrics at the `/metrics` endpoint in Prometheus format, including:

- Request counts and latencies
- Planning session creation rate
- Availability submission rate
- Venue recommendation performance
- AI suggestion quality metrics

## Contributing

1. Follow the coding standards defined in .eslintrc.js
2. Write tests for new features
3. Update documentation as needed
4. Submit a pull request for review