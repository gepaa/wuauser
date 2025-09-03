export interface MockVeterinario {
  id: string;
  nombre: string;
  especialidad: string;
  ubicacion: {
    lat: number;
    lng: number;
    direccion: string;
    colonia: string;
    delegacion: string;
  };
  rating: number;
  totalReviews: number;
  experiencia: number;
  verificado: boolean;
  avatar: string | null;
  clinica: {
    nombre: string;
    telefono: string;
    descripcion: string;
    fotos: string[];
  };
  servicios: {
    id: string;
    nombre: string;
    precio: number;
    duracion: number;
    descripcion: string;
    categoria: string;
  }[];
  horarios: {
    [key: string]: {
      activo: boolean;
      inicio?: string;
      fin?: string;
    };
  };
  configuraciones: {
    aceptaUrgencias: boolean;
    serviciosDomicilio: boolean;
    radioCovertura: number;
    tiempoEntreCitas: number;
  };
  distancia?: number;
  proximaDisponibilidad?: string;
}

export interface MockResena {
  id: string;
  veterinarioId: string;
  clienteNombre: string;
  mascotaNombre: string;
  rating: number;
  comentario: string;
  fecha: string;
  servicio: string;
}

export const mockVeterinarios: MockVeterinario[] = [
  {
    id: 'vet_001',
    nombre: 'Dr. Ana María Ruiz',
    especialidad: 'Medicina Interna',
    ubicacion: {
      lat: 19.4326,
      lng: -99.1332,
      direccion: 'Av. Insurgentes Sur 1425',
      colonia: 'Del Valle',
      delegacion: 'Benito Juárez'
    },
    rating: 4.8,
    totalReviews: 156,
    experiencia: 12,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Clínica Veterinaria Del Valle',
      telefono: '55-5555-1234',
      descripcion: 'Especialistas en medicina interna con más de 15 años de experiencia. Instalaciones modernas y equipo especializado.',
      fotos: [
        'https://via.placeholder.com/400x300/4CAF50/white?text=Exterior',
        'https://via.placeholder.com/400x300/2196F3/white?text=Sala+Espera',
        'https://via.placeholder.com/400x300/FF9800/white?text=Consultorio',
        'https://via.placeholder.com/400x300/9C27B0/white?text=Equipo'
      ]
    },
    servicios: [
      {
        id: 'serv_001_001',
        nombre: 'Consulta General',
        precio: 650,
        duracion: 30,
        descripcion: 'Examen clínico completo y diagnóstico profesional',
        categoria: 'consulta'
      },
      {
        id: 'serv_001_002',
        nombre: 'Vacunación Completa',
        precio: 450,
        duracion: 15,
        descripcion: 'Aplicación de vacunas según calendario',
        categoria: 'preventivo'
      },
      {
        id: 'serv_001_003',
        nombre: 'Análisis Clínicos',
        precio: 850,
        duracion: 45,
        descripcion: 'Estudios de laboratorio completos',
        categoria: 'diagnostico'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '17:00' },
      sabado: { activo: true, inicio: '10:00', fin: '14:00' },
      domingo: { activo: false }
    },
    configuraciones: {
      aceptaUrgencias: true,
      serviciosDomicilio: false,
      radioCovertura: 10,
      tiempoEntreCitas: 15
    }
  },
  {
    id: 'vet_002',
    nombre: 'Dr. Carlos Mendoza',
    especialidad: 'Cirugía Veterinaria',
    ubicacion: {
      lat: 19.4284,
      lng: -99.1276,
      direccion: 'Calle Orizaba 85',
      colonia: 'Roma Norte',
      delegacion: 'Cuauhtémoc'
    },
    rating: 4.9,
    totalReviews: 203,
    experiencia: 15,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Centro Quirúrgico Veterinario Roma',
      telefono: '55-5555-2345',
      descripcion: 'Especialistas en cirugía mayor y menor. Quirófano equipado con tecnología de vanguardia.',
      fotos: [
        'https://via.placeholder.com/400x300/F44336/white?text=Exterior',
        'https://via.placeholder.com/400x300/3F51B5/white?text=Quirófano',
        'https://via.placeholder.com/400x300/009688/white?text=Recuperación',
        'https://via.placeholder.com/400x300/795548/white?text=Equipo+Cirugía'
      ]
    },
    servicios: [
      {
        id: 'serv_002_001',
        nombre: 'Consulta Especializada',
        precio: 800,
        duracion: 45,
        descripcion: 'Consulta con cirujano veterinario',
        categoria: 'consulta'
      },
      {
        id: 'serv_002_002',
        nombre: 'Cirugía Menor',
        precio: 2500,
        duracion: 90,
        descripcion: 'Procedimientos quirúrgicos ambulatorios',
        categoria: 'cirugia'
      },
      {
        id: 'serv_002_003',
        nombre: 'Cirugía Mayor',
        precio: 5500,
        duracion: 180,
        descripcion: 'Cirugías complejas con hospitalización',
        categoria: 'cirugia'
      },
      {
        id: 'serv_002_004',
        nombre: 'Emergencias Quirúrgicas',
        precio: 3500,
        duracion: 120,
        descripcion: 'Atención de urgencias quirúrgicas 24/7',
        categoria: 'emergencia'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '08:00', fin: '20:00' },
      martes: { activo: true, inicio: '08:00', fin: '20:00' },
      miercoles: { activo: true, inicio: '08:00', fin: '20:00' },
      jueves: { activo: true, inicio: '08:00', fin: '20:00' },
      viernes: { activo: true, inicio: '08:00', fin: '20:00' },
      sabado: { activo: true, inicio: '08:00', fin: '16:00' },
      domingo: { activo: true, inicio: '10:00', fin: '14:00' }
    },
    configuraciones: {
      aceptaUrgencias: true,
      serviciosDomicilio: false,
      radioCovertura: 15,
      tiempoEntreCitas: 30
    }
  },
  {
    id: 'vet_003',
    nombre: 'Dra. Laura Sánchez',
    especialidad: 'Dermatología Veterinaria',
    ubicacion: {
      lat: 19.4167,
      lng: -99.1711,
      direccion: 'Av. Patriotismo 229',
      colonia: 'San Pedro de los Pinos',
      delegacion: 'Benito Juárez'
    },
    rating: 4.7,
    totalReviews: 89,
    experiencia: 8,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Dermatología Veterinaria Especializada',
      telefono: '55-5555-3456',
      descripción: 'Especialistas en problemas de piel y alergias en mascotas. Tratamientos innovadores.',
      fotos: [
        'https://via.placeholder.com/400x300/E91E63/white?text=Fachada',
        'https://via.placeholder.com/400x300/00BCD4/white?text=Consultorio',
        'https://via.placeholder.com/400x300/4CAF50/white?text=Laboratorio',
        'https://via.placeholder.com/400x300/FF5722/white?text=Dermatología'
      ]
    },
    servicios: [
      {
        id: 'serv_003_001',
        nombre: 'Consulta Dermatológica',
        precio: 750,
        duracion: 40,
        descripcion: 'Evaluación especializada de problemas de piel',
        categoria: 'consulta'
      },
      {
        id: 'serv_003_002',
        nombre: 'Biopsia de Piel',
        precio: 1200,
        duracion: 60,
        descripcion: 'Toma y análisis de muestra de tejido',
        categoria: 'diagnostico'
      },
      {
        id: 'serv_003_003',
        nombre: 'Tratamiento de Alergias',
        precio: 950,
        duracion: 30,
        descripcion: 'Terapia para alergias y dermatitis',
        categoria: 'tratamiento'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '10:00', fin: '19:00' },
      martes: { activo: true, inicio: '10:00', fin: '19:00' },
      miercoles: { activo: true, inicio: '10:00', fin: '19:00' },
      jueves: { activo: false },
      viernes: { activo: true, inicio: '10:00', fin: '19:00' },
      sabado: { activo: true, inicio: '09:00', fin: '13:00' },
      domingo: { activo: false }
    },
    configuraciones: {
      aceptaUrgencias: false,
      serviciosDomicilio: true,
      radioCovertura: 8,
      tiempoEntreCitas: 20
    }
  },
  {
    id: 'vet_004',
    nombre: 'Dr. Roberto García',
    especialidad: 'Medicina General',
    ubicacion: {
      lat: 19.3498,
      lng: -99.1890,
      direccion: 'Av. Revolución 1425',
      colonia: 'San Ángel',
      delegacion: 'Álvaro Obregón'
    },
    rating: 4.6,
    totalReviews: 127,
    experiencia: 10,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Clínica Veterinaria San Ángel',
      telefono: '55-5555-4567',
      descripcion: 'Atención integral para mascotas con enfoque en medicina preventiva y familiar.',
      fotos: [
        'https://via.placeholder.com/400x300/607D8B/white?text=Entrada',
        'https://via.placeholder.com/400x300/8BC34A/white?text=Recepción',
        'https://via.placeholder.com/400x300/FFC107/white?text=Consultorios',
        'https://via.placeholder.com/400x300/9E9E9E/white?text=Farmacia'
      ]
    },
    servicios: [
      {
        id: 'serv_004_001',
        nombre: 'Consulta General',
        precio: 550,
        duracion: 30,
        descripcion: 'Revisión general y diagnóstico básico',
        categoria: 'consulta'
      },
      {
        id: 'serv_004_002',
        nombre: 'Vacunación',
        precio: 350,
        duracion: 15,
        descripcion: 'Aplicación de vacunas preventivas',
        categoria: 'preventivo'
      },
      {
        id: 'serv_004_003',
        nombre: 'Desparasitación',
        precio: 280,
        duracion: 20,
        descripcion: 'Tratamiento antiparasitario completo',
        categoria: 'preventivo'
      },
      {
        id: 'serv_004_004',
        nombre: 'Consulta a Domicilio',
        precio: 750,
        duracion: 60,
        descripcion: 'Consulta veterinaria en tu hogar',
        categoria: 'domicilio'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '17:00' },
      sabado: { activo: true, inicio: '10:00', fin: '15:00' },
      domingo: { activo: false }
    },
    configuraciones: {
      aceptaUrgencias: true,
      serviciosDomicilio: true,
      radioCovertura: 12,
      tiempoEntreCitas: 15
    }
  },
  {
    id: 'vet_005',
    nombre: 'Dra. Patricia Morales',
    especialidad: 'Cardiología Veterinaria',
    ubicacion: {
      lat: 19.3319,
      lng: -99.1837,
      direccion: 'Av. Universidad 1321',
      colonia: 'Oxtopulco',
      delegacion: 'Coyoacán'
    },
    rating: 4.9,
    totalReviews: 78,
    experiencia: 14,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Centro Cardiológico Veterinario',
      telefono: '55-5555-5678',
      descripcion: 'Especialistas en cardiología veterinaria con equipos de diagnóstico de última generación.',
      fotos: [
        'https://via.placeholder.com/400x300/2196F3/white?text=Centro+Médico',
        'https://via.placeholder.com/400x300/F44336/white?text=Cardiología',
        'https://via.placeholder.com/400x300/4CAF50/white?text=Ultrasonido',
        'https://via.placeholder.com/400x300/FF9800/white?text=Electrocardiograma'
      ]
    },
    servicios: [
      {
        id: 'serv_005_001',
        nombre: 'Consulta Cardiológica',
        precio: 1200,
        duracion: 60,
        descripcion: 'Evaluación completa del sistema cardiovascular',
        categoria: 'consulta'
      },
      {
        id: 'serv_005_002',
        nombre: 'Electrocardiograma',
        precio: 800,
        duracion: 30,
        descripcion: 'Estudio de la actividad eléctrica del corazón',
        categoria: 'diagnostico'
      },
      {
        id: 'serv_005_003',
        nombre: 'Ecocardiograma',
        precio: 1500,
        duracion: 45,
        descripcion: 'Ultrasonido del corazón y grandes vasos',
        categoria: 'diagnostico'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '08:00', fin: '16:00' },
      martes: { activo: true, inicio: '08:00', fin: '16:00' },
      miercoles: { activo: true, inicio: '08:00', fin: '16:00' },
      jueves: { activo: true, inicio: '08:00', fin: '16:00' },
      viernes: { activo: true, inicio: '08:00', fin: '14:00' },
      sabado: { activo: false },
      domingo: { activo: false }
    },
    configuraciones: {
      aceptaUrgencias: true,
      serviciosDomicilio: false,
      radioCovertura: 20,
      tiempoEntreCitas: 30
    }
  },
  {
    id: 'vet_006',
    nombre: 'Dr. Miguel Hernández',
    especialidad: 'Medicina de Urgencias',
    ubicacion: {
      lat: 19.4969,
      lng: -99.1271,
      direccion: 'Av. Ejército Nacional 843',
      colonia: 'Granada',
      delegacion: 'Miguel Hidalgo'
    },
    rating: 4.8,
    totalReviews: 234,
    experiencia: 11,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Hospital Veterinario de Urgencias 24H',
      telefono: '55-5555-6789',
      descripcion: 'Hospital veterinario con atención de urgencias las 24 horas. Equipo especializado en cuidados intensivos.',
      fotos: [
        'https://via.placeholder.com/400x300/9C27B0/white?text=Hospital+24H',
        'https://via.placeholder.com/400x300/3F51B5/white?text=Urgencias',
        'https://via.placeholder.com/400x300/009688/white?text=UCI+Veterinaria',
        'https://via.placeholder.com/400x300/FF5722/white?text=Quirófano+Urgencia'
      ]
    },
    servicios: [
      {
        id: 'serv_006_001',
        nombre: 'Consulta de Urgencia',
        precio: 1000,
        duracion: 45,
        descripcion: 'Atención inmediata para emergencias',
        categoria: 'emergencia'
      },
      {
        id: 'serv_006_002',
        nombre: 'Hospitalización',
        precio: 2500,
        duracion: 1440,
        descripcion: 'Cuidados intensivos por 24 horas',
        categoria: 'hospitalizacion'
      },
      {
        id: 'serv_006_003',
        nombre: 'Cirugía de Emergencia',
        precio: 4500,
        duracion: 150,
        descripcion: 'Procedimientos quirúrgicos urgentes',
        categoria: 'cirugia'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '00:00', fin: '23:59' },
      martes: { activo: true, inicio: '00:00', fin: '23:59' },
      miercoles: { activo: true, inicio: '00:00', fin: '23:59' },
      jueves: { activo: true, inicio: '00:00', fin: '23:59' },
      viernes: { activo: true, inicio: '00:00', fin: '23:59' },
      sabado: { activo: true, inicio: '00:00', fin: '23:59' },
      domingo: { activo: true, inicio: '00:00', fin: '23:59' }
    },
    configuraciones: {
      aceptaUrgencias: true,
      serviciosDomicilio: true,
      radioCovertura: 25,
      tiempoEntreCitas: 0
    }
  },
  {
    id: 'vet_007',
    nombre: 'Dra. Isabel Ramírez',
    especialidad: 'Odontología Veterinaria',
    ubicacion: {
      lat: 19.4342,
      lng: -99.1962,
      direccion: 'Av. Observatorio 526',
      colonia: 'Tacubaya',
      delegacion: 'Miguel Hidalgo'
    },
    rating: 4.7,
    totalReviews: 92,
    experiencia: 9,
    verificado: true,
    avatar: null,
    clinica: {
      nombre: 'Clínica Dental Veterinaria',
      telefono: '55-5555-7890',
      descripcion: 'Especialistas en odontología y cirugía oral veterinaria. Tratamientos dentales especializados.',
      fotos: [
        'https://via.placeholder.com/400x300/795548/white?text=Clínica+Dental',
        'https://via.placeholder.com/400x300/607D8B/white?text=Quirófano+Dental',
        'https://via.placeholder.com/400x300/8BC34A/white?text=Rayos+X+Dental',
        'https://via.placeholder.com/400x300/FFC107/white?text=Instrumental'
      ]
    },
    servicios: [
      {
        id: 'serv_007_001',
        nombre: 'Consulta Dental',
        precio: 650,
        duracion: 40,
        descripcion: 'Evaluación completa de salud dental',
        categoria: 'consulta'
      },
      {
        id: 'serv_007_002',
        nombre: 'Limpieza Dental',
        precio: 1500,
        duracion: 90,
        descripcion: 'Profilaxis dental con anestesia',
        categoria: 'preventivo'
      },
      {
        id: 'serv_007_003',
        nombre: 'Extracción Dental',
        precio: 2200,
        duracion: 120,
        descripcion: 'Extracción de piezas dentales',
        categoria: 'cirugia'
      }
    ],
    horarios: {
      lunes: { activo: true, inicio: '11:00', fin: '19:00' },
      martes: { activo: true, inicio: '11:00', fin: '19:00' },
      miercoles: { activo: true, inicio: '11:00', fin: '19:00' },
      jueves: { activo: false },
      viernes: { activo: true, inicio: '11:00', fin: '19:00' },
      sabado: { activo: true, inicio: '10:00', fin: '14:00' },
      domingo: { activo: false }
    },
    configuraciones: {
      aceptaUrgencias: false,
      serviciosDomicilio: false,
      radioCovertura: 6,
      tiempoEntreCitas: 30
    }
  }
];

export const mockResenas: MockResena[] = [
  {
    id: 'res_001',
    veterinarioId: 'vet_001',
    clienteNombre: 'María González',
    mascotaNombre: 'Luna',
    rating: 5,
    comentario: 'Excelente atención de la Dra. Ana. Luna se sintió muy cómoda durante toda la consulta. Las instalaciones están muy limpias y el personal es muy profesional.',
    fecha: '2024-01-15',
    servicio: 'Consulta General'
  },
  {
    id: 'res_002',
    veterinarioId: 'vet_001',
    clienteNombre: 'Carlos Mendoza',
    mascotaNombre: 'Max',
    rating: 5,
    comentario: 'La Dra. Ruiz diagnosticó correctamente el problema de Max. Su experiencia se nota mucho. Totalmente recomendado.',
    fecha: '2024-01-10',
    servicio: 'Análisis Clínicos'
  },
  {
    id: 'res_003',
    veterinarioId: 'vet_002',
    clienteNombre: 'Ana Martínez',
    mascotaNombre: 'Mimi',
    rating: 5,
    comentario: 'Dr. Mendoza operó a mi gata y todo salió perfecto. El quirófano es de primera y el seguimiento post-operatorio fue excelente.',
    fecha: '2024-01-08',
    servicio: 'Cirugía Menor'
  },
  {
    id: 'res_004',
    veterinarioId: 'vet_003',
    clienteNombre: 'Jorge Ramírez',
    mascotaNombre: 'Rocky',
    rating: 4,
    comentario: 'La Dra. Sánchez solucionó el problema de dermatitis de Rocky. Es muy especializada en su área.',
    fecha: '2024-01-05',
    servicio: 'Consulta Dermatológica'
  },
  {
    id: 'res_005',
    veterinarioId: 'vet_004',
    clienteNombre: 'Laura Herrera',
    mascotaNombre: 'Coco',
    rating: 5,
    comentario: 'Dr. García vino a casa para vacunar a Coco. Muy puntual y profesional. Excelente servicio a domicilio.',
    fecha: '2024-01-02',
    servicio: 'Consulta a Domicilio'
  },
  {
    id: 'res_006',
    veterinarioId: 'vet_005',
    clienteNombre: 'Pedro López',
    mascotaNombre: 'Bruno',
    rating: 5,
    comentario: 'La Dra. Morales detectó un problema cardiaco que otros no habían visto. Su especialización es evidente.',
    fecha: '2023-12-28',
    servicio: 'Ecocardiograma'
  },
  {
    id: 'res_007',
    veterinarioId: 'vet_006',
    clienteNombre: 'Sofía Vargas',
    mascotaNombre: 'Pelusa',
    rating: 5,
    comentario: 'Llegué de madrugada con Pelusa enferma y el Dr. Hernández la atendió inmediatamente. Salvó la vida de mi mascota.',
    fecha: '2023-12-25',
    servicio: 'Consulta de Urgencia'
  },
  {
    id: 'res_008',
    veterinarioId: 'vet_007',
    clienteNombre: 'Ricardo Silva',
    mascotaNombre: 'Toby',
    rating: 4,
    comentario: 'La Dra. Ramírez hizo una limpieza dental muy profesional. Toby quedó con los dientes perfectos.',
    fecha: '2023-12-20',
    servicio: 'Limpieza Dental'
  }
];

// Función para calcular distancia entre dos puntos (aproximada)
export const calcularDistancia = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Función para obtener próxima disponibilidad (mock)
export const getProximaDisponibilidad = (veterinarioId: string): string => {
  const hoy = new Date();
  const opciones = [
    'Disponible hoy',
    'Disponible mañana',
    'Próx. cita: ' + new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    'Próx. cita: ' + new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    'Próx. cita: ' + new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  ];
  
  const index = parseInt(veterinarioId.slice(-1)) % opciones.length;
  return opciones[index];
};