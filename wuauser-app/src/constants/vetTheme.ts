export const vetTheme = {
  colors: {
    primary: '#2ECC71',      // Verde médico
    secondary: '#3498DB',    // Azul confianza  
    accent: '#F39C12',       // Naranja alertas
    danger: '#E74C3C',       // Rojo emergencias
    background: '#FFFFFF',   // Fondo blanco
    surface: '#F8F9FA',      // Gris muy claro
    text: {
      primary: '#2C3E50',    // Texto principal
      secondary: '#7F8C8D',  // Texto secundario
      light: '#BDC3C7',      // Texto claro
      inverse: '#FFFFFF',    // Texto sobre fondos oscuros
    },
    border: {
      light: '#ECF0F1',      // Bordes sutiles
      medium: '#BDC3C7',     // Bordes normales
      dark: '#95A5A6',       // Bordes destacados
    },
    status: {
      success: '#27AE60',    // Verde éxito
      warning: '#E67E22',    // Naranja advertencia
      error: '#C0392B',      // Rojo error
      info: '#2980B9',       // Azul información
    }
  },
  spacing: {
    xs: 4,
    sm: 8, 
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    weights: {
      normal: '400' as '400',
      medium: '500' as '500',
      semiBold: '600' as '600',
      bold: '700' as '700',
    },
  },
} as const;

export type VetTheme = typeof vetTheme;