import { EventTypes } from '../../types/event.types';
import { TribeTypes } from '../../types/tribe.types';
import { getTribeById } from './tribes';
import { getBasicUserInfo } from './users';

// Mock event data for testing and development
const mockEvents: EventTypes.Event[] = [
  {
    id: 'event-1',
    name: 'Trail Hike @ Discovery Park',
    description: 'Let\'s explore the new lighthouse trail and have a picnic after. Bring water and snacks!',
    eventType: EventTypes.EventType.OUTDOOR_ACTIVITY,
    location: 'Discovery Park, Seattle',
    coordinates: { latitude: 47.6615, longitude: -122.4331 },
    venueId: 'venue-1',
    venueDetails: {
      id: 'venue-1',
      name: 'Discovery Park',
      address: '3801 Discovery Park Blvd, Seattle, WA 98199',
      coordinates: { latitude: 47.6615, longitude: -122.4331 },
      phoneNumber: '+12063860707',
      website: 'https://www.seattle.gov/parks/find/parks/discovery-park',
      rating: 4.8,
      priceLevel: 0,
      photos: ['discovery_park_1.jpg', 'discovery_park_2.jpg'],
      openingHours: {
        'Monday': '6:00 AM - 10:00 PM',
        'Tuesday': '6:00 AM - 10:00 PM',
        'Wednesday': '6:00 AM - 10:00 PM',
        'Thursday': '6:00 AM - 10:00 PM',
        'Friday': '6:00 AM - 10:00 PM',
        'Saturday': '6:00 AM - 10:00 PM',
        'Sunday': '6:00 AM - 10:00 PM'
      },
      amenities: ['Parking', 'Restrooms', 'Trails', 'Picnic Areas']
    },
    startTime: new Date('2023-07-15T10:00:00Z'),
    endTime: new Date('2023-07-15T14:00:00Z'),
    tribeId: 'tribe-1',
    tribe: getTribeById('tribe-1'),
    createdBy: 'user-1',
    createdAt: new Date('2023-07-01T15:30:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_discovery_park.jpg',
    attendees: [
      {
        id: 'attendee-1-1',
        eventId: 'event-1',
        userId: 'user-1',
        profile: getBasicUserInfo('user-1'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-01T16:00:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-1-2',
        eventId: 'event-1',
        userId: 'user-2',
        profile: getBasicUserInfo('user-2'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-02T10:15:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-1-3',
        eventId: 'event-1',
        userId: 'user-3',
        profile: getBasicUserInfo('user-3'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-02T14:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-1-4',
        eventId: 'event-1',
        userId: 'user-4',
        profile: getBasicUserInfo('user-4'),
        rsvpStatus: EventTypes.RSVPStatus.MAYBE,
        rsvpTime: new Date('2023-07-03T09:45:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 4,
    maxAttendees: 6,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.SUNNY,
      temperature: 75,
      temperatureUnit: 'F',
      precipitation: 0,
      humidity: 45,
      windSpeed: 5,
      iconUrl: 'weather_sunny.png',
      forecast: 'Sunny and clear throughout the day'
    },
    isAiGenerated: false,
    userRsvpStatus: EventTypes.RSVPStatus.GOING,
    metadata: {}
  },
  {
    id: 'event-2',
    name: 'Food Truck Festival',
    description: 'Let\'s try different food trucks at the weekend festival. Great opportunity to taste various cuisines!',
    eventType: EventTypes.EventType.FOOD_DINING,
    location: 'South Lake Union, Seattle',
    coordinates: { latitude: 47.6253, longitude: -122.3362 },
    venueId: 'venue-2',
    venueDetails: {
      id: 'venue-2',
      name: 'South Lake Union Saturday Market',
      address: '117 9th Ave N, Seattle, WA 98109',
      coordinates: { latitude: 47.6253, longitude: -122.3362 },
      phoneNumber: '+12065551234',
      website: 'https://www.slufoodtruckfest.com',
      rating: 4.5,
      priceLevel: 2,
      photos: ['slu_market_1.jpg', 'slu_market_2.jpg'],
      openingHours: {
        'Saturday': '10:00 AM - 6:00 PM',
        'Sunday': '10:00 AM - 6:00 PM'
      },
      amenities: ['Food Trucks', 'Seating Areas', 'Restrooms', 'Live Music']
    },
    startTime: new Date('2023-07-16T14:00:00Z'),
    endTime: new Date('2023-07-16T17:00:00Z'),
    tribeId: 'tribe-2',
    tribe: getTribeById('tribe-2'),
    createdBy: 'user-5',
    createdAt: new Date('2023-07-05T11:45:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_food_truck_festival.jpg',
    attendees: [
      {
        id: 'attendee-2-1',
        eventId: 'event-2',
        userId: 'user-5',
        profile: getBasicUserInfo('user-5'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-05T12:00:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-2-2',
        eventId: 'event-2',
        userId: 'user-1',
        profile: getBasicUserInfo('user-1'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-06T09:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-2-3',
        eventId: 'event-2',
        userId: 'user-3',
        profile: getBasicUserInfo('user-3'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-06T14:15:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 3,
    maxAttendees: 8,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.PARTLY_CLOUDY,
      temperature: 72,
      temperatureUnit: 'F',
      precipitation: 10,
      humidity: 55,
      windSpeed: 8,
      iconUrl: 'weather_partly_cloudy.png',
      forecast: 'Partly cloudy with a slight chance of showers in the afternoon'
    },
    isAiGenerated: false,
    userRsvpStatus: EventTypes.RSVPStatus.GOING,
    metadata: {}
  },
  {
    id: 'event-3',
    name: 'Board Game Night',
    description: 'Join us for a fun evening of strategy and party games. Beginners welcome!',
    eventType: EventTypes.EventType.GAMES_ENTERTAINMENT,
    location: 'Mox Boarding House, Bellevue',
    coordinates: { latitude: 47.6142, longitude: -122.1949 },
    venueId: 'venue-3',
    venueDetails: {
      id: 'venue-3',
      name: 'Mox Boarding House',
      address: '13310 Bel-Red Rd, Bellevue, WA 98005',
      coordinates: { latitude: 47.6142, longitude: -122.1949 },
      phoneNumber: '+14254516394',
      website: 'https://www.moxboardinghouse.com/bellevue',
      rating: 4.7,
      priceLevel: 2,
      photos: ['mox_1.jpg', 'mox_2.jpg'],
      openingHours: {
        'Monday': '11:00 AM - 12:00 AM',
        'Tuesday': '11:00 AM - 12:00 AM',
        'Wednesday': '11:00 AM - 12:00 AM',
        'Thursday': '11:00 AM - 12:00 AM',
        'Friday': '11:00 AM - 2:00 AM',
        'Saturday': '10:00 AM - 2:00 AM',
        'Sunday': '10:00 AM - 12:00 AM'
      },
      amenities: ['Board Games', 'Restaurant', 'Bar', 'Retail Store']
    },
    startTime: new Date('2023-07-18T18:00:00Z'),
    endTime: new Date('2023-07-18T22:00:00Z'),
    tribeId: 'tribe-3',
    tribe: getTribeById('tribe-3'),
    createdBy: 'user-8',
    createdAt: new Date('2023-07-08T20:15:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_board_game_night.jpg',
    attendees: [
      {
        id: 'attendee-3-1',
        eventId: 'event-3',
        userId: 'user-8',
        profile: getBasicUserInfo('user-8'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-08T20:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-3-2',
        eventId: 'event-3',
        userId: 'user-10',
        profile: getBasicUserInfo('user-10'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-09T10:45:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-3-3',
        eventId: 'event-3',
        userId: 'user-11',
        profile: getBasicUserInfo('user-11'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-09T15:20:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-3-4',
        eventId: 'event-3',
        userId: 'user-9',
        profile: getBasicUserInfo('user-9'),
        rsvpStatus: EventTypes.RSVPStatus.MAYBE,
        rsvpTime: new Date('2023-07-10T11:10:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 4,
    maxAttendees: 8,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: null,
    isAiGenerated: false,
    userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
    metadata: {}
  },
  {
    id: 'event-4',
    name: 'Outdoor Movie Night',
    description: 'Movie under the stars at Gasworks Park. Bring blankets and snacks!',
    eventType: EventTypes.EventType.ENTERTAINMENT,
    location: 'Gasworks Park, Seattle',
    coordinates: { latitude: 47.6456, longitude: -122.3344 },
    venueId: 'venue-4',
    venueDetails: {
      id: 'venue-4',
      name: 'Gasworks Park',
      address: '2101 N Northlake Way, Seattle, WA 98103',
      coordinates: { latitude: 47.6456, longitude: -122.3344 },
      phoneNumber: '+12066844075',
      website: 'https://www.seattle.gov/parks/find/parks/gas-works-park',
      rating: 4.7,
      priceLevel: 0,
      photos: ['gasworks_1.jpg', 'gasworks_2.jpg'],
      openingHours: {
        'Monday': '6:00 AM - 10:00 PM',
        'Tuesday': '6:00 AM - 10:00 PM',
        'Wednesday': '6:00 AM - 10:00 PM',
        'Thursday': '6:00 AM - 10:00 PM',
        'Friday': '6:00 AM - 10:00 PM',
        'Saturday': '6:00 AM - 10:00 PM',
        'Sunday': '6:00 AM - 10:00 PM'
      },
      amenities: ['Parking', 'Restrooms', 'Picnic Areas', 'Water Views']
    },
    startTime: new Date('2023-07-21T20:00:00Z'),
    endTime: new Date('2023-07-21T23:00:00Z'),
    tribeId: 'tribe-1',
    tribe: getTribeById('tribe-1'),
    createdBy: 'user-2',
    createdAt: new Date('2023-07-10T16:45:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_outdoor_movie.jpg',
    attendees: [
      {
        id: 'attendee-4-1',
        eventId: 'event-4',
        userId: 'user-2',
        profile: getBasicUserInfo('user-2'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-10T17:00:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-4-2',
        eventId: 'event-4',
        userId: 'user-1',
        profile: getBasicUserInfo('user-1'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-11T09:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-4-3',
        eventId: 'event-4',
        userId: 'user-3',
        profile: getBasicUserInfo('user-3'),
        rsvpStatus: EventTypes.RSVPStatus.MAYBE,
        rsvpTime: new Date('2023-07-11T14:15:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 3,
    maxAttendees: 8,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.CLEAR,
      temperature: 68,
      temperatureUnit: 'F',
      precipitation: 0,
      humidity: 50,
      windSpeed: 3,
      iconUrl: 'weather_clear_night.png',
      forecast: 'Clear skies and mild temperatures, perfect for an outdoor movie'
    },
    isAiGenerated: true,
    userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
    metadata: {
      movieTitle: 'The Great Outdoors',
      movieGenre: 'Comedy',
      aiRecommendationReason: 'Based on your tribe\'s interest in outdoor activities and entertainment'
    }
  },
  {
    id: 'event-5',
    name: 'Farmers Market Tour',
    description: 'Let\'s explore Pike Place Market together! We\'ll visit various vendors, sample local foods, and learn about the market\'s history.',
    eventType: EventTypes.EventType.FOOD_DINING,
    location: 'Pike Place Market, Seattle',
    coordinates: { latitude: 47.6097, longitude: -122.3422 },
    venueId: 'venue-5',
    venueDetails: {
      id: 'venue-5',
      name: 'Pike Place Market',
      address: '85 Pike St, Seattle, WA 98101',
      coordinates: { latitude: 47.6097, longitude: -122.3422 },
      phoneNumber: '+12066827453',
      website: 'http://pikeplacemarket.org/',
      rating: 4.8,
      priceLevel: 2,
      photos: ['pike_place_1.jpg', 'pike_place_2.jpg'],
      openingHours: {
        'Monday': '9:00 AM - 6:00 PM',
        'Tuesday': '9:00 AM - 6:00 PM',
        'Wednesday': '9:00 AM - 6:00 PM',
        'Thursday': '9:00 AM - 6:00 PM',
        'Friday': '9:00 AM - 6:00 PM',
        'Saturday': '9:00 AM - 6:00 PM',
        'Sunday': '9:00 AM - 6:00 PM'
      },
      amenities: ['Food Vendors', 'Craft Stalls', 'Restaurants', 'Historic Site']
    },
    startTime: new Date('2023-07-22T10:00:00Z'),
    endTime: new Date('2023-07-22T13:00:00Z'),
    tribeId: 'tribe-2',
    tribe: getTribeById('tribe-2'),
    createdBy: 'user-5',
    createdAt: new Date('2023-07-12T13:20:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_farmers_market.jpg',
    attendees: [
      {
        id: 'attendee-5-1',
        eventId: 'event-5',
        userId: 'user-5',
        profile: getBasicUserInfo('user-5'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-12T13:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 1,
    maxAttendees: 8,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.SUNNY,
      temperature: 74,
      temperatureUnit: 'F',
      precipitation: 0,
      humidity: 48,
      windSpeed: 6,
      iconUrl: 'weather_sunny.png',
      forecast: 'Sunny and pleasant throughout the morning'
    },
    isAiGenerated: true,
    userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
    metadata: {
      aiRecommendationReason: 'Based on your tribe\'s interest in food and dining experiences',
      tourHighlights: ['Fresh produce vendors', 'Artisanal food shops', 'Craft stalls', 'Historic market features']
    }
  },
  {
    id: 'event-6',
    name: 'Yoga in the Park',
    description: 'Join us for a relaxing morning yoga session at Green Lake Park. All skill levels welcome. Bring your own mat!',
    eventType: EventTypes.EventType.WELLNESS_MINDFULNESS,
    location: 'Green Lake Park, Seattle',
    coordinates: { latitude: 47.6806, longitude: -122.3294 },
    venueId: 'venue-6',
    venueDetails: {
      id: 'venue-6',
      name: 'Green Lake Park',
      address: '7201 E Green Lake Dr N, Seattle, WA 98115',
      coordinates: { latitude: 47.6806, longitude: -122.3294 },
      phoneNumber: '+12066844075',
      website: 'https://www.seattle.gov/parks/find/parks/green-lake-park',
      rating: 4.8,
      priceLevel: 0,
      photos: ['greenlake_1.jpg', 'greenlake_2.jpg'],
      openingHours: {
        'Monday': '6:00 AM - 10:00 PM',
        'Tuesday': '6:00 AM - 10:00 PM',
        'Wednesday': '6:00 AM - 10:00 PM',
        'Thursday': '6:00 AM - 10:00 PM',
        'Friday': '6:00 AM - 10:00 PM',
        'Saturday': '6:00 AM - 10:00 PM',
        'Sunday': '6:00 AM - 10:00 PM'
      },
      amenities: ['Parking', 'Restrooms', 'Walking Paths', 'Lake Access']
    },
    startTime: new Date('2023-07-23T09:00:00Z'),
    endTime: new Date('2023-07-23T10:30:00Z'),
    tribeId: 'tribe-8',
    tribe: getTribeById('tribe-8'),
    createdBy: 'user-9',
    createdAt: new Date('2023-07-14T08:45:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_yoga_park.jpg',
    attendees: [
      {
        id: 'attendee-6-1',
        eventId: 'event-6',
        userId: 'user-9',
        profile: getBasicUserInfo('user-9'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-14T09:00:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-6-2',
        eventId: 'event-6',
        userId: 'user-7',
        profile: getBasicUserInfo('user-7'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-14T10:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-6-3',
        eventId: 'event-6',
        userId: 'user-4',
        profile: getBasicUserInfo('user-4'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-14T14:15:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 3,
    maxAttendees: 10,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.SUNNY,
      temperature: 70,
      temperatureUnit: 'F',
      precipitation: 0,
      humidity: 55,
      windSpeed: 4,
      iconUrl: 'weather_sunny.png',
      forecast: 'Sunny and mild, perfect for outdoor yoga'
    },
    isAiGenerated: false,
    userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
    metadata: {
      instructor: 'Emma Thompson',
      yogaStyle: 'Hatha',
      skillLevel: 'All levels'
    }
  },
  {
    id: 'event-7',
    name: 'Tech Meetup: AI Innovations',
    description: 'Join us for an evening discussing the latest in AI technology. We\'ll have speakers, networking, and demos of cutting-edge AI applications.',
    eventType: EventTypes.EventType.EDUCATIONAL,
    location: 'Startup Hall, Seattle',
    coordinates: { latitude: 47.6610, longitude: -122.3151 },
    venueId: 'venue-7',
    venueDetails: {
      id: 'venue-7',
      name: 'Startup Hall',
      address: '1100 NE Campus Parkway, Seattle, WA 98105',
      coordinates: { latitude: 47.6610, longitude: -122.3151 },
      phoneNumber: '+12065551234',
      website: 'https://www.startuphall.org',
      rating: 4.6,
      priceLevel: 0,
      photos: ['startup_hall_1.jpg', 'startup_hall_2.jpg'],
      openingHours: {
        'Monday': '9:00 AM - 5:00 PM',
        'Tuesday': '9:00 AM - 5:00 PM',
        'Wednesday': '9:00 AM - 5:00 PM',
        'Thursday': '9:00 AM - 5:00 PM',
        'Friday': '9:00 AM - 5:00 PM'
      },
      amenities: ['Wi-Fi', 'Projector', 'Seating', 'Refreshments']
    },
    startTime: new Date('2023-07-25T18:00:00Z'),
    endTime: new Date('2023-07-25T21:00:00Z'),
    tribeId: 'tribe-7',
    tribe: getTribeById('tribe-7'),
    createdBy: 'user-10',
    createdAt: new Date('2023-07-15T10:30:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_tech_meetup.jpg',
    attendees: [
      {
        id: 'attendee-7-1',
        eventId: 'event-7',
        userId: 'user-10',
        profile: getBasicUserInfo('user-10'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-15T10:45:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-7-2',
        eventId: 'event-7',
        userId: 'user-6',
        profile: getBasicUserInfo('user-6'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-15T13:20:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-7-3',
        eventId: 'event-7',
        userId: 'user-11',
        profile: getBasicUserInfo('user-11'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-15T15:10:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 3,
    maxAttendees: 20,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: null,
    isAiGenerated: false,
    userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
    metadata: {
      speakers: ['Dr. Sarah Chen, AI Researcher', 'Mike Johnson, Tech Entrepreneur'],
      agenda: ['6:00 PM - Networking', '6:30 PM - Presentations', '8:00 PM - Demos and Discussion']
    }
  },
  {
    id: 'event-8',
    name: 'Photography Walk: Urban Architecture',
    description: 'Join us for a photography walk focusing on Seattle\'s urban architecture. Bring your camera and capture the city\'s unique buildings and structures.',
    eventType: EventTypes.EventType.ARTS_CULTURE,
    location: 'Downtown Seattle',
    coordinates: { latitude: 47.6062, longitude: -122.3321 },
    venueId: 'venue-8',
    venueDetails: {
      id: 'venue-8',
      name: 'Seattle Central Library',
      address: '1000 4th Ave, Seattle, WA 98104',
      coordinates: { latitude: 47.6062, longitude: -122.3321 },
      phoneNumber: '+12063864636',
      website: 'https://www.spl.org/hours-and-locations/central-library',
      rating: 4.7,
      priceLevel: 0,
      photos: ['central_library_1.jpg', 'central_library_2.jpg'],
      openingHours: {
        'Monday': '10:00 AM - 8:00 PM',
        'Tuesday': '10:00 AM - 8:00 PM',
        'Wednesday': '10:00 AM - 8:00 PM',
        'Thursday': '10:00 AM - 8:00 PM',
        'Friday': '10:00 AM - 6:00 PM',
        'Saturday': '10:00 AM - 6:00 PM',
        'Sunday': '12:00 PM - 6:00 PM'
      },
      amenities: ['Architectural Landmark', 'Meeting Point', 'Restrooms', 'Cafe']
    },
    startTime: new Date('2023-07-29T14:00:00Z'),
    endTime: new Date('2023-07-29T17:00:00Z'),
    tribeId: 'tribe-4',
    tribe: getTribeById('tribe-4'),
    createdBy: 'user-4',
    createdAt: new Date('2023-07-16T09:15:00Z'),
    status: EventTypes.EventStatus.SCHEDULED,
    imageUrl: 'event_photography_walk.jpg',
    attendees: [
      {
        id: 'attendee-8-1',
        eventId: 'event-8',
        userId: 'user-4',
        profile: getBasicUserInfo('user-4'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-16T09:30:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-8-2',
        eventId: 'event-8',
        userId: 'user-2',
        profile: getBasicUserInfo('user-2'),
        rsvpStatus: EventTypes.RSVPStatus.GOING,
        rsvpTime: new Date('2023-07-16T11:45:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      },
      {
        id: 'attendee-8-3',
        eventId: 'event-8',
        userId: 'user-1',
        profile: getBasicUserInfo('user-1'),
        rsvpStatus: EventTypes.RSVPStatus.MAYBE,
        rsvpTime: new Date('2023-07-16T14:20:00Z'),
        hasCheckedIn: false,
        checkedInAt: null,
        paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED
      }
    ],
    attendeeCount: 3,
    maxAttendees: 8,
    cost: 0,
    paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
    weatherData: {
      condition: EventTypes.WeatherCondition.SUNNY,
      temperature: 76,
      temperatureUnit: 'F',
      precipitation: 0,
      humidity: 45,
      windSpeed: 5,
      iconUrl: 'weather_sunny.png',
      forecast: 'Sunny with clear skies, perfect for photography'
    },
    isAiGenerated: true,
    userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
    metadata: {
      photographyTips: ['Bring a wide-angle lens', 'Consider the light and shadows', 'Look for unique perspectives'],
      featuredBuildings: ['Seattle Central Library', 'Smith Tower', 'Columbia Center', 'Seattle Municipal Tower'],
      aiRecommendationReason: 'Based on your tribe\'s interest in photography and urban exploration'
    }
  }
];

const mockEventSuggestions: EventTypes.EventSuggestion[] = [
  {
    event: {
      id: 'suggestion-1',
      name: 'Outdoor Movie Night',
      description: 'Movie under the stars at Gasworks Park. Bring blankets and snacks!',
      eventType: EventTypes.EventType.ENTERTAINMENT,
      location: 'Gasworks Park, Seattle',
      coordinates: { latitude: 47.6456, longitude: -122.3344 },
      venueId: 'venue-4',
      venueDetails: {
        id: 'venue-4',
        name: 'Gasworks Park',
        address: '2101 N Northlake Way, Seattle, WA 98103',
        coordinates: { latitude: 47.6456, longitude: -122.3344 },
        phoneNumber: '+12066844075',
        website: 'https://www.seattle.gov/parks/find/parks/gas-works-park',
        rating: 4.7,
        priceLevel: 0,
        photos: ['gasworks_1.jpg', 'gasworks_2.jpg'],
        openingHours: {
          'Monday': '6:00 AM - 10:00 PM',
          'Tuesday': '6:00 AM - 10:00 PM',
          'Wednesday': '6:00 AM - 10:00 PM',
          'Thursday': '6:00 AM - 10:00 PM',
          'Friday': '6:00 AM - 10:00 PM',
          'Saturday': '6:00 AM - 10:00 PM',
          'Sunday': '6:00 AM - 10:00 PM'
        },
        amenities: ['Parking', 'Restrooms', 'Picnic Areas', 'Water Views']
      },
      startTime: new Date('2023-07-21T20:00:00Z'),
      endTime: new Date('2023-07-21T23:00:00Z'),
      tribeId: 'tribe-1',
      createdBy: 'ai-system',
      createdAt: new Date('2023-07-10T16:45:00Z'),
      status: EventTypes.EventStatus.DRAFT,
      imageUrl: 'event_outdoor_movie.jpg',
      attendees: [],
      attendeeCount: 0,
      maxAttendees: 8,
      cost: 0,
      paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
      weatherData: {
        condition: EventTypes.WeatherCondition.CLEAR,
        temperature: 68,
        temperatureUnit: 'F',
        precipitation: 0,
        humidity: 50,
        windSpeed: 3,
        iconUrl: 'weather_clear_night.png',
        forecast: 'Clear skies and mild temperatures, perfect for an outdoor movie'
      },
      isAiGenerated: true,
      userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
      metadata: {
        movieTitle: 'The Great Outdoors',
        movieGenre: 'Comedy',
        aiRecommendationReason: 'Based on your tribe\'s interest in outdoor activities and entertainment'
      }
    },
    matchScore: 92,
    matchReasons: [
      'Aligns with your tribe\'s outdoor interests',
      'Perfect weather conditions forecasted',
      'Similar to activities your tribe has enjoyed before',
      'Free event that fits your tribe\'s preferences'
    ],
    suggestedAt: new Date('2023-07-10T16:45:00Z'),
    weatherSuitability: 95,
    budgetFriendliness: 100
  },
  {
    event: {
      id: 'suggestion-2',
      name: 'Farmers Market Tour',
      description: 'Let\'s explore Pike Place Market together! We\'ll visit various vendors, sample local foods, and learn about the market\'s history.',
      eventType: EventTypes.EventType.FOOD_DINING,
      location: 'Pike Place Market, Seattle',
      coordinates: { latitude: 47.6097, longitude: -122.3422 },
      venueId: 'venue-5',
      venueDetails: {
        id: 'venue-5',
        name: 'Pike Place Market',
        address: '85 Pike St, Seattle, WA 98101',
        coordinates: { latitude: 47.6097, longitude: -122.3422 },
        phoneNumber: '+12066827453',
        website: 'http://pikeplacemarket.org/',
        rating: 4.8,
        priceLevel: 2,
        photos: ['pike_place_1.jpg', 'pike_place_2.jpg'],
        openingHours: {
          'Monday': '9:00 AM - 6:00 PM',
          'Tuesday': '9:00 AM - 6:00 PM',
          'Wednesday': '9:00 AM - 6:00 PM',
          'Thursday': '9:00 AM - 6:00 PM',
          'Friday': '9:00 AM - 6:00 PM',
          'Saturday': '9:00 AM - 6:00 PM',
          'Sunday': '9:00 AM - 6:00 PM'
        },
        amenities: ['Food Vendors', 'Craft Stalls', 'Restaurants', 'Historic Site']
      },
      startTime: new Date('2023-07-22T10:00:00Z'),
      endTime: new Date('2023-07-22T13:00:00Z'),
      tribeId: 'tribe-2',
      createdBy: 'ai-system',
      createdAt: new Date('2023-07-12T13:20:00Z'),
      status: EventTypes.EventStatus.DRAFT,
      imageUrl: 'event_farmers_market.jpg',
      attendees: [],
      attendeeCount: 0,
      maxAttendees: 8,
      cost: 0,
      paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
      weatherData: {
        condition: EventTypes.WeatherCondition.SUNNY,
        temperature: 74,
        temperatureUnit: 'F',
        precipitation: 0,
        humidity: 48,
        windSpeed: 6,
        iconUrl: 'weather_sunny.png',
        forecast: 'Sunny and pleasant throughout the morning'
      },
      isAiGenerated: true,
      userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
      metadata: {
        aiRecommendationReason: 'Based on your tribe\'s interest in food and dining experiences',
        tourHighlights: ['Fresh produce vendors', 'Artisanal food shops', 'Craft stalls', 'Historic market features']
      }
    },
    matchScore: 88,
    matchReasons: [
      'Matches your tribe\'s interest in food and dining',
      'Excellent weather forecast for the activity',
      'Highly-rated venue that offers diverse experiences',
      'Free activity with optional spending on food'
    ],
    suggestedAt: new Date('2023-07-12T13:20:00Z'),
    weatherSuitability: 90,
    budgetFriendliness: 85
  },
  {
    event: {
      id: 'suggestion-3',
      name: 'Photography Walk: Urban Architecture',
      description: 'Join us for a photography walk focusing on Seattle\'s urban architecture. Bring your camera and capture the city\'s unique buildings and structures.',
      eventType: EventTypes.EventType.ARTS_CULTURE,
      location: 'Downtown Seattle',
      coordinates: { latitude: 47.6062, longitude: -122.3321 },
      venueId: 'venue-8',
      venueDetails: {
        id: 'venue-8',
        name: 'Seattle Central Library',
        address: '1000 4th Ave, Seattle, WA 98104',
        coordinates: { latitude: 47.6062, longitude: -122.3321 },
        phoneNumber: '+12063864636',
        website: 'https://www.spl.org/hours-and-locations/central-library',
        rating: 4.7,
        priceLevel: 0,
        photos: ['central_library_1.jpg', 'central_library_2.jpg'],
        openingHours: {
          'Monday': '10:00 AM - 8:00 PM',
          'Tuesday': '10:00 AM - 8:00 PM',
          'Wednesday': '10:00 AM - 8:00 PM',
          'Thursday': '10:00 AM - 8:00 PM',
          'Friday': '10:00 AM - 6:00 PM',
          'Saturday': '10:00 AM - 6:00 PM',
          'Sunday': '12:00 PM - 6:00 PM'
        },
        amenities: ['Architectural Landmark', 'Meeting Point', 'Restrooms', 'Cafe']
      },
      startTime: new Date('2023-07-29T14:00:00Z'),
      endTime: new Date('2023-07-29T17:00:00Z'),
      tribeId: 'tribe-4',
      createdBy: 'ai-system',
      createdAt: new Date('2023-07-16T09:15:00Z'),
      status: EventTypes.EventStatus.DRAFT,
      imageUrl: 'event_photography_walk.jpg',
      attendees: [],
      attendeeCount: 0,
      maxAttendees: 8,
      cost: 0,
      paymentStatus: EventTypes.PaymentStatus.NOT_REQUIRED,
      weatherData: {
        condition: EventTypes.WeatherCondition.SUNNY,
        temperature: 76,
        temperatureUnit: 'F',
        precipitation: 0,
        humidity: 45,
        windSpeed: 5,
        iconUrl: 'weather_sunny.png',
        forecast: 'Sunny with clear skies, perfect for photography'
      },
      isAiGenerated: true,
      userRsvpStatus: EventTypes.RSVPStatus.NO_RESPONSE,
      metadata: {
        photographyTips: ['Bring a wide-angle lens', 'Consider the light and shadows', 'Look for unique perspectives'],
        featuredBuildings: ['Seattle Central Library', 'Smith Tower', 'Columbia Center', 'Seattle Municipal Tower'],
        aiRecommendationReason: 'Based on your tribe\'s interest in photography and urban exploration'
      }
    },
    matchScore: 85,
    matchReasons: [
      'Aligns with your tribe\'s interest in photography',
      'Perfect weather conditions for outdoor photography',
      'Includes architectural landmarks your members would enjoy',
      'Free activity with educational components'
    ],
    suggestedAt: new Date('2023-07-16T09:15:00Z'),
    weatherSuitability: 95,
    budgetFriendliness: 100
  }
];

const mockOptimalTimeSlots: EventTypes.OptimalTimeSlot[] = [
  {
    startTime: new Date('2023-07-15T10:00:00Z'),
    endTime: new Date('2023-07-15T14:00:00Z'),
    availableMembers: 5,
    totalMembers: 6,
    availabilityPercentage: 83,
    weatherCondition: EventTypes.WeatherCondition.SUNNY,
    recommendationScore: 95
  },
  {
    startTime: new Date('2023-07-16T14:00:00Z'),
    endTime: new Date('2023-07-16T17:00:00Z'),
    availableMembers: 4,
    totalMembers: 6,
    availabilityPercentage: 67,
    weatherCondition: EventTypes.WeatherCondition.PARTLY_CLOUDY,
    recommendationScore: 85
  },
  {
    startTime: new Date('2023-07-22T10:00:00Z'),
    endTime: new Date('2023-07-22T13:00:00Z'),
    availableMembers: 6,
    totalMembers: 6,
    availabilityPercentage: 100,
    weatherCondition: EventTypes.WeatherCondition.SUNNY,
    recommendationScore: 98
  }
];

/**
 * Helper function to find an event by ID
 * @param eventId - Event ID to search for
 * @returns The found event or undefined
 */
const getEventById = (eventId: string): EventTypes.Event | undefined => {
  return mockEvents.find(event => event.id === eventId);
};

/**
 * Helper function to find events for a specific tribe
 * @param tribeId - Tribe ID to search for
 * @returns Array of events for the specified tribe
 */
const getEventsByTribeId = (tribeId: string): EventTypes.Event[] => {
  return mockEvents.filter(event => event.tribeId === tribeId);
};

/**
 * Helper function to get upcoming events
 * @returns Array of upcoming events
 */
const getUpcomingEvents = (): EventTypes.Event[] => {
  const now = new Date();
  return mockEvents
    .filter(event => event.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

/**
 * Helper function to get AI-suggested events
 * @param tribeId - Tribe ID to get suggestions for
 * @returns Array of event suggestions for the specified tribe
 */
const getEventSuggestions = (tribeId: string): EventTypes.EventSuggestion[] => {
  return mockEventSuggestions.filter(suggestion => suggestion.event.tribeId === tribeId);
};

/**
 * Helper function to get optimal time slots for scheduling
 * @param tribeId - Tribe ID to get time slots for
 * @returns Array of optimal time slots for the specified tribe
 */
const getOptimalTimeSlots = (tribeId: string): EventTypes.OptimalTimeSlot[] => {
  // In a real implementation, this would filter by tribeId
  return mockOptimalTimeSlots;
};

export {
  mockEvents,
  mockEventSuggestions,
  mockOptimalTimeSlots,
  getEventById,
  getEventsByTribeId,
  getUpcomingEvents,
  getEventSuggestions,
  getOptimalTimeSlots
};

export default {
  mockEvents,
  mockEventSuggestions,
  mockOptimalTimeSlots,
  getEventById,
  getEventsByTribeId,
  getUpcomingEvents,
  getEventSuggestions,
  getOptimalTimeSlots
};