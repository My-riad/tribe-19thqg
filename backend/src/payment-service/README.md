# Payment Service

## Introduction

The Payment Service is a microservice responsible for handling all payment-related functionality in the Tribe application. It manages payment methods, processes transactions, and facilitates split payments between tribe members for shared expenses like event costs.

## Features

- Payment method management (credit cards, debit cards, Venmo accounts)
- Secure transaction processing
- Split payment functionality with multiple distribution strategies
- Integration with Stripe and Venmo payment providers
- Webhook handling for payment status updates
- Refund processing

## Architecture

The Payment Service follows a modular architecture with clear separation of concerns between models, services, controllers, and external provider integrations. It communicates with other services through RESTful APIs and uses PostgreSQL for data persistence.

### Data Models

#### Payment Method

Represents payment methods like credit cards, debit cards, and Venmo accounts.

| Property | Description |
|----------|-------------|
| id | Unique identifier |
| userId | Owner of the payment method |
| provider | Payment provider (Stripe, Venmo) |
| type | Type of payment method (credit, debit, etc.) |
| token | Provider-specific token reference |
| last4 | Last 4 digits of card/account |
| expiryMonth | Expiration month (for cards) |
| expiryYear | Expiration year (for cards) |
| isDefault | Whether this is the user's default payment method |

#### Payment Split

Represents payment splits between tribe members for shared expenses.

| Property | Description |
|----------|-------------|
| id | Unique identifier |
| eventId | Associated event |
| createdBy | User who created the split |
| totalAmount | Total amount to be split |
| currency | Currency code |
| splitType | How to split (equal, percentage, custom) |
| status | Status of the split payment |
| shares | Array of payment shares per user |

#### Transaction

Represents financial transactions for events, split payments, and refunds.

| Property | Description |
|----------|-------------|
| id | Unique identifier |
| type | Transaction type (payment, refund) |
| status | Transaction status |
| amount | Transaction amount |
| currency | Currency code |
| userId | User who made the transaction |
| paymentMethodId | Payment method used |
| provider | Payment provider used |
| providerTransactionId | Provider's transaction reference |

### Services

#### PaymentService

Manages payment methods (creation, retrieval, updating, deletion).

**Key Methods:**
- `createPaymentMethod` - Register a new payment method
- `getPaymentMethodsByUser` - Get all payment methods for a user
- `setDefaultPaymentMethod` - Set a payment method as default
- `deletePaymentMethod` - Remove a payment method

#### SplitService

Manages payment splits between tribe members.

**Key Methods:**
- `createSplit` - Create a new payment split
- `getSplitById` - Get details of a specific split
- `updateSplitStatus` - Update the status of a split
- `calculateShares` - Calculate payment shares based on split type

#### TransactionService

Processes financial transactions and manages their lifecycle.

**Key Methods:**
- `processPayment` - Process a payment transaction
- `getTransactionById` - Get transaction details
- `processRefund` - Process a refund
- `handleWebhookEvent` - Handle provider webhook events

### Payment Providers

#### StripeProvider

Integrates with Stripe API for credit/debit card processing.

**Key Methods:**
- `createPaymentMethod` - Create a payment method in Stripe
- `processPayment` - Process a payment through Stripe
- `processRefund` - Process a refund through Stripe
- `handleWebhook` - Process Stripe webhook events

#### VenmoProvider

Integrates with Venmo API for peer-to-peer payments.

**Key Methods:**
- `createPaymentMethod` - Link a Venmo account
- `processPayment` - Process a payment through Venmo
- `processRefund` - Process a refund through Venmo
- `handleWebhook` - Process Venmo webhook events

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/payments/methods` | GET, POST | Manage payment methods |
| `/api/payments/methods/:id` | GET, PUT, DELETE | Manage specific payment method |
| `/api/payments/splits` | GET, POST | Manage payment splits |
| `/api/payments/splits/:id` | GET, PUT | Manage specific payment split |
| `/api/payments/transactions` | GET, POST | Manage transactions |
| `/api/payments/transactions/:id` | GET | Get transaction details |
| `/api/payments/transactions/:id/refund` | POST | Process refund for transaction |
| `/api/payments/webhooks/stripe` | POST | Handle Stripe webhook events |
| `/api/payments/webhooks/venmo` | POST | Handle Venmo webhook events |

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Stripe and/or Venmo developer accounts

### Environment Variables

```
PORT=3004
DATABASE_URL=postgresql://user:password@localhost:5432/tribe_payment
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VENMO_API_KEY=...
VENMO_API_SECRET=...
VENMO_WEBHOOK_SECRET=...
```

### Installation

1. Clone the repository
2. Navigate to `backend/src/payment-service`
3. Run `npm install`
4. Set up environment variables
5. Run `npm run db:migrate` to set up database schema
6. Run `npm run dev` to start the service in development mode

## Testing

### Unit Tests

Run `npm test` to execute unit tests.

### Integration Tests

Run `npm run test:integration` to execute integration tests.

### Mock Providers

For development and testing, mock payment providers are available that simulate payment processing without making actual API calls.

## Deployment

### Docker

A Dockerfile is provided for containerization. Build with:

```bash
docker build -t tribe-payment-service .
```

### Kubernetes

Kubernetes deployment configurations are available in the `infrastructure/kubernetes` directory.

## Security Considerations

- Payment data is encrypted at rest and in transit
- PCI compliance is maintained by tokenizing card data and not storing sensitive information
- API keys and secrets are stored securely and not committed to version control
- Webhook signatures are verified to prevent unauthorized callbacks

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Payment processing failures | Check payment provider logs and ensure API keys are valid |
| Webhook events not being processed | Verify webhook URL is correctly configured in Stripe/Venmo dashboards and webhook secret is correct |
| Database connection issues | Ensure DATABASE_URL is correct and database server is running |

## Contributing

Please follow the coding standards and test guidelines in the main project README. All payment-related code should be thoroughly tested and security-reviewed before submission.