-- TEST COMPLETO: Flujo Auth → Tabla usuarios
-- EJECUTAR en un NUEVO query DESPUÉS del anterior

-- 1. VERIFICAR USUARIOS EN AUTH
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. CREAR UN USUARIO MANUAL EN AUTH (para probar)
-- NOTA: Esto no se puede hacer directamente via SQL, 
-- pero podemos ver los que ya existen

-- 3. BUSCAR UN ID EXISTENTE EN AUTH.USERS PARA PROBAR
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Buscar un usuario existente en auth.users
    SELECT id INTO test_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Probar inserción con ID real de auth.users
        INSERT INTO public.usuarios (
            id, 
            email, 
            tipo_usuario, 
            nombre_completo
        ) VALUES (
            test_user_id,
            'test.with.real.auth.id@example.com',
            'dueno'::tipo_usuario_enum,
            'Test Con ID Real de Auth'
        )
        ON CONFLICT (id) DO NOTHING; -- Por si ya existe
        
        RAISE NOTICE 'Inserción con ID real de auth: %', test_user_id;
    ELSE
        RAISE NOTICE 'No hay usuarios en auth.users para probar';
    END IF;
END $$;

-- 4. VERIFICAR RESULTADO
SELECT 
    u.id,
    u.email,
    u.tipo_usuario,
    u.nombre_completo,
    au.email as auth_email,
    au.created_at as auth_created
FROM public.usuarios u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;

-- 5. ANÁLISIS: Ver si hay discrepancias
SELECT 
    'En usuarios pero no en auth' as status,
    COUNT(*) as count
FROM public.usuarios u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL

UNION ALL

SELECT 
    'En auth pero no en usuarios' as status,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.usuarios u ON au.id = u.id
WHERE u.id IS NULL;

-- COMENTARIOS:
-- Este script te ayuda a entender:
-- 1. Qué usuarios existen en auth.users
-- 2. Si podemos insertar con IDs reales de auth
-- 3. Si hay discrepancias entre las dos tablas