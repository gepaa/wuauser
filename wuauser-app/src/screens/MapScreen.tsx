import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Image, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { veterinarianService, VeterinarianData } from '../services/veterinarianService';
import chipTrackingService from '../services/chipTrackingService';
import { PetLocation, MapMode } from '../types/chipTracking';
import { colors } from '../constants/colors';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [location, setLocation] = useState<any>(null);
  const [veterinarias, setVeterinarias] = useState<VeterinarianData[]>([]);
  const [petsWithChip, setPetsWithChip] = useState<PetLocation[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>('Veterinarias');
  const [pulseAnimations, setPulseAnimations] = useState<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    initializeMap();
    loadPetsWithChip();
    
    // Set up interval to update pet locations
    const interval = setInterval(() => {
      if (mapMode !== 'Veterinarias') {
        loadPetsWithChip();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [mapMode]);

  const initializeMap = async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Necesitamos permisos de ubicación');
        return;
      }
      
      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      
      // Load nearby veterinarians
      const { data: vets, error } = await veterinarianService.getNearbyVeterinarians({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (error) {
        console.error('Error loading veterinarians:', error);
        // Use fallback data
        loadFallbackData();
      } else {
        setVeterinarias(vets || []);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      loadFallbackData();
    }
  };

  const loadFallbackData = () => {
    // Fallback data if service fails
    const fallbackVets: VeterinarianData[] = [
      {
        id: 'vet_001',
        name: 'Clínica Veterinaria San Ángel',
        location: {
          latitude: 19.4326,
          longitude: -99.1332,
          address: 'Av. Universidad 1234',
          city: 'Ciudad de México',
          state: 'CDMX'
        },
        rating: 4.7,
        reviewCount: 142,
        isVerified: true,
        isEmergency: true,
        specialties: ['Medicina Interna', 'Cirugía'],
        services: [],
        schedule: [],
        photos: [],
        created_at: '',
        updated_at: ''
      },
      {
        id: 'vet_002',
        name: 'Hospital Veterinario Roma Norte',
        location: {
          latitude: 19.4280,
          longitude: -99.1400,
          address: 'Av. Álvaro Obregón 45',
          city: 'Ciudad de México',
          state: 'CDMX'
        },
        rating: 4.9,
        reviewCount: 203,
        isVerified: true,
        isEmergency: true,
        specialties: ['Oncología', 'Neurología'],
        services: [],
        schedule: [],
        photos: [],
        created_at: '',
        updated_at: ''
      }
    ];
    setVeterinarias(fallbackVets);
  };

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

  const handleMarkerPress = (vet: VeterinarianData) => {
    navigation.navigate('VetPublicProfile', { vetId: vet.id });
  };

  const handlePetMarkerPress = (pet: PetLocation) => {
    Alert.alert(
      `Ubicación de ${pet.petName}`,
      `Última actualización: ${pet.timestamp.toLocaleTimeString()}\nBatería: ${pet.battery}%\nSeñal: ${pet.signal}`,
      [
        { text: 'Cerrar' },
        { 
          text: 'Ver Detalle', 
          onPress: () => navigation.navigate('PetDetail', { petId: pet.petId })
        }
      ]
    );
  };

  const getStatusColor = (pet: PetLocation) => {
    const timeSinceUpdate = Date.now() - new Date(pet.timestamp).getTime();
    
    if (timeSinceUpdate > 60 * 60 * 1000) return '#999'; // Grey: No signal > 1 hour
    if (timeSinceUpdate > 10 * 60 * 1000) return '#FF9800'; // Yellow: > 10 min
    if (pet.signal === 'weak' || pet.battery < 20) return '#FF9800'; // Yellow: Weak signal or low battery
    return '#4CAF50'; // Green: Strong signal, recent update
  };

  const renderSegmentedControl = () => {
    const modes: MapMode[] = ['Veterinarias', 'Mis Mascotas', 'Ambos'];
    
    return (
      <View style={styles.mapControls}>
        <View style={styles.segmentedControl}>
          {modes.map((mode, index) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.segmentButton,
                mapMode === mode && styles.segmentButtonActive,
                index === 0 && styles.segmentButtonFirst,
                index === modes.length - 1 && styles.segmentButtonLast
              ]}
              onPress={() => setMapMode(mode)}
            >
              <Text style={[
                styles.segmentButtonText,
                mapMode === mode && styles.segmentButtonTextActive
              ]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
        size={12}
        color="#F4B740"
      />
    ));
  };

  return (
    <View style={styles.container}>
      {renderSegmentedControl()}
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 19.4326,
          longitude: -99.1332,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
      >
        {/* Veterinarian markers */}
        {mapMode !== 'Mis Mascotas' && veterinarias.map(vet => (
          <Marker
            key={vet.id}
            coordinate={{ 
              latitude: vet.location.latitude, 
              longitude: vet.location.longitude 
            }}
            pinColor={vet.isEmergency ? '#FF5722' : '#F4B740'}
          >
            <Callout 
              style={styles.callout}
              onPress={() => handleMarkerPress(vet)}
            >
              <View style={styles.calloutContainer}>
                <View style={styles.calloutHeader}>
                  <Text style={styles.calloutTitle}>{vet.name}</Text>
                  {vet.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  )}
                </View>
                
                <View style={styles.calloutRating}>
                  <View style={styles.calloutStars}>
                    {renderStars(vet.rating)}
                  </View>
                  <Text style={styles.calloutRatingText}>
                    {vet.rating.toFixed(1)} ({vet.reviewCount})
                  </Text>
                </View>
                
                <Text style={styles.calloutAddress}>{vet.location.address}</Text>
                
                <View style={styles.calloutFooter}>
                  {vet.isEmergency && (
                    <View style={styles.emergencyBadge}>
                      <Ionicons name="medical" size={12} color="#FF5722" />
                      <Text style={styles.emergencyText}>24h</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.viewProfileButton}>
                    <Text style={styles.viewProfileText}>Ver Perfil</Text>
                    <Ionicons name="chevron-forward" size={14} color="#F4B740" />
                  </TouchableOpacity>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
        
        {/* Pet markers */}
        {mapMode !== 'Veterinarias' && petsWithChip.map(pet => (
          <Marker
            key={pet.petId}
            coordinate={{
              latitude: pet.latitude,
              longitude: pet.longitude
            }}
            onPress={() => handlePetMarkerPress(pet)}
          >
            <View style={styles.petMarker}>
              <View style={[
                styles.petMarkerCircle,
                { backgroundColor: getStatusColor(pet) }
              ]}>
                <Ionicons name="paw" size={16} color="white" />
              </View>
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
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  map: { 
    flex: 1,
    marginTop: 80,
  },
  callout: {
    minWidth: 280,
    maxWidth: 300,
  },
  calloutContainer: {
    padding: 12,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    flex: 1,
    marginRight: 8,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutStars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  calloutRatingText: {
    fontSize: 12,
    color: '#666',
  },
  calloutAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  calloutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyText: {
    fontSize: 10,
    color: '#FF5722',
    fontWeight: '600',
    marginLeft: 2,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 12,
    color: '#F4B740',
    fontWeight: '600',
    marginRight: 2,
  },
  // Map controls
  mapControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  segmentButtonFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  segmentButtonTextActive: {
    color: 'white',
  },
  // Pet marker styles
  petMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  petMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 2,
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