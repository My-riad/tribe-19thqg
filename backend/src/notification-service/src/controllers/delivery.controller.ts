import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { deliveryService } from '../services/delivery.service';
import { validateBody, validateParams, validateQuery } from '../../../shared/src/middlewares/validation.middleware';
import { DeliveryChannel, NotificationStatus } from '../../../shared/src/types/notification.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Validation schemas
const deliveryIdSchema = Joi.object({ 
  deliveryId: Joi.string().required() 
});

const notificationIdSchema = Joi.object({ 
  notificationId: Joi.string().required() 
});

const updateDeliveryStatusSchema = Joi.object({ 
  status: Joi.string().valid(...Object.values(NotificationStatus)).required(), 
  errorMessage: Joi.string(), 
  metadata: Joi.object() 
});

const createDeliverySchema = Joi.object({
  notificationId: Joi.string().required(),
  channel: Joi.string().valid(...Object.values(DeliveryChannel)).required(),
  metadata: Joi.object()
});

const retryFailedDeliveriesSchema = Joi.object({
  batchSize: Joi.number().integer().min(1).max(100).default(10)
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

const cleanupSchema = Joi.object({
  retentionDays: Joi.number().integer().min(1).default(30)
});

/**
 * Retrieves a delivery record by ID
 */
export async function getDeliveryById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deliveryId } = req.params;
    
    // Since deliveryService.findById is not explicitly defined in the service,
    // this would need to be implemented in the service layer
    const delivery = await deliveryService.findById(deliveryId);
    
    if (!delivery) {
      throw ApiError.notFound(`Delivery record with ID ${deliveryId} not found`);
    }
    
    res.status(200).json(delivery);
  } catch (error) {
    logger.error(`Error retrieving delivery with ID ${req.params.deliveryId}`, error as Error);
    next(error);
  }
}

/**
 * Retrieves all delivery records for a notification
 */
export async function getDeliveriesByNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notificationId } = req.params;
    
    const deliveries = await deliveryService.findByNotification(notificationId);
    
    res.status(200).json(deliveries);
  } catch (error) {
    logger.error(`Error retrieving deliveries for notification ${req.params.notificationId}`, error as Error);
    next(error);
  }
}

/**
 * Retrieves a delivery record for a notification and channel
 */
export async function getDeliveryByNotificationAndChannel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notificationId } = req.params;
    const { channel } = req.query;
    
    if (!channel || !Object.values(DeliveryChannel).includes(channel as DeliveryChannel)) {
      throw ApiError.badRequest('Valid delivery channel is required');
    }
    
    const delivery = await deliveryService.findByNotificationAndChannel(
      notificationId, 
      channel as DeliveryChannel
    );
    
    if (!delivery) {
      throw ApiError.notFound(`Delivery record for notification ${notificationId} on channel ${channel} not found`);
    }
    
    res.status(200).json(delivery);
  } catch (error) {
    logger.error(`Error retrieving delivery for notification ${req.params.notificationId} on channel ${req.query.channel}`, error as Error);
    next(error);
  }
}

/**
 * Creates a new delivery record
 */
export async function createDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notificationId, channel, metadata } = req.body;
    
    const delivery = await deliveryService.createDelivery(
      notificationId,
      channel,
      metadata
    );
    
    res.status(201).json(delivery);
  } catch (error) {
    logger.error('Error creating delivery record', error as Error);
    next(error);
  }
}

/**
 * Updates the status of a delivery record
 */
export async function updateDeliveryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deliveryId } = req.params;
    const { status, errorMessage, metadata } = req.body;
    
    const delivery = await deliveryService.updateStatus(
      deliveryId,
      status,
      errorMessage,
      metadata
    );
    
    res.status(200).json(delivery);
  } catch (error) {
    logger.error(`Error updating status for delivery ${req.params.deliveryId}`, error as Error);
    next(error);
  }
}

/**
 * Marks a delivery record as read
 */
export async function markDeliveryAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notificationId } = req.params;
    
    const updatedCount = await deliveryService.markAsRead(notificationId);
    
    res.status(200).json({ 
      success: true, 
      updatedCount 
    });
  } catch (error) {
    logger.error(`Error marking delivery as read for notification ${req.params.notificationId}`, error as Error);
    next(error);
  }
}

/**
 * Retries failed delivery attempts
 */
export async function retryFailedDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { batchSize } = req.query;
    
    const result = await deliveryService.retryFailedDeliveries(
      batchSize ? Number(batchSize) : 10
    );
    
    res.status(200).json({
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed
    });
  } catch (error) {
    logger.error('Error retrying failed deliveries', error as Error);
    next(error);
  }
}

/**
 * Retrieves delivery statistics for a date range
 */
export async function getDeliveryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if dates not provided
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const stats = await deliveryService.getDeliveryStats(start, end);
    
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Error retrieving delivery statistics', error as Error);
    next(error);
  }
}

/**
 * Retrieves delivery statistics by channel for a date range
 */
export async function getDeliveryStatsByChannel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if dates not provided
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const stats = await deliveryService.getDeliveryStatsByChannel(start, end);
    
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Error retrieving delivery statistics by channel', error as Error);
    next(error);
  }
}

/**
 * Cleans up old delivery records based on retention policy
 */
export async function cleanupOldDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { retentionDays } = req.query;
    
    const deletedCount = await deliveryService.cleanupOldDeliveries(
      retentionDays ? Number(retentionDays) : 30
    );
    
    res.status(200).json({
      success: true,
      deletedCount
    });
  } catch (error) {
    logger.error('Error cleaning up old delivery records', error as Error);
    next(error);
  }
}