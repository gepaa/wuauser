import { createClient } from '@supabase/supabase-js';
import { config } from '../constants/config';
import type { Database } from '../types/database';

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

// Development mode fallback - allows app to run without Supabase config
const isDevelopment = __DEV__ && (
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('placeholder') || 
  supabaseAnonKey.includes('placeholder')
);

if (isDevelopment) {
  console.warn('⚠️ Modo de desarrollo: Supabase no configurado. Las funciones de autenticación estarán simuladas.');
}

export const supabase = isDevelopment 
  ? null 
  : createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        global: {
          headers: {
            'x-my-custom-header': 'wuauser-app',
          },
        },
      }
    );

// Simple connection status helper
export const connectionService = {
  isOnline: true,
  
  checkConnection: async () => {
    if (isDevelopment || !supabase) {
      console.log('🎭 Mock connection check');
      return true;
    }
    
    try {
      const { error } = await supabase.from('_health_check').select('count').limit(1);
      connectionService.isOnline = !error;
      return !error;
    } catch (error) {
      console.warn('Supabase: Connection check failed', error);
      connectionService.isOnline = false;
      return false;
    }
  },
  
  getStatus: () => connectionService.isOnline,
};

// Enhanced error handling helper
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase Error [${context}]:`, error);
  
  if (error?.message?.includes('Network')) {
    return new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
  }
  
  if (error?.message?.includes('Invalid login')) {
    return new Error('Email o contraseña incorrectos.');
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return new Error('Por favor, confirma tu email antes de iniciar sesión.');
  }
  
  return error;
};

// Mock data for development
const createMockUser = (email: string, metadata: any) => ({
  id: `mock-${Date.now()}`,
  email,
  user_metadata: metadata,
  created_at: new Date().toISOString(),
});

export const authService = {
  async signUp(email: string, password: string, metadata: any) {
    if (isDevelopment) {
      // Mock implementation for development
      console.log('🎭 Mock signUp:', { email, metadata });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      return { 
        data: { 
          user: createMockUser(email, metadata),
          session: null
        }, 
        error: null 
      };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) {
        throw handleSupabaseError(error, 'signUp');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('AuthService: Error en signUp', error);
      return { data: null, error };
    }
  },

  async registrarDueno(email: string, password: string, datosPersonales: any) {
    if (isDevelopment) {
      // Mock implementation for development
      console.log('🎭 Mock registrarDueno:', { email, datosPersonales });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      return { 
        data: { 
          user: createMockUser(email, { ...datosPersonales, tipo_usuario: 'dueno' }),
          session: null
        }, 
        error: null 
      };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...datosPersonales,
            tipo_usuario: 'dueno',
          },
        },
      });
      
      if (error) {
        throw handleSupabaseError(error, 'registrarDueno');
      }
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email: data.user.email,
            tipo_usuario: 'dueno',
            nombre_completo: datosPersonales.nombre_completo,
            telefono: datosPersonales.telefono,
            direccion: datosPersonales.direccion,
            codigo_postal: datosPersonales.codigo_postal,
            ciudad: datosPersonales.ciudad,
          });
        
        if (profileError) {
          throw handleSupabaseError(profileError, 'crear perfil dueño');
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('AuthService: Error en registrarDueno', error);
      return { data: null, error };
    }
  },

  async registrarVeterinario(email: string, password: string, datosVeterinario: any) {
    if (isDevelopment) {
      // Mock implementation for development
      console.log('🎭 Mock registrarVeterinario:', { email, datosVeterinario });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      return { 
        data: { 
          user: createMockUser(email, { ...datosVeterinario, tipo_usuario: 'veterinario' }),
          session: null
        }, 
        error: null 
      };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...datosVeterinario,
            tipo_usuario: 'veterinario',
          },
        },
      });
      
      if (error) {
        throw handleSupabaseError(error, 'registrarVeterinario');
      }
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email: data.user.email,
            tipo_usuario: 'veterinario',
            nombre_completo: datosVeterinario.nombre_completo,
            telefono: datosVeterinario.telefono,
            cedula_profesional: datosVeterinario.cedula_profesional,
            especialidad: datosVeterinario.especialidad,
            nombre_clinica: datosVeterinario.nombre_clinica,
            direccion_clinica: datosVeterinario.direccion_clinica,
            telefono_clinica: datosVeterinario.telefono_clinica,
            servicios: datosVeterinario.servicios,
            horario_atencion: datosVeterinario.horario_atencion,
            verificado: false,
          });
        
        if (profileError) {
          throw handleSupabaseError(profileError, 'crear perfil veterinario');
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('AuthService: Error en registrarVeterinario', error);
      return { data: null, error };
    }
  },

  async continuarComoGuest() {
    try {
      return { 
        data: { 
          user: { 
            id: 'guest', 
            email: null, 
            tipo_usuario: 'guest' as const 
          } 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('AuthService: Error en continuarComoGuest', error);
      return { data: null, error };
    }
  },

  async signIn(email: string, password: string) {
    if (isDevelopment) {
      // Mock implementation for development
      console.log('🎭 Mock signIn:', { email });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Simple mock validation
      if (email && password.length >= 6) {
        return { 
          data: { 
            user: createMockUser(email, { tipo_usuario: 'dueno' }),
            session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
          }, 
          error: null 
        };
      } else {
        return { 
          data: null, 
          error: new Error('Email o contraseña incorrectos (Mock)') 
        };
      }
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw handleSupabaseError(error, 'signIn');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('AuthService: Error en signIn', error);
      return { data: null, error };
    }
  },

  async signOut() {
    if (isDevelopment) {
      console.log('🎭 Mock signOut');
      return { error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw handleSupabaseError(error, 'signOut');
      }
      
      return { error: null };
    } catch (error) {
      console.error('AuthService: Error en signOut', error);
      return { error };
    }
  },

  async getCurrentUser() {
    if (isDevelopment) {
      console.log('🎭 Mock getCurrentUser');
      return { user: null, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw handleSupabaseError(error, 'getCurrentUser');
      }
      
      return { user, error: null };
    } catch (error) {
      console.error('AuthService: Error en getCurrentUser', error);
      return { user: null, error };
    }
  },

  async resetPassword(email: string) {
    if (isDevelopment) {
      console.log('🎭 Mock resetPassword:', email);
      return { data: null, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.app.name}://reset-password`,
      });
      
      if (error) {
        throw handleSupabaseError(error, 'resetPassword');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('AuthService: Error en resetPassword', error);
      return { data: null, error };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (isDevelopment || !supabase) {
      console.log('🎭 Mock onAuthStateChange');
      return { data: { subscription: null }, error: null };
    }
    
    return supabase.auth.onAuthStateChange(callback);
  },

  getConnectionStatus() {
    return connectionService.getStatus();
  },
};

// Database helper functions
export const dbService = {
  async getProfile(userId: string) {
    if (isDevelopment) {
      console.log('🎭 Mock getProfile:', userId);
      return { data: null, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw handleSupabaseError(error, 'getProfile');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('DBService: Error en getProfile', error);
      return { data: null, error };
    }
  },

  async updateProfile(userId: string, updates: any) {
    if (isDevelopment) {
      console.log('🎭 Mock updateProfile:', userId, updates);
      return { data: null, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        throw handleSupabaseError(error, 'updateProfile');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('DBService: Error en updateProfile', error);
      return { data: null, error };
    }
  },

  async getVeterinarians(location?: { latitude: number; longitude: number }) {
    if (isDevelopment) {
      console.log('🎭 Mock getVeterinarians:', location);
      return { data: [], error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      let query = supabase
        .from('profiles')
        .select(`
          *,
          veterinarian_profiles (*)
        `)
        .eq('user_type', 'vet')
        .eq('is_active', true);

      // If location provided, add proximity filter
      if (location) {
        // Using PostGIS for location-based queries
        query = query.rpc('nearby_veterinarians', {
          lat: location.latitude,
          long: location.longitude,
          radius_km: 50
        });
      }

      const { data, error } = await query;
      
      if (error) {
        throw handleSupabaseError(error, 'getVeterinarians');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('DBService: Error en getVeterinarians', error);
      return { data: null, error };
    }
  },

  async getUserPets(userId: string) {
    if (isDevelopment) {
      console.log('🎭 Mock getUserPets:', userId);
      return { data: [], error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          pet_medical_records (*)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw handleSupabaseError(error, 'getUserPets');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('DBService: Error en getUserPets', error);
      return { data: null, error };
    }
  },

  async createAppointment(appointmentData: any) {
    if (isDevelopment) {
      console.log('🎭 Mock createAppointment:', appointmentData);
      return { data: null, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();
      
      if (error) {
        throw handleSupabaseError(error, 'createAppointment');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('DBService: Error en createAppointment', error);
      return { data: null, error };
    }
  },
};

// Real-time subscriptions helper
export const realtimeService = {
  subscribeToAppointments(userId: string, callback: (payload: any) => void) {
    if (isDevelopment || !supabase) {
      console.log('🎭 Mock subscribeToAppointments for userId:', userId);
      return { unsubscribe: () => console.log('🎭 Mock unsubscribe appointments') };
    }
    
    try {
      return supabase
        .channel('appointments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `owner_id=eq.${userId}`,
          },
          callback
        )
        .subscribe((status) => {
          console.log('Supabase appointments channel status:', status);
        });
    } catch (error) {
      console.error('Error subscribing to appointments:', error);
      return { unsubscribe: () => {} };
    }
  },

  subscribeToMessages(userId: string, callback: (payload: any) => void) {
    if (isDevelopment || !supabase) {
      console.log('🎭 Mock subscribeToMessages for userId:', userId);
      return { unsubscribe: () => console.log('🎭 Mock unsubscribe messages') };
    }
    
    try {
      return supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${userId}`,
          },
          callback
        )
        .subscribe((status) => {
          console.log('Supabase messages channel status:', status);
        });
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      return { unsubscribe: () => {} };
    }
  },

  unsubscribe(channel: any) {
    if (isDevelopment || !supabase) {
      console.log('🎭 Mock unsubscribe channel');
      return;
    }
    
    try {
      if (channel?.unsubscribe) {
        channel.unsubscribe();
      } else if (supabase) {
        supabase.removeChannel(channel);
      }
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
    }
  },
};

export { connectionService };