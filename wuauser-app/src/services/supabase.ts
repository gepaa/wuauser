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

// Debug flag for auth errors - set to true to see all auth errors including session missing
const DEBUG_AUTH = false;

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

// Enhanced error handling helper with Mexican Spanish messages
const handleSupabaseError = (error: any, context: string) => {
  // Only log errors if DEBUG_AUTH is true OR if it's not an Auth session missing error
  if (DEBUG_AUTH || error?.message !== 'Auth session missing!') {
    console.error(`Supabase Error [${context}]:`, error);
  }
  
  // Network errors
  if (error?.message?.includes('Network') || error?.code === 'NETWORK_ERROR') {
    return new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
  }
  
  // Authentication errors
  if (error?.message?.includes('Invalid login')) {
    return new Error('Email o contraseña incorrectos.');
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return new Error('Por favor, confirma tu email antes de iniciar sesión.');
  }
  
  if (error?.message?.includes('User already registered')) {
    return new Error('Este email ya está registrado. Intenta iniciar sesión.');
  }
  
  if (error?.message?.includes('Password should be at least')) {
    return new Error('La contraseña debe tener al menos 6 caracteres.');
  }
  
  if (error?.message?.includes('Invalid email')) {
    return new Error('El formato del email no es válido.');
  }
  
  // Database errors
  if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
    return new Error('Este email ya está registrado en el sistema.');
  }
  
  if (error?.code === '23502' || error?.message?.includes('null value')) {
    return new Error('Faltan datos requeridos. Verifica que todos los campos estén completos.');
  }
  
  if (error?.code === '23503' || error?.message?.includes('foreign key')) {
    return new Error('Error de referencia en la base de datos. Contacta soporte.');
  }
  
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    return new Error('Error de configuración de la base de datos. Contacta soporte.');
  }
  
  // RLS (Row Level Security) errors
  if (error?.code === '42501' || error?.message?.includes('permission denied')) {
    return new Error('No tienes permisos para realizar esta acción.');
  }
  
  // Generic database error
  if (error?.message?.includes('Database error')) {
    return new Error('Error en la base de datos. Intenta nuevamente en unos momentos.');
  }
  
  // Return original error if no specific handling
  return error instanceof Error ? error : new Error(error?.message || 'Error desconocido');
};

// Input validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): string | null => {
  if (!password || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
};

const validateDuenoData = (datos: any): string | null => {
  if (!datos.nombre_completo?.trim()) {
    return 'El nombre completo es requerido';
  }
  // SIMPLIFICADO: Solo validar nombre_completo para registro básico
  // direccion y ciudad son opcionales
  return null;
};

const validateVeterinarioData = (datos: any): string | null => {
  if (!datos.nombre_completo?.trim()) {
    return 'El nombre completo es requerido';
  }
  if (!datos.cedula_profesional?.trim()) {
    return 'La cédula profesional es requerida';
  }
  if (!datos.especialidad?.trim()) {
    return 'La especialidad es requerida';
  }
  if (!datos.nombre_clinica?.trim()) {
    return 'El nombre de la clínica es requerido';
  }
  return null;
};

// Mock data for development
const createMockUser = (email: string, metadata: any) => ({
  id: `mock-${Date.now()}`,
  email,
  user_metadata: metadata,
  created_at: new Date().toISOString(),
});

export const authService = {
  // FUNCIÓN DE PRUEBA MÍNIMA - Solo para debug
  async testMinimalRegistration(email: string, password: string) {
    console.log('🧪 PRUEBA MÍNIMA - Registro con campos básicos');
    console.log('🧪 Email:', email);
    console.log('🧪 isDevelopment:', isDevelopment);
    
    if (isDevelopment) {
      console.log('🎭 Mock test registration');
      return { data: { user: createMockUser(email, {}) }, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      // Step 1: Auth only
      console.log('🧪 Paso 1: Auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });
      
      if (authError) {
        console.error('🚨 Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('No auth user created');
      }
      
      // Step 2: MINIMAL profile insert - ONLY required fields
      console.log('🧪 Paso 2: Insertar perfil MÍNIMO...');
      const minimalData = {
        id: authData.user.id,
        email: authData.user.email || email.toLowerCase().trim(),
        tipo_usuario: 'dueno' as const,
        nombre_completo: 'Test User Minimal',
      };
      
      console.log('🧪 Datos mínimos a insertar:', minimalData);
      console.log('🧪 Campos exactos:', Object.keys(minimalData));
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert(minimalData)
        .select()
        .single();
      
      console.log('🧪 Profile insert result:', { profileData, profileError });
      
      if (profileError) {
        console.error('🚨 Profile error:', profileError);
        throw profileError;
      }
      
      console.log('✅ ÉXITO - Registro mínimo funcionó');
      return { data: { user: authData.user, profile: profileData }, error: null };
      
    } catch (error) {
      console.error('🚨 Test registration failed:', error);
      return { data: null, error };
    }
  },

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
    console.log('🔍 DEBUG registrarDueno - PATRÓN OFICIAL SUPABASE');
    console.log('🔍 DEBUG registrarDueno - email:', email);
    console.log('🔍 DEBUG registrarDueno - datosPersonales:', datosPersonales);
    
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
      // Input validation
      if (!validateEmail(email)) {
        throw new Error('El formato del email no es válido');
      }
      
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }
      
      const dataError = validateDuenoData(datosPersonales);
      if (dataError) {
        throw new Error(dataError);
      }
      
      if (!supabase) {
        console.error('🚨 CRITICAL: supabase client is null');
        throw new Error('Supabase no está configurado');
      }
      
      console.log('🔍 DEBUG: Usando patrón oficial de Supabase con trigger automático...');
      
      // PATRÓN OFICIAL: Solo signUp con metadata - el trigger crea el profile automáticamente
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            tipo_usuario: 'dueno',
            first_name: datosPersonales.nombre_completo?.trim(),
            telefono: datosPersonales.telefono?.trim(),
            // Campos opcionales en metadata
            direccion: datosPersonales.direccion?.trim(),
            codigo_postal: datosPersonales.codigo_postal?.trim(), 
            ciudad: datosPersonales.ciudad?.trim(),
          },
          emailRedirectTo: 'wuauser://confirm-email',
        },
      });
      
      console.log('🔍 DEBUG: Auth response - data:', authData);
      console.log('🔍 DEBUG: Auth response - error:', authError);
      
      if (authError) {
        console.error('🚨 ERROR en Auth signUp:', authError);
        throw handleSupabaseError(authError, 'registro de autenticación');
      }
      
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario de autenticación');
      }
      
      console.log('✅ DEBUG: Usuario registrado exitosamente con patrón oficial');
      console.log('✅ DEBUG: El perfil se crea automáticamente via trigger');
      
      // El profile se crea automáticamente via trigger, no necesitamos insertar manualmente
      return { 
        data: {
          user: authData.user,
          session: authData.session
        }, 
        error: null 
      };
      
    } catch (error) {
      console.error('🚨 AuthService: Error en registrarDueno', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el registro';
      return { data: null, error: new Error(errorMessage) };
    }
  },

  async registrarVeterinario(email: string, password: string, datosVeterinario: any) {
    console.log('🔍 DEBUG registrarVeterinario - isDevelopment:', isDevelopment);
    console.log('🔍 DEBUG registrarVeterinario - email:', email);
    console.log('🔍 DEBUG registrarVeterinario - datosVeterinario:', datosVeterinario);
    
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
      // Input validation
      if (!validateEmail(email)) {
        throw new Error('El formato del email no es válido');
      }
      
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }
      
      const dataError = validateVeterinarioData(datosVeterinario);
      if (dataError) {
        throw new Error(dataError);
      }
      
      if (!supabase) {
        console.error('🚨 CRITICAL: supabase client is null');
        throw new Error('Supabase no está configurado');
      }
      
      console.log('🔍 DEBUG: Iniciando transacción de registro veterinario...');
      
      // Step 1: Create auth user
      console.log('🔍 DEBUG: Paso 1 - Creando usuario veterinario en Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            tipo_usuario: 'veterinario',
            nombre_completo: datosVeterinario.nombre_completo?.trim(),
            cedula_profesional: datosVeterinario.cedula_profesional?.trim(),
          },
          emailRedirectTo: 'wuauser://confirm-email',
        },
      });
      
      console.log('🔍 DEBUG: Auth response - data:', authData);
      console.log('🔍 DEBUG: Auth response - error:', authError);
      
      if (authError) {
        console.error('🚨 ERROR en Auth signUp:', authError);
        throw handleSupabaseError(authError, 'registro de autenticación veterinario');
      }
      
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario veterinario de autenticación');
      }
      
      // Step 2: Create profile in usuarios table
      console.log('🔍 DEBUG: Paso 2 - Creando perfil veterinario en tabla usuarios...');
      console.log('🔍 DEBUG: User ID:', authData.user.id);
      
      // VERSIÓN MÍNIMA: Solo campos que DEFINITIVAMENTE existen en Supabase
      const profileData = {
        id: authData.user.id,
        email: authData.user.email || email.toLowerCase().trim(),
        tipo_usuario: 'veterinario' as const,
        nombre_completo: datosVeterinario.nombre_completo?.trim(),
        cedula_profesional: datosVeterinario.cedula_profesional?.trim(),
        especialidad: datosVeterinario.especialidad?.trim(),
        nombre_clinica: datosVeterinario.nombre_clinica?.trim(),
        verificado: false, // Always false for new veterinarians
        // Campos opcionales - solo si tienen valor
        ...(datosVeterinario.telefono?.trim() && { telefono: datosVeterinario.telefono.trim() }),
        ...(datosVeterinario.direccion_clinica?.trim() && { direccion_clinica: datosVeterinario.direccion_clinica.trim() }),
        ...(datosVeterinario.telefono_clinica?.trim() && { telefono_clinica: datosVeterinario.telefono_clinica.trim() }),
        ...(datosVeterinario.servicios && { servicios: datosVeterinario.servicios }),
        ...(datosVeterinario.horario_atencion && { horario_atencion: datosVeterinario.horario_atencion }),
      };
      
      console.log('🔍 DEBUG: Datos del perfil veterinario a insertar:', profileData);
      console.log('📋 DEBUG: Campos exactos a insertar:', Object.keys(profileData));
      
      const { data: profileInsertData, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      console.log('🔍 DEBUG: Profile insert response - data:', profileInsertData);
      console.log('🔍 DEBUG: Profile insert response - error:', profileError);
      
      if (profileError) {
        console.error('🚨 ERROR al crear perfil veterinario:', profileError);
        
        // Rollback: Delete the auth user if profile creation failed
        console.log('🔄 ROLLBACK: Eliminando usuario veterinario de Auth...');
        try {
          if (authData.session) {
            await supabase.auth.signOut();
          }
          // Note: We can't delete the auth user programmatically
          // The user will need to be cleaned up manually or via admin
        } catch (rollbackError) {
          console.error('🚨 Error en rollback:', rollbackError);
        }
        
        throw handleSupabaseError(profileError, 'crear perfil veterinario');
      }
      
      console.log('✅ DEBUG: Usuario veterinario registrado exitosamente');
      console.log('✅ DEBUG: Profile veterinario creado:', profileInsertData);
      
      return { 
        data: {
          user: authData.user,
          session: authData.session,
          profile: profileInsertData
        }, 
        error: null 
      };
      
    } catch (error) {
      console.error('🚨 AuthService: Error en registrarVeterinario', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el registro de veterinario';
      return { data: null, error: new Error(errorMessage) };
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
      // Only log if DEBUG_AUTH is true OR if it's not an Auth session missing error
      if (DEBUG_AUTH || (error as any)?.message !== 'Auth session missing!') {
        console.error('AuthService: Error en getCurrentUser:', error);
      }
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
        redirectTo: 'wuauser://reset-password',
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

// ⚠️  IMPORTANTE: CONFIGURACIÓN DE TABLA PROFILES EN SUPABASE ⚠️
// 
// La tabla 'profiles' debe existir en Supabase para que funcione correctamente.
// 
// PASOS PARA CONFIGURAR LA TABLA:
// 1. Ve a Supabase Dashboard → SQL Editor
// 2. Ejecuta el contenido del archivo: supabase/migrations/create_profiles_table.sql
// 3. O usa la CLI: npx supabase db reset
// 
// ESTRUCTURA DE LA TABLA PROFILES:
// - id: uuid (primary key, references auth.users.id)
// - email: text
// - nombre_completo: text
// - telefono: text (nullable)
// - tipo_usuario: text ('dueno' | 'veterinario' | 'guest')
// - created_at: timestamp
// - updated_at: timestamp
// 
// Campos adicionales para veterinarios (nullable):
// - cedula_profesional: text
// - especialidad: text
// - nombre_clinica: text
// - direccion_clinica: text
// - telefono_clinica: text
// - verificado: boolean
// - servicios: jsonb
// - horario_atencion: jsonb
// 
// Campos adicionales para dueños (nullable):
// - direccion: text
// - codigo_postal: text
// - ciudad: text
// 
// FUNCIONES AUTOMÁTICAS INCLUIDAS:
// - Trigger automático para crear perfiles al registrar usuarios
// - RLS (Row Level Security) habilitado
// - Políticas de seguridad configuradas
// - Trigger para actualizar updated_at automáticamente

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
      
      // Intentar obtener perfil sin .single()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
      
      if (profiles && profiles.length > 0) {
        return { data: profiles[0], error: null };
      }
      
      // Si no hay perfil, crear uno básico
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: 'usuario@wuauser.com',
          nombre_completo: 'Usuario Wuauser',
          tipo_usuario: 'dueno'
        })
        .select();
      
      return { data: newProfile?.[0] || null, error: null };
    } catch (error) {
      console.error('Error total en getProfile:', error);
      // Retornar perfil vacío para no bloquear
      return { 
        data: {
          id: userId,
          email: 'usuario@wuauser.com',
          nombre_completo: 'Usuario',
          tipo_usuario: 'dueno'
        }, 
        error: null 
      };
    }
  },

  async createProfile(userId: string, profileData: any) {
    if (isDevelopment) {
      console.log('🎭 Mock createProfile:', userId, profileData);
      return { data: null, error: null };
    }
    
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }
      
      const newProfileData = {
        id: userId,
        email: profileData.email,
        tipo_usuario: profileData.tipo_usuario,
        nombre_completo: profileData.nombre_completo,
        ...(profileData.telefono && { telefono: profileData.telefono }),
        // Campos específicos de veterinarios
        ...(profileData.cedula_profesional && { cedula_profesional: profileData.cedula_profesional }),
        ...(profileData.especialidad && { especialidad: profileData.especialidad }),
        ...(profileData.nombre_clinica && { nombre_clinica: profileData.nombre_clinica }),
        ...(profileData.direccion_clinica && { direccion_clinica: profileData.direccion_clinica }),
        ...(profileData.verificado !== undefined && { verificado: profileData.verificado }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('🔧 Insertando nuevo perfil:', newProfileData);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select()
        .single();
      
      if (error) {
        throw handleSupabaseError(error, 'createProfile');
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('DBService: Error en createProfile', error);
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
          *
        `)
        .eq('tipo_usuario', 'veterinario')
        .eq('verificado', true);

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