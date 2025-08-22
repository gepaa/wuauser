export interface ChipData {
  id: string;
  code: string; // CHIP-XXXX-XXXX-XXXX format
  petId: string;
  petName: string;
  ownerId: string;
  isActive: boolean;
  registeredAt: Date;
  lastSeen?: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
  battery: number; // 0-100
  signal: 'strong' | 'medium' | 'weak' | 'none';
}

export interface PetLocation extends LocationData {
  petId: string;
  petName: string;
  chipId: string;
}

export interface SafeZone {
  id: string;
  petId: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number; // meters
  isActive: boolean;
  createdAt: Date;
  notifications: {
    onExit: boolean;
    onEntry: boolean;
    email: boolean;
    push: boolean;
  };
}

export interface LocationAlert {
  id: string;
  petId: string;
  chipId: string;
  type: 'zone_exit' | 'zone_entry' | 'low_battery' | 'no_signal' | 'found';
  message: string;
  timestamp: Date;
  location?: LocationData;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ChipStatus {
  chipId: string;
  status: 'active' | 'inactive' | 'low_battery' | 'no_signal' | 'offline';
  lastUpdate: Date;
  batteryLevel: number;
  signalStrength: 'strong' | 'medium' | 'weak' | 'none';
  isInSafeZone: boolean;
}

export interface TrackingStats {
  totalDistance: number; // meters traveled today
  timeActive: number; // minutes active today
  lastKnownLocation?: LocationData;
  safeZoneViolations: number;
  batteryHistory: Array<{
    timestamp: Date;
    level: number;
  }>;
}

export type MapMode = 'Veterinarias' | 'Mis Mascotas' | 'Ambos';

export interface ChipRegistrationData {
  chipCode: string;
  petId: string;
  verificationMethod: 'scan' | 'manual';
  isVerified: boolean;
}