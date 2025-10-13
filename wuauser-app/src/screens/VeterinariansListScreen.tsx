import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { veterinarianService, VeterinarianData, SearchFilters } from '../services/veterinarianService';
import { Colors } from '../constants/colors';

interface VeterinariansListScreenProps {
  navigation: any;
}

export const VeterinariansListScreen: React.FC<VeterinariansListScreenProps> = ({ navigation }) => {
  const [veterinarians, setVeterinarians] = useState<VeterinarianData[]>([]);
  const [filteredVets, setFilteredVets] = useState<VeterinarianData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});

  useEffect(() => {
    loadVeterinarians();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [veterinarians, searchQuery, activeFilters]);

  const loadVeterinarians = async () => {
    try {
      setIsLoading(true);
      const result = await veterinarianService.getNearbyVeterinarians();

      if (result.data) {
        setVeterinarians(result.data);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error loading veterinarians:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...veterinarians];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vet =>
        vet.name.toLowerCase().includes(query) ||
        vet.specialties.some(spec => spec.toLowerCase().includes(query)) ||
        vet.location.city.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros adicionales
    if (activeFilters.isOpen) {
      filtered = filtered.filter(vet => vet.isOpen);
    }

    if (activeFilters.isEmergency) {
      filtered = filtered.filter(vet => vet.isEmergency);
    }

    if (activeFilters.minRating) {
      filtered = filtered.filter(vet => vet.rating >= activeFilters.minRating!);
    }

    if (activeFilters.specialty) {
      filtered = filtered.filter(vet =>
        vet.specialties.some(spec =>
          spec.toLowerCase().includes(activeFilters.specialty!.toLowerCase())
        )
      );
    }

    // Ordenar por distancia
    filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setFilteredVets(filtered);
  };

  const toggleFilter = (filterKey: keyof SearchFilters, value?: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? undefined : value
    }));
  };

  const handleVetPress = (vet: VeterinarianData) => {
    navigation.navigate('VetDetail', {
      vetId: vet.id,
      vetData: vet
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadVeterinarians();
    setRefreshing(false);
  }, []);

  const renderVetCard = (vet: VeterinarianData) => (
    <TouchableOpacity
      key={vet.id}
      style={styles.vetCard}
      onPress={() => handleVetPress(vet)}
    >
      <View style={styles.vetImageContainer}>
        {vet.photos.length > 0 ? (
          <Image source={{ uri: vet.photos[0] }} style={styles.vetImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="medical" size={30} color="#999" />
          </View>
        )}

        {vet.isEmergency && (
          <View style={styles.emergencyBadge}>
            <Ionicons name="warning" size={12} color="#FFF" />
          </View>
        )}

        {vet.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </View>

      <View style={styles.vetInfo}>
        <View style={styles.vetHeader}>
          <Text style={styles.vetName} numberOfLines={1}>{vet.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{vet.rating}</Text>
            <Text style={styles.reviewCount}>({vet.reviewCount})</Text>
          </View>
        </View>

        <View style={styles.vetDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.detailText}>
              {vet.distance ? `${vet.distance.toFixed(1)} km` : vet.location.city}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={[styles.detailText, vet.isOpen ? styles.openText : styles.closedText]}>
              {vet.isOpen ? 'Abierto ahora' : 'Cerrado'}
            </Text>
          </View>
        </View>

        <View style={styles.specialties}>
          {vet.specialties.slice(0, 2).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {vet.specialties.length > 2 && (
            <Text style={styles.moreSpecialties}>+{vet.specialties.length - 2} más</Text>
          )}
        </View>
      </View>

      <View style={styles.vetActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert('Llamar', `¿Deseas llamar a ${vet.name}?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Llamar', onPress: () => {} }
            ]);
          }}
        >
          <Ionicons name="call-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert('Chat', 'Función de chat disponible próximamente');
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Buscando veterinarios cercanos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con búsqueda */}
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar veterinarios, especialidades..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilters.isOpen && styles.activeFilter]}
            onPress={() => toggleFilter('isOpen', true)}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={activeFilters.isOpen ? '#FFF' : '#4CAF50'}
            />
            <Text style={[styles.filterText, activeFilters.isOpen && styles.activeFilterText]}>
              Abierto ahora
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilters.isEmergency && styles.activeFilter]}
            onPress={() => toggleFilter('isEmergency', true)}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color={activeFilters.isEmergency ? '#FFF' : '#FF9500'}
            />
            <Text style={[styles.filterText, activeFilters.isEmergency && styles.activeFilterText]}>
              Emergencias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilters.minRating === 4.5 && styles.activeFilter]}
            onPress={() => toggleFilter('minRating', 4.5)}
          >
            <Ionicons
              name="star-outline"
              size={16}
              color={activeFilters.minRating === 4.5 ? '#FFF' : '#FFD700'}
            />
            <Text style={[styles.filterText, activeFilters.minRating === 4.5 && styles.activeFilterText]}>
              Mejor valorados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilters.specialty === 'Cirugía' && styles.activeFilter]}
            onPress={() => toggleFilter('specialty', 'Cirugía')}
          >
            <Ionicons
              name="medical-outline"
              size={16}
              color={activeFilters.specialty === 'Cirugía' ? '#FFF' : '#E85D4E'}
            />
            <Text style={[styles.filterText, activeFilters.specialty === 'Cirugía' && styles.activeFilterText]}>
              Cirugía
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.resultsCount}>
          {filteredVets.length} veterinario{filteredVets.length !== 1 ? 's' : ''} encontrado{filteredVets.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      {/* Lista de veterinarios */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredVets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>No se encontraron veterinarios</Text>
            <Text style={styles.emptyDescription}>
              Intenta ajustar tus filtros de búsqueda o amplía el área de búsqueda
            </Text>
          </View>
        ) : (
          filteredVets.map(renderVetCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilter: {
    backgroundColor: '#F4B740',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeFilterText: {
    color: '#FFF',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  vetCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vetImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  vetImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF9500',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
  },
  vetInfo: {
    flex: 1,
  },
  vetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  vetDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  openText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  closedText: {
    color: '#F44336',
    fontWeight: '500',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  specialtyTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  vetActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default VeterinariansListScreen;