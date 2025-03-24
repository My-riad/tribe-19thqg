import { httpClient } from './httpClient';
import { API_PATHS } from '../constants/apiPaths';
import { ApiResponse, PaginatedResponse } from '../types/api.types';

/**
 * Retrieves all payment methods for the current user
 * @returns Promise resolving to the list of payment methods
 */
const getPaymentMethods = async (): Promise<ApiResponse<PaymentMethodResponse[]>> => {
  return httpClient.get(API_PATHS.PAYMENT.METHODS);
};

/**
 * Retrieves a specific payment method by ID
 * @param paymentMethodId The ID of the payment method to retrieve
 * @returns Promise resolving to the payment method details
 */
const getPaymentMethodById = async (paymentMethodId: string): Promise<ApiResponse<PaymentMethodResponse>> => {
  return httpClient.get(`${API_PATHS.PAYMENT.METHODS}/${paymentMethodId}`);
};

/**
 * Creates a new payment method for the current user
 * @param paymentMethodData The payment method data to create
 * @returns Promise resolving to the created payment method
 */
const createPaymentMethod = async (paymentMethodData: object): Promise<ApiResponse<PaymentMethodResponse>> => {
  return httpClient.post(API_PATHS.PAYMENT.METHODS, paymentMethodData);
};

/**
 * Updates an existing payment method
 * @param paymentMethodId The ID of the payment method to update
 * @param paymentMethodData The payment method data to update
 * @returns Promise resolving to the updated payment method
 */
const updatePaymentMethod = async (
  paymentMethodId: string, 
  paymentMethodData: object
): Promise<ApiResponse<PaymentMethodResponse>> => {
  return httpClient.put(`${API_PATHS.PAYMENT.METHODS}/${paymentMethodId}`, paymentMethodData);
};

/**
 * Deletes a payment method
 * @param paymentMethodId The ID of the payment method to delete
 * @returns Promise resolving to success status
 */
const deletePaymentMethod = async (paymentMethodId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return httpClient.delete(`${API_PATHS.PAYMENT.METHODS}/${paymentMethodId}`);
};

/**
 * Sets a payment method as the default for the current user
 * @param paymentMethodId The ID of the payment method to set as default
 * @returns Promise resolving to the updated payment method
 */
const setDefaultPaymentMethod = async (paymentMethodId: string): Promise<ApiResponse<PaymentMethodResponse>> => {
  return httpClient.put(`${API_PATHS.PAYMENT.METHODS}/${paymentMethodId}/default`, {});
};

/**
 * Retrieves transactions based on optional filters
 * @param filters Optional filters to apply to the transaction query
 * @returns Promise resolving to the list of transactions
 */
const getTransactions = async (filters: object = {}): Promise<ApiResponse<TransactionResponse[]>> => {
  return httpClient.get(API_PATHS.PAYMENT.TRANSACTIONS, filters);
};

/**
 * Retrieves a specific transaction by ID
 * @param transactionId The ID of the transaction to retrieve
 * @returns Promise resolving to the transaction details
 */
const getTransactionById = async (transactionId: string): Promise<ApiResponse<TransactionResponse>> => {
  return httpClient.get(`${API_PATHS.PAYMENT.TRANSACTIONS}/${transactionId}`);
};

/**
 * Processes a payment for an event
 * @param paymentData The payment data including amount, currency, eventId, paymentMethodId
 * @returns Promise resolving to the processed transaction
 */
const processEventPayment = async (paymentData: object): Promise<ApiResponse<TransactionResponse>> => {
  return httpClient.post(`${API_PATHS.PAYMENT.PROCESS}/event`, paymentData);
};

/**
 * Processes a refund for a previous transaction
 * @param transactionId The ID of the transaction to refund
 * @param refundData The refund data including amount and reason
 * @returns Promise resolving to the refund transaction
 */
const refundTransaction = async (
  transactionId: string, 
  refundData: object
): Promise<ApiResponse<TransactionResponse>> => {
  return httpClient.post(`${API_PATHS.PAYMENT.TRANSACTIONS}/${transactionId}/refund`, refundData);
};

/**
 * Retrieves payment splits based on optional filters
 * @param filters Optional filters to apply to the splits query
 * @returns Promise resolving to the list of payment splits
 */
const getSplits = async (filters: object = {}): Promise<ApiResponse<PaymentSplitResponse[]>> => {
  return httpClient.get(API_PATHS.PAYMENT.SPLIT, filters);
};

/**
 * Retrieves a specific payment split by ID
 * @param splitId The ID of the payment split to retrieve
 * @returns Promise resolving to the payment split details
 */
const getSplitById = async (splitId: string): Promise<ApiResponse<PaymentSplitResponse>> => {
  return httpClient.get(`${API_PATHS.PAYMENT.SPLIT}/${splitId}`);
};

/**
 * Retrieves payment splits for a specific event
 * @param eventId The ID of the event to get splits for
 * @returns Promise resolving to the list of payment splits for the event
 */
const getSplitsByEvent = async (eventId: string): Promise<ApiResponse<PaymentSplitResponse[]>> => {
  return httpClient.get(API_PATHS.PAYMENT.SPLIT, { eventId });
};

/**
 * Creates a new payment split for an event
 * @param splitData The payment split data to create
 * @returns Promise resolving to the created payment split
 */
const createSplit = async (splitData: object): Promise<ApiResponse<PaymentSplitResponse>> => {
  return httpClient.post(API_PATHS.PAYMENT.SPLIT, splitData);
};

/**
 * Updates an existing payment split
 * @param splitId The ID of the payment split to update
 * @param splitData The payment split data to update
 * @returns Promise resolving to the updated payment split
 */
const updateSplit = async (
  splitId: string, 
  splitData: object
): Promise<ApiResponse<PaymentSplitResponse>> => {
  return httpClient.put(`${API_PATHS.PAYMENT.SPLIT}/${splitId}`, splitData);
};

/**
 * Cancels a payment split
 * @param splitId The ID of the payment split to cancel
 * @returns Promise resolving to success status
 */
const cancelSplit = async (splitId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return httpClient.post(`${API_PATHS.PAYMENT.SPLIT}/${splitId}/cancel`, {});
};

/**
 * Processes a payment for a user's share in a split
 * @param splitId The ID of the split
 * @param paymentData The payment data including paymentMethodId
 * @returns Promise resolving to the processed transaction
 */
const processSplitPayment = async (
  splitId: string,
  paymentData: object
): Promise<ApiResponse<TransactionResponse>> => {
  return httpClient.post(`${API_PATHS.PAYMENT.PROCESS}/split`, { ...paymentData, splitId });
};

/**
 * Sends reminders to participants with pending payments
 * @param splitId The ID of the split to send reminders for
 * @returns Promise resolving to success status
 */
const remindParticipants = async (splitId: string): Promise<ApiResponse<{ success: boolean }>> => {
  return httpClient.post(`${API_PATHS.PAYMENT.SPLIT}/${splitId}/remind`, {});
};

/**
 * Gets statistics about payments for a user or event
 * @param id The user ID or event ID
 * @param type The type of entity ('user' or 'event')
 * @returns Promise resolving to payment statistics
 */
const getPaymentStatistics = async (id: string, type: string): Promise<ApiResponse<object>> => {
  return httpClient.get(`${API_PATHS.PAYMENT.BASE}/statistics/${type}/${id}`);
};

export const paymentApi = {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getTransactions,
  getTransactionById,
  processEventPayment,
  refundTransaction,
  getSplits,
  getSplitById,
  getSplitsByEvent,
  createSplit,
  updateSplit,
  cancelSplit,
  processSplitPayment,
  remindParticipants,
  getPaymentStatistics
};