import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ownerTheme } from '../../constants/ownerTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;

interface TipCardProps {
  tip: {
    id: string;
    title: string;
    content: string;
    category: 'health' | 'nutrition' | 'training' | 'grooming' | 'general';
    imageUrl?: string;
    readTime?: string;
  };
  onPress?: () => void;
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const TipCard: React.FC<TipCardProps> = ({
  tip,
  onPress,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    onPress?.();
  };

  const getCategoryColor = () => {
    switch (tip.category) {
      case 'health': return ownerTheme.colors.accent;
      case 'nutrition': return ownerTheme.colors.success;
      case 'training': return ownerTheme.colors.secondary;
      case 'grooming': return ownerTheme.colors.primary;
      case 'general': return ownerTheme.colors.textSecondary;
      default: return ownerTheme.colors.primary;
    }
  };

  const getCategoryText = () => {
    switch (tip.category) {
      case 'health': return 'Salud';
      case 'nutrition': return 'Nutrición';
      case 'training': return 'Entrenamiento';
      case 'grooming': return 'Aseo';
      case 'general': return 'General';
      default: return 'General';
    }
  };

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (tip.category) {
      case 'health': return 'medical-outline';
      case 'nutrition': return 'restaurant-outline';
      case 'training': return 'school-outline';
      case 'grooming': return 'cut-outline';
      case 'general': return 'information-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  return (
    <Animated.View 
      entering={FadeIn.delay(150).springify()} 
      style={[styles.container, style]}
    >
      <AnimatedTouchableOpacity
        style={[styles.card, animatedStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
          style={styles.gradientOverlay}
        />
        
        {/* Image section */}
        {tip.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: tip.imageUrl }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
              style={styles.imageGradient}
            />
          </View>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons 
              name={getCategoryIcon()} 
              size={40} 
              color={getCategoryColor()} 
            />
          </View>
        )}

        {/* Content section */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
              <Ionicons 
                name={getCategoryIcon()} 
                size={12} 
                color={ownerTheme.colors.textInverse} 
              />
              <Text style={styles.categoryText}>
                {getCategoryText()}
              </Text>
            </View>
            
            {tip.readTime && (
              <View style={styles.readTime}>
                <Ionicons 
                  name="time-outline" 
                  size={12} 
                  color={ownerTheme.colors.textLight} 
                />
                <Text style={styles.readTimeText}>{tip.readTime}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {tip.title}
          </Text>
          
          <Text style={styles.contentText} numberOfLines={3}>
            {tip.content}
          </Text>

          <View style={styles.readMoreContainer}>
            <Text style={styles.readMoreText}>Leer más</Text>
            <Ionicons 
              name="chevron-forward-outline" 
              size={14} 
              color={ownerTheme.colors.primary} 
            />
          </View>
        </View>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: ownerTheme.spacing.md,
  },
  
  card: {
    backgroundColor: ownerTheme.colors.card,
    borderRadius: ownerTheme.borderRadius.lg,
    overflow: 'hidden',
    ...ownerTheme.shadows.medium,
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  
  placeholderImage: {
    height: 140,
    backgroundColor: ownerTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ownerTheme.colors.border,
  },
  
  content: {
    padding: ownerTheme.spacing.md,
    zIndex: 2,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ownerTheme.spacing.sm,
  },
  
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ownerTheme.spacing.xs,
    paddingVertical: 4,
    borderRadius: ownerTheme.borderRadius.full,
    gap: 4,
  },
  
  categoryText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textInverse,
    fontWeight: '600',
  },
  
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  readTimeText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textLight,
  },
  
  title: {
    ...ownerTheme.typography.h4,
    color: ownerTheme.colors.textPrimary,
    marginBottom: ownerTheme.spacing.xs,
    lineHeight: 22,
  },
  
  contentText: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: ownerTheme.spacing.sm,
  },
  
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  readMoreText: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.primary,
    fontWeight: '600',
  },
});