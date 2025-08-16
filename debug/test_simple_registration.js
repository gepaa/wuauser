#!/usr/bin/env node

/**
 * DIAGNÓSTICO FUNDAMENTAL - Registro ultra-simple
 * Ejecutar: node debug/test_simple_registration.js
 */

console.log('🚨 DIAGNÓSTICO FUNDAMENTAL - REGISTRO ULTRA-SIMPLE');
console.log('='.repeat(60));

const { createClient } = require('@supabase/supabase-js');

// Credenciales exactas
const supabaseUrl = 'https://tmwtelgxnhkjzrdmlwph.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtd3RlbGd4bmhranpyZG1sd3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDQzNTMsImV4cCI6MjA3MDcyMDM1M30.F_hujULJHgY1YfUWA_Qbqv7pofJlojw_45AT__6cxpk';

async function testOnlyAuth() {
  console.log('🔐 TEST 1: SOLO AUTENTICACIÓN (sin insertar en tabla)');
  console.log('');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const testEmail = `test.auth.${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    console.log('📧 Registrando email:', testEmail);
    console.log('🔑 Password length:', testPassword.length);
    
    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    const endTime = Date.now();
    console.log('⏱️ Tiempo transcurrido:', endTime - startTime, 'ms');
    
    console.log('');
    console.log('📊 RESULTADO AUTH:');
    
    if (error) {
      console.log('❌ ERROR:', error);
      console.log('Error code:', error.code || 'NO_CODE');
      console.log('Error message:', error.message || 'NO_MESSAGE');
      return { success: false, error };
    }
    
    if (data?.user) {
      console.log('✅ USUARIO CREADO:');
      console.log('  ID:', data.user.id);
      console.log('  Email:', data.user.email);
      console.log('  Email confirmed:', data.user.email_confirmed_at ? 'YES' : 'NO');
      console.log('  Created at:', data.user.created_at);
      console.log('  Session exists:', data.session ? 'YES' : 'NO');
      return { success: true, user: data.user };
    }
    
    console.log('⚠️ No error pero tampoco usuario creado');
    console.log('Data completa:', data);
    return { success: false, message: 'NO_USER_CREATED' };
    
  } catch (error) {
    console.log('💥 EXCEPCIÓN EN AUTH:', error);
    return { success: false, exception: error };
  }
}

async function testAuthAndTableInsert() {
  console.log('');
  console.log('🔐📋 TEST 2: AUTH + INSERCIÓN MÍNIMA EN TABLA');
  console.log('');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const testEmail = `test.full.${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    console.log('📧 Email para test completo:', testEmail);
    
    // Paso 1: Auth
    console.log('🔐 Paso 1: Creando usuario en Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.log('❌ Error en Auth:', authError);
      return { success: false, step: 'AUTH', error: authError };
    }
    
    if (!authData?.user) {
      console.log('❌ No se creó usuario en Auth');
      return { success: false, step: 'AUTH', message: 'NO_USER' };
    }
    
    console.log('✅ Usuario Auth creado:', authData.user.id);
    
    // Paso 2: Inserción en tabla
    console.log('📋 Paso 2: Insertando en tabla usuarios...');
    
    const profileData = {
      id: authData.user.id,
      email: authData.user.email,
      tipo_usuario: 'dueno',
      nombre_completo: 'Usuario Test Fundamental'
    };
    
    console.log('📝 Datos a insertar:', profileData);
    console.log('🔑 Campos:', Object.keys(profileData));
    
    const { data: insertData, error: insertError } = await supabase
      .from('usuarios')
      .insert(profileData)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ ERROR EN INSERCIÓN:', insertError);
      console.log('Error code:', insertError.code);
      console.log('Error message:', insertError.message);
      console.log('Error details:', insertError.details);
      console.log('Error hint:', insertError.hint);
      
      return { 
        success: false, 
        step: 'INSERT', 
        error: insertError,
        authSuccess: true,
        userId: authData.user.id
      };
    }
    
    console.log('✅ INSERCIÓN EXITOSA:', insertData);
    return { 
      success: true, 
      authUser: authData.user, 
      profile: insertData 
    };
    
  } catch (error) {
    console.log('💥 EXCEPCIÓN EN TEST COMPLETO:', error);
    return { success: false, exception: error };
  }
}

async function runRegistrationDiagnostic() {
  console.log('🔍 EJECUTANDO DIAGNÓSTICO DE REGISTRO...');
  console.log('');
  
  // Test 1: Solo Auth
  const authResult = await testOnlyAuth();
  
  // Test 2: Auth + Tabla
  const fullResult = await testAuthAndTableInsert();
  
  // Análisis
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 ANÁLISIS DE RESULTADOS:');
  console.log('');
  
  if (authResult.success) {
    console.log('✅ AUTH FUNCIONA: Supabase Auth está operativo');
  } else {
    console.log('❌ AUTH FALLA: Problema con Supabase Auth');
    console.log('   Error:', authResult.error?.message || 'Desconocido');
  }
  
  if (fullResult.success) {
    console.log('✅ INSERCIÓN FUNCIONA: Tabla usuarios operativa');
    console.log('💡 EL PROBLEMA ESTÁ EN EL CÓDIGO DE LA APP');
  } else {
    if (fullResult.step === 'AUTH') {
      console.log('❌ PROBLEM EN AUTH (test 2)');
    } else if (fullResult.step === 'INSERT') {
      console.log('❌ PROBLEMA EN INSERCIÓN: Tabla usuarios tiene problemas');
      console.log('   Auth funcionó, pero falla la tabla');
      console.log('   Posibles causas:');
      console.log('   - Tabla no existe');
      console.log('   - Permisos RLS mal configurados');
      console.log('   - Campos incorrectos');
      console.log('   - Tipo de datos incorrecto');
      
      if (fullResult.error) {
        console.log('');
        console.log('🔍 DETALLES DEL ERROR:');
        console.log('   Code:', fullResult.error.code);
        console.log('   Message:', fullResult.error.message);
        
        // Análisis específico por código de error
        if (fullResult.error.code === '42P01') {
          console.log('   💡 DIAGNÓSTICO: Tabla "usuarios" no existe');
          console.log('   🔧 SOLUCIÓN: Ejecutar migración database/001_create_usuarios_table.sql');
        } else if (fullResult.error.code === '42501') {
          console.log('   💡 DIAGNÓSTICO: Permisos insuficientes (RLS)');
          console.log('   🔧 SOLUCIÓN: Verificar policies en Supabase');
        } else if (fullResult.error.code === '23502') {
          console.log('   💡 DIAGNÓSTICO: Campo requerido faltante');
          console.log('   🔧 SOLUCIÓN: Verificar estructura de datos');
        }
      }
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('🎯 CONCLUSIÓN:');
  
  if (authResult.success && fullResult.success) {
    console.log('✅ SUPABASE FUNCIONA PERFECTAMENTE');
    console.log('❗ EL PROBLEMA ESTÁ EN EL CÓDIGO DE LA APP');
    console.log('🔧 REVISAR: src/services/supabase.ts líneas mencionadas');
  } else if (authResult.success && !fullResult.success) {
    console.log('⚠️ AUTH FUNCIONA, TABLA TIENE PROBLEMAS');
    console.log('🔧 REVISAR: Configuración de base de datos');
  } else {
    console.log('❌ PROBLEMA FUNDAMENTAL DE CONECTIVIDAD');
    console.log('🔧 REVISAR: Credenciales, red, configuración básica');
  }
  
  console.log('='.repeat(60));
}

// Ejecutar diagnóstico
runRegistrationDiagnostic().catch(error => {
  console.error('💥 ERROR FATAL:', error);
});