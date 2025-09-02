import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { vetTheme } from '../../../constants/vetTheme';
import { authService } from '../../../services/supabase';

interface VetHomeTabProps {
  navigation: any;
}

interface VetData {
  nombre_completo: string;
  email: string;
  verificado?: boolean;
}

interface DashboardStats {
  todayAppointments: number;
  pendingMessages: number;
  activePatients: number;
  emergencies: number;
}

export const VetHomeTab: React.FC<VetHomeTabProps> = ({ navigation }) => {
  const [vetData, setVetData] = useState<VetData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 5,
    pendingMessages: 3,
    activePatients: 127,
    emergencies: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVetData();
    loadStats();
  }, []);

  const loadVetData = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('user_email');
      
      if (savedEmail) {
        if (process.env.NODE_ENV === 'development') {
          const mockVetData: VetData = {
            nombre_completo: 'Dr. ' + savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: savedEmail,
            verificado: savedEmail === 'vet@test.com' ? false : true
          };
          setVetData(mockVetData);
        } else {
          const { user, error } = await authService.getCurrentUser();
          if (user && !error) {
            setVetData({
              nombre_completo: user.user_metadata?.nombre_completo || 'Dr. Veterinario',
              email: user.email || '',
              verificado: user.user_metadata?.cedula_profesional === 'PRUEBA123' ? false : true
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading vet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    // Mock stats - in real app would load from API
    setStats({
      todayAppointments: 5,
      pendingMessages: 3,
      activePatients: 127,
      emergencies: 0,
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadVetData();
    await loadStats();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getVetFirstName = () => {
    if (!vetData?.nombre_completo) return 'Doctor';
    const name = vetData.nombre_completo.replace('Dr. ', '').replace('Dra. ', '');
    return name.split(' ')[0];
  };

  const mainCards = [
    {
      id: 'appointments',
      title: 'Citas de Hoy',
      value: stats.todayAppointments.toString(),
      subtitle: 'programadas',
      icon: 'calendar',
      color: vetTheme.colors.secondary,
      onPress: () => navigation.navigate('VetAgenda'),
    },
    {
      id: 'messages',
      title: 'Mensajes',
      value: stats.pendingMessages.toString(),
      subtitle: 'pendientes',
      icon: 'chatbubbles',
      color: vetTheme.colors.accent,
      badge: stats.pendingMessages > 0 ? stats.pendingMessages : undefined,
      onPress: () => navigation.navigate('VetMessages'),
    },
    {
      id: 'patients',
      title: 'Pacientes',
      value: stats.activePatients.toString(),
      subtitle: 'activos',
      icon: 'paw',
      color: vetTheme.colors.primary,
      onPress: () => navigation.navigate('VetPatients'),
    },
    {
      id: 'emergency',
      title: 'Emergencias',
      value: stats.emergencies.toString(),
      subtitle: stats.emergencies === 0 ? 'sin emergencias' : 'requieren atención',
      icon: 'medical',
      color: stats.emergencies > 0 ? vetTheme.colors.danger : vetTheme.colors.status.success,
      onPress: () => Alert.alert('Emergencias', 'Sistema de emergencias próximamente'),
    },
  ];

  const quickActions = [
    {
      id: 'new-appointment',
      title: 'Nueva Cita',
      icon: 'add-circle',
      color: vetTheme.colors.secondary,
      onPress: () => Alert.alert('Nueva Cita', 'Funcionalidad próximamente'),
    },
    {
      id: 'emergency',
      title: 'Emergencia',
      icon: 'medical',
      color: vetTheme.colors.danger,
      onPress: () => Alert.alert('Emergencia', 'Sistema de emergencias próximamente'),
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[vetTheme.colors.primary]}
            tintColor={vetTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={vetTheme.colors.primary} />
              </View>
              <View style={styles.statusDot} />
            </View>
            
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                {getGreeting()}, Dr. {getVetFirstName()}
              </Text>
              <View style={styles.statusContainer}>
                <View style={styles.connectionStatus}>
                  <View style={styles.connectionDot} />
                  <Text style={styles.statusText}>Conectado</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={22} color={vetTheme.colors.text.secondary} />
              {stats.pendingMessages > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {stats.pendingMessages > 9 ? '9+' : stats.pendingMessages.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Cards */}
        <View style={styles.mainCardsContainer}>
          <Text style={styles.sectionTitle}>Resumen del Día</Text>
          <View style={styles.cardsGrid}>
            {mainCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.mainCard}
                onPress={card.onPress}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: `${card.color}15` }]}>
                    <Ionicons name={card.icon as any} size={24} color={card.color} />
                  </View>
                  {card.badge && (
                    <View style={styles.cardBadge}>
                      <Text style={styles.cardBadgeText}>{card.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardValue}>{card.value}</Text>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={20} color={vetTheme.colors.text.inverse} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: vetTheme.colors.background,
    paddingVertical: vetTheme.spacing.lg,
    paddingHorizontal: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: vetTheme.borderRadius.full,
    backgroundColor: `${vetTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: vetTheme.colors.status.success,
    borderWidth: 2,
    borderColor: vetTheme.colors.background,
  },
  greetingContainer: {
    flex: 1,
    marginLeft: vetTheme.spacing.md,
  },
  greetingText: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${vetTheme.colors.status.success}15`,
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: 2,
    borderRadius: vetTheme.borderRadius.sm,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: vetTheme.colors.status.success,
    marginRight: 4,
  },
  statusText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.status.success,
    fontWeight: vetTheme.typography.weights.medium,
  },
  notificationButton: {
    position: 'relative',
    padding: vetTheme.spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: vetTheme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: vetTheme.colors.text.inverse,
    fontWeight: vetTheme.typography.weights.bold,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.md,
  },
  mainCardsContainer: {
    paddingHorizontal: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: vetTheme.spacing.md,
  },
  mainCard: {
    width: '47%',
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.md,
    ...vetTheme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    backgroundColor: vetTheme.colors.danger,
    borderRadius: vetTheme.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: 10,
    color: vetTheme.colors.text.inverse,
    fontWeight: vetTheme.typography.weights.bold,
  },
  cardValue: {
    fontSize: vetTheme.typography.sizes['3xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  quickActionsContainer: {
    paddingHorizontal: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: vetTheme.spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.lg,
    alignItems: 'center',
    ...vetTheme.shadows.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vetTheme.spacing.sm,
  },
  quickActionText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default VetHomeTab;