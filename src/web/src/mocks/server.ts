import { setupServer } from 'msw/node';
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW server instance for Node.js environments.
 * Used primarily in automated tests to intercept API requests.
 * 
 * @example
 * // In a test file
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 */
export const server = setupServer(...handlers);

/**
 * MSW worker instance for browser environments.
 * Used in development to mock API requests without a backend connection.
 * 
 * @example
 * // In your browser entry point (e.g., index.ts)
 * if (process.env.NODE_ENV === 'development') {
 *   worker.start();
 * }
 */
export const worker = setupWorker(...handlers);