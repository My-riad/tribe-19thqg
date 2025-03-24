# Profile Service API Documentation

**Version:** v1  
**Base URL:** `/api/v1/profiles`

## Overview

The Profile Service API provides endpoints for managing user profiles, personality traits, interests, and compatibility calculations in the Tribe platform. This service is a core component of the personality-based matchmaking system.

## Authentication

All endpoints require a valid JWT token in the Authorization header, except where noted.

```
Authorization: Bearer {token}
```

## Error Responses

| Status Code | Description | Response Format |
|-------------|-------------|-----------------|
| 400 | Bad Request - Invalid input parameters or validation failure | `{"error": "string", "message": "string", "details": object (optional)}` |
| 401 | Unauthorized - Missing or invalid authentication token | `{"error": "string", "message": "string"}` |
| 403 | Forbidden - Authenticated user does not have permission | `{"error": "string", "message": "string"}` |
| 404 | Not Found - Requested resource does not exist | `{"error": "string", "message": "string"}` |
| 500 | Internal Server Error - Unexpected server error | `{"error": "string", "message": "string"}` |

## Endpoints

### Create a new user profile

**POST** `/api/v1/profiles/`

Creates a new profile for a user with basic information, location, and preferences.

#### Request Body

```json
{
  "userId": "string (required) - ID of the user this profile belongs to",
  "name": "string (required) - User's display name",
  "bio": "string (optional) - User's biography or description",
  "location": "string (required) - Text description of user's location",
  "coordinates": {
    "latitude": "number (required) - Geographic latitude",
    "longitude": "number (required) - Geographic longitude"
  },
  "birthdate": "string (ISO date, required) - User's date of birth",
  "phoneNumber": "string (optional) - User's phone number",
  "avatarUrl": "string (optional) - URL to user's profile image",
  "communicationStyle": "string (enum, optional) - User's preferred communication style (DIRECT, THOUGHTFUL, EXPRESSIVE, SUPPORTIVE, ANALYTICAL)",
  "maxTravelDistance": "number (optional) - Maximum distance in miles user is willing to travel for meetups"
}
```

#### Response (201 Created)

```json
{
  "id": "string - Unique profile ID",
  "userId": "string - ID of the user this profile belongs to",
  "name": "string - User's display name",
  "bio": "string - User's biography or description",
  "location": "string - Text description of user's location",
  "coordinates": {
    "latitude": "number - Geographic latitude",
    "longitude": "number - Geographic longitude"
  },
  "birthdate": "string (ISO date) - User's date of birth",
  "phoneNumber": "string - User's phone number",
  "avatarUrl": "string - URL to user's profile image",
  "communicationStyle": "string (enum) - User's preferred communication style",
  "maxTravelDistance": "number - Maximum travel distance in miles",
  "createdAt": "string (ISO datetime) - Creation timestamp",
  "updatedAt": "string (ISO datetime) - Last update timestamp"
}
```

### Get a profile by ID

**GET** `/api/v1/profiles/:profileId`

Retrieves a user profile by its unique identifier.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "userId": "string - ID of the user this profile belongs to",
  "name": "string - User's display name",
  "bio": "string - User's biography or description",
  "location": "string - Text description of user's location",
  "coordinates": {
    "latitude": "number - Geographic latitude",
    "longitude": "number - Geographic longitude"
  },
  "birthdate": "string (ISO date) - User's date of birth",
  "phoneNumber": "string - User's phone number",
  "avatarUrl": "string - URL to user's profile image",
  "communicationStyle": "string (enum) - User's preferred communication style",
  "maxTravelDistance": "number - Maximum travel distance in miles",
  "createdAt": "string (ISO datetime) - Creation timestamp",
  "updatedAt": "string (ISO datetime) - Last update timestamp"
}
```

### Get a profile by user ID

**GET** `/api/v1/profiles/user/:userId`

Retrieves a user profile by the associated user identifier.

#### Path Parameters

- `userId` - string (required) - ID of the user whose profile to retrieve

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "userId": "string - ID of the user this profile belongs to",
  "name": "string - User's display name",
  "bio": "string - User's biography or description",
  "location": "string - Text description of user's location",
  "coordinates": {
    "latitude": "number - Geographic latitude",
    "longitude": "number - Geographic longitude"
  },
  "birthdate": "string (ISO date) - User's date of birth",
  "phoneNumber": "string - User's phone number",
  "avatarUrl": "string - URL to user's profile image",
  "communicationStyle": "string (enum) - User's preferred communication style",
  "maxTravelDistance": "number - Maximum travel distance in miles",
  "createdAt": "string (ISO datetime) - Creation timestamp",
  "updatedAt": "string (ISO datetime) - Last update timestamp"
}
```

### Update a profile

**PUT** `/api/v1/profiles/:profileId`

Updates an existing user profile with new information.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile to update

#### Request Body

```json
{
  "name": "string (optional) - User's display name",
  "bio": "string (optional) - User's biography or description",
  "location": "string (optional) - Text description of user's location",
  "coordinates": {
    "latitude": "number (optional) - Geographic latitude",
    "longitude": "number (optional) - Geographic longitude"
  },
  "birthdate": "string (ISO date, optional) - User's date of birth",
  "phoneNumber": "string (optional) - User's phone number",
  "avatarUrl": "string (optional) - URL to user's profile image",
  "communicationStyle": "string (enum, optional) - User's preferred communication style",
  "maxTravelDistance": "number (optional) - Maximum travel distance in miles"
}
```

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "userId": "string - ID of the user this profile belongs to",
  "name": "string - User's display name",
  "bio": "string - User's biography or description",
  "location": "string - Text description of user's location",
  "coordinates": {
    "latitude": "number - Geographic latitude",
    "longitude": "number - Geographic longitude"
  },
  "birthdate": "string (ISO date) - User's date of birth",
  "phoneNumber": "string - User's phone number",
  "avatarUrl": "string - URL to user's profile image",
  "communicationStyle": "string (enum) - User's preferred communication style",
  "maxTravelDistance": "number - Maximum travel distance in miles",
  "createdAt": "string (ISO datetime) - Creation timestamp",
  "updatedAt": "string (ISO datetime) - Last update timestamp"
}
```

### Delete a profile

**DELETE** `/api/v1/profiles/:profileId`

Deletes a user profile and all associated data.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile to delete

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "message": "string - Confirmation message"
}
```

### Search for profiles

**GET** `/api/v1/profiles/search`

Searches for user profiles based on various criteria including location, interests, and personality traits.

#### Query Parameters

- `query` - string (optional) - Text search query for name or bio
- `latitude` - number (optional) - Geographic latitude for location-based search
- `longitude` - number (optional) - Geographic longitude for location-based search
- `maxDistance` - number (optional) - Maximum distance in miles from specified coordinates
- `interests` - string (optional) - Comma-separated list of interest categories
- `communicationStyles` - string (optional) - Comma-separated list of communication styles
- `personalityTraits` - string (optional) - JSON string of personality trait filters
- `page` - number (optional, default: 1) - Page number for pagination
- `limit` - number (optional, default: 20) - Number of results per page

#### Response (200 OK)

```json
{
  "profiles": "array - List of matching profiles",
  "total": "number - Total number of matching profiles",
  "page": "number - Current page number",
  "limit": "number - Number of results per page",
  "pages": "number - Total number of pages"
}
```

### Get complete profile

**GET** `/api/v1/profiles/:profileId/complete`

Retrieves a complete user profile including personality traits and interests.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "userId": "string - ID of the user this profile belongs to",
  "name": "string - User's display name",
  "bio": "string - User's biography or description",
  "location": "string - Text description of user's location",
  "coordinates": {
    "latitude": "number - Geographic latitude",
    "longitude": "number - Geographic longitude"
  },
  "birthdate": "string (ISO date) - User's date of birth",
  "phoneNumber": "string - User's phone number",
  "avatarUrl": "string - URL to user's profile image",
  "communicationStyle": "string (enum) - User's preferred communication style",
  "maxTravelDistance": "number - Maximum travel distance in miles",
  "personalityTraits": "array - List of personality trait measurements",
  "interests": "array - List of user interests",
  "createdAt": "string (ISO datetime) - Creation timestamp",
  "updatedAt": "string (ISO datetime) - Last update timestamp"
}
```

### Update profile location

**PUT** `/api/v1/profiles/:profileId/location`

Updates a user profile's location information.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Request Body

```json
{
  "location": "string (required) - Text description of user's location",
  "coordinates": {
    "latitude": "number (required) - Geographic latitude",
    "longitude": "number (required) - Geographic longitude"
  }
}
```

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "location": "string - Updated location description",
  "coordinates": {
    "latitude": "number - Updated latitude",
    "longitude": "number - Updated longitude"
  },
  "updatedAt": "string (ISO datetime) - Update timestamp"
}
```

### Update maximum travel distance

**PUT** `/api/v1/profiles/:profileId/travel-distance`

Updates a user profile's maximum travel distance preference.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Request Body

```json
{
  "maxTravelDistance": "number (required) - Maximum distance in miles user is willing to travel"
}
```

#### Response (200 OK)

```json
{
  "id": "string - Unique profile ID",
  "maxTravelDistance": "number - Updated maximum travel distance",
  "updatedAt": "string (ISO datetime) - Update timestamp"
}
```

### Submit personality assessment

**POST** `/api/v1/profiles/:profileId/personality`

Submits a complete personality assessment for a user profile.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Request Body

```json
{
  "traits": "array (required) - List of personality trait measurements",
  "traits[].trait": "string (enum, required) - Personality trait name (OPENNESS, CONSCIENTIOUSNESS, EXTRAVERSION, AGREEABLENESS, NEUROTICISM, etc.)",
  "traits[].score": "number (required) - Score for the trait (0-100)",
  "communicationStyle": "string (enum, required) - Preferred communication style (DIRECT, THOUGHTFUL, EXPRESSIVE, SUPPORTIVE, ANALYTICAL)",
  "assessmentSource": "string (optional) - Source of the assessment data"
}
```

#### Response (200 OK)

```json
{
  "profileId": "string - Profile ID",
  "traits": "array - List of created personality trait records",
  "communicationStyle": "string - Updated communication style"
}
```

### Get personality traits

**GET** `/api/v1/profiles/:profileId/personality`

Retrieves all personality traits for a user profile.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Response (200 OK)

```json
{
  "traits": "array - List of personality trait measurements",
  "traits[].id": "string - Unique trait ID",
  "traits[].profileId": "string - Profile ID",
  "traits[].trait": "string - Personality trait name",
  "traits[].score": "number - Score for the trait (0-100)",
  "traits[].assessedAt": "string (ISO datetime) - Assessment timestamp"
}
```

### Analyze personality traits

**GET** `/api/v1/profiles/:profileId/personality/analyze`

Analyzes a profile's personality traits to determine dominant characteristics and patterns.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Response (200 OK)

```json
{
  "profileId": "string - Profile ID",
  "dominantTraits": "array - List of dominant personality traits",
  "communicationStyle": "string - Communication style",
  "groupDynamics": "object - Analysis of how this profile might interact in groups",
  "compatibilityFactors": "object - Key factors for compatibility with others"
}
```

### Get profile interests

**GET** `/api/v1/profiles/:profileId/interests`

Retrieves all interests for a user profile.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Response (200 OK)

```json
{
  "interests": "array - List of user interests",
  "interests[].id": "string - Unique interest ID",
  "interests[].profileId": "string - Profile ID",
  "interests[].category": "string - Interest category",
  "interests[].name": "string - Specific interest name",
  "interests[].level": "number - Interest level (1-3)"
}
```

### Submit interests

**POST** `/api/v1/profiles/:profileId/interests`

Submits a batch of interests for a user profile.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Request Body

```json
{
  "interests": "array (required) - List of user interests",
  "interests[].category": "string (enum, required) - Interest category (OUTDOOR_ADVENTURES, ARTS_CULTURE, FOOD_DINING, etc.)",
  "interests[].name": "string (required) - Specific interest name",
  "interests[].level": "number (enum, required) - Interest level (1=LOW, 2=MEDIUM, 3=HIGH)",
  "replaceExisting": "boolean (optional, default: false) - Whether to replace all existing interests"
}
```

#### Response (201 Created)

```json
{
  "profileId": "string - Profile ID",
  "interests": "array - List of created interest records"
}
```

### Get a specific interest

**GET** `/api/v1/profiles/:profileId/interests/:interestId`

Retrieves a specific interest by its ID.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile
- `interestId` - string (required) - Unique identifier of the interest

#### Response (200 OK)

```json
{
  "id": "string - Unique interest ID",
  "profileId": "string - Profile ID",
  "category": "string - Interest category",
  "name": "string - Specific interest name",
  "level": "number - Interest level (1-3)"
}
```

### Update an interest

**PUT** `/api/v1/profiles/:profileId/interests/:interestId`

Updates a specific interest.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile
- `interestId` - string (required) - Unique identifier of the interest

#### Request Body

```json
{
  "category": "string (enum, optional) - Interest category",
  "name": "string (optional) - Specific interest name",
  "level": "number (enum, optional) - Interest level (1=LOW, 2=MEDIUM, 3=HIGH)"
}
```

#### Response (200 OK)

```json
{
  "id": "string - Unique interest ID",
  "profileId": "string - Profile ID",
  "category": "string - Updated interest category",
  "name": "string - Updated interest name",
  "level": "number - Updated interest level"
}
```

### Delete an interest

**DELETE** `/api/v1/profiles/:profileId/interests/:interestId`

Deletes a specific interest.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile
- `interestId` - string (required) - Unique identifier of the interest

#### Response (204 No Content)

### Calculate compatibility

**GET** `/api/v1/profiles/:profileId/compatibility/:targetProfileId`

Calculates compatibility between two user profiles based on personality traits, interests, and communication styles.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the first profile
- `targetProfileId` - string (required) - Unique identifier of the second profile

#### Response (200 OK)

```json
{
  "overall": "number - Overall compatibility score (0-100)",
  "personality": "number - Personality compatibility score (0-100)",
  "interests": "number - Interest compatibility score (0-100)",
  "communication": "number - Communication style compatibility score (0-100)",
  "details": "object - Detailed breakdown of compatibility factors"
}
```

### Find nearby profiles

**GET** `/api/v1/profiles/:profileId/nearby`

Finds profiles near a specific location within a given distance.

#### Path Parameters

- `profileId` - string (required) - Unique identifier of the profile

#### Query Parameters

- `maxDistance` - number (optional, default: profile's maxTravelDistance) - Maximum distance in miles
- `limit` - number (optional, default: 20) - Maximum number of results
- `offset` - number (optional, default: 0) - Number of results to skip

#### Response (200 OK)

```json
{
  "profiles": "array - List of nearby profiles",
  "total": "number - Total number of nearby profiles",
  "distance": "object - Distance information for each profile"
}
```

## Data Models

### Profile

```json
{
  "id": "string - Unique profile identifier",
  "userId": "string - ID of the user this profile belongs to",
  "name": "string - User's display name",
  "bio": "string - User's biography or description",
  "location": "string - Text description of user's location",
  "coordinates": {
    "latitude": "number - Geographic latitude",
    "longitude": "number - Geographic longitude"
  },
  "birthdate": "string (ISO date) - User's date of birth",
  "phoneNumber": "string - User's phone number",
  "avatarUrl": "string - URL to user's profile image",
  "communicationStyle": "string (enum) - User's preferred communication style",
  "maxTravelDistance": "number - Maximum travel distance in miles",
  "createdAt": "string (ISO datetime) - Creation timestamp",
  "updatedAt": "string (ISO datetime) - Last update timestamp"
}
```

### PersonalityTrait

```json
{
  "id": "string - Unique trait identifier",
  "profileId": "string - ID of the profile this trait belongs to",
  "trait": "string (enum) - Personality trait name",
  "score": "number - Score for the trait (0-100)",
  "assessedAt": "string (ISO datetime) - Assessment timestamp"
}
```

### Interest

```json
{
  "id": "string - Unique interest identifier",
  "profileId": "string - ID of the profile this interest belongs to",
  "category": "string (enum) - Interest category",
  "name": "string - Specific interest name",
  "level": "number (enum) - Interest level (1=LOW, 2=MEDIUM, 3=HIGH)"
}
```

### CompatibilityResult

```json
{
  "overall": "number - Overall compatibility score (0-100)",
  "personality": "number - Personality compatibility score (0-100)",
  "interests": "number - Interest compatibility score (0-100)",
  "communication": "number - Communication style compatibility score (0-100)"
}
```

## Enums

### PersonalityTrait

- `OPENNESS`
- `CONSCIENTIOUSNESS`
- `EXTRAVERSION`
- `AGREEABLENESS`
- `NEUROTICISM`
- `ADVENTUROUSNESS`
- `CREATIVITY`
- `CURIOSITY`
- `SOCIABILITY`
- `ASSERTIVENESS`

### CommunicationStyle

- `DIRECT`
- `THOUGHTFUL`
- `EXPRESSIVE`
- `SUPPORTIVE`
- `ANALYTICAL`

### InterestCategory

- `OUTDOOR_ADVENTURES`
- `ARTS_CULTURE`
- `FOOD_DINING`
- `SPORTS_FITNESS`
- `GAMES_ENTERTAINMENT`
- `LEARNING_EDUCATION`
- `TECHNOLOGY`
- `WELLNESS_MINDFULNESS`

### InterestLevel

- `LOW (1)`
- `MEDIUM (2)`
- `HIGH (3)`