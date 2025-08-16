#!/usr/bin/env node

/**
 * Script para restaurar el modo desarrollo en Supabase
 * Ejecutar: node database/restore_dev_mode.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts');
const BACKUP_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts.backup');

function restoreDevMode() {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
            fs.writeFileSync(SUPABASE_FILE, backupContent);
            fs.unlinkSync(BACKUP_FILE);
            console.log('✅ Modo desarrollo restaurado');
            console.log('🎭 La app volverá a usar datos mock');
        } else {
            console.log('❌ No se encontró el archivo de backup');
            console.log('💡 El modo desarrollo ya está activo o no se deshabilitó correctamente');
        }
    } catch (error) {
        console.error('❌ Error restaurando:', error.message);
    }
}

console.log('🔄 Restaurando modo desarrollo...');
restoreDevMode();