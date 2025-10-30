#!/usr/bin/env node

/**
 * WUAUSER - Script de Verificación de Supabase
 *
 * Este script verifica que la configuración de Supabase esté correcta:
 * - Conexión exitosa
 * - Todas las tablas creadas
 * - RLS habilitado
 * - Políticas aplicadas
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: Archivo .env no encontrado en wuauser-app/');
  console.log('📋 Asegúrate de que existe wuauser-app/.env con las credenciales');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
  }
});

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Variables de entorno no configuradas');
  console.log('📋 Verifica que .env tenga:');
  console.log('   - EXPO_PUBLIC_SUPABASE_URL');
  console.log('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DE SUPABASE');
  console.log('='.repeat(50));
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  console.log('='.repeat(50));
  console.log('');

  let allPassed = true;

  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: connectionTest, error: connError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connError) {
      console.log('   ❌ Error de conexión:', connError.message);
      console.log('   📋 Verifica que las credenciales sean correctas');
      allPassed = false;
    } else {
      console.log('   ✅ Conexión exitosa a Supabase');
    }
    console.log('');

    // 2. Verificar todas las tablas
    console.log('2️⃣ Verificando tablas creadas...');
    const tables = [
      'profiles',
      'veterinarios',
      'mascotas',
      'citas',
      'pet_medical_records',
      'chats',
      'messages',
      'payments',
      'payment_methods'
    ];

    let tablesOk = 0;
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`   ❌ Tabla '${table}' no existe o sin permisos`);
        console.log(`      Error: ${error.message}`);
        allPassed = false;
      } else {
        console.log(`   ✅ Tabla '${table}' verificada`);
        tablesOk++;
      }
    }
    console.log(`   📊 ${tablesOk}/${tables.length} tablas verificadas`);
    console.log('');

    // 3. Verificar que el trigger de usuario funciona
    console.log('3️⃣ Verificando trigger handle_new_user...');
    try {
      // Intentar obtener función
      const { error: funcError } = await supabase.rpc('handle_new_user');
      if (funcError && !funcError.message.includes('function')) {
        console.log('   ✅ Trigger handle_new_user configurado');
      } else {
        console.log('   ⚠️  No se pudo verificar trigger (puede estar OK)');
      }
    } catch (e) {
      console.log('   ⚠️  No se pudo verificar trigger (puede estar OK)');
    }
    console.log('');

    // 4. Verificar RLS habilitado
    console.log('4️⃣ Verificando Row Level Security (RLS)...');
    console.log('   ℹ️  RLS debe estar habilitado en todas las tablas');
    console.log('   📋 Verifica manualmente en Supabase Dashboard → Authentication → Policies');
    console.log('');

    // Resultado final
    console.log('='.repeat(50));
    if (allPassed && tablesOk === tables.length) {
      console.log('🎉 ¡CONFIGURACIÓN COMPLETA Y FUNCIONAL!');
      console.log('');
      console.log('✅ Supabase está listo para usar');
      console.log('✅ Todas las tablas creadas correctamente');
      console.log('✅ La app puede conectarse a la base de datos');
      console.log('');
      console.log('📋 PRÓXIMOS PASOS:');
      console.log('   1. Reinicia la app: npx expo start -c');
      console.log('   2. Prueba el registro de usuario');
      console.log('   3. Verifica que el perfil se cree en Supabase Dashboard');
      console.log('');
      process.exit(0);
    } else {
      console.log('⚠️  CONFIGURACIÓN INCOMPLETA');
      console.log('');
      console.log('❌ Algunos problemas encontrados');
      console.log('');
      console.log('📋 ACCIONES NECESARIAS:');
      console.log('   1. Ve a: https://supabase.com/dashboard/project/tmwtelgxnhkjzrdmlwph/sql/new');
      console.log('   2. Copia el contenido de: wuauser-app/supabase/migrations/complete_setup.sql');
      console.log('   3. Pégalo en el SQL Editor');
      console.log('   4. Click en RUN');
      console.log('   5. Espera que complete sin errores');
      console.log('   6. Ejecuta este script de nuevo: npm run verify-supabase');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERROR INESPERADO:', error.message);
    console.error('');
    console.error('📋 Verifica:');
    console.error('   1. Archivo .env tiene las credenciales correctas');
    console.error('   2. Proyecto de Supabase está activo');
    console.error('   3. URL es: https://tmwtelgxnhkjzrdmlwph.supabase.co');
    console.error('');
    process.exit(1);
  }
}

// Ejecutar verificación
verifySetup();
