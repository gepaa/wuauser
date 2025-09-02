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
import { Colors } from '../constants/colors';

interface VetAppointmentsProfessionalProps {
  navigation: any;
}

interface Appointment {
  id: string;
  time: string;
  petName: string;
  ownerName: string;
  service: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'emergency';
  ownerPhone?: string;
}

export const VetAppointmentsProfessional: React.FC<VetAppointmentsProfessionalProps> = ({ navigation }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    // Mock data - in real app load from API
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        time: '09:00',
        petName: 'Max',
        ownerName: 'Carlos Rodríguez',
        service: 'Consulta General',
        status: 'confirmed',
        priority: 'normal',
        ownerPhone: '+52 55 1234 5678'
      },
      {
        id: '2',
        time: '09:30',
        petName: 'Luna',
        ownerName: 'María García',
        service: 'Vacunación',
        status: 'pending',
        priority: 'normal',
        ownerPhone: '+52 55 2345 6789'
      },
      {
        id: '3',
        time: '10:00',
        petName: 'Rocky',
        ownerName: 'Juan Pérez',
        service: 'Emergencia - Dificultad respiratoria',
        status: 'confirmed',
        priority: 'emergency',
        ownerPhone: '+52 55 3456 7890'
      },
      {
        id: '4',
        time: '11:00',
        petName: 'Milo',
        ownerName: 'Ana López',
        service: 'Control Post-operatorio',
        status: 'confirmed',
        priority: 'urgent',
        ownerPhone: '+52 55 4567 8901'
      },
      {
        id: '5',
        time: '14:00',
        petName: 'Simba',
        ownerName: 'Pedro Martínez',
        service: 'Revisión Dental',
        status: 'pending',
        priority: 'normal',
        ownerPhone: '+52 55 5678 9012'
      }
    ];
    setAppointments(mockAppointments);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'completed': return Colors.primary;
      case 'cancelled': return Colors.error;
      default: return Colors.gray[400];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return Colors.error;
      case 'urgent': return Colors.warning;
      case 'normal': return Colors.gray[400];
      default: return Colors.gray[400];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Sin Estado';
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    Alert.alert(
      `Cita: ${appointment.petName}`,
      `Dueño: ${appointment.ownerName}\nServicio: ${appointment.service}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => {/* Handle call */} },
        { text: 'Completar', onPress: () => {/* Handle complete */} },
      ]
    );
  };

  const handleNewAppointment = () => {
    Alert.alert('Nueva Cita', 'Funcionalidad para crear nueva cita próximamente.');
  };

  const dateOptions = [
    { id: 'today', label: 'Hoy' },
    { id: 'tomorrow', label: 'Mañana' },
    { id: 'week', label: 'Esta Semana' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <TouchableOpacity 
          style={styles.newAppointmentButton}
          onPress={handleNewAppointment}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.newAppointmentText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter */}
      <ScrollView 
        horizontal 
        style={styles.dateFilter}
        showsHorizontalScrollIndicator={false}
      >
        {dateOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.dateOption,
              selectedDate === option.id && styles.dateOptionActive
            ]}
            onPress={() => setSelectedDate(option.id)}
          >
            <Text style={[
              styles.dateOptionText,
              selectedDate === option.id && styles.dateOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{appointments.length}</Text>
            <Text style={styles.summaryLabel}>Total Hoy</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: Colors.warning }]}>
              {appointments.filter(a => a.status === 'pending').length}
            </Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: Colors.error }]}>
              {appointments.filter(a => a.priority === 'emergency').length}
            </Text>
            <Text style={styles.summaryLabel}>Emergencias</Text>
          </View>
        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsContainer}>
          <Text style={styles.sectionTitle}>Agenda del Día</Text>
          
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                style={[
                  styles.appointmentCard,
                  appointment.priority === 'emergency' && styles.emergencyCard
                ]}
                onPress={() => handleAppointmentPress(appointment)}
                activeOpacity={0.7}
              >
                <View style={styles.appointmentHeader}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{appointment.time}</Text>
                    {appointment.priority !== 'normal' && (
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(appointment.priority) }
                      ]}>
                        <Ionicons 
                          name={appointment.priority === 'emergency' ? 'warning' : 'alert'} 
                          size={12} 
                          color="#FFF" 
                        />
                      </View>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(appointment.status) }
                  ]}>
                    <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
                  </View>
                </View>

                <View style={styles.appointmentBody}>
                  <View style={styles.petInfo}>
                    <Ionicons name="paw" size={20} color={Colors.primary} />
                    <Text style={styles.petName}>{appointment.petName}</Text>
                  </View>
                  
                  <View style={styles.ownerInfo}>
                    <Ionicons name="person" size={18} color={Colors.gray[500]} />
                    <Text style={styles.ownerName}>{appointment.ownerName}</Text>
                  </View>

                  <View style={styles.serviceInfo}>
                    <Ionicons name="medical" size={18} color={Colors.gray[500]} />
                    <Text style={[
                      styles.serviceText,
                      appointment.priority === 'emergency' && styles.emergencyText
                    ]}>
                      {appointment.service}
                    </Text>
                  </View>
                </View>

                <View style={styles.appointmentActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert('Llamar', `¿Llamar a ${appointment.ownerName}?`);
                    }}
                  >
                    <Ionicons name="call" size={16} color={Colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.chatButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      // Navigate to chat
                      navigation.navigate('Chat', {
                        otherUser: {
                          name: appointment.ownerName,
                          petName: appointment.petName
                        }
                      });
                    }}
                  >
                    <Ionicons name="chatbubble" size={16} color={Colors.accent} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert('Completar', '¿Marcar cita como completada?');
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color={Colors.success} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No hay citas programadas</Text>
              <Text style={styles.emptySubtitle}>Las citas aparecerán aquí cuando sean programadas</Text>
            </View>
          )}
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
  },
  newAppointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  newAppointmentText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  dateFilter: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  dateOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
  },
  dateOptionActive: {
    backgroundColor: Colors.primary,
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  dateOptionTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  appointmentsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D29',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentBody: {
    marginBottom: 16,
    gap: 8,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D29',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerName: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceText: {
    fontSize: 14,
    color: Colors.gray[600],
    flex: 1,
  },
  emergencyText: {
    color: Colors.error,
    fontWeight: '600',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  callButton: {
    backgroundColor: Colors.primary + '20',
  },
  chatButton: {
    backgroundColor: Colors.accent + '20',
  },
  completeButton: {
    backgroundColor: Colors.success + '20',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  safetySpace: {
    height: 20,
  },
});

export default VetAppointmentsProfessional;