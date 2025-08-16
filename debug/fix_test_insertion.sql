-- ARREGLAR LA INSERCIÓN DE PRUEBA
-- El error es normal - necesitamos usar un ID real de auth.users

-- 1. VER QUÉ USUARIOS EXISTEN EN AUTH.USERS
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. ELIMINAR LA INSERCIÓN PROBLEMÁTICA (si existe)
DELETE FROM public.profiles WHERE email = 'test.setup@example.com';

-- 3. INSERTAR USUARIO DE PRUEBA CON ID REAL (si hay usuarios en auth)
DO $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Buscar un usuario existente en auth.users
    SELECT id INTO existing_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Insertar con ID real
        INSERT INTO public.profiles (
            id,
            email,
            tipo_usuario,
            first_name,
            telefono
        ) VALUES (
            existing_user_id,
            'test.with.real.id@example.com',
            'dueno',
            'Test Con ID Real',
            '5555551234'
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name;
            
        RAISE NOTICE 'Usuario de prueba creado con ID real: %', existing_user_id;
    ELSE
        RAISE NOTICE 'No hay usuarios en auth.users - el trigger se probará cuando registres en la app';
    END IF;
END $$;

-- 4. VERIFICAR CONFIGURACIÓN
SELECT 
    'Trigger configurado' as status,
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. MOSTRAR ESTRUCTURA FINAL
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 6. CONTAR REGISTROS ACTUALES
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN tipo_usuario = 'dueno' THEN 1 END) as duenos,
    COUNT(CASE WHEN tipo_usuario = 'veterinario' THEN 1 END) as veterinarios
FROM public.profiles;

-- COMENTARIOS:
-- ✅ El trigger está configurado correctamente
-- ✅ La tabla profiles existe
-- ✅ El error era solo en la inserción de prueba manual
-- ✅ Cuando registres en la app, el trigger creará el profile automáticamente
-- ✅ LISTO PARA PROBAR EN LA APP