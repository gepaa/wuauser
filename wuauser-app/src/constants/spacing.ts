// Spacing system based on 8px grid for consistency
// Optimized for medical applications with comfortable touch targets

export const Spacing = {
  // Base unit (8px) - all spacing should be multiples of this
  base: 8,
  
  // Micro spacing (for very tight elements)
  micro: 2,
  tiny: 4,
  
  // Standard spacing scale
  xs: 8,    // 1 unit
  sm: 12,   // 1.5 units
  md: 16,   // 2 units
  lg: 20,   // 2.5 units
  xl: 24,   // 3 units
  xxl: 32,  // 4 units
  xxxl: 40, // 5 units
  huge: 48, // 6 units
  massive: 64, // 8 units
  
  // Semantic spacing (named by purpose)
  component: {
    // Padding within components
    padding: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24
    },
    
    // Margins between components
    margin: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 24,
      xl: 32
    },
    
    // Gaps in flex/grid layouts
    gap: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20
    }
  },
  
  // Layout spacing
  layout: {
    // Screen edge padding
    screenPadding: {
      horizontal: 20,
      vertical: 16
    },
    
    // Section spacing
    section: {
      small: 16,
      medium: 24,
      large: 32,
      xlarge: 40
    },
    
    // Header spacing
    header: {
      height: 88,   // Including status bar
      padding: 16,
      bottom: 20
    },
    
    // Bottom tab bar
    tabBar: {
      height: 88,
      paddingBottom: 20, // Safe area
      paddingTop: 8
    }
  },
  
  // Medical specific spacing
  medical: {
    // Card spacing optimized for medical content
    card: {
      padding: 20,
      margin: 16,
      gap: 12
    },
    
    // Vital signs display
    vitalSigns: {
      itemSpacing: 16,
      valueSpacing: 8,
      groupSpacing: 24
    },
    
    // Patient info
    patientInfo: {
      avatarMargin: 16,
      infoSpacing: 8,
      sectionGap: 20
    },
    
    // Appointment cards
    appointment: {
      cardPadding: 16,
      itemGap: 12,
      actionButtonSpacing: 8
    }
  },
  
  // Touch targets (especially important for older users)
  touchTarget: {
    // Minimum touch target size (44px is iOS HIG standard)
    minimum: 44,
    comfortable: 48,  // More comfortable for older users
    large: 56,        // For primary actions
    
    // Spacing around touch targets
    spacing: 8,
    margin: 12
  },
  
  // Animation/interaction spacing
  animation: {
    // Spacing for elements that animate
    transform: 4,
    hover: 2,
    press: -1
  }
} as const;

// Border radius system for consistent rounded corners
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,  // For circular elements
  
  // Semantic border radius
  button: {
    small: 6,
    medium: 8,
    large: 12,
    pill: 9999
  },
  
  card: {
    small: 8,
    medium: 12,
    large: 16
  },
  
  input: {
    default: 8,
    large: 12
  },
  
  modal: {
    default: 16,
    large: 20
  }
} as const;

// Shadow system for elevation
export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  
  xs: {
    shadowColor: '#1A1D29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  },
  
  sm: {
    shadowColor: '#1A1D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  
  md: {
    shadowColor: '#1A1D29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8
  },
  
  lg: {
    shadowColor: '#1A1D29',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 16
  },
  
  xl: {
    shadowColor: '#1A1D29',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 24
  }
} as const;

// Helper functions for common spacing patterns
export const SpacingHelpers = {
  // Get horizontal padding
  paddingHorizontal: (size: keyof typeof Spacing) => ({
    paddingHorizontal: Spacing[size] || Spacing.md
  }),
  
  // Get vertical padding  
  paddingVertical: (size: keyof typeof Spacing) => ({
    paddingVertical: Spacing[size] || Spacing.md
  }),
  
  // Get all padding
  padding: (size: keyof typeof Spacing) => ({
    padding: Spacing[size] || Spacing.md
  }),
  
  // Get horizontal margin
  marginHorizontal: (size: keyof typeof Spacing) => ({
    marginHorizontal: Spacing[size] || Spacing.md
  }),
  
  // Get vertical margin
  marginVertical: (size: keyof typeof Spacing) => ({
    marginVertical: Spacing[size] || Spacing.md
  }),
  
  // Get all margin
  margin: (size: keyof typeof Spacing) => ({
    margin: Spacing[size] || Spacing.md
  }),
  
  // Touch target with minimum size
  touchTarget: (size: 'minimum' | 'comfortable' | 'large' = 'comfortable') => ({
    minHeight: Spacing.touchTarget[size],
    minWidth: Spacing.touchTarget[size],
    justifyContent: 'center',
    alignItems: 'center'
  })
} as const;

export default Spacing;