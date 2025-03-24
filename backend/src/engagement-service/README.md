# Engagement Service

AI-driven service that provides conversation prompts, challenges, and activity suggestions to maintain group engagement in the Tribe platform.

## Overview

The Engagement Service is a critical component of the Tribe platform that helps facilitate meaningful interactions between tribe members. It uses AI to generate contextually relevant conversation starters, group challenges, and activity suggestions based on tribe characteristics, member personalities, and environmental factors like weather and location.

## Features

- **Conversation Prompts**: AI-generated conversation starters tailored to tribe interests and context
- **Group Challenges**: Interactive challenges to encourage participation and bonding  
- **Activity Suggestions**: Contextual recommendations for group activities
- **Engagement Tracking**: Monitoring of prompt effectiveness and response rates
- **AI Integration**: Seamless integration with OpenRouter API through AI Orchestration Service

## Architecture

The Engagement Service follows a microservice architecture pattern and is built with Express.js and Node.js. It communicates with the AI Orchestration Service to leverage AI capabilities for generating personalized engagement content.

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/prompts` | GET, POST | Retrieve and create conversation prompts |
| `/api/v1/prompts/:id` | GET, PUT, DELETE | Manage individual prompts |
| `/api/v1/challenges` | GET, POST | Retrieve and create group challenges |
| `/api/v1/challenges/:id` | GET, PUT, DELETE | Manage individual challenges |
| `/api/v1/engagements` | GET, POST | Retrieve and create engagement instances |
| `/api/v1/engagements/:id` | GET, PUT, DELETE | Manage individual engagement instances |
| `/api/v1/engagements/:id/responses` | POST | Record user responses to engagements |
| `/api/v1/engagements/metrics` | GET | Retrieve engagement effectiveness metrics |
| `/health` | GET | Health check endpoint |
| `/metrics` | GET | Service metrics endpoint |

## Data Models

### Prompt

Template for generating engagement content

- **type**: Type of prompt (CONVERSATION_STARTER, ACTIVITY_SUGGESTION, etc.)
- **category**: Category of prompt (GENERAL, INTEREST_BASED, etc.)
- **content**: The prompt template text
- **variables**: Dynamic variables that can be replaced in the template
- **tags**: Keywords for filtering and categorization
- **usageCount**: Number of times the prompt has been used
- **effectivenessScore**: Measure of how well the prompt generates responses

### Challenge

Group activity challenge

- **type**: Type of challenge (PHOTO, CREATIVE, SOCIAL, etc.)
- **title**: Challenge title
- **description**: Detailed challenge description
- **duration**: Time period for the challenge
- **difficulty**: Challenge difficulty level
- **tags**: Keywords for filtering and categorization
- **status**: Current status of the challenge

### Engagement

Instance of an engagement sent to a tribe

- **type**: Type of engagement (CONVERSATION_PROMPT, ACTIVITY_SUGGESTION, etc.)
- **tribeId**: ID of the tribe receiving the engagement
- **content**: The actual engagement content
- **trigger**: What triggered this engagement (SCHEDULED, LOW_ACTIVITY, etc.)
- **status**: Current status of the engagement
- **sentAt**: When the engagement was sent
- **expiresAt**: When the engagement expires
- **responses**: Array of user responses to the engagement

## Dependencies

- **express**: Web framework for the API
- **mongoose**: MongoDB object modeling
- **joi**: Schema validation
- **axios**: HTTP client for AI service communication
- **@tribe/shared**: Shared utilities and middleware
- **AI Orchestration Service**: For accessing AI capabilities

## Configuration

The service is configured via environment variables:

- **PORT**: Port to run the service on (default: 3004)
- **MONGODB_URI**: MongoDB connection string
- **AI_ORCHESTRATION_SERVICE_URL**: URL of the AI Orchestration Service
- **LOG_LEVEL**: Logging level (default: info)
- **NODE_ENV**: Environment (development, test, production)

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables (see Configuration section)
3. Start the service: `npm run dev` (development) or `npm start` (production)
4. Access the API at http://localhost:3004

## Testing

- Run unit tests: `npm test`
- Run tests with coverage: `npm run test:coverage`
- Run tests in watch mode: `npm run test:watch`

## Deployment

The service is deployed as a Docker container within the Kubernetes cluster. See the Dockerfile in this directory and the Kubernetes deployment configuration in the infrastructure directory.

## Monitoring

The service exposes metrics at the `/metrics` endpoint and health status at the `/health` endpoint. These are used by Prometheus and the Kubernetes liveness/readiness probes.

## AI Integration

The Engagement Service integrates with the AI Orchestration Service to access AI capabilities. This includes generating personalized conversation prompts, challenges, and activity suggestions based on tribe characteristics and member personalities.

## Performance Considerations

- AI request caching to reduce latency and API costs
- Batch processing for scheduled engagements
- Prompt template system to reduce AI generation needs
- Effectiveness tracking to optimize prompt selection

## Related Services

- **AI Orchestration Service**: Provides access to AI models
- **Tribe Service**: Manages tribe data used for contextualizing engagements
- **Profile Service**: Provides personality data for personalization
- **Notification Service**: Delivers engagement notifications to users