import React, { useState, useCallback } from 'react'; // react v^18.2.0
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'; // react-native ^0.70.0
import { useDispatch, useSelector } from 'react-redux'; // react-redux
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { CreateTribeRequest, TribePrivacy } from '../../../types/tribe.types';
import { createTribe } from '../../../store/thunks/tribeThunks';
import { tribeActions } from '../../../store/slices/tribeSlice';
import { mediaService } from '../../../services/mediaService';
import { locationService } from '../../../services/locationService';
import { isRequired, maxLength, validateForm } from '../../../utils/validation';
import { 
  FormContainer, 
  ImageUploadContainer, 
  SectionTitle, 
  RadioGroup,
  ButtonContainer
} from './TribeCreationForm.styles';
import InterestSelection from '../../profile/InterestSelection';

/**
 * Interface defining the props for the TribeCreationForm component
 */
interface TribeCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Interface defining the structure of the form state
 */
interface FormState {
  name: string;
  description: string;
  location: string;
  coordinates: { latitude: number; longitude: number } | null;
  imageUrl: string;
  privacy: TribePrivacy;
  maxMembers: number;
  primaryInterests: string[];
  secondaryInterests: string[];
}

/**
 * Interface defining the structure of form validation errors
 */
interface FormErrors {
  name?: string;
  description?: string;
  location?: string;
  imageUrl?: string;
  primaryInterests?: string;
}

/**
 * Form component for creating a new tribe
 */
const TribeCreationForm: React.FC<TribeCreationFormProps> = ({ onSuccess, onCancel }) => {
  // Initialize form state with default values
  const [formState, setFormState] = useState<FormState>({
    name: '',
    description: '',
    location: '',
    coordinates: null,
    imageUrl: '',
    privacy: TribePrivacy.PUBLIC,
    maxMembers: 8,
    primaryInterests: [],
    secondaryInterests: []
  });

  // Initialize validation errors state
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Initialize loading state for form submission
  const [loading, setLoading] = useState(false);

  // Get Redux dispatch function
  const dispatch = useDispatch();

  // Get tribe creation status from Redux store
  const tribeCreationStatus = useSelector((state: any) => state.tribes.tribeCreationStatus);

  // Define validation rules for form fields
  const validationRules = {
    name: isRequired,
    description: (value: string) => maxLength(value, 200),
    location: isRequired,
    imageUrl: isRequired,
    primaryInterests: (value: string[]) => value.length < 3 ? 'Select at least 3 interests' : undefined
  };

  /**
   * Handles image selection using mediaService
   */
  const handleImageSelect = useCallback(async () => {
    try {
      const image = await mediaService.pickImage();
      if (image) {
        setFormState(prevState => ({ ...prevState, imageUrl: image.uri }));
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, []);

  /**
   * Handles form field changes
   */
  const handleInputChange = useCallback((name: string, value: string) => {
    setFormState(prevState => ({ ...prevState, [name]: value }));
  }, []);

  /**
   * Handle location selection and geocoding
   */
  const handleLocationChange = useCallback(async (location: string) => {
    setFormState(prevState => ({ ...prevState, location }));
    try {
      const coordinates = await locationService.searchLocationByAddress(location);
      setFormState(prevState => ({ ...prevState, coordinates }));
      setFormErrors(prevState => ({ ...prevState, location: undefined }));
    } catch (error) {
      console.error('Error geocoding location:', error);
      setFormErrors(prevState => ({ ...prevState, location: 'Invalid location' }));
      setFormState(prevState => ({ ...prevState, coordinates: null }));
    }
  }, []);

  /**
   * Validate form on submission
   */
  const validate = useCallback(() => {
    const errors = validateForm(formState, validationRules);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formState, validationRules]);

  /**
   * Handle form submission by dispatching createTribe action
   */
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const { name, description, location, coordinates, imageUrl, privacy, maxMembers, primaryInterests, secondaryInterests } = formState;
      const tribeData: CreateTribeRequest = {
        name,
        description,
        location,
        coordinates,
        imageUrl,
        coverImageUrl: imageUrl, // Assuming coverImageUrl is the same as imageUrl for now
        privacy,
        maxMembers,
        primaryInterests,
        secondaryInterests
      };
      await dispatch(createTribe(tribeData)).unwrap();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create tribe:', error);
      Alert.alert('Error', 'Failed to create tribe. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dispatch, formState, onSuccess, validate]);

  /**
   * Reset form after successful submission
   */
  React.useEffect(() => {
    if (tribeCreationStatus === 'SUCCESS') {
      setFormState({
        name: '',
        description: '',
        location: '',
        coordinates: null,
        imageUrl: '',
        privacy: TribePrivacy.PUBLIC,
        maxMembers: 8,
        primaryInterests: [],
        secondaryInterests: []
      });
      setFormErrors({});
      dispatch(tribeActions.resetTribeCreationStatus());
    }
  }, [tribeCreationStatus, dispatch]);

  return (
    <FormContainer contentContainerStyle={{ paddingBottom: 20 }}>
      <SectionTitle>Tribe Information</SectionTitle>
      <ImageUploadContainer>
        <TouchableOpacity onPress={handleImageSelect}>
          {formState.imageUrl ? (
            <Image
              source={{ uri: formState.imageUrl }}
              style={{ width: 150, height: 150, borderRadius: 75 }}
            />
          ) : (
            <Text>Upload Tribe Photo</Text>
          )}
        </TouchableOpacity>
        {formErrors.imageUrl && <Text style={{ color: 'red' }}>{formErrors.imageUrl}</Text>}
      </ImageUploadContainer>
      <Input
        label="Tribe Name"
        placeholder="Enter tribe name"
        value={formState.name}
        onChangeText={(text) => handleInputChange('name', text)}
        error={formErrors.name}
      />
      <Input
        label="Description"
        placeholder="Enter tribe description"
        value={formState.description}
        onChangeText={(text) => handleInputChange('description', text)}
        multiline={true}
        numberOfLines={4}
        error={formErrors.description}
      />
      <Input
        label="Location"
        placeholder="Enter location"
        value={formState.location}
        onChangeText={handleLocationChange}
        error={formErrors.location}
      />

      <SectionTitle>Privacy</SectionTitle>
      <RadioGroup>
        <Text>Privacy settings will go here</Text>
      </RadioGroup>

      <SectionTitle>Interests</SectionTitle>
      <InterestSelection />
      {formErrors.primaryInterests && <Text style={{ color: 'red' }}>{formErrors.primaryInterests}</Text>}

      <ButtonContainer>
        <Button title="Cancel" onPress={onCancel} disabled={loading} />
        <Button
          title="Create Tribe"
          onPress={handleSubmit}
          disabled={loading}
          isLoading={loading}
        />
      </ButtonContainer>
    </FormContainer>
  );
};

export default TribeCreationForm;