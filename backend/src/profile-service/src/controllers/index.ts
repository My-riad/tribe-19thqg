import { ProfileController } from './profile.controller';
import { PersonalityController } from './personality.controller';
import {
  createInterestHandler,
  getInterestByIdHandler,
  getInterestsByProfileIdHandler,
  updateInterestHandler,
  deleteInterestHandler,
  bulkCreateInterestsHandler,
  deleteInterestsByProfileIdHandler,
} from './interest.controller';

/**
 * Exports the ProfileController class for handling profile-related API endpoints.
 * @example
 * ```typescript
 * import { ProfileController } from './controllers';
 * const profileController = new ProfileController();
 * ```
 */
export { ProfileController };

/**
 * Exports the PersonalityController class for handling personality-related API endpoints.
 * @example
 * ```typescript
 * import { PersonalityController } from './controllers';
 * const personalityController = new PersonalityController();
 * ```
 */
export { PersonalityController };

/**
 * Exports the handler function for creating a new interest.
 * @example
 * ```typescript
 * import { createInterestHandler } from './controllers';
 * ```
 */
export { createInterestHandler };

/**
 * Exports the handler function for retrieving an interest by its ID.
 * @example
 * ```typescript
 * import { getInterestByIdHandler } from './controllers';
 * ```
 */
export { getInterestByIdHandler };

/**
 * Exports the handler function for retrieving all interests associated with a profile ID.
 * @example
 * ```typescript
 * import { getInterestsByProfileIdHandler } from './controllers';
 * ```
 */
export { getInterestsByProfileIdHandler };

/**
 * Exports the handler function for updating an existing interest.
 * @example
 * ```typescript
 * import { updateInterestHandler } from './controllers';
 * ```
 */
export { updateInterestHandler };

/**
 * Exports the handler function for deleting an interest.
 * @example
 * ```typescript
 * import { deleteInterestHandler } from './controllers';
 * ```
 */
export { deleteInterestHandler };

/**
 * Exports the handler function for creating multiple interests in bulk.
 * @example
 * ```typescript
 * import { bulkCreateInterestsHandler } from './controllers';
 * ```
 */
export { bulkCreateInterestsHandler };

/**
 * Exports the handler function for deleting all interests associated with a profile ID.
 * @example
 * ```typescript
 * import { deleteInterestsByProfileIdHandler } from './controllers';
 * ```
 */
export { deleteInterestsByProfileIdHandler };