# GUÍA COMPLETA DE CONFIGURACIÓN DE SUPABASE PRODUCTION

**Proyecto:** WUAUSER
**Fecha:** 12 Octubre 2025
**Tiempo Estimado:** 30-45 minutos
**Prioridad:** 🔴 CRÍTICA

---

## 📋 CHECKLIST RÁPIDO

- [ ] Crear proyecto en Supabase
- [ ] Copiar credenciales a archivo .env
- [ ] Ejecutar script SQL completo en Supabase
- [ ] Verificar tablas creadas
- [ ] Verificar RLS policies
- [ ] Probar conexión desde app
- [ ] Probar registro de usuario
- [ ] Verificar perfil creado automáticamente

---

## PARTE 1: CREAR PROYECTO EN SUPABASE

### Paso 1.1: Crear cuenta/proyecto

1. Ir a https://supabase.com
2. Click en "Start your project"
3. Crear nuevo proyecto con estos datos:
   - **Name:** wuauser-production
   - **Database Password:** (genera uno fuerte y guárdalo)
   - **Region:** South America (São Paulo) - más cercano a México
   - **Pricing Plan:** Free (para desarrollo)

4. **IMPORTANTE:** Espera 2-3 minutos mientras se crea el proyecto

### Paso 1.2: Obtener credenciales

Una vez creado el proyecto:

1. Ve a **Settings** (⚙️ en el menú izquierdo)
2. Ve a **API** en el submenú
3. **Copia estos 3 valores:**

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

⚠️ **NUNCA compartas el service_role key públicamente**

---

## PARTE 2: CONFIGURAR VARIABLES DE ENTORNO

### Paso 2.1: Crear archivo .env

En la raíz del proyecto `wuauser-app/`:

```bash
cd wuauser-app
cp .env.example .env
```

### Paso 2.2: Editar .env con tus credenciales

Abre `wuauser-app/.env` y reemplaza con tus valores reales:

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

### Paso 2.3: Verificar .gitignore

Ejecuta en terminal:

```bash
cat ../.gitignore | grep .env
```

Debes ver:
```
.env
.env.*
!.env.example
```

✅ Si lo ves, tu .env está protegido y no se subirá a Git

---

## PARTE 3: EJECUTAR MIGRACIONES SQL

### Paso 3.1: Ir al SQL Editor

1. En Supabase Dashboard, ve a **SQL Editor** (icono 📝)
2. Click en **New query**

### Paso 3.2: Copiar y ejecutar script completo

**OPCIÓN A - Script Todo-en-Uno (RECOMENDADO):**

1. Abre el archivo: `wuauser-app/supabase/migrations/complete_setup.sql`
2. **Copia TODO el contenido** (son ~600 líneas)
3. Pégalo en el SQL Editor de Supabase
4. Click en **Run** (o presiona Cmd/Ctrl + Enter)
5. **Espera 10-15 segundos** hasta que termine

✅ **Si todo salió bien**, verás en la parte inferior:
```
Success. No rows returned
```

❌ **Si hay error**, lee el mensaje completo y repórtalo ANTES de continuar

**OPCIÓN B - Por Pasos (si prefieres control manual):**

Si prefieres ejecutar por partes, sigue este orden:

1. **Base de datos:**
   ```sql
   -- Copiar líneas 1-30 del complete_setup.sql
   -- (Extensiones y función update_updated_at_column)
   ```

2. **Tabla profiles:**
   ```sql
   -- Copiar líneas 31-60
   ```

3. **Tablas principales:**
   ```sql
   -- Ejecutar secciones de: veterinarios, mascotas, pet_medical_records, citas
   ```

4. **Tablas de chat:**
   ```sql
   -- Ejecutar secciones: chats, messages
   ```

5. **Tablas de pagos:**
   ```sql
   -- Ejecutar secciones: payments, payment_methods
   ```

6. **RLS Policies:**
   ```sql
   -- Ejecutar todas las políticas (líneas 200-500)
   ```

7. **Trigger de registro:**
   ```sql
   -- Ejecutar handle_new_user y trigger (últimas líneas)
   ```

---

## PARTE 4: VERIFICAR INSTALACIÓN

### Paso 4.1: Verificar tablas creadas

En el SQL Editor, ejecuta:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Debes ver estas 9 tablas:**
```
✅ chats
✅ citas
✅ mascotas
✅ messages
✅ payment_methods
✅ payments
✅ pet_medical_records
✅ profiles
✅ veterinarios
```

### Paso 4.2: Verificar RLS habilitado

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Todas deben tener `rowsecurity = true`**

### Paso 4.3: Verificar políticas de seguridad

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Debes ver políticas en todas las tablas:**
```
chats: 2 policies
citas: 3 policies
mascotas: 5 policies
messages: 3 policies
payment_methods: 2 policies
payments: 2 policies
pet_medical_records: 2 policies
profiles: 3 policies
veterinarios: 3 policies
```

### Paso 4.4: Verificar trigger de registro

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
ORDER BY event_object_table;
```

Debe aparecer:
```
on_auth_user_created | INSERT | users
```

---

## PARTE 5: PROBAR CONEXIÓN DESDE APP

### Paso 5.1: Limpiar caché de Expo

```bash
cd wuauser-app
npx expo start -c
```

### Paso 5.2: Verificar configuración en consola

Busca en la consola estos mensajes:

✅ **Si está bien configurado:**
```
🔌 Supabase connected
✅ Connection to Supabase successful
```

❌ **Si hay problemas:**
```
⚠️ Modo de desarrollo: Supabase no configurado
```

### Paso 5.3: Probar registro de usuario

1. En la app, ve a **Registro** → **Dueño**
2. Completa el formulario:
   - Email: test@wuauser.com
   - Contraseña: Test123456
   - Nombre: Usuario de Prueba
   - Teléfono: 5555555555

3. Click en **Registrarse**

✅ **Si funciona:**
- Deberías ver mensaje "Registro exitoso"
- La app debería navegar a HomeScreen

❌ **Si hay error:**
- Copia el error completo de la consola
- Verifica en Supabase → Authentication que NO aparece el usuario
- Reporta el error exacto

### Paso 5.4: Verificar en Supabase Dashboard

1. Ve a **Authentication** en Supabase
2. Debes ver el usuario `test@wuauser.com`
3. Ve a **Table Editor** → **profiles**
4. Debes ver un registro con:
   - id: (mismo UUID del usuario)
   - email: test@wuauser.com
   - tipo_usuario: dueno
   - nombre_completo: Usuario de Prueba

✅ **Si ves el perfil creado automáticamente, el trigger funciona!**

---

## PARTE 6: PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Error: "relation 'profiles' does not exist"

**Causa:** La tabla profiles no se creó

**Solución:**
```sql
-- Ejecutar de nuevo la sección de profiles del complete_setup.sql
CREATE TABLE IF NOT EXISTS profiles (...);
```

### ❌ Error: "permission denied for table profiles"

**Causa:** Las políticas RLS no se aplicaron correctamente

**Solución:**
```sql
-- Re-ejecutar políticas de profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
-- ... (repetir para UPDATE e INSERT)
```

### ❌ Error: "new row violates row-level security policy"

**Causa:** El trigger handle_new_user no está funcionando

**Solución:**
```sql
-- Verificar trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Si no existe, ejecutar de nuevo:
CREATE OR REPLACE FUNCTION handle_new_user() ...
CREATE TRIGGER on_auth_user_created ...
```

### ❌ App sigue en modo desarrollo

**Causa:** Variables de entorno no cargadas

**Solución:**
```bash
# Detener Expo completamente
# Borrar caché
rm -rf .expo node_modules/.cache

# Reiniciar
npx expo start -c
```

### ❌ Error: "Invalid JWT"

**Causa:** Copiaste mal la anon key o tiene espacios

**Solución:**
1. Vuelve a copiar la key desde Supabase Settings → API
2. Asegúrate de copiar SIN espacios al inicio/final
3. La key debe empezar con `eyJhbGc...`

---

## PARTE 7: TESTING AVANZADO

### Test 1: Crear mascota

```typescript
// En AddPetScreen, agregar:
Nombre: Max
Especie: Perro
Raza: Labrador
Fecha nacimiento: 01/01/2020
```

**Verificar en Supabase:**
- Table Editor → mascotas
- Debe aparecer Max
- Campo `qr_code` debe tener un UUID automático

### Test 2: Buscar veterinarios

```typescript
// En VetSearchScreen
// Debe cargar sin errores (aunque no haya veterinarios aún)
```

### Test 3: Chat

```typescript
// En ChatListScreen
// Debe cargar sin errores
// Puede mostrar mock data o lista vacía
```

---

## PARTE 8: PRÓXIMOS PASOS

Una vez que Supabase esté funcionando:

✅ **SPRINT 1 COMPLETADO:**
- [x] Supabase production configurado
- [x] Todas las migraciones ejecutadas
- [x] Tabla pet_medical_records creada
- [x] Tablas de chat creadas
- [x] Conexión desde app verificada

🎯 **SIGUIENTE TAREA:**
- [ ] Completar navegación de Chat desde Citas (MyAppointmentsScreen.tsx:124)

---

## 🆘 OBTENER AYUDA

Si encuentras algún error que no puedes resolver:

1. **Copia el error completo** de la consola
2. **Captura de pantalla** del SQL Editor si el error es ahí
3. **Verifica** que copiaste bien las credenciales en .env
4. **Comparte** el error exacto para poder ayudarte

**Errores críticos que requieren atención inmediata:**
- ❌ "Failed to connect to Supabase"
- ❌ "Authentication error"
- ❌ "Database error"
- ❌ Cualquier error al ejecutar complete_setup.sql

---

## 📊 CHECKLIST FINAL

Antes de continuar con el siguiente sprint, verifica:

- [ ] ✅ Proyecto de Supabase creado
- [ ] ✅ Archivo .env con credenciales correctas
- [ ] ✅ Script complete_setup.sql ejecutado sin errores
- [ ] ✅ 9 tablas creadas y verificadas
- [ ] ✅ RLS habilitado en todas las tablas
- [ ] ✅ Políticas de seguridad aplicadas
- [ ] ✅ Trigger handle_new_user funcionando
- [ ] ✅ App conecta a Supabase (no modo desarrollo)
- [ ] ✅ Registro de usuario funciona
- [ ] ✅ Perfil se crea automáticamente en tabla profiles
- [ ] ✅ Crear mascota funciona
- [ ] ✅ No hay errores en consola de Expo

**Si todos los checkboxes están marcados: ¡SUPABASE PRODUCTION CONFIGURADO! 🎉**

**Tiempo total invertido:** ______ minutos

---

**Última actualización:** 12 Octubre 2025
**Próxima revisión:** Al completar Sprint 1
