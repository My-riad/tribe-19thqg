/**
 * Barrel file for exporting all service classes from the matching service module.
 * 
 * This file simplifies imports by providing a single entry point for accessing
 * the CompatibilityService, MatchingService, and SuggestionService classes,
 * which together implement the AI-powered matchmaking functionality for the Tribe platform.
 */

import CompatibilityService from './compatibility.service';
import MatchingService from './matching.service';
import SuggestionService from './suggestion.service';

export {
  CompatibilityService,
  MatchingService,
  SuggestionService
};