-- PATRÓN OFICIAL DE SUPABASE - Según documentación
-- EJECUTAR este script para implementar el patrón correcto

-- 1. ELIMINAR LA TABLA PROBLEMÁTICA
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TYPE IF EXISTS tipo_usuario_enum CASCADE;

-- 2. CREAR TABLA PROFILES SEGÚN DOCUMENTACIÓN OFICIAL
CREATE TYPE tipo_usuario_enum AS ENUM ('dueno', 'veterinario');

CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text,
  tipo_usuario tipo_usuario_enum,
  first_name text,
  last_name text,
  telefono text,
  -- Campos específicos para dueños
  direccion text,
  codigo_postal text,
  ciudad text,
  -- Campos específicos para veterinarios
  cedula_profesional text,
  especialidad text,
  nombre_clinica text,
  direccion_clinica text,
  telefono_clinica text,
  servicios jsonb,
  horario_atencion jsonb,
  verificado boolean DEFAULT false,
  -- Campos de auditoría
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 3. HABILITAR RLS SEGÚN DOCUMENTACIÓN
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREAR FUNCTION PARA HANDLE NEW USER (patrón oficial)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
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

-- 5. CREAR TRIGGER AUTOMÁTICO (patrón oficial)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. CREAR POLICIES SIMPLES (patrón oficial)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. PROBAR QUE ESTÁ CONFIGURADO CORRECTAMENTE
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- COMENTARIOS:
-- 1. Este es el patrón EXACTO que recomienda Supabase
-- 2. El trigger se ejecuta AUTOMÁTICAMENTE cuando se crea un auth user
-- 3. Los datos van en raw_user_meta_data del signup
-- 4. No necesitamos manejar la inserción manualmente en el código