import { Platform } from 'react-native';

// Sistema de diseño profesional para dueños de mascotas
export const ownerTheme = {
  colors: {
    // Paleta principal inspirada en pet care
    primary: '#F4B740',        // Dorado cálido (mascota feliz)
    primaryLight: '#F7C96B',   // Variante más clara
    primaryDark: '#E09E1A',    // Variante más oscura
    
    // Colores secundarios
    secondary: '#4A90E2',      // Azul confianza
    accent: '#FF6B6B',         // Coral para alertas/emergencias  
    success: '#2ECC71',        // Verde para confirmaciones
    warning: '#F39C12',        // Naranja para advertencias
    error: '#E74C3C',          // Rojo para errores
    
    // Neutros profesionales
    background: '#FFFFFF',      // Fondo principal
    surface: '#FAFBFC',        // Superficie elevada
    card: '#FFFFFF',           // Fondo de tarjetas
    
    // Textos
    textPrimary: '#1A1A1A',    // Texto principal
    textSecondary: '#6B7280',  // Texto secundario
    textLight: '#9CA3AF',      // Texto sutil
    textInverse: '#FFFFFF',    // Texto sobre fondos oscuros
    
    // Nested text structure for compatibility
    text: {
      primary: '#1A1A1A',      // Texto principal
      secondary: '#6B7280',    // Texto secundario
      light: '#9CA3AF',        // Texto sutil
      inverse: '#FFFFFF',      // Texto sobre fondos oscuros
    },
    
    // Bordes y separadores
    border: '#E5E7EB',         // Bordes sutiles
    divider: '#F3F4F6',       // Separadores
    
    // Estados especiales
    overlay: 'rgba(0, 0, 0, 0.5)',     // Overlay para modales
    disabled: '#D1D5DB',                // Elementos deshabilitados
    placeholder: '#9CA3AF',             // Texto placeholder
  },
  
  // Tipografía escalada profesionalmente
  typography: {
    h1: { 
      fontSize: 28, 
      fontWeight: '700' as const, 
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    h2: { 
      fontSize: 24, 
      fontWeight: '600' as const, 
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    h3: { 
      fontSize: 20, 
      fontWeight: '600' as const, 
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: { 
      fontSize: 16, 
      fontWeight: '400' as const, 
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    caption: { 
      fontSize: 14, 
      fontWeight: '500' as const, 
      lineHeight: 20,
    },
    small: { 
      fontSize: 12, 
      fontWeight: '400' as const, 
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    // Adding sizes for compatibility
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
      normal: '400' as const,
      medium: '500' as const,
      semiBold: '600' as const,
      bold: '700' as const,
    },
  },
  
  // Espaciado consistente basado en 8pt grid
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Border radius coherente
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 999,
  },
  
  // Sombras profesionales
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  // Dimensiones estándar
  dimensions: {
    // Botones
    buttonHeight: 48,
    buttonHeightSmall: 36,
    buttonHeightLarge: 56,
    
    // Headers y navegación
    headerHeight: Platform.OS === 'ios' ? 44 : 56,
    tabBarHeight: Platform.OS === 'ios' ? 49 : 56,
    
    // Cards y containers
    cardMinHeight: 80,
    avatarSizeMini: 24,
    avatarSizeSmall: 32,
    avatarSizeMedium: 48,
    avatarSizeLarge: 64,
    avatarSizeXL: 80,
    
    // Iconos
    iconSizeSmall: 16,
    iconSizeMedium: 24,
    iconSizeLarge: 32,
    iconSizeXL: 40,
  },
  
  // Configuración de animaciones
  animations: {
    // Duraciones en millisegundos
    fast: 150,
    normal: 250,
    slow: 350,
    
    // Spring configurations for react-native-reanimated
    spring: {
      stiffness: 400,
      damping: 30,
      mass: 1,
    },
    gentleSpring: {
      stiffness: 300,
      damping: 35,
      mass: 1,
    },
    
    // Easing curves
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  
  // Gradientes para elementos especiales
  gradients: {
    primary: ['#F7C96B', '#F4B740'],
    secondary: ['#5DA3F4', '#4A90E2'],
    success: ['#3BD671', '#2ECC71'],
    warning: ['#FFB347', '#F39C12'],
    sunset: ['#FF8A80', '#FF6B6B'],
  },
} as const;

// Tipo para autocompletado
export type OwnerTheme = typeof ownerTheme;

// Helper functions para uso fácil
export const getSpacing = (size: keyof typeof ownerTheme.spacing) => ownerTheme.spacing[size];
export const getColor = (color: keyof typeof ownerTheme.colors) => ownerTheme.colors[color];
export const getBorderRadius = (size: keyof typeof ownerTheme.borderRadius) => ownerTheme.borderRadius[size];
export const getShadow = (size: keyof typeof ownerTheme.shadows) => ownerTheme.shadows[size];