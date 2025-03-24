# Tribe Matching Service

AI-powered matchmaking and tribe formation microservice for the Tribe platform.

## Overview

The Matching Service is a critical component of the Tribe platform responsible for analyzing user profiles, calculating compatibility between users, and forming balanced tribes based on personality traits, interests, communication styles, and location proximity. It leverages AI algorithms to create meaningful connections that encourage real-world interactions.

## Features

### Compatibility Analysis
- Calculate compatibility between users based on multiple factors
- Determine user-to-tribe compatibility with existing groups
- Batch processing for efficient compatibility calculations
- Configurable factor weights for personalized matching

### AI-Powered Matchmaking
- Automatic tribe formation based on compatibility algorithms
- Weekly auto-matching for users who opt in
- Manual matching requests for immediate results
- Batch matching for administrative operations

### Tribe Formation
- Create balanced groups of 4-8 members
- Optimize for psychological diversity and shared interests
- Assign users to existing tribes when appropriate
- Form new tribes when optimal matches aren't found

### Tribe Suggestions
- Generate personalized tribe recommendations
- Provide detailed compatibility explanations
- Refresh suggestions based on new data
- Filter suggestions by location and interests

## Architecture

The Matching Service follows a microservices architecture and is designed to be scalable, resilient, and maintainable.

### Core Components
- **Controllers**: Handle HTTP requests and API endpoints
- **Services**: Implement business logic and orchestrate operations
- **Algorithms**: Implement the core matching and compatibility logic
- **Models**: Define data structures and interfaces
- **Validation**: Ensure data integrity and request validation
- **Queue**: Process matching operations asynchronously

### Key Algorithms
- **Compatibility Algorithm**: Calculates compatibility scores between users and tribes
- **Clustering Algorithm**: Groups users based on compatibility and constraints
- **Tribe Formation Algorithm**: Creates balanced tribes with optimal group dynamics
- **Optimization Algorithm**: Refines tribe assignments for maximum overall compatibility

### Integration Points
- **Profile Service**: Retrieves user personality profiles and preferences
- **Tribe Service**: Creates and updates tribes based on matching results
- **AI Orchestration Service**: Enhances matching with advanced AI capabilities
- **Notification Service**: Notifies users of new matches and suggestions

## API Endpoints

The Matching Service exposes the following RESTful API endpoints:

### Compatibility Endpoints
- `GET /api/compatibility/users/:userId/with/:targetUserId` - Get compatibility between two users
- `GET /api/compatibility/users/:userId/with-tribe/:tribeId` - Get compatibility between a user and a tribe
- `POST /api/compatibility/calculate` - Calculate compatibility based on request body
- `POST /api/compatibility/calculate-batch` - Calculate compatibility for multiple targets
- `GET /api/compatibility/users/:userId/most-compatible-tribes` - Find most compatible tribes for a user
- `GET /api/compatibility/tribes/:tribeId/most-compatible-users` - Find most compatible users for a tribe

### Matching Endpoints
- `GET /api/matching/operations/:operationId` - Get details of a matching operation
- `GET /api/matching/operations/:operationId/results` - Get results of a matching operation
- `GET /api/matching/users/:userId/preferences` - Get user's matching preferences
- `PUT /api/matching/users/:userId/preferences` - Update user's matching preferences
- `POST /api/matching/users/:userId/opt-in` - Opt in for automatic matching
- `POST /api/matching/users/:userId/opt-out` - Opt out from automatic matching
- `POST /api/matching/users/:userId/match` - Request immediate matching for a user
- `POST /api/matching/batch` - Request batch matching for multiple users
- `POST /api/matching/scheduled` - Trigger scheduled matching (admin only)

### Suggestion Endpoints
- `GET /api/suggestions/users/:userId/tribes` - Get tribe suggestions for a user
- `GET /api/suggestions/tribes/:tribeId/users` - Get user suggestions for a tribe
- `GET /api/suggestions/users/:userId/personalized` - Get personalized suggestions
- `POST /api/suggestions/users/:userId/refresh` - Refresh suggestions for a user

## Getting Started

Follow these instructions to set up and run the Matching Service locally for development.

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized development)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/tribe-platform.git
cd tribe-platform/backend/src/matching-service

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# Build the service
npm run build
```

### Running Locally
```bash
# Start the service in development mode
npm run dev

# Or start with production settings
npm run start
```

### Docker Deployment
```bash
# Build the Docker image
docker build -t tribe/matching-service .

# Run the container
docker run -p 3003:3003 -e NODE_ENV=production tribe/matching-service
```

## Configuration

The Matching Service can be configured using environment variables:

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the service listens on | `3003` |
| `NODE_ENV` | Environment (development, test, production) | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `PROFILE_SERVICE_URL` | URL of the Profile Service | - |
| `TRIBE_SERVICE_URL` | URL of the Tribe Service | - |
| `AI_ORCHESTRATION_URL` | URL of the AI Orchestration Service | - |
| `NOTIFICATION_SERVICE_URL` | URL of the Notification Service | - |
| `JWT_SECRET` | Secret for JWT validation | - |
| `DEFAULT_COMPATIBILITY_THRESHOLD` | Minimum compatibility score | `0.7` |
| `DEFAULT_MAX_DISTANCE` | Maximum distance in miles | `25` |
| `MIN_TRIBE_SIZE` | Minimum members per tribe | `4` |
| `MAX_TRIBE_SIZE` | Maximum members per tribe | `8` |

### Algorithm Configuration
The matching algorithms can be configured through the following settings:

```json
{
  "factorWeights": {
    "PERSONALITY": 0.3,
    "INTERESTS": 0.3,
    "COMMUNICATION_STYLE": 0.2,
    "LOCATION": 0.1,
    "GROUP_BALANCE": 0.1
  },
  "compatibilityThreshold": 0.7,
  "maxDistance": 25,
  "minGroupSize": 4,
  "maxGroupSize": 8
}
```

## Testing

The Matching Service includes comprehensive tests to ensure reliability and correctness.

### Running Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Generate test coverage report
npm run test:coverage
```

### Test Structure
- `tests/unit/`: Unit tests for individual components
- `tests/integration/`: Integration tests for API endpoints
- `tests/algorithms/`: Tests for matching and compatibility algorithms
- `tests/mocks/`: Mock data and services for testing

## Performance Considerations

The Matching Service is designed to handle computationally intensive operations efficiently:

### Optimization Techniques
- Asynchronous processing using Bull queues
- Caching of compatibility results
- Batch processing for multiple users
- Efficient algorithms with O(n log n) complexity
- Database query optimization with proper indexing

### Scaling Strategies
- Horizontal scaling for handling more users
- Vertical scaling for complex matching operations
- Scheduled matching during off-peak hours
- Partitioning of matching operations by geographic region

## Monitoring and Metrics

The service exposes metrics for monitoring performance and health:

### Health Checks
- `GET /health` - Service health status
- `GET /metrics` - Prometheus metrics endpoint

### Key Metrics
- Matching operation duration
- Compatibility calculation time
- Queue length and processing rate
- Success rate of tribe formations
- API response times
- Error rates by endpoint

## Contributing

Contributions to the Matching Service are welcome. Please follow these guidelines:

### Development Workflow
1. Create a feature branch from `develop`
2. Implement your changes with tests
3. Ensure all tests pass
4. Submit a pull request with a clear description

### Coding Standards
- Follow the TypeScript style guide
- Maintain test coverage above 80%
- Document public APIs and complex algorithms
- Use meaningful variable and function names

## License

This project is licensed under the MIT License - see the LICENSE file for details.