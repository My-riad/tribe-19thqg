import React, { useState, useEffect, useCallback, useMemo } from 'react'; // React v18.2.0
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'; // React Native v0.70.0
import { useNavigation } from '@react-navigation/native'; // @react-navigation/native v6.0.0
import { Ionicons } from '@expo/vector-icons'; // @expo/vector-icons v13.0.0
import debounce from 'lodash'; // lodash v4.17.21

import {
  Container,
  Header,
  Title,
  SearchContainer,
  SearchInput,
  SearchIcon,
  FilterContainer,
  FilterButton,
  FilterButtonText,
  SectionTitle,
  TribeListContainer,
  EmptyStateContainer,
  EmptyStateText,
  CreateTribeButton,
  CreateTribeButtonText,
  LoadingContainer,
} from './DiscoverScreen.styles';
import TribeCard from '../../../components/tribe/TribeCard/TribeCard';
import LoadingIndicator from '../../../components/ui/LoadingIndicator/LoadingIndicator';
import { useTribes } from '../../../hooks/useTribes';
import { useLocation } from '../../../hooks/useLocation';
import { NavigationService } from '../../../navigation/NavigationService';
import { ROUTES } from '../../../constants/navigationRoutes';
import { TribeSearchFilters, Tribe, MainTabNavigationProp } from '../../../types/tribe.types';

/**
 * Interface for filter options in the Discover screen
 */
interface FilterOption {
  id: string;
  label: string;
  value: Partial<TribeSearchFilters>;
}

/**
 * Main component for the Discover screen that allows users to find and join tribes
 */
const DiscoverScreen: React.FC = () => {
  // LD1: Initialize state for search query, active filter, and refreshing status
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('recommended');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // LD1: Get navigation object using useNavigation hook
  const navigation = useNavigation<MainTabNavigationProp<'Discover'>>();

  // LD1: Get tribe-related data and functions using useTribes hook
  const {
    suggestedTribes,
    tribes,
    searchForTribes,
    loading,
    searchLoading,
    setActiveTribe,
    resetCreationStatus,
  } = useTribes();

  // LD1: Get location data and functions using useLocation hook
  const { currentLocation } = useLocation();

  // LD1: Create a debounced search function to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      handleSearch(query);
    }, 300),
    []
  );

  // LD1: Define filter options for tribe discovery
  const filterOptions: FilterOption[] = useMemo(
    () => [
      { id: 'recommended', label: 'Recommended', value: {} },
      { id: 'nearby', label: 'Nearby', value: { location: currentLocation?.location || '', coordinates: currentLocation || { latitude: 0, longitude: 0 }, radius: 10 } },
    ],
    [currentLocation]
  );

  // LD1: Create a memoized search filters object based on active filter and location
  const searchFilters = useMemo(() => {
    const activeFilterOption = filterOptions.find((option) => option.id === activeFilter);
    return {
      query: searchQuery,
      ...(activeFilterOption?.value || {}),
    };
  }, [activeFilter, searchQuery, filterOptions]);

  // LD1: Implement handleSearch function to search tribes based on query
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchForTribes(searchFilters);
    },
    [searchForTribes, searchFilters]
  );

  // LD1: Implement handleFilterPress function to update active filter
  const handleFilterPress = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    handleSearch(''); // Clear search query when filter changes
  }, [handleSearch]);

  // LD1: Implement handleRefresh function to refresh tribe data
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Implement refresh logic here (e.g., refetch tribes)
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // LD1: Implement handleCreateTribe function to navigate to tribe creation screen
  const handleCreateTribe = useCallback(() => {
    resetCreationStatus();
    NavigationService.navigateToTribe(ROUTES.TRIBE.CREATE_TRIBE, {});
  }, [resetCreationStatus]);

  // LD1: Implement handleTribePress function to navigate to tribe details
  const handleTribePress = useCallback((tribeId: string) => {
    setActiveTribe(tribeId);
    NavigationService.navigateToTribe(ROUTES.TRIBE.TRIBE_DETAIL, { tribeId });
  }, [setActiveTribe]);

  // LD1: Use useEffect to fetch suggested tribes on component mount
  useEffect(() => {
    searchForTribes(searchFilters);
  }, [searchForTribes, searchFilters]);

  // LD1: Render the screen layout with header, search input, filters, and tribe sections
  return (
    <Container>
      {/* LD1: Render header with title and action buttons */}
      <Header>
        <Title>Discover</Title>
      </Header>

      {/* LD1: Render search input with debounced search functionality */}
      <SearchContainer>
        <SearchIcon name="ios-search" size={20} />
        <SearchInput
          placeholder="Search for Tribes, interests..."
          value={searchQuery}
          onChangeText={debouncedSearch}
        />
      </SearchContainer>

      {/* LD1: Render filter options with active state styling */}
      <FilterContainer>
        {filterOptions.map((option) => (
          <FilterButton
            key={option.id}
            active={activeFilter === option.id}
            onPress={() => handleFilterPress(option.id)}
          >
            <FilterButtonText active={activeFilter === option.id}>
              {option.label}
            </FilterButtonText>
          </FilterButton>
        ))}
      </FilterContainer>

      {/* LD1: Render recommended tribes section with TribeCard components */}
      <SectionTitle>Recommended Tribes</SectionTitle>
      <TribeList
        tribes={suggestedTribes.map(tribeId => tribes[tribeId]).filter(tribe => tribe !== undefined) as Tribe[]}
        loading={searchLoading}
        onTribePress={handleTribePress}
        emptyMessage="No recommended tribes found"
      />

      {/* LD1: Render create tribe button at the bottom of the screen */}
      <CreateTribeButton onPress={handleCreateTribe}>
        <Ionicons name="add-circle" size={24} color="white" />
        <CreateTribeButtonText>Create a New Tribe</CreateTribeButtonText>
      </CreateTribeButton>
    </Container>
  );
};

/**
 * Component for rendering a list of tribes with appropriate styling
 */
interface TribeListProps {
  tribes: Tribe[];
  loading: boolean;
  onTribePress: (tribeId: string) => void;
  emptyMessage: string;
  showCompatibility?: boolean;
}

const TribeList: React.FC<TribeListProps> = ({ tribes, loading, onTribePress, emptyMessage, showCompatibility = true }) => {
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingIndicator size="large" />
      </LoadingContainer>
    );
  }

  if (tribes.length === 0) {
    return (
      <EmptyStateContainer>
        <EmptyStateText>{emptyMessage}</EmptyStateText>
      </EmptyStateContainer>
    );
  }

  return (
    <TribeListContainer>
      <FlatList
        data={tribes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TribeCard
            tribe={item}
            onPress={onTribePress}
            showCompatibility={showCompatibility}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => {}} />
        }
      />
    </TribeListContainer>
  );
};

export default DiscoverScreen;