# 🚀 INSTRUCCIONES PARA EJECUTAR SQL EN SUPABASE (3 minutos)

## PASO 1: Abrir SQL Editor

Click en este enlace (se abre en tu navegador):
👉 https://supabase.com/dashboard/project/tmwtelgxnhkjzrdmlwph/sql/new

O navega manualmente:
1. Ve a https://supabase.com/dashboard
2. Click en proyecto "wuauser" (ID: tmwtelgxnhkjzrdmlwph)
3. Click en "SQL Editor" en el menú izquierdo (icono 📝)
4. Click en "New query"

---

## PASO 2: Copiar el Script SQL

Abre el archivo en tu editor:
```
wuauser-app/supabase/migrations/complete_setup.sql
```

**Selecciona TODO el contenido** (Cmd+A o Ctrl+A)
**Cópialo** (Cmd+C o Ctrl+C)

💡 Son ~600 líneas - asegúrate de copiar TODO

---

## PASO 3: Pegar en Supabase

En el SQL Editor que abriste:
1. Click en el área del editor (el cuadro grande de texto)
2. Pega el contenido (Cmd+V o Ctrl+V)
3. Verifica que se pegó correctamente (debe verse código SQL colorido)

---

## PASO 4: Ejecutar el Script

1. Click en el botón **"RUN"** (botón verde en esquina inferior derecha)
   - O presiona Cmd+Enter (Mac) / Ctrl+Enter (Windows)

2. **Espera 10-15 segundos** mientras se ejecuta

3. Verás en la parte inferior uno de estos mensajes:

   ✅ **SI TODO SALIÓ BIEN:**
   ```
   Success. No rows returned
   ```
   O también puede decir:
   ```
   Success. Rows returned: X
   ```

   ❌ **SI HAY ERROR:**
   ```
   Error: [algún mensaje de error]
   ```
   **DETENTE AQUÍ** y copia el error completo para mostrármelo

---

## PASO 5: Verificar Tablas Creadas (Opcional)

Si quieres verificar manualmente que todo funcionó:

1. En el menú izquierdo, click en "Table Editor" (icono 📊)
2. Debes ver estas 9 tablas:
   - ✅ profiles
   - ✅ veterinarios
   - ✅ mascotas
   - ✅ citas
   - ✅ pet_medical_records
   - ✅ chats
   - ✅ messages
   - ✅ payments
   - ✅ payment_methods

---

## PASO 6: Confirmar que Terminaste

Vuelve a la terminal y escribe:
```
SQL ejecutado
```

Yo ejecutaré automáticamente el script de verificación.

---

## 🆘 ¿TUVISTE UN ERROR?

Si viste un mensaje de error al ejecutar:

1. **Copia el error completo**
2. **Envíamelo** antes de continuar
3. **NO** intentes ejecutar el script de nuevo hasta que te diga

Errores comunes:
- "relation already exists" → Está bien, significa que ya existía
- "permission denied" → Problema con las credenciales
- "syntax error" → El script no se copió completo

---

## ✅ CHECKLIST RÁPIDO

- [ ] Abrí SQL Editor en Supabase
- [ ] Copié TODO el contenido de complete_setup.sql
- [ ] Pegué en el editor
- [ ] Click en RUN
- [ ] Vi "Success" (sin errores)
- [ ] Confirmo que terminé escribiendo "SQL ejecutado"

---

**Tiempo estimado:** 3 minutos
**Dificultad:** Muy fácil (solo copiar y pegar)
