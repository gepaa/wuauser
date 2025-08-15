import { supabase } from './supabase';
import type { Cita } from '../types';

export const citaService = {
  async getCitasUsuario(userId: string): Promise<{ data: Cita[] | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          mascotas!inner(nombre, especie, foto_url),
          veterinarios(nombre_clinica, direccion_clinica)
        `)
        .eq('dueno_id', userId)
        .order('fecha_hora', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo citas de usuario:', error);
      return { data: null, error };
    }
  },

  async getCitasVeterinario(veterinarioId: string): Promise<{ data: Cita[] | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          mascotas!inner(nombre, especie, foto_url),
          profiles!inner(nombre_completo, telefono)
        `)
        .eq('veterinario_id', veterinarioId)
        .order('fecha_hora', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo citas de veterinario:', error);
      return { data: null, error };
    }
  },

  async getCita(id: string): Promise<{ data: Cita | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          mascotas!inner(nombre, especie, foto_url, raza, edad),
          veterinarios(nombre_clinica, direccion_clinica, telefono_clinica),
          profiles!inner(nombre_completo, telefono)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo cita:', error);
      return { data: null, error };
    }
  },

  async createCita(cita: Omit<Cita, 'id' | 'created_at'>): Promise<{ data: Cita | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('citas')
        .insert({ 
          ...cita, 
          created_at: new Date().toISOString() 
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando cita:', error);
      return { data: null, error };
    }
  },

  async updateCita(id: string, updates: Partial<Cita>): Promise<{ data: Cita | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('citas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando cita:', error);
      return { data: null, error };
    }
  },

  async cancelarCita(id: string, motivo?: string): Promise<{ data: Cita | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const updates: Partial<Cita> = {
        estado: 'cancelada',
      };

      if (motivo) {
        updates.notas = motivo;
      }

      const { data, error } = await supabase
        .from('citas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error cancelando cita:', error);
      return { data: null, error };
    }
  },

  async confirmarCita(id: string): Promise<{ data: Cita | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('citas')
        .update({ estado: 'confirmada' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error confirmando cita:', error);
      return { data: null, error };
    }
  },

  async completarCita(id: string, diagnostico?: string, tratamiento?: string, costo?: number): Promise<{ data: Cita | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const updates: Partial<Cita> = {
        estado: 'completada',
      };

      if (diagnostico) updates.diagnostico = diagnostico;
      if (tratamiento) updates.tratamiento = tratamiento;
      if (costo) updates.costo = costo;

      const { data, error } = await supabase
        .from('citas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error completando cita:', error);
      return { data: null, error };
    }
  },

  async getHorariosDisponibles(veterinarioId: string, fecha: string): Promise<{ data: string[] | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      // Obtener el horario del veterinario
      const { data: veterinario, error: vetError } = await supabase
        .from('veterinarios')
        .select('horario')
        .eq('id', veterinarioId)
        .single();

      if (vetError) throw vetError;

      // Obtener citas ya programadas para esa fecha
      const { data: citasExistentes, error: citasError } = await supabase
        .from('citas')
        .select('fecha_hora')
        .eq('veterinario_id', veterinarioId)
        .gte('fecha_hora', `${fecha}T00:00:00`)
        .lt('fecha_hora', `${fecha}T23:59:59`)
        .in('estado', ['pendiente', 'confirmada']);

      if (citasError) throw citasError;

      // Generar horarios disponibles basado en el horario del veterinario
      // y excluyendo las citas ya programadas
      const horariosOcupados = citasExistentes?.map(cita => 
        new Date(cita.fecha_hora).toTimeString().substring(0, 5)
      ) || [];

      // Horarios típicos de 9:00 a 18:00 cada hora (esto puede ser dinámico)
      const horariosBase = [
        '09:00', '10:00', '11:00', '12:00', 
        '14:00', '15:00', '16:00', '17:00', '18:00'
      ];

      const horariosDisponibles = horariosBase.filter(
        horario => !horariosOcupados.includes(horario)
      );

      return { data: horariosDisponibles, error: null };
    } catch (error) {
      console.error('Error obteniendo horarios disponibles:', error);
      return { data: null, error };
    }
  },
};