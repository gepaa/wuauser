import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  BounceIn,
  SlideInRight,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MockVeterinario } from '../../data/mockVeterinarios';
import { ownerTheme } from '../../constants/ownerTheme';
import { PremiumCard } from '../owner/PremiumCard';

interface VetSearchCardProps {
  veterinario: MockVeterinario;
  onPress: () => void;
  index?: number;
}

const formatearNumero = (numero: number): string => {
  if (numero >= 1000) {
    return `${(numero / 1000).toFixed(1)}K`;
  }
  return numero.toLocaleString('es-MX');
};

export const VetSearchCard: React.FC<VetSearchCardProps> = ({ veterinario, onPress, index = 0 }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, ownerTheme.animations.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, ownerTheme.animations.spring);
  };
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color={ownerTheme.colors.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={ownerTheme.colors.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color={ownerTheme.colors.textLight} />
      );
    }

    return stars;
  };

  const getPrecioMinimo = () => {
    const precios = veterinario.servicios.map(s => s.precio);
    return Math.min(...precios);
  };

  const getServiciosPrincipales = () => {
    return veterinario.servicios.slice(0, 3).map(s => s.nombre);
  };

  const getDistanciaTexto = () => {
    if (veterinario.distancia && veterinario.distancia < 1) {
      return `${Math.round(veterinario.distancia * 1000)}m`;
    }
    return `${veterinario.distancia?.toFixed(1)}km`;
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={[styles.cardContainer, animatedStyle]}
    >
      <PremiumCard
        variant="elevated"
        size="medium"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        customStyle={styles.card}
      >
        {/* Header con foto y info básica */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {veterinario.avatar ? (
              <Image source={{ uri: veterinario.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[`${ownerTheme.colors.primary}20`, `${ownerTheme.colors.secondary}10`]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {veterinario.nombre.split(' ').map(n => n.charAt(0)).join('')}
                </Text>
              </LinearGradient>
            )}
            
            {veterinario.verificado && (
              <Animated.View 
                entering={BounceIn.delay(200 + index * 100)}
                style={styles.verificadoBadge}
              >
                <Ionicons name="checkmark-circle" size={18} color={ownerTheme.colors.success} />
              </Animated.View>
            )}
          </View>

          <View style={styles.infoBasica}>
            <Text style={styles.nombre} numberOfLines={1}>{veterinario.nombre}</Text>
            <Text style={styles.especialidad} numberOfLines={1}>{veterinario.especialidad}</Text>
            <Text style={styles.experiencia}>{veterinario.experiencia} años de experiencia</Text>
            
            {/* Rating y reseñas */}
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(veterinario.rating)}
              </View>
              <Text style={styles.ratingText}>
                {veterinario.rating} ({formatearNumero(veterinario.totalReviews)})
              </Text>
            </View>
          </View>

          {/* Información de distancia y precio */}
          <View style={styles.infoSecundaria}>
            {veterinario.distancia && (
              <View style={styles.distanciaContainer}>
                <Ionicons name="location" size={12} color={ownerTheme.colors.primary} />
                <Text style={styles.distanciaText}>{getDistanciaTexto()}</Text>
              </View>
            )}
            
            <View style={styles.precioContainer}>
              <Text style={styles.precioLabel}>Desde</Text>
              <Text style={styles.precio}>${getPrecioMinimo()}</Text>
            </View>
          </View>
        </View>

        {/* Información adicional */}
        <View style={styles.infoAdicional}>
          {/* Disponibilidad */}
          <View style={styles.disponibilidadContainer}>
            <Ionicons 
              name="time" 
              size={14} 
              color={veterinario.proximaDisponibilidad?.includes('hoy') ? ownerTheme.colors.success : ownerTheme.colors.textSecondary} 
            />
            <Text style={[
              styles.disponibilidadText,
              veterinario.proximaDisponibilidad?.includes('hoy') && styles.disponibleHoy
            ]}>
              {veterinario.proximaDisponibilidad || 'Consultar disponibilidad'}
            </Text>
          </View>

          {/* Servicios principales */}
          <Animated.View 
            entering={SlideInRight.delay(300 + index * 100)}
            style={styles.serviciosContainer}
          >
            {getServiciosPrincipales().map((servicio, index) => (
              <View key={index} style={styles.servicioChip}>
                <Text style={styles.servicioChipText}>{servicio}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Footer con características especiales */}
        <View style={styles.footer}>
          <View style={styles.caracteristicas}>
            {veterinario.configuraciones.aceptaUrgencias && (
              <View style={styles.caracteristicaItem}>
                <Ionicons name="medical" size={12} color={ownerTheme.colors.error} />
                <Text style={styles.caracteristicaText}>Urgencias</Text>
              </View>
            )}
            
            {veterinario.configuraciones.serviciosDomicilio && (
              <View style={styles.caracteristicaItem}>
                <Ionicons name="home" size={12} color={ownerTheme.colors.primary} />
                <Text style={styles.caracteristicaText}>Domicilio</Text>
              </View>
            )}
            
            <View style={styles.caracteristicaItem}>
              <Ionicons name="location-outline" size={12} color={ownerTheme.colors.textSecondary} />
              <Text style={styles.caracteristicaText}>{veterinario.ubicacion.colonia}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.verPerfilButton} 
            onPress={onPress}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[ownerTheme.colors.primary, ownerTheme.colors.secondary]}
              style={styles.verPerfilGradient}
            >
              <Text style={styles.verPerfilText}>Ver perfil</Text>
              <Ionicons name="chevron-forward" size={14} color={ownerTheme.colors.textInverse} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: ownerTheme.spacing.lg,
    marginVertical: ownerTheme.spacing.sm,
  },
  card: {
    backgroundColor: ownerTheme.colors.card,
    borderRadius: ownerTheme.borderRadius.lg,
    ...ownerTheme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ownerTheme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: ownerTheme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: ownerTheme.borderRadius.full,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: ownerTheme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...ownerTheme.typography.h3,
    color: ownerTheme.colors.primary,
    fontWeight: '700',
  },
  verificadoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: ownerTheme.colors.card,
    borderRadius: ownerTheme.borderRadius.full,
    padding: 2,
    ...ownerTheme.shadows.small,
  },
  infoBasica: {
    flex: 1,
    marginRight: ownerTheme.spacing.sm,
  },
  nombre: {
    ...ownerTheme.typography.h3,
    color: ownerTheme.colors.textPrimary,
    marginBottom: ownerTheme.spacing.xs,
  },
  especialidad: {
    ...ownerTheme.typography.body,
    color: ownerTheme.colors.textSecondary,
    marginBottom: ownerTheme.spacing.xs,
  },
  experiencia: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textLight,
    marginBottom: ownerTheme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ownerTheme.spacing.xs,
  },
  ratingText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
  },
  infoSecundaria: {
    alignItems: 'flex-end',
  },
  distanciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ownerTheme.spacing.xs,
  },
  distanciaText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.primary,
    marginLeft: ownerTheme.spacing.xs,
    fontWeight: '600',
  },
  precioContainer: {
    alignItems: 'flex-end',
  },
  precioLabel: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textLight,
  },
  precio: {
    ...ownerTheme.typography.h3,
    fontWeight: '700',
    color: ownerTheme.colors.success,
  },
  infoAdicional: {
    paddingVertical: ownerTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ownerTheme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: ownerTheme.colors.border,
    marginBottom: ownerTheme.spacing.sm,
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ownerTheme.spacing.sm,
  },
  disponibilidadText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
    marginLeft: ownerTheme.spacing.xs,
  },
  disponibleHoy: {
    color: ownerTheme.colors.success,
    fontWeight: '600',
  },
  serviciosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ownerTheme.spacing.xs,
  },
  servicioChip: {
    backgroundColor: ownerTheme.colors.surface,
    paddingHorizontal: ownerTheme.spacing.sm,
    paddingVertical: ownerTheme.spacing.xs,
    borderRadius: ownerTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ownerTheme.colors.border,
  },
  servicioChipText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caracteristicas: {
    flexDirection: 'row',
    flex: 1,
    gap: ownerTheme.spacing.md,
    flexWrap: 'wrap',
  },
  caracteristicaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ownerTheme.spacing.xs,
  },
  caracteristicaText: {
    ...ownerTheme.typography.small,
    color: ownerTheme.colors.textLight,
  },
  verPerfilButton: {
    borderRadius: ownerTheme.borderRadius.md,
    overflow: 'hidden',
  },
  verPerfilGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ownerTheme.spacing.sm,
    paddingHorizontal: ownerTheme.spacing.md,
    gap: ownerTheme.spacing.xs,
  },
  verPerfilText: {
    ...ownerTheme.typography.button,
    color: ownerTheme.colors.textInverse,
    fontSize: 12,
  },
});

export default VetSearchCard;