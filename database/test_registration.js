#!/usr/bin/env node

/**
 * Script de prueba para las funciones de registro corregidas
 * Ejecutar: node database/test_registration.js
 * 
 * Este script valida que los datos de entrada sean correctos
 * antes de probar con Supabase real
 */

// Datos de prueba para dueño
const testDuenoData = {
  email: 'test.dueno@example.com',
  password: 'password123',
  datosPersonales: {
    nombre_completo: 'Juan Pérez García',
    telefono: '5555551234',
    direccion: 'Av. Insurgentes Sur 1234, Col. Centro',
    codigo_postal: '06000',
    ciudad: 'Ciudad de México'
  }
};

// Datos de prueba para veterinario
const testVeterinarioData = {
  email: 'test.veterinario@example.com',
  password: 'password123',
  datosVeterinario: {
    nombre_completo: 'Dra. María Elena González',
    telefono: '5555555678',
    cedula_profesional: 'CED12345678',
    especialidad: 'Medicina General Veterinaria',
    nombre_clinica: 'Clínica Veterinaria San Francisco',
    direccion_clinica: 'Calle Reforma 456, Col. Roma Norte',
    telefono_clinica: '5555559012',
    servicios: [
      'Consulta general',
      'Vacunación',
      'Cirugía menor',
      'Odontología veterinaria'
    ],
    horario_atencion: {
      lunes: { inicio: '09:00', fin: '18:00' },
      martes: { inicio: '09:00', fin: '18:00' },
      miercoles: { inicio: '09:00', fin: '18:00' },
      jueves: { inicio: '09:00', fin: '18:00' },
      viernes: { inicio: '09:00', fin: '18:00' },
      sabado: { inicio: '09:00', fin: '14:00' },
      domingo: null
    }
  }
};

// Datos inválidos para probar validaciones
const invalidTestCases = [
  {
    name: 'Email inválido',
    data: { ...testDuenoData, email: 'email-invalido' }
  },
  {
    name: 'Contraseña muy corta',
    data: { ...testDuenoData, password: '123' }
  },
  {
    name: 'Dueño sin nombre completo',
    data: {
      ...testDuenoData,
      datosPersonales: { ...testDuenoData.datosPersonales, nombre_completo: '' }
    }
  },
  {
    name: 'Dueño sin dirección',
    data: {
      ...testDuenoData,
      datosPersonales: { ...testDuenoData.datosPersonales, direccion: '' }
    }
  },
  {
    name: 'Veterinario sin cédula profesional',
    data: {
      ...testVeterinarioData,
      datosVeterinario: { ...testVeterinarioData.datosVeterinario, cedula_profesional: '' }
    }
  }
];

// Funciones de validación (copiadas del archivo supabase.ts)
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
};

const validateDuenoData = (datos) => {
  if (!datos.nombre_completo?.trim()) {
    return 'El nombre completo es requerido';
  }
  if (!datos.direccion?.trim()) {
    return 'La dirección es requerida';
  }
  if (!datos.ciudad?.trim()) {
    return 'La ciudad es requerida';
  }
  return null;
};

const validateVeterinarioData = (datos) => {
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

function runValidationTests() {
  console.log('🧪 EJECUTANDO PRUEBAS DE VALIDACIÓN\n');

  // Probar datos válidos
  console.log('✅ PROBANDO DATOS VÁLIDOS:');
  
  // Dueño válido
  console.log('📝 Dueño válido:');
  console.log(`  Email: ${validateEmail(testDuenoData.email) ? '✅' : '❌'} ${testDuenoData.email}`);
  console.log(`  Password: ${validatePassword(testDuenoData.password) ? '❌' : '✅'} (${testDuenoData.password.length} caracteres)`);
  console.log(`  Datos: ${validateDuenoData(testDuenoData.datosPersonales) ? '❌' : '✅'}`);
  
  // Veterinario válido
  console.log('📝 Veterinario válido:');
  console.log(`  Email: ${validateEmail(testVeterinarioData.email) ? '✅' : '❌'} ${testVeterinarioData.email}`);
  console.log(`  Password: ${validatePassword(testVeterinarioData.password) ? '❌' : '✅'} (${testVeterinarioData.password.length} caracteres)`);
  console.log(`  Datos: ${validateVeterinarioData(testVeterinarioData.datosVeterinario) ? '❌' : '✅'}`);
  
  console.log('\n❌ PROBANDO DATOS INVÁLIDOS:');
  
  // Probar casos inválidos
  invalidTestCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}:`);
    
    const email = testCase.data.email;
    const password = testCase.data.password;
    
    const emailValid = validateEmail(email);
    const passwordError = validatePassword(password);
    
    console.log(`   Email: ${emailValid ? '✅' : '❌'} ${email}`);
    console.log(`   Password: ${passwordError ? '❌' : '✅'} ${passwordError || 'válida'}`);
    
    if (testCase.data.datosPersonales) {
      const dataError = validateDuenoData(testCase.data.datosPersonales);
      console.log(`   Datos dueño: ${dataError ? '❌' : '✅'} ${dataError || 'válidos'}`);
    }
    
    if (testCase.data.datosVeterinario) {
      const dataError = validateVeterinarioData(testCase.data.datosVeterinario);
      console.log(`   Datos veterinario: ${dataError ? '❌' : '✅'} ${dataError || 'válidos'}`);
    }
    
    console.log('');
  });
}

function showTestData() {
  console.log('📊 DATOS DE PRUEBA PARA SUPABASE:\n');
  
  console.log('👨‍💼 DATOS DE DUEÑO:');
  console.log(JSON.stringify(testDuenoData, null, 2));
  
  console.log('\n👩‍⚕️ DATOS DE VETERINARIO:');
  console.log(JSON.stringify(testVeterinarioData, null, 2));
  
  console.log('\n💡 INSTRUCCIONES:');
  console.log('1. Ejecuta la migración en Supabase (database/001_create_usuarios_table.sql)');
  console.log('2. Desactiva el modo desarrollo: node database/disable_dev_mode.js');
  console.log('3. Usa estos datos para probar el registro en la app');
  console.log('4. Revisa los logs en la consola para ver el flujo completo');
  console.log('5. Restaura el modo desarrollo: node database/restore_dev_mode.js');
}

function main() {
  console.log('🔍 SCRIPT DE PRUEBA DE REGISTRO - WUAUSER\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--validation') || args.includes('-v')) {
    runValidationTests();
  } else if (args.includes('--data') || args.includes('-d')) {
    showTestData();
  } else {
    console.log('Uso:');
    console.log('  node test_registration.js --validation  # Ejecutar pruebas de validación');
    console.log('  node test_registration.js --data        # Mostrar datos de prueba');
    console.log('');
    console.log('Ejecutando ambas por defecto...\n');
    runValidationTests();
    console.log('\n' + '='.repeat(60) + '\n');
    showTestData();
  }
}

main();