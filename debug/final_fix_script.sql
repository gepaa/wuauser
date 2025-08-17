-- SCRIPT FINAL PARA RESOLVER EL REGISTRO
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR

-- 1. LIMPIAR TODO PRIMERO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TYPE IF EXISTS tipo_usuario_enum CASCADE;

-- 2. CREAR ENUM
CREATE TYPE tipo_usuario_enum AS ENUM ('dueno', 'veterinario');

-- 3. CREAR TABLA USUARIOS (NO PROFILES)
CREATE TABLE public.usuarios (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text,
  tipo_usuario tipo_usuario_enum DEFAULT 'dueno',
  nombre_completo text,
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

-- 4. HABILITAR RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. CREAR FUNCTION PARA AUTO-CREAR USUARIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usuarios (
    id, 
    email,
    tipo_usuario,
    nombre_completo,
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

-- 6. CREAR TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. CREAR POLICIES BÁSICAS
CREATE POLICY "Users can view own profile" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.usuarios
  FOR UPDATE USING (auth.uid() = id);

-- 8. VERIFICAR CONFIGURACIÓN
SELECT 
  'Tabla usuarios' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') 
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
    WHERE tablename = 'usuarios' 
    AND rowsecurity = true
  )
    THEN '✅ Habilitado'
    ELSE '❌ Deshabilitado'
  END as status;

-- 9. MENSAJE FINAL
SELECT 'CONFIGURACIÓN COMPLETA - LISTO PARA PROBAR REGISTRO EN LA APP' as mensaje;