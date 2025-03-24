# Tribe AI Engine

AI-powered matchmaking, personality analysis, engagement generation, and recommendation services for the Tribe platform.

## Overview

The AI Engine is a Python-based microservice that provides the core artificial intelligence capabilities for the Tribe platform. It leverages state-of-the-art language models through the OpenRouter API to deliver intelligent matchmaking, personality analysis, engagement prompts, and personalized recommendations.

## Features

- **AI-Powered Matchmaking**: Automatically match users to compatible Tribes based on personality traits, interests, and communication styles
- **Personality Analysis**: Process assessment data to generate comprehensive personality profiles
- **Engagement Generation**: Create conversation prompts, challenges, and activity suggestions to maintain group engagement
- **Recommendation Engine**: Suggest personalized events, activities, and meetup opportunities based on group preferences

## Architecture

The AI Engine follows a layered architecture with clear separation of concerns:

### API Layer
FastAPI-based REST API that exposes endpoints for all AI capabilities

### Service Layer
High-level services that handle business logic, caching, and error handling

### Model Layer
AI models that implement the core algorithms for each capability

### Adapter Layer
Adapters for external AI services (primarily OpenRouter API)

### Utility Layer
Shared utilities for data preprocessing, prompt engineering, and text processing

## API Endpoints

The AI Engine exposes the following main endpoints:

### /matching
Perform AI-powered matching operations (user-tribe matching, tribe formation, compatibility calculation)

### /personality
Analyze personality assessment data to generate user profiles

### /engagement
Generate engagement prompts, challenges, and activity suggestions

### /recommendations
Generate personalized recommendations for events and activities

### /health
Health check endpoint to verify service status

### /models
Get information about available AI models and their capabilities

## Getting Started

Follow these steps to set up and run the AI Engine locally:

### Prerequisites
- Python 3.10+
- Docker (optional, for containerized deployment)
- OpenRouter API key

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd backend/src/ai-engine

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration
Create a `.env` file in the root directory with the following variables:

```
AI_ENGINE_ENV=development
AI_ENGINE_DEBUG=True
AI_ENGINE_LOG_LEVEL=DEBUG
OPENROUTER_API_KEY=your_api_key_here
DEFAULT_AI_MODEL=openai/gpt-4
AI_CACHE_ENABLED=True
AI_CACHE_TTL=3600
```

### Running the Service
```bash
# Run with uvicorn for development
uvicorn src.main:app --reload --port 8001

# Or use the provided script
python -m src.main
```

### Docker Deployment
```bash
# Build the Docker image
docker build -t tribe-ai-engine .

# Run the container
docker run -p 8001:8001 -e OPENROUTER_API_KEY=your_api_key_here tribe-ai-engine
```

## Development

Guidelines for developing and extending the AI Engine:

### Project Structure
```
backend/src/ai-engine/
├── src/
│   ├── __init__.py
│   ├── main.py                 # Application entry point
│   ├── config/                 # Configuration settings
│   ├── adapters/               # External service adapters
│   ├── models/                 # AI model implementations
│   ├── services/               # Business logic services
│   ├── routes/                 # API route definitions
│   ├── utils/                  # Utility functions
│   └── data/                   # Data schemas and loaders
├── tests/                      # Test suite
├── Dockerfile                  # Container definition
├── requirements.txt            # Python dependencies
└── README.md                   # This documentation
```

### Adding New Features
To add a new AI capability to the engine:

1. Define the data models in `src/data/schemas.py`
2. Implement the core algorithm in a new model class in `src/models/`
3. Create a service class in `src/services/` to handle business logic
4. Define API routes in `src/routes/`
5. Add configuration parameters in `src/config/settings.py`
6. Write tests in the `tests/` directory

### Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_matching_service.py

# Run with coverage report
pytest --cov=src tests/
```

## AI Models

The AI Engine supports multiple language models through OpenRouter API:

### Supported Models
- **openai/gpt-4**: Primary model for all capabilities (matching, personality, engagement, recommendation)
- **openai/gpt-3.5-turbo**: Alternative model for all capabilities with lower cost
- **anthropic/claude-2**: High-quality alternative for all capabilities with larger context window
- **anthropic/claude-instant-1**: Faster, more economical model for engagement and recommendation

### Model Selection
Models can be specified per request or set as the default in configuration. The system will automatically select the most appropriate model based on the capability requirements if not specified.

## Performance Considerations

Guidelines for optimizing AI Engine performance:

### Caching
The AI Engine implements an intelligent caching system to reduce redundant AI requests. Cache settings can be configured through environment variables.

### Batch Processing
For bulk operations, use the batch endpoints (e.g., `/matching/batch`) to process multiple items efficiently.

### Asynchronous Processing
The AI Engine supports asynchronous processing for non-blocking operations in high-throughput scenarios.

### Model Selection
Choose appropriate models based on the complexity of the task. Simpler models like gpt-3.5-turbo or claude-instant-1 can be used for less complex tasks to reduce latency and cost.

## Integration with Tribe Platform

The AI Engine integrates with other Tribe services through the following patterns:

### Direct API Integration
Services like the Matching Service and Engagement Service make direct HTTP requests to the AI Engine API.

### AI Orchestration Service
The AI Orchestration Service acts as a facade for other backend services, managing AI requests and handling fallbacks.

### Event-Based Integration
Some features use event-based integration for asynchronous processing, such as batch matching operations.

## Monitoring and Observability

The AI Engine provides several monitoring capabilities:

### Logging
Structured JSON logs with configurable log levels

### Metrics
Prometheus metrics for request counts, latencies, and error rates

### Health Checks
Health check endpoint at `/health` for service status monitoring

### Performance Tracking
Detailed timing information for AI operations to identify bottlenecks

## Security Considerations

Important security aspects of the AI Engine:

### API Key Management
OpenRouter API keys should be stored securely as environment variables or in a secrets management system.

### Input Validation
All API inputs are validated using Pydantic models to prevent injection attacks.

### Content Filtering
The AI Engine implements content filtering to prevent generation of inappropriate content.

### Rate Limiting
Built-in rate limiting protects against abuse and manages API quotas.

## Troubleshooting

Common issues and their solutions:

### API Connection Issues
Ensure the OpenRouter API key is valid and has sufficient credits. Check network connectivity to the OpenRouter API.

### Model Timeout Errors
Adjust the `MODEL_TIMEOUT` setting for complex operations. Consider using a faster model for time-sensitive operations.

### Memory Issues
For large batch operations, adjust the batch size or implement pagination to reduce memory usage.

### Unexpected Results
Review the prompt templates in the model implementations. Adjust temperature and other parameters to control randomness.

## Contributing

Guidelines for contributing to the AI Engine development:

### Code Style
Follow PEP 8 guidelines. Use type hints for all function signatures.

### Documentation
Document all public functions, classes, and modules with docstrings.

### Testing
Write unit tests for all new features. Maintain test coverage above 80%.

### Pull Requests
Create feature branches and submit pull requests for review. Include test cases and documentation updates.

## License

This project is licensed under the terms specified in the repository's LICENSE file.