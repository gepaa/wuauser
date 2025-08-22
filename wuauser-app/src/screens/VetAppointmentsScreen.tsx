import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { Colors } from '../constants/colors';

interface VetAppointmentsProps {
  navigation: any;
  route?: {
    params?: {
      vetId?: string;
    };
  };
}

type FilterType = 'today' | 'week' | 'month';

export const VetAppointmentsScreen: React.FC<VetAppointmentsProps> = ({ navigation, route }) => {
  const vetId = route?.params?.vetId || 'vet_001'; // Default for testing
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [activeFilter]);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await appointmentService.getVetAppointments(vetId, activeFilter);
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

  const handleConfirmAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Confirmar Cita',
      '¿Estás seguro de que quieres confirmar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const { error } = await appointmentService.confirmAppointment(appointmentId);
              if (error) {
                Alert.alert('Error', 'No se pudo confirmar la cita');
                return;
              }
              Alert.alert('Éxito', 'La cita ha sido confirmada');
              loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo confirmar la cita');
            }
          }
        }
      ]
    );
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
              const { error } = await appointmentService.cancelAppointment(appointmentId, 'Cancelada por el veterinario');
              if (error) {
                Alert.alert('Error', 'No se pudo cancelar la cita');
                return;
              }
              Alert.alert('Éxito', 'La cita ha sido cancelada');
              loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la cita');
            }
          }
        }
      ]
    );
  };

  const handleSendMessage = (appointment: Appointment) => {
    Alert.alert(
      'Enviar Mensaje',
      `¿Quieres enviar un mensaje a ${appointment.ownerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            // TODO: Navigate to chat screen
            console.log('Send message to:', appointment.ownerEmail);
            Alert.alert('Función en desarrollo', 'La función de mensajería estará disponible pronto');
          }
        }
      ]
    );
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    Alert.alert(
      'Marcar como Completada',
      '¿La cita ha sido completada exitosamente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            try {
              const { error } = await appointmentService.updateAppointmentStatus(appointmentId, 'completed');
              if (error) {
                Alert.alert('Error', 'No se pudo marcar la cita como completada');
                return;
              }
              Alert.alert('Éxito', 'La cita ha sido marcada como completada');
              loadAppointments();
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la cita');
            }
          }
        }
      ]
    );
  };

  const getFilterTitle = (filter: FilterType): string => {
    switch (filter) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      default: return 'Hoy';
    }
  };

  const getAppointmentsByStatus = () => {
    const confirmed = appointments.filter(apt => apt.status === 'confirmed');
    const pending = appointments.filter(apt => apt.status === 'pending');
    const completed = appointments.filter(apt => apt.status === 'completed');
    
    return { confirmed, pending, completed };
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {(['today', 'week', 'month'] as FilterType[]).map((filter) => (
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
        <View style={styles.appointmentTime}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.timeText}>{item.time}</Text>
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
        <Text style={styles.petName}>{item.petName}</Text>
        <Text style={styles.ownerName}>Dueño: {item.ownerName}</Text>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        {item.reason && (
          <Text style={styles.reason} numberOfLines={2}>
            "{item.reason}"
          </Text>
        )}
        
        <View style={styles.appointmentMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{item.duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.metaText}>${item.servicePrice}</Text>
          </View>
          {item.isUrgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="warning" size={16} color="#FF5722" />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          )}
          {item.isFirstTime && (
            <View style={styles.firstTimeBadge}>
              <Ionicons name="star" size={16} color="#2196F3" />
              <Text style={styles.firstTimeText}>Primera vez</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.appointmentActions}>
        {item.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleConfirmAppointment(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelAppointment(item.id)}
            >
              <Ionicons name="close" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
        
        {item.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleCompleteAppointment(item.id)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Completar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => handleSendMessage(item)}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Mensaje</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No hay citas {getFilterTitle(activeFilter).toLowerCase()}</Text>
      <Text style={styles.emptyMessage}>
        Las citas agendadas aparecerán aquí
      </Text>
    </View>
  );

  const renderSummaryCards = () => {
    const { confirmed, pending, completed } = getAppointmentsByStatus();
    
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
        colors={['#2196F3', '#E3F2FD']}
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
                  tintColor="#2196F3"
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
    backgroundColor: '#2196F3',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#2196F3',
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
    borderLeftColor: '#2196F3',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginLeft: 8,
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
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
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
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  firstTimeText: {
    fontSize: 10,
    color: '#2196F3',
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
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  messageButton: {
    backgroundColor: '#FF9800',
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default VetAppointmentsScreen;