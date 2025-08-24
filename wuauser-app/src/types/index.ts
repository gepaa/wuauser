export type TipoUsuario = 'dueno' | 'veterinario' | 'guest';

export interface Profile {
  id: string;
  tipo_usuario: TipoUsuario;
  nombre_completo: string;
  telefono?: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  foto_url?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Veterinario {
  id: string;
  profile_id: string;
  nombre_clinica: string;
  cedula_profesional?: string;
  especialidad?: string;
  direccion_clinica: string;
  telefono_clinica?: string;
  lat?: number;
  lng?: number;
  servicios: string[];
  horario?: Record<string, any>;
  rating: number;
  verificado: boolean;
  foto_cedula_url?: string;
  created_at: string;
}

export interface Mascota {
  id: string;
  dueno_id: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'otro';
  raza?: string;
  sexo?: 'macho' | 'hembra';
  fecha_nacimiento?: string;
  peso?: number;
  color?: string;
  foto_url?: string;
  qr_code: string;
  chip_id?: string;
  esterilizado: boolean;
  vacunas: any[];
  condiciones_medicas?: string[];
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id: string;
  mascota_id: string;
  veterinario_id?: string;
  dueno_id: string;
  fecha_hora: string;
  motivo: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  diagnostico?: string;
  tratamiento?: string;
  costo?: number;
  created_at: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  UserTypeSelection: undefined;
  RegisterDueno: undefined;
  RegisterVeterinario: undefined;
  QRScanner: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  MyPets: undefined;
  Profile: undefined;
};

// ===============================================
// INTERFACES PARA MAPAS Y UBICACIONES
// ===============================================

export interface ClinicLocation {
  id: string;
  clinic_name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  specialties: string[];
  services: string[];
  schedule: ClinicSchedule;
  is_24hours: boolean;
  is_emergency: boolean;
  accepts_pets: boolean;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_active: boolean;
  distance_km?: number;
  match_score?: number;
}

export interface ClinicSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface PetLocation {
  id: string;
  pet_id: string;
  pet_name?: string;
  owner_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  location_type: 'home' | 'current' | 'last_seen' | 'lost';
  last_seen: string;
  is_active: boolean;
  notes?: string;
  reported_by?: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface SearchFilters {
  radius_km?: number;
  specialties?: string[];
  services?: string[];
  min_rating?: number;
  emergency_only?: boolean;
  open_24h_only?: boolean;
  pet_species?: 'perro' | 'gato' | 'ave' | 'reptil' | 'otro';
  urgent_care?: boolean;
}