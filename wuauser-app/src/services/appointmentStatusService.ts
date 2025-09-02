import { Alert } from 'react-native';
import appointmentService, { Appointment } from './appointmentService';

export interface StatusTransitionResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
  needsRefresh?: boolean;
}

export const appointmentStatusService = {
  // Validate if a status transition is allowed
  canTransitionTo(currentStatus: Appointment['status'], newStatus: Appointment['status']): boolean {
    const allowedTransitions: Record<Appointment['status'], Appointment['status'][]> = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled'],
      'cancelled': [], // Cannot transition from cancelled
      'completed': [], // Cannot transition from completed
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  },

  // Get user-friendly status transition messages
  getTransitionMessage(currentStatus: Appointment['status'], newStatus: Appointment['status']): string {
    const transitions: Record<string, string> = {
      'pending-confirmed': '¿Confirmar esta cita?',
      'pending-cancelled': '¿Cancelar esta cita?',
      'confirmed-completed': '¿Marcar como completada?',
      'confirmed-cancelled': '¿Cancelar esta cita confirmada?',
    };

    return transitions[`${currentStatus}-${newStatus}`] || '¿Cambiar estado de la cita?';
  },

  // Perform status transition with confirmation
  async transitionWithConfirmation(
    appointmentId: string,
    currentStatus: Appointment['status'],
    newStatus: Appointment['status'],
    notes?: string
  ): Promise<StatusTransitionResult> {
    // Validate transition
    if (!this.canTransitionTo(currentStatus, newStatus)) {
      return {
        success: false,
        error: `No se puede cambiar de "${currentStatus}" a "${newStatus}"`
      };
    }

    const message = this.getTransitionMessage(currentStatus, newStatus);
    
    return new Promise((resolve) => {
      Alert.alert(
        'Cambiar Estado',
        message,
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => resolve({ success: false })
          },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                const { data, error } = await appointmentService.updateAppointmentStatus(
                  appointmentId, 
                  newStatus,
                  notes
                );
                
                if (error) {
                  resolve({ success: false, error });
                } else {
                  resolve({ 
                    success: true, 
                    appointment: data,
                    needsRefresh: true
                  });
                }
              } catch (error: any) {
                resolve({ 
                  success: false, 
                  error: error.message || 'Error inesperado' 
                });
              }
            }
          }
        ]
      );
    });
  },

  // Quick actions for common transitions
  async confirmAppointment(appointmentId: string): Promise<StatusTransitionResult> {
    try {
      const { data, error } = await appointmentService.confirmAppointment(appointmentId);
      
      if (error) {
        return { success: false, error };
      }
      
      return { 
        success: true, 
        appointment: data,
        needsRefresh: true
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al confirmar cita' 
      };
    }
  },

  async cancelAppointmentWithReason(appointmentId: string): Promise<StatusTransitionResult> {
    return new Promise((resolve) => {
      Alert.prompt(
        'Cancelar Cita',
        'Motivo de cancelación (opcional):',
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => resolve({ success: false })
          },
          {
            text: 'Confirmar',
            onPress: async (reason?: string) => {
              try {
                const { data, error } = await appointmentService.cancelAppointment(
                  appointmentId, 
                  reason
                );
                
                if (error) {
                  resolve({ success: false, error });
                } else {
                  resolve({ 
                    success: true, 
                    appointment: data,
                    needsRefresh: true
                  });
                }
              } catch (error: any) {
                resolve({ 
                  success: false, 
                  error: error.message || 'Error al cancelar cita' 
                });
              }
            }
          }
        ],
        'plain-text'
      );
    });
  },

  async completeAppointment(appointmentId: string): Promise<StatusTransitionResult> {
    return new Promise((resolve) => {
      Alert.prompt(
        'Completar Cita',
        'Notas del tratamiento (opcional):',
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => resolve({ success: false })
          },
          {
            text: 'Completar',
            onPress: async (notes?: string) => {
              try {
                const { data, error } = await appointmentService.updateAppointmentStatus(
                  appointmentId, 
                  'completed',
                  notes
                );
                
                if (error) {
                  resolve({ success: false, error });
                } else {
                  resolve({ 
                    success: true, 
                    appointment: data,
                    needsRefresh: true
                  });
                }
              } catch (error: any) {
                resolve({ 
                  success: false, 
                  error: error.message || 'Error al completar cita' 
                });
              }
            }
          }
        ],
        'plain-text',
        undefined,
        'default'
      );
    });
  },

  // Get available actions for a given appointment status
  getAvailableActions(status: Appointment['status']): Array<{
    action: string;
    label: string;
    icon: string;
    style: 'confirm' | 'cancel' | 'complete' | 'info';
  }> {
    switch (status) {
      case 'pending':
        return [
          { action: 'confirm', label: 'Confirmar', icon: 'checkmark-circle', style: 'confirm' },
          { action: 'cancel', label: 'Cancelar', icon: 'close-circle', style: 'cancel' },
        ];
      case 'confirmed':
        return [
          { action: 'complete', label: 'Completar', icon: 'checkmark-done-circle', style: 'complete' },
          { action: 'cancel', label: 'Cancelar', icon: 'close-circle', style: 'cancel' },
        ];
      case 'cancelled':
        return []; // No actions for cancelled appointments
      case 'completed':
        return [
          { action: 'view', label: 'Ver Notas', icon: 'document-text', style: 'info' },
        ];
      default:
        return [];
    }
  },

  // Check if appointment can be rescheduled (2+ hours before)
  canReschedule(appointment: Appointment): boolean {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursDiff = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 2 && ['pending', 'confirmed'].includes(appointment.status);
  },

  // Check if appointment can be cancelled (2+ hours before)
  canCancel(appointment: Appointment): boolean {
    return this.canReschedule(appointment); // Same logic
  },

  // Get status priority for sorting
  getStatusPriority(status: Appointment['status']): number {
    const priorities = {
      'pending': 1,
      'confirmed': 2,
      'completed': 3,
      'cancelled': 4,
    };
    return priorities[status] || 5;
  },
};

export default appointmentStatusService;