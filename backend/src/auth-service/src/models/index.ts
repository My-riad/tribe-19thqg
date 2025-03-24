/**
 * Auth Service Models Barrel File
 * 
 * This file serves as a centralized export point for all model-related components
 * in the authentication service. It simplifies imports in other files by providing
 * a single location to import all model functionality.
 */

// User model exports
import { UserModel } from './user.model';

// Token model exports
import { 
  TokenModel,
  TokenType,
  IToken,
  ITokenCreate
} from './token.model';

// Re-export all models and types
export {
  // User model
  UserModel,
  
  // Token model and related types
  TokenModel,
  TokenType,
  IToken,
  ITokenCreate
};