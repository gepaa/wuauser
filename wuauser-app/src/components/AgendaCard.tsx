import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import { AnimatedButton } from './AnimatedButton';
import { LoadingSkeleton } from './LoadingSkeleton';

interface Appointment {
  id: string;
  time: string;
  petName: string;
  ownerName: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  urgency: 'normal' | 'high' | 'emergency';
  duration: number; // in minutes
  notes?: string;
}

interface AgendaCardProps {
  appointments: Appointment[];
  isLoading?: boolean;
  onAppointmentPress?: (appointment: Appointment) => void;
  onStartChat?: (appointment: Appointment) => void;
  onCallOwner?: (appointment: Appointment) => void;
  onViewFullAgenda?: () => void;
  onCreateNewAppointment?: () => void;
}

export const AgendaCard: React.FC<AgendaCardProps> = ({
  appointments,
  isLoading = false,
  onAppointmentPress,
  onStartChat,
  onCallOwner,
  onViewFullAgenda,
  onCreateNewAppointment,
}) => {
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);
  
  // Get status color
  const getStatusColor = (status: Appointment['status']): string => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'completed': return Colors.primary;
      case 'cancelled': return Colors.error;
      default: return Colors.gray[400];
    }
  };
  
  // Get status text
  const getStatusText = (status: Appointment['status']): string => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };
  
  // Get urgency color
  const getUrgencyColor = (urgency: Appointment['urgency']): string => {
    switch (urgency) {
      case 'emergency': return Colors.error;
      case 'high': return Colors.warning;
      case 'normal': return Colors.gray[400];
      default: return Colors.gray[400];
    }
  };
  
  // Get service icon
  const getServiceIcon = (service: string): string => {
    if (service.toLowerCase().includes('vacun')) return 'shield-checkmark-outline';
    if (service.toLowerCase().includes('cirug')) return 'cut-outline';
    if (service.toLowerCase().includes('emergen')) return 'alert-circle-outline';
    if (service.toLowerCase().includes('control')) return 'checkmark-circle-outline';
    return 'medical-outline';
  };
  
  // Handle appointment press
  const handleAppointmentPress = (appointment: Appointment) => {
    if (expandedAppointment === appointment.id) {
      setExpandedAppointment(null);
    } else {
      setExpandedAppointment(appointment.id);
    }
    
    onAppointmentPress?.(appointment);
  };
  
  // Handle chat
  const handleChat = (appointment: Appointment) => {
    onStartChat?.(appointment);
  };
  
  // Handle call
  const handleCall = (appointment: Appointment) => {
    onCallOwner?.(appointment);
  };
  
  // Get today's date
  const getTodayDate = (): string => {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Filter today's appointments
  const todayAppointments = appointments.slice(0, 3); // Show max 3 for dashboard
  const upcomingCount = appointments.length;
  const confirmedCount = appointments.filter(apt => apt.status === 'confirmed').length;
  
  // Render appointment item
  const renderAppointment = (appointment: Appointment) => {
    const isExpanded = expandedAppointment === appointment.id;
    const statusColor = getStatusColor(appointment.status);
    const urgencyColor = getUrgencyColor(appointment.urgency);
    const serviceIcon = getServiceIcon(appointment.service);
    
    return (
      <TouchableOpacity
        key={appointment.id}
        style={[
          styles.appointmentItem,
          isExpanded && styles.appointmentItemExpanded,
          appointment.urgency === 'emergency' && styles.emergencyBorder
        ]}
        onPress={() => handleAppointmentPress(appointment)}
        activeOpacity={0.8}
      >
        {/* Main appointment info */}
        <View style={styles.appointmentMain}>
          {/* Time and status */}
          <View style={styles.appointmentLeft}>
            <View style={styles.timeContainer}>
              <Text style={styles.appointmentTime}>{appointment.time}</Text>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
            
            {appointment.urgency !== 'normal' && (
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
                <Ionicons name="alert-circle" size={12} color={Colors.text.inverse} />
              </View>
            )}
          </View>
          
          {/* Pet and owner info */}
          <View style={styles.appointmentCenter}>
            <Text style={styles.petName}>{appointment.petName}</Text>
            <Text style={styles.ownerName}>Dueño: {appointment.ownerName}</Text>
            <View style={styles.serviceRow}>
              <Ionicons 
                name={serviceIcon as any} 
                size={14} 
                color={Colors.medical.consultation} 
              />
              <Text style={styles.serviceName}>{appointment.service}</Text>
            </View>
          </View>
          
          {/* Quick actions */}
          <View style={styles.appointmentActions}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.chatBtn]}
              onPress={() => handleChat(appointment)}
            >
              <Ionicons name="chatbubble-outline" size={16} color={Colors.accent} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.callBtn]}
              onPress={() => handleCall(appointment)}
            >
              <Ionicons name="call-outline" size={16} color={Colors.info} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Expanded content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado:</Text>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.infoValue, { color: statusColor }]}>
                    {getStatusText(appointment.status)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duración:</Text>
                <Text style={styles.infoValue}>{appointment.duration} min</Text>
              </View>
              
              {appointment.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.infoLabel}>Notas:</Text>
                  <Text style={styles.notesText}>{appointment.notes}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.expandedActions}>
              <AnimatedButton
                title="Ver Detalle"
                variant="outline"
                size="small"
                style={styles.detailBtn}
                onPress={() => onAppointmentPress?.(appointment)}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <LoadingSkeleton width="60%" height={24} />
          <LoadingSkeleton width={80} height={32} borderRadius={16} />
        </View>
        
        <View style={styles.statsRow}>
          {[1, 2, 3].map((_, index) => (
            <LoadingSkeleton
              key={index}
              width="30%"
              height={48}
              style={styles.statSkeleton}
            />
          ))}
        </View>
        
        <View style={styles.appointmentsList}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.appointmentSkeleton}>
              <LoadingSkeleton width={60} height={40} />
              <View style={styles.appointmentSkeletonContent}>
                <LoadingSkeleton width="70%" height={16} />
                <LoadingSkeleton width="50%" height={14} style={{ marginTop: 4 }} />
                <LoadingSkeleton width="60%" height={12} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.actionsSkeleton}>
                <LoadingSkeleton width={32} height={32} borderRadius={16} />
                <LoadingSkeleton width={32} height={32} borderRadius={16} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>📅 Agenda de Hoy</Text>
          <Text style={styles.dateText}>{getTodayDate()}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={onViewFullAgenda}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          <Text style={styles.manageBtnText}>Gestionar</Text>
        </TouchableOpacity>
      </View>
      
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>
            {confirmedCount}
          </Text>
          <Text style={styles.statLabel}>Confirmadas</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors.warning }]}>
            {appointments.filter(apt => apt.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>
      
      {/* Appointments List */}
      <View style={styles.appointmentsList}>
        {todayAppointments.length > 0 ? (
          <>
            {todayAppointments.map(renderAppointment)}
            
            {appointments.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={onViewFullAgenda}
              >
                <Text style={styles.viewAllText}>
                  Ver {appointments.length - 3} citas más
                </Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>Sin citas programadas</Text>
            <Text style={styles.emptySubtitle}>¡Disfruta tu día libre!</Text>
            
            <AnimatedButton
              title="Programar Cita"
              icon="add-circle-outline"
              variant="primary"
              size="medium"
              style={styles.newAppointmentBtn}
              onPress={onCreateNewAppointment}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  title: {
    ...Typography.headline.small,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  dateText: {
    ...Typography.caption.large,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: BorderRadius.button.pill,
    gap: Spacing.xs,
  },
  
  manageBtnText: {
    ...Typography.label.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  statNumber: {
    ...Typography.headline.small,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  
  statLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  
  appointmentsList: {
    gap: Spacing.sm,
  },
  
  appointmentItem: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.card.medium,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  
  appointmentItemExpanded: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
    borderLeftColor: Colors.accent,
  },
  
  emergencyBorder: {
    borderLeftColor: Colors.error,
    borderLeftWidth: 6,
  },
  
  appointmentMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  appointmentLeft: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  
  timeContainer: {
    alignItems: 'center',
    gap: 4,
  },
  
  appointmentTime: {
    ...Typography.title.medium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  urgencyBadge: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  
  appointmentCenter: {
    flex: 1,
  },
  
  petName: {
    ...Typography.title.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  ownerName: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  serviceName: {
    ...Typography.caption.large,
    color: Colors.text.tertiary,
  },
  
  appointmentActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  
  quickActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.xs,
  },
  
  chatBtn: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  
  callBtn: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  
  // Expanded content styles
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  
  expandedInfo: {
    marginBottom: Spacing.md,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  
  infoLabel: {
    ...Typography.caption.large,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  
  infoValue: {
    ...Typography.caption.large,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  notesContainer: {
    marginTop: Spacing.xs,
  },
  
  notesText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  
  detailBtn: {
    minWidth: 100,
  },
  
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.2)',
    borderStyle: 'dashed',
    gap: Spacing.xs,
  },
  
  viewAllText: {
    ...Typography.body.medium,
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  
  emptyTitle: {
    ...Typography.title.large,
    color: Colors.text.primary,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  
  emptySubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  
  newAppointmentBtn: {
    minWidth: 160,
  },
  
  // Loading skeleton styles
  statSkeleton: {
    marginHorizontal: Spacing.xs,
  },
  
  appointmentSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.card.medium,
    marginBottom: Spacing.sm,
  },
  
  appointmentSkeletonContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  
  actionsSkeleton: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});

export default AgendaCard;