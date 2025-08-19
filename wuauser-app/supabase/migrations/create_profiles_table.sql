-- Crear tabla profiles si no existe
-- IMPORTANTE: Este SQL debe ejecutarse manualmente en Supabase Dashboard > SQL Editor
-- O usando la CLI de Supabase: npx supabase db reset

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre_completo TEXT,
  telefono TEXT,
  tipo_usuario TEXT CHECK (tipo_usuario IN ('dueno', 'veterinario', 'guest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Campos adicionales para veterinarios (nullable)
  cedula_profesional TEXT,
  especialidad TEXT,
  nombre_clinica TEXT,
  direccion_clinica TEXT,
  telefono_clinica TEXT,
  verificado BOOLEAN DEFAULT FALSE,
  servicios JSONB,
  horario_atencion JSONB,
  
  -- Campos adicionales para dueños (nullable)
  direccion TEXT,
  codigo_postal TEXT,
  ciudad TEXT
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen y crear nuevas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Verified veterinarians are publicly visible" ON public.profiles;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para insertar perfil propio
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para que veterinarios verificados sean visibles públicamente
CREATE POLICY "Verified veterinarians are publicly visible" ON public.profiles
  FOR SELECT USING (
    tipo_usuario = 'veterinario' 
    AND verificado = TRUE
  );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE
  ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Función trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, tipo_usuario)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'tipo_usuario', 'dueno')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Eliminar trigger existente si ya existe y crear uno nuevo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS profiles_tipo_usuario_idx ON public.profiles(tipo_usuario);
CREATE INDEX IF NOT EXISTS profiles_verificado_idx ON public.profiles(verificado);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Comentarios para documentación
COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios del sistema Wuauser - dueños de mascotas y veterinarios';
COMMENT ON COLUMN public.profiles.tipo_usuario IS 'Tipo de usuario: dueno, veterinario, o guest';
COMMENT ON COLUMN public.profiles.verificado IS 'Solo para veterinarios - indica si están verificados profesionalmente';
COMMENT ON COLUMN public.profiles.servicios IS 'JSON con servicios que ofrece el veterinario';
COMMENT ON COLUMN public.profiles.horario_atencion IS 'JSON con horarios de atención del veterinario';