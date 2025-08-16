-- SOLUCIÓN URGENTE: Arreglar policies RLS que causan recursión infinita
-- EJECUTAR INMEDIATAMENTE en Supabase SQL Editor

-- 1. ELIMINAR TODAS LAS POLICIES EXISTENTES
DROP POLICY IF EXISTS "usuarios_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_own" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "duenos_view_veterinarios" ON public.usuarios;

-- 2. DESHABILITAR RLS TEMPORALMENTE PARA DEBUGGING
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR QUE LA TABLA FUNCIONA SIN RLS
-- (Este SELECT debería funcionar ahora)
SELECT COUNT(*) as total_usuarios FROM public.usuarios;

-- 4. INSERCIÓN DE PRUEBA MANUAL
INSERT INTO public.usuarios (
    id, 
    email, 
    tipo_usuario, 
    nombre_completo
) VALUES (
    gen_random_uuid(),
    'test.manual.fix@example.com',
    'dueno'::tipo_usuario_enum,
    'Test Manual Fix'
);

-- 5. VERIFICAR QUE LA INSERCIÓN FUNCIONÓ
SELECT * FROM public.usuarios WHERE email = 'test.manual.fix@example.com';

-- 6. POLICIES CORREGIDAS (sin recursión)
-- Ejecutar SOLO después de confirmar que la tabla funciona

/*
-- HABILITAR RLS NUEVAMENTE (comentado por ahora)
-- ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- POLICY SIMPLE PARA INSERCIÓN (sin recursión)
-- CREATE POLICY "usuarios_insert_simple" ON public.usuarios
--     FOR INSERT WITH CHECK (true); -- Permitir todas las inserciones por ahora

-- POLICY SIMPLE PARA SELECCIÓN
-- CREATE POLICY "usuarios_select_simple" ON public.usuarios
--     FOR SELECT USING (true); -- Permitir todas las selecciones por ahora

-- POLICY SIMPLE PARA ACTUALIZACIÓN
-- CREATE POLICY "usuarios_update_simple" ON public.usuarios
--     FOR UPDATE USING (auth.uid() = id);
*/

-- COMENTARIOS:
-- 1. Esto deshabilita RLS temporalmente para que el registro funcione
-- 2. Una vez que confirmes que todo funciona, puedes habilitar RLS con policies más simples
-- 3. El problema era que las policies originales creaban recursión infinita

-- INSTRUCCIONES:
-- 1. Ejecutar este SQL en Supabase
-- 2. Probar registro en la app
-- 3. Confirmar que funciona
-- 4. Luego habilitar RLS gradualmente