# Tribe Platform Backend

Welcome to the Tribe platform backend repository! This repository contains the server-side components of the Tribe platform, an AI-powered matchmaking and engagement platform designed to create and sustain meaningful small-group connections (4-8 people) and encourage users to transition from digital to physical interactions.

## Overview

Tribe is a platform that uses AI to actively facilitate real-world connections through personality-based matchmaking, automated group formation, and AI-driven engagement tools that encourage and simplify in-person meetups. The backend is built using a microservices architecture with Node.js/TypeScript and follows modern development practices to ensure scalability, maintainability, and performance.

## Key Features

- **AI-Powered Smart Matchmaking**: Automatically assigns users to compatible Tribes based on psychological profiles, shared values, and communication styles
- **Personality-Based User Profiling**: Collects and analyzes user personality traits, interests, and communication styles
- **AI-Driven Continuous Engagement**: Provides conversation prompts, real-time group challenges, and spontaneous activity ideas
- **AI-Powered Real-Time Event & Activity Curation**: Suggests local events, weather-based activities, and budget-friendly options
- **AI-Optimized Planning & Coordination**: Tools for scheduling, venue recommendations, RSVP tracking, and automated reminders
- **AI-Enhanced Group Management**: Tools for managing group logistics, tracking expenses, and setting shared goals

## Architecture

The Tribe platform follows a microservices architecture to enable independent scaling of components, facilitate rapid feature development, and support the diverse technical requirements of the system. Each service is responsible for a specific domain and owns the data and logic related to that domain.

### Core Services

- **API Gateway**: Entry point for client requests, handling routing, authentication, and rate limiting
- **Auth Service**: User authentication and identity management
- **Profile Service**: User profile and personality data management
- **Tribe Service**: Group formation and management
- **Event Service**: Event discovery and management
- **Planning Service**: Event planning and coordination
- **Payment Service**: Payment processing and expense tracking
- **Notification Service**: Notification delivery and management

### AI Services

- **Matching Service**: AI-powered matchmaking
- **Engagement Service**: AI-driven engagement tools
- **AI Orchestration Service**: Coordination of AI capabilities
- **AI Engine**: Specialized AI algorithms

### Data Storage

- **PostgreSQL**: Primary relational database
- **Redis**: Caching, session storage, and real-time features
- **S3**: Media storage
- **ElasticSearch**: Full-text search capabilities

## Prerequisites

Before you begin, ensure you have the following installed on your development machine:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Docker** (latest stable version)
- **Docker Compose** (latest stable version)
- **Git** (latest stable version)

## Getting Started

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-organization/tribe.git

# Navigate to the project directory
cd tribe

# Navigate to the backend directory
cd backend
```

### Setup Development Environment

```bash
# Run the setup script
npm run setup
```

This script will:
1. Check for required dependencies
2. Set up environment configuration files
3. Install npm dependencies for all services
4. Set up Docker containers
5. Initialize and seed the database
6. Configure Git hooks for pre-commit checks

### Running the Application

```bash
# Start all services in development mode
npm run start:dev
```

This command will start all services defined in the `docker-compose.yml` file. The services will be available at the following ports:

- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Profile Service: http://localhost:3002
- Tribe Service: http://localhost:3003
- Matching Service: http://localhost:3004
- Event Service: http://localhost:3005
- Engagement Service: http://localhost:3006
- Planning Service: http://localhost:3007
- Payment Service: http://localhost:3008
- Notification Service: http://localhost:3009
- AI Orchestration Service: http://localhost:3010
- AI Engine: http://localhost:8000

## Project Structure

```
backend/
├── src/                      # Source code for all services
│   ├── shared/              # Shared code used across services
│   ├── api-gateway/         # API Gateway service
│   ├── auth-service/        # Authentication service
│   ├── profile-service/     # User profile service
│   ├── tribe-service/       # Tribe management service
│   ├── matching-service/    # AI matchmaking service
│   ├── event-service/       # Event management service
│   ├── engagement-service/  # User engagement service
│   ├── planning-service/    # Event planning service
│   ├── payment-service/     # Payment processing service
│   ├── notification-service/# Notification service
│   ├── ai-orchestration-service/ # AI orchestration service
│   └── ai-engine/           # Python-based AI engine
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma schema definition
│   └── migrations/          # Database migrations
├── scripts/                 # Utility scripts
├── tests/                   # Integration and E2E tests
│   ├── e2e/                 # End-to-end tests
│   ├── integration/         # Integration tests
│   └── load/                # Load tests
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   ├── architecture/        # Architecture documentation
│   ├── deployment/          # Deployment documentation
│   └── development/         # Development documentation
├── docker-compose.yml       # Docker Compose configuration
├── package.json             # Root package.json
└── README.md                # Root README
```

Each service follows a consistent structure:

```
service/
├── src/
│   ├── config/           # Service configuration
│   ├── controllers/      # API endpoints
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── validations/      # Input validation
│   ├── middleware/       # Request processing middleware
│   └── index.ts          # Service entry point
├── tests/                # Unit and integration tests
├── Dockerfile            # Container definition
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Development Workflow

### Making Changes

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Your Changes**:
   - Follow the Coding Standards
   - Write tests for your changes
   - Ensure your code passes linting

3. **Run Tests**:
   ```bash
   # Run tests for a specific service
   npm run test:service -- service-name
   
   # Run all tests
   npm run test
   ```

4. **Commit Your Changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   
   We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

5. **Push Your Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the repository on GitHub
   - Create a new pull request from your branch
   - Fill in the pull request template
   - Request reviews from appropriate team members

## Working with the Database

We use Prisma ORM for database access. Here are common database-related tasks:

1. **Accessing the Database**:
   ```bash
   # Start a PostgreSQL CLI session
   docker-compose exec postgres psql -U postgres -d tribe_dev
   ```

2. **Creating Migrations**:
   ```bash
   # Generate a migration from schema changes
   npm run db:migrate -- --name descriptive_name_for_migration
   ```

3. **Applying Migrations**:
   ```bash
   # Apply pending migrations
   npm run db:migrate
   ```

4. **Resetting the Database**:
   ```bash
   # Reset the database (drop and recreate)
   npm run db:reset
   ```

5. **Seeding the Database**:
   ```bash
   # Seed the database with initial data
   npm run db:seed
   ```

The database schema is defined in `prisma/schema.prisma`.

## Working with AI Services

The Tribe platform uses AI for matchmaking, engagement, and recommendations. Here's how to work with the AI components:

1. **AI Orchestration Service**:
   This service coordinates AI capabilities across the platform. It provides a unified API for other services to access AI functionality.

2. **AI Engine**:
   This is a Python-based service that implements specialized AI algorithms. It's accessed through the AI Orchestration Service.

3. **OpenRouter API Integration**:
   We use the OpenRouter API to access various language models. The AI Orchestration Service handles the integration with OpenRouter.

4. **Testing AI Features**:
   ```bash
   # Start the AI services
   npm run start:service -- ai-orchestration-service
   
   # Test AI endpoints
   curl -X POST http://localhost:3010/api/v1/ai/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Generate a conversation starter for a hiking group", "options": {"type": "engagement"}}'
   ```

Refer to the [AI Integration Documentation](docs/architecture/ai-integration.md) for more details on working with the AI components.

## Testing

We have several types of tests:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete user flows
4. **Load Tests**: Test performance under load

```bash
# Run unit tests for a specific service
npm run test:service -- service-name

# Run all unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Generate test coverage report
npm run test:coverage
```

## Available Scripts

- `npm run setup` - Set up the development environment
- `npm run start:dev` - Start all services in development mode
- `npm run start:service -- service-name` - Start a specific service
- `npm run stop` - Stop all services
- `npm run test` - Run all unit tests
- `npm run test:service -- service-name` - Run tests for a specific service
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run linting on all services
- `npm run lint:fix` - Fix linting issues
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset the database
- `npm run db:seed` - Seed the database with initial data
- `npm run build` - Build all services
- `npm run clean` - Clean build artifacts

## Documentation

Comprehensive documentation is available in the `docs` directory:

- [Architecture Overview](docs/architecture/overview.md): High-level architecture of the Tribe platform
- [Services Documentation](docs/architecture/services.md): Detailed information about each service
- [Data Model Documentation](docs/architecture/data-model.md): Database schema and data model
- [AI Integration Documentation](docs/architecture/ai-integration.md): AI capabilities and integration
- [API Documentation](docs/api): API reference for all services
- [Development Guidelines](docs/development/getting-started.md): Development setup and workflows
- [Coding Standards](docs/development/coding-standards.md): Coding standards and best practices

## Contributing

We welcome contributions to the Tribe platform! Please follow these steps to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.