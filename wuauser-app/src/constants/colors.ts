export const Colors = {
  primary: '#F4B740',      // Amarillo/dorado del logo
  secondary: '#E85D4E',    // Rojo/naranja para acentos
  background: '#FFF8E7',   // Fondo crema claro
  white: '#FFFFFF',
  black: '#2C3E50',
  gray: '#95A5A6',
  success: '#27AE60',
  error: '#E74C3C',
  text: {
    primary: '#2C3E50',
    secondary: '#7F8C8D',
    light: '#BDC3C7'
  },
  border: '#ECF0F1'
} as const;

// Legacy export for backward compatibility
export const colors = {
  primary: '#F4B740',
  secondary: '#E85D4E', 
  background: '#FFF8E7',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#ECF0F1',
  error: '#E74C3C',
  white: '#FFFFFF'
} as const;