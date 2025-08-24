# Stripe + Supabase Setup Guide

Esta guía te ayudará a configurar Stripe con Supabase para procesar pagos en Wuauser.

## 1. Configurar Base de Datos en Supabase

1. Ve a tu proyecto de Supabase
2. Ve a SQL Editor
3. Ejecuta PRIMERO el archivo `supabase/migrations/update_citas_for_payments.sql`
4. Ejecuta DESPUÉS el archivo `supabase/migrations/payment_tables.sql`

```sql
-- PASO 1: Actualizar tabla citas para pagos
-- (Ver archivo completo en supabase/migrations/update_citas_for_payments.sql)

-- PASO 2: Crear tablas de transacciones y balances
-- (Ver archivo completo en supabase/migrations/payment_tables.sql)
```

## 2. Configurar Stripe

### Crear cuenta de Stripe
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crea una cuenta o inicia sesión
3. Ve a Developers > API Keys
4. Copia tu **Publishable Key** y **Secret Key**

### Configurar webhooks
1. Ve a Developers > Webhooks en Stripe
2. Crear endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Selecciona estos eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copia el **Webhook Secret**

## 3. Configurar Variables de Entorno

### En tu archivo .env (React Native)
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_publishable_key
```

### En Supabase Edge Functions
Ve a tu proyecto de Supabase > Edge Functions > Environment Variables:

```env
STRIPE_SECRET_KEY=sk_test_tu_secret_key
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 4. Desplegar Edge Functions

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Hacer login
supabase login

# Desplegar las funciones
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

## 5. Usar en tu App

### Envolver tu app con StripeProvider
```tsx
import { StripeProvider } from './src/components/StripeProvider';

export default function App() {
  return (
    <StripeProvider>
      {/* Tu app */}
    </StripeProvider>
  );
}
```

### Usar el PaymentScreen
```tsx
import { PaymentScreen } from './src/components/PaymentScreen';

// En tu componente
<PaymentScreen
  citaId="cita-id"
  vetId="vet-id"
  amount={500}
  vetName="Dr. García"
  onPaymentSuccess={() => {
    // Navegar a confirmación
  }}
  onPaymentCancel={() => {
    // Regresar
  }}
/>
```

## 6. Testing

### Tarjetas de prueba de Stripe
- **Exitosa**: `4242 4242 4242 4242`
- **Fallida**: `4000 0000 0000 0002`
- **Requiere autenticación**: `4000 0025 0000 3155`

### Verificar funcionamiento
1. Crear una cita
2. Procesar pago con tarjeta de prueba
3. Verificar que la transacción se guarde en `transactions`
4. Verificar que el balance del vet se actualice en `vet_balances`
5. Verificar que la cita cambie a `confirmed`

## 7. Producción

### Para ir a producción:
1. Cambiar a las claves reales de Stripe (no test)
2. Configurar el dominio real para webhooks
3. Actualizar variables de entorno en Supabase
4. Probar con tarjetas reales (pequeñas cantidades)

## Troubleshooting

### Error común: "Missing stripe-signature header"
- Verificar que el webhook URL sea correcto
- Verificar que STRIPE_WEBHOOK_SECRET esté configurado

### Error común: "Payment intent creation failed"
- Verificar STRIPE_SECRET_KEY
- Verificar que las variables de entorno estén en Supabase Edge Functions

### Error común: "Transaction not found"
- Verificar que las tablas estén creadas
- Verificar que el service role key tenga permisos