-- Migración 001: Crear tabla usuarios para Wuauser
-- Fecha: 2025-01-15
-- Descripción: Tabla principal de usuarios que soporta tanto dueños como veterinarios

-- Crear enum para tipos de usuario
CREATE TYPE tipo_usuario_enum AS ENUM ('dueno', 'veterinario');

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    -- Campos principales
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    tipo_usuario tipo_usuario_enum NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    
    -- Campos específicos para dueños de mascotas
    direccion TEXT,
    codigo_postal VARCHAR(10),
    ciudad VARCHAR(100),
    
    -- Campos específicos para veterinarios
    cedula_profesional VARCHAR(50),
    especialidad VARCHAR(255),
    nombre_clinica VARCHAR(255),
    direccion_clinica TEXT,
    telefono_clinica VARCHAR(20),
    servicios JSONB,
    horario_atencion JSONB,
    verificado BOOLEAN DEFAULT false,
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON public.usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_ciudad ON public.usuarios(ciudad) WHERE tipo_usuario = 'dueno';
CREATE INDEX IF NOT EXISTS idx_usuarios_verificado ON public.usuarios(verificado) WHERE tipo_usuario = 'veterinario';
CREATE INDEX IF NOT EXISTS idx_usuarios_especialidad ON public.usuarios(especialidad) WHERE tipo_usuario = 'veterinario';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cada UPDATE
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar Row Level Security
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver solo su propio perfil
CREATE POLICY "usuarios_select_own" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

-- Policy: Los usuarios pueden insertar solo su propio perfil
CREATE POLICY "usuarios_insert_own" ON public.usuarios
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: Los usuarios pueden actualizar solo su propio perfil
CREATE POLICY "usuarios_update_own" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Los dueños pueden ver perfiles de veterinarios verificados (para búsquedas)
CREATE POLICY "duenos_view_veterinarios" ON public.usuarios
    FOR SELECT USING (
        tipo_usuario = 'veterinario' 
        AND verificado = true
        AND EXISTS (
            SELECT 1 FROM public.usuarios u 
            WHERE u.id = auth.uid() 
            AND u.tipo_usuario = 'dueno'
        )
    );

-- Función para validar datos según tipo de usuario
CREATE OR REPLACE FUNCTION public.validate_usuario_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validaciones para dueños
    IF NEW.tipo_usuario = 'dueno' THEN
        -- Campos requeridos para dueños
        IF NEW.direccion IS NULL OR NEW.ciudad IS NULL THEN
            RAISE EXCEPTION 'Dueños requieren dirección y ciudad';
        END IF;
        
        -- Limpiar campos de veterinario
        NEW.cedula_profesional = NULL;
        NEW.especialidad = NULL;
        NEW.nombre_clinica = NULL;
        NEW.direccion_clinica = NULL;
        NEW.telefono_clinica = NULL;
        NEW.servicios = NULL;
        NEW.horario_atencion = NULL;
        NEW.verificado = NULL;
    END IF;
    
    -- Validaciones para veterinarios
    IF NEW.tipo_usuario = 'veterinario' THEN
        -- Campos requeridos para veterinarios
        IF NEW.cedula_profesional IS NULL OR NEW.especialidad IS NULL OR NEW.nombre_clinica IS NULL THEN
            RAISE EXCEPTION 'Veterinarios requieren cédula profesional, especialidad y nombre de clínica';
        END IF;
        
        -- Limpiar campos de dueño
        NEW.direccion = NULL;
        NEW.codigo_postal = NULL;
        NEW.ciudad = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar datos antes de insertar/actualizar
CREATE TRIGGER trigger_validate_usuario_data
    BEFORE INSERT OR UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_usuario_data();

-- Comentarios en la tabla para documentación
COMMENT ON TABLE public.usuarios IS 'Tabla principal de usuarios del sistema Wuauser (dueños y veterinarios)';
COMMENT ON COLUMN public.usuarios.id IS 'UUID que referencia auth.users(id)';
COMMENT ON COLUMN public.usuarios.tipo_usuario IS 'Tipo de usuario: dueno o veterinario';
COMMENT ON COLUMN public.usuarios.servicios IS 'JSON con servicios ofrecidos por veterinarios';
COMMENT ON COLUMN public.usuarios.horario_atencion IS 'JSON con horarios de atención de veterinarios';
COMMENT ON COLUMN public.usuarios.verificado IS 'Indica si un veterinario ha sido verificado por el sistema';