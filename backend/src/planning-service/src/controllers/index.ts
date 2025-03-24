import { router as availabilityRouter } from './availability.controller'; // Express router with availability endpoints
import PlanningController from './planning.controller'; // Controller for handling planning-related HTTP requests
import SchedulingController from './scheduling.controller'; // Controller for handling scheduling-related HTTP requests
import { VenueController, setupVenueRoutes } from './venue.controller'; // Controller and setup function for venue-related HTTP requests

export {
  availabilityRouter,
  PlanningController,
  SchedulingController,
  VenueController,
  setupVenueRoutes
};