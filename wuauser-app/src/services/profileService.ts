import { supabase } from './supabase';
import type { Profile } from '../types';

export const profileService = {
  async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return { data: null, error };
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ data: Profile | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { data: null, error };
    }
  },

  async createProfile(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<{ data: Profile | null; error: any }> {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('usuarios')
        .insert({ ...profile, created_at: now, updated_at: now })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando perfil:', error);
      return { data: null, error };
    }
  },
};