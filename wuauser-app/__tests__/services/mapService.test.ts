import { mapService, ClinicLocation, SearchFilters, MapRegion } from '../../src/services/mapService';
import { supabase } from '../../src/services/supabase';

// Mock Supabase
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock data
const mockUserLocation = {
  latitude: 19.4326,
  longitude: -99.1332,
};

const mockClinicData = [
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
  },
];

describe('MapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchNearbyClinics', () => {
    it('debe buscar clínicas cercanas exitosamente', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockClinicData,
        error: null,
      });

      const filters: SearchFilters = {
        radius_km: 10,
        emergency_only: false,
        min_rating: 0,
      };

      const result = await mapService.searchNearbyClinics(mockUserLocation, filters);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_nearby_clinics', {
        user_lat: mockUserLocation.latitude,
        user_lng: mockUserLocation.longitude,
        search_radius_km: 10,
        required_specialties: [],
        required_services: [],
        min_rating: 0,
        emergency_only: false,
        open_24h_only: false,
      });

      expect(result.data).toEqual(mockClinicData);
      expect(result.error).toBeNull();
    });

    it('debe aplicar filtros correctamente', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockClinicData,
        error: null,
      });

      const filters: SearchFilters = {
        radius_km: 5,
        emergency_only: true,
        open_24h_only: true,
        min_rating: 4.0,
        specialties: ['emergencias'],
        services: ['emergencias 24h'],
      };

      await mapService.searchNearbyClinics(mockUserLocation, filters);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_nearby_clinics', {
        user_lat: mockUserLocation.latitude,
        user_lng: mockUserLocation.longitude,
        search_radius_km: 5,
        required_specialties: ['emergencias'],
        required_services: ['emergencias 24h'],
        min_rating: 4.0,
        emergency_only: true,
        open_24h_only: true,
      });
    });

    it('debe manejar errores de Supabase', async () => {
      const mockError = new Error('Database connection failed');
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await mapService.searchNearbyClinics(mockUserLocation);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Database connection failed');
    });

    it('debe usar valores por defecto para filtros', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await mapService.searchNearbyClinics(mockUserLocation);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_nearby_clinics', {
        user_lat: mockUserLocation.latitude,
        user_lng: mockUserLocation.longitude,
        search_radius_km: 10,
        required_specialties: [],
        required_services: [],
        min_rating: 0.0,
        emergency_only: false,
        open_24h_only: false,
      });
    });

    it('debe manejar respuesta vacía', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await mapService.searchNearbyClinics(mockUserLocation);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('smartSearch', () => {
    it('debe realizar búsqueda inteligente exitosamente', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: mockClinicData,
        error: null,
      });

      const filters: SearchFilters = {
        pet_species: 'perro',
        urgent_care: true,
        services: ['cirugía'],
      };

      const result = await mapService.smartSearch(mockUserLocation, filters);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('smart_search_clinics', {
        user_lat: mockUserLocation.latitude,
        user_lng: mockUserLocation.longitude,
        pet_species: 'perro',
        urgent_care: true,
        preferred_services: ['cirugía'],
      });

      expect(result.data).toEqual(mockClinicData);
      expect(result.error).toBeNull();
    });

    it('debe manejar parámetros opcionales', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await mapService.smartSearch(mockUserLocation);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('smart_search_clinics', {
        user_lat: mockUserLocation.latitude,
        user_lng: mockUserLocation.longitude,
        pet_species: '',
        urgent_care: false,
        preferred_services: [],
      });
    });
  });

  describe('getFeaturedClinics', () => {
    const mockFeaturedClinics = mockClinicData.filter(clinic => 
      clinic.rating >= 4.0 && clinic.total_reviews >= 5
    );

    it('debe obtener clínicas destacadas', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockFeaturedClinics,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await mapService.getFeaturedClinics();

      expect(mockSupabase.from).toHaveBeenCalledWith('veterinary_clinics');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_verified', true);
      expect(mockQuery.gte).toHaveBeenCalledWith('rating', 4.0);
      expect(mockQuery.gte).toHaveBeenCalledWith('total_reviews', 5);
      expect(result.data).toEqual(mockFeaturedClinics);
    });

    it('debe calcular distancias cuando se proporciona ubicación', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockFeaturedClinics,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await mapService.getFeaturedClinics(mockUserLocation);

      expect(result.data).toBeDefined();
      if (result.data) {
        result.data.forEach(clinic => {
          expect(clinic.distance_km).toBeDefined();
          expect(typeof clinic.distance_km).toBe('number');
        });
      }
    });
  });

  describe('calculateDistance', () => {
    it('debe calcular distancia entre dos puntos correctamente', () => {
      const point1 = { latitude: 19.4326, longitude: -99.1332 };
      const point2 = { latitude: 19.4300, longitude: -99.1300 };

      const distance = mapService.calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Debe ser menos de 10km para esta distancia corta
    });

    it('debe devolver 0 para el mismo punto', () => {
      const point = { latitude: 19.4326, longitude: -99.1332 };
      const distance = mapService.calculateDistance(point, point);

      expect(distance).toBe(0);
    });

    it('debe calcular distancias largas correctamente', () => {
      const cdmx = { latitude: 19.4326, longitude: -99.1332 };
      const guadalajara = { latitude: 20.6597, longitude: -103.3496 };

      const distance = mapService.calculateDistance(cdmx, guadalajara);

      expect(distance).toBeGreaterThan(400); // ~460km entre estas ciudades
      expect(distance).toBeLessThan(500);
    });
  });

  describe('getMapRegion', () => {
    it('debe devolver región por defecto para array vacío', () => {
      const region = mapService.getMapRegion([]);

      expect(region).toEqual({
        latitude: 19.4326,
        longitude: -99.1332,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    });

    it('debe devolver región centrada para una ubicación', () => {
      const location = { latitude: 19.4300, longitude: -99.1300 };
      const region = mapService.getMapRegion([location]);

      expect(region.latitude).toBe(19.4300);
      expect(region.longitude).toBe(-99.1300);
      expect(region.latitudeDelta).toBe(0.01);
      expect(region.longitudeDelta).toBe(0.01);
    });

    it('debe calcular región que incluya múltiples ubicaciones', () => {
      const locations = [
        { latitude: 19.4200, longitude: -99.1200 },
        { latitude: 19.4400, longitude: -99.1400 },
      ];
      
      const region = mapService.getMapRegion(locations);

      expect(region.latitude).toBe(19.43); // Centro entre 19.42 y 19.44
      expect(region.longitude).toBe(-99.13); // Centro entre -99.12 y -99.14
      expect(region.latitudeDelta).toBeGreaterThan(0.01);
      expect(region.longitudeDelta).toBeGreaterThan(0.01);
    });

    it('debe aplicar padding correctamente', () => {
      const locations = [
        { latitude: 19.4200, longitude: -99.1200 },
        { latitude: 19.4400, longitude: -99.1400 },
      ];
      
      const regionWithPadding = mapService.getMapRegion(locations, 0.05);
      const regionNoPadding = mapService.getMapRegion(locations, 0);

      expect(regionWithPadding.latitudeDelta).toBeGreaterThan(regionNoPadding.latitudeDelta);
      expect(regionWithPadding.longitudeDelta).toBeGreaterThan(regionNoPadding.longitudeDelta);
    });
  });

  describe('isClinicOpen', () => {
    const mockSchedule = {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true },
    };

    it('debe devolver true para clínicas 24 horas', () => {
      const isOpen = mapService.isClinicOpen(mockSchedule, true);
      expect(isOpen).toBe(true);
    });

    it('debe devolver false para días cerrados', () => {
      // Mock para que sea domingo
      const mockDate = new Date('2024-01-07'); // Domingo
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const isOpen = mapService.isClinicOpen(mockSchedule, false);
      expect(isOpen).toBe(false);

      (global.Date as any).mockRestore();
    });

    it('debe verificar horarios correctamente', () => {
      // Mock para lunes a las 10:00
      const mockDate = new Date('2024-01-08T10:00:00'); // Lunes
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      const mockToLocaleTimeString = jest.spyOn(mockDate, 'toLocaleTimeString');
      mockToLocaleTimeString.mockReturnValue('10:00');

      const isOpen = mapService.isClinicOpen(mockSchedule, false);
      expect(isOpen).toBe(true);

      (global.Date as any).mockRestore();
    });
  });

  describe('getClinicReviews', () => {
    it('debe obtener reviews de una clínica', async () => {
      const mockReviews = [
        {
          id: '1',
          clinic_id: 'clinic1',
          user_id: 'user1',
          rating: 5,
          comment: 'Excelente servicio',
          profiles: { nombre_completo: 'Juan Pérez' },
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockReviews,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await mapService.getClinicReviews('clinic1');

      expect(mockSupabase.from).toHaveBeenCalledWith('clinic_reviews');
      expect(mockQuery.eq).toHaveBeenCalledWith('clinic_id', 'clinic1');
      expect(result.data).toEqual(mockReviews);
    });
  });

  describe('createClinicReview', () => {
    it('debe crear review exitosamente', async () => {
      const mockReview = {
        id: '1',
        clinic_id: 'clinic1',
        user_id: 'user1',
        rating: 5,
        comment: 'Excelente atención',
      };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockReview,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await mapService.createClinicReview(
        'clinic1',
        'user1',
        5,
        'Excelente atención'
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('clinic_reviews');
      expect(mockQuery.insert).toHaveBeenCalled();
      expect(result.data).toEqual(mockReview);
    });

    it('debe validar rating fuera de rango', async () => {
      const result = await mapService.createClinicReview(
        'clinic1',
        'user1',
        6, // Rating inválido
        'Comentario'
      );

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('El rating debe estar entre 1 y 5');
    });

    it('debe usar fecha actual por defecto', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const today = new Date().toISOString().split('T')[0];

      await mapService.createClinicReview('clinic1', 'user1', 5);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          visit_date: today,
        })
      );
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar Supabase no configurado', async () => {
      const originalSupabase = require('../../src/services/supabase').supabase;
      
      // Temporalmente hacer supabase null
      require('../../src/services/supabase').supabase = null;

      const result = await mapService.searchNearbyClinics(mockUserLocation);

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Supabase no está configurado');

      // Restaurar supabase
      require('../../src/services/supabase').supabase = originalSupabase;
    });

    it('debe manejar errores de red', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      const result = await mapService.searchNearbyClinics(mockUserLocation);

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('Performance tests', () => {
    it('debe completar búsqueda en tiempo razonable', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: Array(100).fill(mockClinicData[0]), // 100 clínicas
        error: null,
      });

      const startTime = Date.now();
      
      await mapService.searchNearbyClinics(mockUserLocation);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
    });
  });
});
