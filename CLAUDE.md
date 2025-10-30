# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Working with the Developer

**Developer Profile (Guido):**
- ❌ **NO tiene experiencia en código para apps móviles**
- ✅ **Proporciona:** Ideas de negocio, contexto, información, herramientas
- ⚠️ **Claude tiene autonomía técnica completa** para todas las decisiones de implementación
- 💬 **IMPORTANTE:** Guido prefiere que se hagan MIL PREGUNTAS para obtener el mejor resultado, en lugar de no preguntar nada y tener que repetir el trabajo mil veces

**Protocolo de Trabajo:**
1. SIEMPRE preguntar cuando haya ambigüedad en requisitos de negocio
2. NUNCA asumir decisiones de producto sin confirmar
3. Tomar decisiones técnicas de forma autónoma (librerías, arquitectura, patrones)
4. Explicar decisiones técnicas en español simple y claro
5. Alertar sobre trade-offs importantes antes de implementar
6. **IMPORTANTE:** Actualizar `PROGRESS.md` cada vez que:
   - Se complete una fase o tarea importante
   - Se tome una decisión técnica clave
   - Se agregue/modifique funcionalidad significativa
   - Se haga un commit importante
   - Al final de cada sesión de trabajo

## Project Overview

WUAUSER es una app móvil React Native + Expo que conecta veterinarios con dueños de mascotas en México. Usa Supabase para backend y sigue patrones UX en español mexicano.

**Versión Actual:** V2 (Post-refactoring a modelo de suscripciones)
**Última Versión Estable:** V1 (commit: c275d03) - Modelo pay-per-appointment archivado

## Tech Stack

- **Framework**: React Native + Expo SDK 53+
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)  
- **Forms**: React Hook Form with real-time validation
- **State**: TanStack Query v5 for server state, useState/useReducer for local state
- **Backend**: Supabase (Auth, Database, Storage)
- **UI Library**: NativeBase v3
- **Language**: TypeScript with strict mode enabled
- **Maps**: react-native-maps (when implemented)

## Development Commands

```bash
# Working directory: wuauser-app/
cd wuauser-app

# Start development server (ESTABLE)
npm run ios

# Alternative (si npm start falla por Node.js issues)
npx expo run:ios

# Platform-specific builds  
npm run android
npm run web

# Package management
npm install
```

## Problemas conocidos de Expo + Node.js
- Node.js 18-22 + React 19 + Expo 53+ tienen problemas con experimental type stripping
- Solución: usar `npm run ios` directamente para compilar en iOS Simulator
- O usar Expo Go app en dispositivo físico

## Project Structure

```
wuauser-app/src/
├── screens/      # Full screen components
├── components/   # Reusable UI components
├── services/     # Supabase API calls
├── navigation/   # React Navigation setup
├── constants/    # Colors, config, app constants
├── types/        # TypeScript type definitions
├── hooks/        # Custom React hooks (to be created)
└── utils/        # Helper functions (to be created)
```

## Architecture Patterns

### Component Structure
- **Hooks first**: useState, useEffect, custom hooks at top
- **Logic section**: Data processing, handlers, computed values  
- **JSX return**: UI rendering with clear component hierarchy
- **Props**: Always type with interfaces, no `any` types allowed

### Services Pattern (Supabase)
```ts
export const serviceName = async (): Promise<ReturnType> => {
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Specific error context:', error);
    throw error;
  }
};
```

### Error Handling
- All async operations wrapped in try/catch
- Loading and error states visible in UI
- Error messages in Mexican Spanish
- Console.error for debugging with context

## Code Conventions

- **Components**: PascalCase (`UserProfile`)
- **Functions/variables**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_TIMEOUT`)
- **Files**: PascalCase for components, camelCase for utilities
- **Max limits**: 50 lines per function, 200 lines per file

## 💰 Modelo de Negocio Actual (V2)

**Arquitectura:** B2B2C (Vendes a veterinarios, veterinarios sirven a dueños)

### Monetización
- ✅ **Veterinarios pagan suscripción mensual** (Stripe Subscriptions)
- ❌ **NO hay comisiones por cita** (se eliminó el modelo pay-per-appointment)
- ✅ **Dueños de mascotas usan la app 100% gratis**

### Planes de Suscripción

#### Plan Gratuito (Free)
- **Precio:** $0/mes permanente
- **Límite:** 5 citas por mes
- **Funciones:**
  - Perfil público visible (aparece en búsquedas)
  - Chat básico con clientes
  - Dashboard básico
  - Sin estadísticas avanzadas

#### Plan Profesional (Pro)
- **Precio:** $600 MXN/mes
- **Límite:** Citas ilimitadas
- **Funciones:**
  - Todo lo de Free +
  - Perfil destacado (aparece primero en búsquedas)
  - Chat ilimitado
  - Dashboard completo con estadísticas avanzadas
  - Soporte prioritario

### Onboarding de Veterinarios
- Todos empiezan con Plan Free (sin trial temporal)
- Pueden upgradear a Pro cuando quieran
- Plan Free es permanente (no se desactiva)

### Razón del Cambio (V1 → V2)
**V1:** Pay-per-appointment (dueño paga por cita, vet recibe 85%)
- **Problema:** Difícil hacer que clientes paguen por adelantado vs. ir presencialmente
- **Solución:** Cambio completo a modelo de suscripciones

**V2:** Subscription-based (vet paga mensual)
- Más predecible para monetización
- Menos fricción para dueños de mascotas
- Modelo probado (Doctoralia, Zocdoc)

## Current Implementation Status

### ✅ Completado (V1)
- Authentication service (Supabase Auth)
- Navigation structure (Stack + Bottom Tabs)
- Chat en tiempo real
- Sistema de citas
- Perfiles de mascotas y veterinarios
- Búsqueda de veterinarios
- Dashboard básico

### 🚧 En Progreso (V2 - Refactoring)
- Sistema de suscripciones con Stripe
- Planes Free y Pro
- Validación de límites de citas
- UI de selección y gestión de planes
- Webhooks de Stripe

### ❌ Desactivado Temporalmente (MVP)
- GPS tracking en tiempo real
- Mapas interactivos (react-native-maps)
  - *Razón:* No crítico para MVP, se reactivará en versión futura
  - *Ubicación en código:* Comentado en AppNavigator.tsx

### 📦 Archivado (No se usa pero se conserva)
- PaymentScreen.tsx → `/src/screens/_archived/`
- Código de pay-per-appointment en paymentService.ts (comentado)
  - *Razón:* Código de Stripe bien hecho, puede servir como referencia

## Key Requirements

- **TypeScript**: Strict mode, no `any` types, proper interfaces
- **UX Language**: All user-facing text in Mexican Spanish
- **Design Tokens**: Use colors from `src/constants/colors.ts`
- **Form Validation**: Real-time validation, prevent double-submit
- **State Management**: React Query for server state, local state for UI
- **Error Handling**: Always show loading/error states to users

## Environment Setup

Requires `.env` file in wuauser-app/ with:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🎯 Objetivos de Calidad del Código

Este proyecto busca ser **limpio, ordenado y mantenible** como Doctoralia:
- ✅ **Sin bugs ni errores** - Testing completo antes de lanzar features
- ✅ **Código simple y claro** - Fácil de leer y mantener
- ✅ **Sin código duplicado** - Un solo archivo por propósito
- ✅ **Documentación clara** - Comentarios donde sea necesario
- ⚠️ **Features avanzadas después** - Primero la base sólida, luego innovación

### Deuda Técnica Conocida (A Resolver)
- 🔴 **Servicios duplicados de veterinarios**
  - Existen: `veterinarioService.ts`, `veterinarianService.ts`, `veterinariaService.ts`
  - **Acción:** Consolidar en uno solo (`veterinarianService.ts`)
- 🔴 **Migraciones SQL no ejecutadas en producción**
  - Archivos creados pero NO corriendo en Supabase
  - **Acción:** Ejecutar en SQL Editor de Supabase
- 🟡 **Pantallas huérfanas**
  - Algunas pantallas existen pero no están en navegación
  - **Acción:** Revisar y archivar/eliminar

## Development Notes

**IMPORTANTE:** Si necesitas algún paquete npm/expo, inclúyelo SIEMPRE al inicio de tu respuesta o instálalo tú mismo en la consola.

### Base de Datos (Supabase)
- **URL Proyecto:** https://supabase.com/dashboard/project/tmwtelgxnhkjzrdmlwph
- **Estado:** Configurado en `.env` pero SQL pendiente de ejecutar
- **Acción Crítica:** Ejecutar `complete_setup.sql` en SQL Editor antes de probar la app

### Servicios a Consolidar
```
MANTENER: veterinarianService.ts (más completo, 31KB)
ELIMINAR: veterinarioService.ts, veterinariaService.ts
REFACTOR: Actualizar imports en todas las pantallas
```

### Features Desactivadas Temporalmente
```typescript
// En AppNavigator.tsx - GPS/Mapas comentados para MVP
// <Tab.Screen name="Map" component={MapScreen} />
// <Stack.Screen name="ChipTracking" component={ChipTrackingScreen} />
```

### Arquitectura de Pagos
```
V1 (Archivado): Stripe PaymentIntents → Pago por cita individual
V2 (Actual):    Stripe Subscriptions → Pago mensual recurrente
```

## 📊 Sistema de Tracking de Progreso

### Archivo PROGRESS.md

**Ubicación:** `PROGRESS.md` (raíz del proyecto)

Este archivo contiene el registro completo del progreso del proyecto y DEBE actualizarse regularmente.

**Cuándo actualizar PROGRESS.md:**

1. ✅ **Al completar una fase completa** (ej: FASE 1, FASE 2)
   - Marcar fase como completada
   - Actualizar % de progreso general
   - Agregar fecha y resumen

2. ✅ **Al tomar decisiones técnicas importantes**
   - Agregar a sección "Decisiones Técnicas Clave"
   - Documentar razón y fecha

3. ✅ **Al completar tareas significativas**
   - Marcar checkbox correspondiente
   - Actualizar métricas de progreso

4. ✅ **Al hacer commits importantes**
   - Agregar entrada en CHANGELOG
   - Listar archivos modificados

5. ✅ **Al final de cada sesión de trabajo**
   - Actualizar "Última actualización"
   - Agregar entrada en "Historial de Sesiones"
   - Actualizar "Próximas Acciones Inmediatas"

**Estructura del archivo:**
- 🎯 Objetivo del proyecto
- 📅 Historial de sesiones
- 🏗️ Estado actual de la arquitectura
- 📋 Plan maestro (fases pendientes)
- 📊 Métricas de progreso
- 🗂️ Archivos importantes
- 🎯 Próximas acciones
- 💡 Decisiones técnicas
- 🐛 Deuda técnica
- 🔄 Changelog

**Ejemplo de actualización:**
```markdown
### Sesión X - [Fecha]
**Trabajo realizado:**
- [x] Tarea completada
- [x] Otra tarea

**Commits:**
- `abc1234` - Descripción del commit

**Decisiones:**
- Usar librería X porque Y
```