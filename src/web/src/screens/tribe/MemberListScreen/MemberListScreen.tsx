import React, { useState, useEffect, useCallback, useMemo } from 'react'; // react ^18.2.0
import { FlatList, ActivityIndicator, TouchableOpacity, Text, View } from 'react-native'; // react-native ^0.70.0
import { useRoute, useNavigation } from '@react-navigation/native'; // @react-navigation/native ^6.0.0

import MembersList from '../../../components/tribe/MembersList';
import useTribes from '../../../hooks/useTribes';
import useAuth from '../../../hooks/useAuth';
import { TribeNavigationProp } from '../../../types/navigation.types';
import { TribeMember, MemberRole } from '../../../types/tribe.types';
import { 
  Container, 
  Header, 
  Title, 
  SearchContainer, 
  SearchInput, 
  FilterContainer, 
  FilterButton,
  EmptyStateContainer,
  EmptyStateText
} from './MemberListScreen.styles';

/**
 * Screen component that displays a list of members belonging to a specific tribe
 */
const MemberListScreen = (): JSX.Element => {
  // Get the route parameters using useRoute hook to extract tribeId
  const { params } = useRoute<'TribeDetail'>();
  const { tribeId } = params;

  // Get the navigation object using useNavigation hook
  const navigation = useNavigation<TribeNavigationProp>();

  // Access tribe data and functions using useTribes hook
  const { tribes, getTribeMembers } = useTribes();

  // Access current user information using useAuth hook
  const { user } = useAuth();

  // Set up state for search query, filtered members, selected filter, and loading state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TribeMember[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<MemberRole | 'all'>('all');
  const [loading, setLoading] = useState(false);

  // Fetch tribe members when the component mounts or tribeId changes
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const response = await getTribeMembers(tribeId);
        if (response && response.items) {
          setFilteredMembers(response.items);
        }
      } finally {
        setLoading(false);
      }
    };

    if (tribeId) {
      fetchMembers();
    }
  }, [tribeId, getTribeMembers]);

  // Create a memoized function to filter members based on search query and selected filter
  const filterMembers = useCallback(() => {
    let members = filteredMembers;

    if (searchQuery) {
      members = members.filter(member =>
        member.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      members = members.filter(member => member.role === selectedFilter);
    }

    return members;
  }, [filteredMembers, searchQuery, selectedFilter]);

  // Create a memoized function to handle member selection
  const handleMemberPress = useCallback((member: TribeMember) => {
    // Implement navigation or action when a member is pressed
    console.log('Member pressed:', member);
  }, []);

  // Create a memoized function to handle filter selection
  const handleFilterSelect = useCallback((role: MemberRole | 'all') => {
    setSelectedFilter(role);
  }, []);

  // Create a memoized function to handle search input changes
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Render the screen with header, search input, filter options, and members list
  return (
    <Container>
      <Header>
        <Title>Members</Title>
      </Header>
      <SearchContainer>
        <SearchInput
          placeholder="Search members..."
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
      </SearchContainer>
      <FilterContainer>
        <FilterButton selected={selectedFilter === 'all'} onPress={() => handleFilterSelect('all')}>
          <Text>All</Text>
        </FilterButton>
        <FilterButton selected={selectedFilter === MemberRole.ADMIN} onPress={() => handleFilterSelect(MemberRole.ADMIN)}>
          <Text>Admins</Text>
        </FilterButton>
        <FilterButton selected={selectedFilter === MemberRole.MEMBER} onPress={() => handleFilterSelect(MemberRole.MEMBER)}>
          <Text>Members</Text>
        </FilterButton>
      </FilterContainer>

      {loading ? (
        // Show loading indicator when data is being fetched
        <ActivityIndicator size="large" color="#0000ff" />
      ) : filterMembers().length === 0 ? (
        // Show empty state when no members match the current filters
        <EmptyStateContainer>
          <EmptyStateText>No members match the current filters.</EmptyStateText>
        </EmptyStateContainer>
      ) : (
        // Render the MembersList component with filtered members data
        <MembersList
          members={filterMembers()}
          onMemberPress={handleMemberPress}
          tribeId={tribeId}
        />
      )}
    </Container>
  );
};

export default MemberListScreen;