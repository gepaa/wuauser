-- LIMPIAR TODO Y EMPEZAR DESDE CERO
-- EJECUTAR ESTE SCRIPT PRIMERO para limpiar completamente

-- 1. ELIMINAR TRIGGERS EXISTENTES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_validate_usuario_data ON public.usuarios;
DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON public.usuarios;

-- 2. ELIMINAR FUNCTIONS EXISTENTES
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.validate_usuario_data() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 3. ELIMINAR TODAS LAS TABLAS RELACIONADAS
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- 4. ELIMINAR TYPES
DROP TYPE IF EXISTS tipo_usuario_enum CASCADE;

-- 5. VERIFICAR QUE TODO SE ELIMINÓ
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'usuarios');

-- 6. VERIFICAR QUE NO HAY TRIGGERS
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%user%' OR trigger_name LIKE '%usuario%';

-- 7. VERIFICAR QUE NO HAY FUNCTIONS
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%user%';

-- RESULTADO ESPERADO:
-- - Sin tablas profiles/usuarios
-- - Sin triggers relacionados
-- - Sin functions relacionadas
-- - Listo para crear desde cero

-- SIGUIENTE PASO:
-- Después de ejecutar este script, ejecutar: fresh_supabase_setup.sql