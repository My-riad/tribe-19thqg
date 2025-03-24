import * as paymentController from './payment.controller';
import { SplitController } from './split.controller';
import { setupRoutes as setupTransactionRoutes } from './transaction.controller';

// Export all payment controller functions
export { paymentController };

// Export the split controller class
export { SplitController };

// Export the transaction routes setup function
export { setupTransactionRoutes };