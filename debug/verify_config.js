#!/usr/bin/env node

/**
 * DIAGNÓSTICO FUNDAMENTAL - Verificación de configuración básica
 * Ejecutar: node debug/verify_config.js
 */

console.log('🚨 DIAGNÓSTICO FUNDAMENTAL - CONFIGURACIÓN BÁSICA');
console.log('='.repeat(60));

// 1. VERIFICAR ARCHIVO .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../wuauser-app/.env');
const configPath = path.join(__dirname, '../wuauser-app/src/constants/config.ts');

console.log('📁 VERIFICANDO ARCHIVOS DE CONFIGURACIÓN:');
console.log('');

// Verificar .env
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado en:', envPath);
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 CONTENIDO .env:');
    console.log(envContent);
    
    // Parsear variables
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log('');
    console.log('🔍 VARIABLES PARSEADAS:');
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        console.log(`  ${key}: ${value.substring(0, 30)}...`);
      }
    });
  } catch (error) {
    console.log('❌ Error leyendo .env:', error.message);
  }
} else {
  console.log('❌ Archivo .env NO ENCONTRADO en:', envPath);
}

console.log('');

// Verificar config.ts
if (fs.existsSync(configPath)) {
  console.log('✅ Archivo config.ts encontrado');
} else {
  console.log('❌ Archivo config.ts NO ENCONTRADO en:', configPath);
}

console.log('');
console.log('='.repeat(60));

// 2. SIMULAR CARGA DE CONFIGURACIÓN
console.log('⚙️ SIMULANDO CARGA DE CONFIGURACIÓN:');
console.log('');

// Simular process.env
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://tmwtelgxnhkjzrdmlwph.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtd3RlbGd4bmhranpyZG1sd3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDQzNTMsImV4cCI6MjA3MDcyMDM1M30.F_hujULJHgY1YfUWA_Qbqv7pofJlojw_45AT__6cxpk';

const simulatedConfig = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  }
};

console.log('🔍 CONFIGURACIÓN SIMULADA:');
console.log('URL:', simulatedConfig.supabase.url);
console.log('Key (primeros 30 chars):', simulatedConfig.supabase.anonKey?.substring(0, 30) + '...');
console.log('');

// 3. VERIFICAR CONDICIONES DE DESARROLLO
const supabaseUrl = simulatedConfig.supabase.url;
const supabaseAnonKey = simulatedConfig.supabase.anonKey;

console.log('🔍 VERIFICACIÓN DE MODO DESARROLLO:');
console.log('');

const checks = {
  'URL existe': !!supabaseUrl,
  'Key existe': !!supabaseAnonKey,
  'URL contiene placeholder': supabaseUrl?.includes('placeholder'),
  'Key contiene placeholder': supabaseAnonKey?.includes('placeholder'),
  'URL es válida': supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co'),
  'Key parece JWT': supabaseAnonKey?.startsWith('eyJ')
};

Object.entries(checks).forEach(([check, result]) => {
  const status = result ? '✅' : '❌';
  console.log(`  ${status} ${check}: ${result}`);
});

console.log('');

// 4. DETERMINAR MODO
const isDevelopment = !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('placeholder') || 
  supabaseAnonKey.includes('placeholder');

console.log('🎯 RESULTADO MODO DESARROLLO:');
console.log(`  isDevelopment: ${isDevelopment}`);

if (isDevelopment) {
  console.log('  ⚠️  MODO DESARROLLO ACTIVO - Usando mocks');
  console.log('  💡 Para usar Supabase real, asegurar que:');
  console.log('     - URL no contenga "placeholder"');
  console.log('     - Key no contenga "placeholder"');
  console.log('     - Ambos valores estén definidos');
} else {
  console.log('  ✅ MODO PRODUCCIÓN - Usando Supabase real');
}

console.log('');
console.log('='.repeat(60));
console.log('🔧 SIGUIENTE PASO: node debug/test_connection.js');
console.log('='.repeat(60));