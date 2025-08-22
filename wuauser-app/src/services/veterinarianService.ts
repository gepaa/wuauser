import { supabase } from './supabase';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VeterinarianLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
}

export interface VeterinarianSchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface VeterinarianService {
  id: string;
  name: string;
  description?: string;
  category: 'consulta' | 'cirugia' | 'emergencia' | 'estetica' | 'especialidad';
  price?: number;
}

export interface VeterinarianReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  petType?: string;
}

export interface VeterinarianData {
  id: string;
  name: string;
  description?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  location: VeterinarianLocation;
  schedule: VeterinarianSchedule[];
  services: VeterinarianService[];
  specialties: string[];
  rating: number;
  reviewCount: number;
  photos: string[];
  isEmergency: boolean;
  isVerified: boolean;
  distance?: number;
  isOpen?: boolean;
  nextOpenTime?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  isOpen?: boolean;
  isEmergency?: boolean;
  specialty?: string;
  maxDistance?: number;
  minRating?: number;
}

const mockVeterinarians: VeterinarianData[] = [
  {
    id: 'vet_001',
    name: 'Clínica Veterinaria San Ángel',
    description: 'Clínica veterinaria con más de 15 años de experiencia en el cuidado integral de mascotas.',
    phone: '+52 55 5555 1234',
    whatsapp: '+52 55 5555 1234',
    email: 'contacto@sanangel.vet',
    website: 'https://sanangel.vet',
    location: {
      latitude: 19.4326,
      longitude: -99.1332,
      address: 'Av. Universidad 1234',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '01000'
    },
    schedule: [
      { day: 'Lunes', openTime: '08:00', closeTime: '18:00', isOpen: true },
      { day: 'Martes', openTime: '08:00', closeTime: '18:00', isOpen: true },
      { day: 'Miércoles', openTime: '08:00', closeTime: '18:00', isOpen: true },
      { day: 'Jueves', openTime: '08:00', closeTime: '18:00', isOpen: true },
      { day: 'Viernes', openTime: '08:00', closeTime: '18:00', isOpen: true },
      { day: 'Sábado', openTime: '09:00', closeTime: '14:00', isOpen: true },
      { day: 'Domingo', openTime: '10:00', closeTime: '14:00', isOpen: true }
    ],
    services: [
      { id: 's1', name: 'Consulta General', category: 'consulta', price: 350 },
      { id: 's2', name: 'Vacunación', category: 'consulta', price: 250 },
      { id: 's3', name: 'Cirugía', category: 'cirugia', price: 1500 },
      { id: 's4', name: 'Emergencias', category: 'emergencia' }
    ],
    specialties: ['Medicina Interna', 'Cirugía', 'Cardiología'],
    rating: 4.7,
    reviewCount: 142,
    photos: [
      'https://via.placeholder.com/400x300?text=Clinica+Exterior',
      'https://via.placeholder.com/400x300?text=Consultorio+1',
      'https://via.placeholder.com/400x300?text=Quirofano'
    ],
    isEmergency: true,
    isVerified: true,
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'vet_002',
    name: 'Hospital Veterinario Roma Norte',
    description: 'Hospital veterinario de especialidades con tecnología de vanguardia.',
    phone: '+52 55 5555 5678',
    whatsapp: '+52 55 5555 5678',
    email: 'citas@hospromanorte.com',
    location: {
      latitude: 19.4146,
      longitude: -99.1669,
      address: 'Av. Álvaro Obregón 45',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '06700'
    },
    schedule: [
      { day: 'Lunes', openTime: '07:00', closeTime: '20:00', isOpen: true },
      { day: 'Martes', openTime: '07:00', closeTime: '20:00', isOpen: true },
      { day: 'Miércoles', openTime: '07:00', closeTime: '20:00', isOpen: true },
      { day: 'Jueves', openTime: '07:00', closeTime: '20:00', isOpen: true },
      { day: 'Viernes', openTime: '07:00', closeTime: '20:00', isOpen: true },
      { day: 'Sábado', openTime: '08:00', closeTime: '16:00', isOpen: true },
      { day: 'Domingo', openTime: '00:00', closeTime: '23:59', isOpen: false }
    ],
    services: [
      { id: 's1', name: 'Consulta de Especialidad', category: 'especialidad', price: 500 },
      { id: 's2', name: 'Ultrasonido', category: 'consulta', price: 800 },
      { id: 's3', name: 'Rayos X', category: 'consulta', price: 600 },
      { id: 's4', name: 'Hospitalización', category: 'emergencia', price: 1200 }
    ],
    specialties: ['Oncología', 'Neurología', 'Ortopedia', 'Dermatología'],
    rating: 4.9,
    reviewCount: 203,
    photos: [
      'https://via.placeholder.com/400x300?text=Hospital+Exterior',
      'https://via.placeholder.com/400x300?text=Recepcion',
      'https://via.placeholder.com/400x300?text=Sala+Espera'
    ],
    isEmergency: true,
    isVerified: true,
    created_at: '2022-08-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  },
  {
    id: 'vet_003',
    name: 'Veterinaria Mascotas Felices',
    description: 'Atención cálida y personalizada para tu mejor amigo.',
    phone: '+52 55 5555 9012',
    whatsapp: '+52 55 5555 9012',
    email: 'info@mascotasfelices.mx',
    location: {
      latitude: 19.3987,
      longitude: -99.1590,
      address: 'Calle Insurgentes Sur 890',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '03100'
    },
    schedule: [
      { day: 'Lunes', openTime: '09:00', closeTime: '17:00', isOpen: true },
      { day: 'Martes', openTime: '09:00', closeTime: '17:00', isOpen: true },
      { day: 'Miércoles', openTime: '09:00', closeTime: '17:00', isOpen: true },
      { day: 'Jueves', openTime: '09:00', closeTime: '17:00', isOpen: true },
      { day: 'Viernes', openTime: '09:00', closeTime: '17:00', isOpen: true },
      { day: 'Sábado', openTime: '10:00', closeTime: '15:00', isOpen: true },
      { day: 'Domingo', openTime: '00:00', closeTime: '23:59', isOpen: false }
    ],
    services: [
      { id: 's1', name: 'Consulta General', category: 'consulta', price: 300 },
      { id: 's2', name: 'Baño y Corte', category: 'estetica', price: 400 },
      { id: 's3', name: 'Desparasitación', category: 'consulta', price: 200 }
    ],
    specialties: ['Medicina General', 'Estética Canina'],
    rating: 4.3,
    reviewCount: 87,
    photos: [
      'https://via.placeholder.com/400x300?text=Veterinaria+Exterior',
      'https://via.placeholder.com/400x300?text=Consultorio+Pequeno'
    ],
    isEmergency: false,
    isVerified: true,
    created_at: '2023-05-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: 'vet_004',
    name: 'Animal Center Polanco',
    description: 'Centro veterinario de lujo con servicios integrales y atención 24/7.',
    phone: '+52 55 5555 3456',
    whatsapp: '+52 55 5555 3456',
    email: 'info@animalcenterpolanco.com',
    website: 'https://animalcenterpolanco.com',
    location: {
      latitude: 19.4284,
      longitude: -99.1917,
      address: 'Av. Presidente Masaryk 250',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '11560'
    },
    schedule: [
      { day: 'Lunes', openTime: '00:00', closeTime: '23:59', isOpen: true },
      { day: 'Martes', openTime: '00:00', closeTime: '23:59', isOpen: true },
      { day: 'Miércoles', openTime: '00:00', closeTime: '23:59', isOpen: true },
      { day: 'Jueves', openTime: '00:00', closeTime: '23:59', isOpen: true },
      { day: 'Viernes', openTime: '00:00', closeTime: '23:59', isOpen: true },
      { day: 'Sábado', openTime: '00:00', closeTime: '23:59', isOpen: true },
      { day: 'Domingo', openTime: '00:00', closeTime: '23:59', isOpen: true }
    ],
    services: [
      { id: 's1', name: 'Consulta de Emergencia', category: 'emergencia', price: 800 },
      { id: 's2', name: 'Tomografía', category: 'consulta', price: 1500 },
      { id: 's3', name: 'Resonancia Magnética', category: 'consulta', price: 2500 },
      { id: 's4', name: 'Hospitalización Premium', category: 'emergencia', price: 2000 }
    ],
    specialties: ['Medicina de Emergencias', 'Cuidados Intensivos', 'Imagenología'],
    rating: 4.8,
    reviewCount: 156,
    photos: [
      'https://via.placeholder.com/400x300?text=Animal+Center+Polanco',
      'https://via.placeholder.com/400x300?text=UCI+Veterinaria',
      'https://via.placeholder.com/400x300?text=Tomografo'
    ],
    isEmergency: true,
    isVerified: true,
    created_at: '2022-03-15T00:00:00Z',
    updated_at: '2024-01-22T00:00:00Z'
  },
  {
    id: 'vet_005',
    name: 'Clínica Veterinaria Del Valle',
    description: 'Atención familiar con más de 20 años de experiencia en la zona.',
    phone: '+52 55 5555 7890',
    whatsapp: '+52 55 5555 7890',
    email: 'contacto@clinicadelvalle.mx',
    location: {
      latitude: 19.3769,
      longitude: -99.1652,
      address: 'Eje 5 Sur (San Antonio) 1205',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '03100'
    },
    schedule: [
      { day: 'Lunes', openTime: '08:30', closeTime: '19:00', isOpen: true },
      { day: 'Martes', openTime: '08:30', closeTime: '19:00', isOpen: true },
      { day: 'Miércoles', openTime: '08:30', closeTime: '19:00', isOpen: true },
      { day: 'Jueves', openTime: '08:30', closeTime: '19:00', isOpen: true },
      { day: 'Viernes', openTime: '08:30', closeTime: '19:00', isOpen: true },
      { day: 'Sábado', openTime: '09:00', closeTime: '15:00', isOpen: true },
      { day: 'Domingo', openTime: '00:00', closeTime: '23:59', isOpen: false }
    ],
    services: [
      { id: 's1', name: 'Consulta General', category: 'consulta', price: 280 },
      { id: 's2', name: 'Esterilización', category: 'cirugia', price: 1200 },
      { id: 's3', name: 'Vacunación Múltiple', category: 'consulta', price: 320 },
      { id: 's4', name: 'Limpieza Dental', category: 'consulta', price: 800 }
    ],
    specialties: ['Medicina General', 'Cirugía Básica', 'Odontología'],
    rating: 4.4,
    reviewCount: 98,
    photos: [
      'https://via.placeholder.com/400x300?text=Clinica+Del+Valle',
      'https://via.placeholder.com/400x300?text=Sala+Cirugia'
    ],
    isEmergency: false,
    isVerified: true,
    created_at: '2023-07-12T00:00:00Z',
    updated_at: '2024-01-18T00:00:00Z'
  },
  {
    id: 'vet_006',
    name: 'Pet\'s Hospital Satélite',
    description: 'Tecnología avanzada y especialistas en animales de compañía.',
    phone: '+52 55 5555 2468',
    whatsapp: '+52 55 5555 2468',
    email: 'citas@petshospitalsatelite.com',
    location: {
      latitude: 19.5151,
      longitude: -99.2395,
      address: 'Blvd. Manuel Ávila Camacho 1007',
      city: 'Naucalpan',
      state: 'Estado de México',
      postalCode: '53960'
    },
    schedule: [
      { day: 'Lunes', openTime: '07:30', closeTime: '21:00', isOpen: true },
      { day: 'Martes', openTime: '07:30', closeTime: '21:00', isOpen: true },
      { day: 'Miércoles', openTime: '07:30', closeTime: '21:00', isOpen: true },
      { day: 'Jueves', openTime: '07:30', closeTime: '21:00', isOpen: true },
      { day: 'Viernes', openTime: '07:30', closeTime: '21:00', isOpen: true },
      { day: 'Sábado', openTime: '08:00', closeTime: '18:00', isOpen: true },
      { day: 'Domingo', openTime: '09:00', closeTime: '15:00', isOpen: true }
    ],
    services: [
      { id: 's1', name: 'Endoscopía', category: 'especialidad', price: 1800 },
      { id: 's2', name: 'Quimioterapia', category: 'especialidad', price: 3000 },
      { id: 's3', name: 'Fisioterapia', category: 'consulta', price: 600 },
      { id: 's4', name: 'Análisis Clínicos', category: 'consulta', price: 450 }
    ],
    specialties: ['Oncología Veterinaria', 'Gastroenterología', 'Rehabilitación'],
    rating: 4.6,
    reviewCount: 134,
    photos: [
      'https://via.placeholder.com/400x300?text=Pets+Hospital+Satelite',
      'https://via.placeholder.com/400x300?text=Laboratorio',
      'https://via.placeholder.com/400x300?text=Fisioterapia'
    ],
    isEmergency: true,
    isVerified: true,
    created_at: '2022-11-05T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z'
  },
  {
    id: 'vet_007',
    name: 'Veterinaria San José',
    description: 'Atención económica y de calidad para toda la familia.',
    phone: '+52 55 5555 1357',
    whatsapp: '+52 55 5555 1357',
    email: 'info@veterinariasanjose.com.mx',
    location: {
      latitude: 19.3675,
      longitude: -99.1418,
      address: 'Av. San José 456',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '03910'
    },
    schedule: [
      { day: 'Lunes', openTime: '10:00', closeTime: '18:00', isOpen: true },
      { day: 'Martes', openTime: '10:00', closeTime: '18:00', isOpen: true },
      { day: 'Miércoles', openTime: '10:00', closeTime: '18:00', isOpen: true },
      { day: 'Jueves', openTime: '10:00', closeTime: '18:00', isOpen: true },
      { day: 'Viernes', openTime: '10:00', closeTime: '18:00', isOpen: true },
      { day: 'Sábado', openTime: '10:00', closeTime: '16:00', isOpen: true },
      { day: 'Domingo', openTime: '00:00', closeTime: '23:59', isOpen: false }
    ],
    services: [
      { id: 's1', name: 'Consulta Básica', category: 'consulta', price: 250 },
      { id: 's2', name: 'Vacunación', category: 'consulta', price: 180 },
      { id: 's3', name: 'Desparasitación', category: 'consulta', price: 150 },
      { id: 's4', name: 'Corte de Uñas', category: 'estetica', price: 80 }
    ],
    specialties: ['Medicina Preventiva', 'Atención Básica'],
    rating: 4.1,
    reviewCount: 67,
    photos: [
      'https://via.placeholder.com/400x300?text=Veterinaria+San+Jose'
    ],
    isEmergency: false,
    isVerified: true,
    created_at: '2023-09-20T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  },
  {
    id: 'vet_008',
    name: 'Centro Veterinario Insurgentes',
    description: 'Especialistas en medicina interna y cirugía de alta complejidad.',
    phone: '+52 55 5555 8642',
    whatsapp: '+52 55 5555 8642',
    email: 'contacto@centroinsurgentes.vet',
    location: {
      latitude: 19.3641,
      longitude: -99.1392,
      address: 'Av. Insurgentes Sur 1842',
      city: 'Ciudad de México',
      state: 'CDMX',
      postalCode: '03920'
    },
    schedule: [
      { day: 'Lunes', openTime: '08:00', closeTime: '20:00', isOpen: true },
      { day: 'Martes', openTime: '08:00', closeTime: '20:00', isOpen: true },
      { day: 'Miércoles', openTime: '08:00', closeTime: '20:00', isOpen: true },
      { day: 'Jueves', openTime: '08:00', closeTime: '20:00', isOpen: true },
      { day: 'Viernes', openTime: '08:00', closeTime: '20:00', isOpen: true },
      { day: 'Sábado', openTime: '08:00', closeTime: '17:00', isOpen: true },
      { day: 'Domingo', openTime: '10:00', closeTime: '16:00', isOpen: true }
    ],
    services: [
      { id: 's1', name: 'Cirugía Cardiovascular', category: 'cirugia', price: 4500 },
      { id: 's2', name: 'Neurocirugía', category: 'cirugia', price: 5200 },
      { id: 's3', name: 'Ecocardiograma', category: 'consulta', price: 900 },
      { id: 's4', name: 'Electrocardiograma', category: 'consulta', price: 400 }
    ],
    specialties: ['Cardiología', 'Neurología', 'Cirugía Especializada'],
    rating: 4.9,
    reviewCount: 189,
    photos: [
      'https://via.placeholder.com/400x300?text=Centro+Insurgentes',
      'https://via.placeholder.com/400x300?text=Quirofano+Especializado',
      'https://via.placeholder.com/400x300?text=Cardiologia'
    ],
    isEmergency: true,
    isVerified: true,
    created_at: '2021-06-18T00:00:00Z',
    updated_at: '2024-01-28T00:00:00Z'
  }
];

export const veterinarianService = {
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  },

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Se necesitan permisos de ubicación');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000, // 30 seconds
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  },

  isCurrentlyOpen(schedule: VeterinarianSchedule[]): { isOpen: boolean; nextOpenTime?: string } {
    const now = new Date();
    const currentDay = now.toLocaleDateString('es-ES', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Normalize day name
    const dayMap: { [key: string]: string } = {
      'monday': 'Lunes', 'tuesday': 'Martes', 'wednesday': 'Miércoles',
      'thursday': 'Jueves', 'friday': 'Viernes', 'saturday': 'Sábado', 'sunday': 'Domingo'
    };
    
    const todaySchedule = schedule.find(s => s.day.toLowerCase() === currentDay.toLowerCase());
    
    if (!todaySchedule || !todaySchedule.isOpen) {
      // Find next open day
      const nextOpenDay = schedule.find(s => s.isOpen);
      return { 
        isOpen: false, 
        nextOpenTime: nextOpenDay ? `${nextOpenDay.day} ${nextOpenDay.openTime}` : undefined
      };
    }
    
    const isOpen = currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
    return { isOpen };
  },

  async getNearbyVeterinarians(
    userLocation: { latitude: number; longitude: number },
    filters?: SearchFilters
  ): Promise<{ data?: VeterinarianData[]; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation for development
        console.log('🎭 Mock getNearbyVeterinarians:', { userLocation, filters });
        
        let vets = mockVeterinarians.map(vet => {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            vet.location.latitude,
            vet.location.longitude
          );
          
          const openStatus = this.isCurrentlyOpen(vet.schedule);
          
          return {
            ...vet,
            distance: Number(distance.toFixed(1)),
            isOpen: openStatus.isOpen,
            nextOpenTime: openStatus.nextOpenTime
          };
        });

        // Apply filters
        if (filters) {
          if (filters.isOpen) {
            vets = vets.filter(vet => vet.isOpen);
          }
          if (filters.isEmergency) {
            vets = vets.filter(vet => vet.isEmergency);
          }
          if (filters.specialty) {
            vets = vets.filter(vet => 
              vet.specialties.some(s => 
                s.toLowerCase().includes(filters.specialty!.toLowerCase())
              )
            );
          }
          if (filters.maxDistance) {
            vets = vets.filter(vet => vet.distance! <= filters.maxDistance!);
          }
          if (filters.minRating) {
            vets = vets.filter(vet => vet.rating >= filters.minRating!);
          }
        }

        // Sort by distance
        vets.sort((a, b) => a.distance! - b.distance!);
        
        return { data: vets };
      }

      // Production Supabase implementation
      let query = supabase
        .from('veterinarians')
        .select(`
          *,
          veterinarian_services(*),
          veterinarian_reviews(rating)
        `)
        .eq('is_active', true);

      // Apply filters
      if (filters?.isEmergency) {
        query = query.eq('is_emergency', true);
      }
      
      if (filters?.specialty) {
        query = query.contains('specialties', [filters.specialty]);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      // Calculate distances and sort
      const vetsWithDistance = data.map(vet => {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          vet.location.latitude,
          vet.location.longitude
        );

        const openStatus = this.isCurrentlyOpen(vet.schedule);

        return {
          ...vet,
          distance: Number(distance.toFixed(1)),
          isOpen: openStatus.isOpen,
          nextOpenTime: openStatus.nextOpenTime
        };
      });

      // Apply distance filter
      let filteredVets = vetsWithDistance;
      if (filters?.maxDistance) {
        filteredVets = filteredVets.filter(vet => vet.distance <= filters.maxDistance!);
      }

      // Apply open now filter
      if (filters?.isOpen) {
        filteredVets = filteredVets.filter(vet => vet.isOpen);
      }

      // Sort by distance
      filteredVets.sort((a, b) => a.distance - b.distance);

      return { data: filteredVets };
    } catch (error: any) {
      console.error('Error getting nearby veterinarians:', error);
      return { error: error.message };
    }
  },

  async getVeterinarianById(id: string): Promise<{ data?: VeterinarianData; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getVeterinarianById:', id);
        const vet = mockVeterinarians.find(v => v.id === id);
        return vet ? { data: vet } : { error: 'Veterinario no encontrado' };
      }

      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          veterinarian_services(*),
          veterinarian_reviews(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message };
      }

      const openStatus = this.isCurrentlyOpen(data.schedule);

      return { 
        data: {
          ...data,
          isOpen: openStatus.isOpen,
          nextOpenTime: openStatus.nextOpenTime
        }
      };
    } catch (error: any) {
      console.error('Error getting veterinarian by ID:', error);
      return { error: error.message };
    }
  },

  async searchVeterinarians(
    query: string,
    userLocation?: { latitude: number; longitude: number }
  ): Promise<{ data?: VeterinarianData[]; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock searchVeterinarians:', query);
        
        const filtered = mockVeterinarians.filter(vet => 
          vet.name.toLowerCase().includes(query.toLowerCase()) ||
          vet.specialties.some(s => s.toLowerCase().includes(query.toLowerCase())) ||
          vet.services.some(service => service.name.toLowerCase().includes(query.toLowerCase()))
        );

        if (userLocation) {
          const vetsWithDistance = filtered.map(vet => ({
            ...vet,
            distance: this.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              vet.location.latitude,
              vet.location.longitude
            )
          }));

          vetsWithDistance.sort((a, b) => a.distance - b.distance);
          return { data: vetsWithDistance };
        }

        return { data: filtered };
      }

      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          veterinarian_services(*),
          veterinarian_reviews(rating)
        `)
        .or(`name.ilike.%${query}%, specialties.cs.{${query}}, services.ilike.%${query}%`)
        .eq('is_active', true);

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error searching veterinarians:', error);
      return { error: error.message };
    }
  },

  async getVeterinarianReviews(vetId: string): Promise<{ data?: VeterinarianReview[]; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getVeterinarianReviews:', vetId);
        
        const mockReviews: VeterinarianReview[] = [
          {
            id: 'review_1',
            userId: 'user_1',
            userName: 'María González',
            rating: 5,
            comment: 'Excelente atención, muy profesionales. Mi perrito quedó perfecto después de la cirugía.',
            date: '2024-01-15T10:30:00Z',
            petType: 'Perro'
          },
          {
            id: 'review_2',
            userId: 'user_2',
            userName: 'Carlos López',
            rating: 4,
            comment: 'Buen servicio aunque un poco caro. El veterinario es muy conocedor.',
            date: '2024-01-10T16:45:00Z',
            petType: 'Gato'
          },
          {
            id: 'review_3',
            userId: 'user_3',
            userName: 'Ana Martínez',
            rating: 5,
            comment: 'Llegué en emergencia y me atendieron inmediatamente. Salvaron a mi gatita. Muy recomendado!',
            date: '2024-01-08T22:15:00Z',
            petType: 'Gato'
          }
        ];

        return { data: mockReviews };
      }

      const { data, error } = await supabase
        .from('veterinarian_reviews')
        .select(`
          *,
          users(name)
        `)
        .eq('veterinarian_id', vetId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error getting veterinarian reviews:', error);
      return { error: error.message };
    }
  },

  getSearchHistory(): string[] {
    // In a real app, this would be stored in AsyncStorage
    return [
      'Emergencias',
      'Cardiología',
      'Clínica San Ángel',
      'Cirugía',
      'Vacunación'
    ];
  },

  saveSearchQuery(query: string): void {
    // In a real app, this would save to AsyncStorage
    console.log('Saving search query:', query);
  },

  clearSearchHistory(): void {
    // In a real app, this would clear AsyncStorage
    console.log('Clearing search history');
  },

  // Clinic Information Management
  async saveClinicInfo(clinicInfo: any): Promise<void> {
    try {
      const clinicData = {
        ...clinicInfo,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('clinic_info', JSON.stringify(clinicData));
      console.log('✅ Clinic info saved successfully');
    } catch (error) {
      console.error('Error saving clinic info:', error);
      throw new Error('No se pudo guardar la información de la clínica');
    }
  },

  async getClinicInfo(): Promise<any | null> {
    try {
      const clinicData = await AsyncStorage.getItem('clinic_info');
      
      if (clinicData) {
        const parsedData = JSON.parse(clinicData);
        console.log('📋 Clinic info loaded from storage');
        return parsedData;
      }
      
      // Return mock data if no saved data exists
      const mockClinicInfo = {
        nombre: 'Veterinaria San José',
        direccion: 'Av. Principal 123, Col. Centro',
        telefono: '5512345678',
        email: 'info@veterinariasanjose.com',
        servicios: [
          {
            id: '1',
            nombre: 'Consulta General',
            precio: '350',
            categoria: 'consulta'
          },
          {
            id: '2',
            nombre: 'Vacunación',
            precio: '250',
            categoria: 'consulta'
          },
          {
            id: '3',
            nombre: 'Desparasitación',
            precio: '200',
            categoria: 'consulta'
          }
        ],
        horarios: [
          { dia: 'Lunes', abierto: true, horaApertura: '09:00', horaCierre: '18:00' },
          { dia: 'Martes', abierto: true, horaApertura: '09:00', horaCierre: '18:00' },
          { dia: 'Miércoles', abierto: true, horaApertura: '09:00', horaCierre: '18:00' },
          { dia: 'Jueves', abierto: true, horaApertura: '09:00', horaCierre: '18:00' },
          { dia: 'Viernes', abierto: true, horaApertura: '09:00', horaCierre: '18:00' },
          { dia: 'Sábado', abierto: true, horaApertura: '10:00', horaCierre: '15:00' },
          { dia: 'Domingo', abierto: false, horaApertura: '10:00', horaCierre: '14:00' }
        ],
        lastUpdated: new Date().toISOString()
      };
      
      console.log('🎭 Using mock clinic info');
      return mockClinicInfo;
    } catch (error) {
      console.error('Error loading clinic info:', error);
      return null;
    }
  },

  async clearClinicInfo(): Promise<void> {
    try {
      await AsyncStorage.removeItem('clinic_info');
      console.log('🗑️ Clinic info cleared');
    } catch (error) {
      console.error('Error clearing clinic info:', error);
      throw new Error('No se pudo limpiar la información de la clínica');
    }
  },

  async updateClinicService(serviceId: string, updates: Partial<any>): Promise<void> {
    try {
      const clinicInfo = await this.getClinicInfo();
      if (!clinicInfo) throw new Error('No clinic info found');

      const updatedServicios = clinicInfo.servicios.map((service: any) =>
        service.id === serviceId ? { ...service, ...updates } : service
      );

      const updatedClinicInfo = {
        ...clinicInfo,
        servicios: updatedServicios,
        lastUpdated: new Date().toISOString()
      };

      await this.saveClinicInfo(updatedClinicInfo);
      console.log('✅ Service updated successfully');
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error('No se pudo actualizar el servicio');
    }
  },

  async addClinicService(service: any): Promise<void> {
    try {
      const clinicInfo = await this.getClinicInfo();
      if (!clinicInfo) throw new Error('No clinic info found');

      const newService = {
        ...service,
        id: Date.now().toString()
      };

      const updatedClinicInfo = {
        ...clinicInfo,
        servicios: [...clinicInfo.servicios, newService],
        lastUpdated: new Date().toISOString()
      };

      await this.saveClinicInfo(updatedClinicInfo);
      console.log('✅ Service added successfully');
    } catch (error) {
      console.error('Error adding service:', error);
      throw new Error('No se pudo agregar el servicio');
    }
  },

  async removeClinicService(serviceId: string): Promise<void> {
    try {
      const clinicInfo = await this.getClinicInfo();
      if (!clinicInfo) throw new Error('No clinic info found');

      const updatedServicios = clinicInfo.servicios.filter((service: any) => service.id !== serviceId);

      const updatedClinicInfo = {
        ...clinicInfo,
        servicios: updatedServicios,
        lastUpdated: new Date().toISOString()
      };

      await this.saveClinicInfo(updatedClinicInfo);
      console.log('✅ Service removed successfully');
    } catch (error) {
      console.error('Error removing service:', error);
      throw new Error('No se pudo eliminar el servicio');
    }
  }
};

export default veterinarianService;