import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Base URL for the Profile Service
const BASE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:3002';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 50 },   // Ramp up to 50 users over 1 minute
    { duration: '30s', target: 100 }, // Ramp up to 100 users over 30 seconds
    { duration: '1m', target: 50 },   // Ramp down to 50 users over 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
    checks: ['rate>0.95'],            // More than 95% of checks should pass
  },
};

// Custom metrics to track different operations
const createProfileTrend = new Trend('create_profile_duration');
const getProfileTrend = new Trend('get_profile_duration');
const updateProfileTrend = new Trend('update_profile_duration');
const searchProfilesTrend = new Trend('search_profiles_duration');
const personalityAssessmentTrend = new Trend('personality_assessment_duration');
const interestSubmissionTrend = new Trend('interest_submission_duration');
const locationUpdateTrend = new Trend('location_update_duration');
const compatibilityCalculationTrend = new Trend('compatibility_calculation_duration');

/**
 * Generates random profile data for testing
 * @returns {Object} Random profile data with name, bio, location, and other required fields
 */
function generateRandomProfile() {
  const userId = `user_${Math.floor(Math.random() * 1000000)}`;
  const name = `Test User ${Math.floor(Math.random() * 10000)}`;
  const bio = `This is a test bio for ${name}. Generated for load testing the Tribe platform.`;
  const location = `City ${Math.floor(Math.random() * 100)}`;
  const coordinates = {
    latitude: (Math.random() * 180 - 90).toFixed(6),
    longitude: (Math.random() * 360 - 180).toFixed(6),
  };

  return {
    userId,
    name,
    bio,
    location,
    coordinates,
    avatarUrl: `https://example.com/avatars/${userId}.jpg`,
    phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  };
}

/**
 * Generates random personality assessment data for testing
 * @param {string} profileId - ID of the profile to associate with the assessment
 * @returns {Object} Random personality assessment data
 */
function generateRandomPersonalityAssessment(profileId) {
  return {
    profileId,
    traits: {
      openness: Math.random().toFixed(2),
      conscientiousness: Math.random().toFixed(2),
      extraversion: Math.random().toFixed(2),
      agreeableness: Math.random().toFixed(2),
      neuroticism: Math.random().toFixed(2),
    },
    communicationStyle: ['direct', 'expressive', 'analytical', 'supportive'][Math.floor(Math.random() * 4)],
    assessmentDate: new Date().toISOString(),
  };
}

/**
 * Generates random interest data for testing
 * @param {string} profileId - ID of the profile to associate with the interests
 * @returns {Object} Random interest submission data
 */
function generateRandomInterests(profileId) {
  const interestCategories = [
    'outdoor',
    'sports',
    'arts',
    'music',
    'food',
    'technology',
    'literature',
    'travel',
    'education',
    'gaming',
  ];
  
  const numInterests = Math.floor(Math.random() * 5) + 3; // 3-7 interests
  const interests = [];
  
  for (let i = 0; i < numInterests; i++) {
    const category = interestCategories[Math.floor(Math.random() * interestCategories.length)];
    interests.push({
      category,
      name: `${category} interest ${Math.floor(Math.random() * 100)}`,
      level: Math.floor(Math.random() * 5) + 1, // 1-5 level
    });
  }
  
  return {
    profileId,
    interests,
    replaceExisting: true,
  };
}

/**
 * Generates random location data for testing
 * @returns {Object} Random location data with coordinates
 */
function generateRandomLocation() {
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Seattle', 'Austin', 'Denver', 'Boston', 'Miami'];
  const locationName = cities[Math.floor(Math.random() * cities.length)];
  
  return {
    location: locationName,
    coordinates: {
      latitude: (Math.random() * 10 + 30).toFixed(6), // US latitude range (approximately)
      longitude: (Math.random() * 50 - 120).toFixed(6), // US longitude range (approximately)
    },
  };
}

/**
 * Performs a profile creation request
 * @param {Object} profileData - Profile data to create
 * @returns {Object} Response object from the profile creation request
 */
function createProfile(profileData) {
  const response = http.post(`${BASE_URL}/profiles`, JSON.stringify(profileData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  createProfileTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a profile retrieval request
 * @param {string} profileId - ID of the profile to retrieve
 * @returns {Object} Response object from the profile retrieval request
 */
function getProfile(profileId) {
  const response = http.get(`${BASE_URL}/profiles/${profileId}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  getProfileTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a complete profile retrieval request including personality and interests
 * @param {string} profileId - ID of the profile to retrieve
 * @returns {Object} Response object from the complete profile retrieval request
 */
function getCompleteProfile(profileId) {
  const response = http.get(`${BASE_URL}/profiles/${profileId}/complete`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  getProfileTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a profile update request
 * @param {string} profileId - ID of the profile to update
 * @param {Object} updateData - Data to update in the profile
 * @returns {Object} Response object from the profile update request
 */
function updateProfile(profileId, updateData) {
  const response = http.put(`${BASE_URL}/profiles/${profileId}`, JSON.stringify(updateData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  updateProfileTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a profile search request
 * @param {Object} searchParams - Search parameters
 * @returns {Object} Response object from the profile search request
 */
function searchProfiles(searchParams) {
  const queryString = Object.entries(searchParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const response = http.get(`${BASE_URL}/profiles/search?${queryString}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  searchProfilesTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a personality assessment submission request
 * @param {Object} assessmentData - Personality assessment data
 * @returns {Object} Response object from the assessment submission request
 */
function submitPersonalityAssessment(assessmentData) {
  const response = http.post(`${BASE_URL}/personality/assessment`, JSON.stringify(assessmentData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  personalityAssessmentTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs an interest submission request
 * @param {Object} interestData - Interest data to submit
 * @returns {Object} Response object from the interest submission request
 */
function submitInterests(interestData) {
  const response = http.post(`${BASE_URL}/interests/batch`, JSON.stringify(interestData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  interestSubmissionTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a location update request
 * @param {string} profileId - ID of the profile to update location
 * @param {Object} locationData - Location data to update
 * @returns {Object} Response object from the location update request
 */
function updateLocation(profileId, locationData) {
  const response = http.put(`${BASE_URL}/profiles/${profileId}/location`, JSON.stringify(locationData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  locationUpdateTrend.add(response.timings.duration);
  return response;
}

/**
 * Performs a compatibility calculation request between two profiles
 * @param {string} profileId1 - ID of the first profile
 * @param {string} profileId2 - ID of the second profile
 * @returns {Object} Response object from the compatibility calculation request
 */
function calculateCompatibility(profileId1, profileId2) {
  const response = http.get(`${BASE_URL}/profiles/compatibility?profile1=${profileId1}&profile2=${profileId2}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  compatibilityCalculationTrend.add(response.timings.duration);
  return response;
}

/**
 * Test scenario for profile creation and retrieval
 */
function profileCreationScenario() {
  // Generate random profile data
  const profileData = generateRandomProfile();
  
  // Create a new profile
  const createResponse = createProfile(profileData);
  check(createResponse, {
    'profile creation status is 201': (r) => r.status === 201,
    'profile creation has valid JSON response': (r) => r.json() !== null,
  });
  
  // Get the profile ID from the response
  const profileId = createResponse.json().id;
  
  // Retrieve the created profile
  const getResponse = getProfile(profileId);
  check(getResponse, {
    'profile retrieval status is 200': (r) => r.status === 200,
    'retrieved profile has correct ID': (r) => r.json().id === profileId,
  });
  
  // Update the profile
  const updateData = {
    bio: `Updated bio for load testing at ${new Date().toISOString()}`,
  };
  const updateResponse = updateProfile(profileId, updateData);
  check(updateResponse, {
    'profile update status is 200': (r) => r.status === 200,
    'profile updated successfully': (r) => r.json().bio === updateData.bio,
  });
  
  // Add a small delay to simulate user behavior
  sleep(1);
}

/**
 * Test scenario for personality assessment submission
 */
function personalityAssessmentScenario() {
  // Create a profile first
  const profileData = generateRandomProfile();
  const createResponse = createProfile(profileData);
  check(createResponse, {
    'profile creation status is 201': (r) => r.status === 201,
  });
  
  const profileId = createResponse.json().id;
  
  // Submit a personality assessment
  const assessmentData = generateRandomPersonalityAssessment(profileId);
  const assessmentResponse = submitPersonalityAssessment(assessmentData);
  check(assessmentResponse, {
    'assessment submission status is 200': (r) => r.status === 200 || r.status === 201,
    'assessment saved successfully': (r) => r.json().profileId === profileId,
  });
  
  // Get complete profile to verify assessment data
  const completeProfileResponse = getCompleteProfile(profileId);
  check(completeProfileResponse, {
    'complete profile retrieval status is 200': (r) => r.status === 200,
    'complete profile contains personality data': (r) => r.json().personality !== undefined,
  });
  
  sleep(1);
}

/**
 * Test scenario for interest submission
 */
function interestSubmissionScenario() {
  // Create a profile first
  const profileData = generateRandomProfile();
  const createResponse = createProfile(profileData);
  check(createResponse, {
    'profile creation status is 201': (r) => r.status === 201,
  });
  
  const profileId = createResponse.json().id;
  
  // Submit interests
  const interestData = generateRandomInterests(profileId);
  const interestResponse = submitInterests(interestData);
  check(interestResponse, {
    'interest submission status is 200': (r) => r.status === 200 || r.status === 201,
    'interests saved successfully': (r) => r.json().success === true || r.status === 200,
  });
  
  // Get complete profile to verify interest data
  const completeProfileResponse = getCompleteProfile(profileId);
  check(completeProfileResponse, {
    'complete profile retrieval status is 200': (r) => r.status === 200,
    'complete profile contains interests': (r) => Array.isArray(r.json().interests),
  });
  
  sleep(1);
}

/**
 * Test scenario for location update
 */
function locationUpdateScenario() {
  // Create a profile first
  const profileData = generateRandomProfile();
  const createResponse = createProfile(profileData);
  check(createResponse, {
    'profile creation status is 201': (r) => r.status === 201,
  });
  
  const profileId = createResponse.json().id;
  
  // Update location
  const locationData = generateRandomLocation();
  const locationResponse = updateLocation(profileId, locationData);
  check(locationResponse, {
    'location update status is 200': (r) => r.status === 200,
    'location updated successfully': (r) => {
      const json = r.json();
      return json.location === locationData.location ||
             (json.coordinates && 
              json.coordinates.latitude === locationData.coordinates.latitude &&
              json.coordinates.longitude === locationData.coordinates.longitude);
    },
  });
  
  // Get profile to verify location update
  const profileResponse = getProfile(profileId);
  check(profileResponse, {
    'profile retrieval status is 200': (r) => r.status === 200,
    'profile has updated location': (r) => r.json().location === locationData.location,
  });
  
  sleep(1);
}

/**
 * Test scenario for profile searching
 */
function profileSearchScenario() {
  // Generate random search parameters
  const searchParams = {
    location: ['New York', 'Los Angeles', 'Chicago', 'Seattle'][Math.floor(Math.random() * 4)],
    radius: Math.floor(Math.random() * 50) + 5, // 5-55 km
    limit: 10,
    page: 1,
  };
  
  // Perform search
  const searchResponse = searchProfiles(searchParams);
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search returns array': (r) => Array.isArray(r.json().profiles || r.json()),
  });
  
  sleep(1);
}

/**
 * Test scenario for compatibility calculation
 */
function compatibilityCalculationScenario() {
  // Create two profiles
  const profile1Data = generateRandomProfile();
  const profile2Data = generateRandomProfile();
  
  const create1Response = createProfile(profile1Data);
  check(create1Response, {
    'profile 1 creation status is 201': (r) => r.status === 201,
  });
  
  const create2Response = createProfile(profile2Data);
  check(create2Response, {
    'profile 2 creation status is 201': (r) => r.status === 201,
  });
  
  const profileId1 = create1Response.json().id;
  const profileId2 = create2Response.json().id;
  
  // Submit personality assessments for both profiles
  const assessment1Data = generateRandomPersonalityAssessment(profileId1);
  submitPersonalityAssessment(assessment1Data);
  
  const assessment2Data = generateRandomPersonalityAssessment(profileId2);
  submitPersonalityAssessment(assessment2Data);
  
  // Calculate compatibility
  const compatibilityResponse = calculateCompatibility(profileId1, profileId2);
  check(compatibilityResponse, {
    'compatibility calculation status is 200': (r) => r.status === 200,
    'compatibility result is numeric': (r) => {
      const json = r.json();
      return (
        typeof json.compatibilityScore === 'number' || 
        typeof json.score === 'number' || 
        typeof json.compatibility === 'number'
      );
    },
  });
  
  sleep(1);
}

/**
 * Main test function that randomly selects and executes one of the test scenarios
 */
export default function() {
  const scenarioSelector = Math.random();
  
  if (scenarioSelector < 0.2) {
    profileCreationScenario();
  } else if (scenarioSelector < 0.4) {
    personalityAssessmentScenario();
  } else if (scenarioSelector < 0.6) {
    interestSubmissionScenario();
  } else if (scenarioSelector < 0.75) {
    locationUpdateScenario();
  } else if (scenarioSelector < 0.9) {
    profileSearchScenario();
  } else {
    compatibilityCalculationScenario();
  }
}