/**
 * Utility Functions
 * 
 * This file serves as a central export point for all utility functions used throughout the Tribe application.
 * It aggregates utility functions from specialized modules to provide a clean, organized API for common operations.
 */

// Import all utility modules
import * as analytics from './analytics';
import * as dateTime from './dateTime';
import * as deviceInfo from './deviceInfo';
import * as formatters from './formatters';
import * as location from './location';
import * as permissions from './permissions';
import * as validation from './validation';

//-----------------------------------------------------------------------------
// Analytics utilities
//-----------------------------------------------------------------------------
export { analytics };

//-----------------------------------------------------------------------------
// Date/Time utilities
//-----------------------------------------------------------------------------
export const formatDate = dateTime.formatDate;
export const formatEventDate = dateTime.formatEventDate;
export const formatEventTime = dateTime.formatEventTime;
export const formatEventDateTime = dateTime.formatEventDateTime;
export const formatRelativeTime = dateTime.formatRelativeTime;
export const parseTimeString = dateTime.parseTimeString;
export const combineDateAndTime = dateTime.combineDateAndTime;
export const getTimeSlots = dateTime.getTimeSlots;
export const isEventSoon = dateTime.isEventSoon;
export const getEventDuration = dateTime.getEventDuration;
export const formatDuration = dateTime.formatDuration;
export const getDateRange = dateTime.getDateRange;
export const isDateInRange = dateTime.isDateInRange;
export const getDayAbbreviation = dateTime.getDayAbbreviation;

//-----------------------------------------------------------------------------
// Device Info utilities
//-----------------------------------------------------------------------------
export const getPlatform = deviceInfo.getPlatform;
export const isIOS = deviceInfo.isIOS;
export const isAndroid = deviceInfo.isAndroid;
export const getDeviceModel = deviceInfo.getDeviceModel;
export const getOSVersion = deviceInfo.getOSVersion;
export const getScreenDimensions = deviceInfo.getScreenDimensions;
export const getDeviceType = deviceInfo.getDeviceType;
export const hasNotch = deviceInfo.hasNotch;
export const getPixelDensity = deviceInfo.getPixelDensity;
export const isConnected = deviceInfo.isConnected;
export const getConnectionType = deviceInfo.getConnectionType;
export const isLowPowerMode = deviceInfo.isLowPowerMode;
export const getUniqueDeviceId = deviceInfo.getUniqueDeviceId;

//-----------------------------------------------------------------------------
// Formatter utilities
//-----------------------------------------------------------------------------
export const formatCurrency = formatters.formatCurrency;
export const formatNumber = formatters.formatNumber;
export const formatPercentage = formatters.formatPercentage;
export const formatPhoneNumber = formatters.formatPhoneNumber;
export const formatAddress = formatters.formatAddress;
export const formatCoordinates = formatters.formatCoordinates;
export const formatDistance = formatters.formatDistance;
export const formatWeather = formatters.formatWeather;
export const formatName = formatters.formatName;
export const truncateText = formatters.truncateText;
export const formatFileSize = formatters.formatFileSize;
export const formatPlural = formatters.formatPlural;
export const formatList = formatters.formatList;

//-----------------------------------------------------------------------------
// Location utilities
//-----------------------------------------------------------------------------
export const requestLocationPermission = location.requestLocationPermission;
export const getCurrentPosition = location.getCurrentPosition;
export const watchPosition = location.watchPosition;
export const clearWatch = location.clearWatch;
export const geocodeAddress = location.geocodeAddress;
export const reverseGeocode = location.reverseGeocode;
export const calculateDistance = location.calculateDistance;
export const isWithinRadius = location.isWithinRadius;

//-----------------------------------------------------------------------------
// Permission utilities
//-----------------------------------------------------------------------------
export const isAuthenticated = permissions.isAuthenticated;
export const isTribeMember = permissions.isTribeMember;
export const isTribeAdmin = permissions.isTribeAdmin;
export const isTribeCreator = permissions.isTribeCreator;
export const canManageTribe = permissions.canManageTribe;
export const canEditTribe = permissions.canEditTribe;
export const canRemoveMember = permissions.canRemoveMember;
export const canCreateEvent = permissions.canCreateEvent;
export const canEditEvent = permissions.canEditEvent;
export const canCancelEvent = permissions.canCancelEvent;
export const canViewTribeDetails = permissions.canViewTribeDetails;
export const canJoinTribe = permissions.canJoinTribe;
export const canLeaveTribe = permissions.canLeaveTribe;
export const canViewProfile = permissions.canViewProfile;
export const canEditProfile = permissions.canEditProfile;
export const canAttendEvent = permissions.canAttendEvent;
export const hasCompletedOnboarding = permissions.hasCompletedOnboarding;
export const hasCompletedProfile = permissions.hasCompletedProfile;
export const getUserRole = permissions.getUserRole;

//-----------------------------------------------------------------------------
// Validation utilities
//-----------------------------------------------------------------------------
export const isRequired = validation.isRequired;
export const isEmail = validation.isEmail;
export const isPassword = validation.isPassword;
export const isPasswordMatch = validation.isPasswordMatch;
export const isPhone = validation.isPhone;
export const isDate = validation.isDate;
export const isUrl = validation.isUrl;
export const maxLength = validation.maxLength;
export const isValidAge = validation.isValidAge;
export const isValidCoordinates = validation.isValidCoordinates;
export const validateForm = validation.validateForm;