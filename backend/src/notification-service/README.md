# Notification Service

Core microservice responsible for managing and delivering notifications across multiple channels (push, email, in-app) to users of the Tribe platform.

## Overview

The Notification Service handles the creation, delivery, and tracking of all user communications in the Tribe platform. It supports multiple notification types including tribe invitations, event reminders, AI engagement prompts, and achievement notifications. The service ensures reliable delivery across different channels based on user preferences and provides tracking mechanisms for monitoring delivery status and user engagement.

## Features

- Multi-channel notification delivery (push, email, in-app)
- Templated notifications for consistent messaging
- User preference management for notification settings
- Delivery tracking and retry mechanisms
- SLA monitoring and reporting
- Support for rich notifications with images and action buttons
- Batched processing for high-volume notifications

## Architecture

The Notification Service follows a modular architecture with the following components:

- **Controllers**: Handle HTTP requests for notification management
- **Services**: Implement business logic for notification processing
- **Models**: Define data structures for notifications, deliveries, and preferences
- **Providers**: Implement channel-specific delivery mechanisms (FCM, email, etc.)
- **Templates**: Standardize notification content for different scenarios
- **Utils**: Provide helper functions for notification processing

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB
- Firebase project (for push notifications)
- SMTP server (for email notifications)

### Environment Variables
```
PORT=3004
MONGODB_URI=mongodb://localhost:27017/tribe-notifications
FCM_SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
FCM_PROJECT_ID=tribe-app
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@tribe.app
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=notifications@tribe.app
SMTP_FROM_NAME=Tribe App
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=60000
```

### Installation
```bash
npm install
```

### Running the Service
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Notification Endpoints

- `POST /api/notifications` - Create a new notification
- `GET /api/notifications/:id` - Get notification by ID
- `GET /api/notifications/user/:userId` - Get user's notifications
- `GET /api/notifications/user/:userId/unread` - Get user's unread notifications
- `GET /api/notifications/user/:userId/count` - Count user's unread notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read` - Mark multiple notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/bulk` - Create bulk notifications
- `POST /api/notifications/tribe` - Create tribe notifications
- `POST /api/notifications/template` - Create templated notification
- `GET /api/notifications/stats` - Get notification statistics

### Delivery Endpoints

- `GET /api/deliveries/:id` - Get delivery by ID
- `GET /api/deliveries/notification/:notificationId` - Get deliveries by notification
- `GET /api/deliveries/notification/:notificationId/channel/:channel` - Get delivery by notification and channel
- `POST /api/deliveries` - Create delivery record
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/read` - Mark delivery as read
- `POST /api/deliveries/retry` - Retry failed deliveries
- `GET /api/deliveries/stats` - Get delivery statistics
- `GET /api/deliveries/stats/channel` - Get delivery statistics by channel
- `POST /api/deliveries/cleanup` - Clean up old deliveries

### Preference Endpoints

- `GET /api/preferences/user/:userId` - Get user preferences
- `GET /api/preferences/user/:userId/type/:type` - Get user preference by type
- `POST /api/preferences` - Create preference
- `PUT /api/preferences/:id` - Update preference
- `DELETE /api/preferences/:id` - Delete preference
- `PUT /api/preferences/bulk` - Update multiple preferences
- `PUT /api/preferences/toggle` - Toggle notification type
- `PUT /api/preferences/channels` - Update delivery channels
- `POST /api/preferences/ensure` - Ensure user has required preferences
- `POST /api/preferences/reset` - Reset preferences to defaults

## Notification Types

The service supports the following notification types:

- `TRIBE_INVITATION` - Invitation to join a tribe
- `TRIBE_MATCH` - AI-generated tribe match suggestion
- `TRIBE_UPDATE` - Updates to tribe information or activities
- `EVENT_REMINDER` - Reminders for upcoming events
- `EVENT_INVITATION` - Invitation to an event
- `EVENT_UPDATE` - Updates to event details
- `EVENT_RSVP` - RSVP updates from tribe members
- `AI_ENGAGEMENT_PROMPT` - AI-generated conversation starters
- `AI_ACTIVITY_SUGGESTION` - AI-suggested activities
- `ACHIEVEMENT_UNLOCKED` - User achievement notifications
- `CHAT_MESSAGE` - New chat messages

Each notification type has specific templates and delivery preferences.

## Delivery Channels

Notifications can be delivered through multiple channels:

- `PUSH` - Mobile push notifications via Firebase Cloud Messaging
- `EMAIL` - Email notifications via SMTP
- `IN_APP` - In-app notifications displayed within the application

Users can configure their preferred channels for each notification type through the preferences API.

## Integration with Other Services

The Notification Service integrates with several other microservices:

- **Tribe Service**: Sends tribe-related notifications
- **Event Service**: Sends event-related notifications
- **Engagement Service**: Sends AI-generated engagement prompts
- **Matching Service**: Sends tribe match notifications
- **Achievement Service**: Sends achievement notifications

Integration is done through direct API calls to the Notification Service endpoints.

## Monitoring and SLAs

The service implements comprehensive monitoring to ensure reliable notification delivery:

- Delivery success rate tracking (target: >99%)
- Delivery time tracking (target: <5 minutes)
- Failed delivery alerting and automatic retry
- Channel-specific performance metrics
- Daily delivery statistics reporting

Metrics are exposed through the `/api/deliveries/stats` endpoint and can be integrated with monitoring systems.

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

The service includes comprehensive test coverage for all notification workflows, delivery mechanisms, and error handling scenarios.

## Troubleshooting

Common issues and their solutions:

1. **Failed Push Notifications**
   - Verify FCM configuration and service account credentials
   - Check device token validity
   - Review FCM quota and rate limits

2. **Failed Email Deliveries**
   - Verify SMTP configuration
   - Check email templates for formatting issues
   - Review spam filter settings

3. **Missing Notifications**
   - Verify user preference settings
   - Check notification expiration settings
   - Review delivery channel status

4. **High Latency**
   - Monitor queue depth and processing rate
   - Check external service dependencies
   - Review database performance

Logs are available in the standard output and can be configured to write to a file or external logging service.

## Contributing

When contributing to the Notification Service, please follow these guidelines:

1. Follow the established code style and patterns
2. Add unit tests for new functionality
3. Update documentation for API changes
4. Ensure backward compatibility for preference settings
5. Consider performance implications for high-volume notifications

## License

This service is part of the Tribe platform and is subject to the same licensing terms as the overall project.