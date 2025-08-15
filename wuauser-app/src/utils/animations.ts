import { 
  withSpring, 
  withTiming, 
  withSequence, 
  runOnJS,
  SharedValue,
  AnimatedStyle,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// Animation configurations
export const springConfig = {
  damping: 15,
  stiffness: 200,
  mass: 1,
};

export const timingConfig = {
  duration: 300,
};

// Common animations
export const fadeIn = (value: SharedValue<number>, duration = 300) => {
  'worklet';
  value.value = withTiming(1, { duration });
};

export const fadeOut = (value: SharedValue<number>, duration = 300) => {
  'worklet';
  value.value = withTiming(0, { duration });
};

export const scaleIn = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSpring(1, springConfig);
};

export const scaleOut = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSpring(0.8, springConfig);
};

export const slideIn = (value: SharedValue<number>, from = -100) => {
  'worklet';
  value.value = withSpring(0, springConfig);
};

export const slideOut = (value: SharedValue<number>, to = -100) => {
  'worklet';
  value.value = withTiming(to, timingConfig);
};

// Button press animation
export const buttonPressAnimation = (scale: SharedValue<number>) => {
  'worklet';
  scale.value = withSequence(
    withTiming(0.95, { duration: 100 }),
    withSpring(1, { damping: 12, stiffness: 200 })
  );
};

// Fade and scale animation combined
export const fadeScaleIn = (
  opacity: SharedValue<number>, 
  scale: SharedValue<number>,
  delay = 0
) => {
  'worklet';
  opacity.value = withTiming(1, { duration: 300 });
  scale.value = withSpring(1, { ...springConfig, delay });
};

export const fadeScaleOut = (
  opacity: SharedValue<number>, 
  scale: SharedValue<number>,
  onComplete?: () => void
) => {
  'worklet';
  opacity.value = withTiming(0, { duration: 200 });
  scale.value = withTiming(0.8, { duration: 200 }, () => {
    if (onComplete) {
      runOnJS(onComplete)();
    }
  });
};

// Stagger animation for lists
export const createStaggerAnimation = (
  items: number,
  delay = 100
) => {
  return Array.from({ length: items }, (_, index) => ({
    delay: index * delay,
    animation: 'fadeInUp'
  }));
};

// Bounce animation
export const bounceIn = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSequence(
    withTiming(1.2, { duration: 200 }),
    withSpring(1, { damping: 8, stiffness: 300 })
  );
};

// Shake animation
export const shake = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSequence(
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

// Page transition animations
export const slideInFromRight = (progress: SharedValue<number>) => {
  'worklet';
  return useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [300, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      progress.value,
      [0, 0.3, 1],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    ),
  }));
};

export const slideInFromLeft = (progress: SharedValue<number>) => {
  'worklet';
  return useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-300, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      progress.value,
      [0, 0.3, 1],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    ),
  }));
};

export const slideInFromBottom = (progress: SharedValue<number>) => {
  'worklet';
  return useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [100, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0.8, 1],
      Extrapolate.CLAMP
    ),
  }));
};

// Pulse animation
export const pulse = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSequence(
    withTiming(1.1, { duration: 150 }),
    withTiming(1, { duration: 150 })
  );
};

// Loading skeleton animation
export const createSkeletonAnimation = () => {
  const progress = useSharedValue(0);
  
  const startAnimation = () => {
    progress.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 1000 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
      Extrapolate.CLAMP
    ),
  }));

  return { startAnimation, animatedStyle, progress };
};

// Animated counter
export const animateCounter = (
  value: SharedValue<number>,
  targetValue: number,
  duration = 1000
) => {
  'worklet';
  value.value = withTiming(targetValue, { duration });
};

// Spring configs for different use cases
export const softSpring = {
  damping: 20,
  stiffness: 90,
  mass: 1,
};

export const bouncySpring = {
  damping: 8,
  stiffness: 200,
  mass: 1,
};

export const stiffSpring = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

// Helper function to create fade in animation
export const useFadeIn = (delay = 0) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const startAnimation = () => {
    opacity.value = withTiming(1, { duration: 400, ...{ delay } });
    translateY.value = withSpring(0, { ...springConfig, delay });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return { startAnimation, animatedStyle, opacity, translateY };
};

// Helper function for button press feedback
export const useButtonPress = () => {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { onPressIn, onPressOut, animatedStyle, scale };
};