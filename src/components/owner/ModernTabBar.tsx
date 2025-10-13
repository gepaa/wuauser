import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ownerTheme } from '../../constants/ownerTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabConfig {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

const tabConfigs: Record<string, TabConfig> = {
  'Inicio': {
    name: 'Inicio',
    label: 'Inicio',
    icon: 'home-outline',
    iconFocused: 'home',
  },
  'MisMascotas': {
    name: 'MisMascotas',
    label: 'Mascotas',
    icon: 'heart-outline',
    iconFocused: 'heart',
  },
  'ChatList': {
    name: 'ChatList',
    label: 'Mensajes',
    icon: 'chatbubbles-outline',
    iconFocused: 'chatbubbles',
  },
  'Mapa': {
    name: 'Mapa',
    label: 'Buscar',
    icon: 'search-outline',
    iconFocused: 'search',
  },
  'Perfil': {
    name: 'Perfil',
    label: 'Perfil',
    icon: 'person-outline',
    iconFocused: 'person',
  },
};

interface TabItemProps {
  route: any;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  badge?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const TabItem: React.FC<TabItemProps> = ({ 
  route, 
  focused, 
  onPress, 
  onLongPress, 
  badge 
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const config = tabConfigs[route.name];
  if (!config) return null;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(
      focused ? 1 : 0,
      [0, 1],
      [1, 1.1],
    );

    return {
      transform: [{ scale: withSpring(iconScale) }],
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      focused ? 1 : 0,
      [0, 1],
      [0, 1],
    );

    return {
      opacity: withTiming(opacity, { duration: 200 }),
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      focused ? 1 : 0,
      [0, 1],
      [0.7, 1],
    );

    return {
      opacity: withTiming(opacity, { duration: 200 }),
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    translateY.value = withSpring(-2);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    translateY.value = withSpring(0);
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.tabItem, animatedContainerStyle]}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      {/* Background indicator */}
      <Animated.View style={[styles.backgroundIndicator, animatedBackgroundStyle]}>
        <LinearGradient
          colors={[`${ownerTheme.colors.primary}20`, `${ownerTheme.colors.primary}10`]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Icon container */}
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Ionicons
          name={focused ? config.iconFocused : config.icon}
          size={ownerTheme.dimensions.iconSizeLarge}
          color={focused ? ownerTheme.colors.primary : ownerTheme.colors.textLight}
        />
        
        {/* Badge */}
        {badge && badge > 0 && (
          <Animated.View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </Animated.View>
        )}
      </Animated.View>

      {/* Label */}
      <Animated.Text style={[styles.label, animatedLabelStyle]}>
        {config.label}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};

export const ModernTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  
  // Get unread message count from route params or state
  const getTabBadge = (routeName: string) => {
    if (routeName === 'ChatList') {
      // In a real app, this would come from context or props
      return 0; // Mock unread count
    }
    return undefined;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Blur background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={95}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
      )}

      {/* Top border gradient */}
      <LinearGradient
        colors={[ownerTheme.colors.border, 'transparent']}
        style={styles.topBorder}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Tab items */}
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              focused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              badge={getTabBadge(route.name)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : ownerTheme.colors.card,
    borderTopLeftRadius: ownerTheme.borderRadius.xl,
    borderTopRightRadius: ownerTheme.borderRadius.xl,
    overflow: 'hidden',
    ...ownerTheme.shadows.large,
  },

  androidBackground: {
    backgroundColor: `${ownerTheme.colors.card}F5`, // 96% opacity
  },

  topBorder: {
    height: 1,
    width: '100%',
  },

  tabBar: {
    flexDirection: 'row',
    paddingTop: ownerTheme.spacing.md,
    paddingHorizontal: ownerTheme.spacing.sm,
    minHeight: ownerTheme.dimensions.tabBarHeight,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ownerTheme.spacing.xs,
    position: 'relative',
  },

  backgroundIndicator: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    bottom: 0,
    borderRadius: ownerTheme.borderRadius.lg,
  },

  backgroundGradient: {
    flex: 1,
    borderRadius: ownerTheme.borderRadius.lg,
  },

  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: ownerTheme.colors.accent,
    borderRadius: ownerTheme.borderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: ownerTheme.colors.card,
  },

  badgeText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textInverse,
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 12,
  },

  label: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});