# Authentication Service

Core authentication microservice for the Tribe platform that handles user registration, login, social authentication, token management, and session handling.

## Features

- User registration with email verification
- Local authentication with email/password
- Social authentication (Google, Apple, Facebook)
- JWT-based authentication with access and refresh tokens
- Token rotation and secure session management
- Password reset functionality
- Account management (password change, email verification)
- Multi-factor authentication support
- Session management across devices
- Rate limiting and security protections

## Architecture

The Authentication Service follows a layered architecture pattern:

### Controllers

Handle HTTP requests and responses, input validation, and route to appropriate services.

### Services

Implement business logic for authentication flows, token management, and user operations.

### Models

Provide data access layer for user and token entities, interfacing with the database.

### Utilities

Helper functions for password hashing, token generation, and other common operations.

### Middleware

Authentication verification, request validation, error handling, and other cross-cutting concerns.

## API Endpoints

The service exposes the following RESTful API endpoints:

### Authentication

- POST /api/v1/auth/register - Register a new user
- POST /api/v1/auth/login - Authenticate with email/password
- POST /api/v1/auth/social - Authenticate with social provider
- POST /api/v1/auth/refresh - Refresh authentication tokens
- POST /api/v1/auth/logout - Logout current session
- POST /api/v1/auth/logout-all - Logout all sessions
- GET /api/v1/auth/validate-token - Validate authentication token
- GET /api/v1/auth/me - Get current user information

### Account Management

- POST /api/v1/auth/password-reset - Request password reset
- POST /api/v1/auth/password-reset/confirm - Confirm password reset
- GET /api/v1/auth/verify-email - Verify email address
- POST /api/v1/auth/resend-verification - Resend verification email
- POST /api/v1/auth/change-password - Change password

### Health & Monitoring

- GET /health - Service health check
- GET /metrics - Service metrics

## Security Features

- Password hashing using bcrypt with appropriate cost factor
- JWT tokens with short expiration times
- Refresh token rotation for enhanced security
- Token blacklisting for logout and session revocation
- Rate limiting to prevent brute force attacks
- Progressive account lockout after failed login attempts
- Secure HTTP headers using Helmet
- CORS protection for API endpoints
- Input validation for all requests
- Comprehensive error handling with appropriate status codes

## Configuration

The service can be configured using environment variables:

### Server Configuration

- PORT - HTTP server port (default: 3000)
- NODE_ENV - Environment (development, staging, production)
- LOG_LEVEL - Logging level (debug, info, warn, error)

### Authentication Configuration

- JWT_ACCESS_SECRET - Secret for signing access tokens
- JWT_REFRESH_SECRET - Secret for signing refresh tokens
- JWT_ACCESS_EXPIRATION - Access token expiration time (default: 15m)
- JWT_REFRESH_EXPIRATION - Refresh token expiration time (default: 7d)
- REQUIRE_EMAIL_VERIFICATION - Whether to require email verification (default: true)
- PASSWORD_RESET_EXPIRATION - Password reset token expiration time (default: 1h)

### Social Authentication

- GOOGLE_CLIENT_ID - Google OAuth client ID
- FACEBOOK_APP_ID - Facebook App ID
- APPLE_CLIENT_ID - Apple Client ID

### Security Settings

- PASSWORD_MIN_LENGTH - Minimum password length (default: 10)
- MAX_FAILED_ATTEMPTS - Maximum failed login attempts before lockout (default: 5)
- ACCOUNT_LOCKOUT_TIME - Account lockout duration in minutes (default: 15)
- RATE_LIMIT_WINDOW - Rate limiting window in minutes (default: 15)
- RATE_LIMIT_MAX - Maximum requests per window (default: 100)

## Dependencies

Key dependencies include:

### Runtime Dependencies

- express - Web framework
- jsonwebtoken - JWT implementation
- bcrypt - Password hashing
- helmet - Security headers
- cors - CORS support
- compression - Response compression
- express-rate-limit - API rate limiting
- axios - HTTP client for social auth
- joi - Request validation
- uuid - Unique ID generation
- redis - Token storage and blacklisting

### Development Dependencies

- typescript - Type safety and transpilation
- jest - Testing framework
- supertest - API testing
- eslint - Code linting
- nodemon - Development server with hot reload

## Getting Started

To run the Authentication Service locally:

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Redis (optional, for token blacklisting)

### Installation

1. Clone the repository
2. Navigate to the auth-service directory
3. Install dependencies: `npm install`
4. Copy .env.example to .env and configure environment variables
5. Start the service: `npm run dev`

### Docker

Alternatively, you can use Docker:
1. Build the image: `docker build -t tribe/auth-service .`
2. Run the container: `docker run -p 3000:3000 --env-file .env tribe/auth-service`

## Testing

The service includes comprehensive test coverage:

### Unit Tests

Run unit tests with: `npm test`

### Integration Tests

Run integration tests with: `npm run test:integration`

### Coverage Report

Generate coverage report with: `npm run test:coverage`

## Deployment

The service is designed to be deployed as a containerized microservice in a Kubernetes cluster. See the infrastructure documentation for detailed deployment instructions.

## Monitoring & Observability

- Health check endpoint at /health
- Metrics endpoint at /metrics
- Structured logging with correlation IDs
- Error tracking and reporting
- Performance monitoring via Prometheus metrics

## Contributing

Please follow the project's coding standards and submit pull requests for any changes. Run linting (`npm run lint`) and tests (`npm test`) before submitting changes.