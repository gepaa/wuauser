import { Platform } from 'react-native';

// Font families optimized for medical/professional apps
const fontFamily = {
  // Primary: Inter (excellent for UI, very readable)
  regular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter_400Regular',
    default: 'System'
  }),
  medium: Platform.select({
    ios: 'Inter-Medium', 
    android: 'Inter_500Medium',
    default: 'System'
  }),
  semiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter_600SemiBold', 
    default: 'System'
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter_700Bold',
    default: 'System'
  }),
  
  // Secondary: SF Pro Display for iOS, Roboto for Android
  display: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System'
  }),
  
  // Monospace for medical IDs, codes
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'Roboto Mono',
    default: 'monospace'
  })
};

// Type scale optimized for medical professionals (larger sizes for better readability)
export const Typography = {
  // Display styles (for headers, important announcements)
  display: {
    large: {
      fontSize: 32,
      lineHeight: 40,
      fontFamily: fontFamily.bold,
      letterSpacing: -0.5
    },
    medium: {
      fontSize: 28,
      lineHeight: 36,
      fontFamily: fontFamily.bold,
      letterSpacing: -0.25
    },
    small: {
      fontSize: 24,
      lineHeight: 32,
      fontFamily: fontFamily.semiBold,
      letterSpacing: 0
    }
  },
  
  // Headline styles (for section headers)
  headline: {
    large: {
      fontSize: 22,
      lineHeight: 28,
      fontFamily: fontFamily.semiBold,
      letterSpacing: 0
    },
    medium: {
      fontSize: 20,
      lineHeight: 26,
      fontFamily: fontFamily.semiBold,
      letterSpacing: 0.15
    },
    small: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.15
    }
  },
  
  // Title styles (for card titles, important text)
  title: {
    large: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.15
    },
    medium: {
      fontSize: 16,
      lineHeight: 20,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.15
    },
    small: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.1
    }
  },
  
  // Body styles (for main content)
  body: {
    large: {
      fontSize: 17,   // Larger for better readability by older vets
      lineHeight: 24,
      fontFamily: fontFamily.regular,
      letterSpacing: 0.1
    },
    medium: {
      fontSize: 16,   // Standard readable size
      lineHeight: 22,
      fontFamily: fontFamily.regular,
      letterSpacing: 0.1
    },
    small: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontFamily.regular,
      letterSpacing: 0.1
    }
  },
  
  // Label styles (for buttons, tabs, small UI text)
  label: {
    large: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.1
    },
    medium: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.1
    },
    small: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.1
    }
  },
  
  // Caption styles (for timestamps, secondary info)
  caption: {
    large: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontFamily.regular,
      letterSpacing: 0.2
    },
    medium: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontFamily.regular,
      letterSpacing: 0.4
    },
    small: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontFamily.regular,
      letterSpacing: 0.4
    }
  },
  
  // Special styles for medical context
  medical: {
    // For patient names, critical info
    patientName: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: fontFamily.semiBold,
      letterSpacing: 0.15
    },
    
    // For medical IDs, codes
    medicalCode: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontFamily.mono,
      letterSpacing: 0.5
    },
    
    // For vital signs, measurements
    vitalSigns: {
      fontSize: 20,
      lineHeight: 24,
      fontFamily: fontFamily.bold,
      letterSpacing: -0.1
    },
    
    // For dosage, prescriptions
    dosage: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontFamily.medium,
      letterSpacing: 0.1
    }
  }
} as const;

// Helper function to create text style with color
export const createTextStyle = (
  typographyStyle: any, 
  color: string,
  additionalProps: any = {}
) => ({
  ...typographyStyle,
  color,
  ...additionalProps
});

// Common text style combinations
export const TextStyles = {
  // Primary heading
  h1: (color: string = '#1A1D29') => createTextStyle(Typography.headline.large, color),
  h2: (color: string = '#1A1D29') => createTextStyle(Typography.headline.medium, color),
  h3: (color: string = '#1A1D29') => createTextStyle(Typography.headline.small, color),
  
  // Body text
  body: (color: string = '#64748B') => createTextStyle(Typography.body.medium, color),
  bodyLarge: (color: string = '#64748B') => createTextStyle(Typography.body.large, color),
  bodySmall: (color: string = '#94A3B8') => createTextStyle(Typography.body.small, color),
  
  // Labels and captions
  label: (color: string = '#475569') => createTextStyle(Typography.label.medium, color),
  caption: (color: string = '#94A3B8') => createTextStyle(Typography.caption.medium, color),
  
  // Medical specific
  patientName: (color: string = '#1A1D29') => createTextStyle(Typography.medical.patientName, color),
  vitalSigns: (color: string = '#2ECC71') => createTextStyle(Typography.medical.vitalSigns, color),
  
  // Interactive elements
  button: (color: string = '#FFFFFF') => createTextStyle(Typography.label.large, color, {
    textAlign: 'center',
    fontFamily: fontFamily.semiBold
  }),
  
  // Links
  link: (color: string = '#2ECC71') => createTextStyle(Typography.body.medium, color, {
    textDecorationLine: 'underline'
  })
} as const;

export default Typography;