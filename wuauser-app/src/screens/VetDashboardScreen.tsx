import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/colors';
import { authService } from '../services/supabase';
import appointmentService from '../services/appointmentService';
import roleService from '../services/roleService';

const { width } = Dimensions.get('window');

interface VetDashboardProps {
  navigation: any;
}

interface VetData {
  nombre_completo: string;
  email: string;
  verificado?: boolean;
}

interface TodayStats {
  appointments: number;
  patients: number;
  earnings: string;
  rating: string;
}

const quickActions = [
  {
    id: 1,
    title: "Nueva Cita",
    subtitle: "Agendar consulta",
    icon: "calendar-outline",
    color: "#2196F3",
    backgroundColor: "#E8F4FD",
    action: "newAppointment"
  },
  {
    id: 2,
    title: "Nuevo Expediente",
    subtitle: "Crear historial",
    icon: "document-text-outline",
    color: "#4CAF50",
    backgroundColor: "#E8F5E8",
    action: "newRecord"
  },
  {
    id: 3,
    title: "Receta Médica",
    subtitle: "Generar receta",
    icon: "medical-outline",
    color: "#FF9800",
    backgroundColor: "#FFF3E0",
    action: "prescription"
  },
  {
    id: 4,
    title: "Subir Resultados",
    subtitle: "Análisis/estudios",
    icon: "camera-outline",
    color: "#9C27B0",
    backgroundColor: "#F3E5F5",
    action: "uploadResults"
  }
];

export const VetDashboardScreen: React.FC<VetDashboardProps> = ({ navigation }) => {
  const [vetData, setVetData] = useState<VetData | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    appointments: 5,
    patients: 127,
    earnings: "$12,400",
    rating: "4.8"
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVetData();
    loadTodayAppointments();
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

  const loadTodayAppointments = async () => {
    try {
      // Mock data for today's appointments
      const mockAppointments = [
        {
          id: '1',
          time: '09:00',
          petName: 'Max',
          ownerName: 'Carlos Rodríguez',
          service: 'Consulta General'
        },
        {
          id: '2',
          time: '10:30',
          petName: 'Luna',
          ownerName: 'María García',
          service: 'Vacunación'
        },
        {
          id: '3',
          time: '14:00',
          petName: 'Rocky',
          ownerName: 'Juan Pérez',
          service: 'Control Post-operatorio'
        }
      ];
      setTodayAppointments(mockAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadVetData();
    await loadTodayAppointments();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
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

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'newAppointment':
        Alert.alert('Nueva Cita', 'Función de nueva cita próximamente disponible.');
        break;
      case 'newRecord':
        Alert.alert('Nuevo Expediente', 'Función de expedientes próximamente disponible.');
        break;
      case 'prescription':
        Alert.alert('Receta Médica', 'Función de recetas próximamente disponible.');
        break;
      case 'uploadResults':
        Alert.alert('Subir Resultados', 'Función de resultados próximamente disponible.');
        break;
      default:
        break;
    }
  };

  const handleRoleSwitch = async () => {
    Alert.alert(
      'Cambiar a Modo Dueño',
      'Te cambiará a la vista de dueño de mascotas. ¿Continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cambiar',
          onPress: async () => {
            try {
              await roleService.switchRole();
              // The TabNavigator will automatically update thanks to the subscription
            } catch (error) {
              Alert.alert('Error', 'No se pudo cambiar el rol');
            }
          }
        }
      ]
    );
  };

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with greeting - EXACT same as HomeScreen */}
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.header}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            {getGreeting()}, Dr. {getVetFirstName()} 👋
          </Text>
          <Text style={styles.subGreetingText}>
            ¿Cómo va tu consulta hoy?
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Stats Cards - 2x2 Grid */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>Resumen de Hoy</Text>
          
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#E8F4FD' }]}
              onPress={() => navigation.navigate('VetAppointments', { vetId: 'vet_001' })}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="calendar" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Citas de Hoy</Text>
              <Text style={styles.quickAccessSubtitle}>{todayStats.appointments} pendientes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#E8F5E8' }]}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="people" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Mis Pacientes</Text>
              <Text style={styles.quickAccessSubtitle}>{todayStats.patients} registrados</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#FFF3E0' }]}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="cash" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Ingresos</Text>
              <Text style={styles.quickAccessSubtitle}>{todayStats.earnings} esta sem</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#F3E5F5' }]}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="star" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Reseñas</Text>
              <Text style={styles.quickAccessSubtitle}>{todayStats.rating} (45 nuevas)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Clinic Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Hoy en tu Clínica</Text>
          
          {todayAppointments.length > 0 ? (
            <>
              {todayAppointments.slice(0, 3).map((appointment: any) => (
                <View key={appointment.id} style={styles.tipCard}>
                  <View style={[styles.tipIcon, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="time-outline" size={20} color="#FFF" />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{appointment.time} - {appointment.petName}</Text>
                    <Text style={styles.tipDescription}>
                      Dueño: {appointment.ownerName} • {appointment.service}
                    </Text>
                  </View>
                </View>
              ))}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('VetAppointments', { vetId: 'vet_001' })}
              >
                <Text style={styles.viewAllButtonText}>Ver agenda completa</Text>
                <Ionicons name="arrow-forward" size={16} color="#2196F3" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: '#E0E0E0' }]}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Sin citas programadas</Text>
                <Text style={styles.tipDescription}>
                  No tienes citas para hoy. ¡Disfruta tu día libre!
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.backgroundColor }]}
                onPress={() => handleQuickAction(action.action)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={20} color="#FFF" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Role Switch */}
        <TouchableOpacity style={styles.roleSwitchCard} onPress={handleRoleSwitch}>
          <View style={styles.roleSwitchContent}>
            <View style={styles.roleSwitchIcon}>
              <Ionicons name="swap-horizontal" size={24} color="#4ECDC4" />
            </View>
            <View style={styles.roleSwitchTextContainer}>
              <Text style={styles.roleSwitchTitle}>Cambiar a modo Dueño</Text>
              <Text style={styles.roleSwitchSubtitle}>Administra tus propias mascotas</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#4ECDC4" />
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <View style={styles.logoutContent}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
            </View>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </View>
        </TouchableOpacity>

        {/* Safety Space */}
        <View style={styles.safetySpace} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 30,
  },
  greetingContainer: {
    marginTop: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  subGreetingText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 20,
  },
  quickAccessContainer: {
    marginBottom: 36,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickAccessButton: {
    width: (width - 64) / 2,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 140,
    justifyContent: 'center',
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  quickAccessTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 6,
    textAlign: 'center',
  },
  quickAccessSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsContainer: {
    marginBottom: 36,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  quickActionsContainer: {
    marginBottom: 36,
  },
  quickActionsScroll: {
    paddingRight: 16,
    gap: 16,
  },
  quickActionCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 16,
    width: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  roleSwitchCard: {
    marginBottom: 20,
    backgroundColor: '#F0FDFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  roleSwitchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  roleSwitchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleSwitchTextContainer: {
    flex: 1,
  },
  roleSwitchTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  roleSwitchSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
  },
  safetySpace: {
    height: 100,
  },
});

export default VetDashboardScreen;