import * as ImagePicker from 'expo-image-picker'; // expo-image-picker v^14.1.1
import * as FileSystem from 'expo-file-system'; // expo-file-system v^15.2.0
import { manipulateAsync } from 'expo-image-manipulator'; // expo-image-manipulator v^11.1.0
import { profileApi, tribeApi, eventApi } from '../api';
import { storageService } from './storageService';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Opens the device image gallery to select an image
 * @param options Options for the image picker
 * @returns Promise resolving to the selected image information or null if cancelled
 */
const pickImage = async (options?: ImagePicker.ImagePickerOptions): Promise<{ uri: string; width: number; height: number; } | null> => {
  // Request permissions to access the media library
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (!permissionResult.granted) {
    console.log('Permission to access media library was denied');
    return null;
  }

  // Default options if none provided
  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    ...options
  };

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

  // Handle cancellation
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const selectedAsset = result.assets[0];
  
  return {
    uri: selectedAsset.uri,
    width: selectedAsset.width || 0,
    height: selectedAsset.height || 0
  };
};

/**
 * Opens the device camera to capture a new photo
 * @param options Options for the camera
 * @returns Promise resolving to the captured image information or null if cancelled
 */
const takePhoto = async (options?: ImagePicker.ImagePickerOptions): Promise<{ uri: string; width: number; height: number; } | null> => {
  // Request permissions to access the camera
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  
  if (!permissionResult.granted) {
    console.log('Permission to access camera was denied');
    return null;
  }

  // Default options if none provided
  const cameraOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    ...options
  };

  // Launch camera
  const result = await ImagePicker.launchCameraAsync(cameraOptions);

  // Handle cancellation
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const capturedAsset = result.assets[0];
  
  return {
    uri: capturedAsset.uri,
    width: capturedAsset.width || 0,
    height: capturedAsset.height || 0
  };
};

/**
 * Processes an image by resizing and optimizing it for upload
 * @param uri URI of the image to process
 * @param options Options for processing
 * @returns Promise resolving to the processed image information
 */
const processImage = async (
  uri: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png';
  }
): Promise<{ uri: string; width: number; height: number }> => {
  // Default options if none provided
  const processingOptions = {
    width: 1200,
    height: 1200,
    quality: 0.8,
    format: 'jpeg' as 'jpeg' | 'png',
    ...options
  };

  // Process the image using the image manipulator
  const result = await manipulateAsync(
    uri,
    [
      {
        resize: {
          width: processingOptions.width,
          height: processingOptions.height
        }
      }
    ],
    {
      compress: processingOptions.quality,
      format: processingOptions.format
    }
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height
  };
};

/**
 * Uploads a profile image to the server
 * @param uri URI of the image to upload
 * @param userId User ID for the profile image
 * @returns Promise resolving to upload success status and media URL
 */
const uploadProfileImage = async (
  uri: string,
  userId: string
): Promise<{ success: boolean; mediaUrl: string }> => {
  try {
    // Process image for profile photo (square format, optimized size)
    const processedImage = await processImage(uri, {
      width: 500,
      height: 500,
      quality: 0.8,
      format: 'jpeg'
    });

    // Create form data for upload
    const formData = new FormData();
    
    // Get the filename from the URI
    const uriParts = processedImage.uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Append the image file
    formData.append('file', {
      uri: processedImage.uri,
      name: fileName,
      type: 'image/jpeg'
    } as any);
    
    // Add metadata
    formData.append('mediaType', 'profile');
    
    // Upload the image
    const response = await profileApi.uploadProfileMedia(formData, 'avatar');
    
    // Cache the image URL for offline access
    if (response.success) {
      const cacheKey = `profile_image_${userId}`;
      await storageService.storeData(cacheKey, {
        url: response.data.mediaUrl,
        timestamp: Date.now()
      });
    }
    
    return {
      success: response.success,
      mediaUrl: response.data.mediaUrl
    };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Uploads a tribe image to the server
 * @param uri URI of the image to upload
 * @param tribeId Tribe ID for the image
 * @returns Promise resolving to upload success status and media URL
 */
const uploadTribeImage = async (
  uri: string,
  tribeId: string
): Promise<{ success: boolean; mediaUrl: string }> => {
  try {
    // Process image for tribe photo (wider format, optimized size)
    const processedImage = await processImage(uri, {
      width: 800,
      height: 600,
      quality: 0.8,
      format: 'jpeg'
    });

    // Create form data for upload
    const formData = new FormData();
    
    // Get the filename from the URI
    const uriParts = processedImage.uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Append the image file
    formData.append('file', {
      uri: processedImage.uri,
      name: fileName,
      type: 'image/jpeg'
    } as any);
    
    // Add metadata
    formData.append('tribeId', tribeId);
    formData.append('mediaType', 'tribe');
    
    // Upload the image using the tribe API
    // We assume tribeApi has a similar method to profileApi.uploadProfileMedia
    const url = `${tribeId}/media`;
    const response = await tribeApi.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Cache the image URL for offline access
    if (response.success) {
      const cacheKey = `tribe_image_${tribeId}`;
      await storageService.storeData(cacheKey, {
        url: response.data.mediaUrl,
        timestamp: Date.now()
      });
    }
    
    return {
      success: response.success,
      mediaUrl: response.data.mediaUrl
    };
  } catch (error) {
    console.error('Error uploading tribe image:', error);
    throw error;
  }
};

/**
 * Uploads event-related media to the server
 * @param uri URI of the media to upload
 * @param eventId Event ID for the media
 * @param mediaType Type of media (e.g., 'photo', 'cover')
 * @returns Promise resolving to upload success status and media URL
 */
const uploadEventMedia = async (
  uri: string,
  eventId: string,
  mediaType: string
): Promise<{ success: boolean; mediaUrl: string }> => {
  try {
    // Process image for event media (optimized size)
    const processedImage = await processImage(uri, {
      width: 1200,
      height: 900,
      quality: 0.85,
      format: 'jpeg'
    });

    // Create form data for upload
    const formData = new FormData();
    
    // Get the filename from the URI
    const uriParts = processedImage.uri.split('/');
    const fileName = uriParts[uriParts.length - 1];
    
    // Append the image file
    formData.append('file', {
      uri: processedImage.uri,
      name: fileName,
      type: 'image/jpeg'
    } as any);
    
    // Add metadata
    formData.append('eventId', eventId);
    formData.append('mediaType', mediaType);
    
    // Upload the image using the event API
    // We assume eventApi has a similar method to profileApi.uploadProfileMedia
    const url = `${eventId}/media`;
    const response = await eventApi.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Cache the image URL for offline access
    if (response.success) {
      const cacheKey = `event_image_${eventId}_${mediaType}`;
      await storageService.storeData(cacheKey, {
        url: response.data.mediaUrl,
        timestamp: Date.now()
      });
    }
    
    return {
      success: response.success,
      mediaUrl: response.data.mediaUrl
    };
  } catch (error) {
    console.error('Error uploading event media:', error);
    throw error;
  }
};

/**
 * Gets the dimensions of an image from its URI
 * @param uri URI of the image
 * @returns Promise resolving to image dimensions or null if failed
 */
const getImageDimensions = async (
  uri: string
): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height
      });
    };
    
    image.onerror = (error) => {
      console.error('Error getting image dimensions:', error);
      reject(error);
    };
    
    image.src = uri;
  });
};

/**
 * Clears cached media files to free up storage space
 * @returns Promise that resolves when cache is cleared
 */
const clearMediaCache = async (): Promise<void> => {
  try {
    // Get all storage keys
    const allKeys = await storageService.getAllKeys();
    
    // Filter for media cache keys
    const mediaCacheKeys = allKeys.filter(key => 
      key.startsWith('profile_image_') || 
      key.startsWith('tribe_image_') || 
      key.startsWith('event_image_')
    );
    
    // Remove each cached item
    for (const key of mediaCacheKeys) {
      await storageService.removeData(key);
    }
    
    // Clear FileSystem cache if possible
    if (FileSystem.cacheDirectory) {
      const mediaDir = `${FileSystem.cacheDirectory}media/`;
      try {
        await FileSystem.deleteAsync(mediaDir, { idempotent: true });
      } catch (error) {
        // Directory might not exist, which is fine
        console.log('Media cache directory not found or already cleared');
      }
    }
    
    console.log('Media cache cleared successfully');
  } catch (error) {
    console.error('Error clearing media cache:', error);
    throw error;
  }
};

// Export the media service
export const mediaService = {
  pickImage,
  takePhoto,
  processImage,
  uploadProfileImage,
  uploadTribeImage,
  uploadEventMedia,
  getImageDimensions,
  clearMediaCache
};