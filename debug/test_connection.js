#!/usr/bin/env node

/**
 * DIAGNÓSTICO FUNDAMENTAL - Test de conexión básica a Supabase
 * Ejecutar: node debug/test_connection.js
 */

console.log('🚨 DIAGNÓSTICO FUNDAMENTAL - TEST DE CONEXIÓN');
console.log('='.repeat(60));

// Importar createClient
const { createClient } = require('@supabase/supabase-js');

// Credenciales EXACTAS del .env
const supabaseUrl = 'https://tmwtelgxnhkjzrdmlwph.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtd3RlbGd4bmhranpyZG1sd3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDQzNTMsImV4cCI6MjA3MDcyMDM1M30.F_hujULJHgY1YfUWA_Qbqv7pofJlojw_45AT__6cxpk';

console.log('🔧 CONFIGURACIÓN DE CONEXIÓN:');
console.log('URL:', supabaseUrl);
console.log('Key (primeros 30):', supabaseAnonKey.substring(0, 30) + '...');
console.log('');

async function testBasicConnection() {
  console.log('🔌 INICIANDO TEST DE CONEXIÓN BÁSICA...');
  console.log('');
  
  try {
    // Crear cliente
    console.log('⚙️ Paso 1: Creando cliente Supabase...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Cliente creado exitosamente');
    
    // Test de conexión simple
    console.log('🌐 Paso 2: Test de conexión (ping)...');
    const { data: healthData, error: healthError } = await supabase
      .from('_health_check')
      .select('*')
      .limit(1);
    
    console.log('Resultado health check:', { healthData, healthError });
    
    // Test de tabla usuarios - solo verificar que existe
    console.log('📋 Paso 3: Verificar tabla usuarios...');
    const { data: usersData, error: usersError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);
    
    console.log('Resultado tabla usuarios:', { usersData, usersError });
    
    // Si hay error específico de tabla, es bueno - significa que la conexión funciona
    if (usersError && usersError.code === '42P01') {
      console.log('⚠️ Tabla usuarios no existe - pero la CONEXIÓN FUNCIONA');
      return { connection: 'OK', table: 'MISSING' };
    }
    
    if (usersError) {
      console.log('❌ Error en tabla usuarios:', usersError);
      return { connection: 'OK', table: 'ERROR', error: usersError };
    }
    
    console.log('✅ Tabla usuarios existe y es accesible');
    return { connection: 'OK', table: 'OK' };
    
  } catch (error) {
    console.log('💥 ERROR DE CONEXIÓN:', error);
    return { connection: 'FAILED', error };
  }
}

async function testAuth() {
  console.log('');
  console.log('🔐 INICIANDO TEST DE AUTH...');
  console.log('');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test de Auth - simple signup
    console.log('📧 Paso 1: Test signUp con email temporal...');
    const testEmail = `test.${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    console.log('Test email:', testEmail);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    console.log('Resultado signUp:', { 
      data: signUpData ? 'USER_CREATED' : null, 
      error: signUpError 
    });
    
    if (signUpError) {
      // Algunos errores son esperados (como email ya registrado)
      if (signUpError.message?.includes('already registered')) {
        console.log('⚠️ Email ya registrado - pero AUTH FUNCIONA');
        return { auth: 'OK', note: 'EMAIL_EXISTS' };
      }
      
      console.log('❌ Error en Auth:', signUpError);
      return { auth: 'ERROR', error: signUpError };
    }
    
    console.log('✅ Auth signup exitoso');
    return { auth: 'OK' };
    
  } catch (error) {
    console.log('💥 ERROR DE AUTH:', error);
    return { auth: 'FAILED', error };
  }
}

async function runFullDiagnostic() {
  console.log('🔍 EJECUTANDO DIAGNÓSTICO COMPLETO...');
  console.log('');
  
  // Test 1: Conexión básica
  const connectionResult = await testBasicConnection();
  
  // Test 2: Auth
  const authResult = await testAuth();
  
  // Resumen
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
  console.log('');
  
  console.log('🔌 CONEXIÓN:', connectionResult.connection);
  console.log('📋 TABLA USUARIOS:', connectionResult.table || 'N/A');
  console.log('🔐 AUTH:', authResult.auth);
  
  console.log('');
  
  if (connectionResult.connection === 'OK' && authResult.auth === 'OK') {
    console.log('✅ DIAGNÓSTICO: Supabase está funcionando correctamente');
    console.log('💡 El problema está en el código de la app, no en la conexión');
    
    if (connectionResult.table === 'MISSING') {
      console.log('⚠️ ACCIÓN REQUERIDA: Ejecutar migración de tabla usuarios');
      console.log('   Comando: Copiar database/001_create_usuarios_table.sql a Supabase SQL Editor');
    }
  } else {
    console.log('❌ DIAGNÓSTICO: Hay problemas de conectividad');
    console.log('🔧 REVISAR: Credenciales, permisos, configuración de red');
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('🔧 SIGUIENTE PASO: node debug/test_simple_registration.js');
  console.log('='.repeat(60));
}

// Ejecutar diagnóstico
runFullDiagnostic().catch(error => {
  console.error('💥 ERROR FATAL EN DIAGNÓSTICO:', error);
});