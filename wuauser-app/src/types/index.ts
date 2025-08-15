export type TipoUsuario = 'dueno' | 'veterinario' | 'guest';

export interface Usuario {
  id: string;
  email: string;
  tipo_usuario: TipoUsuario;
  nombre_completo: string;
  telefono: string;
  created_at: string;
}

export interface DuenoMascota extends Usuario {
  direccion?: string;
  codigo_postal?: string;
  ciudad?: string;
}

export interface Veterinario extends Usuario {
  cedula_profesional: string;
  especialidad: string;
  nombre_clinica?: string;
  direccion_clinica: string;
  telefono_clinica: string;
  servicios: string[];
  horario_atencion?: string;
  verificado: boolean;
}

export interface Mascota {
  id: string;
  dueno_id: string;
  nombre: string;
  especie: 'perro' | 'gato';
  raza: string;
  edad: number;
  sexo: 'macho' | 'hembra';
  color: string;
  foto_url?: string;
  qr_code: string;
  chip_id?: string;
  vacunas?: string[];
  condiciones_medicas?: string[];
}

export interface Appointment {
  id: string;
  petId: string;
  vetId: string;
  ownerId: string;
  dateTime: string;
  duration: number;
  type: 'consultation' | 'emergency' | 'checkup' | 'vaccination';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
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