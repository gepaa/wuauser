import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import { Animations } from '../constants/animations';

interface AnimatedButtonProps {
  // Content
  title: string;
  subtitle?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
  
  // Behavior
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  
  // Styling
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'medical';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  fullWidth?: boolean;
  
  // Animation
  animationType?: 'scale' | 'fade' | 'bounce' | 'none';
  hapticFeedback?: boolean;
  
  // Custom styles
  style?: ViewStyle;
  textStyle?: TextStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  onPress,
  onLongPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  animationType = 'scale',
  hapticFeedback = true,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const isDisabled = disabled || loading;
  
  // Animation handlers
  const handlePressIn = () => {
    if (isDisabled) return;
    
    if (animationType === 'scale') {
      Animated.timing(scaleAnim, {
        ...Animations.microInteractions.buttonPress,
        toValue: 0.96,
      }).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityAnim, {
        ...Animations.microInteractions.buttonPress,
        toValue: 0.8,
      }).start();
    }
  };
  
  const handlePressOut = () => {
    if (isDisabled) return;
    
    if (animationType === 'scale') {
      Animated.timing(scaleAnim, {
        ...Animations.microInteractions.buttonRelease,
        toValue: 1,
      }).start();
    } else if (animationType === 'fade') {
      Animated.timing(opacityAnim, {
        ...Animations.microInteractions.buttonRelease,
        toValue: 1,
      }).start();
    }
  };
  
  const handlePress = (event: GestureResponderEvent) => {
    if (isDisabled) return;
    
    // Haptic feedback
    if (hapticFeedback) {
      // Would use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) in real app
    }
    
    // Bounce animation for important actions
    if (animationType === 'bounce') {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          duration: 100,
          toValue: 0.95,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    onPress?.(event);
  };
  
  // Style getters
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.button.medium,
      ...Shadow.sm,
    };
    
    // Size variations
    const sizeStyles = {
      small: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        minHeight: 44,
      },
      large: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        minHeight: 52,
      },
      xlarge: {
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.lg,
        minHeight: 60,
      }
    };
    
    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: Colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: Colors.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        ...Shadow.none,
      },
      danger: {
        backgroundColor: Colors.error,
        borderWidth: 0,
      },
      medical: {
        backgroundColor: Colors.accent,
        borderWidth: 0,
      }
    };
    
    // Disabled style
    const disabledStyle = isDisabled ? {
      backgroundColor: Colors.gray[200],
      borderColor: Colors.gray[200],
      ...Shadow.none,
    } : {};
    
    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...(fullWidth && { width: '100%' }),
    };
  };
  
  const getTextColor = (): string => {
    if (isDisabled) return Colors.gray[400];
    
    switch (variant) {
      case 'primary':
      case 'secondary': 
      case 'danger':
      case 'medical':
        return Colors.text.inverse;
      case 'outline':
        return Colors.primary;
      case 'ghost':
        return Colors.text.primary;
      default:
        return Colors.text.inverse;
    }
  };
  
  const getIconSize = (): number => {
    switch (size) {
      case 'small': return 16;
      case 'medium': return 18;
      case 'large': return 20;
      case 'xlarge': return 22;
      default: return 18;
    }
  };
  
  const getTextStyle = (): TextStyle => {
    const baseTextStyle = size === 'small' 
      ? Typography.label.medium
      : Typography.label.large;
    
    return {
      ...baseTextStyle,
      color: getTextColor(),
      fontFamily: Typography.label.large.fontFamily, // Always medium weight for buttons
      textAlign: 'center',
      ...textStyle,
    };
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={getTextColor()} 
          style={{ marginRight: title ? Spacing.xs : 0 }}
        />
      );
    }
    
    const iconElement = icon ? (
      <Ionicons 
        name={icon as any} 
        size={getIconSize()} 
        color={getTextColor()} 
        style={{
          marginRight: iconPosition === 'left' && title ? Spacing.xs : 0,
          marginLeft: iconPosition === 'right' && title ? Spacing.xs : 0,
        }}
      />
    ) : null;
    
    const textElement = title ? (
      <Text style={getTextStyle()}>
        {title}
      </Text>
    ) : null;
    
    const subtitleElement = subtitle ? (
      <Text style={[getTextStyle(), { 
        fontSize: getTextStyle().fontSize! - 2,
        opacity: 0.8,
        marginTop: 2 
      }]}>
        {subtitle}
      </Text>
    ) : null;
    
    if (subtitle) {
      return (
        <>
          {iconPosition === 'left' && iconElement}
          <View style={{ alignItems: 'center' }}>
            {textElement}
            {subtitleElement}
          </View>
          {iconPosition === 'right' && iconElement}
        </>
      );
    }
    
    return (
      <>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </>
    );
  };
  
  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };
  
  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={[styles.button, getButtonStyle()]}
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    // Base styles are handled by getButtonStyle()
  },
});

export default AnimatedButton;