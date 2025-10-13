import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Options para configurar el haptic feedback
const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const HapticFeedback = {
  // Feedback ligero para interacciones sutiles (hover, focus)
  light: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  },

  // Feedback medio para acciones normales (tap, select)
  medium: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  },

  // Feedback fuerte para acciones importantes (confirm, delete)
  heavy: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    }
  },

  // Success feedback para confirmaciones exitosas
  success: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    }
  },

  // Warning feedback para advertencias
  warning: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    }
  },

  // Error feedback para errores
  error: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationError', options);
    }
  },

  // Selection feedback para cambios de selección
  selection: () => {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('selection', options);
    }
  },
};