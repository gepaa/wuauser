import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Animations } from '../constants/animations';

interface LoadingSkeletonProps {
  // Basic props
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  
  // Skeleton type
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  
  // Animation
  animated?: boolean;
  speed?: number;
  
  // Multiple lines (for text variant)
  lines?: number;
  lineSpacing?: number;
  lastLineWidth?: number | string;
  
  // Card specific (for card variant)
  cardLayout?: 'horizontal' | 'vertical';
  showAvatar?: boolean;
  showButton?: boolean;
  
  // Custom styles
  style?: ViewStyle;
  
  // Colors
  baseColor?: string;
  highlightColor?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  variant = 'rectangular',
  animated = true,
  speed = 1500,
  lines = 1,
  lineSpacing = 8,
  lastLineWidth = '60%',
  cardLayout = 'vertical',
  showAvatar = true,
  showButton = false,
  style,
  baseColor = Colors.gray[100],
  highlightColor = Colors.gray[50],
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Animation setup
  useEffect(() => {
    if (!animated) return;
    
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: speed,
        easing: Animations.easing.linear,
        useNativeDriver: true,
      })
    );
    
    shimmerAnimation.start();
    
    return () => shimmerAnimation.stop();
  }, [animated, speed, shimmerAnim]);
  
  // Get border radius based on variant
  const getBorderRadius = (): number => {
    if (borderRadius !== undefined) return borderRadius;
    
    switch (variant) {
      case 'circular':
        return 9999;
      case 'text':
        return BorderRadius.xs;
      case 'card':
        return BorderRadius.card.medium;
      case 'rectangular':
      default:
        return BorderRadius.sm;
    }
  };
  
  // Get dimensions based on variant
  const getDimensions = () => {
    switch (variant) {
      case 'circular':
        const size = typeof width === 'number' ? width : 40;
        return { width: size, height: size };
      case 'text':
        return { width, height: 16 };
      case 'card':
        return { width, height: height || 120 };
      case 'rectangular':
      default:
        return { width, height };
    }
  };
  
  // Shimmer gradient component
  const ShimmerGradient: React.FC<{ style?: ViewStyle }> = ({ style: gradientStyle }) => {
    if (!animated) {
      return <View style={[{ backgroundColor: baseColor }, gradientStyle]} />;
    }
    
    const translateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });
    
    return (
      <View style={[{ backgroundColor: baseColor, overflow: 'hidden' }, gradientStyle]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[baseColor, highlightColor, baseColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>
    );
  };
  
  // Render different variants
  const renderSkeleton = () => {
    const dimensions = getDimensions();
    const radius = getBorderRadius();
    
    switch (variant) {
      case 'text':
        return (
          <View style={style}>
            {Array.from({ length: lines }, (_, index) => {
              const isLastLine = index === lines - 1;
              const lineWidth = isLastLine && lines > 1 ? lastLineWidth : width;
              
              return (
                <ShimmerGradient
                  key={index}
                  style={[
                    {
                      width: lineWidth,
                      height: dimensions.height,
                      borderRadius: radius,
                      marginBottom: index < lines - 1 ? lineSpacing : 0,
                    },
                  ]}
                />
              );
            })}
          </View>
        );
      
      case 'card':
        return (
          <View style={[styles.cardContainer, { width: dimensions.width }, style]}>
            {cardLayout === 'horizontal' ? (
              <View style={styles.horizontalCard}>
                {showAvatar && (
                  <ShimmerGradient
                    style={[
                      styles.avatar,
                      { borderRadius: BorderRadius.full },
                    ]}
                  />
                )}
                <View style={styles.cardContent}>
                  <ShimmerGradient style={styles.cardTitle} />
                  <ShimmerGradient style={styles.cardSubtitle} />
                  <ShimmerGradient style={styles.cardText} />
                  {showButton && (
                    <ShimmerGradient style={styles.cardButton} />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.verticalCard}>
                <ShimmerGradient style={styles.cardImage} />
                <View style={styles.cardContent}>
                  {showAvatar && (
                    <ShimmerGradient
                      style={[
                        styles.avatarSmall,
                        { borderRadius: BorderRadius.full },
                      ]}
                    />
                  )}
                  <ShimmerGradient style={styles.cardTitle} />
                  <ShimmerGradient style={styles.cardSubtitle} />
                  {showButton && (
                    <ShimmerGradient style={styles.cardButton} />
                  )}
                </View>
              </View>
            )}
          </View>
        );
      
      case 'circular':
      case 'rectangular':
      default:
        return (
          <ShimmerGradient
            style={[
              {
                width: dimensions.width,
                height: dimensions.height,
                borderRadius: radius,
              },
              style,
            ]}
          />
        );
    }
  };
  
  return renderSkeleton();
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<Pick<LoadingSkeletonProps, 'lines' | 'style' | 'animated'>> = (props) => (
  <LoadingSkeleton variant="text" {...props} />
);

export const SkeletonAvatar: React.FC<Pick<LoadingSkeletonProps, 'width' | 'style' | 'animated'>> = (props) => (
  <LoadingSkeleton variant="circular" {...props} />
);

export const SkeletonCard: React.FC<Pick<LoadingSkeletonProps, 'cardLayout' | 'showAvatar' | 'showButton' | 'style' | 'animated'>> = (props) => (
  <LoadingSkeleton variant="card" {...props} />
);

// Skeleton for appointment cards
export const SkeletonAppointmentCard: React.FC<{ animated?: boolean; style?: ViewStyle }> = ({ animated, style }) => (
  <View style={[styles.appointmentCard, style]}>
    <View style={styles.appointmentHeader}>
      <SkeletonAvatar width={40} animated={animated} />
      <View style={styles.appointmentInfo}>
        <LoadingSkeleton width="60%" height={16} animated={animated} />
        <LoadingSkeleton width="40%" height={12} animated={animated} style={{ marginTop: 4 }} />
      </View>
      <LoadingSkeleton width={60} height={24} animated={animated} />
    </View>
    <LoadingSkeleton width="100%" height={12} animated={animated} style={{ marginTop: 12 }} />
    <LoadingSkeleton width="80%" height={12} animated={animated} style={{ marginTop: 4 }} />
  </View>
);

// Skeleton for patient cards
export const SkeletonPatientCard: React.FC<{ animated?: boolean; style?: ViewStyle }> = ({ animated, style }) => (
  <View style={[styles.patientCard, style]}>
    <SkeletonAvatar width={48} animated={animated} />
    <View style={styles.patientInfo}>
      <LoadingSkeleton width="70%" height={18} animated={animated} />
      <LoadingSkeleton width="50%" height={14} animated={animated} style={{ marginTop: 4 }} />
    </View>
    <View style={styles.patientActions}>
      <LoadingSkeleton width={32} height={32} borderRadius={16} animated={animated} />
      <LoadingSkeleton width={32} height={32} borderRadius={16} animated={animated} style={{ marginLeft: 8 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  verticalCard: {
    alignItems: 'stretch',
  },
  
  avatar: {
    width: 48,
    height: 48,
    marginRight: Spacing.md,
  },
  
  avatarSmall: {
    width: 32,
    height: 32,
    marginBottom: Spacing.xs,
  },
  
  cardContent: {
    flex: 1,
  },
  
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  
  cardTitle: {
    height: 20,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  
  cardSubtitle: {
    height: 16,
    width: '70%',
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  
  cardText: {
    height: 14,
    width: '90%',
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  
  cardButton: {
    height: 36,
    width: 100,
    borderRadius: BorderRadius.button.medium,
    marginTop: Spacing.sm,
  },
  
  // Appointment card skeleton
  appointmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  appointmentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  
  // Patient card skeleton
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  
  patientInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  
  patientActions: {
    flexDirection: 'row',
  },
});

export default LoadingSkeleton;