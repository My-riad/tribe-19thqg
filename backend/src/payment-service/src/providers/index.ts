import { StripeProvider } from './stripe.provider';
import { VenmoProvider } from './venmo.provider';
import { PaymentProvider } from '@shared/types/payment.types';

/**
 * Factory function that returns the appropriate payment provider instance based on the provider type
 * 
 * @param provider The payment provider type to instantiate
 * @returns The appropriate payment provider instance
 * @throws Error if an unsupported payment provider is specified
 */
export function getPaymentProvider(provider: PaymentProvider): StripeProvider | VenmoProvider {
  switch (provider) {
    case PaymentProvider.STRIPE:
      return new StripeProvider();
    case PaymentProvider.VENMO:
      return new VenmoProvider();
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

// Export provider implementations
export { StripeProvider, VenmoProvider };