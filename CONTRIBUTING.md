# Contribuir a WUAUSER

Este documento define el stack, estructura, convenciones y patrones de código. Para un resumen para asistentes de IA, ver `AI_GUIDELINES.md`. Reglas completas ampliadas en `docs/rules.es.md`.

## Stack obligatorio

- Frontend: React Native + Expo SDK 49+
- Navegación: React Navigation v6
- Formularios: React Hook Form
- Estado de servidor: TanStack Query (React Query)
- Backend: Supabase (Auth, DB, Storage)
- UI Kit: NativeBase o Tamagui
- Mapas: `react-native-maps` (Google Maps)
- Lenguaje: TypeScript en todo el proyecto

## Estructura de carpetas

```text
src/
  screens/     # Pantallas completas
  components/  # Componentes reutilizables
  services/    # Llamadas API/Supabase
  hooks/       # Custom hooks
  utils/       # Funciones helper
  types/       # TypeScript interfaces
  constants/   # Configuración y constantes
  navigation/  # Configuración de navegación
```

## Reglas de código

1. Todo en TypeScript con interfaces para props y tipos de retorno.
2. Evitar `any`. Preferir `unknown` con refinamiento de tipos cuando aplique.
3. Todas las funciones `async` con `try/catch` y errores propagados con contexto.
4. Formularios siempre con validación (React Hook Form) y doble submit prevenido.
5. Comentarios en español, solo cuando aclaren intención.
6. Funciones ≤ 50 líneas. Archivos ≤ 200 líneas.
7. Nombres: Componentes `PascalCase`, funciones `camelCase`, constantes `UPPER_SNAKE`.
8. Estado local simple con `useState`; complejo con `useReducer`; datos remoto con React Query. No usar Redux.
9. Estados de carga y errores visibles en todas las operaciones async.
10. Mensajes de error en español mexicano y feedback visual para cada acción del usuario.

## Patrones

### Componentes

```ts
import React from 'react';
import { View, Text } from 'react-native';

interface NombreComponenteProps {}

export const NombreComponente: React.FC<NombreComponenteProps> = (props) => {
  // 1. hooks
  // 2. lógica
  // 3. JSX
  return (
    <View>
      <Text>Contenido</Text>
    </View>
  );
};
```

### Servicios (Supabase)

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

## UX y validaciones

- Validación en tiempo real en todos los inputs.
- Indicadores de carga en todas las operaciones async.
- Mensajes de error claros y en español MX.
- Feedback visual en cada acción del usuario.

## Diseño (tokens)

- Primario: `#007AFF`
- Secundario: `#FF3B30`
- Éxito: `#34C759`
- Warning: `#FF9500`
- Error: `#FF3B30`
- Fondo: `#F2F2F7`
- Texto: `#000000`
- Texto secundario: `#8E8E93`

## IA en el proyecto

- Para asistentes (Cursor, Claude Code), priorizar `AI_GUIDELINES.md` como entrada breve.
- `CONTRIBUTING.md` y `docs/rules.es.md` contienen el detalle completo.
- Mantener `AI_GUIDELINES.md` ≤ ~120 líneas para favorecer su recuperación en contexto.

## Referencias

- Detalle ampliado: `docs/rules.es.md`.
