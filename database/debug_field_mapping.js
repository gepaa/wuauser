#!/usr/bin/env node

/**
 * SCRIPT DE DEBUG CRÍTICO - Mapeo de campos
 * 
 * Este script verifica exactamente qué campos están causando el error
 * "Database error saving new user"
 */

console.log('🚨 DEBUG CRÍTICO: Mapeo de campos Supabase');
console.log('='.repeat(50));

// Estructura esperada según la migración
const expectedTableStructure = {
  required: [
    'id',           // UUID REFERENCES auth.users(id)
    'email',        // VARCHAR(255) NOT NULL UNIQUE
    'tipo_usuario', // tipo_usuario_enum NOT NULL
    'nombre_completo' // VARCHAR(255) NOT NULL
  ],
  optional_dueno: [
    'telefono',     // VARCHAR(20)
    'direccion',    // TEXT
    'codigo_postal', // VARCHAR(10)
    'ciudad'        // VARCHAR(100)
  ],
  optional_veterinario: [
    'telefono',          // VARCHAR(20)
    'cedula_profesional', // VARCHAR(50)
    'especialidad',      // VARCHAR(255)
    'nombre_clinica',    // VARCHAR(255)
    'direccion_clinica', // TEXT
    'telefono_clinica',  // VARCHAR(20)
    'servicios',         // JSONB
    'horario_atencion',  // JSONB
    'verificado'         // BOOLEAN DEFAULT false
  ],
  audit: [
    'created_at',   // TIMESTAMP - auto
    'updated_at'    // TIMESTAMP - auto
  ]
};

// Datos que el código está enviando actualmente
const currentDuenoMapping = {
  id: 'auth.user.id',
  email: 'auth.user.email',
  tipo_usuario: "'dueno'",
  nombre_completo: 'datosPersonales.nombre_completo',
  telefono: 'datosPersonales.telefono',
  direccion: 'datosPersonales.direccion',
  codigo_postal: 'datosPersonales.codigo_postal',
  ciudad: 'datosPersonales.ciudad'
};

const currentVeterinarioMapping = {
  id: 'auth.user.id',
  email: 'auth.user.email',
  tipo_usuario: "'veterinario'",
  nombre_completo: 'datosVeterinario.nombre_completo',
  telefono: 'datosVeterinario.telefono',
  cedula_profesional: 'datosVeterinario.cedula_profesional',
  especialidad: 'datosVeterinario.especialidad',
  nombre_clinica: 'datosVeterinario.nombre_clinica',
  direccion_clinica: 'datosVeterinario.direccion_clinica',
  telefono_clinica: 'datosVeterinario.telefono_clinica',
  servicios: 'datosVeterinario.servicios',
  horario_atencion: 'datosVeterinario.horario_atencion',
  verificado: 'false'
};

function analyzeMapping() {
  console.log('📋 ESTRUCTURA ESPERADA EN SUPABASE:');
  console.log('');
  
  console.log('🔴 CAMPOS REQUERIDOS:');
  expectedTableStructure.required.forEach(field => {
    console.log(`  ✓ ${field}`);
  });
  
  console.log('');
  console.log('🟡 CAMPOS OPCIONALES DUEÑO:');
  expectedTableStructure.optional_dueno.forEach(field => {
    console.log(`  ○ ${field}`);
  });
  
  console.log('');
  console.log('🟡 CAMPOS OPCIONALES VETERINARIO:');
  expectedTableStructure.optional_veterinario.forEach(field => {
    console.log(`  ○ ${field}`);
  });
  
  console.log('');
  console.log('🔵 CAMPOS AUTOMÁTICOS:');
  expectedTableStructure.audit.forEach(field => {
    console.log(`  ⚙️ ${field}`);
  });
}

function verifyCurrentMapping() {
  console.log('\\n' + '='.repeat(50));
  console.log('🔍 VERIFICACIÓN DE MAPEO ACTUAL:');
  console.log('');
  
  const allExpectedFields = [
    ...expectedTableStructure.required,
    ...expectedTableStructure.optional_dueno,
    ...expectedTableStructure.optional_veterinario
  ];
  
  console.log('📝 MAPEO DUEÑO:');
  Object.keys(currentDuenoMapping).forEach(field => {
    const exists = allExpectedFields.includes(field);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${field}: ${currentDuenoMapping[field]}`);
  });
  
  console.log('');
  console.log('📝 MAPEO VETERINARIO:');
  Object.keys(currentVeterinarioMapping).forEach(field => {
    const exists = allExpectedFields.includes(field);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${field}: ${currentVeterinarioMapping[field]}`);
  });
}

function generateMinimalTest() {
  console.log('\\n' + '='.repeat(50));
  console.log('🧪 DATOS DE PRUEBA MÍNIMA:');
  console.log('');
  
  const minimalDueno = {
    email: 'test.minimal@example.com',
    password: 'password123',
    profileData: {}
  };
  
  // Solo campos requeridos
  expectedTableStructure.required.forEach(field => {
    if (field === 'id') {
      minimalDueno.profileData[field] = 'auth.user.id (automático)';
    } else if (field === 'email') {
      minimalDueno.profileData[field] = minimalDueno.email;
    } else if (field === 'tipo_usuario') {
      minimalDueno.profileData[field] = 'dueno';
    } else if (field === 'nombre_completo') {
      minimalDueno.profileData[field] = 'Usuario de Prueba Mínima';
    }
  });
  
  console.log('📊 PRUEBA MÍNIMA - Solo campos requeridos:');
  console.log(JSON.stringify(minimalDueno, null, 2));
  
  console.log('\\n💡 INSTRUCCIONES PARA PROBAR:');
  console.log('1. Deshabilitar modo desarrollo: node database/disable_dev_mode.js');
  console.log('2. En la app, usar authService.testMinimalRegistration()');
  console.log('3. Verificar logs para ver qué campo exacto falla');
  console.log('4. Restaurar modo desarrollo: node database/restore_dev_mode.js');
}

function generateSQL() {
  console.log('\\n' + '='.repeat(50));
  console.log('🔧 COMANDOS SQL PARA VERIFICAR TABLA:');
  console.log('');
  
  console.log('-- Verificar que la tabla existe');
  console.log("SELECT table_name FROM information_schema.tables WHERE table_name = 'usuarios';");
  console.log('');
  
  console.log('-- Ver estructura exacta de la tabla');
  console.log('SELECT column_name, data_type, is_nullable, column_default');
  console.log('FROM information_schema.columns');
  console.log("WHERE table_name = 'usuarios'");
  console.log('ORDER BY ordinal_position;');
  console.log('');
  
  console.log('-- Verificar enum de tipo_usuario');
  console.log('SELECT enumlabel FROM pg_enum');
  console.log("WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_usuario_enum');");
  console.log('');
  
  console.log('-- Probar inserción manual mínima');
  console.log('INSERT INTO public.usuarios (id, email, tipo_usuario, nombre_completo)');
  console.log('VALUES (');
  console.log('  gen_random_uuid(),');
  console.log("  'test.manual@example.com',");
  console.log("  'dueno'::tipo_usuario_enum,");
  console.log("  'Prueba Manual'");
  console.log(');');
}

function main() {
  analyzeMapping();
  verifyCurrentMapping();
  generateMinimalTest();
  generateSQL();
  
  console.log('\\n' + '='.repeat(50));
  console.log('🎯 SIGUIENTE PASO CRÍTICO:');
  console.log('Ejecutar la función testMinimalRegistration() para');
  console.log('identificar el campo exacto que está causando el error.');
  console.log('='.repeat(50));
}

main();