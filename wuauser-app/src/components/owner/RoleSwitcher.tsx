import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ownerTheme } from '../../constants/ownerTheme';
import { PremiumCard } from './PremiumCard';
import roleService, { UserRole } from '../../services/roleService';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleSwitch?: (newRole: UserRole) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ 
  currentRole, 
  onRoleSwitch 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canSwitchToVet, setCanSwitchToVet] = useState(false);
  
  const toggleProgress = useSharedValue(currentRole === 'veterinario' ? 1 : 0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    checkVetPermissions();
  }, []);

  const checkVetPermissions = async () => {
    try {
      const canSwitch = await roleService.canSwitchToVet();
      setCanSwitchToVet(canSwitch);
    } catch (error) {
      console.error('Error checking vet permissions:', error);
    }
  };

  const animatedToggleStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      toggleProgress.value,
      [0, 1],
      [2, 42]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const animatedOwnerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      toggleProgress.value,
      [0, 1],
      [1, 0.6]
    );

    return { opacity };
  });

  const animatedVetStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      toggleProgress.value,
      [0, 1],
      [0.6, 1]
    );

    return { opacity };
  });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleRoleSwitch = async () => {
    if (currentRole === 'dueno' && !canSwitchToVet) {
      Alert.alert(
        'Acceso Restringido',
        'No tienes permisos para acceder al modo veterinario. Contacta con soporte si eres un veterinario registrado.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Add haptic-like feedback animation
    scale.value = withSpring(0.95, { stiffness: 400, damping: 10 }, () => {
      scale.value = withSpring(1, { stiffness: 400, damping: 10 });
    });

    setIsLoading(true);

    try {
      const newRole = await roleService.switchRole();
      
      // Animate toggle
      toggleProgress.value = withTiming(
        newRole === 'veterinario' ? 1 : 0,
        { duration: 300 },
        () => {
          runOnJS(setIsLoading)(false);
        }
      );

      onRoleSwitch?.(newRole);

    } catch (error) {
      console.error('Error switching role:', error);
      setIsLoading(false);
      Alert.alert(
        'Error',
        'No se pudo cambiar de modo. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  const ownerInfo = roleService.getRoleInfo('dueno');
  const vetInfo = roleService.getRoleInfo('veterinario');

  return (
    <Animated.View style={[styles.container, animatedCardStyle]}>
      <PremiumCard
        variant="elevated"
        size="medium"
        interactive={!isLoading}
        customStyle={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Cambiar Modo</Text>
          <Text style={styles.subtitle}>
            Cambia entre ser dueño de mascotas o veterinario
          </Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.toggleContainer}>
          <AnimatedTouchableOpacity
            style={[styles.roleOption, animatedOwnerStyle]}
            onPress={currentRole === 'veterinario' ? handleRoleSwitch : undefined}
            disabled={isLoading || currentRole === 'dueno'}
          >
            <View style={styles.roleIcon}>
              <Ionicons 
                name={ownerInfo.icon as keyof typeof Ionicons.glyphMap} 
                size={20} 
                color={currentRole === 'dueno' ? ownerTheme.colors.textInverse : ownerTheme.colors.textSecondary} 
              />
            </View>
            <View style={styles.roleText}>
              <Text style={[
                styles.roleTitle,
                currentRole === 'dueno' && styles.roleTitleActive
              ]}>
                {ownerInfo.title}
              </Text>
            </View>
          </AnimatedTouchableOpacity>

          {/* Toggle Switch */}
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={styles.switchTrack}
              onPress={handleRoleSwitch}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[ownerTheme.colors.primary, ownerTheme.colors.secondary]}
                style={styles.switchBackground}
              />
              
              <Animated.View style={[styles.switchThumb, animatedToggleStyle]}>
                {isLoading ? (
                  <View style={styles.loadingIndicator}>
                    <View style={styles.loadingDot} />
                  </View>
                ) : (
                  <Ionicons 
                    name="swap-horizontal" 
                    size={16} 
                    color={ownerTheme.colors.textInverse} 
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>

          <AnimatedTouchableOpacity
            style={[styles.roleOption, animatedVetStyle]}
            onPress={currentRole === 'dueno' ? handleRoleSwitch : undefined}
            disabled={isLoading || currentRole === 'veterinario' || !canSwitchToVet}
          >
            <View style={styles.roleIcon}>
              <Ionicons 
                name={vetInfo.icon as keyof typeof Ionicons.glyphMap} 
                size={20} 
                color={currentRole === 'veterinario' ? ownerTheme.colors.textInverse : ownerTheme.colors.textSecondary} 
              />
            </View>
            <View style={styles.roleText}>
              <Text style={[
                styles.roleTitle,
                currentRole === 'veterinario' && styles.roleTitleActive
              ]}>
                {vetInfo.title}
              </Text>
            </View>
          </AnimatedTouchableOpacity>
        </View>

        {/* Current Role Info */}
        <View style={styles.currentRoleInfo}>
          <LinearGradient
            colors={[`${ownerTheme.colors.primary}10`, `${ownerTheme.colors.secondary}05`]}
            style={styles.currentRoleBackground}
          >
            <View style={styles.currentRoleIcon}>
              <Ionicons 
                name={(currentRole === 'veterinario' ? vetInfo.icon : ownerInfo.icon) as keyof typeof Ionicons.glyphMap}
                size={24} 
                color={ownerTheme.colors.primary} 
              />
            </View>
            <View style={styles.currentRoleText}>
              <Text style={styles.currentRoleTitle}>
                {currentRole === 'veterinario' ? vetInfo.title : ownerInfo.title}
              </Text>
              <Text style={styles.currentRoleSubtitle}>
                {currentRole === 'veterinario' ? vetInfo.subtitle : ownerInfo.subtitle}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Permissions Warning */}
        {currentRole === 'dueno' && !canSwitchToVet && (
          <View style={styles.warningContainer}>
            <Ionicons name="information-circle" size={16} color={ownerTheme.colors.warning} />
            <Text style={styles.warningText}>
              Contacta con soporte para acceder al modo veterinario
            </Text>
          </View>
        )}
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: ownerTheme.spacing.md,
  },
  card: {
    backgroundColor: ownerTheme.colors.card,
    ...ownerTheme.shadows.medium,
  },
  header: {
    marginBottom: ownerTheme.spacing.lg,
  },
  title: {
    ...ownerTheme.typography.h3,
    color: ownerTheme.colors.textPrimary,
    marginBottom: ownerTheme.spacing.xs,
  },
  subtitle: {
    ...ownerTheme.typography.body,
    color: ownerTheme.colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ownerTheme.spacing.lg,
    gap: ownerTheme.spacing.sm,
  },
  roleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ownerTheme.spacing.sm,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: ownerTheme.borderRadius.full,
    backgroundColor: `${ownerTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ownerTheme.spacing.xs,
  },
  roleText: {
    alignItems: 'center',
  },
  roleTitle: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
    textAlign: 'center',
  },
  roleTitleActive: {
    color: ownerTheme.colors.textPrimary,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTrack: {
    width: 84,
    height: 44,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  switchBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  switchThumb: {
    position: 'absolute',
    top: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ownerTheme.colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    ...ownerTheme.shadows.small,
  },
  loadingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ownerTheme.colors.primary,
  },
  currentRoleInfo: {
    marginBottom: ownerTheme.spacing.md,
  },
  currentRoleBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ownerTheme.spacing.md,
    borderRadius: ownerTheme.borderRadius.md,
    gap: ownerTheme.spacing.sm,
  },
  currentRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: ownerTheme.borderRadius.full,
    backgroundColor: `${ownerTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentRoleText: {
    flex: 1,
  },
  currentRoleTitle: {
    ...ownerTheme.typography.h4,
    color: ownerTheme.colors.textPrimary,
    marginBottom: ownerTheme.spacing.xs,
  },
  currentRoleSubtitle: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ownerTheme.colors.warning}10`,
    paddingHorizontal: ownerTheme.spacing.md,
    paddingVertical: ownerTheme.spacing.sm,
    borderRadius: ownerTheme.borderRadius.md,
    gap: ownerTheme.spacing.sm,
  },
  warningText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.warning,
    flex: 1,
  },
});