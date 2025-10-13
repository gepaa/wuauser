import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ownerTheme } from '../../constants/ownerTheme';

interface PremiumCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  customStyle?: ViewStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  interactive = true,
  customStyle,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(ownerTheme.shadows.small.shadowOpacity);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    if (interactive) {
      scale.value = withSpring(0.98, { stiffness: 400, damping: 10 });
      shadowOpacity.value = withTiming(ownerTheme.shadows.medium.shadowOpacity, { duration: 150 });
    }
    onPressIn?.();
  };

  const handlePressOut = () => {
    if (interactive) {
      scale.value = withSpring(1, { stiffness: 400, damping: 10 });
      shadowOpacity.value = withTiming(ownerTheme.shadows.small.shadowOpacity, { duration: 150 });
    }
    onPressOut?.();
  };

  const handlePress = () => {
    onPress?.();
  };

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[size],
    customStyle,
  ];

  if (interactive && onPress) {
    return (
      <AnimatedTouchableOpacity
        style={[containerStyle, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        {...props}
      >
        {children}
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: ownerTheme.borderRadius.md,
    ...ownerTheme.shadows.small,
  },
  
  // Variants
  default: {
    backgroundColor: ownerTheme.colors.card,
    borderWidth: 0,
  },
  elevated: {
    backgroundColor: ownerTheme.colors.card,
    ...ownerTheme.shadows.medium,
  },
  outlined: {
    backgroundColor: ownerTheme.colors.card,
    borderWidth: 1,
    borderColor: ownerTheme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  small: {
    padding: ownerTheme.spacing.sm,
    minHeight: 60,
  },
  medium: {
    padding: ownerTheme.spacing.md,
    minHeight: ownerTheme.dimensions.cardMinHeight,
  },
  large: {
    padding: ownerTheme.spacing.lg,
    minHeight: 120,
  },
});