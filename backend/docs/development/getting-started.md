# Introduction

Welcome to the Tribe platform development guide! This document will help you set up your development environment and get started with contributing to the Tribe backend.

Tribe is an AI-powered matchmaking and engagement platform designed to create and sustain meaningful small-group connections (4-8 people) and encourage users to transition from digital to physical interactions. The platform specifically focuses on local connections and caters to introverts who may find traditional social networking challenging.

The backend is built using a microservices architecture with Node.js/TypeScript and follows modern development practices to ensure scalability, maintainability, and performance.

# Prerequisites

Before you begin, ensure you have the following installed on your development machine:

## Required Software

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Docker** (latest stable version)
- **Docker Compose** (latest stable version)
- **Git** (latest stable version)

You can verify your installations with the following commands:

```bash
node --version
npm --version
docker --version
docker-compose --version
git --version
```

## Recommended Tools

While not strictly required, the following tools are recommended for a better development experience:

- **Visual Studio Code** with the following extensions:
  - ESLint
  - Prettier
  - Docker
  - TypeScript
  - Jest
  - REST Client
- **Postman** or **Insomnia** for API testing
- **MongoDB Compass** for database visualization
- **Redis Desktop Manager** for Redis cache inspection

# Repository Setup

Follow these steps to set up the Tribe repository on your local machine:

## Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-organization/tribe.git

# Navigate to the project directory
cd tribe

# Navigate to the backend directory
cd backend
```

## Branch Management

We follow a feature branch workflow. Always create a new branch for your work:

```bash
# Ensure you're on the main branch and up-to-date
git checkout main
git pull

# Create a new branch for your feature or bugfix
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-you-are-fixing
```

Refer to our [Coding Standards](coding-standards.md) document for more details on our Git workflow and commit message conventions.

# Development Environment Setup

The Tribe platform uses Docker to provide a consistent development environment. This ensures that all developers work with the same dependencies and configurations.

## Automated Setup

We provide a setup script that automates the environment setup process:

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

If you encounter any issues during the automated setup, refer to the manual setup instructions below.

## Manual Setup

If you prefer to set up the environment manually or if the automated setup fails, follow these steps:

1. **Environment Configuration**:
   ```bash
   # Copy the example environment file
   cp .env.example .env.development
   
   # Create a symlink for development
   ln -s .env.development .env
   ```
   
   Open the `.env` file and update the configuration values as needed, particularly API keys for external services.

2. **Install Dependencies**:
   ```bash
   # Install root dependencies
   npm install
   
   # Install dependencies for all services
   npm run bootstrap
   ```

3. **Docker Setup**:
   ```bash
   # Build Docker images
   docker-compose build
   
   # Create Docker volumes
   docker volume create postgres_data
   docker volume create redis_data
   ```

4. **Database Setup**:
   ```bash
   # Start the database container
   docker-compose up -d postgres
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with initial data
   npm run db:seed
   ```

5. **Git Hooks Setup**:
   ```bash
   # Install Husky Git hooks
   npm run prepare
   ```

## Environment Variables

The `.env` file contains configuration for all services. Here are the key variables you'll need to set:

```
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/tribe_dev

# Authentication
JWT_SECRET=your_jwt_secret_for_development
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_API_URL=https://openrouter.ai/api/v1
GOOGLE_PLACES_API_KEY=your_google_places_api_key
EVENTBRITE_API_KEY=your_eventbrite_api_key
MEETUP_API_KEY=your_meetup_api_key
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
STRIPE_API_KEY=your_stripe_api_key
VENMO_API_KEY=your_venmo_api_key
FIREBASE_API_KEY=your_firebase_api_key

# Logging
LOG_LEVEL=debug
```

For development, you can use placeholder values for the API keys if you don't have actual keys yet. However, certain functionality will be limited without valid API keys.

# Running the Application

Once your environment is set up, you can start the application using Docker Compose.

## Starting All Services

To start all services in development mode:

```bash
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

You can view logs for all services in the terminal where you ran the command.

## Starting Specific Services

If you only need to work with specific services, you can start them individually:

```bash
# Start a specific service and its dependencies
npm run start:service -- service-name

# Examples:
npm run start:service -- auth-service
npm run start:service -- profile-service
```

This is useful when you're working on a specific service and don't need the entire platform running.

## Stopping Services

To stop all running services:

```bash
npm run stop
```

This will stop all containers but preserve the data in the volumes.

## Viewing Logs

To view logs for a specific service:

```bash
docker-compose logs -f service-name

# Examples:
docker-compose logs -f auth-service
docker-compose logs -f api-gateway
```

This will show the logs for the specified service and follow new log entries as they are generated.

# Project Structure

The Tribe backend follows a microservices architecture, with each service responsible for a specific domain. Understanding the project structure is essential for effective development.

## Repository Organization

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

## Service Structure

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

This consistent structure makes it easier to navigate and understand the codebase.

## Shared Code

The `src/shared` directory contains code that is shared across multiple services:

```
shared/
├── src/
│   ├── constants/       # Shared constants
│   ├── errors/          # Error classes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── middlewares/     # Shared middleware
│   ├── validation/      # Validation utilities
│   └── index.ts         # Entry point
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

The shared code is published as an internal package that other services can depend on.

# Development Workflow

This section covers the common development workflows for the Tribe platform.

## Making Changes

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Your Changes**:
   - Follow the [Coding Standards](coding-standards.md)
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

The database schema is defined in `prisma/schema.prisma`. Refer to the [Prisma documentation](https://www.prisma.io/docs/) for more information on working with Prisma.

## Adding a New Service

To add a new service to the platform:

1. **Create the Service Directory**:
   ```bash
   mkdir -p src/new-service
   ```

2. **Initialize the Service**:
   ```bash
   cd src/new-service
   npm init -y
   ```

3. **Add Required Dependencies**:
   ```bash
   npm install --save express typescript @types/node @types/express
   npm install --save-dev nodemon ts-node jest ts-jest
   ```

4. **Create the Basic Service Structure**:
   ```bash
   mkdir -p src/{config,controllers,models,services,utils,validations,middleware}
   touch src/index.ts
   ```

5. **Add the Service to Docker Compose**:
   Edit `docker-compose.yml` to add your new service.

6. **Add the Service to the Workspace**:
   Edit the root `package.json` to add your service to the `workspaces` array.

7. **Implement the Service**:
   Follow the patterns established in other services to implement your new service.

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

Refer to the [AI Integration Documentation](../architecture/ai-integration.md) for more details on working with the AI components.

# Testing

Testing is a critical part of the development process for the Tribe platform. We use Jest as our primary testing framework.

## Test Types

We have several types of tests:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete user flows
4. **Load Tests**: Test performance under load

Each service has its own unit tests, while integration and end-to-end tests are in the `tests` directory at the root of the project.

## Running Tests

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

Tests are automatically run as part of the CI/CD pipeline, but you should run them locally before pushing your changes.

## Writing Tests

We follow a consistent approach to writing tests:

1. **Unit Tests**:
   ```typescript
   // Example unit test for a service function
   describe('UserService', () => {
     let userService: UserService;
     let userRepositoryMock: jest.Mocked<UserRepository>;
   
     beforeEach(() => {
       userRepositoryMock = {
         findById: jest.fn(),
         create: jest.fn(),
         update: jest.fn(),
         delete: jest.fn()
       } as any;
   
       userService = new UserService(userRepositoryMock);
     });
   
     describe('getUserById', () => {
       it('should return user when user exists', async () => {
         // Arrange
         const mockUser = { id: 'user-123', email: 'test@example.com' };
         userRepositoryMock.findById.mockResolvedValue(mockUser);
   
         // Act
         const result = await userService.getUserById('user-123');
   
         // Assert
         expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-123');
         expect(result).toEqual(mockUser);
       });
   
       it('should throw NotFoundError when user does not exist', async () => {
         // Arrange
         userRepositoryMock.findById.mockResolvedValue(null);
   
         // Act & Assert
         await expect(userService.getUserById('nonexistent'))
           .rejects
           .toThrow(NotFoundError);
         expect(userRepositoryMock.findById).toHaveBeenCalledWith('nonexistent');
       });
     });
   });
   ```

2. **Integration Tests**:
   ```typescript
   // Example integration test for an API endpoint
   describe('User API', () => {
     let app: Express;
     let prisma: PrismaClient;
   
     beforeAll(async () => {
       prisma = new PrismaClient();
       app = createApp(prisma);
       await prisma.$connect();
     });
   
     afterAll(async () => {
       await prisma.$disconnect();
     });
   
     beforeEach(async () => {
       await prisma.user.deleteMany();
     });
   
     describe('GET /users/:id', () => {
       it('should return 200 and user when user exists', async () => {
         // Create test user
         const user = await prisma.user.create({
           data: {
             email: 'test@example.com',
             passwordHash: 'hashed-password',
             profile: {
               create: {
                 name: 'Test User',
                 bio: 'Test bio'
               }
             }
           }
         });
   
         // Test API endpoint
         const response = await request(app)
           .get(`/users/${user.id}`)
           .set('Authorization', `Bearer ${generateTestToken()}`)
           .expect(200);
   
         expect(response.body).toMatchObject({
           id: user.id,
           email: user.email,
           profile: {
             name: 'Test User'
           }
         });
       });
     });
   });
   ```

Refer to the [Testing Standards](coding-standards.md#testing-standards) section of the Coding Standards document for more details on our testing approach.

# Debugging

This section covers debugging techniques for the Tribe platform.

## Debugging Node.js Services

You can debug Node.js services using the following approaches:

1. **Console Logging**:
   ```typescript
   console.log('Debug info:', variable);
   ```

2. **Using the Debug Module**:
   ```typescript
   import debug from 'debug';
   const log = debug('service:component');
   log('Debug info:', variable);
   ```
   
   To enable debug logs, set the `DEBUG` environment variable:
   ```bash
   DEBUG=service:* npm run start:service -- service-name
   ```

3. **Node.js Inspector**:
   You can attach a debugger to a running Node.js process. To enable the inspector, add the `--inspect` flag to the Node.js command in the service's Dockerfile:
   ```dockerfile
   CMD ["node", "--inspect=0.0.0.0:9229", "dist/index.js"]
   ```
   
   Then you can connect to the debugger using Chrome DevTools or VS Code.

## Debugging with VS Code

Visual Studio Code provides excellent debugging support for Node.js applications. To debug a service running in Docker:

1. **Create a Launch Configuration**:
   Add the following to `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "attach",
         "name": "Attach to Docker",
         "port": 9229,
         "address": "localhost",
         "localRoot": "${workspaceFolder}",
         "remoteRoot": "/app",
         "protocol": "inspector",
         "restart": true
       }
     ]
   }
   ```

2. **Start the Service with Debugging Enabled**:
   ```bash
   # Start the service with debugging enabled
   docker-compose run --service-ports service-name
   ```

3. **Attach the Debugger**:
   In VS Code, go to the Run and Debug view and select "Attach to Docker" from the dropdown, then click the play button.

4. **Set Breakpoints**:
   Set breakpoints in your code by clicking in the gutter next to the line numbers. When the code execution reaches a breakpoint, the debugger will pause execution and allow you to inspect variables.

## Debugging Database Issues

For database-related issues:

1. **Prisma Studio**:
   Prisma provides a visual database browser called Prisma Studio:
   ```bash
   npx prisma studio
   ```
   This will start Prisma Studio on http://localhost:5555, where you can browse and edit the database.

2. **SQL Queries**:
   You can view the SQL queries generated by Prisma by setting the `DEBUG` environment variable:
   ```bash
   DEBUG=prisma:query npm run start:service -- service-name
   ```

3. **Database Logs**:
   You can view the PostgreSQL logs:
   ```bash
   docker-compose logs -f postgres
   ```

## Debugging API Requests

For API-related issues:

1. **API Gateway Logs**:
   ```bash
   docker-compose logs -f api-gateway
   ```

2. **Service Logs**:
   ```bash
   docker-compose logs -f service-name
   ```

3. **HTTP Request Logging**:
   The API Gateway and services log HTTP requests. You can increase the log level by setting the `LOG_LEVEL` environment variable to `debug`.

4. **API Testing Tools**:
   Use tools like Postman or Insomnia to test API endpoints directly, bypassing the client application.

# Common Tasks

This section covers common development tasks for the Tribe platform.

## Adding a New API Endpoint

To add a new API endpoint to a service:

1. **Create a Controller Method**:
   ```typescript
   // src/controllers/user.controller.ts
   import { Request, Response, NextFunction } from 'express';
   import { userService } from '../services';
   import { validateBody } from '../middleware';
   import { createUserSchema } from '../validations';
   
   export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
     try {
       const user = await userService.createUser(req.body);
       res.status(201).json(user);
     } catch (error) {
       next(error);
     }
   }
   ```

2. **Add the Route**:
   ```typescript
   // src/routes/user.routes.ts
   import { Router } from 'express';
   import { userController } from '../controllers';
   import { validateBody } from '../middleware';
   import { createUserSchema } from '../validations';
   
   const router = Router();
   
   router.post('/', validateBody(createUserSchema), userController.createUser);
   
   export default router;
   ```

3. **Register the Route**:
   ```typescript
   // src/index.ts
   import express from 'express';
   import userRoutes from './routes/user.routes';
   
   const app = express();
   app.use(express.json());
   
   app.use('/api/users', userRoutes);
   
   export default app;
   ```

4. **Add Validation Schema**:
   ```typescript
   // src/validations/user.validation.ts
   import Joi from 'joi';
   
   export const createUserSchema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(8).required(),
     name: Joi.string().required(),
     bio: Joi.string().allow('', null)
   });
   ```

5. **Implement the Service Method**:
   ```typescript
   // src/services/user.service.ts
   import { PrismaClient } from '@prisma/client';
   import { hashPassword } from '../utils';
   import { NotFoundError, ValidationError } from '../errors';
   
   export class UserService {
     constructor(private prisma: PrismaClient) {}
     
     async createUser(data: CreateUserDto): Promise<User> {
       // Check if user already exists
       const existingUser = await this.prisma.user.findUnique({
         where: { email: data.email }\n       });
       
       if (existingUser) {
         throw new ValidationError('Email already in use');
       }
       
       // Create user
       const user = await this.prisma.user.create({
         data: {
           email: data.email,
           passwordHash: await hashPassword(data.password),
           profile: {
             create: {
               name: data.name,
               bio: data.bio || ''
             }
           }
         },
         include: { profile: true }
       });
       
       return user;
     }
   }
   ```

6. **Add Tests**:
   ```typescript
   // tests/user.test.ts
   describe('UserService', () => {
     describe('createUser', () => {
       it('should create a user when data is valid', async () => {
         // Test implementation
       });
       
       it('should throw ValidationError when email is already in use', async () => {
         // Test implementation
       });
     });
   });
   ```

## Adding a New Database Model

To add a new database model:

1. **Update the Prisma Schema**:
   ```prisma
   // prisma/schema.prisma
   model NewModel {
     id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
     name      String
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
     
     // Relations
     userId    String   @db.Uuid @map("user_id")
     user      User     @relation(fields: [userId], references: [id])
     
     @@index([userId], name: "new_model_user_idx")
   }
   ```

2. **Generate a Migration**:
   ```bash
   npm run db:migrate -- --name add_new_model
   ```

3. **Apply the Migration**:
   ```bash
   npm run db:migrate
   ```

4. **Create a Repository or Service**:
   ```typescript
   // src/services/new-model.service.ts
   import { PrismaClient } from '@prisma/client';
   import { NotFoundError } from '../errors';
   
   export class NewModelService {
     constructor(private prisma: PrismaClient) {}
     
     async findById(id: string): Promise<NewModel | null> {
       return this.prisma.newModel.findUnique({
         where: { id }
       });
     }
     
     async create(data: CreateNewModelDto): Promise<NewModel> {
       return this.prisma.newModel.create({
         data
       });
     }
     
     async update(id: string, data: UpdateNewModelDto): Promise<NewModel> {
       const newModel = await this.prisma.newModel.findUnique({
         where: { id }
       });
       
       if (!newModel) {
         throw new NotFoundError('NewModel not found');
       }
       
       return this.prisma.newModel.update({
         where: { id },
         data
       });
     }
     
     async delete(id: string): Promise<void> {
       await this.prisma.newModel.delete({
         where: { id }
       });
     }
   }
   ```

## Working with External APIs

To integrate with external APIs:

1. **Create an API Client**:
   ```typescript
   // src/utils/api-client.ts
   import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
   import { logger } from './logger';
   
   export class ApiClient {
     private client: AxiosInstance;
     
     constructor(baseURL: string, config?: AxiosRequestConfig) {
       this.client = axios.create({
         baseURL,
         ...config
       });
       
       // Add request interceptor for logging
       this.client.interceptors.request.use(request => {
         logger.debug('API Request', {
           method: request.method,
           url: request.url,
           headers: request.headers
         });
         return request;
       });
       
       // Add response interceptor for logging
       this.client.interceptors.response.use(
         response => {
           logger.debug('API Response', {
             status: response.status,
             headers: response.headers
           });
           return response;
         },
         error => {
           logger.error('API Error', {
             error: error.message,
             response: error.response?.data
           });
           return Promise.reject(error);
         }
       );
     }
     
     async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
       const response = await this.client.get<T>(url, config);
       return response.data;
     }
     
     async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
       const response = await this.client.post<T>(url, data, config);
       return response.data;
     }
     
     async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
       const response = await this.client.put<T>(url, data, config);
       return response.data;
     }
     
     async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
       const response = await this.client.delete<T>(url, config);
       return response.data;
     }
   }
   ```

2. **Create a Service Integration**:
   ```typescript
   // src/services/weather.service.ts
   import { ApiClient } from '../utils/api-client';
   import { config } from '../config';
   
   export class WeatherService {
     private apiClient: ApiClient;
     
     constructor() {
       this.apiClient = new ApiClient('https://api.openweathermap.org/data/2.5', {
         params: {
           appid: config.openWeatherMapApiKey,
           units: 'metric'
         }
       });
     }
     
     async getWeatherByLocation(lat: number, lon: number): Promise<WeatherData> {
       return this.apiClient.get<WeatherData>('/weather', {
         params: { lat, lon }
       });
     }
     
     async getForecast(lat: number, lon: number): Promise<ForecastData> {
       return this.apiClient.get<ForecastData>('/forecast', {
         params: { lat, lon }
       });
     }
   }
   ```

3. **Add Error Handling and Resilience**:
   ```typescript
   // src/services/weather.service.ts
   import { ApiClient } from '../utils/api-client';
   import { config } from '../config';
   import { ExternalServiceError } from '../errors';
   import { CircuitBreaker } from 'opossum';
   
   export class WeatherService {
     private apiClient: ApiClient;
     private circuitBreaker: CircuitBreaker;
     
     constructor() {
       this.apiClient = new ApiClient('https://api.openweathermap.org/data/2.5', {
         params: {
           appid: config.openWeatherMapApiKey,
           units: 'metric'
         }
       });
       
       // Configure circuit breaker
       this.circuitBreaker = new CircuitBreaker(this.getWeatherByLocationInternal.bind(this), {
         failureThreshold: 3,
         resetTimeout: 30000,
         timeout: 10000
       });
     }
     
     private async getWeatherByLocationInternal(lat: number, lon: number): Promise<WeatherData> {
       try {
         return await this.apiClient.get<WeatherData>('/weather', {
           params: { lat, lon }
         });
       } catch (error) {
         throw new ExternalServiceError('Failed to fetch weather data', { cause: error });
       }
     }
     
     async getWeatherByLocation(lat: number, lon: number): Promise<WeatherData> {
       try {
         return await this.circuitBreaker.fire(lat, lon);
       } catch (error) {
         // Fallback response
         return {
           main: {
             temp: 20,
             feels_like: 20,
             humidity: 50
           },
           weather: [{
             main: 'Clear',
             description: 'clear sky',
             icon: '01d'
           }],
           source: 'fallback'
         };
       }
     }
   }
   ```

# Troubleshooting

This section covers common issues and their solutions.

## Common Issues

### Docker Issues

**Issue**: Container fails to start
**Solution**: Check the logs for the container:
```bash
docker-compose logs service-name
```

**Issue**: Port conflicts
**Solution**: Check if another process is using the same port and stop it, or change the port mapping in `docker-compose.yml`.

**Issue**: Docker volume permission issues
**Solution**: Check the permissions on the Docker volumes and adjust as needed:
```bash
docker volume inspect volume_name
```

### Database Issues

**Issue**: Migration fails
**Solution**: Check the migration logs and fix any issues in the schema. You may need to reset the database:
```bash
npm run db:reset
```

**Issue**: Connection errors
**Solution**: Ensure the database container is running and the connection string is correct in the `.env` file.

### Node.js Issues

**Issue**: Module not found errors
**Solution**: Ensure all dependencies are installed:
```bash
npm install