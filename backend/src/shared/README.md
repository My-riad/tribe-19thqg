# Tribe Shared Module

A shared library of common utilities, types, error handling, validation schemas, and middleware used across all microservices in the Tribe platform.

## Overview

This module serves as a central repository for code that needs to be shared across multiple microservices in the Tribe platform. By centralizing these common components, we ensure consistency, reduce duplication, and simplify maintenance across the application.

## Installation

```bash
npm install @tribe/shared
```

Or add it to your project's dependencies:

```bash
npm install --save @tribe/shared
```

## Features

- **Constants**: Application-wide constants, error codes, and regex patterns
- **Error Handling**: Standardized error classes and middleware
- **Types**: Shared TypeScript interfaces, types, and enums
- **Utilities**: Common utility functions for dates, strings, validation, and logging
- **Middleware**: Reusable Express middleware for error handling, logging, and validation
- **Validation**: Joi schemas and validation utilities

## Module Structure

```
src/
├── constants/       # Application constants, error codes, regex patterns
├── errors/          # Error classes for different error types
├── types/           # TypeScript interfaces, types, and enums
├── utils/           # Utility functions
├── middlewares/     # Express middleware
├── validation/      # Validation schemas and utilities
└── index.ts         # Main entry point that re-exports all modules
```

## Usage

Import the required components from the shared module:

```typescript
// Import everything
import * as shared from '@tribe/shared';

// Import specific components
import { ApiError, ValidationError } from '@tribe/shared';
import { UserType, ProfileType } from '@tribe/shared';
import { validateBody, errorMiddleware } from '@tribe/shared';
import { formatDate, generateUUID } from '@tribe/shared';
```

## Constants

The constants module provides application-wide constants to ensure consistency:

```typescript
import { APP_CONSTANTS, ERROR_CODES, REGEX_PATTERNS } from '@tribe/shared';

// Example usage
const maxTribeSize = APP_CONSTANTS.MAX_TRIBE_SIZE;
const emailPattern = REGEX_PATTERNS.EMAIL;
```

## Error Handling

The errors module provides standardized error classes:

```typescript
import { ApiError, AuthError, DatabaseError, ValidationError } from '@tribe/shared';

// Example usage
throw ApiError.notFound('User not found');
throw AuthError.invalidCredentials();
throw DatabaseError.connectionError('Failed to connect to database');
throw ValidationError.invalidField('email', 'Invalid email format');
```

## Types

The types module provides shared TypeScript interfaces, types, and enums:

```typescript
import { UserType, ProfileType, TribeType, EventType } from '@tribe/shared';

// Example usage
const user: UserType = {
  id: '123',
  email: 'user@example.com',
  // ...
};
```

## Utilities

The utils module provides common utility functions:

```typescript
import { formatDate, parseDate, generateUUID, logger } from '@tribe/shared';

// Example usage
const formattedDate = formatDate(new Date(), 'yyyy-MM-dd');
const uuid = generateUUID();
logger.info('Operation completed successfully');
```

## Middleware

The middlewares module provides reusable Express middleware:

```typescript
import { errorMiddleware, correlationIdMiddleware, requestLoggingMiddleware } from '@tribe/shared';

// Example usage in Express app
app.use(correlationIdMiddleware);
app.use(requestLoggingMiddleware);
// ... routes and other middleware
app.use(errorMiddleware);
```

## Validation

The validation module provides Joi schemas and validation utilities:

```typescript
import { validateBody, userSchemas } from '@tribe/shared';

// Example usage in Express route
router.post('/users', validateBody(userSchemas.createUser), userController.createUser);
```

## Development

### Building the Module

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Contributing

When adding new functionality to the shared module:

1. Ensure the code is properly tested
2. Update the relevant documentation
3. Follow the established patterns and coding standards
4. Consider the impact on all consuming services

## Versioning

This module follows semantic versioning. Major version changes indicate breaking changes, minor versions add functionality in a backward-compatible manner, and patch versions include backward-compatible bug fixes.