-- ARCHIVO PARA QUE EL USUARIO COPIE Y PEGUE EN SUPABASE

-- ============================================
-- PASO 1: Eliminar tablas si existen (para reiniciar)
-- ============================================
DROP TABLE IF EXISTS mascotas CASCADE;
DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS veterinarios CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- PASO 2: Crear tabla de perfiles de usuario
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('dueno', 'veterinario', 'guest')),
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  ciudad TEXT DEFAULT 'Ciudad de México',
  foto_url TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 3: Crear tabla de veterinarios
-- ============================================
CREATE TABLE veterinarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre_clinica TEXT NOT NULL,
  cedula_profesional TEXT UNIQUE,
  especialidad TEXT,
  direccion_clinica TEXT NOT NULL,
  telefono_clinica TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  servicios TEXT[],
  horario JSONB,
  rating DECIMAL(2,1) DEFAULT 5.0,
  verificado BOOLEAN DEFAULT false,
  foto_cedula_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 4: Crear tabla de mascotas
-- ============================================
CREATE TABLE mascotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dueno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')),
  raza TEXT,
  sexo TEXT CHECK (sexo IN ('macho', 'hembra')),
  fecha_nacimiento DATE,
  peso DECIMAL(5,2),
  color TEXT,
  foto_url TEXT,
  qr_code TEXT UNIQUE DEFAULT gen_random_uuid(),
  chip_id TEXT,
  esterilizado BOOLEAN DEFAULT false,
  vacunas JSONB DEFAULT '[]',
  condiciones_medicas TEXT[],
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 5: Crear tabla de citas
-- ============================================
CREATE TABLE citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id UUID REFERENCES mascotas(id) ON DELETE CASCADE,
  veterinario_id UUID REFERENCES veterinarios(id) ON DELETE SET NULL,
  dueno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP NOT NULL,
  motivo TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  notas TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  costo DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASO 6: Habilitar Row Level Security (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 7: Crear políticas de seguridad
-- ============================================

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Permitir inserción de perfiles durante registro"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para mascotas
CREATE POLICY "Los dueños pueden ver sus mascotas"
  ON mascotas FOR SELECT
  USING (auth.uid() = dueno_id);

CREATE POLICY "Los dueños pueden crear mascotas"
  ON mascotas FOR INSERT
  WITH CHECK (auth.uid() = dueno_id);

CREATE POLICY "Los dueños pueden actualizar sus mascotas"
  ON mascotas FOR UPDATE
  USING (auth.uid() = dueno_id);

CREATE POLICY "Los dueños pueden eliminar sus mascotas"
  ON mascotas FOR DELETE
  USING (auth.uid() = dueno_id);

-- Políticas para veterinarios (públicos)
CREATE POLICY "Todos pueden ver veterinarios verificados"
  ON veterinarios FOR SELECT
  USING (verificado = true);

-- Políticas para citas
CREATE POLICY "Los usuarios pueden ver sus propias citas"
  ON citas FOR SELECT
  USING (auth.uid() = dueno_id OR auth.uid() IN (
    SELECT profile_id FROM veterinarios WHERE id = veterinario_id
  ));

CREATE POLICY "Los dueños pueden crear citas"
  ON citas FOR INSERT
  WITH CHECK (auth.uid() = dueno_id);

-- ============================================
-- PASO 8: Crear función para manejar nuevos usuarios
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, tipo_usuario, nombre_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'dueno'),
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 9: Crear trigger para nuevos usuarios
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- PASO 10: Insertar datos de prueba (OPCIONAL)
-- ============================================
-- NOTA: Los datos de prueba se insertarán automáticamente
-- cuando registres usuarios reales en la aplicación.
-- El trigger handle_new_user() se encargará de crear los perfiles.

-- Si quieres veterinarios de prueba, primero debes:
-- 1. Registrar usuarios reales en la app
-- 2. Luego ejecutar estos inserts con los IDs reales

/*
-- Ejemplo para después de registrar usuarios:
-- Reemplaza los UUIDs con los IDs reales de usuarios registrados

INSERT INTO veterinarios (profile_id, nombre_clinica, direccion_clinica, lat, lng, servicios, verificado)
VALUES 
  ('UUID_REAL_DE_USUARIO_1', 'Hospital Veterinario Roma Norte', 'Av. Álvaro Obregón 185, Roma Norte', 19.4204, -99.1650, ARRAY['Consulta General', 'Cirugía', 'Emergencias'], true),
  ('UUID_REAL_DE_USUARIO_2', 'Clínica Veterinaria Condesa', 'Av. Tamaulipas 141, Condesa', 19.4127, -99.1695, ARRAY['Consulta General', 'Vacunación', 'Estética'], true);
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================