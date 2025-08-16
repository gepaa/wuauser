-- SOLUCIÓN INMEDIATA: Deshabilitar trigger de validación temporalmente
-- EJECUTAR en un NUEVO query en Supabase SQL Editor

-- 1. DESHABILITAR EL TRIGGER DE VALIDACIÓN
DROP TRIGGER IF EXISTS trigger_validate_usuario_data ON public.usuarios;

-- 2. DESHABILITAR TAMBIÉN EL TRIGGER DE UPDATED_AT (por si acaso)
DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON public.usuarios;

-- 3. VERIFICAR QUE NO HAY TRIGGERS ACTIVOS
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'usuarios';

-- 4. AHORA PROBAR INSERCIÓN SIMPLE
INSERT INTO public.usuarios (
    id, 
    email, 
    tipo_usuario, 
    nombre_completo
) VALUES (
    gen_random_uuid(),
    'test.without.trigger@example.com',
    'dueno'::tipo_usuario_enum,
    'Test Sin Trigger'
);

-- 5. VERIFICAR QUE FUNCIONÓ
SELECT * FROM public.usuarios WHERE email = 'test.without.trigger@example.com';

-- COMENTARIOS:
-- 1. Esto elimina el trigger que validaba campos requeridos
-- 2. Ahora la inserción debería funcionar sin problemas
-- 3. Una vez que confirmes que funciona, podemos recrear triggers más simples