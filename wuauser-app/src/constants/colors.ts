export const Colors = {
  // Medical Professional Palette - Updated
  primary: '#00A67E',      // Verde médico más profesional
  secondary: '#FF8A00',    // Naranja médico para acciones importantes  
  accent: '#00BCD4',       // Turquesa médico para elementos destacados
  
  // Backgrounds
  background: '#F8FAFB',   // Fondo principal muy suave
  surface: '#FFFFFF',      // Tarjetas y superficies elevadas
  overlay: 'rgba(0, 0, 0, 0.05)', // Overlays sutiles
  
  // Status Colors - Medical Grade
  success: '#00C853',      // Verde éxito médico
  warning: '#FF8F00',      // Naranja advertencia médico
  error: '#D32F2F',        // Rojo error médico
  info: '#1976D2',         // Azul información médico
  
  // Neutral Palette
  white: '#FFFFFF',
  black: '#1A1D29',        // Negro más suave
  
  // Gray Scale (8-level system)
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A'
  },
  
  // Text Hierarchy
  text: {
    primary: '#1A1D29',     // Texto principal más legible
    secondary: '#64748B',   // Texto secundario
    tertiary: '#94A3B8',    // Texto terciario/hints
    disabled: '#CBD5E1',    // Texto deshabilitado
    inverse: '#FFFFFF'      // Texto sobre fondos oscuros
  },
  
  // Border System
  border: {
    light: '#F1F5F9',       // Bordes muy sutiles
    default: '#E2E8F0',     // Bordes normales
    medium: '#CBD5E1',      // Bordes más visibles
    dark: '#94A3B8'         // Bordes destacados
  },
  
  // Veterinary Specific Colors - Professional
  medical: {
    consultation: '#1976D2',  // Azul consulta profesional
    vaccination: '#00C853',   // Verde vacunación médico
    surgery: '#D32F2F',       // Rojo cirugía médico
    emergency: '#FF3D00',     // Rojo emergencia urgente
    preventive: '#7B1FA2',    // Púrpura preventivo médico
    followUp: '#00ACC1'       // Turquesa seguimiento médico
  },
  
  // Interaction States - Updated
  interaction: {
    hover: 'rgba(0, 166, 126, 0.08)',
    pressed: 'rgba(0, 166, 126, 0.12)',
    focus: 'rgba(0, 166, 126, 0.16)',
    disabled: 'rgba(148, 163, 184, 0.12)'
  }
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