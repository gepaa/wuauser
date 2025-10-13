import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ownerTheme } from '../../constants/ownerTheme';

interface QuickActionButtonProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'emergency' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  customStyle?: ViewStyle;
  customTextStyle?: TextStyle;
  badge?: number | string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  customStyle,
  customTextStyle,
  badge,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { stiffness: 400, damping: 10 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, { stiffness: 400, damping: 10 });
    }
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  React.useEffect(() => {
    opacity.value = withTiming(disabled ? 0.6 : 1, { duration: 200 });
  }, [disabled]);

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[size],
    customStyle,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    customTextStyle,
  ];

  const iconSize = size === 'small' ? 20 : size === 'medium' ? 24 : 28;
  const iconColor = variant === 'outline' || variant === 'secondary' 
    ? ownerTheme.colors.textSecondary 
    : ownerTheme.colors.textInverse;

  return (
    <AnimatedTouchableOpacity
      style={[containerStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.95}
    >
      <Animated.View style={styles.content}>
        <Animated.View style={styles.iconContainer}>
          <Ionicons 
            name={icon} 
            size={iconSize} 
            color={iconColor} 
          />
          {badge && (
            <Animated.View style={styles.badge}>
              <Text style={styles.badgeText}>
                {typeof badge === 'number' && badge > 99 ? '99+' : badge}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
        <Text style={textStyle} numberOfLines={2}>
          {title}
        </Text>
      </Animated.View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: ownerTheme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...ownerTheme.shadows.small,
  },
  
  // Variants
  primary: {
    backgroundColor: ownerTheme.colors.primary,
  },
  secondary: {
    backgroundColor: ownerTheme.colors.secondary,
  },
  emergency: {
    backgroundColor: ownerTheme.colors.accent,
  },
  outline: {
    backgroundColor: ownerTheme.colors.card,
    borderWidth: 1.5,
    borderColor: ownerTheme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Sizes
  small: {
    height: 80,
    paddingHorizontal: ownerTheme.spacing.sm,
    paddingVertical: ownerTheme.spacing.sm,
  },
  medium: {
    height: 100,
    paddingHorizontal: ownerTheme.spacing.md,
    paddingVertical: ownerTheme.spacing.md,
  },
  large: {
    height: 120,
    paddingHorizontal: ownerTheme.spacing.lg,
    paddingVertical: ownerTheme.spacing.lg,
  },
  
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  
  iconContainer: {
    position: 'relative',
    marginBottom: ownerTheme.spacing.xs,
  },
  
  text: {
    textAlign: 'center',
    ...ownerTheme.typography.caption,
  },
  
  // Text variants
  text_primary: {
    color: ownerTheme.colors.textInverse,
  },
  text_secondary: {
    color: ownerTheme.colors.textInverse,
  },
  text_emergency: {
    color: ownerTheme.colors.textInverse,
  },
  text_outline: {
    color: ownerTheme.colors.textPrimary,
  },
  
  // Text sizes
  text_small: {
    ...ownerTheme.typography.small,
  },
  text_medium: {
    ...ownerTheme.typography.caption,
  },
  text_large: {
    ...ownerTheme.typography.body,
  },
  
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: ownerTheme.colors.accent,
    borderRadius: ownerTheme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  
  badgeText: {
    color: ownerTheme.colors.textInverse,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
});