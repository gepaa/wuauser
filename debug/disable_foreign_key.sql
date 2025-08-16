-- SOLUCIÓN INMEDIATA: Deshabilitar foreign key constraint temporalmente
-- EJECUTAR en un NUEVO query en Supabase SQL Editor

-- 1. DESHABILITAR LA RESTRICCIÓN FOREIGN KEY TEMPORALMENTE
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

-- 2. VERIFICAR QUE LA RESTRICCIÓN SE ELIMINÓ
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'usuarios' AND constraint_type = 'FOREIGN KEY';

-- 3. PROBAR INSERCIÓN SIMPLE SIN RESTRICCIONES
INSERT INTO public.usuarios (
    id, 
    email, 
    tipo_usuario, 
    nombre_completo
) VALUES (
    gen_random_uuid(),
    'test.no.fk@example.com',
    'dueno'::tipo_usuario_enum,
    'Test Sin Foreign Key'
);

-- 4. VERIFICAR QUE FUNCIONÓ
SELECT 
    id,
    email, 
    tipo_usuario, 
    nombre_completo,
    created_at
FROM public.usuarios 
WHERE email = 'test.no.fk@example.com';

-- 5. CONTAR REGISTROS TOTALES
SELECT COUNT(*) as total_usuarios FROM public.usuarios;

-- COMENTARIOS:
-- 1. Esto elimina temporalmente la restricción de foreign key
-- 2. Permite insertar registros sin que existan en auth.users
-- 3. Una vez que confirmes que la tabla funciona, podemos recrear la restricción
-- 4. El objetivo es aislar si el problema es de la tabla o del flujo Auth->Tabla