import { supabase } from './supabase';
import type { Veterinario } from '../types';

export const veterinarioService = {
  async getVeterinarios(): Promise<{ data: Veterinario[] | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('veterinarios')
        .select('*')
        .eq('verificado', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo veterinarios:', error);
      return { data: null, error };
    }
  },

  async getVeterinariosPorUbicacion(lat: number, lng: number, radio: number = 10): Promise<{ data: Veterinario[] | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('veterinarios')
        .select('*')
        .eq('verificado', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      
      if (error) throw error;

      // Filtrar por distancia usando la fórmula haversine
      const veterinariosCercanos = data?.filter(vet => {
        if (!vet.lat || !vet.lng) return false;
        
        const distancia = calcularDistancia(lat, lng, vet.lat, vet.lng);
        return distancia <= radio;
      });

      return { data: veterinariosCercanos || [], error: null };
    } catch (error) {
      console.error('Error obteniendo veterinarios por ubicación:', error);
      return { data: null, error };
    }
  },

  async getVeterinario(id: string): Promise<{ data: Veterinario | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('veterinarios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo veterinario:', error);
      return { data: null, error };
    }
  },

  async createVeterinario(veterinario: Omit<Veterinario, 'id' | 'created_at'>): Promise<{ data: Veterinario | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('veterinarios')
        .insert({ ...veterinario, created_at: new Date().toISOString() })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando veterinario:', error);
      return { data: null, error };
    }
  },

  async updateVeterinario(id: string, updates: Partial<Veterinario>): Promise<{ data: Veterinario | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('veterinarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando veterinario:', error);
      return { data: null, error };
    }
  },
};

// Función helper para calcular distancia entre dos puntos
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}