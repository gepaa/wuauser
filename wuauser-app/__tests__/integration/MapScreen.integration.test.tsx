import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { MapScreen } from '../../src/screens/MapScreen';
import { mapService } from '../../src/services/mapService';
import chipTrackingService from '../../src/services/chipTrackingService';
import { NativeBaseProvider } from 'native-base';

// Test de integración completo para MapScreen

jest.mock('expo-location');
jest.mock('../../src/services/mapService');
jest.mock('../../src/services/chipTrackingService');
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => (
      <View testID="map-view" {...props} ref={ref} />
    )),
    Marker: (props: any) => <View testID="marker" {...props} />,
    Callout: (props: any) => <View testID="callout" {...props} />,
    PROVIDER_GOOGLE: 'google',
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NativeBaseProvider>{children}</NativeBaseProvider>
);

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
};

// Datos mock para integración
const mockUserLocation = {
  latitude: 19.4326,
  longitude: -99.1332,
  altitude: null,
  accuracy: 5,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

const mockClinicas = [
  {
    id: 'clinic_1',
    clinic_name: 'Veterinaria Integración Test',
    latitude: 19.4300,
    longitude: -99.1300,
    address: 'Test Address 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    specialties: ['general'],
    services: ['consulta general'],
    schedule: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '09:00', close: '15:00', closed: true },
    },
    is_24hours: false,
    is_emergency: false,
    accepts_pets: true,
    rating: 4.7,
    total_reviews: 32,
    is_verified: true,
    is_active: true,
    distance_km: 2.8,
  },
];

const mockPets = [
  {
    petId: 'pet_1',
    petName: 'Rex',
    chipId: 'chip_1',
    latitude: 19.4310,
    longitude: -99.1310,
    timestamp: new Date(),
    accuracy: 3,
    battery: 92,
    signal: 'strong' as const,
  },
];

describe('MapScreen - Integración Completa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: mockUserLocation,
    });
    
    (mapService.searchNearbyClinics as jest.Mock).mockResolvedValue({
      data: mockClinicas,
      error: null,
    });
    (mapService.smartSearch as jest.Mock).mockResolvedValue({
      data: mockClinicas,
      error: null,
    });
    
    (chipTrackingService.getPetsWithLocation as jest.Mock).mockResolvedValue(mockPets);
  });

  describe('Flujo completo de usuario', () => {
    it('debe completar el flujo inicial de carga y búsqueda', async () => {
      const { getByTestId, getByText, queryByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      // Verificar estado de carga inicial
      expect(getByText('Buscando clínicas...')).toBeTruthy();

      // Esperar que termine la carga
      await waitFor(() => {
        expect(queryByText('Buscando clínicas...')).toBeNull();
      });

      // Verificar elementos finales
      expect(getByTestId('map-view')).toBeTruthy();
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      expect(mapService.searchNearbyClinics).toHaveBeenCalled();
    });

    it('debe manejar cambios de modo correctamente', async () => {
      const { getByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Clínicas')).toBeTruthy();
      });

      // Cambiar a modo mascotas
      act(() => {
        fireEvent.press(getByText('Mis Mascotas'));
      });

      await waitFor(() => {
        expect(chipTrackingService.getPetsWithLocation).toHaveBeenCalled();
      });
    });
  });

  describe('Performance tests', () => {
    it('debe renderizar rápidamente con muchos datos', async () => {
      const manyClinicas = Array.from({ length: 50 }, (_, i) => ({
        ...mockClinicas[0],
        id: `clinic_${i}`,
        clinic_name: `Clínica ${i}`,
      }));

      (mapService.searchNearbyClinics as jest.Mock).mockResolvedValue({
        data: manyClinicas,
        error: null,
      });

      const startTime = Date.now();

      const { getByTestId } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('map-view')).toBeTruthy();
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
