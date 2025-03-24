# Tribe Mobile Application

## Overview

Tribe is an AI-powered matchmaking and engagement platform designed to create and sustain meaningful small-group connections (4-8 people) and encourage users to transition from digital to physical interactions. The platform specifically focuses on local connections and caters to introverts who may find traditional social networking challenging.

This directory contains the mobile application frontend built with React Native, providing a cross-platform experience for both iOS and Android users.

## Key Features

- AI-powered matchmaking and auto group formation
- Personality-based user profiling
- User-driven tribe creation and search
- AI-driven continuous engagement
- Real-time event and activity curation
- AI-optimized planning and coordination
- Group management tools
- Gamification and rewards system

## Technology Stack

- **Framework**: React Native 0.72+
- **Language**: TypeScript 4.9+
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6.0+
- **Styling**: Styled Components
- **Forms**: Formik + Yup
- **API Communication**: Axios, Socket.io
- **Testing**: Jest, React Testing Library
- **Build Tools**: Expo

## Project Structure

```
src/
├── api/                # API clients and service integrations
├── assets/            # Static assets (images, fonts, animations)
├── components/        # Reusable UI components
│   ├── ui/            # Basic UI components
│   ├── auth/          # Authentication-related components
│   ├── profile/       # Profile-related components
│   ├── tribe/         # Tribe-related components
│   └── event/         # Event-related components
├── constants/         # Application constants
├── hooks/             # Custom React hooks
├── mocks/             # Mock data for testing
├── navigation/        # Navigation configuration
├── screens/           # Application screens
│   ├── auth/          # Authentication screens
│   ├── onboarding/    # Onboarding screens
│   ├── main/          # Main tab screens
│   ├── tribe/         # Tribe-related screens
│   ├── event/         # Event-related screens
│   └── settings/      # Settings screens
├── services/          # Business logic services
├── store/             # Redux store configuration
│   ├── slices/        # Redux slices
│   └── thunks/        # Async thunks
├── theme/             # Theme configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18.0+
- npm or yarn
- iOS: XCode 14+ (for iOS development)
- Android: Android Studio (for Android development)

### Installation

1. Clone the repository
   ```bash
   git clone [repository-url]
   cd tribe/src/web
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your local configuration
   ```

### Running the Application

#### Development Mode

```bash
# Start the Metro bundler
npm start
# or
yarn start

# Run on iOS
npm run ios
# or
yarn ios

# Run on Android
npm run android
# or
yarn android
```

#### Building for Production

```bash
# Build for iOS
npm run build:ios
# or
yarn build:ios

# Build for Android
npm run build:android
# or
yarn build:android
```

## Development Guidelines

### Code Style

This project uses ESLint and Prettier for code formatting and linting. Run the following commands to ensure your code meets the project standards:

```bash
# Check code style
npm run lint
# or
yarn lint

# Fix code style issues
npm run lint:fix
# or
yarn lint:fix

# Format code
npm run format
# or
yarn format
```

### Type Checking

Run TypeScript type checking with:

```bash
npm run typecheck
# or
yarn typecheck
```

### Testing

The project uses Jest and React Testing Library for testing. Run tests with:

```bash
# Run all tests
npm test
# or
yarn test

# Run tests in watch mode
npm run test:watch
# or
yarn test:watch

# Generate test coverage report
npm run test:coverage
# or
yarn test:coverage
```

### Adding New Features

1. Create a new branch for your feature
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement your feature following the project structure

3. Write tests for your feature

4. Submit a pull request

### Working with APIs

All API interactions should go through the API clients in the `api/` directory. To add a new API endpoint:

1. Add the endpoint to the appropriate API client file
2. Update the corresponding types in `types/api.types.ts`
3. Create or update the relevant Redux thunks if needed

## Key Workflows

### Authentication Flow

The authentication flow includes:
- Welcome screen
- Registration/Login
- Email verification
- Personality assessment
- Interest selection
- Location setup
- Profile creation

### Tribe Formation Flow

- AI-powered matchmaking
- Manual tribe search
- Tribe creation
- Joining tribes
- Tribe management

### Event Planning Flow

- Event discovery
- AI-suggested activities
- Scheduling and coordination
- RSVP management
- Check-ins and verification

## Offline Support

The application supports offline functionality through:
- Redux Persist for state persistence
- Offline queue for API requests
- Local data caching

## Performance Considerations

- Use memoization for expensive calculations
- Implement virtualized lists for long scrolling content
- Optimize image loading with proper sizing and caching
- Minimize re-renders with React.memo and useCallback

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   - Clear Metro cache: `npx react-native start --reset-cache`

2. **iOS build failures**
   - Clean the build: `cd ios && pod deintegrate && pod install && cd ..`

3. **Android build failures**
   - Clean Gradle: `cd android && ./gradlew clean && cd ..`

4. **Dependency issues**
   - Run `npm install` or `yarn install` to ensure all dependencies are properly installed
   - Check for conflicting dependencies with `npm ls [package-name]`

## Contributing

Please see the [CONTRIBUTING.md](../../CONTRIBUTING.md) file for guidelines on contributing to this project.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.