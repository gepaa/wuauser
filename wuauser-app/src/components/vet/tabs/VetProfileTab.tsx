import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../../../constants/vetTheme';

interface VetProfileTabProps {
  navigation: any;
}

// Mock data del veterinario
const mockVeterinario = {
  id: '1',
  nombre: 'Dr. Guido Pablo Rodríguez',
  email: 'guidopablo81@wuauser.com',
  telefono: '55-1234-5678',
  especialidad: 'Medicina General Veterinaria',
  cedula: 'MVZ-12345678',
  experiencia: '8 años',
  rating: 4.8,
  totalReviews: 127,
  avatar: null,
  clinica: {
    nombre: 'Clínica Veterinaria San Ángel',
    direccion: 'Av. Revolución 1425, San Ángel, CDMX',
    telefono: '55-5555-1234',
    horarios: {
      lunes_viernes: '08:00 - 18:00',
      sabado: '09:00 - 15:00',
      domingo: 'Cerrado'
    },
    servicios: [
      'Consulta General',
      'Vacunación', 
      'Cirugía Menor',
      'Emergencias',
      'Análisis Clínicos'
    ]
  },
  estadisticas: {
    pacientesActivos: 127,
    citasEsteMes: 45,
    ingresosMes: 28500,
    añosEnWuauser: 2
  }
};

// Función para formatear números grandes
const formatearNumero = (numero: number): string => {
  if (numero >= 1000000) {
    return `${(numero / 1000000).toFixed(1)}M`;
  } else if (numero >= 1000) {
    return `${(numero / 1000).toFixed(1)}K`;
  }
  return numero.toLocaleString('es-MX');
};

// Secciones del perfil rediseñadas
const perfilSecciones = [
  {
    titulo: 'Configuraciones del Negocio',
    items: [
      { titulo: 'Información de la clínica', icono: 'business-outline', screen: 'EditClinica' },
      { titulo: 'Servicios y precios', icono: 'pricetag-outline', screen: 'EditServicios' },
      { titulo: 'Horarios y disponibilidad', icono: 'time-outline', screen: 'EditHorarios' }
    ]
  },
  {
    titulo: 'Configuraciones de App',
    items: [
      { titulo: 'Notificaciones y alertas', icono: 'notifications-outline', screen: 'Configuraciones' },
      { titulo: 'Estadísticas detalladas', icono: 'bar-chart-outline', screen: 'Estadisticas' }
    ]
  },
  {
    titulo: 'Soporte y Ayuda',
    items: [
      { titulo: 'Centro de ayuda', icono: 'help-circle-outline', action: 'help' },
      { titulo: 'Contactar soporte', icono: 'mail-outline', action: 'contact' },
      { titulo: 'Términos y condiciones', icono: 'document-text-outline', action: 'terms' }
    ]
  },
  {
    titulo: 'Gestión de Cuenta',
    items: [
      { titulo: 'Editar perfil profesional', icono: 'person-outline', screen: 'EditProfile' },
      { titulo: 'Cambiar contraseña', icono: 'lock-closed-outline', action: 'changePassword' },
      { titulo: 'Cerrar sesión', icono: 'log-out-outline', action: 'logout', color: 'danger' }
    ]
  }
];

interface StatCardProps {
  numero: string;
  descripcion: string;
  icono: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ numero, descripcion, icono, color = vetTheme.colors.primary }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statContent}>
      <Text style={[styles.statNumber, { color }]}>{numero}</Text>
      <Text style={styles.statDescription}>{descripcion}</Text>
    </View>
    <Ionicons name={icono as any} size={24} color={color} />
  </View>
);

interface SettingItemProps {
  titulo: string;
  icono: string;
  onPress: () => void;
  badge?: string;
  color?: string;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  titulo, 
  icono, 
  onPress, 
  badge, 
  color = vetTheme.colors.text.primary,
  showChevron = true 
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingItemLeft}>
      <Ionicons name={icono as any} size={20} color={color} style={styles.settingIcon} />
      <Text style={[styles.settingTitle, { color }]}>{titulo}</Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={16} color={vetTheme.colors.text.light} />
    )}
  </TouchableOpacity>
);

interface ProfileSectionProps {
  titulo: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ titulo, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{titulo}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

export const VetProfileTab: React.FC<VetProfileTabProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [veterinario] = useState(mockVeterinario);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const handleNavigation = (screen: string) => {
    if (screen) {
      navigation.navigate(screen);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'logout':
        Alert.alert(
          'Cerrar Sesión',
          '¿Estás seguro de que deseas cerrar sesión?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Cerrar Sesión', 
              style: 'destructive',
              onPress: () => {
                // TODO: Implementar logout con veterinariaService
                navigation.navigate('Login');
              }
            }
          ]
        );
        break;
      case 'changePassword':
        Alert.alert(
          'Cambiar Contraseña',
          'Serás redirigido a la configuración de seguridad.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Continuar', 
              onPress: () => {
                // TODO: Implementar cambio de contraseña
                navigation.navigate('Configuraciones');
              }
            }
          ]
        );
        break;
      case 'help':
        Alert.alert('Centro de Ayuda', 'Próximamente: Centro de ayuda completo con tutoriales y FAQ.');
        break;
      case 'contact':
        Alert.alert('Contactar Soporte', 'Email: soporte@wuauser.com\nTeléfono: 55-8000-WUAUSER');
        break;
      case 'terms':
        Alert.alert('Términos y Condiciones', 'Próximamente: Acceso a términos y condiciones actualizados.');
        break;
      default:
        Alert.alert('Función', 'Esta función estará disponible próximamente');
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color={vetTheme.colors.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={vetTheme.colors.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={vetTheme.colors.text.light} />
      );
    }

    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header del Perfil Profesional */}
        <View style={styles.profileHeader}>
          {/* Settings button en top-right */}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Configuraciones')}
          >
            <Ionicons name="settings-outline" size={24} color={vetTheme.colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => Alert.alert('Cambiar Foto', 'Funcionalidad disponible próximamente')}
          >
            {veterinario.avatar ? (
              <Image source={{ uri: veterinario.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {veterinario.nombre.split(' ').map(n => n.charAt(0)).join('')}
                </Text>
              </View>
            )}
            <View style={styles.editAvatarButton}>
              <Ionicons name="camera" size={14} color="white" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.veterinarioNombre}>{veterinario.nombre}</Text>
            <Text style={styles.veterinarioEspecialidad}>{veterinario.especialidad}</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(veterinario.rating)}
              </View>
              <Text style={styles.ratingText}>
                {veterinario.rating} • {veterinario.totalReviews} reseñas
              </Text>
            </View>
            
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={16} color={vetTheme.colors.status.success} />
              <Text style={styles.verificationText}>Verificado por WUAUSER</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.publicProfileButton}
            onPress={() => navigation.navigate('PerfilPublico')}
          >
            <Ionicons name="eye-outline" size={16} color={vetTheme.colors.primary} />
            <Text style={styles.publicProfileButtonText}>Ver mi perfil público</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas Rápidas del Mes */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Resumen del Mes</Text>
          <View style={styles.statsGrid}>
            <StatCard
              numero={formatearNumero(veterinario.estadisticas.pacientesActivos)}
              descripcion="Pacientes Activos"
              icono="paw"
              color={vetTheme.colors.primary}
            />
            <StatCard
              numero={formatearNumero(veterinario.estadisticas.citasEsteMes)}
              descripcion="Citas Este Mes"
              icono="calendar"
              color={vetTheme.colors.secondary}
            />
            <StatCard
              numero={`$${formatearNumero(veterinario.estadisticas.ingresosMes)}`}
              descripcion="Ingresos del Mes"
              icono="cash"
              color={vetTheme.colors.status.success}
            />
            <StatCard
              numero={`${veterinario.estadisticas.añosEnWuauser}y`}
              descripcion="En WUAUSER"
              icono="heart"
              color={vetTheme.colors.accent}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.verEstadisticasBtn}
            onPress={() => navigation.navigate('Estadisticas')}
          >
            <Text style={styles.verEstadisticasText}>Ver estadísticas completas</Text>
            <Ionicons name="arrow-forward" size={16} color={vetTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Secciones de Configuración */}
        {perfilSecciones.map((seccion, index) => (
          <ProfileSection key={index} titulo={seccion.titulo}>
            {seccion.items.map((item, itemIndex) => (
              <SettingItem
                key={itemIndex}
                titulo={item.titulo}
                icono={item.icono}
                badge={item.badge}
                color={item.color === 'danger' ? vetTheme.colors.danger : vetTheme.colors.text.primary}
                onPress={() => {
                  if (item.screen) {
                    handleNavigation(item.screen);
                  } else if (item.action) {
                    handleAction(item.action);
                  }
                }}
              />
            ))}
          </ProfileSection>
        ))}

        {/* Información de la App */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>WUAUSER Veterinario v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>© 2024 WUAUSER. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: vetTheme.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: vetTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: vetTheme.typography.weights.bold,
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: vetTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: vetTheme.spacing.lg,
  },
  veterinarioNombre: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
    textAlign: 'center',
  },
  veterinarioEspecialidad: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
    textAlign: 'center',
  },
  veterinarioExperiencia: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    marginBottom: vetTheme.spacing.sm,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  ratingText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  settingsButton: {
    position: 'absolute',
    top: vetTheme.spacing.md,
    right: vetTheme.spacing.lg,
    zIndex: 1,
    padding: vetTheme.spacing.sm,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vetTheme.spacing.sm,
  },
  verificationText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.status.success,
    marginLeft: vetTheme.spacing.xs,
    fontWeight: vetTheme.typography.weights.medium,
  },
  publicProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${vetTheme.colors.primary}15`,
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: vetTheme.colors.primary,
    marginTop: vetTheme.spacing.md,
  },
  publicProfileButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.primary,
    marginLeft: vetTheme.spacing.sm,
  },
  verEstadisticasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.sm,
  },
  verEstadisticasText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.medium,
    marginRight: vetTheme.spacing.xs,
  },
  statsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
    marginTop: vetTheme.spacing.sm,
  },
  statsTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    marginBottom: vetTheme.spacing.xs,
  },
  statDescription: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  section: {
    backgroundColor: 'white',
    marginTop: vetTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    paddingHorizontal: vetTheme.spacing.lg,
    paddingTop: vetTheme.spacing.lg,
    paddingBottom: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingBottom: vetTheme.spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: vetTheme.spacing.md,
  },
  settingTitle: {
    fontSize: vetTheme.typography.sizes.md,
    flex: 1,
  },
  badge: {
    backgroundColor: vetTheme.colors.danger,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: vetTheme.spacing.sm,
  },
  badgeText: {
    color: 'white',
    fontSize: vetTheme.typography.sizes.xs,
    fontWeight: vetTheme.typography.weights.bold,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.xl,
    paddingHorizontal: vetTheme.spacing.lg,
  },
  appInfoText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    marginBottom: vetTheme.spacing.xs,
  },
  appInfoSubtext: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
    textAlign: 'center',
  },
});

export default VetProfileTab;