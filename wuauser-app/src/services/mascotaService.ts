import { supabase } from './supabase';
import type { Mascota } from '../types';

export const mascotaService = {
  async getMascotas(duenoId: string): Promise<{ data: Mascota[] | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('mascotas')
        .select('*')
        .eq('dueno_id', duenoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo mascotas:', error);
      return { data: null, error };
    }
  },

  async getMascota(id: string): Promise<{ data: Mascota | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('mascotas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo mascota:', error);
      return { data: null, error };
    }
  },

  async getMascotaPorQR(qrCode: string): Promise<{ data: Mascota | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('mascotas')
        .select('*')
        .eq('qr_code', qrCode)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo mascota por QR:', error);
      return { data: null, error };
    }
  },

  async createMascota(mascota: Omit<Mascota, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Mascota | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('mascotas')
        .insert({ 
          ...mascota, 
          created_at: now, 
          updated_at: now 
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando mascota:', error);
      return { data: null, error };
    }
  },

  async updateMascota(id: string, updates: Partial<Mascota>): Promise<{ data: Mascota | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('mascotas')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando mascota:', error);
      return { data: null, error };
    }
  },

  async deleteMascota(id: string): Promise<{ error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { error } = await supabase
        .from('mascotas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error eliminando mascota:', error);
      return { error };
    }
  },

  async agregarVacuna(mascotaId: string, vacuna: any): Promise<{ data: Mascota | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      // Primero obtenemos las vacunas actuales
      const { data: mascota, error: getMascotaError } = await supabase
        .from('mascotas')
        .select('vacunas')
        .eq('id', mascotaId)
        .single();

      if (getMascotaError) throw getMascotaError;

      const vacunasActuales = mascota?.vacunas || [];
      const nuevasVacunas = [...vacunasActuales, vacuna];

      const { data, error } = await supabase
        .from('mascotas')
        .update({ 
          vacunas: nuevasVacunas,
          updated_at: new Date().toISOString()
        })
        .eq('id', mascotaId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error agregando vacuna:', error);
      return { data: null, error };
    }
  },
};