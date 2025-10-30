-- ============================================================================
-- WUAUSER SUBSCRIPTION SYSTEM - MODELO DOCTORALIA
-- ============================================================================
-- Fecha: 29 de Octubre, 2025
-- Descripción: Sistema completo de suscripciones mensuales para veterinarios
-- Modelo: B2B2C - Veterinarios pagan suscripción, dueños usan gratis
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE PLANES DE SUSCRIPCIÓN
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'Plan Gratuito', 'Plan Profesional'
  slug TEXT UNIQUE NOT NULL, -- 'free', 'pro'
  description TEXT,
  price_mxn DECIMAL(10,2) NOT NULL CHECK (price_mxn >= 0), -- 0, 600
  stripe_price_id TEXT, -- ID del precio en Stripe (null para Free)
  stripe_product_id TEXT, -- ID del producto en Stripe (null para Free)

  -- Límites y características
  max_appointments_per_month INTEGER, -- 5 para Free, null para ilimitado
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de características

  -- Configuración
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Para destacar en UI
  sort_order INTEGER DEFAULT 0, -- Orden de visualización

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- ============================================================================
-- 2. TABLA DE SUSCRIPCIONES DE VETERINARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vet_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  vet_id UUID NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Estado de la suscripción
  status TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT valid_status CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete')),

  -- Información de Stripe
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Períodos
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Cancelación
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un veterinario solo puede tener una suscripción activa a la vez
  UNIQUE(vet_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vet_subscriptions_vet_id ON vet_subscriptions(vet_id);
CREATE INDEX IF NOT EXISTS idx_vet_subscriptions_plan_id ON vet_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_vet_subscriptions_status ON vet_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vet_subscriptions_stripe_sub ON vet_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_vet_subscriptions_stripe_customer ON vet_subscriptions(stripe_customer_id);

-- ============================================================================
-- 3. TABLA DE FACTURAS DE SUSCRIPCIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  subscription_id UUID REFERENCES vet_subscriptions(id) ON DELETE SET NULL,
  vet_id UUID NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,

  -- Información de Stripe
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,

  -- Detalles de la factura
  amount_mxn DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),

  -- URLs
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Períodos
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_vet ON subscription_invoices(vet_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_stripe ON subscription_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);

-- ============================================================================
-- 4. TABLA DE ESTADÍSTICAS MENSUALES DE VETERINARIOS
-- ============================================================================
-- Para trackear el límite de 5 citas/mes del plan Free

CREATE TABLE IF NOT EXISTS vet_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  vet_id UUID NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,

  -- Período
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

  -- Estadísticas
  appointments_count INTEGER DEFAULT 0 CHECK (appointments_count >= 0),
  appointments_completed INTEGER DEFAULT 0,
  appointments_cancelled INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un vet solo puede tener un registro por mes
  UNIQUE(vet_id, year, month)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vet_monthly_stats_vet ON vet_monthly_stats(vet_id);
CREATE INDEX IF NOT EXISTS idx_vet_monthly_stats_period ON vet_monthly_stats(year, month);
CREATE INDEX IF NOT EXISTS idx_vet_monthly_stats_vet_period ON vet_monthly_stats(vet_id, year, month);

-- ============================================================================
-- 5. MODIFICAR TABLA VETERINARIOS
-- ============================================================================
-- Agregar campos relacionados con suscripciones

DO $$ BEGIN
  -- Agregar columna current_plan_id si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veterinarios' AND column_name = 'current_plan_id'
  ) THEN
    ALTER TABLE veterinarios ADD COLUMN current_plan_id UUID REFERENCES subscription_plans(id);
  END IF;

  -- Agregar columna subscription_status si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veterinarios' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE veterinarios ADD COLUMN subscription_status TEXT DEFAULT 'free'
      CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled', 'unpaid'));
  END IF;

  -- Agregar columna can_receive_appointments si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veterinarios' AND column_name = 'can_receive_appointments'
  ) THEN
    ALTER TABLE veterinarios ADD COLUMN can_receive_appointments BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Índices en veterinarios
CREATE INDEX IF NOT EXISTS idx_veterinarios_current_plan ON veterinarios(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_veterinarios_subscription_status ON veterinarios(subscription_status);

-- ============================================================================
-- 6. FUNCIONES SQL HELPER
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 Verificar límite de citas para plan Free
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_vet_appointment_limit(vet_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_plan_id UUID;
  max_appointments INTEGER;
  current_count INTEGER;
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
BEGIN
  -- Obtener plan actual del veterinario
  SELECT current_plan_id INTO current_plan_id
  FROM veterinarios WHERE id = vet_id_param;

  -- Si no tiene plan, asignar Free por defecto
  IF current_plan_id IS NULL THEN
    RETURN false; -- No puede recibir citas sin plan configurado
  END IF;

  -- Obtener límite del plan
  SELECT max_appointments_per_month INTO max_appointments
  FROM subscription_plans WHERE id = current_plan_id;

  -- Si es null = ilimitado (plan Pro)
  IF max_appointments IS NULL THEN
    RETURN true;
  END IF;

  -- Contar citas del mes actual
  SELECT COALESCE(appointments_count, 0) INTO current_count
  FROM vet_monthly_stats
  WHERE vet_id = vet_id_param
    AND year = current_year
    AND month = current_month;

  -- Verificar si está bajo el límite
  RETURN current_count < max_appointments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6.2 Incrementar contador de citas mensuales
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_vet_monthly_appointments(vet_id_param UUID)
RETURNS void AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
BEGIN
  -- Insertar o actualizar contador
  INSERT INTO vet_monthly_stats (vet_id, year, month, appointments_count)
  VALUES (vet_id_param, current_year, current_month, 1)
  ON CONFLICT (vet_id, year, month)
  DO UPDATE SET
    appointments_count = vet_monthly_stats.appointments_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6.3 Obtener información completa de suscripción de un veterinario
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_vet_subscription_info(vet_id_param UUID)
RETURNS TABLE (
  plan_name TEXT,
  plan_slug TEXT,
  plan_price DECIMAL(10,2),
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  appointments_this_month INTEGER,
  appointments_limit INTEGER,
  can_receive_more BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.name,
    sp.slug,
    sp.price_mxn,
    v.subscription_status,
    vs.current_period_end,
    COALESCE(vms.appointments_count, 0)::INTEGER,
    sp.max_appointments_per_month,
    check_vet_appointment_limit(vet_id_param)
  FROM veterinarios v
  LEFT JOIN subscription_plans sp ON v.current_plan_id = sp.id
  LEFT JOIN vet_subscriptions vs ON v.id = vs.vet_id
  LEFT JOIN vet_monthly_stats vms ON (
    v.id = vms.vet_id
    AND vms.year = EXTRACT(YEAR FROM NOW())
    AND vms.month = EXTRACT(MONTH FROM NOW())
  )
  WHERE v.id = vet_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_monthly_stats ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7.1 Políticas para subscription_plans
-- ----------------------------------------------------------------------------

-- Todos pueden ver planes activos (para mostrar en UI de selección)
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Solo admin puede modificar planes (a través de service_role)
DROP POLICY IF EXISTS "Only service role can modify plans" ON subscription_plans;
CREATE POLICY "Only service role can modify plans"
  ON subscription_plans FOR ALL
  USING (false);

-- ----------------------------------------------------------------------------
-- 7.2 Políticas para vet_subscriptions
-- ----------------------------------------------------------------------------

-- Veterinarios pueden ver su propia suscripción
DROP POLICY IF EXISTS "Vets can view own subscription" ON vet_subscriptions;
CREATE POLICY "Vets can view own subscription"
  ON vet_subscriptions FOR SELECT
  USING (
    vet_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

-- Solo Edge Functions pueden modificar suscripciones (webhooks de Stripe)
DROP POLICY IF EXISTS "Only service role can modify subscriptions" ON vet_subscriptions;
CREATE POLICY "Only service role can modify subscriptions"
  ON vet_subscriptions FOR ALL
  USING (false);

-- ----------------------------------------------------------------------------
-- 7.3 Políticas para subscription_invoices
-- ----------------------------------------------------------------------------

-- Veterinarios pueden ver sus propias facturas
DROP POLICY IF EXISTS "Vets can view own invoices" ON subscription_invoices;
CREATE POLICY "Vets can view own invoices"
  ON subscription_invoices FOR SELECT
  USING (
    vet_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

-- Solo Edge Functions pueden modificar facturas
DROP POLICY IF EXISTS "Only service role can modify invoices" ON subscription_invoices;
CREATE POLICY "Only service role can modify invoices"
  ON subscription_invoices FOR ALL
  USING (false);

-- ----------------------------------------------------------------------------
-- 7.4 Políticas para vet_monthly_stats
-- ----------------------------------------------------------------------------

-- Veterinarios pueden ver sus propias estadísticas
DROP POLICY IF EXISTS "Vets can view own stats" ON vet_monthly_stats;
CREATE POLICY "Vets can view own stats"
  ON vet_monthly_stats FOR SELECT
  USING (
    vet_id IN (
      SELECT id FROM veterinarios WHERE profile_id = auth.uid()
    )
  );

-- Solo funciones SQL pueden modificar stats
DROP POLICY IF EXISTS "Only functions can modify stats" ON vet_monthly_stats;
CREATE POLICY "Only functions can modify stats"
  ON vet_monthly_stats FOR ALL
  USING (false);

-- ============================================================================
-- 8. INSERTAR PLANES INICIALES
-- ============================================================================

INSERT INTO subscription_plans (name, slug, description, price_mxn, max_appointments_per_month, features, is_active, sort_order)
VALUES
(
  'Plan Gratuito',
  'free',
  'Ideal para veterinarios que están comenzando',
  0,
  5,
  '["Perfil público visible", "Hasta 5 citas por mes", "Chat básico con clientes", "Dashboard básico", "Notificaciones de nuevas citas"]'::jsonb,
  true,
  1
),
(
  'Plan Profesional',
  'pro',
  'Para veterinarios que quieren hacer crecer su práctica',
  600,
  NULL, -- ilimitado
  '["Todo lo del Plan Gratuito", "Citas ilimitadas por mes", "Perfil destacado en búsquedas", "Chat ilimitado", "Dashboard completo con estadísticas", "Reportes mensuales", "Soporte prioritario", "Badge PRO en perfil"]'::jsonb,
  true,
  2
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 9. TRIGGER PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vet_subscriptions_updated_at ON vet_subscriptions;
CREATE TRIGGER update_vet_subscriptions_updated_at
  BEFORE UPDATE ON vet_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_invoices_updated_at ON subscription_invoices;
CREATE TRIGGER update_subscription_invoices_updated_at
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vet_monthly_stats_updated_at ON vet_monthly_stats;
CREATE TRIGGER update_vet_monthly_stats_updated_at
  BEFORE UPDATE ON vet_monthly_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE subscription_plans IS 'Planes de suscripción disponibles (Free, Pro)';
COMMENT ON TABLE vet_subscriptions IS 'Suscripciones activas de veterinarios';
COMMENT ON TABLE subscription_invoices IS 'Historial de facturas de suscripciones';
COMMENT ON TABLE vet_monthly_stats IS 'Estadísticas mensuales para control de límites';

COMMENT ON FUNCTION check_vet_appointment_limit(UUID) IS 'Verifica si un vet puede recibir más citas este mes según su plan';
COMMENT ON FUNCTION increment_vet_monthly_appointments(UUID) IS 'Incrementa contador de citas mensuales del vet';
COMMENT ON FUNCTION get_vet_subscription_info(UUID) IS 'Obtiene información completa de suscripción de un vet';

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
