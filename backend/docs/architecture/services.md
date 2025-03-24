# 1. Introduction

This document provides detailed information about the microservices architecture of the Tribe platform. It describes each service's purpose, responsibilities, API endpoints, internal structure, and interactions with other services.

The Tribe platform follows a microservices architecture to enable independent scaling of components, facilitate rapid feature development, and support the diverse technical requirements of the system. Each service is responsible for a specific domain and owns the data and logic related to that domain.

## 1.1 Purpose and Scope
The purpose of this document is to provide a comprehensive reference for developers working on the Tribe platform. It covers all microservices that make up the platform, their APIs, and how they interact with each other.

This document is intended to be used in conjunction with the [Data Model Documentation](data-model.md) and [AI Integration Documentation](ai-integration.md). It also complements the Architecture Overview document which provides a high-level view of the entire system.

## 1.2 Service Design Principles
The Tribe platform's microservices follow these design principles:

- **Single Responsibility**: Each service is responsible for a specific domain or business capability
- **Domain Ownership**: Services own their data and the logic to manipulate that data
- **API-First**: All services expose well-defined APIs for interaction
- **Independent Deployment**: Services can be deployed independently of each other
- **Resilience**: Services are designed to be resilient to failures in other services
- **Observability**: Services expose metrics, logs, and traces for monitoring and debugging

# 2. Service Architecture Overview
The Tribe platform consists of the following microservices, organized by functional domain:

## 2.1 Core Services
Core services implement the primary business capabilities of the Tribe platform:

| Service | Primary Responsibility | Key Dependencies |
|---------|------------------------|------------------|
| API Gateway | Entry point for client requests | Auth Service, all core services |
| Auth Service | User authentication and identity management | Database |
| Profile Service | User profile and personality data management | Database, AI Orchestration Service |
| Tribe Service | Group formation and management | Database, Notification Service |
| Event Service | Event discovery and management | Database, External Event APIs, Weather API |
| Planning Service | Event planning and coordination | Database, Event Service, Notification Service |
| Payment Service | Payment processing and expense tracking | Database, External Payment APIs |
| Notification Service | Notification delivery and management | Database, Firebase Cloud Messaging |

## 2.2 AI Services
AI services provide the intelligence that powers the Tribe platform's core features:

| Service | Primary Responsibility | Key Dependencies |
|---------|------------------------|------------------|
| Matching Service | AI-powered matchmaking | Database, AI Orchestration Service |
| Engagement Service | AI-driven engagement tools | Database, AI Orchestration Service |
| AI Orchestration Service | Coordination of AI capabilities | OpenRouter API, AI Engine |
| AI Engine | Specialized AI algorithms | OpenRouter API |

## 2.3 Service Communication Patterns
Services in the Tribe platform communicate using the following patterns:

- **Synchronous Communication**: REST APIs for direct request-response interactions
- **Asynchronous Communication**: Message queues for operations that don't require immediate response
- **Event-Driven Communication**: Publish-subscribe for event notifications

The choice of communication pattern depends on the nature of the interaction and the requirements for responsiveness, reliability, and coupling.

## 2.4 Common Service Structure
Each microservice follows a common structure to ensure consistency and maintainability:

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