import chipTrackingService from '../../src/services/chipTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import locationAlertsService from '../../src/services/locationAlertsService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-location');
jest.mock('../../src/services/locationAlertsService');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockLocation = Location as jest.Mocked<typeof Location>;
const mockLocationAlertsService = locationAlertsService as jest.Mocked<typeof locationAlertsService>;

// Mock data
const mockChipData = [
  {
    id: 'chip_001',
    code: 'CHIP-1234-5678-9012',
    petId: 'pet_001',
    petName: 'Max',
    ownerId: 'user_001',
    isActive: true,
    registeredAt: new Date('2024-10-01'),
    lastSeen: new Date(),
  },
  {
    id: 'chip_002',
    code: 'CHIP-2345-6789-0123',
    petId: 'pet_002',
    petName: 'Luna',
    ownerId: 'user_001',
    isActive: false,
    registeredAt: new Date('2024-09-15'),
    lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

describe('ChipTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Setup AsyncStorage mocks
    mockAsyncStorage.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'wuauser_chips':
          return Promise.resolve(JSON.stringify(mockChipData));
        case 'pet_locations':
          return Promise.resolve(JSON.stringify([]));
        case 'safe_zones':
          return Promise.resolve(JSON.stringify([]));
        default:
          return Promise.resolve(null);
      }
    });
    
    mockAsyncStorage.setItem.mockResolvedValue();
    
    // Setup Location mocks
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted' as any,
      expires: 'never',
      canAskAgain: true,
      granted: true,
    });
    
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: {
        latitude: 19.4326,
        longitude: -99.1332,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  });

  describe('Inicialización del servicio', () => {
    it('debe inicializar correctamente', async () => {
      await chipTrackingService.initialize();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('wuauser_chips');
    });

    it('debe crear datos mock si no existen chips', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'wuauser_chips') {
          return Promise.resolve(JSON.stringify([]));
        }
        return Promise.resolve(null);
      });

      await chipTrackingService.initialize();
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'wuauser_chips',
        expect.stringContaining('chip_')
      );
    });
  });

  describe('Registro de chips', () => {
    it('debe registrar un chip correctamente', async () => {
      const registrationData = {
        chipCode: 'CHIP-3456-7890-1234',
        petId: 'pet_003',
        isVerified: true,
      };

      const result = await chipTrackingService.registerChip(registrationData);

      expect(result.code).toBe('CHIP-3456-7890-1234');
      expect(result.petId).toBe('pet_003');
      expect(result.isActive).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Verificación de códigos de chip', () => {
    it('debe validar formato correcto de chip', async () => {
      const result = await chipTrackingService.verifyChipCode('CHIP-1234-5678-9012');
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar formato incorrecto', async () => {
      const result = await chipTrackingService.verifyChipCode('INVALID-FORMAT');
      expect(result.isValid).toBe(false);
      expect(result.isRegistered).toBe(false);
    });
  });

  describe('Simulación de tracking', () => {
    it('debe simular ubicación cerca del usuario', async () => {
      const locationData = await chipTrackingService.simulateTracking('pet_001');

      expect(locationData.latitude).toBeCloseTo(19.4326, 1);
      expect(locationData.longitude).toBeCloseTo(-99.1332, 1);
      expect(locationData.battery).toBeGreaterThanOrEqual(20);
      expect(locationData.battery).toBeLessThanOrEqual(100);
      expect(['strong', 'medium', 'weak']).toContain(locationData.signal);
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar errores de AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const chips = await (chipTrackingService as any).getAllChips();
      expect(chips).toEqual([]);
    });
  });
});
