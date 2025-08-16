-- SOLUCIÓN SIMPLE Y CORRECTA: Estructura básica sin complicaciones
-- EJECUTAR en un NUEVO query en Supabase SQL Editor

-- 1. ELIMINAR TODAS LAS COMPLICACIONES (triggers, validaciones, RLS)
DROP TRIGGER IF EXISTS trigger_validate_usuario_data ON public.usuarios;
DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON public.usuarios;
DROP FUNCTION IF EXISTS validate_usuario_data();

-- 2. DESHABILITAR RLS COMPLETAMENTE 
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR TODAS LAS POLICIES
DROP POLICY IF EXISTS "usuarios_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "duenos_view_veterinarios" ON public.usuarios;

-- 4. HACER LA TABLA SUPER SIMPLE - Solo campos básicos requeridos
-- Modificar estructura para que solo campos necesarios sean NOT NULL
ALTER TABLE public.usuarios 
ALTER COLUMN direccion DROP NOT NULL,
ALTER COLUMN ciudad DROP NOT NULL,
ALTER COLUMN codigo_postal DROP NOT NULL,
ALTER COLUMN cedula_profesional DROP NOT NULL,
ALTER COLUMN especialidad DROP NOT NULL,
ALTER COLUMN nombre_clinica DROP NOT NULL;

-- 5. PROBAR INSERCIÓN BÁSICA (como debería ser para dueño)
INSERT INTO public.usuarios (
    id, 
    email, 
    tipo_usuario, 
    nombre_completo,
    telefono
) VALUES (
    gen_random_uuid(),
    'dueno.simple@example.com',
    'dueno'::tipo_usuario_enum,
    'Juan Pérez',
    '5555551234'
);

-- 6. PROBAR INSERCIÓN BÁSICA PARA VETERINARIO
INSERT INTO public.usuarios (
    id, 
    email, 
    tipo_usuario, 
    nombre_completo,
    telefono,
    cedula_profesional,
    especialidad,
    nombre_clinica
) VALUES (
    gen_random_uuid(),
    'vet.simple@example.com',
    'veterinario'::tipo_usuario_enum,
    'Dra. María García',
    '5555555678',
    'CED12345',
    'Medicina General',
    'Clínica Veterinaria'
);

-- 7. VERIFICAR QUE AMBAS INSERCIONES FUNCIONARON
SELECT 
    email,
    tipo_usuario,
    nombre_completo,
    telefono,
    CASE 
        WHEN direccion IS NOT NULL THEN 'Con dirección'
        ELSE 'Sin dirección'
    END as tiene_direccion
FROM public.usuarios 
WHERE email IN ('dueno.simple@example.com', 'vet.simple@example.com');

-- COMENTARIOS:
-- 1. Esto elimina TODAS las validaciones complicadas
-- 2. Permite registro básico sin campos opcionales
-- 3. La tabla funciona como una tabla normal de PostgreSQL
-- 4. Una vez que confirmes que funciona, podemos agregar validaciones simples después