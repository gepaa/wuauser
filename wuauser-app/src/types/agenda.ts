export interface Cita {
  id: number;
  fecha: Date;
  hora: string;
  mascota: string;
  dueno: string;
  tipo: string;
  estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
  telefono: string;
  duracion: number; // minutes
  notas?: string;
}

export interface Mascota {
  id: number;
  nombre: string;
  especie: 'Perro' | 'Gato' | 'Ave' | 'Otro';
  raza: string;
  edad: number;
}

export interface Dueno {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  mascotas: Mascota[];
}

export interface NuevaCitaData {
  fecha: Date;
  hora: string;
  duenoId: number;
  mascotaId: number;
  tipo: string;
  duracion: number;
  notas?: string;
}

export interface TipoConsulta {
  id: string;
  label: string;
  duracionDefault: number;
}

export interface DuracionOption {
  value: number;
  label: string;
}

export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  time: string;
  color: string;
}

export interface WeekDay {
  date: Date;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  appointments: Cita[];
}