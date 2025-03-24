# API Gateway

The API Gateway serves as the single entry point for all client applications to access the Tribe platform's microservices. It handles cross-cutting concerns such as authentication, rate limiting, CORS, request logging, and routing to the appropriate backend services.

## Features

- Centralized routing to microservices
- Authentication and authorization
- Rate limiting with multiple tiers
- CORS configuration
- Request logging and correlation IDs
- Error handling and standardization
- Health checks and metrics endpoints
- Security headers via Helmet
- Response compression

## Architecture

The API Gateway is built using Express.js and implements a proxy-based architecture to forward requests to the appropriate microservices. It uses http-proxy-middleware to handle the proxying of requests and applies various middleware for cross-cutting concerns.

The gateway is designed to be stateless and horizontally scalable, with configuration managed through environment variables and a centralized configuration module.

## Service Registry

The API Gateway routes requests based on a service registry configuration that maps URL paths to backend microservices. Each service entry includes:

- name: Service identifier
- path: URL path prefix for routing
- url: Target service URL
- requiresAuth: Whether authentication is required
- rateLimitTier: Rate limiting tier to apply

## Middleware

The API Gateway applies several middleware components in a specific order:

1. Helmet (security headers)
2. Compression (response size reduction)
3. CORS (cross-origin resource sharing)
4. Correlation ID (request tracing)
5. Request Logging (audit trail)
6. Body Parsing (JSON and URL-encoded)
7. Authentication (when required)
8. Rate Limiting (based on service tier)
9. Service-specific proxying

## Authentication

The API Gateway implements JWT-based authentication with the following features:

- Token validation using jsonwebtoken
- User extraction and attachment to request object
- Role-based access control
- Service-level authentication requirements
- Configurable public endpoints

## Rate Limiting

Rate limiting is implemented using express-rate-limit with the following tiers:

- standard: 100 requests per minute (most services)
- auth: 20 requests per minute (authentication endpoints)
- critical: 50 requests per minute (payment services)
- premium: 300 requests per minute (premium users)
- admin: 600 requests per minute (administrative functions)

The rate limiter supports Redis for distributed rate limiting in multi-instance deployments.

## CORS Configuration

Cross-Origin Resource Sharing is configured with environment-specific settings:

- Development: More permissive for local development
- Production: Strict allowlist of origins

The configuration includes methods, headers, credentials, and cache settings to ensure secure cross-origin requests.

## Error Handling

The API Gateway implements centralized error handling that:

- Standardizes error responses across all services
- Provides appropriate HTTP status codes
- Hides implementation details in production
- Logs errors with request context
- Handles proxy errors gracefully

## Health Checks and Monitoring

The API Gateway provides endpoints for health checking and monitoring:

- /health: Basic health status
- /health/detailed: Detailed health information including service status
- /metrics: Prometheus-compatible metrics for monitoring

## Configuration

The API Gateway is configured through environment variables and a centralized configuration module. Key configuration areas include:

- Service registry (routing configuration)
- Authentication settings (JWT secret, token expiration)
- Rate limiting options (tiers, limits, Redis configuration)
- CORS settings (allowed origins, methods, headers)
- Logging configuration (level, format, destination)

## Development

To run the API Gateway locally:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with appropriate values

# Start in development mode
npm run dev
```

## Deployment

The API Gateway is containerized using Docker and can be deployed as part of the Tribe platform's Kubernetes cluster. The Dockerfile and Kubernetes deployment configurations are provided in the repository.

## Testing

The API Gateway includes unit tests for middleware components and integration tests for the complete request flow. Run tests with:

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## API Documentation

For detailed API documentation, refer to the individual service documentation in the backend/docs/api directory.