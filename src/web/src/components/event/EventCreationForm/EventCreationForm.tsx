import React, { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { View, ScrollView, Text, TouchableOpacity, Platform } from 'react-native'; // react-native v0.72.0
import { Formik } from 'formik'; // formik v2.4.1
import { useFormik } from 'formik'; // formik v2.4.1
import DateTimePicker from '@react-native-community/datetimepicker'; // @react-native-community/datetimepicker v7.1.0
import * as Yup from 'yup'; // Yup v1.2.0

import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import { EventTypes } from '../../../types/event.types';
import { eventApi } from '../../../api/eventApi';
import useTribes from '../../../hooks/useTribes';
import { locationService } from '../../../services/locationService';
import { isRequired, validateForm } from '../../../utils/validation';
import {
  FormContainer,
  KeyboardAwareFormContainer,
  ScrollableFormContent,
  FormHeader,
  FormTitle,
  FormSubtitle,
  FormBody,
  FormFieldContainer,
  FormErrorMessage,
  FormFooter,
  SectionDivider,
  SectionTitle,
  DateTimeContainer,
  LocationContainer,
  DescriptionContainer,
  AIOptimizationContainer,
  AIOptimizationText
} from './EventCreationForm.styles';

/**
 * Interface defining the props for the EventCreationForm component
 */
interface EventCreationFormProps {
  initialEvent?: EventTypes.Event;
  tribeId?: string;
  onSuccess?: (event: EventTypes.Event) => void;
  onCancel?: () => void;
}

/**
 * Interface defining the structure of form values for the event creation form
 */
interface FormValues {
  name: string;
  description: string;
  eventType: EventTypes.EventType;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  startTime: Date;
  endTime: Date;
  tribeId: string;
  maxAttendees?: number;
  cost?: number;
  imageUrl?: string;
}

/**
 * Form component for creating and editing events
 * @param props - EventCreationFormProps
 * @returns JSX.Element
 */
const EventCreationForm = (props: EventCreationFormProps): JSX.Element => {
  // Destructure props with default values
  const { initialEvent, tribeId: propTribeId, onSuccess, onCancel } = props;

  // Get tribe data using useTribes hook
  const { tribes, userTribes } = useTribes();

  // Set up state for form submission status, loading state, and optimal time slots
  const [submissionStatus, setSubmissionStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [loading, setLoading] = useState(false);
  const [optimalTimeSlots, setOptimalTimeSlots] = useState<EventTypes.OptimalTimeSlot[]>([]);

  // Initialize Formik with initial values, validation schema, and submit handler
  const {
    handleChange,
    handleBlur,
    handleSubmit,
    values,
    errors,
    touched,
    setFieldValue,
    setFieldError,
    setValues,
    isSubmitting,
  } = useFormik<FormValues>({
    initialValues: {
      name: initialEvent?.name || '',
      description: initialEvent?.description || '',
      eventType: initialEvent?.eventType || EventTypes.EventType.OTHER,
      location: initialEvent?.location || '',
      coordinates: initialEvent?.coordinates || undefined,
      startTime: initialEvent?.startTime || new Date(),
      endTime: initialEvent?.endTime || new Date(new Date().getTime() + 3600000), // 1 hour from now
      tribeId: initialEvent?.tribeId || propTribeId || (userTribes.length > 0 ? userTribes[0] : ''),
      maxAttendees: initialEvent?.maxAttendees || 8,
      cost: initialEvent?.cost || 0,
      imageUrl: initialEvent?.imageUrl || '',
    },
    validationSchema: Yup.object().shape({
      name: Yup.string().required('Event name is required'),
      description: Yup.string().required('Event description is required'),
      eventType: Yup.string().oneOf(Object.values(EventTypes.EventType), 'Invalid event type').required('Event type is required'),
      location: Yup.string().required('Event location is required'),
      startTime: Yup.date().required('Event start time is required'),
      endTime: Yup.date().required('Event end time is required'),
      tribeId: Yup.string().required('Tribe selection is required'),
      maxAttendees: Yup.number().integer().positive('Max attendees must be a positive integer'),
      cost: Yup.number().positive('Cost must be a positive number'),
    }),
    onSubmit: async (values) => {
      setSubmissionStatus('LOADING');
      setLoading(true);
      try {
        if (initialEvent) {
          // Update existing event
          const response = await eventApi.updateEvent(initialEvent.id, values);
          if (response.success) {
            setSubmissionStatus('SUCCESS');
            onSuccess?.(response.data);
          } else {
            setSubmissionStatus('ERROR');
            console.error('Event update failed:', response.message);
          }
        } else {
          // Create new event
          const response = await eventApi.createEvent(values);
          if (response.success) {
            setSubmissionStatus('SUCCESS');
            onSuccess?.(response.data);
          } else {
            setSubmissionStatus('ERROR');
            console.error('Event creation failed:', response.message);
          }
        }
      } catch (error: any) {
        setSubmissionStatus('ERROR');
        console.error('Event submission error:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  // Create function to fetch user's current location
  const handleGetCurrentLocation = async () => {
    try {
      const location = await locationService.getUserLocation();
      setFieldValue('coordinates', location);
      setFieldValue('location', `${location.latitude}, ${location.longitude}`);
    } catch (error: any) {
      setFieldError('location', error.message);
    }
  };

  // Create function to search for location by address
  const handleSearchLocation = async (address: string) => {
    try {
      const location = await locationService.searchLocationByAddress(address);
      setFieldValue('coordinates', location);
    } catch (error: any) {
      setFieldError('location', error.message);
    }
  };

  // Create function to fetch AI-suggested optimal time slots
  const handleGetOptimalTimeSlots = async () => {
    setLoading(true);
    try {
      const response = await eventApi.getOptimalTimeSlots(values.tribeId, {
        startDate: values.startTime.toISOString(),
        endDate: values.endTime.toISOString(),
        duration: (values.endTime.getTime() - values.startTime.getTime()) / 3600000,
        eventType: values.eventType,
      });
      if (response.success) {
        setOptimalTimeSlots(response.data);
      } else {
        console.error('Failed to fetch optimal time slots:', response.message);
      }
    } catch (error: any) {
      console.error('Error fetching optimal time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create function to apply an optimal time slot to the form
  const handleApplyOptimalTimeSlot = (slot: EventTypes.OptimalTimeSlot) => {
    setFieldValue('startTime', new Date(slot.startTime));
    setFieldValue('endTime', new Date(slot.endTime));
    setOptimalTimeSlots([]);
  };

  // Create function to handle event type selection
  const handleEventTypeChange = (eventType: EventTypes.EventType) => {
    setFieldValue('eventType', eventType);
  };

  // Create state variables for date/time pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Create function to handle date/time picker visibility
  const handleShowStartTimePicker = () => {
    setShowStartTimePicker(true);
  };

  const handleShowEndTimePicker = () => {
    setShowEndTimePicker(true);
  };

  // Create function to handle date/time selection
  const handleStartTimeChange = (event: any, selectedDate: Date | undefined) => {
    setShowStartTimePicker(false);
    if (selectedDate) {
      setFieldValue('startTime', selectedDate);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate: Date | undefined) => {
    setShowEndTimePicker(false);
    if (selectedDate) {
      setFieldValue('endTime', selectedDate);
    }
  };

  return (
    <FormContainer>
      <KeyboardAwareFormContainer>
        <ScrollableFormContent>
          <FormHeader>
            <FormTitle>{initialEvent ? 'Edit Event' : 'Create New Event'}</FormTitle>
            <FormSubtitle>Enter the event details below</FormSubtitle>
          </FormHeader>

          <FormBody>
            <FormFieldContainer>
              <Input
                label="Event Name"
                placeholder="Enter event name"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name}
              />
            </FormFieldContainer>

            <FormFieldContainer>
              <Input
                label="Description"
                placeholder="Enter event description"
                value={values.description}
                onChangeText={handleChange('description')}
                onBlur={handleBlur('description')}
                error={touched.description && errors.description}
                multiline={true}
                numberOfLines={4}
              />
            </FormFieldContainer>

            <FormFieldContainer>
              <Text>Event Type</Text>
              <View>
                {Object.values(EventTypes.EventType).map((eventType) => (
                  <TouchableOpacity
                    key={eventType}
                    onPress={() => handleEventTypeChange(eventType)}
                  >
                    <Text>{eventType}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormFieldContainer>

            <FormFieldContainer>
              <Input
                label="Location"
                placeholder="Enter event location"
                value={values.location}
                onChangeText={handleChange('location')}
                onBlur={handleBlur('location')}
                error={touched.location && errors.location}
              />
            </FormFieldContainer>

            <FormFieldContainer>
              <Text>Start Time</Text>
              <TouchableOpacity onPress={handleShowStartTimePicker}>
                <Text>{values.startTime.toLocaleString()}</Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={values.startTime}
                  mode="datetime"
                  is24Hour={true}
                  display="default"
                  onChange={handleStartTimeChange}
                />
              )}
            </FormFieldContainer>

            <FormFieldContainer>
              <Text>End Time</Text>
              <TouchableOpacity onPress={handleShowEndTimePicker}>
                <Text>{values.endTime.toLocaleString()}</Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={values.endTime}
                  mode="datetime"
                  is24Hour={true}
                  display="default"
                  onChange={handleEndTimeChange}
                />
              )}
            </FormFieldContainer>

            <FormFieldContainer>
              <Input
                label="Max Attendees"
                placeholder="Enter maximum number of attendees"
                value={values.maxAttendees?.toString()}
                onChangeText={(text) => setFieldValue('maxAttendees', parseInt(text))}
                onBlur={handleBlur('maxAttendees')}
                error={touched.maxAttendees && errors.maxAttendees}
                keyboardType="number-pad"
              />
            </FormFieldContainer>

            <FormFieldContainer>
              <Input
                label="Cost"
                placeholder="Enter event cost"
                value={values.cost?.toString()}
                onChangeText={(text) => setFieldValue('cost', parseFloat(text))}
                onBlur={handleBlur('cost')}
                error={touched.cost && errors.cost}
                keyboardType="number-pad"
              />
            </FormFieldContainer>
          </FormBody>

          <Button onPress={handleSubmit} disabled={isSubmitting || loading}>
            {initialEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </ScrollableFormContent>
      </KeyboardAwareFormContainer>
    </FormContainer>
  );
};

export default EventCreationForm;