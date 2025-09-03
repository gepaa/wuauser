import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MockVeterinario } from '../../data/mockVeterinarios';
import { vetTheme } from '../../constants/vetTheme';

interface VetSearchCardProps {
  veterinario: MockVeterinario;
  onPress: () => void;
}

const formatearNumero = (numero: number): string => {
  if (numero >= 1000) {
    return `${(numero / 1000).toFixed(1)}K`;
  }
  return numero.toLocaleString('es-MX');
};

export const VetSearchCard: React.FC<VetSearchCardProps> = ({ veterinario, onPress }) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color={vetTheme.colors.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={vetTheme.colors.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color={vetTheme.colors.text.light} />
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header con foto y info básica */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {veterinario.avatar ? (
            <Image source={{ uri: veterinario.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {veterinario.nombre.split(' ').map(n => n.charAt(0)).join('')}
              </Text>
            </View>
          )}
          {veterinario.verificado && (
            <View style={styles.verificadoBadge}>
              <Ionicons name="checkmark-circle" size={16} color={vetTheme.colors.status.success} />
            </View>
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
              <Ionicons name="location" size={12} color={vetTheme.colors.primary} />
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
            size={12} 
            color={veterinario.proximaDisponibilidad?.includes('hoy') ? vetTheme.colors.status.success : vetTheme.colors.text.secondary} 
          />
          <Text style={[
            styles.disponibilidadText,
            veterinario.proximaDisponibilidad?.includes('hoy') && styles.disponibleHoy
          ]}>
            {veterinario.proximaDisponibilidad || 'Consultar disponibilidad'}
          </Text>
        </View>

        {/* Servicios principales */}
        <View style={styles.serviciosContainer}>
          {getServiciosPrincipales().map((servicio, index) => (
            <View key={index} style={styles.servicioChip}>
              <Text style={styles.servicioChipText}>{servicio}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer con características especiales */}
      <View style={styles.footer}>
        <View style={styles.caracteristicas}>
          {veterinario.configuraciones.aceptaUrgencias && (
            <View style={styles.caracteristicaItem}>
              <Ionicons name="medical" size={12} color={vetTheme.colors.status.error} />
              <Text style={styles.caracteristicaText}>Urgencias</Text>
            </View>
          )}
          
          {veterinario.configuraciones.serviciosDomicilio && (
            <View style={styles.caracteristicaItem}>
              <Ionicons name="home" size={12} color={vetTheme.colors.primary} />
              <Text style={styles.caracteristicaText}>Domicilio</Text>
            </View>
          )}
          
          <View style={styles.caracteristicaItem}>
            <Ionicons name="location" size={12} color={vetTheme.colors.text.secondary} />
            <Text style={styles.caracteristicaText}>{veterinario.ubicacion.colonia}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.verPerfilButton} onPress={onPress}>
          <Text style={styles.verPerfilText}>Ver perfil</Text>
          <Ionicons name="chevron-forward" size={14} color={vetTheme.colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.lg,
    marginHorizontal: vetTheme.spacing.lg,
    marginVertical: vetTheme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: vetTheme.spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: vetTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: 'white',
  },
  verificadoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 1,
  },
  infoBasica: {
    flex: 1,
    marginRight: vetTheme.spacing.sm,
  },
  nombre: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
  },
  especialidad: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  experiencia: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    marginBottom: vetTheme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: vetTheme.spacing.xs,
  },
  ratingText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  infoSecundaria: {
    alignItems: 'flex-end',
  },
  distanciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  distanciaText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    marginLeft: vetTheme.spacing.xs,
    fontWeight: vetTheme.typography.weights.medium,
  },
  precioContainer: {
    alignItems: 'flex-end',
  },
  precioLabel: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
  },
  precio: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.status.success,
  },
  infoAdicional: {
    paddingVertical: vetTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: vetTheme.colors.border.light,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
    marginBottom: vetTheme.spacing.sm,
  },
  disponibilidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.sm,
  },
  disponibilidadText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.xs,
  },
  disponibleHoy: {
    color: vetTheme.colors.status.success,
    fontWeight: vetTheme.typography.weights.medium,
  },
  serviciosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vetTheme.spacing.xs,
  },
  servicioChip: {
    backgroundColor: vetTheme.colors.surface,
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  servicioChipText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caracteristicas: {
    flexDirection: 'row',
    flex: 1,
    gap: vetTheme.spacing.md,
  },
  caracteristicaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caracteristicaText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
    marginLeft: vetTheme.spacing.xs,
  },
  verPerfilButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.xs,
    paddingHorizontal: vetTheme.spacing.sm,
  },
  verPerfilText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.medium,
    marginRight: vetTheme.spacing.xs,
  },
});

export default VetSearchCard;