#!/usr/bin/env node

/**
 * Script para deshabilitar temporalmente el modo desarrollo en Supabase
 * Ejecutar: node database/disable_dev_mode.js
 * 
 * Esto permite probar la conexión real a Supabase sin modificar código permanentemente
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts');
const BACKUP_FILE = path.join(__dirname, '../wuauser-app/src/services/supabase.ts.backup');

function disableDevMode() {
    try {
        // Leer el archivo actual
        const content = fs.readFileSync(SUPABASE_FILE, 'utf8');
        
        // Crear backup si no existe
        if (!fs.existsSync(BACKUP_FILE)) {
            fs.writeFileSync(BACKUP_FILE, content);
            console.log('✅ Backup creado en supabase.ts.backup');
        }
        
        // Buscar la línea de isDevelopment y comentarla
        const lines = content.split('\n');
        let modified = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('const isDevelopment = __DEV__')) {
                lines[i] = '// const isDevelopment = __DEV__ && (';
                lines[i + 1] = '//   !supabaseUrl ||';
                lines[i + 2] = '//   !supabaseAnonKey ||';
                lines[i + 3] = '//   supabaseUrl.includes(\'placeholder\') ||';
                lines[i + 4] = '//   supabaseAnonKey.includes(\'placeholder\')';
                lines[i + 5] = '// );';
                lines.splice(i + 6, 0, 'const isDevelopment = false; // Forzado para testing');
                modified = true;
                break;
            }
        }
        
        if (modified) {
            fs.writeFileSync(SUPABASE_FILE, lines.join('\n'));
            console.log('✅ Modo desarrollo deshabilitado');
            console.log('🔧 Ahora puedes probar la conexión real a Supabase');
            console.log('⚠️  Recuerda ejecutar "node database/restore_dev_mode.js" cuando termines');
        } else {
            console.log('❌ No se encontró la línea de isDevelopment');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function restoreDevMode() {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
            fs.writeFileSync(SUPABASE_FILE, backupContent);
            fs.unlinkSync(BACKUP_FILE);
            console.log('✅ Modo desarrollo restaurado');
        } else {
            console.log('❌ No se encontró el archivo de backup');
        }
    } catch (error) {
        console.error('❌ Error restaurando:', error.message);
    }
}

// Determinar qué hacer basado en el nombre del script
const scriptName = path.basename(process.argv[1]);

if (scriptName === 'disable_dev_mode.js') {
    console.log('🔧 Deshabilitando modo desarrollo...');
    disableDevMode();
} else if (scriptName === 'restore_dev_mode.js') {
    console.log('🔄 Restaurando modo desarrollo...');
    restoreDevMode();
}