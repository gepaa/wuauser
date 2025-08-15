# 🚀 CONFIGURACIÓN COMPLETA DE SUPABASE PARA WUAUSER

## ✅ LO QUE YA ESTÁ LISTO

1. **📁 Archivo SQL**: `src/database/schema.sql` con todas las tablas
2. **🔧 Servicios TypeScript**: Servicios completos para todas las operaciones
3. **📱 App configurada**: Para probar la conexión automáticamente

## 🎯 PASOS QUE DEBES HACER (USUARIO)

### PASO 1: Crear cuenta en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Registrate con GitHub o email

### PASO 2: Crear nuevo proyecto
1. Clic en "New project"
2. Nombre: `wuauser-app`
3. Database Password: **GUARDA ESTA CONTRASEÑA**
4. Region: `South America (São Paulo)`
5. Clic en "Create new project"
6. **⏳ ESPERA 2-3 MINUTOS** a que se configure

### PASO 3: Ejecutar el script SQL
1. En tu proyecto Supabase, ve a "SQL Editor" (menú izquierdo)
2. Clic en "New query"
3. **COPIA Y PEGA TODO** el contenido de `src/database/schema.sql`
4. Clic en "Run" (botón verde)
5. ✅ Deberías ver "Success. No rows returned"

### PASO 4: Obtener las credenciales
1. Ve a "Settings" → "API" (menú izquierdo)
2. Copia estos dos valores:
   - **Project URL**
   - **anon public key**

### PASO 5: Configurar variables de entorno
1. En la carpeta `wuauser-app/`, crea un archivo `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=tu_project_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**🔥 IMPORTANTE**: Reemplaza `tu_project_url_aqui` y `tu_anon_key_aqui` con los valores reales.

### PASO 6: Probar la conexión
1. Abre una terminal en `wuauser-app/`
2. Ejecuta:
```bash
npm start
```
3. **📱 Mira los logs de la consola**
4. Deberías ver:
   - `✅ Conexión a Supabase exitosa`
   - `✅ Tabla 'profiles' existe y es accesible`
   - `✅ Tabla 'veterinarios' existe y es accesible`
   - `✅ Tabla 'mascotas' existe y es accesible`
   - `✅ Tabla 'citas' existe y es accesible`

## 🎯 SI VES ERRORES

### Error: "Invalid API key"
- ✅ Verifica que copiaste bien el `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Verifica que el archivo `.env` esté en `wuauser-app/.env`

### Error: "Invalid URL"
- ✅ Verifica que copiaste bien el `EXPO_PUBLIC_SUPABASE_URL`
- ✅ Debe terminar en `.supabase.co`

### Error: "Table doesn't exist"
- ✅ Verifica que ejecutaste todo el script SQL
- ✅ Ve a "Table Editor" en Supabase y verifica que existan las 4 tablas

## 🚀 DESPUÉS DE CONFIGURAR

Una vez que veas todos los ✅ en la consola, ya puedes:

1. **Registrar usuarios** (la app creará perfiles automáticamente)
2. **Crear mascotas** para los dueños
3. **Buscar veterinarios** (ya hay 2 de prueba)
4. **Crear citas** entre dueños y veterinarios

## 📋 SERVICIOS DISPONIBLES

```typescript
// Perfiles de usuario
import { profileService } from './src/services';
await profileService.getProfile(userId);

// Veterinarios
import { veterinarioService } from './src/services';
await veterinarioService.getVeterinarios();

// Mascotas
import { mascotaService } from './src/services';
await mascotaService.getMascotas(duenoId);

// Citas
import { citaService } from './src/services';
await citaService.getCitasUsuario(userId);
```

## 🔒 SEGURIDAD

- ✅ **Row Level Security (RLS)** habilitado en todas las tablas
- ✅ **Políticas de seguridad** configuradas
- ✅ Los usuarios solo ven sus propios datos
- ✅ Los veterinarios deben estar verificados para ser visibles

¡Listo! 🎉 Tu app ya está completamente conectada con Supabase.