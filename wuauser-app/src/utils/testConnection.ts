import { supabase } from '../services/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Probando conexión a Supabase...');
  
  try {
    if (!supabase) {
      console.log('⚠️ Supabase no está configurado (modo desarrollo)');
      return { success: false, error: 'Modo desarrollo' };
    }

    // Test 1: Verificar conexión básica
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Conexión a Supabase exitosa');
    console.log(`📊 Total de perfiles en la base de datos: ${data?.length || 0}`);

    // Test 2: Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ No hay usuario autenticado:', authError.message);
    } else if (user) {
      console.log('👤 Usuario autenticado:', user.email);
    } else {
      console.log('👤 No hay usuario autenticado');
    }

    // Test 3: Verificar tablas existentes
    const tables = ['profiles', 'veterinarios', 'mascotas', 'citas'];
    console.log('🗄️ Verificando tablas...');
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (tableError) {
          console.log(`❌ Tabla '${table}' no existe o no es accesible:`, tableError.message);
        } else {
          console.log(`✅ Tabla '${table}' existe y es accesible`);
        }
      } catch (err) {
        console.log(`❌ Error verificando tabla '${table}':`, err);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error: error.message };
  }
};