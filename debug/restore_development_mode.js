#!/usr/bin/env node

/**
 * RESTAURAR MODO DESARROLLO
 * Ejecutar: node debug/restore_development_mode.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts');
const BACKUP_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts.backup');

console.log('🔄 RESTAURANDO MODO DESARROLLO');
console.log('='.repeat(50));

try {
  if (fs.existsSync(BACKUP_FILE)) {
    const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
    fs.writeFileSync(SUPABASE_FILE, backupContent);
    fs.unlinkSync(BACKUP_FILE);
    console.log('✅ Modo desarrollo restaurado');
    console.log('🎭 La app volverá a usar datos mock');
  } else {
    console.log('❌ No se encontró backup para restaurar');
    console.log('💡 El archivo ya está en modo original');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('='.repeat(50));