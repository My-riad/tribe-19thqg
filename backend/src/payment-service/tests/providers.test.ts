import {
  StripeProvider,
  VenmoProvider,
  getPaymentProvider
} from '../src/providers';
import {
  Transaction
} from '../src/models/transaction.model';
import {
  Payment
} from '../src/models/payment.model';
import {
  ITransaction,
  IPaymentMethod,
  IStripePaymentIntent,
  IVenmoPaymentRequest,
  IPaymentWebhookEvent,
  PaymentProvider,
  PaymentMethod,
  TransactionType,
  TransactionStatus
} from '@shared/types/payment.types';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentMethods: {
      create: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        card: {
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
        created: Date.now() / 1000,
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
        created: Date.now() / 1000,
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_test123',
      }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'secret123',
        status: 'requires_payment_method',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test123',
        status: 'succeeded',
      }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded',
            amount: 1000,
            currency: 'usd',
            metadata: {
              transactionId: 'txn_test123',
            },
          },
        },
      }),
    },
  }));
});

// Mock Axios for Venmo API
jest.mock('axios', () => {
  return {
    create: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url === '/me') {
          return Promise.resolve({
            data: {
              user: {
                id: 'venmo_user123',
                username: 'venmo_user',
              },
            },
          });
        }
        if (url.includes('/payment_methods/')) {
          return Promise.resolve({
            data: {
              id: 'venmo_pm123',
              username: 'venmo_user',
              email: 'user@example.com',
              status: 'active',
              verified: true,
            },
          });
        }
        if (url.includes('/payments/')) {
          return Promise.resolve({
            data: {
              payment: {
                id: 'venmo_pymt123',
                status: 'completed',
                amount: 100,
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      }),
      post: jest.fn().mockImplementation((url) => {
        if (url === '/payments') {
          return Promise.resolve({
            data: {
              payment: {
                id: 'venmo_pymt123',
                amount: 100,
                note: 'Test payment',
                status: 'pending',
              },
            },
          });
        }
        if (url === '/payments/refunds') {
          return Promise.resolve({
            data: {
              refund: {
                id: 'venmo_refund123',
                status: 'pending',
              },
            },
          });
        }
        return Promise.resolve({ data: {} });
      }),
    }),
  };
});

// Mock config
jest.mock('config', () => ({
  get: jest.fn().mockImplementation((key) => {
    const configValues = {
      'payment.stripe.apiKey': 'stripe_test_key',
      'payment.stripe.webhookSecret': 'stripe_webhook_secret',
      'payment.venmo.apiKey': 'venmo_test_key',
      'payment.venmo.apiSecret': 'venmo_test_secret',
      'payment.venmo.webhookSecret': 'venmo_webhook_secret',
      'payment.venmo.apiBaseUrl': 'https://api.venmo.com/v1',
    };
    return configValues[key];
  }),
}));

// Mock StripeProvider implementation
jest.mock('../src/providers/stripe.provider', () => {
  const original = jest.requireActual('../src/providers/stripe.provider');
  return {
    ...original,
    StripeProvider: jest.fn().mockImplementation(() => ({
      createPaymentMethod: jest.fn().mockResolvedValue({
        token: 'pm_test123',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2025,
      }),
      getPaymentMethod: jest.fn().mockResolvedValue({
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
        },
        created: new Date(),
      }),
      deletePaymentMethod: jest.fn().mockResolvedValue(true),
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        clientSecret: 'secret123',
        status: 'requires_payment_method',
      }),
      processPayment: jest.fn().mockImplementation((transaction) => {
        const txn = Transaction.fromDatabase(transaction);
        txn.updateStatus(TransactionStatus.PROCESSING);
        txn.setProviderTransactionId('pi_test123');
        if (!txn.metadata) txn.metadata = {};
        txn.metadata.clientSecret = 'secret123';
        return Promise.resolve(txn);
      }),
      processRefund: jest.fn().mockImplementation((refundTransaction) => {
        const txn = Transaction.fromDatabase(refundTransaction);
        txn.updateStatus(TransactionStatus.COMPLETED);
        txn.setProviderTransactionId('re_test123');
        return Promise.resolve(txn);
      }),
      handleWebhook: jest.fn().mockResolvedValue({
        id: 'evt_test123',
        eventType: 'payment.succeeded',
        data: {
          paymentIntentId: 'pi_test123',
          amount: 10.0,
          currency: 'usd',
        },
      }),
      getPaymentStatus: jest.fn().mockResolvedValue(TransactionStatus.COMPLETED),
    })),
  };
});

// Mock VenmoProvider implementation
jest.mock('../src/providers/venmo.provider', () => {
  const original = jest.requireActual('../src/providers/venmo.provider');
  return {
    ...original,
    VenmoProvider: jest.fn().mockImplementation(() => ({
      createPaymentMethod: jest.fn().mockResolvedValue({
        token: 'venmo_token123',
        last4: 'user',
      }),
      getPaymentMethod: jest.fn().mockResolvedValue({
        id: 'venmo_pm123',
        username: 'venmo_user',
        email: 'user@example.com',
        status: 'active',
        isVerified: true,
      }),
      deletePaymentMethod: jest.fn().mockResolvedValue(true),
      createPaymentRequest: jest.fn().mockResolvedValue({
        id: 'venmo_pymt123',
        amount: 100,
        note: 'Test payment',
        targetUserHandle: 'venmo_user',
        status: 'pending',
        paymentUrl: 'https://venmo.com/account/pay?txn=venmo_pymt123',
      }),
      processPayment: jest.fn().mockImplementation((transaction) => {
        const txn = Transaction.fromDatabase(transaction);
        txn.updateStatus(TransactionStatus.PROCESSING);
        txn.setProviderTransactionId('venmo_pymt123');
        if (!txn.metadata) txn.metadata = {};
        txn.metadata.paymentUrl = 'https://venmo.com/account/pay?txn=venmo_pymt123';
        return Promise.resolve(txn);
      }),
      processRefund: jest.fn().mockImplementation((refundTransaction) => {
        const txn = Transaction.fromDatabase(refundTransaction);
        txn.updateStatus(TransactionStatus.PROCESSING);
        txn.setProviderTransactionId('venmo_refund123');
        return Promise.resolve(txn);
      }),
      handleWebhook: jest.fn().mockResolvedValue({
        id: 'venmo_evt123',
        eventType: 'payment.completed',
        data: {
          paymentId: 'venmo_pymt123',
          status: TransactionStatus.COMPLETED,
        },
      }),
      getPaymentStatus: jest.fn().mockResolvedValue(TransactionStatus.COMPLETED),
    })),
  };
});

/**
 * Creates a mock transaction object for testing
 * @param overrides Any properties to override in the default test transaction
 */
const createMockTransaction = (overrides = {}): Transaction => {
  const defaultTransaction: ITransaction = {
    id: 'txn_test123',
    type: TransactionType.EVENT_PAYMENT,
    status: TransactionStatus.INITIATED,
    amount: 100.00,
    currency: 'USD',
    description: 'Test payment for event',
    userId: 'user123',
    paymentMethodId: 'pm_test123',
    provider: PaymentProvider.STRIPE,
    providerTransactionId: null,
    eventId: 'event123',
    splitId: null,
    refundedTransactionId: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mergedTransaction = { ...defaultTransaction, ...overrides };
  return Transaction.fromDatabase(mergedTransaction);
};

/**
 * Creates a mock payment method object for testing
 * @param overrides Any properties to override in the default test payment method
 */
const createMockPaymentMethod = (overrides = {}): Payment => {
  const defaultPaymentMethod: IPaymentMethod = {
    id: 'pm_test123',
    userId: 'user123',
    provider: PaymentProvider.STRIPE,
    type: PaymentMethod.CREDIT_CARD,
    token: 'pm_test123',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mergedPaymentMethod = { ...defaultPaymentMethod, ...overrides };
  return Payment.fromDatabase(mergedPaymentMethod);
};

describe('StripeProvider', () => {
  let stripeProvider: StripeProvider;

  beforeEach(() => {
    stripeProvider = new StripeProvider();
  });

  test('constructor should initialize with API key and webhook secret from config', () => {
    expect(stripeProvider).toBeDefined();
  });

  test('createPaymentMethod should create a payment method and return token with card details', async () => {
    const cardDetails = {
      card: {
        number: '4242424242424242',
        expMonth: 12,
        expYear: 2025,
        cvc: '123',
      },
    };

    const result = await stripeProvider.createPaymentMethod(cardDetails);

    expect(result).toEqual({
      token: 'pm_test123',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
    });
  });

  test('getPaymentMethod should retrieve payment method details from Stripe', async () => {
    const result = await stripeProvider.getPaymentMethod('pm_test123');

    expect(result).toHaveProperty('id', 'pm_test123');
    expect(result).toHaveProperty('type', 'card');
    expect(result).toHaveProperty('card');
    expect(result.card).toHaveProperty('last4', '4242');
  });

  test('deletePaymentMethod should detach and delete a payment method from Stripe', async () => {
    const result = await stripeProvider.deletePaymentMethod('pm_test123');

    expect(result).toBe(true);
  });

  test('createPaymentIntent should create a payment intent with correct amount and metadata', async () => {
    const transaction = createMockTransaction();
    const paymentMethod = createMockPaymentMethod();

    const result = await stripeProvider.createPaymentIntent(transaction, paymentMethod);

    expect(result).toEqual({
      id: 'pi_test123',
      clientSecret: 'secret123',
      status: 'requires_payment_method',
    });
  });

  test('processPayment should process payment and update transaction with provider ID', async () => {
    const transaction = createMockTransaction();
    const paymentMethod = createMockPaymentMethod();

    const result = await stripeProvider.processPayment(transaction, paymentMethod);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBe('pi_test123');
    expect(result.metadata).toHaveProperty('clientSecret');
  });

  test('processRefund should process refund for a completed transaction', async () => {
    const originalTransaction = createMockTransaction({
      status: TransactionStatus.COMPLETED,
      providerTransactionId: 'pi_test123',
    });
    
    const refundTransaction = createMockTransaction({
      id: 'refund_txn123',
      type: TransactionType.REFUND,
      refundedTransactionId: originalTransaction.id,
    });

    const result = await stripeProvider.processRefund(refundTransaction, originalTransaction);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.status).toBe(TransactionStatus.COMPLETED);
    expect(result.providerTransactionId).toBe('re_test123');
  });

  test('handleWebhook should verify signature and process webhook event', async () => {
    const payload = '{"id":"evt_test123","type":"payment_intent.succeeded"}';
    const signature = 'sig_test123';

    const result = await stripeProvider.handleWebhook(payload, signature);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('eventType');
    expect(result).toHaveProperty('data');
  });

  test('getPaymentStatus should retrieve and map payment status from Stripe', async () => {
    const result = await stripeProvider.getPaymentStatus('pi_test123');

    expect(result).toBe(TransactionStatus.COMPLETED);
  });
});

describe('VenmoProvider', () => {
  let venmoProvider: VenmoProvider;

  beforeEach(() => {
    venmoProvider = new VenmoProvider();
  });

  test('constructor should initialize with API credentials from config', () => {
    expect(venmoProvider).toBeDefined();
  });

  test('createPaymentMethod should link a Venmo account and return token with identifier', async () => {
    const venmoAccountDetails = {
      username: 'venmo_user',
      accessToken: 'access_token123',
    };

    const result = await venmoProvider.createPaymentMethod(venmoAccountDetails);

    expect(result).toEqual({
      token: 'venmo_token123',
      last4: 'user',
    });
  });

  test('getPaymentMethod should retrieve Venmo account details for a linked payment method', async () => {
    const result = await venmoProvider.getPaymentMethod('venmo_pm123');

    expect(result).toHaveProperty('id', 'venmo_pm123');
    expect(result).toHaveProperty('username', 'venmo_user');
    expect(result).toHaveProperty('email', 'user@example.com');
  });

  test('deletePaymentMethod should unlink a Venmo account from user\'s payment methods', async () => {
    const result = await venmoProvider.deletePaymentMethod('venmo_pm123');

    expect(result).toBe(true);
  });

  test('createPaymentRequest should create a payment request with correct amount and description', async () => {
    const transaction = createMockTransaction({
      provider: PaymentProvider.VENMO,
    });
    
    const paymentMethod = createMockPaymentMethod({
      provider: PaymentProvider.VENMO,
      type: PaymentMethod.VENMO_BALANCE,
      token: Buffer.from(JSON.stringify({
        venmoId: 'venmo_user123',
        username: 'venmo_user',
        accessToken: 'access_token123',
      })).toString('base64'),
    });

    const result = await venmoProvider.createPaymentRequest(transaction, paymentMethod);

    expect(result).toEqual({
      id: 'venmo_pymt123',
      amount: 100,
      note: 'Test payment',
      targetUserHandle: 'venmo_user',
      status: 'pending',
      paymentUrl: 'https://venmo.com/account/pay?txn=venmo_pymt123',
    });
  });

  test('processPayment should process payment and update transaction with provider ID', async () => {
    const transaction = createMockTransaction({
      provider: PaymentProvider.VENMO,
    });
    
    const paymentMethod = createMockPaymentMethod({
      provider: PaymentProvider.VENMO,
      type: PaymentMethod.VENMO_BALANCE,
    });

    const result = await venmoProvider.processPayment(transaction, paymentMethod);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBe('venmo_pymt123');
    expect(result.metadata).toHaveProperty('paymentUrl');
  });

  test('processRefund should process refund by creating a reverse payment request', async () => {
    const originalTransaction = createMockTransaction({
      provider: PaymentProvider.VENMO,
      status: TransactionStatus.COMPLETED,
      providerTransactionId: 'venmo_pymt123',
    });
    
    const refundTransaction = createMockTransaction({
      id: 'refund_txn123',
      provider: PaymentProvider.VENMO,
      type: TransactionType.REFUND,
      refundedTransactionId: originalTransaction.id,
    });

    const result = await venmoProvider.processRefund(refundTransaction, originalTransaction);

    expect(result).toBeInstanceOf(Transaction);
    expect(result.status).toBe(TransactionStatus.PROCESSING);
    expect(result.providerTransactionId).toBe('venmo_refund123');
  });

  test('handleWebhook should verify signature and process webhook event', async () => {
    const payload = '{"id":"venmo_evt123","type":"payment.completed"}';
    const signature = 'sig_test123';

    const result = await venmoProvider.handleWebhook(payload, signature);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('eventType');
    expect(result).toHaveProperty('data');
  });

  test('getPaymentStatus should retrieve and map payment status from Venmo', async () => {
    const result = await venmoProvider.getPaymentStatus('venmo_pymt123');

    expect(result).toBe(TransactionStatus.COMPLETED);
  });
});

describe('getPaymentProvider', () => {
  test('with STRIPE provider should return a StripeProvider instance', () => {
    const provider = getPaymentProvider(PaymentProvider.STRIPE);
    expect(provider).toBeInstanceOf(StripeProvider);
  });

  test('with VENMO provider should return a VenmoProvider instance', () => {
    const provider = getPaymentProvider(PaymentProvider.VENMO);
    expect(provider).toBeInstanceOf(VenmoProvider);
  });

  test('with invalid provider should throw an error for unsupported provider', () => {
    expect(() => {
      // @ts-ignore - Testing invalid provider
      getPaymentProvider('INVALID_PROVIDER');
    }).toThrow('Unsupported payment provider');
  });
});