import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { EventService } from '../services/event.service';
import { 
    validateEventCreate,
    validateEventUpdate,
    validateEventStatusUpdate,
    validateRSVPUpdate,
    validateCheckInUpdate,
    validateEventConflictCheck
} from '../validations/event.validation';
import { 
    IEvent,
    IEventCreate,
    IEventUpdate,
    EventStatus,
    RSVPStatus
} from '../../../shared/src/types/event.types';
import { ApiError } from '../../../shared/src/errors/api.error';
import { logger } from '../../../shared/src/utils/logger.util';

// Initialize EventService instance
const eventService = new EventService();

/**
 * Handles requests to get an event by its ID
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId from request parameters
        const { eventId } = req.params;
        
        // Extract includeAttendees flag from query parameters (default to false)
        const includeAttendees = req.query.includeAttendees === 'true';

        // Call eventService.getEventById with eventId and includeAttendees
        const event = await eventService.getEventById(eventId, includeAttendees);

        // If event is not found, return 404 Not Found response
        if (!event) {
            throw ApiError.notFound(`Event not found with ID: ${eventId}`);
        }

        // Return the event with HTTP 200 status
        res.status(200).json(event);
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error getting event by ID', error);
        next(error);
    }
};

/**
 * Handles requests to get all events for a specific tribe
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const getEventsByTribeId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract tribeId from request parameters
        const { tribeId } = req.params;

        // Extract pagination and filter options from query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status ? (req.query.status as string).split(',') as EventStatus[] : undefined;

        // Call eventService.getEventsByTribeId with tribeId and options
        const { events, total } = await eventService.getEventsByTribeId(tribeId, { page, limit, status });

        // Return the events and total count with HTTP 200 status
        res.status(200).json({ events, total });
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error getting events by tribe ID', error);
        next(error);
    }
};

/**
 * Handles requests to get all events a user is attending or created
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const getEventsByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract userId from request parameters
        const { userId } = req.params;

        // Extract pagination and filter options from query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status ? (req.query.status as string).split(',') as EventStatus[] : undefined;

        // Call eventService.getEventsByUserId with userId and options
        const { events, total } = await eventService.getEventsByUserId(userId, { page, limit, status });

        // Return the events and total count with HTTP 200 status
        res.status(200).json({ events, total });
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error getting events by user ID', error);
        next(error);
    }
};

/**
 * Handles requests to search for events based on various criteria
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const searchEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract search parameters from query
        const searchParams = req.query;

        // Call eventService.searchEvents with the search parameters
        const { events, total } = await eventService.searchEvents(searchParams);

        // Return the search results and total count with HTTP 200 status
        res.status(200).json({ events, total });
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error searching events', error);
        next(error);
    }
};

/**
 * Handles requests to create a new event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract event data from request body
        const eventData = req.body;

        // Validate event data using validateEventCreate
        const validatedData = validateEventCreate(eventData);

        // Call eventService.createEvent with the validated data
        const createdEvent = await eventService.createEvent(validatedData);

        // Return the created event with HTTP 201 status
        res.status(201).json(createdEvent);
    } catch (error) {
        // Catch validation errors and return 400 Bad Request
        if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
            return next(error);
        }
        // Catch other errors and pass them to the next middleware
        logger.error('Error creating event', error);
        next(error);
    }
};

/**
 * Handles requests to update an existing event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId from request parameters
        const { eventId } = req.params;

        // Extract update data from request body
        const updateData = req.body;

        // Validate update data using validateEventUpdate
        const validatedData = validateEventUpdate(updateData);

        // Call eventService.updateEvent with eventId and validated data
        const updatedEvent = await eventService.updateEvent(eventId, validatedData);

        // If event is not found, return 404 Not Found response
        if (!updatedEvent) {
            throw ApiError.notFound(`Event not found with ID: ${eventId}`);
        }

        // Return the updated event with HTTP 200 status
        res.status(200).json(updatedEvent);
    } catch (error) {
        // Catch validation errors and return 400 Bad Request
        if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
            return next(error);
        }
        // Catch other errors and pass them to the next middleware
        logger.error('Error updating event', error);
        next(error);
    }
};

/**
 * Handles requests to update the status of an event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const updateEventStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId from request parameters
        const { eventId } = req.params;

        // Extract status data from request body
        const statusData = req.body;

        // Validate status data using validateEventStatusUpdate
        const validatedData = validateEventStatusUpdate(statusData);

        // Call eventService.updateEventStatus with eventId and status
        const updatedEvent = await eventService.updateEventStatus(eventId, validatedData.status);

        // If event is not found, return 404 Not Found response
        if (!updatedEvent) {
            throw ApiError.notFound(`Event not found with ID: ${eventId}`);
        }

        // Return the updated event with HTTP 200 status
        res.status(200).json(updatedEvent);
    } catch (error) {
        // Catch validation errors and return 400 Bad Request
        if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
            return next(error);
        }
        // Catch other errors and pass them to the next middleware
        logger.error('Error updating event status', error);
        next(error);
    }
};

/**
 * Handles requests to delete an event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId from request parameters
        const { eventId } = req.params;

        // Call eventService.deleteEvent with eventId
        const deleted = await eventService.deleteEvent(eventId);

        // If event is not found, return 404 Not Found response
        if (!deleted) {
            throw ApiError.notFound(`Event not found with ID: ${eventId}`);
        }

        // Return success message with HTTP 200 status
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error deleting event', error);
        next(error);
    }
};

/**
 * Handles requests to get upcoming events based on date range
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract pagination and filter options from query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // Call eventService.getUpcomingEvents with options
        const { events, total } = await eventService.getUpcomingEvents({ page, limit });

        // Return the upcoming events and total count with HTTP 200 status
        res.status(200).json({ events, total });
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error getting upcoming events', error);
        next(error);
    }
};

/**
 * Handles requests to get all attendees for an event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const getEventAttendees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId from request parameters
        const { eventId } = req.params;

        // Call eventService.getEventAttendees with eventId
        const attendees = await eventService.getEventAttendees(eventId);

        // If event is not found, return 404 Not Found response
        if (!attendees) {
            throw ApiError.notFound(`Event not found with ID: ${eventId}`);
        }

        // Return the attendees with HTTP 200 status
        res.status(200).json(attendees);
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error getting event attendees', error);
        next(error);
    }
};

/**
 * Handles requests to update the RSVP status for an attendee
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const updateAttendeeRSVP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId and userId from request parameters
        const { eventId, userId } = req.params;

        // Extract RSVP data from request body
        const rsvpData = req.body;

        // Validate RSVP data using validateRSVPUpdate
        const validatedData = validateRSVPUpdate(rsvpData);

        // Call eventService.updateAttendeeRSVP with eventId, userId, and status
        const updatedAttendee = await eventService.updateAttendeeRSVP(eventId, userId, validatedData.status);

        // If event or attendee is not found, return 404 Not Found response
        if (!updatedAttendee) {
            throw ApiError.notFound(`Event or attendee not found with ID: ${eventId} and ${userId}`);
        }

        // Return the updated attendee record with HTTP 200 status
        res.status(200).json(updatedAttendee);
    } catch (error) {
        // Catch validation errors and return 400 Bad Request
        if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
            return next(error);
        }
        // Catch other errors and pass them to the next middleware
        logger.error('Error updating attendee RSVP', error);
        next(error);
    }
};

/**
 * Handles requests to update the check-in status for an attendee
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const updateAttendeeCheckIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId and userId from request parameters
        const { eventId, userId } = req.params;

        // Extract check-in data from request body
        const checkInData = req.body;

        // Validate check-in data using validateCheckInUpdate
        const validatedData = validateCheckInUpdate(checkInData);

        // Call eventService.updateAttendeeCheckIn with eventId, userId, hasCheckedIn, and coordinates
        const updatedAttendee = await eventService.updateAttendeeCheckIn(eventId, userId, validatedData.hasCheckedIn, validatedData.coordinates);

        // If event or attendee is not found, return 404 Not Found response
        if (!updatedAttendee) {
            throw ApiError.notFound(`Event or attendee not found with ID: ${eventId} and ${userId}`);
        }

        // Return the updated attendee record with HTTP 200 status
        res.status(200).json(updatedAttendee);
    } catch (error) {
        // Catch validation errors and return 400 Bad Request
        if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
            return next(error);
        }
        // Catch other errors and pass them to the next middleware
        logger.error('Error updating attendee check-in', error);
        next(error);
    }
};

/**
 * Handles requests to get attendance statistics for an event
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const getEventAttendanceStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract eventId from request parameters
        const { eventId } = req.params;

        // Call eventService.getEventAttendanceStats with eventId
        const attendanceStats = await eventService.getEventAttendanceStats(eventId);

        // If event is not found, return 404 Not Found response
        if (!attendanceStats) {
            throw ApiError.notFound(`Event not found with ID: ${eventId}`);
        }

        // Return the attendance statistics with HTTP 200 status
        res.status(200).json(attendanceStats);
    } catch (error) {
        // Catch any errors and pass them to the next middleware
        logger.error('Error getting event attendance stats', error);
        next(error);
    }
};

/**
 * Handles requests to check for scheduling conflicts for a tribe or user
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction object
 * @returns Promise<void> - No explicit return value, sends HTTP response
 */
export const checkEventConflicts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract conflict check parameters from request body
        const conflictParams = req.body;

        // Validate parameters using validateEventConflictCheck
        const validatedData = validateEventConflictCheck(conflictParams);

        // Call eventService.checkEventConflicts with validated parameters
        const conflictResults = await eventService.checkEventConflicts(
            validatedData.tribeId,
            validatedData.userId,
            validatedData.startTime,
            validatedData.endTime,
            validatedData.excludeEventId
        );

        // Return the conflict check results with HTTP 200 status
        res.status(200).json(conflictResults);
    } catch (error) {
        // Catch validation errors and return 400 Bad Request
        if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
            return next(error);
        }
        // Catch other errors and pass them to the next middleware
        logger.error('Error checking event conflicts', error);
        next(error);
    }
};