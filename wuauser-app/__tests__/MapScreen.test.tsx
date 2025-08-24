import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { MapScreen } from '../src/screens/MapScreen';
import { mapService } from '../src/services/mapService';
import chipTrackingService from '../src/services/chipTrackingService';
import { NativeBaseProvider } from 'native-base';

// Mock dependencies
jest.mock('expo-location');
jest.mock('../src/services/mapService');
jest.mock('../src/services/chipTrackingService');
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

// Mock data
const mockUserLocation = {
  latitude: 19.4326,
  longitude: -99.1332,
  altitude: null,
  accuracy: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

const mockClinicas = [
  {
    id: '1',
    clinic_name: 'Veterinaria Central',
    latitude: 19.4300,
    longitude: -99.1300,
    address: 'Calle Principal 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    specialties: ['general'],
    services: ['consulta general'],
    schedule: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: false },
    },
    is_24hours: false,
    is_emergency: false,
    accepts_pets: true,
    rating: 4.5,
    total_reviews: 25,
    is_verified: true,
    is_active: true,
    distance_km: 2.5,
  },
  {
    id: '2',
    clinic_name: 'Emergencias Vet 24h',
    latitude: 19.4250,
    longitude: -99.1350,
    address: 'Avenida Secundaria 456',
    city: 'Ciudad de México',
    state: 'CDMX',
    specialties: ['emergencias'],
    services: ['emergencias 24h'],
    schedule: {
      monday: { open: '00:00', close: '23:59', closed: false },
      tuesday: { open: '00:00', close: '23:59', closed: false },
      wednesday: { open: '00:00', close: '23:59', closed: false },
      thursday: { open: '00:00', close: '23:59', closed: false },
      friday: { open: '00:00', close: '23:59', closed: false },
      saturday: { open: '00:00', close: '23:59', closed: false },
      sunday: { open: '00:00', close: '23:59', closed: false },
    },
    is_24hours: true,
    is_emergency: true,
    accepts_pets: true,
    rating: 4.8,
    total_reviews: 45,
    is_verified: true,
    is_active: true,
    distance_km: 1.2,
  },
];

const mockPetsWithChip = [
  {
    petId: 'pet1',
    petName: 'Max',
    chipId: 'chip1',
    latitude: 19.4280,
    longitude: -99.1280,
    timestamp: new Date(),
    accuracy: 5,
    battery: 85,
    signal: 'strong' as const,
  },
  {
    petId: 'pet2',
    petName: 'Luna',
    chipId: 'chip2',
    latitude: 19.4320,
    longitude: -99.1320,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    accuracy: 8,
    battery: 15,
    signal: 'weak' as const,
  },
];

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NativeBaseProvider>{children}</NativeBaseProvider>
);

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
};

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Location mocks
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: mockUserLocation,
    });
    
    // Setup mapService mocks
    (mapService.searchNearbyClinics as jest.Mock).mockResolvedValue({
      data: mockClinicas,
      error: null,
    });
    (mapService.smartSearch as jest.Mock).mockResolvedValue({
      data: mockClinicas,
      error: null,
    });
    
    // Setup chipTrackingService mocks
    (chipTrackingService.getPetsWithLocation as jest.Mock).mockResolvedValue(mockPetsWithChip);
  });

  describe('Renderizado inicial', () => {
    it('debe renderizar el componente correctamente', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTestId('map-view')).toBeTruthy();
        expect(getByPlaceholderText('Buscar clínicas o servicios...')).toBeTruthy();
      });
    });

    it('debe mostrar indicador de carga durante inicialización', async () => {
      const { getByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      expect(getByText('Buscando clínicas...')).toBeTruthy();
    });

    it('debe solicitar permisos de ubicación al cargar', async () => {
      render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Permisos de ubicación', () => {
    it('debe manejar permisos denegados', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          'Necesitamos permisos de ubicación para mostrar clínicas cercanas'
        );
      });

      alertSpy.mockRestore();
    });

    it('debe usar ubicación por defecto cuando hay error de GPS', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
        new Error('GPS error')
      );

      render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mapService.searchNearbyClinics).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: 19.4326,
            longitude: -99.1332,
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Búsqueda de clínicas', () => {
    it('debe buscar clínicas al obtener ubicación', async () => {
      render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mapService.searchNearbyClinics).toHaveBeenCalledWith(
          mockUserLocation,
          expect.objectContaining({
            radius_km: 5,
            emergency_only: false,
            open_24h_only: false,
            min_rating: 0,
          })
        );
      });
    });

    it('debe usar búsqueda inteligente cuando hay texto de búsqueda', async () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        const searchInput = getByPlaceholderText('Buscar clínicas o servicios...');
        
        act(() => {
          fireEvent.changeText(searchInput, 'emergencias');
          fireEvent(searchInput, 'submitEditing');
        });
      });

      await waitFor(() => {
        expect(mapService.smartSearch).toHaveBeenCalled();
      });
    });

    it('debe manejar errores en la búsqueda', async () => {
      (mapService.searchNearbyClinics as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          'No se pudieron cargar las clínicas veterinarias'
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Modo de vista del mapa', () => {
    it('debe cambiar entre modos de vista', async () => {
      const { getByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        const mascotasButton = getByText('Mis Mascotas');
        
        act(() => {
          fireEvent.press(mascotasButton);
        });
      });

      await waitFor(() => {
        expect(chipTrackingService.getPetsWithLocation).toHaveBeenCalled();
      });
    });
  });

  describe('Barra de estado', () => {
    it('debe mostrar contador de clínicas encontradas', async () => {
      const { getByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('2')).toBeTruthy();
        expect(getByText('Clínicas')).toBeTruthy();
      });
    });
  });

  describe('Estados de carga', () => {
    it('debe mostrar spinner durante búsqueda', async () => {
      const { getByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      expect(getByText('Buscando clínicas...')).toBeTruthy();
    });

    it('debe ocultar spinner al completar carga', async () => {
      const { queryByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(queryByText('Buscando clínicas...')).toBeNull();
      });
    });
  });

  describe('Actualizaciones automáticas', () => {
    it('debe actualizar ubicaciones de mascotas cada 30 segundos', async () => {
      jest.useFakeTimers();
      
      const { getByText } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        const mascotasButton = getByText('Mis Mascotas');
        act(() => {
          fireEvent.press(mascotasButton);
        });
      });

      // Avanzar 30 segundos
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(chipTrackingService.getPetsWithLocation).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    it('debe limpiar interval al desmontar', () => {
      jest.useFakeTimers();
      
      const { unmount } = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      act(() => {
        unmount();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      jest.useRealTimers();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Snapshot testing', () => {
    it('debe coincidir con el snapshot', async () => {
      const component = render(
        <TestWrapper>
          <MapScreen navigation={mockNavigation} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mapService.searchNearbyClinics).toHaveBeenCalled();
      });

      expect(component.toJSON()).toMatchSnapshot();
    });
  });
});
