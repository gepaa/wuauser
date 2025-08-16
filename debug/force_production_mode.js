#!/usr/bin/env node

/**
 * FORZAR MODO PRODUCCIÓN - Deshabilitar desarrollo completamente
 * Ejecutar: node debug/force_production_mode.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts');
const BACKUP_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts.backup');

console.log('🚨 FORZANDO MODO PRODUCCIÓN');
console.log('='.repeat(50));

function forceProductionMode() {
  try {
    // Leer archivo actual
    const content = fs.readFileSync(SUPABASE_FILE, 'utf8');
    
    // Crear backup
    if (!fs.existsSync(BACKUP_FILE)) {
      fs.writeFileSync(BACKUP_FILE, content);
      console.log('✅ Backup creado');
    }
    
    // Buscar y reemplazar la lógica de isDevelopment
    let modifiedContent = content;
    
    // Comentar la lógica de development
    modifiedContent = modifiedContent.replace(
      /const isDevelopment = __DEV__ && \(/g,
      '// FORZADO: const isDevelopment = __DEV__ && ('
    );
    
    modifiedContent = modifiedContent.replace(
      /  !supabaseUrl \\|\\|/g,
      '//   !supabaseUrl ||'
    );
    
    modifiedContent = modifiedContent.replace(
      /  !supabaseAnonKey \\|\\|/g,
      '//   !supabaseAnonKey ||'
    );
    
    modifiedContent = modifiedContent.replace(
      /  supabaseUrl\\.includes\\('placeholder'\\) \\|\\|/g,
      "//   supabaseUrl.includes('placeholder') ||"
    );
    
    modifiedContent = modifiedContent.replace(
      /  supabaseAnonKey\\.includes\\('placeholder'\\)/g,
      "//   supabaseAnonKey.includes('placeholder')"
    );
    
    modifiedContent = modifiedContent.replace(
      /\\);/g,
      '// );'
    );
    
    // Forzar modo producción
    const isDevelopmentRegex = /const isDevelopment = .*?;/s;
    modifiedContent = modifiedContent.replace(
      isDevelopmentRegex,
      '// FORZADO A MODO PRODUCCIÓN\\nconst isDevelopment = false; // FORZADO PARA DEBUG'
    );
    
    // Escribir archivo modificado
    fs.writeFileSync(SUPABASE_FILE, modifiedContent);
    
    console.log('✅ Modo producción FORZADO');
    console.log('⚠️ isDevelopment = false (SIEMPRE)');
    console.log('⚠️ Usará cliente Supabase real');
    console.log('');
    console.log('🔧 Para restaurar: node debug/restore_development_mode.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function restoreMode() {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
      fs.writeFileSync(SUPABASE_FILE, backupContent);
      fs.unlinkSync(BACKUP_FILE);
      console.log('✅ Modo desarrollo restaurado');
    } else {
      console.log('❌ No hay backup para restaurar');
    }
  } catch (error) {
    console.error('❌ Error restaurando:', error.message);
  }
}

// Determinar acción
const action = process.argv[2];

if (action === 'restore') {
  console.log('🔄 RESTAURANDO MODO DESARROLLO...');
  restoreMode();
} else {
  console.log('🔧 FORZANDO MODO PRODUCCIÓN...');
  forceProductionMode();
  
  console.log('');
  console.log('📋 PRÓXIMOS PASOS:');
  console.log('1. La app ahora SIEMPRE usará Supabase real');
  console.log('2. Probar registro en la app');
  console.log('3. Ver logs detallados en consola');
  console.log('4. Ejecutar: node debug/restore_development_mode.js cuando termines');
}

console.log('='.repeat(50));