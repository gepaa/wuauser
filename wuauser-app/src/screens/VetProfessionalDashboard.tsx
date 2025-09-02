import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/colors';
import { authService } from '../services/supabase';

interface VetProfessionalDashboardProps {
  navigation: any;
}

interface VetData {
  nombre_completo: string;
  email: string;
  verificado?: boolean;
}

export const VetProfessionalDashboard: React.FC<VetProfessionalDashboardProps> = ({ navigation }) => {
  const [vetData, setVetData] = useState<VetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVetData();
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadVetData();
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

  // Main navigation cards for veterinarians
  const mainActions = [
    {
      id: 'appointments',
      title: 'Citas del Día',
      subtitle: 'Revisar agenda',
      icon: 'calendar',
      color: '#2196F3',
      gradient: ['#2196F3', '#1976D2'],
      count: '5 hoy',
      onPress: () => navigation.navigate('Citas')
    },
    {
      id: 'patients',
      title: 'Mis Pacientes',
      subtitle: 'Ver expedientes',
      icon: 'people',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#388E3C'],
      count: '127 total',
      onPress: () => navigation.navigate('VetPatients')
    },
    {
      id: 'messages',
      title: 'Mensajes',
      subtitle: 'Comunicación',
      icon: 'chatbubbles',
      color: '#FF9800',
      gradient: ['#FF9800', '#F57C00'],
      count: '3 nuevos',
      badge: 3,
      onPress: () => navigation.navigate('ChatList')
    },
    {
      id: 'profile',
      title: 'Mi Perfil',
      subtitle: 'Configuración',
      icon: 'person-circle',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#7B1FA2'],
      count: 'Completo',
      onPress: () => navigation.navigate('Perfil')
    }
  ];

  const quickActions = [
    {
      id: 'emergency',
      title: 'Emergencia',
      icon: 'medical',
      color: '#F44336',
      onPress: () => Alert.alert('Emergencia', 'Función de emergencia disponible próximamente')
    },
    {
      id: 'schedule',
      title: 'Horarios',
      icon: 'time',
      color: '#2196F3',
      onPress: () => navigation.navigate('VetScheduleManagement')
    },
    {
      id: 'results',
      title: 'Resultados',
      icon: 'document-text',
      color: '#4CAF50',
      onPress: () => navigation.navigate('UploadResults', {
        appointmentId: 'demo_appointment',
        petName: 'Paciente',
        ownerName: 'Dueño'
      })
    },
    {
      id: 'settings',
      title: 'Configuración',
      icon: 'settings',
      color: '#757575',
      onPress: () => Alert.alert('Configuración', 'Próximamente disponible')
    }
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('user_email');
              await SecureStore.deleteItemAsync('user_type');
              navigation.navigate('UserType');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greetingText}>
                {getGreeting()}, Dr. {getVetFirstName()}
              </Text>
              <Text style={styles.subGreetingText}>
                Panel de Control Veterinario
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Actions Grid */}
        <View style={styles.mainActionsContainer}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <View style={styles.mainActionsGrid}>
            {mainActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.mainActionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionHeader}>
                    <Ionicons name={action.icon as any} size={32} color="#FFF" />
                    {action.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  <Text style={styles.actionCount}>{action.count}</Text>
                </LinearGradient>
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
                style={[styles.quickActionCard, { borderLeftColor: action.color }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={20} color="#FFF" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Estado del Sistema</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.statusText}>Sistema Operativo</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="wifi" size={20} color={Colors.success} />
                <Text style={styles.statusText}>Conectado</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                <Text style={styles.statusText}>Datos Seguros</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="sync" size={20} color={Colors.primary} />
                <Text style={styles.statusText}>Sincronizado</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Safety space for tab navigator */}
        <View style={styles.safetySpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subGreetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D29',
    marginBottom: 16,
  },
  mainActionsContainer: {
    padding: 20,
  },
  mainActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  mainActionCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    flex: 1,
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  safetySpace: {
    height: 20,
  },
});

export default VetProfessionalDashboard;