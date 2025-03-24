# Profile Service

A microservice for managing user profiles, personality traits, interests, and location data in the Tribe platform. This service is a critical component of the AI-powered matchmaking system that creates meaningful small-group connections.

## Features

- User profile management (create, read, update, delete)
- Personality assessment processing and storage
- Interest management and categorization
- Location-based profile searches
- Compatibility calculation between profiles
- Communication style analysis and storage
- Travel distance preferences

## Architecture

The Profile Service follows a layered architecture pattern:

### Controllers
Handle HTTP requests and responses, input validation, and route to appropriate service methods.

### Services
Implement business logic, orchestrate operations across models, and handle complex operations.

### Models
Provide data access layer functionality, interact with the database, and implement data validation.

### Validation
Middleware for request validation using Joi schemas.

## API Endpoints

The service exposes the following RESTful API endpoints:

### Profile Management
- POST /api/v1/profiles - Create a new profile
- GET /api/v1/profiles/:profileId - Get profile by ID
- GET /api/v1/profiles/user/:userId - Get profile by user ID
- PUT /api/v1/profiles/:profileId - Update a profile
- DELETE /api/v1/profiles/:profileId - Delete a profile
- GET /api/v1/profiles/search - Search profiles with filters

### Personality Assessment
- POST /api/v1/profiles/:profileId/personality - Submit personality assessment
- GET /api/v1/profiles/:profileId/personality - Get personality traits

### Interests
- POST /api/v1/profiles/:profileId/interests - Submit interests
- GET /api/v1/profiles/:profileId/interests - Get profile interests
- PUT /api/v1/profiles/:profileId/interests/:interestId - Update an interest
- DELETE /api/v1/profiles/:profileId/interests/:interestId - Delete an interest

### Location & Preferences
- PUT /api/v1/profiles/:profileId/location - Update profile location
- PUT /api/v1/profiles/:profileId/travel-distance - Update max travel distance
- GET /api/v1/profiles/:profileId/nearby - Find nearby profiles

### Compatibility
- GET /api/v1/profiles/:profileId/compatibility/:targetProfileId - Calculate compatibility between profiles

## Data Models

The service works with the following core data models:

### Profile
Core user profile information including name, bio, location, coordinates, and preferences.

### PersonalityTrait
Individual personality characteristics with scores, based on the OCEAN (Big Five) model.

### Interest
User interests categorized by type with preference levels.

### CommunicationStyle
Enumeration of communication preferences (Direct, Collaborative, Analytical, Expressive).

## Compatibility Calculation

The service implements sophisticated compatibility algorithms that consider:

### Personality Compatibility
Analyzes trait similarity with appropriate weighting for complementary traits.

### Interest Overlap
Measures shared interests and their importance to each user.

### Communication Style
Evaluates how well different communication styles work together.

### Location Proximity
Considers geographic distance based on user preferences.

## Getting Started

To run the Profile Service locally:

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Prisma ORM setup

### Installation
1. Clone the repository
2. Navigate to backend/src/profile-service
3. Run `npm install` to install dependencies
4. Configure environment variables (see .env.example)
5. Run `npm run dev` to start the service in development mode

### Scripts
- npm run build - Compile TypeScript to JavaScript
- npm run clean - Remove build artifacts
- npm run start - Start the service in production mode
- npm run dev - Start the service in development mode with hot reloading
- npm run lint - Check code quality
- npm run test - Run unit tests

## Environment Variables

The service requires the following environment variables:

### Required
- PORT - Port number for the service (default: 3001)
- DATABASE_URL - PostgreSQL connection string
- NODE_ENV - Environment (development, test, production)

### Optional
- LOG_LEVEL - Logging level (default: info)
- RATE_LIMIT_WINDOW - Rate limiting window in milliseconds
- RATE_LIMIT_MAX - Maximum requests per window

## Testing

The service includes comprehensive test coverage:

### Unit Tests
Tests for individual components using Jest.

### Integration Tests
Tests for API endpoints using Supertest.

### Running Tests
- npm run test - Run all tests
- npm run test:watch - Run tests in watch mode
- npm run test:coverage - Generate coverage report

## Dependencies

Key dependencies include:

### Runtime
- express - Web framework
- helmet - Security middleware
- cors - Cross-Origin Resource Sharing
- compression - Response compression
- express-rate-limit - API rate limiting
- joi - Schema validation
- geolib - Geospatial calculations

### Development
- typescript - Type checking and compilation
- jest - Testing framework
- supertest - HTTP testing
- eslint - Code quality
- nodemon - Development server with hot reload

## Contributing

When contributing to the Profile Service, please follow these guidelines:

### Code Style
Follow the project's ESLint configuration and TypeScript best practices.

### Testing
Add tests for new features and ensure all tests pass before submitting a pull request.

### Documentation
Update this README and add inline documentation for new functionality.

### Pull Requests
Create feature branches and submit pull requests against the development branch.