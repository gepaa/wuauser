import { Cita, Dueno } from '../types/agenda';

// Expanded mock data for calendar testing - 30 days of appointments
export const generateMockCitas = (startDate: Date = new Date()): Cita[] => {
  const citas: Cita[] = [];
  const tipos = [
    'Consulta General',
    'Vacunación',
    'Control Post-operatorio',
    'Emergencia',
    'Revisión Dental',
    'Cirugía Menor',
    'Desparasitación',
    'Castración',
    'Ultrasonido',
    'Análisis de Sangre'
  ];

  const estados: Array<'confirmada' | 'pendiente' | 'completada' | 'cancelada'> = [
    'confirmada', 'pendiente', 'completada', 'cancelada'
  ];

  const horarios = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  // Generate appointments for 30 days
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);

    // Skip weekends for less appointments
    const dayOfWeek = currentDate.getDay();
    const appointmentsPerDay = dayOfWeek === 0 || dayOfWeek === 6 ? 
      Math.floor(Math.random() * 3) + 1 : // 1-3 appointments on weekends
      Math.floor(Math.random() * 6) + 2;  // 2-7 appointments on weekdays

    const usedHours = new Set<string>();

    for (let i = 0; i < appointmentsPerDay; i++) {
      let hour: string;
      do {
        hour = horarios[Math.floor(Math.random() * horarios.length)];
      } while (usedHours.has(hour));
      
      usedHours.add(hour);

      const dueno = mockDuenos[Math.floor(Math.random() * mockDuenos.length)];
      const mascota = dueno.mascotas[Math.floor(Math.random() * dueno.mascotas.length)];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const estado = estados[Math.floor(Math.random() * estados.length)];

      citas.push({
        id: day * 100 + i + 1,
        fecha: new Date(currentDate),
        hora: hour,
        mascota: mascota.nombre,
        dueno: dueno.nombre,
        tipo,
        estado,
        telefono: dueno.telefono,
        duracion: Math.random() > 0.7 ? 60 : 30, // 30% of appointments are 60 minutes
        notas: Math.random() > 0.5 ? `Notas para ${mascota.nombre}` : undefined
      });
    }
  }

  return citas.sort((a, b) => {
    const dateA = new Date(`${a.fecha.toDateString()} ${a.hora}`);
    const dateB = new Date(`${b.fecha.toDateString()} ${b.hora}`);
    return dateA.getTime() - dateB.getTime();
  });
};

// Mock data for pet owners and their pets
export const mockDuenos: Dueno[] = [
  {
    id: 1,
    nombre: 'Carlos Rodríguez',
    telefono: '55-1234-5678',
    email: 'carlos.rodriguez@email.com',
    mascotas: [
      { id: 1, nombre: 'Max', especie: 'Perro', raza: 'Golden Retriever', edad: 3 },
      { id: 2, nombre: 'Bella', especie: 'Perro', raza: 'Labrador', edad: 2 }
    ]
  },
  {
    id: 2,
    nombre: 'María García',
    telefono: '55-9876-5432',
    email: 'maria.garcia@email.com',
    mascotas: [
      { id: 3, nombre: 'Luna', especie: 'Gato', raza: 'Persa', edad: 1 }
    ]
  },
  {
    id: 3,
    nombre: 'Juan Pérez',
    telefono: '55-5555-1111',
    email: 'juan.perez@email.com',
    mascotas: [
      { id: 4, nombre: 'Rocky', especie: 'Perro', raza: 'Bulldog', edad: 5 }
    ]
  },
  {
    id: 4,
    nombre: 'Ana López',
    telefono: '55-3333-7777',
    email: 'ana.lopez@email.com',
    mascotas: [
      { id: 5, nombre: 'Coco', especie: 'Gato', raza: 'Siamés', edad: 2 },
      { id: 6, nombre: 'Mimi', especie: 'Gato', raza: 'Angora', edad: 4 }
    ]
  },
  {
    id: 5,
    nombre: 'Pedro Martínez',
    telefono: '55-8888-9999',
    email: 'pedro.martinez@email.com',
    mascotas: [
      { id: 7, nombre: 'Rex', especie: 'Perro', raza: 'Pastor Alemán', edad: 4 }
    ]
  },
  {
    id: 6,
    nombre: 'Laura Sánchez',
    telefono: '55-2222-4444',
    email: 'laura.sanchez@email.com',
    mascotas: [
      { id: 8, nombre: 'Nala', especie: 'Gato', raza: 'Maine Coon', edad: 3 },
      { id: 9, nombre: 'Simba', especie: 'Gato', raza: 'Bengala', edad: 1 }
    ]
  },
  {
    id: 7,
    nombre: 'Roberto Díaz',
    telefono: '55-6666-3333',
    email: 'roberto.diaz@email.com',
    mascotas: [
      { id: 10, nombre: 'Thor', especie: 'Perro', raza: 'Rottweiler', edad: 6 }
    ]
  },
  {
    id: 8,
    nombre: 'Carmen Herrera',
    telefono: '55-7777-8888',
    email: 'carmen.herrera@email.com',
    mascotas: [
      { id: 11, nombre: 'Lola', especie: 'Perro', raza: 'Chihuahua', edad: 2 },
      { id: 12, nombre: 'Paco', especie: 'Ave', raza: 'Canario', edad: 1 }
    ]
  }
];

// Available time slots for appointments
export const horariosDisponibles = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

// Consultation types
export const tiposConsulta = [
  { id: 'general', label: 'Consulta General', duracionDefault: 30 },
  { id: 'vacunacion', label: 'Vacunación', duracionDefault: 30 },
  { id: 'emergencia', label: 'Emergencia', duracionDefault: 60 },
  { id: 'control', label: 'Control Post-operatorio', duracionDefault: 30 },
  { id: 'cirugia', label: 'Cirugía Menor', duracionDefault: 90 },
  { id: 'dental', label: 'Revisión Dental', duracionDefault: 45 },
  { id: 'desparasitacion', label: 'Desparasitación', duracionDefault: 30 },
  { id: 'castracion', label: 'Castración', duracionDefault: 120 },
  { id: 'ultrasonido', label: 'Ultrasonido', duracionDefault: 45 },
  { id: 'analisis', label: 'Análisis de Sangre', duracionDefault: 30 }
];

// Duration options
export const duracionesDisponibles = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 minutos' },
  { value: 120, label: '2 horas' }
];

// Helper function to get appointments for a specific date
export const getCitasPorFecha = (citas: Cita[], fecha: Date): Cita[] => {
  return citas.filter(cita => 
    cita.fecha.toDateString() === fecha.toDateString()
  );
};

// Helper function to get available slots for a specific date
export const getHorariosLibres = (citas: Cita[], fecha: Date): string[] => {
  const citasDelDia = getCitasPorFecha(citas, fecha);
  const horasOcupadas = citasDelDia.map(cita => cita.hora);
  
  return horariosDisponibles.filter(hora => !horasOcupadas.includes(hora));
};

// Helper function to check if a time slot is available
export const isHorarioDisponible = (citas: Cita[], fecha: Date, hora: string): boolean => {
  const citasDelDia = getCitasPorFecha(citas, fecha);
  return !citasDelDia.some(cita => cita.hora === hora);
};