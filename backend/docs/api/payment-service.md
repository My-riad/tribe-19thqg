# Payment Service API Documentation

The Payment Service provides a comprehensive set of APIs for managing payment methods, processing transactions, and handling split payments between tribe members for shared expenses like event costs. This service integrates with payment providers like Stripe and Venmo to facilitate secure payment processing.

## Overview

- **Base URL**: `/api/payments`
- **Authentication**: All endpoints require authentication via JWT token in the Authorization header, except for webhook endpoints which use provider-specific authentication.
- **Error Handling**: The API returns standard HTTP status codes with JSON error responses that include an error code, message, and optional details.

## Payment Methods

Endpoints for managing user payment methods such as credit cards, debit cards, and digital wallets.

### Create a Payment Method

**POST /methods**

Creates a new payment method for a user.

**Request:**
```json
{
  "userId": "string (required) - User ID",
  "provider": "string (required) - Payment provider (STRIPE, VENMO, MANUAL)",
  "type": "string (required) - Payment method type (CREDIT_CARD, DEBIT_CARD, BANK_ACCOUNT, VENMO_BALANCE, CASH)",
  "token": "string (required) - Provider-specific token for the payment method",
  "isDefault": "boolean (optional) - Whether this is the default payment method"
}
```

**Response:** `201 Created`
```json
{
  "id": "string - Payment method ID",
  "type": "string - Payment method type",
  "provider": "string - Payment provider",
  "last4": "string - Last 4 digits of card or account identifier",
  "expiryMonth": "number - Expiry month (for cards)",
  "expiryYear": "number - Expiry year (for cards)",
  "isDefault": "boolean - Whether this is the default payment method",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `400 Bad Request` - Invalid payment method data
- `401 Unauthorized` - Unauthorized
- `500 Internal Server Error` - Payment provider error

### Get Payment Method

**GET /methods/{id}**

Retrieves a specific payment method by ID.

**Parameters:**
- `id` (path, required) - Payment method ID

**Response:** `200 OK`
```json
{
  "id": "string - Payment method ID",
  "type": "string - Payment method type",
  "provider": "string - Payment provider",
  "last4": "string - Last 4 digits of card or account identifier",
  "expiryMonth": "number - Expiry month (for cards)",
  "expiryYear": "number - Expiry year (for cards)",
  "isDefault": "boolean - Whether this is the default payment method",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Payment method not found
- `401 Unauthorized` - Unauthorized

### List Payment Methods

**GET /methods**

Retrieves all payment methods for a user.

**Parameters:**
- `userId` (query, required) - User ID
- `provider` (query, optional) - Filter by payment provider
- `type` (query, optional) - Filter by payment method type

**Response:** `200 OK`
```json
[
  {
    "id": "string - Payment method ID",
    "type": "string - Payment method type",
    "provider": "string - Payment provider",
    "last4": "string - Last 4 digits of card or account identifier",
    "expiryMonth": "number - Expiry month (for cards)",
    "expiryYear": "number - Expiry year (for cards)",
    "isDefault": "boolean - Whether this is the default payment method",
    "createdAt": "string - ISO date string"
  }
]
```

**Errors:**
- `400 Bad Request` - Missing required parameters
- `401 Unauthorized` - Unauthorized

### Update Payment Method

**PUT /methods/{id}**

Updates a payment method.

**Parameters:**
- `id` (path, required) - Payment method ID

**Request:**
```json
{
  "isDefault": "boolean (optional) - Set as default payment method",
  "metadata": "object (optional) - Additional metadata"
}
```

**Response:** `200 OK`
```json
{
  "id": "string - Payment method ID",
  "type": "string - Payment method type",
  "provider": "string - Payment provider",
  "last4": "string - Last 4 digits of card or account identifier",
  "expiryMonth": "number - Expiry month (for cards)",
  "expiryYear": "number - Expiry year (for cards)",
  "isDefault": "boolean - Whether this is the default payment method",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Payment method not found
- `400 Bad Request` - Invalid update data
- `401 Unauthorized` - Unauthorized

### Delete Payment Method

**DELETE /methods/{id}**

Deletes a payment method.

**Parameters:**
- `id` (path, required) - Payment method ID

**Response:** `200 OK`
```json
{
  "success": "boolean - Always true",
  "message": "string - Success message"
}
```

**Errors:**
- `404 Not Found` - Payment method not found
- `401 Unauthorized` - Unauthorized
- `500 Internal Server Error` - Payment provider error

### Set Default Payment Method

**POST /methods/{id}/default**

Sets a payment method as the default for a user.

**Parameters:**
- `id` (path, required) - Payment method ID

**Request:**
```json
{
  "userId": "string (required) - User ID"
}
```

**Response:** `200 OK`
```json
{
  "id": "string - Payment method ID",
  "type": "string - Payment method type",
  "provider": "string - Payment provider",
  "last4": "string - Last 4 digits of card or account identifier",
  "expiryMonth": "number - Expiry month (for cards)",
  "expiryYear": "number - Expiry year (for cards)",
  "isDefault": "boolean - Always true",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Payment method not found
- `401 Unauthorized` - Unauthorized

### Get Default Payment Method

**GET /methods/default**

Gets the default payment method for a user.

**Parameters:**
- `userId` (query, required) - User ID

**Response:** `200 OK`
```json
{
  "id": "string - Payment method ID",
  "type": "string - Payment method type",
  "provider": "string - Payment provider",
  "last4": "string - Last 4 digits of card or account identifier",
  "expiryMonth": "number - Expiry month (for cards)",
  "expiryYear": "number - Expiry year (for cards)",
  "isDefault": "boolean - Always true",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - No default payment method found
- `401 Unauthorized` - Unauthorized

### Validate Payment Method

**POST /methods/{id}/validate**

Validates a payment method with the provider.

**Parameters:**
- `id` (path, required) - Payment method ID

**Response:** `200 OK`
```json
{
  "valid": "boolean - Whether the payment method is valid",
  "details": "object - Provider-specific validation details"
}
```

**Errors:**
- `404 Not Found` - Payment method not found
- `401 Unauthorized` - Unauthorized
- `500 Internal Server Error` - Payment provider error

## Split Payments

Endpoints for managing payment splits between tribe members for shared expenses.

### Create Split Payment

**POST /splits**

Creates a new payment split.

**Request:**
```json
{
  "eventId": "string (required) - Event ID",
  "createdBy": "string (required) - User ID of the creator",
  "description": "string (required) - Description of the expense",
  "totalAmount": "number (required) - Total amount to be split",
  "currency": "string (optional) - Currency code (default: USD)",
  "splitType": "string (required) - Split type (EQUAL, PERCENTAGE, CUSTOM)",
  "dueDate": "string (required) - Due date for payments (ISO date string)",
  "participants": "array (required) - Array of participants",
  "participants[].userId": "string (required) - User ID",
  "participants[].amount": "number (required for CUSTOM) - Custom amount",
  "participants[].percentage": "number (required for PERCENTAGE) - Percentage share",
  "metadata": "object (optional) - Additional metadata"
}
```

**Response:** `201 Created`
```json
{
  "id": "string - Split ID",
  "eventId": "string - Event ID",
  "description": "string - Description",
  "totalAmount": "number - Total amount",
  "currency": "string - Currency code",
  "splitType": "string - Split type",
  "status": "string - Split status (PENDING)",
  "dueDate": "string - Due date (ISO date string)",
  "shares": [
    {
      "userId": "string - User ID",
      "userName": "string - User name",
      "amount": "number - Amount to pay",
      "status": "string - Payment status (PENDING)"
    }
  ],
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `400 Bad Request` - Invalid split data
- `401 Unauthorized` - Unauthorized

### Get Split Payment

**GET /splits/{id}**

Gets a specific payment split by ID.

**Parameters:**
- `id` (path, required) - Split ID

**Response:** `200 OK`
```json
{
  "id": "string - Split ID",
  "eventId": "string - Event ID",
  "description": "string - Description",
  "totalAmount": "number - Total amount",
  "currency": "string - Currency code",
  "splitType": "string - Split type",
  "status": "string - Split status",
  "dueDate": "string - Due date (ISO date string)",
  "shares": [
    {
      "userId": "string - User ID",
      "userName": "string - User name",
      "amount": "number - Amount to pay",
      "status": "string - Payment status"
    }
  ],
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Split not found
- `401 Unauthorized` - Unauthorized

### List Split Payments

**GET /splits**

Gets payment splits by event or user.

**Parameters:**
- `eventId` (query, optional) - Event ID
- `userId` (query, optional) - User ID
- `status` (query, optional) - Filter by status

**Response:** `200 OK`
```json
[
  {
    "id": "string - Split ID",
    "eventId": "string - Event ID",
    "description": "string - Description",
    "totalAmount": "number - Total amount",
    "currency": "string - Currency code",
    "splitType": "string - Split type",
    "status": "string - Split status",
    "dueDate": "string - Due date (ISO date string)",
    "shares": [
      {
        "userId": "string - User ID",
        "userName": "string - User name",
        "amount": "number - Amount to pay",
        "status": "string - Payment status"
      }
    ],
    "createdAt": "string - ISO date string"
  }
]
```

**Errors:**
- `400 Bad Request` - Missing required parameters
- `401 Unauthorized` - Unauthorized

### Update Split Status

**PATCH /splits/{id}/status**

Updates the status of a payment split.

**Parameters:**
- `id` (path, required) - Split ID

**Request:**
```json
{
  "status": "string (required) - New status (PENDING, PARTIAL, COMPLETED, CANCELLED)"
}
```

**Response:** `200 OK`
```json
{
  "id": "string - Split ID",
  "status": "string - Updated status",
  "updatedAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Split not found
- `400 Bad Request` - Invalid status
- `401 Unauthorized` - Unauthorized

### Process Split Payment

**POST /splits/{id}/pay**

Processes a payment for a user's share in a split.

**Parameters:**
- `id` (path, required) - Split ID

**Request:**
```json
{
  "userId": "string (required) - User ID",
  "paymentMethodId": "string (required) - Payment method ID"
}
```

**Response:** `200 OK`
```json
{
  "success": "boolean - Payment success status",
  "transactionId": "string - Transaction ID",
  "status": "string - Transaction status",
  "paymentDetails": "object - Provider-specific payment details"
}
```

**Errors:**
- `404 Not Found` - Split not found
- `400 Bad Request` - Invalid payment data
- `401 Unauthorized` - Unauthorized
- `500 Internal Server Error` - Payment processing error

### Cancel Split Payment

**POST /splits/{id}/cancel**

Cancels a payment split.

**Parameters:**
- `id` (path, required) - Split ID

**Response:** `200 OK`
```json
{
  "success": "boolean - Always true",
  "message": "string - Success message"
}
```

**Errors:**
- `404 Not Found` - Split not found
- `400 Bad Request` - Split cannot be cancelled
- `401 Unauthorized` - Unauthorized

### Get Split Statistics

**GET /splits/statistics/{type}/{id}**

Gets statistics about payment splits for an event or user.

**Parameters:**
- `type` (path, required) - Type of entity (event or user)
- `id` (path, required) - Entity ID (event ID or user ID)

**Response:** `200 OK`
```json
{
  "totalSplits": "number - Total number of splits",
  "totalAmount": "number - Total amount across all splits",
  "paidAmount": "number - Total amount paid",
  "pendingAmount": "number - Total amount pending",
  "completedSplits": "number - Number of completed splits",
  "pendingSplits": "number - Number of pending splits",
  "cancelledSplits": "number - Number of cancelled splits",
  "currency": "string - Currency code"
}
```

**Errors:**
- `400 Bad Request` - Invalid type
- `401 Unauthorized` - Unauthorized

### Send Payment Reminders

**POST /splits/{id}/remind**

Sends reminders for pending payments in a split.

**Parameters:**
- `id` (path, required) - Split ID

**Response:** `200 OK`
```json
{
  "success": "boolean - Always true",
  "remindersSent": "number - Number of reminders sent"
}
```

**Errors:**
- `404 Not Found` - Split not found
- `401 Unauthorized` - Unauthorized

### Get Split Summary

**GET /splits/{id}/summary**

Gets a detailed summary of a payment split with user details.

**Parameters:**
- `id` (path, required) - Split ID

**Response:** `200 OK`
```json
{
  "id": "string - Split ID",
  "eventId": "string - Event ID",
  "eventName": "string - Event name",
  "description": "string - Description",
  "totalAmount": "number - Total amount",
  "paidAmount": "number - Amount paid",
  "pendingAmount": "number - Amount pending",
  "currency": "string - Currency code",
  "splitType": "string - Split type",
  "status": "string - Split status",
  "dueDate": "string - Due date (ISO date string)",
  "createdBy": "object - Creator details",
  "completionPercentage": "number - Percentage complete",
  "shares": [
    {
      "userId": "string - User ID",
      "userName": "string - User name",
      "userAvatar": "string - User avatar URL",
      "amount": "number - Amount to pay",
      "percentage": "number - Percentage of total",
      "status": "string - Payment status",
      "paymentDate": "string - Payment date (if paid)"
    }
  ],
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Split not found
- `401 Unauthorized` - Unauthorized

### Get Split Transactions

**GET /splits/{id}/transactions**

Gets all transactions associated with a payment split.

**Parameters:**
- `id` (path, required) - Split ID

**Response:** `200 OK`
```json
[
  {
    "id": "string - Transaction ID",
    "userId": "string - User ID",
    "userName": "string - User name",
    "amount": "number - Transaction amount",
    "currency": "string - Currency code",
    "status": "string - Transaction status",
    "paymentMethod": "string - Payment method description",
    "createdAt": "string - ISO date string"
  }
]
```

**Errors:**
- `404 Not Found` - Split not found
- `401 Unauthorized` - Unauthorized

## Transactions

Endpoints for managing financial transactions, including payments, refunds, and transaction status updates.

### Create Transaction

**POST /transactions**

Creates a new transaction record.

**Request:**
```json
{
  "type": "string (required) - Transaction type (EVENT_PAYMENT, SPLIT_PAYMENT, REFUND)",
  "amount": "number (required) - Transaction amount",
  "currency": "string (optional) - Currency code (default: USD)",
  "description": "string (required) - Transaction description",
  "userId": "string (required) - User ID",
  "paymentMethodId": "string (required) - Payment method ID",
  "provider": "string (required) - Payment provider",
  "eventId": "string (optional) - Event ID (required for EVENT_PAYMENT)",
  "splitId": "string (optional) - Split ID (required for SPLIT_PAYMENT)",
  "metadata": "object (optional) - Additional metadata"
}
```

**Response:** `201 Created`
```json
{
  "id": "string - Transaction ID",
  "type": "string - Transaction type",
  "status": "string - Transaction status (INITIATED)",
  "amount": "number - Transaction amount",
  "currency": "string - Currency code",
  "description": "string - Transaction description",
  "userId": "string - User ID",
  "paymentMethod": "string - Payment method description",
  "provider": "string - Payment provider",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `400 Bad Request` - Invalid transaction data
- `401 Unauthorized` - Unauthorized

### Get Transaction

**GET /transactions/{id}**

Gets a specific transaction by ID.

**Parameters:**
- `id` (path, required) - Transaction ID

**Response:** `200 OK`
```json
{
  "id": "string - Transaction ID",
  "type": "string - Transaction type",
  "status": "string - Transaction status",
  "amount": "number - Transaction amount",
  "currency": "string - Currency code",
  "description": "string - Transaction description",
  "userId": "string - User ID",
  "paymentMethod": "string - Payment method description",
  "provider": "string - Payment provider",
  "providerTransactionId": "string - Provider-specific transaction ID",
  "eventId": "string - Event ID (if applicable)",
  "splitId": "string - Split ID (if applicable)",
  "refundedTransactionId": "string - Original transaction ID (for refunds)",
  "createdAt": "string - ISO date string",
  "updatedAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Transaction not found
- `401 Unauthorized` - Unauthorized

### List Transactions

**GET /transactions**

Gets transactions based on query parameters.

**Parameters:**
- `userId` (query, optional) - User ID
- `eventId` (query, optional) - Event ID
- `splitId` (query, optional) - Split ID
- `type` (query, optional) - Transaction type
- `status` (query, optional) - Transaction status
- `startDate` (query, optional) - Start date for filtering (ISO date string)
- `endDate` (query, optional) - End date for filtering (ISO date string)

**Response:** `200 OK`
```json
[
  {
    "id": "string - Transaction ID",
    "type": "string - Transaction type",
    "status": "string - Transaction status",
    "amount": "number - Transaction amount",
    "currency": "string - Currency code",
    "description": "string - Transaction description",
    "userId": "string - User ID",
    "paymentMethod": "string - Payment method description",
    "provider": "string - Payment provider",
    "createdAt": "string - ISO date string"
  }
]
```

**Errors:**
- `400 Bad Request` - Missing required parameters
- `401 Unauthorized` - Unauthorized

### Process Transaction

**POST /transactions/{id}/process**

Processes a payment for a transaction.

**Parameters:**
- `id` (path, required) - Transaction ID

**Request:**
```json
{
  "paymentMethodId": "string (required) - Payment method ID"
}
```

**Response:** `200 OK`
```json
{
  "id": "string - Transaction ID",
  "status": "string - Updated status (PROCESSING)",
  "paymentDetails": "object - Provider-specific payment details",
  "nextAction": "object - Required next action (if any)"
}
```

**Errors:**
- `404 Not Found` - Transaction not found
- `400 Bad Request` - Invalid payment data or transaction already processed
- `401 Unauthorized` - Unauthorized
- `500 Internal Server Error` - Payment processing error

### Update Transaction Status

**PATCH /transactions/{id}/status**

Updates the status of a transaction.

**Parameters:**
- `id` (path, required) - Transaction ID

**Request:**
```json
{
  "status": "string (required) - New status (PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED)"
}
```

**Response:** `200 OK`
```json
{
  "id": "string - Transaction ID",
  "status": "string - Updated status",
  "updatedAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Transaction not found
- `400 Bad Request` - Invalid status transition
- `401 Unauthorized` - Unauthorized

### Process Refund

**POST /transactions/{id}/refund**

Processes a refund for a transaction.

**Parameters:**
- `id` (path, required) - Transaction ID

**Request:**
```json
{
  "reason": "string (required) - Refund reason"
}
```

**Response:** `200 OK`
```json
{
  "id": "string - Refund transaction ID",
  "originalTransactionId": "string - Original transaction ID",
  "status": "string - Refund status",
  "amount": "number - Refund amount",
  "currency": "string - Currency code",
  "description": "string - Refund description",
  "reason": "string - Refund reason",
  "createdAt": "string - ISO date string"
}
```

**Errors:**
- `404 Not Found` - Transaction not found
- `400 Bad Request` - Transaction cannot be refunded
- `401 Unauthorized` - Unauthorized
- `500 Internal Server Error` - Refund processing error

### Get Transaction Summary

**GET /transactions/summary/{type}/{id}**

Gets a summary of transactions for a user, event, or split.

**Parameters:**
- `type` (path, required) - Type of entity (user, event, or split)
- `id` (path, required) - Entity ID (user ID, event ID, or split ID)

**Response:** `200 OK`
```json
{
  "totalTransactions": "number - Total number of transactions",
  "totalAmount": "number - Total amount across all transactions",
  "completedAmount": "number - Total amount of completed transactions",
  "pendingAmount": "number - Total amount of pending transactions",
  "refundedAmount": "number - Total amount of refunded transactions",
  "transactionsByStatus": "object - Count of transactions by status",
  "transactionsByType": "object - Count of transactions by type",
  "currency": "string - Currency code"
}
```

**Errors:**
- `400 Bad Request` - Invalid type
- `401 Unauthorized` - Unauthorized

## Webhooks

Endpoints for receiving webhook notifications from payment providers.

### Handle Provider Webhook

**POST /webhooks/{provider}**

Handles webhook events from payment providers.

**Parameters:**
- `provider` (path, required) - Payment provider (stripe, venmo)

**Headers:**
- `Stripe-Signature` (required for Stripe events) - Webhook signature for Stripe events
- `Venmo-Signature` (required for Venmo events) - Webhook signature for Venmo events

**Request:**
Provider-specific webhook payload

**Response:** `200 OK`
```json
{
  "received": "boolean - Always true"
}
```

**Errors:**
- `400 Bad Request` - Invalid webhook payload
- `401 Unauthorized` - Invalid signature
- `500 Internal Server Error` - Webhook processing error

## Data Models

### Payment Method

Represents a payment method that can be used for transactions.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier for the payment method |
| userId | string | ID of the user who owns this payment method |
| provider | enum | Payment provider for this method (STRIPE, VENMO, MANUAL) |
| type | enum | Type of payment method (CREDIT_CARD, DEBIT_CARD, BANK_ACCOUNT, VENMO_BALANCE, CASH) |
| token | string | Provider-specific token for the payment method |
| last4 | string | Last 4 digits of card number or account identifier |
| expiryMonth | number | Expiry month (for cards) |
| expiryYear | number | Expiry year (for cards) |
| isDefault | boolean | Whether this is the default payment method for the user |
| createdAt | date | When the payment method was created |
| updatedAt | date | When the payment method was last updated |

### Payment Split

Represents a split payment between tribe members for a shared expense.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier for the payment split |
| eventId | string | ID of the event associated with this split |
| createdBy | string | ID of the user who created this split |
| description | string | Description of the expense being split |
| totalAmount | number | Total amount to be split |
| currency | string | Currency code (e.g., USD) |
| splitType | enum | Method used to split the payment (EQUAL, PERCENTAGE, CUSTOM) |
| status | enum | Current status of the split payment (PENDING, PARTIAL, COMPLETED, CANCELLED) |
| dueDate | date | Due date for payments |
| shares | array | Individual payment shares for each participant |
| metadata | object | Additional metadata for the split |
| createdAt | date | When the split was created |
| updatedAt | date | When the split was last updated |

### Payment Share

Represents an individual's share in a split payment.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier for the payment share |
| splitId | string | ID of the payment split this share belongs to |
| userId | string | ID of the user responsible for this share |
| amount | number | Amount this user needs to pay |
| percentage | number | Percentage of the total amount (for percentage splits) |
| status | enum | Current status of this payment share (PENDING, COMPLETED, FAILED) |

### Transaction

Represents a financial transaction in the system.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier for the transaction |
| type | enum | Type of transaction (EVENT_PAYMENT, SPLIT_PAYMENT, REFUND) |
| status | enum | Current status of the transaction (INITIATED, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED) |
| amount | number | Transaction amount |
| currency | string | Currency code (e.g., USD) |
| description | string | Description of the transaction |
| userId | string | ID of the user who made the transaction |
| paymentMethodId | string | ID of the payment method used |
| provider | enum | Payment provider used for this transaction (STRIPE, VENMO, MANUAL) |
| providerTransactionId | string | Provider-specific transaction ID |
| eventId | string | ID of the associated event (for EVENT_PAYMENT) |
| splitId | string | ID of the associated split (for SPLIT_PAYMENT) |
| refundedTransactionId | string | ID of the original transaction (for REFUND) |
| metadata | object | Additional metadata for the transaction |
| createdAt | date | When the transaction was created |
| updatedAt | date | When the transaction was last updated |

## Provider Integration

### Stripe

Integration with Stripe for credit/debit card processing.

**Features:**
- Credit and debit card processing
- Payment intents for secure payments
- Refund processing
- Webhook notifications for payment status updates

**Setup Requirements:**
- Stripe API key
- Stripe webhook secret
- Webhook endpoint configuration in Stripe dashboard

**Webhook Events:**
- payment_intent.succeeded
- payment_intent.payment_failed
- payment_intent.canceled
- charge.refunded

### Venmo

Integration with Venmo for peer-to-peer payments.

**Features:**
- Venmo account linking
- Payment requests
- Refund processing
- Webhook notifications for payment status updates

**Setup Requirements:**
- Venmo API key and secret
- Venmo webhook secret
- Webhook endpoint configuration in Venmo dashboard

**Webhook Events:**
- payment.created
- payment.updated
- payment.completed
- payment.failed
- payment.refunded

## Security Considerations

### Payment Data Security

The Payment Service implements several security measures to protect sensitive payment information:

- Payment card data is never stored directly in the Tribe database. Instead, tokenization is used where payment providers store the actual card data and provide tokens for future use.
- All API endpoints are secured with JWT authentication except for webhook endpoints which use provider-specific signature verification.
- PCI DSS compliance is maintained by leveraging Stripe and Venmo for actual payment processing, keeping sensitive payment data out of Tribe's systems.
- All communication with payment providers is encrypted using TLS 1.2+.

### Webhook Security

Webhook endpoints implement specific security measures:

- Signature verification to ensure webhooks are coming from legitimate payment providers
- Idempotency handling to prevent duplicate processing of webhook events
- IP address filtering to only accept webhooks from known provider IP ranges

## Rate Limits

To prevent abuse, the Payment Service implements rate limiting on its endpoints:

| Endpoint | Limit |
|----------|-------|
| All payment method endpoints | 20 requests per minute per user |
| All split payment endpoints | 30 requests per minute per user |
| Transaction processing endpoints | 10 requests per minute per user |
| Webhook endpoints | 100 requests per minute per provider |

## Example Flows

### Creating and Processing a Split Payment

1. **Create a payment split for an event**

   **POST /api/payments/splits**
   ```json
   {
     "eventId": "evt_123456",
     "createdBy": "user_123",
     "description": "Dinner at Italian Restaurant",
     "totalAmount": 120.0,
     "currency": "USD",
     "splitType": "EQUAL",
     "dueDate": "2023-08-15T23:59:59Z",
     "participants": [
       {"userId": "user_123"},
       {"userId": "user_456"},
       {"userId": "user_789"}
     ]
   }
   ```

   **Response:**
   ```json
   {
     "id": "split_123456",
     "eventId": "evt_123456",
     "description": "Dinner at Italian Restaurant",
     "totalAmount": 120.0,
     "currency": "USD",
     "splitType": "EQUAL",
     "status": "PENDING",
     "dueDate": "2023-08-15T23:59:59Z",
     "shares": [
       {"userId": "user_123", "userName": "John Doe", "amount": 40.0, "status": "PENDING"},
       {"userId": "user_456", "userName": "Jane Smith", "amount": 40.0, "status": "PENDING"},
       {"userId": "user_789", "userName": "Bob Johnson", "amount": 40.0, "status": "PENDING"}
     ],
     "createdAt": "2023-07-30T14:25:36Z"
   }
   ```

2. **User pays their share**

   **POST /api/payments/splits/split_123456/pay**
   ```json
   {
     "userId": "user_456",
     "paymentMethodId": "pm_123456"
   }
   ```

   **Response:**
   ```json
   {
     "success": true,
     "transactionId": "txn_123456",
     "status": "COMPLETED",
     "paymentDetails": {
       "provider": "STRIPE",
       "amount": 40.0,
       "currency": "USD",
       "paymentMethod": "Visa ending in 4242"
     }
   }
   ```

3. **Check split payment status**

   **GET /api/payments/splits/split_123456**

   **Response:**
   ```json
   {
     "id": "split_123456",
     "eventId": "evt_123456",
     "description": "Dinner at Italian Restaurant",
     "totalAmount": 120.0,
     "currency": "USD",
     "splitType": "EQUAL",
     "status": "PARTIAL",
     "dueDate": "2023-08-15T23:59:59Z",
     "shares": [
       {"userId": "user_123", "userName": "John Doe", "amount": 40.0, "status": "PENDING"},
       {"userId": "user_456", "userName": "Jane Smith", "amount": 40.0, "status": "COMPLETED"},
       {"userId": "user_789", "userName": "Bob Johnson", "amount": 40.0, "status": "PENDING"}
     ],
     "createdAt": "2023-07-30T14:25:36Z"
   }
   ```

### Adding a Payment Method and Making a Payment

1. **Add a new credit card payment method**

   **POST /api/payments/methods**
   ```json
   {
     "userId": "user_123",
     "provider": "STRIPE",
     "type": "CREDIT_CARD",
     "token": "tok_visa",
     "isDefault": true
   }
   ```

   **Response:**
   ```json
   {
     "id": "pm_123456",
     "type": "CREDIT_CARD",
     "provider": "STRIPE",
     "last4": "4242",
     "expiryMonth": 12,
     "expiryYear": 2025,
     "isDefault": true,
     "createdAt": "2023-07-30T14:25:36Z"
   }
   ```

2. **Create a transaction for an event payment**

   **POST /api/payments/transactions**
   ```json
   {
     "type": "EVENT_PAYMENT",
     "amount": 25.0,
     "currency": "USD",
     "description": "Ticket for Movie Night",
     "userId": "user_123",
     "paymentMethodId": "pm_123456",
     "provider": "STRIPE",
     "eventId": "evt_123456"
   }
   ```

   **Response:**
   ```json
   {
     "id": "txn_123456",
     "type": "EVENT_PAYMENT",
     "status": "INITIATED",
     "amount": 25.0,
     "currency": "USD",
     "description": "Ticket for Movie Night",
     "userId": "user_123",
     "paymentMethod": "Visa ending in 4242",
     "provider": "STRIPE",
     "createdAt": "2023-07-30T14:30:22Z"
   }
   ```

3. **Process the payment**

   **POST /api/payments/transactions/txn_123456/process**
   ```json
   {
     "paymentMethodId": "pm_123456"
   }
   ```

   **Response:**
   ```json
   {
     "id": "txn_123456",
     "status": "PROCESSING",
     "paymentDetails": {
       "provider": "STRIPE",
       "paymentIntentId": "pi_123456",
       "clientSecret": "pi_123456_secret_abcdef"
     },
     "nextAction": null
   }
   ```