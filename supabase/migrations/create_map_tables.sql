-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ===============================================
-- TABLA: veterinary_clinics
-- Información completa de clínicas veterinarias
-- ===============================================
CREATE TABLE IF NOT EXISTS veterinary_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Información básica
  clinic_name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Ubicación (PostGIS)
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'México',
  postal_code TEXT,
  
  -- Especialidades (array de strings)
  specialties TEXT[] DEFAULT '{}',
  
  -- Servicios disponibles
  services TEXT[] DEFAULT '{}',
  
  -- Horarios (JSONB flexible)
  schedule JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "14:00", "closed": false},
    "sunday": {"open": "00:00", "close": "00:00", "closed": true}
  }'::JSONB,
  
  -- Flags de operación
  is_24hours BOOLEAN DEFAULT false,
  is_emergency BOOLEAN DEFAULT false,
  accepts_pets BOOLEAN DEFAULT true,
  
  -- Rating y reviews
  rating DECIMAL(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5.0),
  total_reviews INTEGER DEFAULT 0,
  
  -- Status y verificación
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- TABLA: pets_location
-- Ubicaciones de mascotas para búsqueda
-- ===============================================
CREATE TABLE IF NOT EXISTS pets_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Ubicación actual (PostGIS)
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  
  -- Información de ubicación
  location_type TEXT DEFAULT 'home' CHECK (location_type IN ('home', 'current', 'last_seen', 'lost')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Contexto adicional
  notes TEXT,
  reported_by UUID REFERENCES profiles(id),
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- TABLA: clinic_reviews
-- Reviews de clínicas veterinarias
-- ===============================================
CREATE TABLE IF NOT EXISTS clinic_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES veterinary_clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Review data
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  visit_date DATE,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Un usuario solo puede tener una review por clínica
  UNIQUE(clinic_id, user_id)
);

-- ===============================================
-- ÍNDICES POSTGIS PARA BÚSQUEDA GEOESPACIAL
-- ===============================================

-- Índice espacial para veterinary_clinics
CREATE INDEX IF NOT EXISTS idx_veterinary_clinics_location 
ON veterinary_clinics USING GIST(location);

-- Índice espacial para pets_location  
CREATE INDEX IF NOT EXISTS idx_pets_location_location 
ON pets_location USING GIST(location);

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_veterinary_clinics_specialties 
ON veterinary_clinics USING GIN(specialties);

CREATE INDEX IF NOT EXISTS idx_veterinary_clinics_services 
ON veterinary_clinics USING GIN(services);

CREATE INDEX IF NOT EXISTS idx_veterinary_clinics_rating 
ON veterinary_clinics(rating DESC);

CREATE INDEX IF NOT EXISTS idx_veterinary_clinics_active 
ON veterinary_clinics(is_active, is_verified);

CREATE INDEX IF NOT EXISTS idx_pets_location_owner 
ON pets_location(owner_id, is_active);

CREATE INDEX IF NOT EXISTS idx_pets_location_type 
ON pets_location(location_type, is_active);

-- ===============================================
-- FUNCIONES POSTGIS PARA BÚSQUEDA INTELIGENTE
-- ===============================================

-- Función: Buscar clínicas cercanas con filtros
CREATE OR REPLACE FUNCTION search_nearby_clinics(
  user_lat DECIMAL,
  user_lng DECIMAL,
  search_radius_km INTEGER DEFAULT 10,
  required_specialties TEXT[] DEFAULT '{}',
  required_services TEXT[] DEFAULT '{}',
  min_rating DECIMAL DEFAULT 0.0,
  emergency_only BOOLEAN DEFAULT false,
  open_24h_only BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id UUID,
  clinic_name TEXT,
  description TEXT,
  phone TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  specialties TEXT[],
  services TEXT[],
  rating DECIMAL,
  total_reviews INTEGER,
  is_24hours BOOLEAN,
  is_emergency BOOLEAN,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vc.id,
    vc.clinic_name,
    vc.description,
    vc.phone,
    vc.latitude,
    vc.longitude,
    vc.address,
    vc.specialties,
    vc.services,
    vc.rating,
    vc.total_reviews,
    vc.is_24hours,
    vc.is_emergency,
    ROUND(
      ST_Distance(
        vc.location,
        ST_MakePoint(user_lng, user_lat)::geography
      ) / 1000, 2
    ) as distance_km
  FROM veterinary_clinics vc
  WHERE 
    vc.is_active = true
    AND vc.is_verified = true
    AND ST_DWithin(
      vc.location, 
      ST_MakePoint(user_lng, user_lat)::geography, 
      search_radius_km * 1000
    )
    AND (
      cardinality(required_specialties) = 0 
      OR vc.specialties && required_specialties
    )
    AND (
      cardinality(required_services) = 0 
      OR vc.services && required_services
    )
    AND vc.rating >= min_rating
    AND (emergency_only = false OR vc.is_emergency = true)
    AND (open_24h_only = false OR vc.is_24hours = true)
  ORDER BY distance_km ASC, vc.rating DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Función: Obtener ubicaciones de mascotas del usuario
CREATE OR REPLACE FUNCTION get_user_pets_locations(
  user_id UUID,
  location_types TEXT[] DEFAULT '{"home", "current"}'
)
RETURNS TABLE(
  pet_id UUID,
  pet_name TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  location_type TEXT,
  last_seen TIMESTAMPTZ,
  address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.pet_id,
    p.name as pet_name,
    pl.latitude,
    pl.longitude,
    pl.location_type,
    pl.last_seen,
    pl.address
  FROM pets_location pl
  JOIN pets p ON pl.pet_id = p.id
  WHERE 
    pl.owner_id = user_id
    AND pl.is_active = true
    AND pl.location_type = ANY(location_types)
  ORDER BY pl.last_seen DESC;
END;
$$ LANGUAGE plpgsql;

-- Función: Búsqueda inteligente con machine learning básico
CREATE OR REPLACE FUNCTION smart_search_clinics(
  user_lat DECIMAL,
  user_lng DECIMAL,
  pet_species TEXT DEFAULT '',
  urgent_care BOOLEAN DEFAULT false,
  preferred_services TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
  id UUID,
  clinic_name TEXT,
  phone TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  specialties TEXT[],
  services TEXT[],
  rating DECIMAL,
  distance_km DECIMAL,
  match_score INTEGER
) AS $$
DECLARE
  species_specialties TEXT[];
  search_radius INTEGER := 15;
BEGIN
  -- Mapear especies a especialidades
  CASE pet_species
    WHEN 'perro' THEN species_specialties := ARRAY['canina', 'general'];
    WHEN 'gato' THEN species_specialties := ARRAY['felina', 'general'];
    WHEN 'ave' THEN species_specialties := ARRAY['aves', 'exóticos'];
    WHEN 'reptil' THEN species_specialties := ARRAY['reptiles', 'exóticos'];
    ELSE species_specialties := ARRAY['general'];
  END CASE;

  -- Si es urgente, expandir radio de búsqueda
  IF urgent_care THEN
    search_radius := 50;
  END IF;

  RETURN QUERY
  SELECT 
    vc.id,
    vc.clinic_name,
    vc.phone,
    vc.latitude,
    vc.longitude,
    vc.specialties,
    vc.services,
    vc.rating,
    ROUND(
      ST_Distance(
        vc.location,
        ST_MakePoint(user_lng, user_lat)::geography
      ) / 1000, 2
    ) as distance_km,
    (
      -- Score por especialidades
      CASE 
        WHEN vc.specialties && species_specialties THEN 30
        ELSE 0
      END +
      -- Score por servicios
      CASE 
        WHEN cardinality(preferred_services) > 0 AND vc.services && preferred_services THEN 20
        ELSE 0
      END +
      -- Score por rating
      ROUND(vc.rating * 10)::INTEGER +
      -- Score por urgencia
      CASE 
        WHEN urgent_care AND vc.is_emergency THEN 25
        WHEN urgent_care AND vc.is_24hours THEN 15
        ELSE 0
      END +
      -- Score por proximidad (inverso de distancia)
      CASE 
        WHEN ST_Distance(vc.location, ST_MakePoint(user_lng, user_lat)::geography) < 5000 THEN 20
        WHEN ST_Distance(vc.location, ST_MakePoint(user_lng, user_lat)::geography) < 10000 THEN 10
        ELSE 0
      END
    ) as match_score
  FROM veterinary_clinics vc
  WHERE 
    vc.is_active = true
    AND vc.is_verified = true
    AND ST_DWithin(
      vc.location, 
      ST_MakePoint(user_lng, user_lat)::geography, 
      search_radius * 1000
    )
  ORDER BY match_score DESC, distance_km ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES  
-- ===============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE veterinary_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_reviews ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS PARA veterinary_clinics =====

-- Todos pueden leer clínicas activas y verificadas
CREATE POLICY "clinic_read_public" ON veterinary_clinics
FOR SELECT USING (is_active = true AND is_verified = true);

-- Solo los dueños pueden insertar/actualizar su clínica
CREATE POLICY "clinic_write_owner" ON veterinary_clinics
FOR ALL USING (profile_id = auth.uid());

-- ===== POLÍTICAS PARA pets_location =====

-- Solo el dueño puede ver las ubicaciones de sus mascotas
CREATE POLICY "pet_location_read_owner" ON pets_location
FOR SELECT USING (owner_id = auth.uid());

-- Solo el dueño puede insertar/actualizar ubicaciones
CREATE POLICY "pet_location_write_owner" ON pets_location
FOR ALL USING (owner_id = auth.uid());

-- ===== POLÍTICAS PARA clinic_reviews =====

-- Todos pueden leer reviews
CREATE POLICY "reviews_read_public" ON clinic_reviews
FOR SELECT USING (true);

-- Solo el autor puede escribir/modificar su review
CREATE POLICY "reviews_write_owner" ON clinic_reviews
FOR ALL USING (user_id = auth.uid());

-- ===============================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ===============================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabla
CREATE TRIGGER update_veterinary_clinics_updated_at 
BEFORE UPDATE ON veterinary_clinics 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_location_updated_at 
BEFORE UPDATE ON pets_location 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_reviews_updated_at 
BEFORE UPDATE ON clinic_reviews 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- TRIGGER PARA ACTUALIZAR RATING DE CLÍNICAS
-- ===============================================

-- Función para recalcular rating de clínica
CREATE OR REPLACE FUNCTION update_clinic_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE veterinary_clinics 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM clinic_reviews 
      WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM clinic_reviews 
      WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
    )
  WHERE id = COALESCE(NEW.clinic_id, OLD.clinic_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular rating
CREATE TRIGGER update_clinic_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON clinic_reviews
FOR EACH ROW EXECUTE FUNCTION update_clinic_rating();

-- ===============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ===============================================

-- Insertar algunas clínicas de ejemplo para testing
/*
INSERT INTO veterinary_clinics (
  clinic_name, description, phone, 
  latitude, longitude, location, address, city,
  specialties, services, is_emergency, is_24hours
) VALUES 
(
  'Veterinaria San Ángel',
  'Clínica veterinaria especializada en medicina interna y cirugía',
  '+52 55 5555 0001',
  19.3493, -99.1912,
  ST_MakePoint(-99.1912, 19.3493),
  'Av. Revolución 1425, San Ángel',
  'Ciudad de México',
  ARRAY['general', 'cirugía', 'medicina interna'],
  ARRAY['consulta general', 'cirugía', 'rayos x', 'laboratorio'],
  true, false
),
(
  'Hospital Veterinario 24h Roma Norte', 
  'Hospital veterinario de emergencias 24 horas',
  '+52 55 5555 0002',
  19.4167, -99.1569,
  ST_MakePoint(-99.1569, 19.4167),
  'Calle Orizaba 35, Roma Norte',
  'Ciudad de México',
  ARRAY['emergencias', 'medicina interna', 'cirugía'],
  ARRAY['emergencias', 'hospitalización', 'cirugía', 'terapia intensiva'],
  true, true
);
*/

-- ===============================================
-- COMENTARIOS FINALES
-- ===============================================

-- Esta migración crea:
-- 1. Tablas optimizadas para búsqueda geoespacial
-- 2. Índices PostGIS para consultas rápidas  
-- 3. Funciones PostgreSQL para búsqueda inteligente
-- 4. Políticas RLS para seguridad
-- 5. Triggers para mantener datos consistentes

-- Para usar estas funciones desde la app:
-- SELECT * FROM search_nearby_clinics(19.4326, -99.1332, 10);
-- SELECT * FROM get_user_pets_locations('uuid-here');
-- SELECT * FROM smart_search_clinics(19.4326, -99.1332, 'perro', false);