# Introduction

This document outlines the coding standards, best practices, and conventions for the Tribe platform. Following these standards ensures consistent code quality, maintainability, and effective collaboration across the development team.

The Tribe platform follows a microservices architecture with multiple services written in TypeScript/Node.js and Python. These standards apply to all services unless explicitly noted otherwise.

## General Principles

These core principles guide our development practices:

### Readability

Code should be written for humans first, machines second. Prioritize clarity and readability over cleverness or brevity.

- Use meaningful variable and function names
- Keep functions and methods focused on a single responsibility
- Include comments for complex logic, but prefer self-documenting code
- Use consistent formatting and structure

### Maintainability

Code should be easy to maintain, extend, and debug.

- Follow the DRY (Don't Repeat Yourself) principle
- Keep functions and classes small and focused
- Use modular design with clear separation of concerns
- Write tests for all business logic
- Document public APIs and complex implementations

### Consistency

Consistent code is easier to read, understand, and maintain.

- Follow established patterns and conventions
- Use automated tools (ESLint, Prettier) to enforce consistency
- Apply the same standards across all services
- When in doubt, follow existing patterns in the codebase

### Performance

Write code that performs well without sacrificing readability and maintainability.

- Be mindful of resource usage (memory, CPU, network)
- Optimize critical paths and hot code
- Use appropriate data structures and algorithms
- Measure performance before and after optimization
- Document performance considerations for complex operations

## Code Style and Formatting

We use automated tools to enforce consistent code style and formatting across the codebase.

### ESLint Configuration

ESLint is used to enforce code quality rules and catch potential issues. Our configuration extends recommended settings with custom rules specific to our project.

Key ESLint rules include:

- No console statements in production code (except for warn, error, info)
- Explicit return types for functions
- Explicit module boundary types
- Consistent naming conventions
- Import ordering
- No unused variables or imports

The complete ESLint configuration can be found in `.eslintrc.js` at the root of each service.

### Prettier Configuration

Prettier is used for automatic code formatting to ensure consistent style. Our configuration includes:

- Line width: 100 characters
- Tab width: 2 spaces
- No tabs (use spaces)
- Semicolons: required
- Single quotes for strings
- Trailing commas in multi-line structures
- Bracket spacing: true

The complete Prettier configuration can be found in `.prettierrc` at the root of each service.

### TypeScript Configuration

TypeScript is configured with strict type checking to catch potential issues at compile time. Our configuration includes:

- Strict mode enabled
- No implicit any types
- Strict null checks
- Strict function types
- No unused locals or parameters
- No implicit returns

The complete TypeScript configuration can be found in `tsconfig.json` at the root of each service.

### Pre-commit Hooks

We use Husky and lint-staged to enforce code quality checks before commits:

- ESLint runs on staged TypeScript/JavaScript files
- Prettier formats staged files
- TypeScript type checking runs on the entire project
- Unit tests run for affected files

This ensures that all committed code meets our quality standards.

## Naming Conventions

Consistent naming conventions make code more readable and predictable.

### General Rules

- Use descriptive names that convey purpose and intent
- Avoid abbreviations unless they are widely understood
- Be consistent with naming patterns
- Use PascalCase for classes, interfaces, and types
- Use camelCase for variables, functions, and methods
- Use UPPER_CASE for constants
- Use kebab-case for file names

### TypeScript-Specific Conventions

- Interfaces should be prefixed with `I` (e.g., `IUserProfile`)
- Types should use PascalCase without prefix (e.g., `UserProfileResponse`)
- Enums should use PascalCase (e.g., `UserRole`)
- Private class members should be prefixed with underscore (e.g., `_privateMethod`)
- Generic type parameters should use single uppercase letters or PascalCase (e.g., `T`, `TKey`)

### File Naming

- Use kebab-case for file names (e.g., `user-service.ts`)
- Use consistent suffixes to indicate file purpose:
  - `.service.ts` for service files
  - `.controller.ts` for controller files
  - `.model.ts` for model files
  - `.middleware.ts` for middleware files
  - `.util.ts` for utility files
  - `.test.ts` for test files
  - `.validation.ts` for validation files
- Index files should be named `index.ts`

### Directory Structure

- Use kebab-case for directory names
- Group files by feature or domain, not by type
- Use consistent directory structure across services:
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

## TypeScript Best Practices

TypeScript provides powerful type checking capabilities that help catch errors at compile time.

### Type Definitions

- Use explicit types for function parameters and return values
- Define interfaces for complex objects
- Use type aliases for union types and complex types
- Avoid using `any` type whenever possible
- Use generics for reusable components
- Use readonly modifier for immutable properties
- Use optional properties (?) instead of undefined union types

Example:
```typescript
// Good
function getUserById(id: string): Promise<IUser | null> {
  // Implementation
}

// Avoid
function getUserById(id): Promise<any> {
  // Implementation
}
```

### Null and Undefined

- Use `null` for intentional absence of value
- Use `undefined` for uninitialized values
- Use optional chaining (`?.`) for potentially undefined properties
- Use nullish coalescing (`??`) for null/undefined fallbacks
- Use non-null assertion (`!`) only when you're certain a value exists

Example:
```typescript
// Good
const userName = user?.profile?.name ?? 'Anonymous';

// Avoid
const userName = user && user.profile && user.profile.name ? user.profile.name : 'Anonymous';
```

### Type Guards

- Use type guards to narrow types in conditional blocks
- Implement custom type guards with type predicates
- Use discriminated unions for complex type hierarchies

Example:
```typescript
// Type guard with type predicate
function isUser(obj: any): obj is IUser {
  return obj && typeof obj === 'object' && 'id' in obj && 'email' in obj;
}

// Using type guard
if (isUser(data)) {
  // TypeScript knows data is IUser here
  console.info(`Processing user: ${data.email}`);
}
```

### Async Code

- Use async/await for asynchronous code
- Properly type Promise return values
- Handle errors with try/catch blocks
- Avoid mixing Promise chains and async/await

Example:
```typescript
// Good
async function getUserData(userId: string): Promise<IUserData> {
  try {
    const user = await userService.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user.data;
  } catch (error) {
    logger.error('Failed to get user data', { userId, error });
    throw error;
  }
}

// Avoid
function getUserData(userId: string): Promise<IUserData> {
  return userService.findById(userId)
    .then(user => {
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user.data;
    })
    .catch(error => {
      logger.error('Failed to get user data', { userId, error });
      throw error;
    });
}
```

## API Design

Consistent API design ensures a good developer experience and maintainable codebase.

### RESTful Principles

- Use resource-oriented URLs
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Use plural nouns for collection resources
- Use consistent URL patterns
- Use query parameters for filtering, sorting, and pagination
- Use proper HTTP status codes

Example URL patterns:
- GET /users - List users
- GET /users/:id - Get user by ID
- POST /users - Create user
- PUT /users/:id - Update user
- DELETE /users/:id - Delete user
- GET /users/:id/profile - Get user profile
- PUT /users/:id/profile - Update user profile

### Request Validation

- Validate all request inputs
- Use middleware for common validation
- Return descriptive validation error messages
- Use validation schemas (Joi, Zod, etc.)
- Sanitize inputs to prevent injection attacks

Example:
```typescript
// Validation schema
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
  role: Joi.string().valid('user', 'admin').default('user')
});

// Validation middleware
router.post('/users', validateBody(createUserSchema), async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});
```

### Response Formatting

- Use consistent response formats
- Include appropriate metadata
- Use envelope pattern for collections
- Use proper content types
- Format dates in ISO 8601 format

Example response format:
```json
// Single resource
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-04-15T12:00:00Z"
}

// Collection
{
  "items": [
    { "id": "123", "name": "John Doe" },
    { "id": "456", "name": "Jane Smith" }
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### API Documentation

- Document all API endpoints
- Use OpenAPI/Swagger for API documentation
- Include request/response examples
- Document error responses
- Keep documentation in sync with implementation

Example JSDoc with Swagger annotations:
```typescript
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a user by their unique identifier
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:id', async (req, res, next) => {
  // Implementation
});
```

## Error Handling

Proper error handling is essential for building robust and maintainable applications.

### Error Types

- Use custom error classes for different error types
- Extend from a base error class
- Include appropriate metadata with errors
- Use descriptive error messages

Example:
```typescript
// Base error class
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super('NOT_FOUND', message, 404, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super('AUTHENTICATION_ERROR', message, 401, details);
  }
}
```

### Error Handling Middleware

- Use centralized error handling middleware
- Transform errors into consistent response format
- Log errors with appropriate context
- Handle different error types appropriately

Example:
```typescript
export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
  // Default error values
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let message = 'Internal server error';
  let details = undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Handle Joi/validation library errors
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation error';
    details = err.details || err.message;
  }

  // Log the error
  logger.error(`${errorCode}: ${message}`, {
    error: err,
    requestId: req.id,
    path: req.path,
    method: req.method,
    details
  });

  // Send response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      details,
      requestId: req.id
    }
  });
}
```

### Async Error Handling

- Use try/catch blocks with async/await
- Use promise chaining with .catch() for Promise-based code
- Use a wrapper function for route handlers to catch async errors

Example:
```typescript
// Async error handling wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Using the wrapper
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
}));
```

### External Service Errors

- Use circuit breakers for external service calls
- Implement retry mechanisms with exponential backoff
- Provide fallback mechanisms when services are unavailable
- Log detailed information about external service errors

Example:
```typescript
async function callExternalService(data: any): Promise<any> {
  // Circuit breaker implementation
  if (circuitBreaker.isOpen()) {
    throw new ServiceUnavailableError('Service is currently unavailable');
  }

  try {
    // Retry logic with exponential backoff
    return await retry(
      async () => {
        const response = await axios.post('https://api.example.com/endpoint', data);
        return response.data;
      },
      {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000,
        onRetry: (error, attempt) => {
          logger.warn(`Retry attempt ${attempt} for external service call`, { error });
        }
      }
    );
  } catch (error) {
    // Record failure for circuit breaker
    circuitBreaker.recordFailure();
    
    // Log detailed error
    logger.error('External service call failed', { error, data });
    
    // Rethrow as application-specific error
    throw new ExternalServiceError('Failed to call external service', { cause: error });
  }
}
```

## Database Access

Consistent database access patterns ensure data integrity and performance.

### Prisma ORM Usage

- Use Prisma Client for database access
- Define models in the Prisma schema
- Use migrations for schema changes
- Use transactions for related operations
- Implement repository pattern for database access

Example:
```typescript
// Repository pattern with Prisma
export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        profile: {
          create: {
            name: data.name,
            bio: data.bio
          }
        }
      },
      include: { profile: true }
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        profile: {
          update: {
            name: data.name,
            bio: data.bio
          }
        }
      },
      include: { profile: true }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }
}
```

### Query Optimization

- Select only needed fields
- Use appropriate indexes
- Limit result sets for large queries
- Use pagination for large collections
- Optimize join operations
- Monitor query performance

Example:
```typescript
// Good - Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    profile: {
      select: {
        name: true
      }
    }
  },
  where: {
    status: 'ACTIVE'
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10,
  skip: (page - 1) * 10
});

// Avoid - Fetching all fields
const users = await prisma.user.findMany({
  include: {
    profile: true,
    posts: true,
    comments: true
  }
});
```

### Transactions

- Use transactions for operations that modify multiple records
- Ensure data consistency with transactions
- Handle transaction errors properly
- Keep transactions as short as possible

Example:
```typescript
async function transferFunds(fromAccountId: string, toAccountId: string, amount: number): Promise<void> {
  return prisma.$transaction(async (tx) => {
    // Get accounts with pessimistic locking
    const fromAccount = await tx.account.findUnique({
      where: { id: fromAccountId },
      select: { id: true, balance: true },
      for: 'update'
    });

    if (!fromAccount) {
      throw new NotFoundError('Source account not found');
    }

    if (fromAccount.balance < amount) {
      throw new ValidationError('Insufficient funds');
    }

    const toAccount = await tx.account.findUnique({
      where: { id: toAccountId },
      select: { id: true },
      for: 'update'
    });

    if (!toAccount) {
      throw new NotFoundError('Destination account not found');
    }

    // Update accounts
    await tx.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: amount } }
    });

    await tx.account.update({
      where: { id: toAccountId },
      data: { balance: { increment: amount } }
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        fromAccountId,
        toAccountId,
        amount,
        type: 'TRANSFER'
      }
    });
  });
}
```

### Data Validation

- Validate data before database operations
- Use schema validation for input data
- Implement business rules validation
- Handle validation errors consistently

Example:
```typescript
async function createUser(data: CreateUserDto): Promise<User> {
  // Validate input data
  const { error, value } = userSchema.validate(data);
  if (error) {
    throw new ValidationError('Invalid user data', error.details);
  }

  // Check business rules
  const existingUser = await prisma.user.findUnique({
    where: { email: value.email }
  });

  if (existingUser) {
    throw new ValidationError('Email already in use');
  }

  // Create user
  return prisma.user.create({
    data: {
      email: value.email,
      passwordHash: await hashPassword(value.password),
      profile: {
        create: {
          name: value.name,
          bio: value.bio || ''
        }
      }
    },
    include: { profile: true }
  });
}
```

## Testing Standards

Comprehensive testing is essential for maintaining code quality and preventing regressions. This section outlines our testing standards and best practices.

### Testing Frameworks

- Use Jest as the primary testing framework
- Use Supertest for API testing
- Use Mock Service Worker (MSW) for mocking HTTP requests
- Use Testcontainers for integration tests requiring external services

Example Jest configuration:
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**',
    '!src/config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Unit Testing

- Write unit tests for all business logic
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests focused and small
- Use descriptive test names that explain the expected behavior

Example unit test:
```typescript
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

### Integration Testing

- Test interactions between components
- Use test database for database tests
- Reset database state between tests
- Test API endpoints with Supertest
- Test error handling and edge cases

Example integration test:
```typescript
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

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .get('/users/nonexistent')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    });
  });
});
```

### Mock Strategies

- Use Jest mock functions for unit tests
- Use Mock Service Worker for HTTP request mocking
- Use in-memory database for repository tests
- Use dependency injection to facilitate mocking

Example MSW setup:
```typescript
// mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('https://api.example.com/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    
    if (id === 'existing-user') {
      return res(
        ctx.status(200),
        ctx.json({
          id: 'existing-user',
          name: 'Test User',
          email: 'test@example.com'
        })
      );
    }
    
    return res(
      ctx.status(404),
      ctx.json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      })
    );
  }),
  
  // More handlers
];

// tests/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterdEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Test Data Management

- Use factory functions for test data creation
- Reset database between tests for isolation
- Use meaningful test data that represents real scenarios
- Avoid dependencies between tests

Example factory function:
```typescript
// tests/factories/user.factory.ts
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../../src/utils/password.util';

export async function createTestUser(prisma: PrismaClient, overrides: any = {}) {
  const defaultData = {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    passwordHash: await hashPassword('password123'),
    profile: {
      create: {
        name: 'Test User',
        bio: 'Test user bio'
      }
    }
  };

  const mergedData = {
    ...defaultData,
    ...overrides,
    profile: {
      create: {
        ...defaultData.profile.create,
        ...(overrides.profile?.create || {})
      }
    }
  };

  return prisma.user.create({
    data: mergedData,
    include: {
      profile: true
    }
  });
}
```

## Security Best Practices

Security is a critical aspect of application development.

### Authentication and Authorization

- Use JWT for authentication
- Implement proper token validation
- Use secure password hashing (bcrypt)
- Implement role-based access control
- Use middleware for authorization checks
- Implement proper session management

Example:
```typescript
// Authentication middleware
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authentication token');
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    // Attach user to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    next(new AuthenticationError('Invalid authentication token'));
  }
}

// Authorization middleware
export function authorize(roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }
    next();
  };
}

// Using the middleware
router.get('/users', authenticate, authorize(['admin']), async (req, res, next) => {
  // Only admins can access this endpoint
});
```

### Input Validation and Sanitization

- Validate all user inputs
- Sanitize inputs to prevent injection attacks
- Use parameterized queries for database access
- Implement content security policies
- Validate file uploads

Example:
```typescript
// Input validation and sanitization
const createUserSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().trim().max(100).required(),
  bio: Joi.string().trim().max(500).allow('', null)
});

// Sanitize HTML content
function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

// Using sanitization
router.post('/posts', authenticate, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const sanitizedContent = sanitizeHtml(content);
    
    const post = await postService.createPost({
      title,
      content: sanitizedContent,
      authorId: req.userId
    });
    
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});
```

### Sensitive Data Handling

- Never store sensitive data in plain text
- Use encryption for sensitive data
- Implement proper key management
- Minimize storage of sensitive data
- Implement data access controls

Example:
```typescript
// Encrypting sensitive data
async function encryptPersonalityData(data: PersonalityData): Promise<string> {
  const iv = crypto.randomBytes(16);
  const key = await getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Store IV and auth tag with the encrypted data
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted,
    tag: authTag.toString('hex')
  });
}

async function decryptPersonalityData(encryptedData: string): Promise<PersonalityData> {
  const { iv, data, tag } = JSON.parse(encryptedData);
  const key = await getEncryptionKey();
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

### Security Headers

- Implement appropriate security headers
- Use Helmet middleware for Express
- Configure Content Security Policy
- Enable CORS with appropriate restrictions
- Set secure cookie options

Example: