# WUAUSER – Reglas para la IA (TL;DR)

- **Stack**: React Native + Expo 49+, React Navigation 6, React Hook Form, TanStack Query, Supabase (Auth/DB/Storage), TypeScript, UI Kit: NativeBase o Tamagui, Maps: react-native-maps.
- **Estructura**: `src/{screens,components,services,hooks,utils,types,constants,navigation}`.
- **Naming**: Componentes `PascalCase`, funciones `camelCase`, constantes `UPPER_SNAKE`.
- **Límites**: funciones ≤ 50 líneas, archivos ≤ 200 líneas.
- **TypeScript**: sin `any` (usar `unknown` si aplica). Todo tipado.
- **Async**: `try/catch` siempre, con estados de carga y errores visibles.
- **Formularios**: React Hook Form + validación en tiempo real; prevenir doble submit.
- **Estado**: `useState` simple, `useReducer` complejo, datos remoto: React Query. No Redux.
- **UX**: mensajes de error en español MX; feedback visual en cada acción.
- **Diseño**: Colores → primario `#007AFF`, secundario `#FF3B30`, éxito `#34C759`, warning `#FF9500`, error `#FF3B30`, fondo `#F2F2F7`, texto `#000` / `#8E8E93`.

## Do / Don't

- **Do**:
  - Implementa servicios con Supabase y manejo de errores explícito.
  - Divide componentes (hooks → lógica → JSX) y tipa props.
  - Escribe comentarios en español cuando aclaren intención.
- **Don't**:
  - No uses `any`. No añadas Redux. No ignores loading/errors.

## Patrones

```ts
// Componente
interface Props {}
export const NombreComponente: React.FC<Props> = (props) => {
  // 1. hooks
  // 2. lógica
  // 3. return JSX
  return null;
};
```

```ts
// Servicio Supabase
export const nombreServicio = async (): Promise<Tipo> => {
  try {
    const { data, error } = await supabase.from('tabla').select('*');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Error específico:', e);
    throw e;
  }
};
```

Referencias detalladas: ver `CONTRIBUTING.md` y `docs/rules.es.md`.
