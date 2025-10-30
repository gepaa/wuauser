# Testing - Navegación de Chat desde Citas

## Test 1: Dueño contacta a veterinario
- [ ] Login como dueño
- [ ] Ir a "Mis Citas"
- [ ] Presionar "Contactar veterinario" en una cita
- [ ] Debe abrir pantalla de chat
- [ ] Nombre del veterinario debe aparecer en header
- [ ] Chat debe estar vacío o con mensaje de contexto

## Test 2: Veterinario contacta a dueño
- [ ] Login como veterinario
- [ ] Ir a "Mis Citas" o agenda
- [ ] Presionar "Enviar mensaje" en una cita
- [ ] Debe abrir pantalla de chat
- [ ] Nombre del dueño debe aparecer en header
- [ ] Chat debe estar vacío o con mensaje de contexto

## Test 3: Chat persistente
- [ ] Enviar mensaje en el chat abierto
- [ ] Volver atrás
- [ ] Volver a abrir chat desde la misma cita
- [ ] Los mensajes deben seguir ahí (no crear chat duplicado)

## Test 4: Manejo de errores
- [ ] Desconectar internet
- [ ] Intentar abrir chat
- [ ] Debe mostrar alert de error amigable
- [ ] No debe crashear la app

## Notas
- Fecha de implementación: 12 Oct 2025
- TODOs resueltos: MyAppointmentsScreen.tsx:124, VetAppointmentsScreen.tsx:125
- Función agregada: chatService.createOrGetChat()
