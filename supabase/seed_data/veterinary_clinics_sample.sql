-- ===============================================
-- DATOS DE EJEMPLO PARA CLÍNICAS VETERINARIAS
-- Ciudad de México y alrededores
-- ===============================================

-- IMPORTANTE: Ejecutar después de create_map_tables.sql

INSERT INTO veterinary_clinics (
  clinic_name, 
  description, 
  phone, 
  email,
  latitude, 
  longitude, 
  location, 
  address, 
  city, 
  state,
  postal_code,
  specialties, 
  services, 
  is_emergency, 
  is_24hours,
  is_verified,
  is_active,
  rating
) VALUES 

-- Roma Norte
(
  'Veterinaria San Ángel',
  'Clínica veterinaria especializada en medicina interna y cirugía. Más de 20 años cuidando a tus mascotas.',
  '+52 55 5555 0001',
  'contacto@veterinariasanangel.com',
  19.3493, -99.1912,
  ST_MakePoint(-99.1912, 19.3493),
  'Av. Revolución 1425, San Ángel Inn',
  'Ciudad de México',
  'Ciudad de México',
  '01060',
  ARRAY['general', 'cirugía', 'medicina interna', 'cardiología'],
  ARRAY['consulta general', 'cirugía', 'rayos x', 'laboratorio', 'hospitalización'],
  true, false, true, true, 4.5
),

-- Condesa
(
  'Hospital Veterinario 24h Roma Norte', 
  'Hospital veterinario de emergencias 24 horas con equipo especializado',
  '+52 55 5555 0002',
  'emergencias@hosp24roma.com',
  19.4167, -99.1569,
  ST_MakePoint(-99.1569, 19.4167),
  'Calle Orizaba 35, Roma Norte',
  'Ciudad de México',
  'Ciudad de México',
  '06700',
  ARRAY['emergencias', 'medicina interna', 'cirugía', 'neurología'],
  ARRAY['emergencias 24h', 'hospitalización', 'cirugía', 'terapia intensiva', 'rayos x', 'ultrasonido'],
  true, true, true, true, 4.8
),

-- Polanco
(
  'Clínica Veterinaria Polanco Elite',
  'Atención veterinaria de lujo para mascotas VIP',
  '+52 55 5555 0003',
  'info@vetpolancoelite.com',
  19.4326, -99.1957,
  ST_MakePoint(-99.1957, 19.4326),
  'Av. Presidente Masaryk 201, Polanco',
  'Ciudad de México',
  'Ciudad de México',
  '11560',
  ARRAY['general', 'dermatología', 'oftalmología', 'canina', 'felina'],
  ARRAY['consulta general', 'peluquería canina', 'hotel para mascotas', 'spa canino', 'vacunación'],
  false, false, true, true, 4.7
),

-- Del Valle
(
  'Centro Veterinario Del Valle',
  'Tu veterinaria de confianza en Del Valle Sur',
  '+52 55 5555 0004',
  'citas@vetdelvalle.com',
  19.3711, -99.1644,
  ST_MakePoint(-99.1644, 19.3711),
  'Eje 7 Sur (Félix Cuevas) 522, Del Valle Sur',
  'Ciudad de México',
  'Ciudad de México',
  '03100',
  ARRAY['general', 'vacunación', 'cirugía'],
  ARRAY['consulta general', 'vacunación', 'desparasitación', 'esterilización', 'rayos x'],
  false, false, true, true, 4.2
),

-- Coyoacán
(
  'Veterinaria Coyoacán Tradicional',
  'Clínica familiar especializada en medicina preventiva',
  '+52 55 5555 0005',
  'atencion@vetcoyoacan.com',
  19.3467, -99.1634,
  ST_MakePoint(-99.1634, 19.3467),
  'Av. Miguel Ángel de Quevedo 687, Coyoacán',
  'Ciudad de México',
  'Ciudad de México',
  '04020',
  ARRAY['general', 'medicina preventiva', 'canina', 'felina'],
  ARRAY['consulta general', 'vacunación', 'desparasitación', 'control de peso', 'nutrición'],
  false, false, true, true, 4.3
),

-- Insurgentes Sur
(
  'Hospital Veterinario Insurgentes',
  'Hospital moderno con tecnología de punta',
  '+52 55 5555 0006',
  'info@hospinsurgentes.com',
  19.3319, -99.1736,
  ST_MakePoint(-99.1736, 19.3319),
  'Av. Insurgentes Sur 3579, Tlalpan',
  'Ciudad de México',
  'Ciudad de México',
  '14000',
  ARRAY['emergencias', 'cirugía', 'oncología', 'cardiología'],
  ARRAY['emergencias', 'cirugía mayor', 'quimioterapia', 'ecocardiograma', 'tomografía'],
  true, false, true, true, 4.6
),

-- Narvarte
(
  'Clínica Veterinaria Narvarte',
  'Especialistas en mascotas pequeñas y exóticas',
  '+52 55 5555 0007',
  'contacto@vetnarvarte.com',
  19.3889, -99.1553,
  ST_MakePoint(-99.1553, 19.3889),
  'Dr. José María Vértiz 1008, Narvarte Poniente',
  'Ciudad de México',
  'Ciudad de México',
  '03020',
  ARRAY['general', 'exóticos', 'aves', 'reptiles'],
  ARRAY['consulta general', 'consulta exóticos', 'cirugía menor', 'laboratorio'],
  false, false, true, true, 4.1
),

-- Santa Fe
(
  'Veterinaria Santa Fe Business',
  'Clínica moderna en zona corporativa',
  '+52 55 5555 0008',
  'citas@vetsantafe.com',
  19.3578, -99.2614,
  ST_MakePoint(-99.2614, 19.3578),
  'Av. Santa Fe 495, Santa Fe',
  'Ciudad de México',
  'Ciudad de México',
  '05348',
  ARRAY['general', 'medicina preventiva', 'dermatología'],
  ARRAY['consulta general', 'vacunación', 'peluquería canina', 'hotel para mascotas'],
  false, false, true, true, 4.4
),

-- Xochimilco
(
  'Hospital Veterinario Xochimilco 24h',
  'Emergencias veterinarias en el sur de la ciudad',
  '+52 55 5555 0009',
  'urgencias@vetxochimilco24.com',
  19.2647, -99.1031,
  ST_MakePoint(-99.1031, 19.2647),
  'Calz. México-Xochimilco 1234, Xochimilco',
  'Ciudad de México',
  'Ciudad de México',
  '16000',
  ARRAY['emergencias', 'medicina interna', 'cirugía'],
  ARRAY['emergencias 24h', 'hospitalización', 'cirugía', 'rayos x', 'laboratorio'],
  true, true, true, true, 4.0
),

-- Lindavista
(
  'Clínica Veterinaria Norte',
  'Tu veterinaria de barrio en el norte de la ciudad',
  '+52 55 5555 0010',
  'info@vetnorte.com',
  19.4858, -99.1419,
  ST_MakePoint(-99.1419, 19.4858),
  'Av. Montevideo 363, Lindavista Norte',
  'Ciudad de México',
  'Ciudad de México',
  '07300',
  ARRAY['general', 'vacunación', 'medicina preventiva'],
  ARRAY['consulta general', 'vacunación', 'desparasitación', 'esterilización'],
  false, false, true, true, 4.2
);

-- ===============================================
-- DATOS DE UBICACIONES DE MASCOTAS (EJEMPLO)
-- ===============================================

-- Nota: Estas serían creadas por los usuarios reales
-- Solo incluimos algunas de ejemplo para testing

/*
INSERT INTO pets_location (
  pet_id,
  owner_id, 
  latitude, 
  longitude, 
  location,
  address,
  location_type,
  last_seen
) VALUES
(
  gen_random_uuid(), -- Requiere pet_id válido
  gen_random_uuid(), -- Requiere owner_id válido
  19.4326, -99.1332,
  ST_MakePoint(-99.1332, 19.4326),
  'Zócalo, Centro Histórico, Ciudad de México',
  'home',
  NOW()
);
*/

-- ===============================================
-- REVIEWS DE EJEMPLO
-- ===============================================

-- Insertar algunas reviews de ejemplo
-- Nota: Requiere user_ids válidos en la tabla profiles

/*
INSERT INTO clinic_reviews (clinic_id, user_id, rating, comment, visit_date)
SELECT 
  c.id,
  gen_random_uuid(), -- Requiere user_id válido
  5,
  'Excelente atención, muy profesionales y mi mascota se sintió cómoda.',
  CURRENT_DATE - INTERVAL '30 days'
FROM veterinary_clinics c 
WHERE c.clinic_name = 'Hospital Veterinario 24h Roma Norte';
*/

-- ===============================================
-- VERIFICAR DATOS INSERTADOS
-- ===============================================

-- Verificar clínicas insertadas
SELECT 
  clinic_name,
  city,
  rating,
  specialties,
  is_emergency,
  is_24hours
FROM veterinary_clinics 
ORDER BY rating DESC;

-- Verificar función de búsqueda cercana
SELECT * FROM search_nearby_clinics(19.4326, -99.1332, 5);

-- Verificar función de búsqueda inteligente
SELECT * FROM smart_search_clinics(19.4326, -99.1332, 'perro', false);