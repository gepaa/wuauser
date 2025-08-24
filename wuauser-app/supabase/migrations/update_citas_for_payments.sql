-- Agregar columnas para manejar pagos en la tabla citas
ALTER TABLE citas 
ADD COLUMN payment_required BOOLEAN DEFAULT false,
ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

-- Actualizar el campo estado para incluir 'confirmada'
ALTER TABLE citas 
DROP CONSTRAINT IF EXISTS citas_estado_check;

ALTER TABLE citas 
ADD CONSTRAINT citas_estado_check 
CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada'));

-- Índice para consultas de pago
CREATE INDEX idx_citas_payment_status ON citas(payment_status);

-- Políticas de seguridad para las nuevas columnas
-- Las políticas existentes ya cubren SELECT y UPDATE, solo necesitamos asegurar 
-- que los campos de pago no sean modificados directamente por usuarios