# Contributing to Tribe

Thank you for your interest in contributing to the Tribe platform! This document provides guidelines and instructions for contributing to the project.

Tribe is an AI-powered matchmaking and engagement platform designed to create and sustain meaningful small-group connections and encourage users to transition from digital to physical interactions. Your contributions help make this platform better for everyone.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We expect all contributors to be respectful, inclusive, and considerate in all interactions.

We are committed to providing a welcoming and inspiring community for all. Harassment, offensive comments, and other inappropriate behavior will not be tolerated.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your development machine:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Docker** (latest stable version)
- **Docker Compose** (latest stable version)
- **Git** (latest stable version)

For more detailed setup instructions, please refer to the [README.md](README.md) file.

### Setting Up the Development Environment

1. **Fork the Repository**
   - Fork the repository to your GitHub account

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/tribe.git
   cd tribe
   ```

3. **Set Up Upstream Remote**
   ```bash
   git remote add upstream https://github.com/original-owner/tribe.git
   ```

4. **Install Dependencies**
   ```bash
   # For backend services
   cd backend
   npm install
   
   # For frontend application
   cd src/web
   npm install
   ```

5. **Set Up Environment Variables**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   
   # Frontend environment
   cp src/web/.env.example src/web/.env.development
   ```

6. **Start the Development Environment**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d
   
   # Or start services individually
   cd backend
   npm run start:dev
   
   cd src/web
   npm start
   ```

## Development Workflow

### Branching Strategy

We follow a feature branch workflow:

- `main` - Production-ready code
- `staging` - Pre-production testing
- `development` - Integration branch for features
- `feature/*` - Individual feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Urgent fixes for production

### Making Changes

1. **Sync with Upstream**
   ```bash
   git checkout development
   git pull upstream development
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write code that adheres to our coding standards
   - Add or update tests as necessary
   - Update documentation to reflect your changes

4. **Commit Your Changes**
   We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Common types include:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, etc.)
   - `refactor`: Code changes that neither fix bugs nor add features
   - `perf`: Performance improvements
   - `test`: Adding or updating tests
   - `chore`: Changes to the build process or auxiliary tools

5. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the repository on GitHub
   - Create a new pull request from your branch to the `development` branch
   - Fill in the pull request template with all required information
   - Request reviews from appropriate team members

## Coding Standards

### General Guidelines

- Write clean, readable, and self-documenting code
- Follow the principle of least surprise
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names
- Comment complex logic, but prefer readable code over excessive comments
- Write code that is testable and maintainable

### JavaScript/TypeScript Standards

- Use TypeScript for type safety
- Follow the ESLint and Prettier configurations provided in the project
- Use async/await for asynchronous code instead of callbacks or raw promises
- Prefer functional programming patterns where appropriate
- Use destructuring and spread operators for cleaner code
- Avoid any usage of `any` type in TypeScript
- Use proper error handling with try/catch blocks

### React/React Native Standards

- Use functional components with hooks instead of class components
- Keep components small and focused on a single responsibility
- Use proper component composition
- Follow the container/presentational component pattern
- Use React Context and Redux appropriately based on state scope
- Optimize renders with useMemo, useCallback, and React.memo where appropriate
- Follow accessibility best practices

### Backend Standards

- Follow RESTful API design principles
- Implement proper error handling and validation
- Use environment variables for configuration
- Write efficient database queries
- Implement proper logging
- Follow security best practices
- Design for scalability and performance

### Documentation Standards

- Document all public APIs, interfaces, and complex functions
- Keep documentation up-to-date with code changes
- Use JSDoc for JavaScript/TypeScript documentation
- Document architectural decisions and patterns
- Include examples where appropriate

## Testing Requirements

All code contributions must include appropriate tests. We maintain high test coverage to ensure code quality and prevent regressions.

### Testing Frameworks

- **Backend**: Jest for unit and integration tests
- **Frontend**: Jest with React Testing Library for component tests

### Types of Tests

1. **Unit Tests**
   - Test individual functions and components in isolation
   - Mock external dependencies
   - Focus on testing business logic and edge cases

2. **Integration Tests**
   - Test interactions between components or services
   - Test API endpoints with realistic data
   - Verify database interactions

3. **End-to-End Tests**
   - Test complete user flows
   - Simulate real user interactions
   - Verify system behavior as a whole

### Coverage Requirements

- **Backend**: Minimum 85% coverage for statements, branches, functions, and lines
- **Frontend**: Minimum 80% coverage for statements, branches, functions, and lines

### Running Tests

```bash
# Backend tests
cd backend
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage    # Generate coverage report

# Frontend tests
cd src/web
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Test Best Practices

- Write tests that are deterministic and repeatable
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Test both success and failure scenarios
- Use test fixtures and factories for test data
- Keep tests independent and isolated
- Avoid testing implementation details when possible

## Pull Request Process

### Before Submitting a Pull Request

1. **Ensure all tests pass**
   ```bash
   # Backend
   cd backend
   npm test
   
   # Frontend
   cd src/web
   npm test
   ```

2. **Run linting checks**
   ```bash
   # Backend
   cd backend
   npm run lint
   
   # Frontend
   cd src/web
   npm run lint
   ```

3. **Verify that your code meets coverage requirements**
   ```bash
   # Backend
   cd backend
   npm run test:coverage
   
   # Frontend
   cd src/web
   npm run test:coverage
   ```

4. **Update documentation** if your changes affect public APIs or user-facing features

5. **Ensure your branch is up-to-date** with the latest changes from the development branch
   ```bash
   git checkout development
   git pull upstream development
   git checkout your-feature-branch
   git rebase development
   ```

### Pull Request Guidelines

1. **Use the provided pull request template**
   - Fill in all required sections
   - Link to related issues
   - Describe your changes in detail

2. **Keep pull requests focused**
   - Address a single concern per pull request
   - Split large changes into smaller, more manageable pull requests

3. **Be responsive to feedback**
   - Address review comments promptly
   - Be open to suggestions and improvements

4. **CI/CD Checks**
   - Ensure all automated checks pass
   - Fix any issues identified by the CI pipeline

### Code Review Process

1. At least one approval is required from a maintainer before merging
2. Reviewers will check for:
   - Code quality and adherence to standards
   - Test coverage and quality
   - Documentation completeness
   - Performance and security considerations
   - Overall design and architecture fit

3. Once approved, a maintainer will merge your pull request

### After Merge

1. Delete your feature branch
2. Celebrate your contribution! 🎉

## Reporting Issues

### Bug Reports

If you find a bug in the Tribe platform, please report it by creating an issue using the bug report template. To create a bug report:

1. Go to the Issues tab in the repository
2. Click "New Issue"
3. Select the "Bug Report" template
4. Fill in all required information

Please include as much detail as possible, including:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (device, OS, app version)

### Feature Requests

If you have ideas for new features or improvements, please submit a feature request:

1. Go to the Issues tab in the repository
2. Click "New Issue"
3. Select the "Feature Request" template
4. Fill in all required information

Please include:
- A clear description of the problem the feature would solve
- Your proposed solution
- The user value of the feature
- Any relevant mockups or examples

## Community and Communication

### Communication Channels

- **GitHub Issues**: For bug reports, feature requests, and task tracking
- **Pull Requests**: For code review and discussion of implementations
- **Project Documentation**: For architectural decisions and development guidelines

### Getting Help

If you need help with your contribution or have questions about the development process:

1. Check the existing documentation in the repository
2. Look for similar issues or discussions in closed issues
3. Create a new issue with the question tag if you can't find an answer

### Recognition

All contributors will be recognized in the project. We value every contribution, whether it's code, documentation, design, or feedback.

## License and Legal

### Licensing

The Tribe platform is proprietary software. By contributing to this project, you agree that your contributions will be licensed under the same license as the original software. See the [LICENSE](LICENSE) file for details.

### Contributor License Agreement

By submitting a pull request, you confirm that you have the right to submit the code and that you grant the project maintainers the right to include your code in the project under the project's license.

### Third-Party Code

If your contribution includes or is based on third-party code:

1. Ensure the third-party code is compatible with our license
2. Include appropriate attribution and license information
3. Document the usage of third-party code in your pull request

## Development Resources

### Documentation

- [README.md](README.md): Main project documentation
- [Backend Documentation](backend/README.md): Details about backend services
- [Frontend Documentation](src/web/README.md): Details about the React Native application
- API Documentation: Available in the backend/docs/api directory
- Architecture Documentation: Available in the backend/docs/architecture directory

### Useful Commands

```bash
# Start all services with Docker Compose
docker-compose up -d

# Start backend services in development mode
cd backend
npm run start:dev

# Start frontend in development mode
cd src/web
npm start

# Run database migrations
cd backend
npm run db:migrate

# Generate new migration
cd backend
npm run db:migration:generate -- --name=migration-name

# Seed database with test data
cd backend
npm run db:seed
```

### Technology Stack

- **Frontend**: React Native, TypeScript, Redux Toolkit
- **Backend**: Node.js, Express/Nest.js, TypeScript, PostgreSQL, Redis
- **AI Services**: Python, OpenRouter API, TensorFlow.js, scikit-learn
- **DevOps**: Docker, Kubernetes, GitHub Actions

For a complete list of technologies and versions, refer to the [README.md](README.md) file.

## Acknowledgements

We would like to thank all contributors who help make the Tribe platform better. Your time, expertise, and passion are greatly appreciated.

---

Thank you for contributing to Tribe! Your efforts help create meaningful connections and build community.