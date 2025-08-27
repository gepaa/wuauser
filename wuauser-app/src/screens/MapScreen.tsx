import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Alert, Animated, BackHandler } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  CheckIcon,
  Switch,
  Slider,
  Badge,
  Pressable,
  Icon,
  Input,
  Modal,
  Divider,
  Center,
  Spinner
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { mapService, ClinicLocation, SearchFilters } from '../services/mapService';
import chipTrackingService from '../services/chipTrackingService';
import { PetLocation } from '../types/chipTracking';
import { colors } from '../constants/colors';
import { navigationTester } from '../utils/navigationTest';

interface MapScreenProps {
  navigation: any;
}

type MapMode = 'clinicas' | 'mascotas' | 'ambos';

interface FilterState {
  radius: number;
  emergency24h: boolean;
  emergencyOnly: boolean;
  minRating: number;
  specialties: string[];
  services: string[];
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  
  // Log navigation to MapScreen
  React.useEffect(() => {
    navigationTester.logNavigation('MapScreen');
  }, []);
  
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [clinicas, setClinicas] = useState<ClinicLocation[]>([]);
  const [petsWithChip, setPetsWithChip] = useState<PetLocation[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>('clinicas');
  const [pulseAnimations, setPulseAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    radius: 5,
    emergency24h: false,
    emergencyOnly: false,
    minRating: 0,
    specialties: [],
    services: []
  });

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return false;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    initializeMap();
    loadPetsWithChip();
    
    // Set up interval to update pet locations
    const interval = setInterval(() => {
      if (mapMode !== 'clinicas') {
        loadPetsWithChip();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [mapMode]);

  useEffect(() => {
    if (location && mapMode !== 'mascotas') {
      searchClinics();
    }
  }, [filters, location, mapMode]);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Necesitamos permisos de ubicación para mostrar clínicas cercanas');
        setIsLoading(false);
        return;
      }
      
      // Get current location
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
      // Set default location (Mexico City)
      setLocation({
        latitude: 19.4326,
        longitude: -99.1332,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      });
    }
  };

  const searchClinics = useCallback(async () => {
    if (!location) return;
    
    try {
      setIsLoading(true);
      const searchFilters: SearchFilters = {
        radius_km: filters.radius,
        emergency_only: filters.emergencyOnly,
        open_24h_only: filters.emergency24h,
        min_rating: filters.minRating,
        specialties: filters.specialties,
        services: filters.services
      };

      let result;
      if (searchQuery.trim()) {
        // Use smart search if there's a query
        result = await mapService.smartSearch(location, searchFilters);
      } else {
        // Use regular search
        result = await mapService.searchNearbyClinics(location, searchFilters);
      }
      
      if (result.data) {
        setClinicas(result.data);
      } else if (result.error) {
        console.error('Error searching clinics:', result.error);
        Alert.alert('Error', 'No se pudieron cargar las clínicas veterinarias');
      }
    } catch (error) {
      console.error('Error in searchClinics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location, filters, searchQuery]);

  const loadPetsWithChip = async () => {
    try {
      const pets = await chipTrackingService.getPetsWithLocation();
      setPetsWithChip(pets);
      
      // Initialize pulse animations for each pet
      const animations: { [key: string]: Animated.Value } = {};
      pets.forEach(pet => {
        animations[pet.petId] = new Animated.Value(1);
        startPulseAnimation(animations[pet.petId]);
      });
      setPulseAnimations(animations);
    } catch (error) {
      console.error('Error loading pets with chip:', error);
    }
  };

  const startPulseAnimation = (animValue: Animated.Value) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleClinicPress = (clinic: ClinicLocation) => {
    navigation.navigate('VetPublicProfile', { vetId: clinic.id });
  };

  const handlePetMarkerPress = (pet: PetLocation) => {
    Alert.alert(
      `Ubicación de ${pet.petName || 'Mascota'}`,
      `Última actualización: ${new Date(pet.timestamp).toLocaleTimeString()}\nBatería: ${pet.battery}%\nSeñal: ${pet.signal === 'strong' ? 'Fuerte' : pet.signal === 'medium' ? 'Media' : 'Débil'}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { 
          text: 'Ver Detalle', 
          onPress: () => navigation.navigate('PetDetail', { petId: pet.petId })
        }
      ]
    );
  };

  const getStatusColor = (pet: PetLocation) => {
    const timeSinceUpdate = Date.now() - new Date(pet.timestamp).getTime();
    
    if (timeSinceUpdate > 60 * 60 * 1000) return '#95A5A6'; // Grey: No signal > 1 hour
    if (timeSinceUpdate > 10 * 60 * 1000) return '#FF9800'; // Orange: > 10 min
    if (pet.signal === 'weak' || pet.battery < 20) return '#FF9800'; // Orange: Weak signal or low battery
    return '#27AE60'; // Green: Strong signal, recent update
  };

  const applyFilters = () => {
    setShowFilters(false);
    searchClinics();
  };

  const resetFilters = () => {
    setFilters({
      radius: 5,
      emergency24h: false,
      emergencyOnly: false,
      minRating: 0,
      specialties: [],
      services: []
    });
    setSearchQuery('');
  };

  const renderHeader = () => {
    return (
      <VStack space={3} p={4} bg={colors.background} safeAreaTop>
        {/* Search Bar */}
        <HStack space={2} alignItems="center">
          <Input
            flex={1}
            placeholder="Buscar clínicas o servicios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => searchClinics()}
            InputLeftElement={
              <Icon as={<Ionicons name="search" />} size={5} ml={2} color="muted.400" />
            }
            bg="white"
            borderRadius="lg"
          />
          <Pressable onPress={() => setShowFilters(true)}>
            <Icon as={<Ionicons name="options" />} size={6} color={colors.primary} />
          </Pressable>
        </HStack>

        {/* Mode Selector */}
        <HStack space={1} bg="white" borderRadius="lg" p={1}>
          {[
            { key: 'clinicas' as MapMode, label: 'Clínicas', icon: 'medical' },
            { key: 'mascotas' as MapMode, label: 'Mis Mascotas', icon: 'paw' },
            { key: 'ambos' as MapMode, label: 'Ambos', icon: 'map' }
          ].map(({ key, label, icon }) => (
            <Pressable
              key={key}
              flex={1}
              onPress={() => setMapMode(key)}
              bg={mapMode === key ? colors.primary : 'transparent'}
              borderRadius="md"
              py={2}
              alignItems="center"
            >
              <HStack space={1} alignItems="center">
                <Icon 
                  as={<Ionicons name={icon} />} 
                  size={4} 
                  color={mapMode === key ? 'white' : colors.text} 
                />
                <Text 
                  fontSize="sm" 
                  fontWeight="500"
                  color={mapMode === key ? 'white' : colors.text}
                >
                  {label}
                </Text>
              </HStack>
            </Pressable>
          ))}
        </HStack>

        {/* Active Filters Indicator */}
        {(filters.emergencyOnly || filters.emergency24h || filters.minRating > 0) && (
          <HStack space={2} flexWrap="wrap">
            {filters.emergencyOnly && (
              <Badge colorScheme="red" variant="subtle">
                Solo Emergencias
              </Badge>
            )}
            {filters.emergency24h && (
              <Badge colorScheme="orange" variant="subtle">
                24 Horas
              </Badge>
            )}
            {filters.minRating > 0 && (
              <Badge colorScheme="yellow" variant="subtle">
                Min {filters.minRating}⭐
              </Badge>
            )}
          </HStack>
        )}
      </VStack>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        as={<Ionicons name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'} />}
        size={3}
        color={colors.primary}
      />
    ));
  };

  const renderFiltersModal = () => {
    return (
      <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} size="full">
        <Modal.Content bg={colors.background}>
          <Modal.CloseButton />
          <Modal.Header bg={colors.background} borderBottomColor={colors.border}>
            <Text fontSize="lg" fontWeight="bold" color={colors.text}>
              Filtros de Búsqueda
            </Text>
          </Modal.Header>
          <Modal.Body px={4} py={6}>
            <VStack space={6} flex={1}>
              {/* Radio */}
              <Box>
                <Text fontSize="md" fontWeight="600" mb={3} color={colors.text}>
                  Radio de búsqueda: {filters.radius} km
                </Text>
                <Slider
                  value={filters.radius}
                  minValue={5}
                  maxValue={50}
                  step={5}
                  onChange={(value) => setFilters(prev => ({ ...prev, radius: value }))}
                  colorScheme="yellow"
                >
                  <Slider.Track bg="gray.300">
                    <Slider.FilledTrack bg={colors.primary} />
                  </Slider.Track>
                  <Slider.Thumb bg={colors.primary} />
                </Slider>
                <HStack justifyContent="space-between" mt={2}>
                  <Text fontSize="sm" color="muted.500">5 km</Text>
                  <Text fontSize="sm" color="muted.500">50 km</Text>
                </HStack>
              </Box>

              <Divider />

              {/* Rating */}
              <Box>
                <Text fontSize="md" fontWeight="600" mb={3} color={colors.text}>
                  Calificación mínima
                </Text>
                <Select
                  selectedValue={filters.minRating.toString()}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))}
                  placeholder="Cualquier calificación"
                  _selectedItem={{
                    bg: colors.primary,
                    endIcon: <CheckIcon size={5} />
                  }}
                >
                  <Select.Item label="Cualquier calificación" value="0" />
                  <Select.Item label="3.0 estrellas o más" value="3" />
                  <Select.Item label="4.0 estrellas o más" value="4" />
                  <Select.Item label="4.5 estrellas o más" value="4.5" />
                </Select>
              </Box>

              <Divider />

              {/* Emergency Filters */}
              <VStack space={4}>
                <Text fontSize="md" fontWeight="600" color={colors.text}>
                  Servicios de Emergencia
                </Text>
                
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="sm" color={colors.text}>Solo clínicas de emergencia</Text>
                  <Switch
                    isChecked={filters.emergencyOnly}
                    onToggle={(value) => setFilters(prev => ({ ...prev, emergencyOnly: value }))}
                    colorScheme="yellow"
                  />
                </HStack>
                
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="sm" color={colors.text}>Abiertas 24 horas</Text>
                  <Switch
                    isChecked={filters.emergency24h}
                    onToggle={(value) => setFilters(prev => ({ ...prev, emergency24h: value }))}
                    colorScheme="yellow"
                  />
                </HStack>
              </VStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer bg={colors.background} borderTopColor={colors.border}>
            <HStack space={3} width="100%" justifyContent="center">
              <Button
                variant="ghost"
                onPress={resetFilters}
                flex={1}
              >
                <Text color={colors.text}>Limpiar</Text>
              </Button>
              <Button
                bg={colors.primary}
                onPress={applyFilters}
                flex={1}
                _pressed={{ bg: colors.primary + '80' }}
              >
                <Text color="white" fontWeight="600">Aplicar Filtros</Text>
              </Button>
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    );
  };

  return (
    <Box flex={1} bg={colors.background}>
      {renderHeader()}
      
      {/* Loading Indicator */}
      {isLoading && (
        <Center position="absolute" top={0} left={0} right={0} bottom={0} zIndex={10}>
          <Box bg="white" p={4} borderRadius="lg" shadow={2}>
            <VStack space={3} alignItems="center">
              <Spinner size="lg" color={colors.primary} />
              <Text color={colors.text}>Buscando clínicas...</Text>
            </VStack>
          </Box>
        </Center>
      )}
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
        initialRegion={{
          latitude: 19.4326,
          longitude: -99.1332,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Clinic markers */}
        {mapMode !== 'mascotas' && clinicas.map(clinic => (
          <Marker
            key={clinic.id}
            coordinate={{ 
              latitude: clinic.latitude, 
              longitude: clinic.longitude 
            }}
          >
            {/* Custom Clinic Marker */}
            <Box alignItems="center">
              <Box
                bg={clinic.is_emergency ? colors.secondary : colors.primary}
                p={2}
                borderRadius="full"
                borderWidth={2}
                borderColor="white"
                shadow={3}
              >
                <Icon
                  as={<Ionicons name={clinic.is_emergency ? "medical" : "medical-outline"} />}
                  size={5}
                  color="white"
                />
              </Box>
              {clinic.is_24hours && (
                <Badge
                  position="absolute"
                  top={-1}
                  right={-1}
                  bg={colors.secondary}
                  _text={{ fontSize: "xs", color: "white" }}
                  borderRadius="full"
                >
                  24h
                </Badge>
              )}
            </Box>
            
            <Callout 
              onPress={() => handleClinicPress(clinic)}
              style={styles.callout}
            >
              <Box p={3} minW={280} maxW={320}>
                <HStack justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Text fontSize="md" fontWeight="bold" color={colors.text} flex={1} mr={2}>
                    {clinic.clinic_name}
                  </Text>
                  {clinic.is_verified && (
                    <Icon as={<Ionicons name="checkmark-circle" />} size={4} color="#27AE60" />
                  )}
                </HStack>
                
                <HStack alignItems="center" mb={2}>
                  <HStack mr={2}>
                    {renderStars(clinic.rating)}
                  </HStack>
                  <Text fontSize="sm" color="muted.500">
                    {clinic.rating.toFixed(1)} ({clinic.total_reviews})
                  </Text>
                </HStack>
                
                <Text fontSize="sm" color="muted.600" mb={3}>
                  {clinic.address}, {clinic.city}
                </Text>
                
                {clinic.distance_km && (
                  <Text fontSize="sm" color="muted.500" mb={2}>
                    📍 {clinic.distance_km.toFixed(1)} km de distancia
                  </Text>
                )}
                
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={2}>
                    {clinic.is_emergency && (
                      <Badge colorScheme="red" variant="subtle" size="sm">
                        Emergencias
                      </Badge>
                    )}
                    {clinic.is_24hours && (
                      <Badge colorScheme="orange" variant="subtle" size="sm">
                        24h
                      </Badge>
                    )}
                  </HStack>
                  
                  <HStack alignItems="center">
                    <Text fontSize="sm" color={colors.primary} fontWeight="600" mr={1}>
                      Ver Perfil
                    </Text>
                    <Icon as={<Ionicons name="chevron-forward" />} size={3} color={colors.primary} />
                  </HStack>
                </HStack>
              </Box>
            </Callout>
          </Marker>
        ))}
        
        {/* Pet markers */}
        {mapMode !== 'clinicas' && petsWithChip.map(pet => (
          <Marker
            key={pet.petId}
            coordinate={{
              latitude: pet.latitude,
              longitude: pet.longitude
            }}
            onPress={() => handlePetMarkerPress(pet)}
          >
            <Box alignItems="center" justifyContent="center" w={10} h={10}>
              <Box
                w={8}
                h={8}
                borderRadius="full"
                bg={getStatusColor(pet)}
                borderWidth={2}
                borderColor="white"
                alignItems="center"
                justifyContent="center"
                zIndex={2}
              >
                <Icon as={<Ionicons name="paw" />} size={4} color="white" />
              </Box>
              {pulseAnimations[pet.petId] && (
                <Animated.View 
                  style={[
                    styles.pulseAnimation,
                    {
                      backgroundColor: getStatusColor(pet),
                      transform: [{ scale: pulseAnimations[pet.petId] }]
                    }
                  ]} 
                />
              )}
            </Box>
          </Marker>
        ))}
      </MapView>
      
      {/* Status Bar */}
      {(clinicas.length > 0 || petsWithChip.length > 0) && (
        <Box position="absolute" bottom={10} left={4} right={4}>
          <HStack bg="white" p={3} borderRadius="lg" shadow={3} justifyContent="space-around">
            {mapMode !== 'mascotas' && (
              <VStack alignItems="center">
                <Text fontSize="lg" fontWeight="bold" color={colors.primary}>
                  {clinicas.length}
                </Text>
                <Text fontSize="xs" color="muted.500">Clínicas</Text>
              </VStack>
            )}
            {mapMode !== 'clinicas' && (
              <VStack alignItems="center">
                <Text fontSize="lg" fontWeight="bold" color="#27AE60">
                  {petsWithChip.length}
                </Text>
                <Text fontSize="xs" color="muted.500">Mascotas</Text>
              </VStack>
            )}
          </HStack>
        </Box>
      )}
      
      {renderFiltersModal()}
    </Box>
  );
};

const styles = StyleSheet.create({
  map: { 
    flex: 1
  },
  callout: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  pulseAnimation: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.3,
    zIndex: 1,
  },
});