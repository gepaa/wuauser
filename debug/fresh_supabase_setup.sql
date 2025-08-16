-- CONFIGURACIÓN FRESCA DE SUPABASE - Patrón oficial
-- EJECUTAR DESPUÉS del script clean_and_restart.sql

-- 1. CREAR TYPE PARA USUARIO
CREATE TYPE tipo_usuario_enum AS ENUM ('dueno', 'veterinario');

-- 2. CREAR TABLA PROFILES (patrón oficial de Supabase)
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text,
  tipo_usuario tipo_usuario_enum DEFAULT 'dueno',
  first_name text,
  telefono text,
  -- Campos específicos opcionales
  direccion text,
  codigo_postal text,
  ciudad text,
  cedula_profesional text,
  especialidad text,
  nombre_clinica text,
  direccion_clinica text,
  telefono_clinica text,
  servicios jsonb,
  horario_atencion jsonb,
  verificado boolean DEFAULT false,
  -- Auditoría
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- 3. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREAR FUNCTION PARA AUTO-CREAR PROFILE (patrón oficial)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    tipo_usuario,
    first_name,
    telefono
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'tipo_usuario', 'dueno')::tipo_usuario_enum,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'telefono'
  );
  RETURN new;
END;
$$;

-- 5. CREAR TRIGGER QUE SE EJECUTA AL CREAR AUTH USER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. CREAR POLICIES BÁSICAS (seguras)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. INSERTAR USUARIO DE PRUEBA MANUAL (para verificar)
-- NOTA: Esto simula lo que haría el trigger
INSERT INTO public.profiles (
  id,
  email,
  tipo_usuario,
  first_name,
  telefono
) VALUES (
  gen_random_uuid(), -- En producción será el ID real de auth.users
  'test.setup@example.com',
  'dueno',
  'Usuario de Prueba',
  '5555551234'
);

-- 8. VERIFICAR QUE TODO ESTÁ CONFIGURADO
SELECT 
  'Tabla profiles' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ Existe' 
    ELSE '❌ No existe' 
  END as status

UNION ALL

SELECT 
  'Trigger configurado' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    THEN '✅ Configurado'
    ELSE '❌ No configurado'
  END as status

UNION ALL

SELECT 
  'RLS habilitado' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  )
    THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as status;

-- 9. MOSTRAR REGISTRO DE PRUEBA
SELECT 
  id,
  email,
  tipo_usuario,
  first_name,
  telefono,
  created_at
FROM public.profiles 
WHERE email = 'test.setup@example.com';

-- COMENTARIOS:
-- ✅ Configuración limpia desde cero
-- ✅ Patrón oficial de Supabase
-- ✅ Trigger automático funcional
-- ✅ RLS configurado correctamente
-- ✅ Listo para probar en la app