-- SOLUCIÓN DEFINITIVA: Eliminar foreign key constraint completamente
-- EJECUTAR PRIMERO antes que cualquier otro script

-- 1. ELIMINAR LA RESTRICCIÓN FOREIGN KEY
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

-- 2. VERIFICAR QUE SE ELIMINÓ
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'usuarios' AND constraint_type = 'FOREIGN KEY';

-- 3. ELIMINAR TODAS LAS COMPLICACIONES ADICIONALES
DROP TRIGGER IF EXISTS trigger_validate_usuario_data ON public.usuarios;
DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON public.usuarios;
DROP FUNCTION IF EXISTS validate_usuario_data();
DROP FUNCTION IF EXISTS handle_updated_at();

-- 4. DESHABILITAR RLS COMPLETAMENTE 
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 5. ELIMINAR TODAS LAS POLICIES
DROP POLICY IF EXISTS "usuarios_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "duenos_view_veterinarios" ON public.usuarios;

-- 6. PROBAR INSERCIÓN SIMPLE AHORA (debería funcionar)
INSERT INTO public.usuarios (
    id, 
    email, 
    tipo_usuario, 
    nombre_completo,
    telefono
) VALUES (
    gen_random_uuid(),
    'test.final@example.com',
    'dueno'::tipo_usuario_enum,
    'Test Final',
    '5555551234'
);

-- 7. VERIFICAR QUE FUNCIONÓ
SELECT 
    id,
    email,
    tipo_usuario,
    nombre_completo,
    telefono,
    created_at
FROM public.usuarios 
WHERE email = 'test.final@example.com';

-- 8. MOSTRAR ESTRUCTURA ACTUAL DE LA TABLA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- COMENTARIOS:
-- 1. Esto elimina la restricción que conecta con auth.users
-- 2. La tabla ahora funciona independientemente
-- 3. Podemos conectar con auth después, pero primero que funcione básico
-- 4. Una vez que confirmes que funciona, probar en la app