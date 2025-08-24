-- Tabla de transacciones
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cita_id UUID REFERENCES citas(id),
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2),
  commission DECIMAL(10,2),
  vet_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de balances de veterinarios
CREATE TABLE vet_balances (
  vet_id UUID REFERENCES profiles(id) PRIMARY KEY,
  available_balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar balance de veterinario
CREATE OR REPLACE FUNCTION update_vet_balance(vet_id_param UUID, amount_param DECIMAL)
RETURNS void AS $$
BEGIN
  INSERT INTO vet_balances (vet_id, available_balance, total_earned)
  VALUES (vet_id_param, amount_param, amount_param)
  ON CONFLICT (vet_id) 
  DO UPDATE SET 
    available_balance = vet_balances.available_balance + amount_param,
    total_earned = vet_balances.total_earned + amount_param,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para mejorar performance
CREATE INDEX idx_transactions_cita_id ON transactions(cita_id);
CREATE INDEX idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_vet_balances_vet_id ON vet_balances(vet_id);

-- Habilitar Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_balances ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para transactions
CREATE POLICY "Los usuarios pueden ver transacciones de sus citas"
  ON transactions FOR SELECT
  USING (
    cita_id IN (
      SELECT id FROM citas 
      WHERE dueno_id = auth.uid() 
      OR veterinario_id IN (
        SELECT id FROM veterinarios WHERE profile_id = auth.uid()
      )
    )
  );

-- Políticas para vet_balances
CREATE POLICY "Los veterinarios pueden ver su propio balance"
  ON vet_balances FOR SELECT
  USING (vet_id = auth.uid());

-- Solo las Edge Functions pueden modificar estas tablas
CREATE POLICY "Solo Edge Functions pueden modificar transactions"
  ON transactions FOR ALL
  USING (false);