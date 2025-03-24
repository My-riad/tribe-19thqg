# Authentication Service API Documentation

## Overview

The Authentication Service manages user registration, authentication, session management, and account security for the Tribe platform. It provides secure endpoints for user signup, login, social authentication, token management, password reset, and email verification.

- **Base URL**: `/api/v1/auth`
- **Version**: 1.0.0
- **Security**: All endpoints use HTTPS. Most endpoints require JWT authentication via Authorization header.

## Authentication Flows

### Local Authentication
Email/password-based authentication with JWT tokens. Users register with an email and password, then log in to receive access and refresh tokens.

### Social Authentication
OAuth-based authentication with Google, Apple, and Facebook. Users authenticate with a third-party provider and receive Tribe platform tokens.

### Token Refresh
JWT refresh token mechanism for maintaining sessions. Access tokens are short-lived (15 minutes), while refresh tokens have a longer lifespan (7 days) and can be used to obtain new access tokens.

### Email Verification
Two-step verification process for new accounts. Users must verify their email address by clicking a link sent to their email.

### Multi-Factor Authentication
Support for additional verification methods to enhance account security.

## Endpoints

### Register a new user

```
POST /api/v1/auth/register
```

Creates a new user account in the system.

**Authentication Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",         // Required - Valid email address
  "password": "SecureP@ssw0rd",        // Required - Password meeting complexity requirements
  "authProvider": "LOCAL",             // Optional - Authentication provider (LOCAL, GOOGLE, APPLE, FACEBOOK). Defaults to LOCAL
  "providerId": "google12345"          // Conditional - Required if authProvider is not LOCAL
}
```

**Response**: 201 Created
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "PENDING", 
    "isVerified": false,
    "provider": "LOCAL",
    "lastLogin": null,
    "createdAt": "2023-07-15T10:30:00Z"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email format",
      "code": "invalid_format"
    },
    {
      "field": "password",
      "message": "Password must be at least 10 characters and include uppercase, lowercase, number, and special character",
      "code": "insufficient_complexity"
    }
  ]
}
```

- 409 Conflict: Email already registered
```json
{
  "error": "Email already exists"
}
```

**Notes**:
- If email verification is enabled, the user will receive a verification email and have a PENDING status until verified.
- Password must meet complexity requirements: minimum 10 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.

### Login

```
POST /api/v1/auth/login
```

Authenticates a user with email and password.

**Authentication Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",    // Required - User email address
  "password": "SecureP@ssw0rd"    // Required - User password
}
```

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "LOCAL",
    "lastLogin": "2023-07-15T14:20:00Z",
    "createdAt": "2023-07-15T10:30:00Z"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "field_required"
    }
  ]
}
```

- 401 Unauthorized: Invalid credentials
```json
{
  "error": "Invalid credentials"
}
```

- 403 Forbidden: Account issues
```json
{
  "error": "Account is locked due to too many failed attempts. Try again in 15 minutes."
}
```
or
```json
{
  "error": "Email address not verified. Please check your email for verification instructions."
}
```

**Notes**:
- Failed login attempts are tracked. Multiple failures will temporarily lock the account.
- Users with unverified email addresses may be prevented from logging in, depending on system configuration.

### Social Authentication

```
POST /api/v1/auth/social
```

Authenticates or registers a user via social authentication.

**Authentication Required**: No

**Request Body**:
```json
{
  "provider": "GOOGLE",                // Required - Authentication provider (GOOGLE, APPLE, FACEBOOK)
  "token": "oauth2token...",           // Required - OAuth token from the provider
  "email": "user@example.com"          // Optional - User email address
}
```

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "GOOGLE",
    "lastLogin": "2023-07-15T14:20:00Z",
    "createdAt": "2023-07-15T10:30:00Z"
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "provider",
      "message": "Provider must be one of: GOOGLE, APPLE, FACEBOOK",
      "code": "invalid_value"
    }
  ]
}
```

- 401 Unauthorized: Invalid social token
```json
{
  "error": "Invalid social token"
}
```

**Notes**:
- If the user doesn't exist, a new account will be created.
- If the user exists with a different provider, accounts will be linked.
- Users authenticated via social providers have their email automatically verified.

### Refresh Token

```
POST /api/v1/auth/refresh
```

Refresh an expired access token using a valid refresh token.

**Authentication Required**: No

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Required - Valid refresh token
}
```

**Response**: 200 OK
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "refreshToken",
      "message": "Refresh token is required",
      "code": "field_required"
    }
  ]
}
```

- 401 Unauthorized: Invalid or expired refresh token
```json
{
  "error": "Invalid or expired refresh token"
}
```

**Notes**:
- Refresh tokens are single-use. Each refresh operation invalidates the previous refresh token and issues a new one.
- Access tokens are valid for 15 minutes, refresh tokens for 7 days.

### Logout

```
POST /api/v1/auth/logout
```

Log out a user by invalidating their tokens.

**Authentication Required**: No (token provided in request body)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Required - Refresh token to invalidate
}
```

**Response**: 200 OK
```json
{
  "message": "Logout successful"
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "refreshToken",
      "message": "Refresh token is required",
      "code": "field_required"
    }
  ]
}
```

**Notes**:
- The Authorization header with access token is optional. If provided, both tokens will be invalidated.
- This endpoint will always return a success message, even if the token was already invalid.

### Logout from all devices

```
POST /api/v1/auth/logout-all
```

Log out a user from all devices by invalidating all their tokens.

**Authentication Required**: Yes

**Request Body**: Empty

**Response**: 200 OK
```json
{
  "message": "Logged out from all devices",
  "count": 3  // Number of sessions terminated
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid authentication
```json
{
  "error": "Unauthorized"
}
```

**Notes**:
- This endpoint invalidates all refresh and access tokens for the authenticated user.
- Requires a valid access token in the Authorization header.

### Request Password Reset

```
POST /api/v1/auth/password-reset
```

Request a password reset email.

**Authentication Required**: No

**Request Body**:
```json
{
  "email": "user@example.com"  // Required - User email address
}
```

**Response**: 200 OK
```json
{
  "message": "Password reset email sent"
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email format",
      "code": "invalid_format"
    }
  ]
}
```

**Notes**:
- For security reasons, this endpoint always returns a success message, even if the email doesn't exist in the system.
- The reset link in the email contains a secure token that expires after 1 hour.

### Confirm Password Reset

```
POST /api/v1/auth/password-reset/confirm
```

Reset a password using a valid reset token.

**Authentication Required**: No

**Request Body**:
```json
{
  "token": "abc123...",                // Required - Password reset token
  "newPassword": "NewSecureP@ssw0rd",  // Required - New password meeting complexity requirements
  "confirmPassword": "NewSecureP@ssw0rd"  // Required - Must match newPassword
}
```

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "LOCAL",
    "lastLogin": "2023-07-15T14:20:00Z",
    "createdAt": "2023-07-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "newPassword",
      "message": "Password must be at least 10 characters and include uppercase, lowercase, number, and special character",
      "code": "insufficient_complexity"
    },
    {
      "field": "confirmPassword",
      "message": "Passwords do not match",
      "code": "passwords_mismatch"
    }
  ]
}
```

- 401 Unauthorized: Invalid or expired token
```json
{
  "error": "Invalid or expired token"
}
```

**Notes**:
- Password reset tokens expire after 1 hour.
- After reset, all existing sessions are invalidated.
- New password must meet the same complexity requirements as registration.

### Verify Email

```
GET /api/v1/auth/verify-email?token=abc123...
```

Verify a user's email address using a verification token.

**Authentication Required**: No

**Query Parameters**:
- `token` (required): Email verification token

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "LOCAL",
    "lastLogin": null,
    "createdAt": "2023-07-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "token",
      "message": "Token is required",
      "code": "field_required"
    }
  ]
}
```

- 401 Unauthorized: Invalid or expired token
```json
{
  "error": "Invalid or expired token"
}
```

**Notes**:
- Email verification tokens expire after 24 hours.
- Upon successful verification, account status changes from PENDING to ACTIVE.
- This endpoint is typically accessed via a link in the verification email.

### Resend Verification Email

```
POST /api/v1/auth/resend-verification
```

Resend the email verification token.

**Authentication Required**: No

**Request Body**:
```json
{
  "email": "user@example.com"  // Required - User email address
}
```

**Response**: 200 OK
```json
{
  "message": "Verification email sent"
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email format",
      "code": "invalid_format"
    }
  ]
}
```

**Notes**:
- For security reasons, this endpoint always returns a success message, even if the email doesn't exist or is already verified.
- A new verification token is generated with a 24-hour expiration.

### Change Password

```
POST /api/v1/auth/change-password
```

Change a user's password (requires authentication).

**Authentication Required**: Yes

**Request Body**:
```json
{
  "currentPassword": "SecureP@ssw0rd",        // Required - Current password
  "newPassword": "NewSecureP@ssw0rd",          // Required - New password meeting complexity requirements
  "confirmPassword": "NewSecureP@ssw0rd"       // Required - Must match newPassword
}
```

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "LOCAL",
    "lastLogin": "2023-07-15T14:20:00Z",
    "createdAt": "2023-07-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "newPassword",
      "message": "Password must be at least 10 characters and include uppercase, lowercase, number, and special character",
      "code": "insufficient_complexity"
    },
    {
      "field": "confirmPassword",
      "message": "Passwords do not match",
      "code": "passwords_mismatch"
    }
  ]
}
```

- 401 Unauthorized: Invalid authentication or current password
```json
{
  "error": "Current password is incorrect"
}
```

**Notes**:
- This endpoint requires authentication and verification of the current password.
- After password change, all existing sessions except the current one are invalidated.
- Users authenticated via social providers may not be able to use this endpoint.

### Validate Token

```
GET /api/v1/auth/validate-token
```

Validate an access token and return user data.

**Authentication Required**: Yes

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "LOCAL",
    "lastLogin": "2023-07-15T14:20:00Z",
    "createdAt": "2023-07-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or expired token
```json
{
  "error": "Invalid or expired token"
}
```

**Notes**:
- This endpoint is useful for client applications to validate tokens and retrieve current user information.
- It can be used as a lightweight alternative to a full user profile fetch.

### Get Current User

```
GET /api/v1/auth/me
```

Get the current authenticated user's data.

**Authentication Required**: Yes

**Response**: 200 OK
```json
{
  "user": {
    "id": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "isVerified": true,
    "provider": "LOCAL",
    "lastLogin": "2023-07-15T14:20:00Z",
    "createdAt": "2023-07-15T10:30:00Z"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Missing or invalid authentication
```json
{
  "error": "Unauthorized"
}
```

**Notes**:
- This endpoint returns the user data associated with the authenticated token.
- Unlike `/validate-token`, this endpoint may include additional user information.

## Authentication Details

### JWT Tokens

#### Access Token
- **Format**: JWT
- **Expiration**: 15 minutes
- **Payload**:
  ```json
  {
    "userId": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "email": "user@example.com",
    "role": "USER",
    "iat": 1626360000,
    "exp": 1626360900,
    "iss": "Tribe"
  }
  ```
- **Usage**: Include in Authorization header as 'Bearer {token}'

#### Refresh Token
- **Format**: JWT
- **Expiration**: 7 days
- **Payload**:
  ```json
  {
    "userId": "5f8d0c1b9d3e2a1b8c7d6e5f",
    "tokenId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "iat": 1626360000,
    "exp": 1626964800,
    "iss": "Tribe"
  }
  ```
- **Usage**: Send in request body to /refresh endpoint
- **Security**: Single-use, rotated on each refresh

### Token Security Recommendations

- **Storage**: Access tokens should be stored in memory, refresh tokens in secure storage (HttpOnly cookies, secure storage on mobile)
- **Transmission**: Always use HTTPS for token transmission
- **Validation**: Tokens are validated on every authenticated request
- **Revocation**: Tokens can be revoked via logout endpoints or password changes

## Error Handling

### Error Format

All API errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific error message",
      "code": "error_code"
    }
  ],
  "code": "global_error_code"  // Optional
}
```

### Common Error Codes

- **400** - Bad Request: Validation errors, malformed requests
- **401** - Unauthorized: Missing or invalid authentication
- **403** - Forbidden: Insufficient permissions
- **404** - Not Found: Resource doesn't exist
- **409** - Conflict: Resource already exists
- **422** - Unprocessable Entity: Semantic errors
- **429** - Too Many Requests: Rate limit exceeded
- **500** - Internal Server Error: Server-side error

### Validation Errors

Validation errors provide detailed information about which fields failed validation:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Must be a valid email format",
      "code": "invalid_format"
    },
    {
      "field": "password",
      "message": "Password must be at least 10 characters and include uppercase, lowercase, number, and special character",
      "code": "insufficient_complexity"
    }
  ]
}
```

## Security Considerations

### Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Registration: 10 requests per hour per IP
- Login: 10 requests per 5 minutes per IP/account
- Password Reset: 5 requests per hour per email
- Token Refresh: 30 requests per hour per user

### Password Policies

- Minimum length: 10 characters
- Complexity: Must include uppercase, lowercase, number, and special character
- History: Cannot reuse the last 5 passwords
- Expiration: Optional 90-day expiration can be configured

### Account Lockout

Progressive account lockout after multiple failed login attempts:
- 5 failures: 15-minute lockout
- 10 failures: 1-hour lockout
- 20 failures: Account requires administrative unlock

### Token Security

- Short-lived access tokens (15 minutes)
- Single-use refresh tokens
- Complete session termination available
- All sessions invalidated on password change

### Data Protection

- Sensitive data is encrypted in transit (TLS 1.3) and at rest
- Passwords stored using bcrypt with appropriate cost factor
- PII handled according to GDPR and CCPA requirements

### Secure Headers

Security headers implemented via Helmet middleware:
- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection