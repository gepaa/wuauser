import { Easing } from 'react-native';

// Animation timing and easing curves for consistent motion design
export const Animations = {
  // Duration constants
  duration: {
    instant: 0,
    fast: 150,      // For micro-interactions
    normal: 250,    // Standard UI animations  
    slow: 400,      // For complex transitions
    slower: 600,    // For large screen transitions
    slowest: 800    // For dramatic reveals
  },
  
  // Easing curves (Material Design inspired)
  easing: {
    // Standard easing - most common
    standard: Easing.out(Easing.cubic),
    
    // Decelerate - elements entering screen
    decelerate: Easing.out(Easing.quad),
    
    // Accelerate - elements leaving screen  
    accelerate: Easing.in(Easing.quad),
    
    // Emphasized - for important transitions
    emphasized: Easing.bezier(0.2, 0, 0, 1),
    
    // Bounce - for playful interactions
    bounce: Easing.bounce,
    
    // Linear - for continuous animations
    linear: Easing.linear,
    
    // Elastic - for attention-grabbing animations
    elastic: Easing.elastic(2)
  },
  
  // Common animation presets
  presets: {
    // Fade animations
    fadeIn: {
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    
    fadeOut: {
      duration: 200,
      easing: Easing.in(Easing.cubic), 
      useNativeDriver: true
    },
    
    // Scale animations (for buttons, cards)
    scaleIn: {
      duration: 300,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true
    },
    
    scaleOut: {
      duration: 150,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true
    },
    
    // Slide animations (for modals, screens)
    slideInUp: {
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    
    slideOutDown: {
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    },
    
    slideInRight: {
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    
    slideOutLeft: {
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    }
  },
  
  // Medical specific animations (gentler, more professional)
  medical: {
    // Gentle fade for patient data
    patientDataReveal: {
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    },
    
    // Smooth scale for vital signs
    vitalSignsUpdate: {
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    
    // Calm slide for appointment cards
    appointmentSlide: {
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    },
    
    // Subtle bounce for notifications
    notificationBounce: {
      duration: 600,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true
    }
  },
  
  // Micro-interactions
  microInteractions: {
    // Button press
    buttonPress: {
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    },
    
    // Button release
    buttonRelease: {
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    
    // Checkbox toggle
    checkboxToggle: {
      duration: 200,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true
    },
    
    // Switch toggle
    switchToggle: {
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Can't use native driver for layout properties
    },
    
    // Card hover
    cardHover: {
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }
  },
  
  // Loading animations
  loading: {
    // Skeleton shimmer
    shimmer: {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
      loop: -1 // Infinite loop
    },
    
    // Spinner rotation
    spinner: {
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
      loop: -1
    },
    
    // Pulse effect
    pulse: {
      duration: 1200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
      loop: -1
    }
  },
  
  // Gesture animations
  gestures: {
    // Swipe to dismiss
    swipeToHide: {
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    },
    
    // Pull to refresh
    pullToRefresh: {
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false
    },
    
    // Pan gesture return
    panReturn: {
      duration: 400,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true
    }
  }
} as const;

// Animation sequences for complex multi-step animations
export const AnimationSequences = {
  // Staggered list entrance
  staggeredEntrance: (items: number, delay: number = 50) => 
    Array.from({ length: items }, (_, index) => ({
      delay: index * delay,
      ...Animations.presets.fadeIn
    })),
  
  // Card flip animation
  cardFlip: [
    {
      duration: Animations.duration.normal / 2,
      easing: Animations.easing.accelerate,
      useNativeDriver: true
    },
    {
      duration: Animations.duration.normal / 2,
      easing: Animations.easing.decelerate, 
      useNativeDriver: true
    }
  ],
  
  // Modal entrance sequence
  modalEntrance: [
    {
      // Background fade
      duration: Animations.duration.fast,
      easing: Animations.easing.decelerate,
      useNativeDriver: true
    },
    {
      // Modal slide up
      delay: Animations.duration.fast / 2,
      duration: Animations.duration.normal,
      easing: Animations.easing.emphasized,
      useNativeDriver: true
    }
  ]
} as const;

// Helper functions for creating common animations
export const AnimationHelpers = {
  // Create fade animation
  createFade: (
    toValue: number,
    duration: number = Animations.duration.normal,
    easing = Animations.easing.standard
  ) => ({
    toValue,
    duration,
    easing,
    useNativeDriver: true
  }),
  
  // Create scale animation
  createScale: (
    toValue: number,
    duration: number = Animations.duration.normal,
    easing = Animations.easing.standard
  ) => ({
    toValue,
    duration,
    easing,
    useNativeDriver: true
  }),
  
  // Create slide animation
  createSlide: (
    toValue: number,
    duration: number = Animations.duration.normal,
    easing = Animations.easing.standard
  ) => ({
    toValue,
    duration,
    easing,
    useNativeDriver: true
  }),
  
  // Create spring animation
  createSpring: (
    toValue: number,
    tension: number = 100,
    friction: number = 8
  ) => ({
    toValue,
    tension,
    friction,
    useNativeDriver: true
  }),
  
  // Create timing with config
  createTiming: (
    toValue: number,
    config: {
      duration?: number;
      easing?: any;
      delay?: number;
      useNativeDriver?: boolean;
    } = {}
  ) => ({
    toValue,
    duration: Animations.duration.normal,
    easing: Animations.easing.standard,
    useNativeDriver: true,
    ...config
  })
} as const;

export default Animations;