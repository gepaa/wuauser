export type TipoUsuario = 'dueno' | 'veterinario' | 'guest';

export interface Profile {
  id: string;
  tipo_usuario: TipoUsuario;
  nombre_completo: string;
  telefono?: string;
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
  foto_url?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Veterinario {
  id: string;
  profile_id: string;
  nombre_clinica: string;
  cedula_profesional?: string;
  especialidad?: string;
  direccion_clinica: string;
  telefono_clinica?: string;
  lat?: number;
  lng?: number;
  servicios: string[];
  horario?: Record<string, any>;
  rating: number;
  verificado: boolean;
  foto_cedula_url?: string;
  created_at: string;
}

export interface Mascota {
  id: string;
  dueno_id: string;
  nombre: string;
  especie: 'perro' | 'gato' | 'otro';
  raza?: string;
  sexo?: 'macho' | 'hembra';
  fecha_nacimiento?: string;
  peso?: number;
  color?: string;
  foto_url?: string;
  qr_code: string;
  chip_id?: string;
  esterilizado: boolean;
  vacunas: any[];
  condiciones_medicas?: string[];
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Cita {
  id: string;
  mascota_id: string;
  veterinario_id?: string;
  dueno_id: string;
  fecha_hora: string;
  motivo: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  notas?: string;
  diagnostico?: string;
  tratamiento?: string;
  costo?: number;
  created_at: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  UserTypeSelection: undefined;
  RegisterDueno: undefined;
  RegisterVeterinario: undefined;
  QRScanner: undefined;
};