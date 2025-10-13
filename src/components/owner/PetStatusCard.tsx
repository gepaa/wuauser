import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ownerTheme } from '../../constants/ownerTheme';
import { PremiumCard } from './PremiumCard';

interface PetStatusCardProps {
  pet: {
    id: string;
    name: string;
    type: 'dog' | 'cat' | 'bird' | 'other';
    photoUrl?: string;
    age?: string;
    breed?: string;
  };
  nextAppointment?: {
    date: string;
    type: string;
    vetName: string;
  };
  healthStatus: 'excellent' | 'good' | 'needs_attention' | 'urgent';
  onPress?: () => void;
  onQRPress?: () => void;
  onVetPress?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const PetStatusCard: React.FC<PetStatusCardProps> = ({
  pet,
  nextAppointment,
  healthStatus,
  onPress,
  onQRPress,
  onVetPress,
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

  const getHealthStatusColor = () => {
    switch (healthStatus) {
      case 'excellent': return ownerTheme.colors.success;
      case 'good': return ownerTheme.colors.primary;
      case 'needs_attention': return ownerTheme.colors.warning;
      case 'urgent': return ownerTheme.colors.accent;
      default: return ownerTheme.colors.primary;
    }
  };

  const getHealthStatusText = () => {
    switch (healthStatus) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Buena';
      case 'needs_attention': return 'Necesita atención';
      case 'urgent': return 'Urgente';
      default: return 'Buena';
    }
  };

  const getPetIcon = () => {
    switch (pet.type) {
      case 'dog': return 'heart-outline';
      case 'cat': return 'heart-outline';
      case 'bird': return 'leaf-outline';
      case 'other': return 'star-outline';
      default: return 'heart-outline';
    }
  };

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()}>
      <PremiumCard
        variant="elevated"
        size="medium"
        onPress={onPress}
        customStyle={styles.card}
      >
        <LinearGradient
          colors={['rgba(244, 183, 64, 0.1)', 'rgba(244, 183, 64, 0.05)']}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.content}>
          {/* Pet Header */}
          <View style={styles.header}>
            <View style={styles.petInfo}>
              <View style={styles.avatarContainer}>
                {pet.photoUrl ? (
                  <Image source={{ uri: pet.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons 
                      name={getPetIcon()} 
                      size={24} 
                      color={ownerTheme.colors.primary} 
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.petDetails}>
                <Text style={styles.petName}>{pet.name}</Text>
                {pet.breed && (
                  <Text style={styles.petBreed}>{pet.breed}</Text>
                )}
                {pet.age && (
                  <Text style={styles.petAge}>{pet.age}</Text>
                )}
              </View>
            </View>
            
            {/* Health Status */}
            <View style={[styles.statusBadge, { backgroundColor: getHealthStatusColor() }]}>
              <Text style={styles.statusText}>
                {getHealthStatusText()}
              </Text>
            </View>
          </View>

          {/* Next Appointment */}
          {nextAppointment && (
            <View style={styles.appointmentSection}>
              <View style={styles.appointmentHeader}>
                <Ionicons 
                  name="calendar-outline" 
                  size={16} 
                  color={ownerTheme.colors.textSecondary} 
                />
                <Text style={styles.appointmentTitle}>Próxima cita</Text>
              </View>
              <Text style={styles.appointmentDate}>{nextAppointment.date}</Text>
              <Text style={styles.appointmentDetails}>
                {nextAppointment.type} • {nextAppointment.vetName}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <AnimatedTouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={onVetPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Ionicons 
                name="medical-outline" 
                size={16} 
                color={ownerTheme.colors.textInverse} 
              />
              <Text style={styles.actionButtonText}>Buscar Vet</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={onQRPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Ionicons 
                name="qr-code-outline" 
                size={16} 
                color={ownerTheme.colors.primary} 
              />
              <Text style={styles.actionButtonTextSecondary}>Mi QR</Text>
            </AnimatedTouchableOpacity>
          </View>
        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  content: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ownerTheme.spacing.md,
  },
  
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  avatarContainer: {
    marginRight: ownerTheme.spacing.sm,
  },
  
  avatar: {
    width: ownerTheme.dimensions.avatarSizeLarge,
    height: ownerTheme.dimensions.avatarSizeLarge,
    borderRadius: ownerTheme.borderRadius.full,
  },
  
  avatarPlaceholder: {
    backgroundColor: ownerTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ownerTheme.colors.primary,
  },
  
  petDetails: {
    flex: 1,
  },
  
  petName: {
    ...ownerTheme.typography.h4,
    color: ownerTheme.colors.textPrimary,
    marginBottom: 2,
  },
  
  petBreed: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.textSecondary,
    marginBottom: 1,
  },
  
  petAge: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textLight,
  },
  
  statusBadge: {
    paddingHorizontal: ownerTheme.spacing.sm,
    paddingVertical: ownerTheme.spacing.xs,
    borderRadius: ownerTheme.borderRadius.full,
  },
  
  statusText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textInverse,
    fontWeight: '600',
  },
  
  appointmentSection: {
    backgroundColor: ownerTheme.colors.surface,
    borderRadius: ownerTheme.borderRadius.sm,
    padding: ownerTheme.spacing.sm,
    marginBottom: ownerTheme.spacing.md,
  },
  
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ownerTheme.spacing.xs,
  },
  
  appointmentTitle: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.textSecondary,
    marginLeft: ownerTheme.spacing.xs,
  },
  
  appointmentDate: {
    ...ownerTheme.typography.bodyMedium,
    color: ownerTheme.colors.textPrimary,
    marginBottom: 2,
  },
  
  appointmentDetails: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textLight,
  },
  
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ownerTheme.spacing.sm,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ownerTheme.spacing.sm,
    borderRadius: ownerTheme.borderRadius.sm,
    gap: ownerTheme.spacing.xs,
  },
  
  primaryAction: {
    backgroundColor: ownerTheme.colors.primary,
  },
  
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ownerTheme.colors.primary,
  },
  
  actionButtonText: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.textInverse,
    fontWeight: '600',
  },
  
  actionButtonTextSecondary: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.primary,
    fontWeight: '600',
  },
});