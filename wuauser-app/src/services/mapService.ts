import { supabase } from './supabase';

// ===============================================
// TIPOS E INTERFACES
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
  open: string; // "09:00"
  close: string; // "18:00"
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

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface DistanceResult {
  distance_km: number;
  duration_minutes?: number;
}

// ===============================================
// SERVICIO DE MAPAS
// ===============================================

class MapService {
  // ===== BÚSQUEDA DE CLÍNICAS =====

  /**
   * Busca clínicas veterinarias cercanas con filtros avanzados
   */
  async searchNearbyClinics(
    userLocation: { latitude: number; longitude: number },
    filters: SearchFilters = {}
  ): Promise<{ data: ClinicLocation[] | null; error: Error | null }> {
    try {
      console.log('🔍 MapService: Buscando clínicas cercanas...', {
        userLocation,
        filters
      });

      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const {
        radius_km = 10,
        specialties = [],
        services = [],
        min_rating = 0.0,
        emergency_only = false,
        open_24h_only = false
      } = filters;

      // Llamar función PostgreSQL optimizada
      const { data, error } = await supabase.rpc('search_nearby_clinics', {
        user_lat: userLocation.latitude,
        user_lng: userLocation.longitude,
        search_radius_km: radius_km,
        required_specialties: specialties,
        required_services: services,
        min_rating,
        emergency_only,
        open_24h_only
      });

      if (error) {
        console.error('🚨 Error en búsqueda de clínicas:', error);
        throw error;
      }

      console.log(`✅ Encontradas ${data?.length || 0} clínicas`);
      return { data: data || [], error: null };

    } catch (error) {
      console.error('MapService: Error en searchNearbyClinics', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al buscar clínicas veterinarias';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  /**
   * Búsqueda inteligente con algoritmo de matching
   */
  async smartSearch(
    userLocation: { latitude: number; longitude: number },
    filters: SearchFilters = {}
  ): Promise<{ data: ClinicLocation[] | null; error: Error | null }> {
    try {
      console.log('🧠 MapService: Búsqueda inteligente iniciada...', {
        userLocation,
        filters
      });

      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const {
        pet_species = '',
        urgent_care = false,
        services = []
      } = filters;

      // Usar función de búsqueda inteligente con machine learning básico
      const { data, error } = await supabase.rpc('smart_search_clinics', {
        user_lat: userLocation.latitude,
        user_lng: userLocation.longitude,
        pet_species,
        urgent_care,
        preferred_services: services
      });

      if (error) {
        console.error('🚨 Error en búsqueda inteligente:', error);
        throw error;
      }

      console.log(`🧠 Búsqueda inteligente: ${data?.length || 0} resultados con scoring`);
      return { data: data || [], error: null };

    } catch (error) {
      console.error('MapService: Error en smartSearch', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error en búsqueda inteligente';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  // ===== UBICACIONES DE MASCOTAS =====

  /**
   * Obtiene las ubicaciones de las mascotas del usuario
   */
  async getUserPetsLocations(
    userId: string,
    locationTypes: string[] = ['home', 'current']
  ): Promise<{ data: PetLocation[] | null; error: Error | null }> {
    try {
      console.log('📍 MapService: Obteniendo ubicaciones de mascotas...', {
        userId,
        locationTypes
      });

      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      // Usar función PostgreSQL optimizada
      const { data, error } = await supabase.rpc('get_user_pets_locations', {
        user_id: userId,
        location_types: locationTypes
      });

      if (error) {
        console.error('🚨 Error al obtener ubicaciones de mascotas:', error);
        throw error;
      }

      console.log(`✅ Encontradas ${data?.length || 0} ubicaciones de mascotas`);
      return { data: data || [], error: null };

    } catch (error) {
      console.error('MapService: Error en getUserPetsLocations', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al obtener ubicaciones de mascotas';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  /**
   * Actualiza la ubicación de una mascota
   */
  async updatePetLocation(
    petId: string,
    location: {
      latitude: number;
      longitude: number;
      address?: string;
      location_type?: 'home' | 'current' | 'last_seen' | 'lost';
      notes?: string;
    }
  ): Promise<{ data: PetLocation | null; error: Error | null }> {
    try {
      console.log('📍 MapService: Actualizando ubicación de mascota...', {
        petId,
        location
      });

      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      // Obtener el owner_id de la mascota
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('owner_id')
        .eq('id', petId)
        .single();

      if (petError || !pet) {
        throw new Error('No se encontró la mascota');
      }

      // Crear ubicación con PostGIS point
      const locationData = {
        pet_id: petId,
        owner_id: pet.owner_id,
        latitude: location.latitude,
        longitude: location.longitude,
        location: `POINT(${location.longitude} ${location.latitude})`,
        address: location.address,
        location_type: location.location_type || 'current',
        notes: location.notes,
        last_seen: new Date().toISOString()
      };

      // Upsert: actualizar si existe, crear si no existe
      const { data, error } = await supabase
        .from('pets_location')
        .upsert(locationData, {
          onConflict: 'pet_id,location_type',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('🚨 Error al actualizar ubicación:', error);
        throw error;
      }

      console.log('✅ Ubicación de mascota actualizada');
      return { data, error: null };

    } catch (error) {
      console.error('MapService: Error en updatePetLocation', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al actualizar ubicación de mascota';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  // ===== UTILIDADES GEOESPACIALES =====

  /**
   * Calcula la distancia entre dos puntos
   */
  calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Obtiene región del mapa basada en ubicaciones
   */
  getMapRegion(
    locations: Array<{ latitude: number; longitude: number }>,
    padding: number = 0.01
  ): MapRegion {
    if (locations.length === 0) {
      // Default: Ciudad de México
      return {
        latitude: 19.4326,
        longitude: -99.1332,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      };
    }

    if (locations.length === 1) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
    }

    // Calcular bounds
    const lats = locations.map(loc => loc.latitude);
    const lngs = locations.map(loc => loc.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const deltaLat = (maxLat - minLat) + padding;
    const deltaLng = (maxLng - minLng) + padding;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01)
    };
  }

  /**
   * Verifica si una clínica está abierta ahora
   */
  isClinicOpen(schedule: ClinicSchedule, is24Hours: boolean = false): boolean {
    if (is24Hours) return true;

    const now = new Date();
    const currentDay = now.toLocaleDateString('es-MX', { weekday: 'long' }).toLowerCase();
    
    // Mapear días en español a inglés
    const dayMap: Record<string, keyof ClinicSchedule> = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };

    const dayKey = dayMap[currentDay] || 'monday';
    const daySchedule = schedule[dayKey];

    if (daySchedule.closed) return false;

    const currentTime = now.toLocaleTimeString('es-MX', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return currentTime >= daySchedule.open && currentTime <= daySchedule.close;
  }

  // ===== CLÍNICAS DESTACADAS =====

  /**
   * Obtiene clínicas destacadas por rating y reviews
   */
  async getFeaturedClinics(
    userLocation?: { latitude: number; longitude: number },
    limit: number = 10
  ): Promise<{ data: ClinicLocation[] | null; error: Error | null }> {
    try {
      console.log('⭐ MapService: Obteniendo clínicas destacadas...');

      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      let query = supabase
        .from('veterinary_clinics')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .gte('rating', 4.0)
        .gte('total_reviews', 5)
        .order('rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('🚨 Error al obtener clínicas destacadas:', error);
        throw error;
      }

      // Si hay ubicación, calcular distancias
      const clinicsWithDistance = userLocation 
        ? data?.map(clinic => ({
            ...clinic,
            distance_km: this.calculateDistance(userLocation, {
              latitude: clinic.latitude,
              longitude: clinic.longitude
            })
          }))
        : data;

      console.log(`⭐ Obtenidas ${clinicsWithDistance?.length || 0} clínicas destacadas`);
      return { data: clinicsWithDistance || [], error: null };

    } catch (error) {
      console.error('MapService: Error en getFeaturedClinics', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al obtener clínicas destacadas';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  // ===== REVIEWS DE CLÍNICAS =====

  /**
   * Obtiene reviews de una clínica
   */
  async getClinicReviews(
    clinicId: string
  ): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('clinic_reviews')
        .select(`
          *,
          profiles:user_id(nombre_completo, foto_url)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🚨 Error al obtener reviews:', error);
        throw error;
      }

      return { data: data || [], error: null };

    } catch (error) {
      console.error('MapService: Error en getClinicReviews', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al obtener reviews de la clínica';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  /**
   * Crea una nueva review para una clínica
   */
  async createClinicReview(
    clinicId: string,
    userId: string,
    rating: number,
    comment?: string,
    visitDate?: string
  ): Promise<{ data: any | null; error: Error | null }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      if (rating < 1 || rating > 5) {
        throw new Error('El rating debe estar entre 1 y 5');
      }

      const reviewData = {
        clinic_id: clinicId,
        user_id: userId,
        rating,
        comment: comment?.trim(),
        visit_date: visitDate || new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('clinic_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.error('🚨 Error al crear review:', error);
        throw error;
      }

      console.log('✅ Review creada exitosamente');
      return { data, error: null };

    } catch (error) {
      console.error('MapService: Error en createClinicReview', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error al crear review de la clínica';
      return { data: null, error: new Error(errorMessage) };
    }
  }
}

// ===============================================
// INSTANCIA SINGLETON
// ===============================================

export const mapService = new MapService();

// ===============================================
// CONSTANTES Y UTILIDADES
// ===============================================

export const MEXICO_REGIONS = {
  CIUDAD_DE_MEXICO: {
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  },
  GUADALAJARA: {
    latitude: 20.6597,
    longitude: -103.3496,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  },
  MONTERREY: {
    latitude: 25.6866,
    longitude: -100.3161,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1
  }
};

export const COMMON_SPECIALTIES = [
  'general',
  'cirugía',
  'medicina interna',
  'dermatología',
  'cardiología',
  'oftalmología',
  'neurología',
  'oncología',
  'urgencias',
  'canina',
  'felina',
  'exóticos',
  'aves',
  'reptiles'
];

export const COMMON_SERVICES = [
  'consulta general',
  'vacunación',
  'desparasitación',
  'cirugía',
  'esterilización',
  'rayos x',
  'ultrasonido',
  'laboratorio',
  'hospitalización',
  'emergencias 24h',
  'peluquería canina',
  'hotel para mascotas'
];