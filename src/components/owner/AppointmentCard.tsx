import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ownerTheme } from '../../constants/ownerTheme';
import { PremiumCard } from './PremiumCard';

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time: string;
    type: string;
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    veterinarian: {
      id: string;
      name: string;
      photo?: string;
      clinicName: string;
    };
    pet: {
      id: string;
      name: string;
      type: 'dog' | 'cat' | 'bird' | 'other';
    };
  };
  onPress?: () => void;
  onCancelPress?: () => void;
  onReschedulePress?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onCancelPress,
  onReschedulePress,
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

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'confirmed': return ownerTheme.colors.success;
      case 'pending': return ownerTheme.colors.warning;
      case 'completed': return ownerTheme.colors.textLight;
      case 'cancelled': return ownerTheme.colors.error;
      default: return ownerTheme.colors.textLight;
    }
  };

  const getStatusText = () => {
    switch (appointment.status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  const getPetIcon = () => {
    switch (appointment.pet.type) {
      case 'dog': return 'heart-outline';
      case 'cat': return 'heart-outline';
      case 'bird': return 'leaf-outline';
      case 'other': return 'star-outline';
      default: return 'heart-outline';
    }
  };

  return (
    <Animated.View entering={FadeInRight.delay(100).springify()}>
      <PremiumCard
        variant="default"
        size="medium"
        onPress={onPress}
        customStyle={styles.card}
      >
        <View style={styles.content}>
          {/* Header with status */}
          <View style={styles.header}>
            <View style={styles.dateTime}>
              <Text style={styles.date}>{appointment.date}</Text>
              <Text style={styles.time}>{appointment.time}</Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Appointment details */}
          <View style={styles.details}>
            <View style={styles.leftSection}>
              <View style={styles.typeContainer}>
                <Ionicons 
                  name="medical-outline" 
                  size={16} 
                  color={ownerTheme.colors.primary} 
                />
                <Text style={styles.appointmentType}>{appointment.type}</Text>
              </View>
              
              <View style={styles.petContainer}>
                <Ionicons 
                  name={getPetIcon()} 
                  size={14} 
                  color={ownerTheme.colors.textSecondary} 
                />
                <Text style={styles.petName}>{appointment.pet.name}</Text>
              </View>
            </View>
            
            <View style={styles.rightSection}>
              <View style={styles.vetInfo}>
                {appointment.veterinarian.photo ? (
                  <Image 
                    source={{ uri: appointment.veterinarian.photo }} 
                    style={styles.vetAvatar} 
                  />
                ) : (
                  <View style={[styles.vetAvatar, styles.vetAvatarPlaceholder]}>
                    <Ionicons 
                      name="person-outline" 
                      size={16} 
                      color={ownerTheme.colors.textSecondary} 
                    />
                  </View>
                )}
                <View style={styles.vetDetails}>
                  <Text style={styles.vetName} numberOfLines={1}>
                    {appointment.veterinarian.name}
                  </Text>
                  <Text style={styles.clinicName} numberOfLines={1}>
                    {appointment.veterinarian.clinicName}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action buttons - only show for pending/confirmed appointments */}
          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <View style={styles.actions}>
              <AnimatedTouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={onReschedulePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Ionicons 
                  name="calendar-outline" 
                  size={14} 
                  color={ownerTheme.colors.secondary} 
                />
                <Text style={styles.actionButtonTextSecondary}>Reagendar</Text>
              </AnimatedTouchableOpacity>

              <AnimatedTouchableOpacity
                style={[styles.actionButton, styles.cancelAction]}
                onPress={onCancelPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Ionicons 
                  name="close-outline" 
                  size={14} 
                  color={ownerTheme.colors.error} 
                />
                <Text style={styles.actionButtonTextError}>Cancelar</Text>
              </AnimatedTouchableOpacity>
            </View>
          )}
        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: ownerTheme.spacing.sm,
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
  
  dateTime: {
    flex: 1,
  },
  
  date: {
    ...ownerTheme.typography.h4,
    color: ownerTheme.colors.textPrimary,
    marginBottom: 2,
  },
  
  time: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.textSecondary,
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
  
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ownerTheme.spacing.md,
  },
  
  leftSection: {
    flex: 1,
    marginRight: ownerTheme.spacing.md,
  },
  
  rightSection: {
    flex: 1,
  },
  
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ownerTheme.spacing.xs,
  },
  
  appointmentType: {
    ...ownerTheme.typography.bodyMedium,
    color: ownerTheme.colors.textPrimary,
    marginLeft: ownerTheme.spacing.xs,
  },
  
  petContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  petName: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.textSecondary,
    marginLeft: ownerTheme.spacing.xs,
  },
  
  vetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  vetAvatar: {
    width: ownerTheme.dimensions.avatarSizeSmall,
    height: ownerTheme.dimensions.avatarSizeSmall,
    borderRadius: ownerTheme.borderRadius.full,
    marginRight: ownerTheme.spacing.xs,
  },
  
  vetAvatarPlaceholder: {
    backgroundColor: ownerTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ownerTheme.colors.border,
  },
  
  vetDetails: {
    flex: 1,
  },
  
  vetName: {
    ...ownerTheme.typography.bodyMedium,
    color: ownerTheme.colors.textPrimary,
    marginBottom: 1,
  },
  
  clinicName: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
  },
  
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ownerTheme.spacing.sm,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ownerTheme.spacing.sm,
    paddingVertical: ownerTheme.spacing.xs,
    borderRadius: ownerTheme.borderRadius.sm,
    gap: ownerTheme.spacing.xs,
  },
  
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ownerTheme.colors.secondary,
  },
  
  cancelAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ownerTheme.colors.error,
  },
  
  actionButtonTextSecondary: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.secondary,
    fontWeight: '600',
  },
  
  actionButtonTextError: {
    ...ownerTheme.typography.caption,
    color: ownerTheme.colors.error,
    fontWeight: '600',
  },
});