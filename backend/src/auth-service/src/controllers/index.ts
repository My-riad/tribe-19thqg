/**
 * Authentication Controllers Barrel File
 * 
 * Exports all authentication controller functions from the auth service.
 * This file centralizes exports to simplify imports throughout the application.
 */

import {
  registerUser,
  loginUser,
  socialAuthUser,
  refreshUserToken,
  logoutUser,
  logoutAllSessions,
  requestPasswordResetEmail,
  resetPassword,
  verifyUserEmail,
  resendVerificationEmail,
  changeUserPassword,
  validateUserToken,
  getCurrentUser
} from './auth.controller';

export {
  registerUser,
  loginUser,
  socialAuthUser,
  refreshUserToken,
  logoutUser,
  logoutAllSessions,
  requestPasswordResetEmail,
  resetPassword,
  verifyUserEmail,
  resendVerificationEmail,
  changeUserPassword,
  validateUserToken,
  getCurrentUser
};