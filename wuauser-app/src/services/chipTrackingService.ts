import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  ChipData,
  LocationData,
  PetLocation,
  SafeZone,
  LocationAlert,
  ChipStatus,
  TrackingStats,
  ChipRegistrationData
} from '../types/chipTracking';
import locationAlertsService from './locationAlertsService';

const CHIPS_KEY = 'wuauser_chips';
const LOCATIONS_KEY = 'pet_locations';
const SAFE_ZONES_KEY = 'safe_zones';
const ALERTS_KEY = 'location_alerts';

class ChipTrackingService {
  private static instance: ChipTrackingService;
  private trackingInterval: NodeJS.Timeout | null = null;
  private isTracking = false;

  static getInstance(): ChipTrackingService {
    if (!ChipTrackingService.instance) {
      ChipTrackingService.instance = new ChipTrackingService();
    }
    return ChipTrackingService.instance;
  }

  /**
   * Initialize the service with mock data
   */
  async initialize(): Promise<void> {
    try {
      const existingChips = await this.getAllChips();
      if (existingChips.length === 0) {
        await this.seedMockData();
      }
      
      // Start background tracking simulation
      this.startTracking();
    } catch (error) {
      console.error('Error initializing chip tracking service:', error);
    }
  }

  /**
   * Register a new chip
   */
  async registerChip(registrationData: ChipRegistrationData): Promise<ChipData> {
    try {
      const chipData: ChipData = {
        id: this.generateId(),
        code: registrationData.chipCode,
        petId: registrationData.petId,
        petName: '', // Will be populated from pet data
        ownerId: 'current_user', // Should come from auth context
        isActive: registrationData.isVerified,
        registeredAt: new Date(),
        lastSeen: new Date(),
      };

      const chips = await this.getAllChips();
      chips.push(chipData);
      await this.saveAllChips(chips);

      // Start tracking for this chip if verified
      if (registrationData.isVerified) {
        await this.startTrackingForPet(registrationData.petId);
      }

      return chipData;
    } catch (error) {
      console.error('Error registering chip:', error);
      throw error;
    }
  }

  /**
   * Verify chip code (mock verification)
   */
  async verifyChipCode(chipCode: string): Promise<{ isValid: boolean; isRegistered: boolean }> {
    try {
      // Mock verification - in real app this would call backend API
      const isValidFormat = /^CHIP-\d{4}-\d{4}-\d{4}$/.test(chipCode);
      
      if (!isValidFormat) {
        return { isValid: false, isRegistered: false };
      }

      const existingChips = await this.getAllChips();
      const isRegistered = existingChips.some(chip => chip.code === chipCode);

      return { 
        isValid: true, 
        isRegistered 
      };
    } catch (error) {
      console.error('Error verifying chip code:', error);
      return { isValid: false, isRegistered: false };
    }
  }

  /**
   * Get chip data by pet ID
   */
  async getChipByPetId(petId: string): Promise<ChipData | null> {
    try {
      const chips = await this.getAllChips();
      return chips.find(chip => chip.petId === petId) || null;
    } catch (error) {
      console.error('Error getting chip by pet ID:', error);
      return null;
    }
  }

  /**
   * Get current location for a pet
   */
  async getPetLocation(petId: string): Promise<PetLocation | null> {
    try {
      const locations = await this.getAllLocations();
      const petLocation = locations.find(loc => loc.petId === petId);
      
      if (!petLocation) {
        return null;
      }

      return petLocation;
    } catch (error) {
      console.error('Error getting pet location:', error);
      return null;
    }
  }

  /**
   * Get all pets with active chips and their locations
   */
  async getPetsWithLocation(): Promise<PetLocation[]> {
    try {
      const chips = await this.getAllChips();
      const locations = await this.getAllLocations();
      
      return locations.filter(location => 
        chips.some(chip => chip.petId === location.petId && chip.isActive)
      );
    } catch (error) {
      console.error('Error getting pets with location:', error);
      return [];
    }
  }

  /**
   * Create safe zone for a pet
   */
  async createSafeZone(safeZone: Omit<SafeZone, 'id' | 'createdAt'>): Promise<SafeZone> {
    try {
      const newSafeZone: SafeZone = {
        ...safeZone,
        id: this.generateId(),
        createdAt: new Date(),
      };

      const safeZones = await this.getAllSafeZones();
      safeZones.push(newSafeZone);
      await this.saveSafeZones(safeZones);

      return newSafeZone;
    } catch (error) {
      console.error('Error creating safe zone:', error);
      throw error;
    }
  }

  /**
   * Get safe zones for a pet
   */
  async getSafeZones(petId: string): Promise<SafeZone[]> {
    try {
      const safeZones = await this.getAllSafeZones();
      return safeZones.filter(zone => zone.petId === petId && zone.isActive);
    } catch (error) {
      console.error('Error getting safe zones:', error);
      return [];
    }
  }

  /**
   * Get chip status
   */
  async getChipStatus(petId: string): Promise<ChipStatus | null> {
    try {
      const chip = await this.getChipByPetId(petId);
      if (!chip) {
        return null;
      }

      const location = await this.getPetLocation(petId);
      const safeZones = await this.getSafeZones(petId);

      let status: ChipStatus['status'] = 'offline';
      let signalStrength: ChipStatus['signalStrength'] = 'none';
      let batteryLevel = 0;
      let isInSafeZone = false;

      if (location) {
        const timeSinceUpdate = Date.now() - new Date(location.timestamp).getTime();
        batteryLevel = location.battery;
        signalStrength = location.signal;

        if (timeSinceUpdate < 10 * 60 * 1000) { // Less than 10 minutes
          status = batteryLevel < 20 ? 'low_battery' : 'active';
        } else if (timeSinceUpdate < 60 * 60 * 1000) { // Less than 1 hour
          status = 'inactive';
        } else {
          status = 'no_signal';
        }

        // Check if in safe zone
        isInSafeZone = safeZones.some(zone => {
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            zone.centerLatitude,
            zone.centerLongitude
          );
          return distance <= zone.radius;
        });
      }

      return {
        chipId: chip.id,
        status,
        lastUpdate: location?.timestamp || chip.lastSeen || new Date(),
        batteryLevel,
        signalStrength,
        isInSafeZone,
      };
    } catch (error) {
      console.error('Error getting chip status:', error);
      return null;
    }
  }

  /**
   * Simulate tracking for demo purposes
   */
  async simulateTracking(petId: string): Promise<LocationData> {
    try {
      // Get current location or use default (Mexico City)
      let ownerLocation = { latitude: 19.4326, longitude: -99.1332 };
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentLocation = await Location.getCurrentPositionAsync({});
          ownerLocation = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
        }
      } catch (locationError) {
        console.log('Using default location for simulation');
      }

      // Add random offset (simulate pet movement within ~500m radius)
      const offset = {
        lat: (Math.random() - 0.5) * 0.005, // ~500m radius
        lng: (Math.random() - 0.5) * 0.005
      };

      const simulatedLocation: LocationData = {
        latitude: ownerLocation.latitude + offset.lat,
        longitude: ownerLocation.longitude + offset.lng,
        timestamp: new Date(),
        accuracy: Math.random() * 10 + 5, // 5-15m accuracy
        battery: Math.max(20, 100 - Math.floor(Math.random() * 30)), // 70-100% battery
        signal: ['strong', 'medium', 'weak'][Math.floor(Math.random() * 3)] as LocationData['signal']
      };

      // Save location
      await this.updatePetLocation(petId, simulatedLocation);

      return simulatedLocation;
    } catch (error) {
      console.error('Error simulating tracking:', error);
      throw error;
    }
  }

  /**
   * Start tracking for a specific pet
   */
  private async startTrackingForPet(petId: string): Promise<void> {
    try {
      // Simulate initial location
      await this.simulateTracking(petId);
    } catch (error) {
      console.error('Error starting tracking for pet:', error);
    }
  }

  /**
   * Start background tracking simulation
   */
  private startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.trackingInterval = setInterval(async () => {
      try {
        const chips = await this.getAllChips();
        const activeChips = chips.filter(chip => chip.isActive);

        for (const chip of activeChips) {
          await this.simulateTracking(chip.petId);
        }
      } catch (error) {
        console.error('Error in background tracking:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Stop tracking
   */
  stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    this.isTracking = false;
  }

  /**
   * Private helper methods
   */
  private async getAllChips(): Promise<ChipData[]> {
    try {
      const chipsJson = await AsyncStorage.getItem(CHIPS_KEY);
      return chipsJson ? JSON.parse(chipsJson) : [];
    } catch (error) {
      console.error('Error getting all chips:', error);
      return [];
    }
  }

  private async saveAllChips(chips: ChipData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CHIPS_KEY, JSON.stringify(chips));
    } catch (error) {
      console.error('Error saving chips:', error);
      throw error;
    }
  }

  private async getAllLocations(): Promise<PetLocation[]> {
    try {
      const locationsJson = await AsyncStorage.getItem(LOCATIONS_KEY);
      const locations = locationsJson ? JSON.parse(locationsJson) : [];
      
      return locations.map((loc: any) => ({
        ...loc,
        timestamp: new Date(loc.timestamp)
      }));
    } catch (error) {
      console.error('Error getting all locations:', error);
      return [];
    }
  }

  private async updatePetLocation(petId: string, locationData: LocationData): Promise<void> {
    try {
      const locations = await this.getAllLocations();
      const existingIndex = locations.findIndex(loc => loc.petId === petId);
      
      const petLocation: PetLocation = {
        ...locationData,
        petId,
        petName: '', // Will be populated from pet data
        chipId: '', // Will be populated from chip data
      };

      if (existingIndex >= 0) {
        locations[existingIndex] = petLocation;
      } else {
        locations.push(petLocation);
      }

      await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
      
      // Check for alerts
      await this.checkLocationAlerts(petLocation);
    } catch (error) {
      console.error('Error updating pet location:', error);
      throw error;
    }
  }

  /**
   * Check for location-based alerts
   */
  private async checkLocationAlerts(petLocation: PetLocation): Promise<void> {
    try {
      // Check safe zone violations
      await locationAlertsService.checkSafeZoneViolations(petLocation);
      
      // Check battery level
      await locationAlertsService.checkBatteryLevel(petLocation);
      
      // Check signal status
      await locationAlertsService.checkSignalStatus(petLocation);
    } catch (error) {
      console.error('Error checking location alerts:', error);
    }
  }

  private async getAllSafeZones(): Promise<SafeZone[]> {
    try {
      const safeZonesJson = await AsyncStorage.getItem(SAFE_ZONES_KEY);
      return safeZonesJson ? JSON.parse(safeZonesJson) : [];
    } catch (error) {
      console.error('Error getting safe zones:', error);
      return [];
    }
  }

  private async saveSafeZones(safeZones: SafeZone[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SAFE_ZONES_KEY, JSON.stringify(safeZones));
    } catch (error) {
      console.error('Error saving safe zones:', error);
      throw error;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private generateId(): string {
    return `chip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async seedMockData(): Promise<void> {
    const mockChips: ChipData[] = [
      {
        id: 'chip_001',
        code: 'CHIP-1234-5678-9012',
        petId: 'pet_001',
        petName: 'Max',
        ownerId: 'user_001',
        isActive: true,
        registeredAt: new Date('2024-10-01'),
        lastSeen: new Date(),
      }
    ];

    await this.saveAllChips(mockChips);

    // Initialize tracking for mock pets
    for (const chip of mockChips) {
      if (chip.isActive) {
        await this.startTrackingForPet(chip.petId);
      }
    }
  }
}

export const chipTrackingService = ChipTrackingService.getInstance();
export default chipTrackingService;