# 📝 INSTRUCCIONES: Ejecutar SQL de Suscripciones en Supabase

**Fecha:** 29 de Octubre, 2025
**Objetivo:** Crear el sistema completo de suscripciones en la base de datos

---

## 🚨 IMPORTANTE: Leer Antes de Ejecutar

Este SQL creará las siguientes tablas y funciones:
- ✅ `subscription_plans` - Planes Free y Pro
- ✅ `vet_subscriptions` - Suscripciones de veterinarios
- ✅ `subscription_invoices` - Facturas
- ✅ `vet_monthly_stats` - Estadísticas mensuales
- ✅ Modificará tabla `veterinarios` (agrega 3 columnas)
- ✅ 3 funciones SQL helper
- ✅ Políticas de seguridad (RLS)
- ✅ Inserta 2 planes iniciales (Free y Pro)

---

## 📋 PASOS PARA EJECUTAR

### 1. Acceder al SQL Editor de Supabase

Abre tu navegador y ve a:
```
https://supabase.com/dashboard/project/tmwtelgxnhkjzrdmlwph/sql/new
```

### 2. Copiar el SQL

1. Abre el archivo: `wuauser-app/supabase/migrations/subscription_system.sql`
2. Selecciona TODO el contenido (Cmd+A o Ctrl+A)
3. Copia (Cmd+C o Ctrl+C)

### 3. Pegar y Ejecutar

1. Pega el SQL en el editor de Supabase (Cmd+V o Ctrl+V)
2. Haz clic en el botón **"Run"** (esquina inferior derecha)
3. Espera a que termine (puede tardar 10-15 segundos)

### 4. Verificar que Funcionó

Deberías ver un mensaje de éxito como:
```
Success. No rows returned
```

Si ves **errores en rojo**, NO continues. Envía un screenshot del error a Claude.

---

## ✅ VERIFICACIÓN POST-EJECUCIÓN

Después de ejecutar el SQL, verifica que las tablas existan:

### Opción A: Desde Table Editor

1. Ve a: https://supabase.com/dashboard/project/tmwtelgxnhkjzrdmlwph/editor
2. Busca estas tablas en la lista de la izquierda:
   - `subscription_plans`
   - `vet_subscriptions`
   - `subscription_invoices`
   - `vet_monthly_stats`

### Opción B: Desde SQL Editor

Copia y ejecuta este query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'subscription_plans',
    'vet_subscriptions',
    'subscription_invoices',
    'vet_monthly_stats'
  )
ORDER BY table_name;
```

Deberías ver 4 filas (las 4 tablas).

---

## 🔍 VERIFICAR PLANES INSERTADOS

Ejecuta este query para ver los planes creados:

```sql
SELECT
  name,
  slug,
  price_mxn,
  max_appointments_per_month,
  is_active
FROM subscription_plans
ORDER BY sort_order;
```

**Resultado esperado:**
```
Plan Gratuito     | free | 0    | 5    | true
Plan Profesional  | pro  | 600  | null | true
```

---

## 🧪 PROBAR FUNCIONES SQL

Ejecuta estos queries para probar que las funciones funcionan:

### Test 1: Verificar límite de citas
```sql
-- Reemplaza 'TU_VET_ID_AQUI' con un ID real de la tabla veterinarios
SELECT check_vet_appointment_limit('TU_VET_ID_AQUI');
```

### Test 2: Obtener info de suscripción
```sql
-- Reemplaza 'TU_VET_ID_AQUI' con un ID real de la tabla veterinarios
SELECT * FROM get_vet_subscription_info('TU_VET_ID_AQUI');
```

---

## ❌ ERRORES COMUNES

### Error: "relation already exists"

**Causa:** Algunas tablas ya existen
**Solución:** No te preocupes, el SQL usa `IF NOT EXISTS`, así que es seguro.

### Error: "column already exists"

**Causa:** Las columnas en `veterinarios` ya existen
**Solución:** El SQL usa `DO $$ ... IF NOT EXISTS`, es normal.

### Error: "permission denied"

**Causa:** No tienes permisos de admin
**Solución:** Asegúrate de estar logueado en Supabase con la cuenta correcta.

---

## 📊 DESPUÉS DE EJECUTAR

Una vez que el SQL esté ejecutado correctamente:

1. ✅ Las tablas estarán creadas
2. ✅ Los planes Free y Pro estarán insertados
3. ✅ Las funciones SQL estarán disponibles
4. ✅ Las políticas de seguridad (RLS) estarán activas

**Siguiente paso:** Volver a Claude Code para continuar con la implementación del servicio de suscripciones en TypeScript.

---

## 🆘 NECESITAS AYUDA

Si encuentras algún error:

1. Toma un screenshot del error completo
2. Comparte el screenshot con Claude
3. NO intentes ejecutar el SQL de nuevo hasta resolver el error

---

**Generado el:** 29 de Octubre, 2025
**Versión:** v2.0 - Sistema de Suscripciones
