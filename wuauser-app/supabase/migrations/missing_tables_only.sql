-- ============================================
-- WUAUSER - CREAR SOLO TABLAS FALTANTES
-- ============================================
-- Este script crea únicamente las 5 tablas que faltan
-- Fecha: 12 Oct 2025
-- Tablas: pet_medical_records, chats, messages, payments, payment_methods
-- ============================================

-- 1. TABLA: pet_medical_records
-- ============================================
CREATE TABLE IF NOT EXISTS pet_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  veterinario_id UUID REFERENCES veterinarios(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('vacuna', 'consulta', 'cirugia', 'tratamiento', 'analisis', 'otro')),
  titulo TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  medicamentos JSONB DEFAULT '[]'::jsonb,
  proxima_revision DATE,
  archivos_url TEXT[],
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pet_medical_records
CREATE INDEX IF NOT EXISTS idx_pet_medical_records_mascota ON pet_medical_records(mascota_id);
CREATE INDEX IF NOT EXISTS idx_pet_medical_records_vet ON pet_medical_records(veterinario_id);
CREATE INDEX IF NOT EXISTS idx_pet_medical_records_fecha ON pet_medical_records(fecha DESC);

-- RLS para pet_medical_records
ALTER TABLE pet_medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dueños pueden ver registros de sus mascotas"
  ON pet_medical_records FOR SELECT
  USING (
    mascota_id IN (
      SELECT id FROM mascotas WHERE dueno_id = auth.uid()
    )
  );

CREATE POLICY "Veterinarios pueden crear registros"
  ON pet_medical_records FOR INSERT
  WITH CHECK (
    veterinario_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Veterinarios pueden editar sus registros"
  ON pet_medical_records FOR UPDATE
  USING (
    veterinario_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_pet_medical_records_updated_at
  BEFORE UPDATE ON pet_medical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLA: chats
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para chats
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);

-- RLS para chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios chats"
  ON chats FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Usuarios pueden crear chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- Trigger para updated_at
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. TABLA: messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio')),
  text TEXT,
  media_url TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(chat_id, read) WHERE read = false;

-- RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver mensajes de sus chats"
  ON messages FOR SELECT
  USING (
    chat_id IN (
      SELECT id FROM chats WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Usuarios pueden enviar mensajes en sus chats"
  ON messages FOR INSERT
  WITH CHECK (
    chat_id IN (
      SELECT id FROM chats WHERE auth.uid() = ANY(participant_ids)
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Usuarios pueden actualizar estado de lectura de mensajes"
  ON messages FOR UPDATE
  USING (
    chat_id IN (
      SELECT id FROM chats WHERE auth.uid() = ANY(participant_ids)
    )
  );

-- 4. TABLA: payments
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  dueno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  veterinario_id UUID NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_intent_id TEXT UNIQUE,
  payment_method_id TEXT,
  stripe_charge_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_cita ON payments(cita_id);
CREATE INDEX IF NOT EXISTS idx_payments_dueno ON payments(dueno_id);
CREATE INDEX IF NOT EXISTS idx_payments_vet ON payments(veterinario_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_intent ON payments(payment_intent_id);

-- RLS para payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios pagos"
  ON payments FOR SELECT
  USING (dueno_id = auth.uid());

CREATE POLICY "Veterinarios pueden ver pagos de sus citas"
  ON payments FOR SELECT
  USING (
    veterinario_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. TABLA: payment_methods
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'oxxo')),
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- RLS para payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios métodos de pago"
  ON payment_methods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden crear sus propios métodos de pago"
  ON payment_methods FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propios métodos de pago"
  ON payment_methods FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Ejecuta esto para verificar que todo se creó correctamente:

SELECT
  'pet_medical_records' as tabla,
  COUNT(*) as registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'pet_medical_records') as policies
FROM pet_medical_records
UNION ALL
SELECT
  'chats' as tabla,
  COUNT(*) as registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'chats') as policies
FROM chats
UNION ALL
SELECT
  'messages' as tabla,
  COUNT(*) as registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'messages') as policies
FROM messages
UNION ALL
SELECT
  'payments' as tabla,
  COUNT(*) as registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'payments') as policies
FROM payments
UNION ALL
SELECT
  'payment_methods' as tabla,
  COUNT(*) as registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'payment_methods') as policies
FROM payment_methods;

-- Deberías ver:
-- pet_medical_records: 0 registros, 3 policies
-- chats: 0 registros, 2 policies
-- messages: 0 registros, 3 policies
-- payments: 0 registros, 2 policies
-- payment_methods: 0 registros, 3 policies
