import { supabase } from './supabase';

export enum EstadoReserva {
  PENDIENTE_PAGO = 'pendiente_pago',
  PAGADA = 'pagada',
  CONFIRMADA = 'confirmada',
  EN_PROCESO = 'en_proceso',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
  NO_ASISTIO = 'no_asistio'
}

export interface DatosPago {
  metodoPago: 'tarjeta' | 'paypal' | 'transferencia';
  numeroTarjeta?: string;
  nombreTitular?: string;
  cvv?: string;
  fechaVencimiento?: string;
  montoTotal: number;
}

export interface Reserva {
  id: string;
  veterinarioId: string;
  duenoId: string;
  mascotaId: string;
  servicioId: string;
  fechaHora: string;
  estado: EstadoReserva;
  montoTotal: number;
  metodoPago?: string;
  notas?: string;
  motivoCancelacion?: string;
  createdAt: string;
  updatedAt: string;
  
  // Información relacionada (se obtiene con JOINs)
  veterinario?: {
    nombre: string;
    especialidad: string;
    clinica: {
      nombre: string;
      direccion: string;
      telefono: string;
    };
  };
  servicio?: {
    nombre: string;
    duracion: number;
  };
  mascota?: {
    nombre: string;
    especie: string;
    raza: string;
  };
}

export interface NotificacionReserva {
  id: string;
  usuarioId: string;
  tipo: 'nueva_cita' | 'confirmacion' | 'recordatorio' | 'cancelacion';
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

class BookingService {

  async crearReserva(
    veterinarioId: string,
    duenoId: string,
    mascotaId: string,
    servicioId: string,
    fechaHora: string,
    notas?: string
  ): Promise<{ data: Reserva | null; error: any }> {
    try {
      console.log('📅 Creando reserva:', {
        veterinarioId,
        duenoId,
        mascotaId,
        servicioId,
        fechaHora
      });

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const reservaMock: Reserva = {
          id: `reserva_${Date.now()}`,
          veterinarioId,
          duenoId,
          mascotaId,
          servicioId,
          fechaHora,
          estado: EstadoReserva.PENDIENTE_PAGO,
          montoTotal: 650, // Mock price
          notas,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('✅ Reserva creada (mock):', reservaMock.id);
        return { data: reservaMock, error: null };
      }

      // Implementación real con Supabase
      const { data, error } = await supabase
        .from('reservas')
        .insert({
          veterinario_id: veterinarioId,
          dueno_id: duenoId,
          mascota_id: mascotaId,
          servicio_id: servicioId,
          fecha_hora: fechaHora,
          estado: EstadoReserva.PENDIENTE_PAGO,
          notas,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          veterinario:veterinarios(
            nombre,
            especialidad,
            clinica:clinicas(nombre, direccion, telefono)
          ),
          servicio:veterinario_servicios(nombre, duracion, precio),
          mascota:mascotas(nombre, especie, raza)
        `)
        .single();

      if (error) throw error;

      return { data, error: null };

    } catch (error) {
      console.error('Error creando reserva:', error);
      return { data: null, error };
    }
  }

  async confirmarPago(
    reservaId: string,
    datosPago: DatosPago
  ): Promise<{ data: Reserva | null; error: any }> {
    try {
      console.log('💳 Procesando pago para reserva:', reservaId);

      if (!supabase) {
        // Mock implementation - simular procesamiento de pago
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular fallo de pago ocasional
        if (Math.random() < 0.1) { // 10% probabilidad de fallo
          return { 
            data: null, 
            error: 'Pago rechazado. Verifica los datos de tu tarjeta.' 
          };
        }

        const reservaActualizada: Reserva = {
          id: reservaId,
          veterinarioId: 'vet_001',
          duenoId: 'dueno_001',
          mascotaId: 'mascota_001',
          servicioId: 'servicio_001',
          fechaHora: new Date().toISOString(),
          estado: EstadoReserva.PAGADA,
          montoTotal: datosPago.montoTotal,
          metodoPago: datosPago.metodoPago,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Enviar notificaciones
        await this.enviarNotificacion(
          'vet_001',
          'nueva_cita',
          'Nueva cita reservada',
          'Un cliente ha reservado una cita y pagado. Revisa los detalles.'
        );

        console.log('✅ Pago confirmado:', reservaId);
        return { data: reservaActualizada, error: null };
      }

      // Implementación real con Supabase
      const { data, error } = await supabase
        .from('reservas')
        .update({
          estado: EstadoReserva.PAGADA,
          metodo_pago: datosPago.metodoPago,
          monto_total: datosPago.montoTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId)
        .select(`
          *,
          veterinario:veterinarios(
            nombre,
            especialidad,
            clinica:clinicas(nombre, direccion, telefono)
          ),
          servicio:veterinario_servicios(nombre, duracion),
          mascota:mascotas(nombre, especie, raza)
        `)
        .single();

      if (error) throw error;

      // Enviar notificaciones
      if (data) {
        await this.enviarNotificacion(
          data.veterinarioId,
          'nueva_cita',
          'Nueva cita reservada',
          `${data.mascota?.nombre} tiene una cita programada`
        );
      }

      return { data, error: null };

    } catch (error) {
      console.error('Error confirmando pago:', error);
      return { data: null, error };
    }
  }

  async getReservasDueno(duenoId: string): Promise<{ data: Reserva[] | null; error: any }> {
    try {
      console.log('📋 Obteniendo reservas del dueño:', duenoId);

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const reservasMock: Reserva[] = [
          {
            id: 'reserva_001',
            veterinarioId: 'vet_001',
            duenoId,
            mascotaId: 'mascota_001',
            servicioId: 'servicio_001',
            fechaHora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
            estado: EstadoReserva.CONFIRMADA,
            montoTotal: 650,
            metodoPago: 'tarjeta',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            veterinario: {
              nombre: 'Dr. Ana María Ruiz',
              especialidad: 'Medicina Interna',
              clinica: {
                nombre: 'Clínica Veterinaria Del Valle',
                direccion: 'Av. Insurgentes Sur 1425',
                telefono: '55-5555-1234'
              }
            },
            servicio: {
              nombre: 'Consulta General',
              duracion: 30
            },
            mascota: {
              nombre: 'Luna',
              especie: 'Perro',
              raza: 'Golden Retriever'
            }
          }
        ];

        return { data: reservasMock, error: null };
      }

      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          veterinario:veterinarios(
            nombre,
            especialidad,
            clinica:clinicas(nombre, direccion, telefono)
          ),
          servicio:veterinario_servicios(nombre, duracion),
          mascota:mascotas(nombre, especie, raza)
        `)
        .eq('dueno_id', duenoId)
        .order('fecha_hora', { ascending: true });

      if (error) throw error;

      return { data, error: null };

    } catch (error) {
      console.error('Error obteniendo reservas del dueño:', error);
      return { data: null, error };
    }
  }

  async getReservasVeterinario(veterinarioId: string): Promise<{ data: Reserva[] | null; error: any }> {
    try {
      console.log('🩺 Obteniendo reservas del veterinario:', veterinarioId);

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const reservasMock: Reserva[] = [
          {
            id: 'reserva_002',
            veterinarioId,
            duenoId: 'dueno_002',
            mascotaId: 'mascota_002',
            servicioId: 'servicio_002',
            fechaHora: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // En 2 horas
            estado: EstadoReserva.PAGADA,
            montoTotal: 450,
            metodoPago: 'tarjeta',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            servicio: {
              nombre: 'Vacunación',
              duracion: 15
            },
            mascota: {
              nombre: 'Max',
              especie: 'Gato',
              raza: 'Persa'
            }
          }
        ];

        return { data: reservasMock, error: null };
      }

      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          servicio:veterinario_servicios(nombre, duracion),
          mascota:mascotas(nombre, especie, raza),
          dueno:usuarios(nombre, telefono, email)
        `)
        .eq('veterinario_id', veterinarioId)
        .order('fecha_hora', { ascending: true });

      if (error) throw error;

      return { data, error: null };

    } catch (error) {
      console.error('Error obteniendo reservas del veterinario:', error);
      return { data: null, error };
    }
  }

  async actualizarEstadoReserva(
    reservaId: string,
    nuevoEstado: EstadoReserva,
    notas?: string
  ): Promise<{ data: Reserva | null; error: any }> {
    try {
      console.log('🔄 Actualizando estado de reserva:', { reservaId, nuevoEstado });

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const reservaActualizada: Reserva = {
          id: reservaId,
          veterinarioId: 'vet_001',
          duenoId: 'dueno_001',
          mascotaId: 'mascota_001',
          servicioId: 'servicio_001',
          fechaHora: new Date().toISOString(),
          estado: nuevoEstado,
          montoTotal: 650,
          notas,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Enviar notificación según el estado
        let tipoNotificacion: NotificacionReserva['tipo'] = 'confirmacion';
        let mensaje = '';

        switch (nuevoEstado) {
          case EstadoReserva.CONFIRMADA:
            tipoNotificacion = 'confirmacion';
            mensaje = 'Tu cita ha sido confirmada por el veterinario';
            break;
          case EstadoReserva.CANCELADA:
            tipoNotificacion = 'cancelacion';
            mensaje = 'Tu cita ha sido cancelada';
            break;
          case EstadoReserva.COMPLETADA:
            mensaje = 'Tu cita ha sido completada. ¡Déjanos una reseña!';
            break;
        }

        if (mensaje) {
          await this.enviarNotificacion(
            'dueno_001',
            tipoNotificacion,
            'Actualización de cita',
            mensaje
          );
        }

        return { data: reservaActualizada, error: null };
      }

      const { data, error } = await supabase
        .from('reservas')
        .update({
          estado: nuevoEstado,
          notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId)
        .select(`
          *,
          veterinario:veterinarios(nombre, especialidad),
          servicio:veterinario_servicios(nombre, duracion),
          mascota:mascotas(nombre, especie, raza)
        `)
        .single();

      if (error) throw error;

      return { data, error: null };

    } catch (error) {
      console.error('Error actualizando estado de reserva:', error);
      return { data: null, error };
    }
  }

  async cancelarReserva(
    reservaId: string,
    motivoCancelacion: string,
    canceladoPor: 'dueno' | 'veterinario'
  ): Promise<{ data: boolean; error: any }> {
    try {
      console.log('❌ Cancelando reserva:', { reservaId, motivoCancelacion, canceladoPor });

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 800));

        // Enviar notificación a la otra parte
        const destinatario = canceladoPor === 'dueno' ? 'vet_001' : 'dueno_001';
        await this.enviarNotificacion(
          destinatario,
          'cancelacion',
          'Cita cancelada',
          `Una cita ha sido cancelada. Motivo: ${motivoCancelacion}`
        );

        console.log('✅ Reserva cancelada');
        return { data: true, error: null };
      }

      const { error } = await supabase
        .from('reservas')
        .update({
          estado: EstadoReserva.CANCELADA,
          motivo_cancelacion: motivoCancelacion,
          cancelado_por: canceladoPor,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservaId);

      if (error) throw error;

      return { data: true, error: null };

    } catch (error) {
      console.error('Error cancelando reserva:', error);
      return { data: false, error };
    }
  }

  async enviarRecordatorio(reservaId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('🔔 Enviando recordatorio para reserva:', reservaId);

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await this.enviarNotificacion(
          'dueno_001',
          'recordatorio',
          'Recordatorio de cita',
          'Tienes una cita programada para mañana a las 10:00 AM'
        );

        return { data: true, error: null };
      }

      // En implementación real, aquí se enviarían push notifications
      // o se programarían recordatorios automáticos

      return { data: true, error: null };

    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      return { data: false, error };
    }
  }

  private async enviarNotificacion(
    usuarioId: string,
    tipo: NotificacionReserva['tipo'],
    titulo: string,
    mensaje: string
  ): Promise<void> {
    try {
      if (!supabase) {
        // Mock implementation - solo log
        console.log('📱 Notificación enviada:', {
          usuarioId,
          tipo,
          titulo,
          mensaje
        });
        return;
      }

      await supabase
        .from('notificaciones')
        .insert({
          usuario_id: usuarioId,
          tipo,
          titulo,
          mensaje,
          leida: false,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error enviando notificación:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  async getNotificaciones(usuarioId: string): Promise<{ data: NotificacionReserva[] | null; error: any }> {
    try {
      console.log('🔔 Obteniendo notificaciones para:', usuarioId);

      if (!supabase) {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const notificacionesMock: NotificacionReserva[] = [
          {
            id: 'notif_001',
            usuarioId,
            tipo: 'confirmacion',
            titulo: 'Cita confirmada',
            mensaje: 'Tu cita con Dr. Ana María Ruiz ha sido confirmada para mañana a las 10:00 AM',
            leida: false,
            createdAt: new Date().toISOString()
          }
        ];

        return { data: notificacionesMock, error: null };
      }

      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return { data, error: null };

    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return { data: null, error };
    }
  }

  async marcarNotificacionLeida(notificacionId: string): Promise<{ data: boolean; error: any }> {
    try {
      if (!supabase) {
        console.log('✅ Notificación marcada como leída:', notificacionId);
        return { data: true, error: null };
      }

      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', notificacionId);

      if (error) throw error;

      return { data: true, error: null };

    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return { data: false, error };
    }
  }
}

export const bookingService = new BookingService();