import { supabase } from './supabase';
import type { Database } from '../types/database';

type Pet = Database['public']['Tables']['pets']['Row'];
type PetInsert = Database['public']['Tables']['pets']['Insert'];
type MedicalRecord = Database['public']['Tables']['pet_medical_records']['Row'];
type MedicalRecordInsert = Database['public']['Tables']['pet_medical_records']['Insert'];
type Appointment = Database['public']['Tables']['appointments']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// Interface para compatibilidad con el frontend actual
export interface Paciente {
  id: string;
  nombre: string;
  especie: 'Perro' | 'Gato';
  raza: string;
  edad: string;
  dueno: {
    nombre: string;
    telefono: string;
    email: string;
  };
  ultimaVisita?: string;
  proximaCita?: string;
  estado: 'activo' | 'inactivo';
  vacunasAlDia: boolean;
  alergias: string[];
  condicionesMedicas: string[];
  foto: string | null;
  historialResumen: {
    totalVisitas: number;
    ultimoDiagnostico: string;
    peso: string;
  };
  historial?: Consulta[];
}

export interface Consulta {
  id: string;
  fecha: string;
  tipo: 'Consulta General' | 'Emergencia' | 'Vacunación' | 'Cirugía' | 'Control' | 'Especialista';
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: string[];
  vacunas: string[];
  peso: string;
  temperatura: string;
  observaciones: string;
  veterinario: string;
  costo: string;
  proximaVisita?: string;
}

// Helper function para transformar datos de Supabase al formato del frontend
const transformPetToPaciente = (
  pet: Pet & { owner?: Profile; medical_records?: MedicalRecord[] },
  appointments: Appointment[] = []
): Paciente => {
  // Calcular edad a partir del dato numérico
  const edadTexto = pet.age ? `${pet.age} año${pet.age !== 1 ? 's' : ''}` : 'Edad no especificada';
  
  // Encontrar la cita más reciente y la próxima
  const citasOrdenadas = appointments.sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
  const hoy = new Date();
  const citasPasadas = citasOrdenadas.filter(c => new Date(c.scheduled_at) < hoy);
  const citasFuturas = citasOrdenadas.filter(c => new Date(c.scheduled_at) >= hoy);
  
  const ultimaVisita = citasPasadas[citasPasadas.length - 1];
  const proximaCita = citasFuturas[0];

  // Verificar si las vacunas están al día (simplificado)
  const vacunas = pet.medical_conditions || [];
  const vacunasAlDia = !vacunas.some(condition => 
    condition.toLowerCase().includes('vacuna') && condition.toLowerCase().includes('pendiente')
  );

  return {
    id: pet.id,
    nombre: pet.name,
    especie: pet.species === 'dog' ? 'Perro' : pet.species === 'cat' ? 'Gato' : pet.species as 'Perro' | 'Gato',
    raza: pet.breed || 'Raza no especificada',
    edad: edadTexto,
    dueno: {
      nombre: pet.owner ? `${pet.owner.first_name} ${pet.owner.last_name}` : 'Dueño no especificado',
      telefono: pet.owner?.phone || 'Sin teléfono',
      email: pet.owner?.email || 'Sin email',
    },
    ultimaVisita: ultimaVisita ? ultimaVisita.scheduled_at.split('T')[0] : undefined,
    proximaCita: proximaCita ? proximaCita.scheduled_at.split('T')[0] : undefined,
    estado: pet.owner?.is_active ? 'activo' : 'inactivo',
    vacunasAlDia,
    alergias: pet.allergies || [],
    condicionesMedicas: pet.medical_conditions || [],
    foto: pet.profile_image_url || null,
    historialResumen: {
      totalVisitas: citasPasadas.length,
      ultimoDiagnostico: pet.medical_records?.[0]?.title || 'Sin diagnósticos previos',
      peso: pet.weight ? `${pet.weight} kg` : 'Peso no registrado',
    },
  };
};

// Helper para transformar medical records a consultas
const transformMedicalRecordToConsulta = (
  record: any,
  vetName: string = 'Dr. Guidopablo81'
): Consulta => {
  // Mapear tipos de registro a tipos de consulta
  const tipoMap: Record<string, Consulta['tipo']> = {
    'vaccination': 'Vacunación',
    'treatment': 'Consulta General',
    'diagnosis': 'Consulta General',
    'medication': 'Control',
    'surgery': 'Cirugía',
  };

  return {
    id: record.id,
    fecha: record.created_at.split('T')[0],
    tipo: tipoMap[record.record_type] || 'Consulta General',
    motivo: record.title,
    diagnostico: record.description,
    tratamiento: record.description,
    medicamentos: record.medications || [],
    vacunas: record.record_type === 'vaccination' ? [record.title] : [],
    peso: '', // No disponible en el record
    temperatura: '', // No disponible en el record
    observaciones: record.description,
    veterinario: vetName,
    costo: '$500', // Valor por defecto
    proximaVisita: record.next_appointment_date,
  };
};

export const veterinariaService = {
  // Obtener todos los pacientes de un veterinario
  async getPacientesByVeterinario(vetId: string): Promise<{ data: Paciente[] | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPacientesByVeterinario');
        return { data: [], error: null };
      }

      // Obtener todas las mascotas que han tenido citas con este veterinario
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          pets!inner (
            *,
            profiles!pets_owner_id_fkey (*)
          )
        `)
        .eq('vet_id', vetId);

      if (appointmentsError) {
        console.error('Error obteniendo citas:', appointmentsError);
        return { data: null, error: appointmentsError };
      }

      // Obtener registros médicos para cada mascota
      const petIds = [...new Set(appointments?.map(apt => apt.pet_id) || [])];
      
      let medicalRecords: MedicalRecord[] = [];
      if (petIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('pet_medical_records')
          .select('*')
          .in('pet_id', petIds)
          .eq('vet_id', vetId)
          .order('created_at', { ascending: false });

        if (recordsError) {
          console.error('Error obteniendo registros médicos:', recordsError);
        } else {
          medicalRecords = records || [];
        }
      }

      // Transformar datos
      const petsMap = new Map<string, any>();
      appointments?.forEach(apt => {
        if (!petsMap.has(apt.pet_id)) {
          petsMap.set(apt.pet_id, {
            pet: apt.pets,
            appointments: [apt],
            medicalRecords: medicalRecords.filter(r => r.pet_id === apt.pet_id)
          });
        } else {
          petsMap.get(apt.pet_id).appointments.push(apt);
        }
      });

      const pacientes = Array.from(petsMap.values()).map(({ pet, appointments, medicalRecords }) => {
        const paciente = transformPetToPaciente(pet, appointments);
        paciente.historial = medicalRecords.map((record: any) => 
          transformMedicalRecordToConsulta(record)
        );
        return paciente;
      });

      return { data: pacientes, error: null };

    } catch (error) {
      console.error('Error en getPacientesByVeterinario:', error);
      return { data: null, error };
    }
  },

  // Obtener paciente específico con historial completo
  async getPacienteById(petId: string, vetId: string): Promise<{ data: Paciente | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPacienteById');
        return { data: null, error: null };
      }

      // Obtener datos de la mascota con dueño
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select(`
          *,
          profiles!pets_owner_id_fkey (*)
        `)
        .eq('id', petId)
        .single();

      if (petError) {
        console.error('Error obteniendo mascota:', petError);
        return { data: null, error: petError };
      }

      // Obtener citas
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('pet_id', petId)
        .eq('vet_id', vetId);

      if (appointmentsError) {
        console.error('Error obteniendo citas:', appointmentsError);
      }

      // Obtener historial médico
      const { data: medicalRecords, error: recordsError } = await supabase
        .from('pet_medical_records')
        .select('*')
        .eq('pet_id', petId)
        .eq('vet_id', vetId)
        .order('created_at', { ascending: false });

      if (recordsError) {
        console.error('Error obteniendo registros médicos:', recordsError);
      }

      // Transformar datos
      const paciente = transformPetToPaciente(pet, appointments || []);
      paciente.historial = (medicalRecords || []).map(record => 
        transformMedicalRecordToConsulta(record)
      );

      return { data: paciente, error: null };

    } catch (error) {
      console.error('Error en getPacienteById:', error);
      return { data: null, error };
    }
  },

  // Crear nueva consulta médica
  async crearNuevaConsulta(
    petId: string, 
    vetId: string, 
    consultaData: {
      fecha: string;
      tipo: Consulta['tipo'];
      motivo: string;
      diagnostico: string;
      tratamiento: string;
      medicamentos: string;
      vacunas: string;
      peso: string;
      temperatura: string;
      observaciones: string;
      costo: string;
      proximaVisita: string;
    }
  ): Promise<{ data: Consulta | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock crearNuevaConsulta');
        return { 
          data: {
            id: `mock-${Date.now()}`,
            ...consultaData,
            medicamentos: consultaData.medicamentos.split(',').map(m => m.trim()),
            vacunas: consultaData.vacunas.split(',').map(v => v.trim()),
            veterinario: 'Dr. Guidopablo81'
          }, 
          error: null 
        };
      }

      // Mapear tipo de consulta a record_type
      const recordTypeMap: Record<Consulta['tipo'], MedicalRecord['record_type']> = {
        'Consulta General': 'treatment',
        'Emergencia': 'treatment',
        'Vacunación': 'vaccination',
        'Cirugía': 'surgery',
        'Control': 'treatment',
        'Especialista': 'diagnosis',
      };

      const medicalRecordData: MedicalRecordInsert = {
        pet_id: petId,
        vet_id: vetId,
        record_type: recordTypeMap[consultaData.tipo],
        title: consultaData.motivo,
        description: `${consultaData.diagnostico}\n\nTratamiento: ${consultaData.tratamiento}${consultaData.observaciones ? '\n\nObservaciones: ' + consultaData.observaciones : ''}`,
        medications: consultaData.medicamentos ? consultaData.medicamentos.split(',').map(m => m.trim()) : [],
        next_appointment_date: consultaData.proximaVisita || undefined,
      };

      const { data: record, error: recordError } = await supabase
        .from('pet_medical_records')
        .insert(medicalRecordData)
        .select()
        .single();

      if (recordError) {
        console.error('Error creando registro médico:', recordError);
        return { data: null, error: recordError };
      }

      // Transformar a formato Consulta
      const nuevaConsulta = transformMedicalRecordToConsulta(record);
      
      // Aplicar datos específicos del formulario que no están en el record
      nuevaConsulta.peso = consultaData.peso;
      nuevaConsulta.temperatura = consultaData.temperatura;
      nuevaConsulta.costo = consultaData.costo;
      nuevaConsulta.vacunas = consultaData.vacunas ? consultaData.vacunas.split(',').map(v => v.trim()) : [];

      return { data: nuevaConsulta, error: null };

    } catch (error) {
      console.error('Error en crearNuevaConsulta:', error);
      return { data: null, error };
    }
  },

  // Crear datos de prueba
  async crearDatosDePrueba(): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock crearDatosDePrueba - datos ya disponibles en mock');
        return { success: true, error: null };
      }

      console.log('🔄 Creando datos de prueba...');

      // 1. Crear veterinario
      const { data: vetUser, error: vetError } = await supabase.auth.signUp({
        email: 'guidopablo81@wuauser.com',
        password: 'test123456',
        options: {
          data: {
            user_type: 'vet',
            first_name: 'Guido Pablo',
            last_name: 'Rodriguez'
          }
        }
      });

      if (vetError && !vetError.message.includes('already registered')) {
        console.error('Error creando veterinario:', vetError);
        return { success: false, error: vetError };
      }

      const vetId = vetUser?.user?.id || 'mock-vet-id';

      // 2. Crear dueños
      const owners = [
        { email: 'carlos.rm@wuauser.com', first_name: 'Carlos', last_name: 'Rodriguez Martinez', phone: '55-1111-2222' },
        { email: 'maria.gl@wuauser.com', first_name: 'Maria', last_name: 'Garcia Lopez', phone: '55-3333-4444' },
        { email: 'juan.ph@wuauser.com', first_name: 'Juan', last_name: 'Perez Hernandez', phone: '55-5555-6666' },
        { email: 'ana.lm@wuauser.com', first_name: 'Ana', last_name: 'Lopez Morales', phone: '55-7777-8888' },
        { email: 'miguel.vc@wuauser.com', first_name: 'Miguel', last_name: 'Vargas Castro', phone: '55-9999-0000' }
      ];

      const ownerIds: string[] = [];

      for (const owner of owners) {
        const { data: ownerUser, error: ownerError } = await supabase.auth.signUp({
          email: owner.email,
          password: 'test123456',
          options: {
            data: {
              user_type: 'owner',
              first_name: owner.first_name,
              last_name: owner.last_name,
              phone: owner.phone
            }
          }
        });

        if (ownerError && !ownerError.message.includes('already registered')) {
          console.error(`Error creando dueño ${owner.email}:`, ownerError);
        } else {
          ownerIds.push(ownerUser?.user?.id || `mock-owner-${owners.indexOf(owner)}`);
        }
      }

      // 3. Crear mascotas
      const pets = [
        { name: 'Max', species: 'dog', breed: 'Golden Retriever', age: 3, weight: 28, gender: 'male' as const, owner_id: ownerIds[0] || 'mock-owner-0' },
        { name: 'Luna', species: 'cat', breed: 'Siamés', age: 2, weight: 3.2, gender: 'female' as const, owner_id: ownerIds[1] || 'mock-owner-1' },
        { name: 'Rocky', species: 'dog', breed: 'Pastor Alemán', age: 5, weight: 30, gender: 'male' as const, owner_id: ownerIds[2] || 'mock-owner-2' },
        { name: 'Bella', species: 'dog', breed: 'Labrador', age: 1, weight: 20, gender: 'female' as const, owner_id: ownerIds[3] || 'mock-owner-3' },
        { name: 'Cleo', species: 'cat', breed: 'Persa', age: 4, weight: 4, gender: 'female' as const, owner_id: ownerIds[4] || 'mock-owner-4' }
      ];

      const petIds: string[] = [];

      for (const pet of pets) {
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .insert({
            ...pet,
            is_sterilized: Math.random() > 0.5,
            allergies: pet.name === 'Max' ? ['Pollo'] : pet.name === 'Luna' ? [] : ['Polen'],
            medical_conditions: pet.name === 'Luna' ? ['Asma felino'] : []
          })
          .select()
          .single();

        if (petError) {
          console.error(`Error creando mascota ${pet.name}:`, petError);
        } else {
          petIds.push(petData.id);
        }
      }

      // 4. Crear citas
      const today = new Date();
      for (let i = 0; i < petIds.length; i++) {
        const petId = petIds[i];
        
        // Cita pasada
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));
        
        await supabase.from('appointments').insert({
          owner_id: ownerIds[i] || `mock-owner-${i}`,
          vet_id: vetId,
          pet_id: petId,
          appointment_type: 'consultation',
          status: 'completed',
          scheduled_at: pastDate.toISOString(),
          duration_minutes: 60,
          notes: `Consulta rutinaria para ${pets[i].name}`
        });

        // Cita futura (algunas mascotas)
        if (Math.random() > 0.5) {
          const futureDate = new Date(today);
          futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
          
          await supabase.from('appointments').insert({
            owner_id: ownerIds[i] || `mock-owner-${i}`,
            vet_id: vetId,
            pet_id: petId,
            appointment_type: 'checkup',
            status: 'pending',
            scheduled_at: futureDate.toISOString(),
            duration_minutes: 30,
            notes: `Control programado para ${pets[i].name}`
          });
        }
      }

      // 5. Crear registros médicos
      for (let i = 0; i < petIds.length; i++) {
        const petId = petIds[i];
        
        // Registro de vacunación
        await supabase.from('pet_medical_records').insert({
          pet_id: petId,
          vet_id: vetId,
          record_type: 'vaccination',
          title: 'Vacunación anual completa',
          description: 'Aplicación de vacunas: Polivalente, Rabia, Tos de las perreras',
          medications: []
        });

        // Registro de tratamiento
        await supabase.from('pet_medical_records').insert({
          pet_id: petId,
          vet_id: vetId,
          record_type: 'treatment',
          title: 'Consulta de rutina',
          description: `Revisión general de ${pets[i].name}. Estado de salud excelente. Se recomienda continuar con alimentación actual.`,
          medications: pets[i].name === 'Luna' ? ['Inhalador broncodilatador'] : []
        });
      }

      console.log('✅ Datos de prueba creados exitosamente');
      return { success: true, error: null };

    } catch (error) {
      console.error('Error creando datos de prueba:', error);
      return { success: false, error };
    }
  },

  // ============================================
  // FUNCIONES DE MENSAJERÍA
  // ============================================

  // Obtener conversaciones del veterinario
  async getConversaciones(vetId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getConversaciones');
        // Devolver datos mock de conversaciones
        const mockConversaciones = [
          {
            id: '1',
            duenoId: '1',
            duenoNombre: 'María Elena Vásquez',
            mascotaNombre: 'Luna',
            mascotaId: '1',
            ultimoMensaje: {
              texto: 'Vigila si tiene vómitos, diarrea, dificultad para respirar.',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              remitente: 'veterinario',
              leido: false
            },
            mensajesNoLeidos: 2,
            esEmergencia: false
          },
          {
            id: '2',
            duenoId: '2',
            duenoNombre: 'Carlos Mendoza',
            mascotaNombre: 'Max',
            mascotaId: '2',
            ultimoMensaje: {
              texto: '¿Max puede comer normalmente después de la cirugía?',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              remitente: 'dueno',
              leido: false
            },
            mensajesNoLeidos: 1,
            esEmergencia: false
          }
        ];
        return { data: mockConversaciones, error: null };
      }

      // Implementación real con Supabase
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*)
        `)
        .or(`sender_id.eq.${vetId},recipient_id.eq.${vetId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo conversaciones:', error);
        return { data: null, error };
      }

      // Procesar mensajes para crear conversaciones
      // Esta lógica necesitaría ser más compleja para agrupar correctamente
      return { data: messages, error: null };
    } catch (error) {
      console.error('Error en getConversaciones:', error);
      return { data: null, error };
    }
  },

  // Obtener mensajes de una conversación específica
  async getMensajes(conversacionId: string): Promise<{ data: any[] | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getMensajes para conversación:', conversacionId);
        // Devolver mensajes mock basados en la conversación
        const mockMensajes = [
          {
            id: '1',
            texto: 'Hola Doctor, Luna ha estado muy decaída desde ayer.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            remitente: 'owner',
            leido: true,
            tipo: 'texto'
          },
          {
            id: '2',
            texto: 'Hola María, gracias por contactarme. ¿Luna ha estado comiendo normalmente?',
            timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(),
            remitente: 'vet',
            leido: true,
            tipo: 'texto'
          }
        ];
        return { data: mockMensajes, error: null };
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('appointment_id', conversacionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error obteniendo mensajes:', error);
        return { data: null, error };
      }

      return { data: messages, error: null };
    } catch (error) {
      console.error('Error en getMensajes:', error);
      return { data: null, error };
    }
  },

  // Enviar mensaje
  async enviarMensaje(
    senderId: string,
    recipientId: string,
    texto: string,
    appointmentId?: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock enviarMensaje');
        const mockMensaje = {
          id: Date.now().toString(),
          texto,
          timestamp: new Date().toISOString(),
          remitente: 'vet',
          leido: false,
          tipo: 'texto'
        };
        return { data: mockMensaje, error: null };
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content: texto,
          message_type: 'text',
          appointment_id: appointmentId,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error enviando mensaje:', error);
        return { data: null, error };
      }

      return { data: message, error: null };
    } catch (error) {
      console.error('Error en enviarMensaje:', error);
      return { data: null, error };
    }
  },

  // Marcar mensajes como leídos
  async marcarComoLeido(conversacionId: string, userId: string): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock marcarComoLeido');
        return { success: true, error: null };
      }

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('appointment_id', conversacionId)
        .neq('sender_id', userId);

      if (error) {
        console.error('Error marcando mensajes como leídos:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error en marcarComoLeido:', error);
      return { success: false, error };
    }
  },

  // Crear nueva conversación
  async crearConversacion(
    vetId: string,
    ownerId: string,
    petId: string,
    appointmentId?: string
  ): Promise<{ data: any | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock crearConversacion');
        const mockConversacion = {
          id: Date.now().toString(),
          vetId,
          ownerId,
          petId,
          appointmentId,
          createdAt: new Date().toISOString()
        };
        return { data: mockConversacion, error: null };
      }

      // En el esquema actual, las conversaciones se crean implícitamente
      // cuando se envía el primer mensaje con un appointment_id
      const conversacion = {
        id: appointmentId || `chat_${vetId}_${ownerId}_${petId}`,
        vetId,
        ownerId,
        petId,
        appointmentId,
        createdAt: new Date().toISOString()
      };

      return { data: conversacion, error: null };
    } catch (error) {
      console.error('Error en crearConversacion:', error);
      return { data: null, error };
    }
  },

  // ============================================
  // FUNCIONES DE PERFIL VETERINARIO
  // ============================================

  // Obtener perfil completo del veterinario
  async getPerfilVeterinario(veterinarioId: string): Promise<{ data: any | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPerfilVeterinario');
        const mockPerfil = {
          id: '1',
          nombre: 'Dr. Guido Pablo Rodríguez',
          email: 'guidopablo81@wuauser.com',
          telefono: '55-1234-5678',
          especialidad: 'Medicina General Veterinaria',
          cedula: 'MVZ-12345678',
          experiencia: '8 años',
          rating: 4.8,
          totalReviews: 127,
          avatar: null,
          clinica: {
            nombre: 'Clínica Veterinaria San Ángel',
            direccion: 'Av. Revolución 1425, San Ángel, CDMX',
            telefono: '55-5555-1234',
            horarios: {
              lunes_viernes: '08:00 - 18:00',
              sabado: '09:00 - 15:00',
              domingo: 'Cerrado'
            },
            servicios: [
              'Consulta General',
              'Vacunación', 
              'Cirugía Menor',
              'Emergencias',
              'Análisis Clínicos'
            ]
          },
          estadisticas: {
            pacientesActivos: 127,
            citasEsteMes: 45,
            ingresosMes: 28500,
            añosEnWuauser: 2
          }
        };
        return { data: mockPerfil, error: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          veterinarian_profiles (*)
        `)
        .eq('id', veterinarioId)
        .eq('user_type', 'vet')
        .single();

      if (profileError) {
        console.error('Error obteniendo perfil veterinario:', profileError);
        return { data: null, error: profileError };
      }

      return { data: profile, error: null };
    } catch (error) {
      console.error('Error en getPerfilVeterinario:', error);
      return { data: null, error };
    }
  },

  // Actualizar perfil del veterinario
  async updatePerfilVeterinario(veterinarioId: string, perfilData: any): Promise<{ data: any | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock updatePerfilVeterinario');
        return { data: { ...perfilData, id: veterinarioId }, error: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: perfilData.nombre?.split(' ')[0],
          last_name: perfilData.nombre?.split(' ').slice(1).join(' '),
          phone: perfilData.telefono,
          avatar_url: perfilData.avatar,
        })
        .eq('id', veterinarioId)
        .select()
        .single();

      if (profileError) {
        console.error('Error actualizando perfil:', profileError);
        return { data: null, error: profileError };
      }

      // Actualizar datos específicos del veterinario
      if (perfilData.especialidad || perfilData.cedula || perfilData.experiencia) {
        const { error: vetError } = await supabase
          .from('veterinarian_profiles')
          .update({
            specialties: perfilData.especialidad ? [perfilData.especialidad] : undefined,
            license_number: perfilData.cedula,
            years_experience: perfilData.experiencia ? parseInt(perfilData.experiencia.replace(/\D/g, '')) : undefined,
            clinic_name: perfilData.clinica?.nombre,
            clinic_address: perfilData.clinica?.direccion,
            bio: perfilData.bio,
          })
          .eq('user_id', veterinarioId);

        if (vetError) {
          console.error('Error actualizando perfil veterinario:', vetError);
        }
      }

      return { data: profile, error: null };
    } catch (error) {
      console.error('Error en updatePerfilVeterinario:', error);
      return { data: null, error };
    }
  },

  // Obtener estadísticas del veterinario
  async getEstadisticas(veterinarioId: string, periodo: 'semana' | 'mes' | 'año' = 'mes'): Promise<{ data: any | null; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getEstadisticas');
        const mockEstadisticas = {
          ingresos: {
            total: 28500,
            cambio: 12.5,
            tendencia: 'up' as const
          },
          pacientesNuevos: {
            total: 23,
            cambio: 8.3,
            tendencia: 'up' as const
          },
          citasCompletadas: {
            total: 45,
            cambio: -2.1,
            tendencia: 'down' as const
          },
          calificacionPromedio: {
            total: 4.8,
            cambio: 0.2,
            tendencia: 'up' as const
          },
          tratamientosTop: [
            { nombre: 'Consulta General', cantidad: 18, porcentaje: 40 },
            { nombre: 'Vacunación', cantidad: 12, porcentaje: 27 },
            { nombre: 'Desparasitación', cantidad: 8, porcentaje: 18 },
            { nombre: 'Análisis Clínicos', cantidad: 4, porcentaje: 9 },
            { nombre: 'Cirugía Menor', cantidad: 3, porcentaje: 6 }
          ],
          pacientesFrecuentes: [
            { nombre: 'María Elena Vásquez', mascota: 'Luna', visitas: 8, ultimaVisita: '2024-08-28' },
            { nombre: 'Carlos Mendoza', mascota: 'Max', visitas: 6, ultimaVisita: '2024-08-25' },
            { nombre: 'Ana Patricia López', mascota: 'Rocky', visitas: 5, ultimaVisita: '2024-08-30' },
            { nombre: 'Jorge Alberto Hernández', mascota: 'Mimi', visitas: 4, ultimaVisita: '2024-08-22' }
          ],
          graficoCitas: [
            { mes: 'Ene', citas: 32, ingresos: 24000 },
            { mes: 'Feb', citas: 28, ingresos: 21000 },
            { mes: 'Mar', citas: 35, ingresos: 26500 },
            { mes: 'Abr', citas: 42, ingresos: 31000 },
            { mes: 'May', citas: 38, ingresos: 28000 },
            { mes: 'Jun', citas: 45, ingresos: 33500 },
            { mes: 'Jul', citas: 41, ingresos: 30000 },
            { mes: 'Ago', citas: 45, ingresos: 28500 }
          ]
        };
        return { data: mockEstadisticas, error: null };
      }

      // Calcular fechas según período
      const ahora = new Date();
      let fechaInicio: Date;

      switch (periodo) {
        case 'semana':
          fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'año':
          fechaInicio = new Date(ahora.getFullYear(), 0, 1);
          break;
        case 'mes':
        default:
          fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      }

      // Obtener citas del período
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('vet_id', veterinarioId)
        .gte('scheduled_at', fechaInicio.toISOString())
        .lte('scheduled_at', ahora.toISOString());

      if (appointmentsError) {
        console.error('Error obteniendo estadísticas:', appointmentsError);
        return { data: null, error: appointmentsError };
      }

      // Procesar estadísticas
      const citasCompletadas = appointments?.filter(a => a.status === 'completed') || [];
      const ingresoTotal = citasCompletadas.reduce((sum, cita) => sum + (cita.total_fee || 0), 0);

      return { 
        data: {
          ingresos: { total: ingresoTotal, cambio: 0, tendencia: 'stable' },
          citasCompletadas: { total: citasCompletadas.length, cambio: 0, tendencia: 'stable' },
          // ... más cálculos estadísticos
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      return { data: null, error };
    }
  },

  // Actualizar configuraciones del veterinario
  async updateConfiguraciones(veterinarioId: string, configuraciones: any): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock updateConfiguraciones');
        return { success: true, error: null };
      }

      // En una implementación real, esto se guardaría en una tabla de configuraciones
      // Por ahora, simular éxito
      return { success: true, error: null };
    } catch (error) {
      console.error('Error en updateConfiguraciones:', error);
      return { success: false, error };
    }
  },

  // Cerrar sesión
  async logout(): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock logout');
        return { success: true, error: null };
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error en logout:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error };
    }
  },

  // Cambiar contraseña
  async cambiarPassword(passwordActual: string, passwordNuevo: string): Promise<{ success: boolean; error: any }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock cambiarPassword');
        return { success: true, error: null };
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordNuevo
      });

      if (error) {
        console.error('Error cambiando contraseña:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error en cambiarPassword:', error);
      return { success: false, error };
    }
  }
};

export default veterinariaService;