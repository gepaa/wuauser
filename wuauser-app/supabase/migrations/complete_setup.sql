-- ============================================
-- WUAUSER - CONFIGURACIÓN COMPLETA DE SUPABASE
-- ============================================
-- Este script debe ejecutarse EN ORDEN en el SQL Editor de Supabase
-- Proyecto: wuauser-production
-- Fecha: 12 Octubre 2025
-- ============================================

-- ============================================
-- PASO 1: LIMPIAR TABLAS EXISTENTES (si es necesario)
-- ============================================
-- ADVERTENCIA: Solo ejecutar si quieres empezar desde cero
-- Descomentar la siguiente línea solo si es necesario:
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;

-- ============================================
-- PASO 2: EXTENSIONES NECESARIAS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PASO 3: FUNCIÓN PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 4: TABLA PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('dueno', 'veterinario', 'guest')),
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  codigo_postal TEXT,
  ciudad TEXT DEFAULT 'Ciudad de México',
  foto_url TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 5: TABLA VETERINARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS veterinarios (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_veterinarios_profile ON veterinarios(profile_id);
CREATE INDEX idx_veterinarios_location ON veterinarios(lat, lng);
CREATE INDEX idx_veterinarios_verificado ON veterinarios(verificado);

-- ============================================
-- PASO 6: TABLA MASCOTAS
-- ============================================
CREATE TABLE IF NOT EXISTS mascotas (
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
  qr_code TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  chip_id TEXT,
  esterilizado BOOLEAN DEFAULT false,
  vacunas JSONB DEFAULT '[]'::jsonb,
  condiciones_medicas TEXT[],
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mascotas_dueno ON mascotas(dueno_id);
CREATE INDEX idx_mascotas_qr ON mascotas(qr_code);
CREATE INDEX idx_mascotas_chip ON mascotas(chip_id);

-- Trigger para updated_at
CREATE TRIGGER update_mascotas_updated_at
  BEFORE UPDATE ON mascotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 7: TABLA PET_MEDICAL_RECORDS (NUEVA)
-- ============================================
CREATE TABLE IF NOT EXISTS pet_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES mascotas(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('vacuna', 'consulta', 'cirugia', 'tratamiento', 'emergencia')),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  veterinarian_id UUID REFERENCES veterinarios(id),
  veterinarian_name TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medical_records_pet ON pet_medical_records(pet_id);
CREATE INDEX idx_medical_records_date ON pet_medical_records(date DESC);
CREATE INDEX idx_medical_records_type ON pet_medical_records(record_type);

-- Trigger para updated_at
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON pet_medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASO 8: TABLA CITAS
-- ============================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id UUID REFERENCES mascotas(id) ON DELETE CASCADE,
  veterinario_id UUID REFERENCES veterinarios(id) ON DELETE SET NULL,
  dueno_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  motivo TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  notas TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  costo DECIMAL(10,2),
  -- Campos para pagos
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_intent_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_citas_mascota ON citas(mascota_id);
CREATE INDEX idx_citas_veterinario ON citas(veterinario_id);
CREATE INDEX idx_citas_dueno ON citas(dueno_id);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_citas_estado ON citas(estado);

-- ============================================
-- PASO 9: TABLAS DE CHAT
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  appointment_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chats_participants ON chats USING GIN(participant_ids);
CREATE INDEX idx_chats_appointment ON chats(appointment_id);

-- Trigger para updated_at
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'appointment', 'prescription')),
  text TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(chat_id, read) WHERE read = false;

-- ============================================
-- PASO 10: TABLAS DE PAGOS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES citas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_intent_id TEXT UNIQUE,
  payment_method_id TEXT,
  stripe_customer_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_intent ON payments(payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Trigger para updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- ============================================
-- PASO 11: HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 12: POLÍTICAS DE SEGURIDAD - PROFILES
-- ============================================
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PASO 13: POLÍTICAS DE SEGURIDAD - MASCOTAS
-- ============================================
CREATE POLICY "Owners can view their pets"
  ON mascotas FOR SELECT
  USING (auth.uid() = dueno_id);

CREATE POLICY "Owners can create their pets"
  ON mascotas FOR INSERT
  WITH CHECK (auth.uid() = dueno_id);

CREATE POLICY "Owners can update their pets"
  ON mascotas FOR UPDATE
  USING (auth.uid() = dueno_id);

CREATE POLICY "Owners can delete their pets"
  ON mascotas FOR DELETE
  USING (auth.uid() = dueno_id);

-- Veterinarios pueden ver mascotas de sus pacientes
CREATE POLICY "Vets can view their patients pets"
  ON mascotas FOR SELECT
  USING (
    id IN (
      SELECT mascota_id FROM citas
      WHERE veterinario_id IN (
        SELECT id FROM veterinarios WHERE profile_id = auth.uid()
      )
    )
  );

-- ============================================
-- PASO 14: POLÍTICAS - MEDICAL RECORDS
-- ============================================
CREATE POLICY "Owners can view their pets medical records"
  ON pet_medical_records FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM mascotas WHERE dueno_id = auth.uid()
    )
  );

CREATE POLICY "Veterinarians can view and create records"
  ON pet_medical_records FOR ALL
  USING (
    veterinarian_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

-- ============================================
-- PASO 15: POLÍTICAS - VETERINARIOS
-- ============================================
CREATE POLICY "Everyone can view verified veterinarians"
  ON veterinarios FOR SELECT
  USING (verificado = true);

CREATE POLICY "Veterinarians can view their own profile"
  ON veterinarios FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Veterinarians can update their own profile"
  ON veterinarios FOR UPDATE
  USING (profile_id = auth.uid());

-- ============================================
-- PASO 16: POLÍTICAS - CITAS
-- ============================================
CREATE POLICY "Users can view their own appointments"
  ON citas FOR SELECT
  USING (
    auth.uid() = dueno_id OR
    auth.uid() IN (
      SELECT profile_id FROM veterinarios WHERE id = veterinario_id
    )
  );

CREATE POLICY "Owners can create appointments"
  ON citas FOR INSERT
  WITH CHECK (auth.uid() = dueno_id);

CREATE POLICY "Users can update their appointments"
  ON citas FOR UPDATE
  USING (
    auth.uid() = dueno_id OR
    auth.uid() IN (
      SELECT profile_id FROM veterinarios WHERE id = veterinario_id
    )
  );

-- ============================================
-- PASO 17: POLÍTICAS - CHAT
-- ============================================
CREATE POLICY "Users can view their chats"
  ON chats FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create chats they participate in"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM chats WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT id FROM chats WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- ============================================
-- PASO 18: POLÍTICAS - PAYMENTS
-- ============================================
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their payment methods"
  ON payment_methods FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- PASO 19: FUNCIÓN PARA MANEJAR NUEVOS USUARIOS
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, tipo_usuario, nombre_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'dueno'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 20: TRIGGER PARA NUEVOS USUARIOS
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FIN DE CONFIGURACIÓN
-- ============================================
-- Verificar que todo se creó correctamente:

-- Listar todas las tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Contar políticas por tabla
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
