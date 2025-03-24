import React, { useEffect, useCallback } from 'react'; // react v^18.2.0
import { View, Text, TouchableOpacity } from 'react-native'; // react-native v0.72.3
import { SafeAreaView } from 'react-native-safe-area-context'; // react-native-safe-area-context v^4.6.3
import { useDispatch, useSelector } from 'react-redux'; // react-redux v^8.1.1
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v^6.1.6
import Icon from 'react-native-vector-icons/MaterialIcons'; // react-native-vector-icons/MaterialIcons v^9.2.0
import TribeCreationForm from '../../../components/tribe/TribeCreationForm';
import { TribeNavigationProp } from '../../../types/navigation.types';
import { ROUTES } from '../../../constants/navigationRoutes';
import { useSelector } from '../../../store/hooks';
import { tribeActions } from '../../../store/slices/tribeSlice';
import { theme } from '../../../theme';
import { 
  ScreenContainer,
  HeaderContainer,
} from './CreateTribeScreen.styles';

/**
 * Screen component for creating a new tribe
 */
const CreateTribeScreen: React.FC = () => {
  // Get navigation object using useNavigation hook
  const navigation = useNavigation<TribeNavigationProp>();

  // Get Redux dispatch function using useDispatch hook
  const dispatch = useDispatch();

  // Get tribe creation status from Redux store using useSelector
  const tribeCreationStatus = useSelector((state: any) => state.tribes.tribeCreationStatus);

  /**
   * Define handleSuccess function to navigate back to the discovery screen on successful tribe creation
   */
  const handleSuccess = useCallback(() => {
    navigation.navigate(ROUTES.MAIN.DISCOVER);
  }, [navigation]);

  /**
   * Define handleCancel function to navigate back without creating a tribe
   */
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Use useEffect to reset tribe creation status when component unmounts
   */
  useEffect(() => {
    return () => {
      dispatch(tribeActions.resetTribeCreationStatus());
    };
  }, [dispatch]);

  // Render the screen with a header and the TribeCreationForm component
  return (
    <ScreenContainer>
      {/* Header with back button and title */}
      <HeaderContainer>
        {/* Back button to navigate back */}
        <TouchableOpacity onPress={handleCancel}>
          <Icon name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={{ 
          flex: 1, 
          textAlign: 'center', 
          fontSize: 18, 
          fontWeight: 'bold',
          color: theme.colors.text.primary
        }}>
          Create a Tribe
        </Text>
      </HeaderContainer>

      {/* Pass handleSuccess and handleCancel callbacks to the TribeCreationForm */}
      <TribeCreationForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </ScreenContainer>
  );
};

// Export the CreateTribeScreen component as the default export
export default CreateTribeScreen;