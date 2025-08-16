# 🗄️ Configuración de Base de Datos - Wuauser

Este documento explica cómo configurar las tablas de Supabase para el proyecto Wuauser.

## 📋 Resumen

Wuauser requiere una tabla `usuarios` que maneje tanto dueños de mascotas como veterinarios en una sola estructura optimizada con Row Level Security (RLS).

## 🚀 Instalación Rápida

### 1. Acceder al Panel de Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto: `tmwtelgxnhkjzrdmlwph`
3. Ve a **SQL Editor** en el menú lateral

### 2. Ejecutar Migración
1. Copia el contenido completo del archivo `database/001_create_usuarios_table.sql`
2. Pégalo en el SQL Editor
3. Haz clic en **Run** para ejecutar la migración

### 3. Verificar Instalación
```sql
-- Verificar que la tabla se creó correctamente
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'usuarios';

-- Ver policies creadas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'usuarios';
```

## 📊 Estructura de la Tabla

### Campos Principales
- `id` (UUID): Referencia a `auth.users(id)`
- `email` (VARCHAR): Email único del usuario
- `tipo_usuario` (ENUM): 'dueno' o 'veterinario'
- `nombre_completo` (VARCHAR): Nombre completo
- `telefono` (VARCHAR): Teléfono de contacto

### Campos para Dueños
- `direccion` (TEXT): Dirección residencial
- `codigo_postal` (VARCHAR): Código postal
- `ciudad` (VARCHAR): Ciudad de residencia

### Campos para Veterinarios
- `cedula_profesional` (VARCHAR): Cédula profesional
- `especialidad` (VARCHAR): Especialidad veterinaria
- `nombre_clinica` (VARCHAR): Nombre de la clínica
- `direccion_clinica` (TEXT): Dirección de la clínica
- `telefono_clinica` (VARCHAR): Teléfono de la clínica
- `servicios` (JSONB): Servicios ofrecidos
- `horario_atencion` (JSONB): Horarios de atención
- `verificado` (BOOLEAN): Estado de verificación

### Campos de Auditoría
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Última actualización

## 🔒 Seguridad (RLS)

### Policies Configuradas

1. **usuarios_select_own**: Los usuarios ven solo su perfil
2. **usuarios_insert_own**: Los usuarios crean solo su perfil
3. **usuarios_update_own**: Los usuarios actualizan solo su perfil
4. **duenos_view_veterinarios**: Los dueños ven veterinarios verificados

### Validaciones Automáticas

- **Dueños**: Requieren `direccion` y `ciudad`
- **Veterinarios**: Requieren `cedula_profesional`, `especialidad` y `nombre_clinica`
- **Limpieza**: Campos no aplicables se limpian automáticamente

## 🔧 Funciones Auxiliares

### Trigger `updated_at`
Actualiza automáticamente el campo `updated_at` en cada modificación.

### Validación de Datos
Valida que los campos requeridos estén presentes según el tipo de usuario.

## 🧪 Testing

### Probar Inserción de Dueño
```sql
-- Simular registro de dueño (ejecutar después de signUp)
INSERT INTO public.usuarios (
    id, email, tipo_usuario, nombre_completo, telefono,
    direccion, codigo_postal, ciudad
) VALUES (
    gen_random_uuid(), -- En real será auth.uid()
    'test@example.com',
    'dueno',
    'Juan Pérez',
    '5555551234',
    'Av. Principal 123',
    '12345',
    'Ciudad de México'
);
```

### Probar Inserción de Veterinario
```sql
-- Simular registro de veterinario
INSERT INTO public.usuarios (
    id, email, tipo_usuario, nombre_completo, telefono,
    cedula_profesional, especialidad, nombre_clinica,
    direccion_clinica, telefono_clinica
) VALUES (
    gen_random_uuid(),
    'vet@example.com',
    'veterinario',
    'Dra. María García',
    '5555555678',
    'CED12345',
    'Medicina General',
    'Clínica Veterinaria San Francisco',
    'Calle Secundaria 456',
    '5555559012'
);
```

## 🚨 Solución de Problemas

### Error: "permission denied for table usuarios"
1. Verifica que RLS esté habilitado
2. Confirma que las policies estén creadas
3. Verifica que el usuario esté autenticado

### Error: "null value in column violates not-null constraint"
1. Verifica que todos los campos requeridos estén presentes
2. Revisa las validaciones por tipo de usuario

### Error: "insert or update on table usuarios violates foreign key constraint"
1. Confirma que el `id` corresponda a un usuario en `auth.users`
2. Verifica que el usuario se haya registrado correctamente en Auth

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en la consola del navegador
2. Verifica la configuración de variables de entorno
3. Confirma que Supabase esté configurado correctamente

## 🔄 Migraciones Futuras

Para agregar nuevas migraciones:
1. Crea archivo numerado: `002_nombre_migration.sql`
2. Documenta cambios en este README
3. Ejecuta en orden secuencial

---

**Importante**: Después de ejecutar esta migración, desactiva el modo desarrollo en `src/services/supabase.ts` para probar la integración real.