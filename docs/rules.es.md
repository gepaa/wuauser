# PROYECTO WUAUSER – Reglas y configuración técnica

## Tech stack obligatorio

- Frontend: React Native + Expo SDK 49+
- Navegación: React Navigation v6
- Formularios: React Hook Form
- Estado servidor: TanStack Query (React Query)
- Backend: Supabase (Auth, DB, Storage)
- UI Kit: NativeBase o Tamagui
- Mapas: react-native-maps (Google Maps)
- TypeScript: obligatorio en todo el proyecto

## Estructura de carpetas obligatoria

```text
/src
  /screens     → Pantallas completas
  /components  → Componentes reutilizables
  /services    → Llamadas API/Supabase
  /hooks       → Custom hooks
  /utils       → Funciones helper
  /types       → TypeScript interfaces
  /constants   → Configuración y constantes
  /navigation  → Configuración de navegación
```

## Reglas de código estrictas

1. TODOS los componentes en TypeScript con interfaces.
2. TODAS las funciones async con try-catch.
3. TODOS los formularios con validación.
4. NUNCA usar `any`, usar `unknown` si necesario.
5. SIEMPRE comentarios en español cuando aclaren intención.
6. Funciones máximo 50 líneas.
7. Archivos máximo 200 líneas.
8. Componentes: PascalCase (ej. `MascotaCard.tsx`).
9. Funciones: camelCase (ej. `obtenerMascotas`).
10. Constantes: UPPER_SNAKE (ej. `API_BASE_URL`).

## Patrón de componentes

```ts
import React from 'react';
import { View, Text } from 'react-native';

interface NombreComponenteProps {
  // props tipadas siempre
}

export const NombreComponente: React.FC<NombreComponenteProps> = (props) => {
  // 1. hooks
  // 2. lógica
  // 3. return JSX
  return (
    <View>
      <Text>Contenido</Text>
    </View>
  );
};
```

## Patrón de servicios API

```ts
export const nombreServicio = async (): Promise<TipoRetorno> => {
  try {
    const { data, error } = await supabase
      .from('tabla')
      .select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error específico:', error);
    throw error;
  }
};
```

## Manejo de estado

- Estado local simple: `useState`.
- Estado complejo: `useReducer`.
- Datos de servidor: React Query.
- NO usar Redux (innecesario para este proyecto).

## Validaciones y UX

- Todos los inputs con validación en tiempo real.
- Mensajes de error en español mexicano.
- Loading states en todas las operaciones async.
- Feedback visual para cada acción del usuario.
- Prevenir doble submit en formularios.

## Colores y diseño

- Principal: `#007AFF` (azul)
- Secundario: `#FF3B30` (rojo)
- Éxito: `#34C759` (verde)
- Warning: `#FF9500` (naranja)
- Error: `#FF3B30` (rojo)
- Fondo: `#F2F2F7` (gris claro)
- Texto: `#000000` (negro)
- Texto secundario: `#8E8E93` (gris)

> IMPORTANTE: Este es un proyecto real que conectará veterinarios con dueños de mascotas en México. El código debe ser producción-ready, mantenible y escalable. Siempre pensar en el usuario final que no es técnico.
