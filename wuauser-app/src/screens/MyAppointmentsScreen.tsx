import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import appointmentService, { Appointment } from '../services/appointmentService';
import { chatService } from '../services/chatService';
import { supabase } from '../services/supabase';
import { Colors } from '../constants/colors';

interface MyAppointmentsProps {
  navigation: any;
  route?: {
    params?: {
      userId?: string;
    };
  };
}

type FilterType = 'upcoming' | 'past' | 'all';

export const MyAppointmentsScreen: React.FC<MyAppointmentsProps> = ({ navigation, route }) => {
  const userId = route?.params?.userId || 'user_001'; // Default for testing
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [activeFilter]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await appointmentService.getUserAppointments(userId, activeFilter);
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar las citas');
        return;
      }
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await appointmentService.cancelAppointment(
                appointmentId, 
                'Cancelada por el usuario'
              );
              if (error) {
                Alert.alert('Error', 'No se pudo cancelar la cita');
                return;
              }
              Alert.alert('Éxito', 'Tu cita ha sido cancelada');
              loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la cita');
            }
          }
        }
      ]
    );
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Reagendar Cita',
      '¿Quieres reagendar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reagendar',
          onPress: () => {
            navigation.navigate('BookAppointment', {
              vetId: appointment.vetId,
              vetName: appointment.vetName,
              rescheduleId: appointment.id,
              currentDate: appointment.date,
              currentTime: appointment.time,
            });
          }
        }
      ]
    );
  };

  const handleContactVet = async (appointment: Appointment) => {
    try {
      // Obtener ID del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se pudo obtener tu información');
        return;
      }

      // Crear o obtener chat existente
      const chat = await chatService.createOrGetChat(
        user.id,
        appointment.vetId,
        {
          ownerName: user.user_metadata?.nombre_completo || 'Dueño',
          vetName: appointment.vetName || 'Veterinario',
          vetClinic: appointment.clinicName || 'Clínica',
          context: `Cita del ${new Date(appointment.date).toLocaleDateString()} a las ${appointment.time}`
        }
      );

      // Navegar a chat
      navigation.navigate('Chat', {
        chatId: chat.id,
        otherUser: {
          id: appointment.vetId,
          name: appointment.vetName,
          type: 'veterinario'
        }
      });

    } catch (error) {
      console.error('Error al abrir chat:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir el chat. Por favor intenta de nuevo.'
      );
    }
  };

  const handleViewVetProfile = (appointment: Appointment) => {
    navigation.navigate('VetDetail', {
      vetId: appointment.vetId,
      vetName: appointment.vetName,
    });
  };

  const getFilterTitle = (filter: FilterType): string => {
    switch (filter) {
      case 'upcoming': return 'Próximas';
      case 'past': return 'Pasadas';
      case 'all': return 'Todas';
      default: return 'Próximas';
    }
  };

  const getAppointmentsByStatus = () => {
    const pending = appointments.filter(apt => apt.status === 'pending');
    const confirmed = appointments.filter(apt => apt.status === 'confirmed');
    const completed = appointments.filter(apt => apt.status === 'completed');
    const cancelled = appointments.filter(apt => apt.status === 'cancelled');
    
    return { pending, confirmed, completed, cancelled };
  };

  const canCancelAppointment = (appointment: Appointment): boolean => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return hoursDiff > 2 && ['pending', 'confirmed'].includes(appointment.status);
  };

  const canRescheduleAppointment = (appointment: Appointment): boolean => {
    return canCancelAppointment(appointment);
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {(['upcoming', 'past', 'all'] as FilterType[]).map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterTab,
            activeFilter === filter && styles.filterTabActive
          ]}
          onPress={() => setActiveFilter(filter)}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === filter && styles.filterTabTextActive
          ]}>
            {getFilterTitle(filter)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentDateTime}>
          <Text style={styles.dateText}>
            {appointmentService.formatAppointmentDate(item.date)}
          </Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: appointmentService.getAppointmentStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {appointmentService.getAppointmentStatusText(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.appointmentInfo}>
        <TouchableOpacity 
          style={styles.vetInfo}
          onPress={() => handleViewVetProfile(item)}
        >
          <Text style={styles.vetName}>{item.vetName}</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
        
        <Text style={styles.petName}>Mascota: {item.petName}</Text>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        
        {item.reason && (
          <Text style={styles.reason} numberOfLines={2}>
            "{item.reason}"
          </Text>
        )}
        
        <View style={styles.appointmentMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item.duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.metaText}>${item.servicePrice}</Text>
          </View>
          {item.isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="warning" size={14} color="#FF5722" />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          )}
          {item.isFirstTime && (
            <View style={styles.firstTimeBadge}>
              <Ionicons name="star" size={14} color="#2196F3" />
              <Text style={styles.firstTimeText}>Primera vez</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.appointmentActions}>
        {canCancelAppointment(item) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelAppointment(item.id)}
          >
            <Ionicons name="close-circle-outline" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
        
        {canRescheduleAppointment(item) && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => handleRescheduleAppointment(item)}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Reagendar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.contactButton]}
          onPress={() => handleContactVet(item)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Contactar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No tienes citas {getFilterTitle(activeFilter).toLowerCase()}</Text>
      <Text style={styles.emptyMessage}>
        {activeFilter === 'upcoming' 
          ? 'Agenda una cita con un veterinario cerca de ti'
          : 'Tus citas aparecerán aquí'
        }
      </Text>
      {activeFilter === 'upcoming' && (
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.bookButtonText}>Buscar Veterinarios</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSummaryCards = () => {
    const { pending, confirmed, completed, cancelled } = getAppointmentsByStatus();
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{pending.length}</Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
          <View style={[styles.summaryIndicator, { backgroundColor: '#FF9800' }]} />
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{confirmed.length}</Text>
          <Text style={styles.summaryLabel}>Confirmadas</Text>
          <View style={[styles.summaryIndicator, { backgroundColor: '#4CAF50' }]} />
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{completed.length}</Text>
          <Text style={styles.summaryLabel}>Completadas</Text>
          <View style={[styles.summaryIndicator, { backgroundColor: '#2196F3' }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Citas</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#2A2A2A" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Appointments List */}
        <View style={styles.appointmentsContainer}>
          {appointments.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={appointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#F4B740"
                />
              }
              contentContainerStyle={styles.appointmentsList}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4B740',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#FFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(42, 42, 42, 0.7)',
  },
  filterTabTextActive: {
    color: '#F4B740',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  summaryIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  appointmentsContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  appointmentsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#F4B740',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentDateTime: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  appointmentInfo: {
    marginBottom: 16,
  },
  vetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  petName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F4B740',
    marginBottom: 8,
  },
  reason: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 10,
    color: '#FF5722',
    fontWeight: '600',
    marginLeft: 2,
  },
  firstTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 183, 64, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  firstTimeText: {
    fontSize: 10,
    color: '#F4B740',
    fontWeight: '600',
    marginLeft: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  rescheduleButton: {
    backgroundColor: '#FF9800',
  },
  contactButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#F4B740',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyAppointmentsScreen;