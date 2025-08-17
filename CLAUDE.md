# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WUAUSER is a React Native + Expo mobile app that connects veterinarians with pet owners in Mexico. The app uses Supabase for backend services and follows Mexican Spanish UX patterns.

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

## Current Implementation Status

The app has basic scaffolding with:
- Authentication service setup (Supabase)
- Navigation structure (Auth + App navigators)
- Basic screens (Splash, Onboarding, Login, Register)
- Type definitions for User, Pet, Vet, Appointment entities
- Color system and configuration constants

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

## Development Notes

- Color scheme needs updating to match design tokens in AI_GUIDELINES.md
- No src/hooks or src/utils directories created yet
- Main App.tsx still shows default Expo template
- Navigation setup exists but not connected to main App component