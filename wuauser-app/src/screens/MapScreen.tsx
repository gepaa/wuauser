import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { veterinarianService, VeterinarianData } from '../services/veterinarianService';

interface MapScreenProps {
  navigation: any;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const [location, setLocation] = useState<any>(null);
  const [veterinarias, setVeterinarias] = useState<VeterinarianData[]>([]);

  useEffect(() => {
    initializeMap();
  }, []);

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

  const handleMarkerPress = (vet: VeterinarianData) => {
    navigation.navigate('VetPublicProfile', { vetId: vet.id });
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
        {veterinarias.map(vet => (
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
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  map: { 
    flex: 1 
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
});