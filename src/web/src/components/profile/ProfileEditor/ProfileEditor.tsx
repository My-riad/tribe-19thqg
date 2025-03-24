import React, { useState, useEffect, useRef } from 'react'; // react v^18.0.0
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform 
} from 'react-native'; // react-native ^0.70.0
import { useProfile } from '../../../hooks/useProfile';
import Input from '../../ui/Input/Input';
import Button from '../../ui/Button/Button';
import Avatar from '../../ui/Avatar/Avatar';
import LoadingIndicator from '../../ui/LoadingIndicator/LoadingIndicator';
import { 
  ProfileEditorContainer, 
  FormSection, 
  AvatarSection,
  ErrorText,
  ButtonContainer
} from './ProfileEditor.styles';
import { 
  ProfileUpdateRequest,
} from '../../../types/profile.types';
import { mediaService } from '../../../services/mediaService';
import { 
  isRequired,
  isPhone,
  isValidAge,
  maxLength,
  validateForm
} from '../../../utils/validation';

/**
 * Interface defining the props for the ProfileEditor component
 */
interface ProfileEditorProps {
  initialData?: Partial<ProfileUpdateRequest>;
  onComplete?: (profile: any) => void;
  onCancel?: () => void;
}

/**
 * Interface defining the structure for the form data
 */
interface FormData {
  name: string;
  bio: string;
  location: string;
  birthdate: string;
  phoneNumber: string;
  maxTravelDistance: number;
  availableDays: string[];
}

/**
 * Interface defining the structure for form validation errors
 */
interface FormErrors {
  name?: string;
  bio?: string;
  location?: string;
  birthdate?: string;
  phoneNumber?: string;
  maxTravelDistance?: string;
  availableDays?: string;
  general?: string;
}

/**
 * A form component that allows users to edit their profile information
 */
const ProfileEditor: React.FC<ProfileEditorProps> = ({ initialData, onComplete, onCancel }) => {
  // Destructure props including onComplete callback and initialData
  // Get profile state and methods from useProfile hook
  const { profile, loading, error, updateUserProfile, uploadAvatar, clearProfileError } = useProfile();

  // Initialize form state with initialData or empty values
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || profile?.name || '',
    bio: initialData?.bio || profile?.bio || '',
    location: initialData?.location || profile?.location || '',
    birthdate: initialData?.birthdate ? new Date(initialData.birthdate).toISOString().split('T')[0] : profile?.birthdate ? new Date(profile.birthdate).toISOString().split('T')[0] : '',
    phoneNumber: initialData?.phoneNumber || profile?.phoneNumber || '',
    maxTravelDistance: initialData?.maxTravelDistance || profile?.maxTravelDistance || 50,
    availableDays: initialData?.availableDays || profile?.availableDays || [],
  });

  // Initialize form validation errors state
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize avatar upload state
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Create handler for input change events
  const handleInputChange = (name: string, value: string | number | string[]) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Create handler for avatar selection
  const handleAvatarSelect = async () => {
    try {
      const image = await mediaService.pickImage();
      if (image) {
        setSelectedAvatar(image.uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select avatar.');
    }
  };

  // Create handler for form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    clearProfileError();

    // Validate form data before submission
    const validationRules = {
      name: isRequired,
      bio: (bio: string) => maxLength(bio, 500),
      location: isRequired,
      birthdate: isValidAge,
      phoneNumber: isPhone,
    };
    const validationErrors = validateForm(formData, validationRules);
    setErrors(validationErrors);

    // If validation passes, update profile using updateUserProfile
    if (Object.keys(validationErrors).length === 0) {
      try {
        const profileData: ProfileUpdateRequest = {
          ...formData,
          birthdate: formData.birthdate,
          coordinates: profile?.coordinates, // Retain existing coordinates
          avatarUrl: profile?.avatarUrl, // Retain existing avatar URL
          coverImageUrl: profile?.coverImageUrl, // Retain existing cover image URL
          availableTimeRanges: profile?.availableTimeRanges, // Retain existing available time ranges
        };

        // Update profile using updateUserProfile
        const updatedProfile = await updateUserProfile(profileData);

        // If avatar was selected, upload it using uploadAvatar
        if (selectedAvatar) {
          const avatarFormData = new FormData();
          avatarFormData.append('file', {
            uri: selectedAvatar,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          } as any);
          await uploadAvatar(avatarFormData);
        }

        // Handle success by calling onComplete callback
        if (onComplete) {
          onComplete(updatedProfile);
        }
      } catch (err: any) {
        // Handle errors by displaying error messages
        setErrors({ general: err?.message || 'Failed to update profile.' });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  // Render form with sections for avatar, personal info, and bio
  return (
    <ProfileEditorContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AvatarSection>
          <TouchableOpacity onPress={handleAvatarSelect} disabled={isSubmitting}>
            <Avatar
              source={selectedAvatar ? { uri: selectedAvatar } : profile?.avatarUrl ? { uri: profile.avatarUrl } : undefined}
              size="xl"
              name={formData.name}
            />
          </TouchableOpacity>
          {errors.general && <ErrorText>{errors.general}</ErrorText>}
        </AvatarSection>

        <FormSection>
          <Input
            label="Display Name"
            placeholder="Enter your display name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            error={errors.name}
            disabled={isSubmitting}
          />

          <Input
            label="Location"
            placeholder="Enter your location"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            error={errors.location}
            disabled={isSubmitting}
          />

          <Input
            label="Birthdate"
            placeholder="YYYY-MM-DD"
            value={formData.birthdate}
            onChangeText={(text) => handleInputChange('birthdate', text)}
            error={errors.birthdate}
            disabled={isSubmitting}
          />

          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange('phoneNumber', text)}
            error={errors.phoneNumber}
            keyboardType="phone-pad"
            disabled={isSubmitting}
          />
        </FormSection>

        <FormSection>
          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={formData.bio}
            onChangeText={(text) => handleInputChange('bio', text)}
            error={errors.bio}
            multiline
            numberOfLines={4}
            disabled={isSubmitting}
          />
        </FormSection>

        {/* Render submit button with loading state */}
        <ButtonContainer>
          <Button
            onPress={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>
          <Button
            variant="secondary"
            onPress={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </ButtonContainer>
      </ScrollView>
    </ProfileEditorContainer>
  );
};

export default ProfileEditor;