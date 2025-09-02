import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { vetTheme } from '../../../constants/vetTheme';
import { horariosDisponibles } from '../../../constants/mockData';
import { Cita } from '../../../types/agenda';

interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  existingAppointments: Cita[];
  duration: number; // Duration in minutes
}

interface TimeSlotInfo {
  time: string;
  available: boolean;
  conflictReason?: string;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  existingAppointments,
  duration
}) => {
  
  const getTimeSlotInfo = (): TimeSlotInfo[] => {
    const todayAppointments = existingAppointments.filter(appointment => 
      appointment.fecha.toDateString() === selectedDate.toDateString()
    );

    return horariosDisponibles.map(time => {
      // Check for direct conflicts
      const directConflict = todayAppointments.find(app => app.hora === time);
      if (directConflict) {
        return {
          time,
          available: false,
          conflictReason: `Ocupado - ${directConflict.mascota}`
        };
      }

      // Check for overlapping appointments based on duration
      const timeInMinutes = timeToMinutes(time);
      const endTimeInMinutes = timeInMinutes + duration;

      const hasOverlap = todayAppointments.some(app => {
        const appStartMinutes = timeToMinutes(app.hora);
        const appEndMinutes = appStartMinutes + app.duracion;
        
        // Check if the new appointment would overlap with existing one
        return (
          (timeInMinutes >= appStartMinutes && timeInMinutes < appEndMinutes) ||
          (endTimeInMinutes > appStartMinutes && endTimeInMinutes <= appEndMinutes) ||
          (timeInMinutes <= appStartMinutes && endTimeInMinutes >= appEndMinutes)
        );
      });

      if (hasOverlap) {
        const conflictingApp = todayAppointments.find(app => {
          const appStartMinutes = timeToMinutes(app.hora);
          const appEndMinutes = appStartMinutes + app.duracion;
          return (
            (timeInMinutes >= appStartMinutes && timeInMinutes < appEndMinutes) ||
            (endTimeInMinutes > appStartMinutes && endTimeInMinutes <= appEndMinutes) ||
            (timeInMinutes <= appStartMinutes && endTimeInMinutes >= appEndMinutes)
          );
        });

        return {
          time,
          available: false,
          conflictReason: `Conflicto con ${conflictingApp?.mascota}`
        };
      }

      // Check if end time exceeds clinic hours (assume clinic closes at 18:00)
      const clinicCloseMinutes = 18 * 60; // 18:00 in minutes
      if (endTimeInMinutes > clinicCloseMinutes) {
        return {
          time,
          available: false,
          conflictReason: 'Excede horario de cierre'
        };
      }

      return {
        time,
        available: true
      };
    });
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getEndTime = (startTime: string, durationMinutes: number): string => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    return minutesToTime(endMinutes);
  };

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const timeSlots = getTimeSlotInfo();
  const availableSlots = timeSlots.filter(slot => slot.available);
  const unavailableSlots = timeSlots.filter(slot => !slot.available);

  const renderTimeSlot = (slot: TimeSlotInfo, showReason: boolean = false) => {
    const isSelected = selectedTime === slot.time;
    const endTime = getEndTime(slot.time, duration);

    return (
      <TouchableOpacity
        key={slot.time}
        style={[
          styles.timeSlot,
          !slot.available && styles.timeSlotDisabled,
          isSelected && slot.available && styles.timeSlotSelected,
        ]}
        onPress={() => slot.available && handleTimeSelect(slot.time)}
        disabled={!slot.available}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeRow}>
            <Text style={[
              styles.timeText,
              !slot.available && styles.timeTextDisabled,
              isSelected && slot.available && styles.timeTextSelected,
            ]}>
              {slot.time}
            </Text>
            
            {slot.available && (
              <Text style={[
                styles.endTimeText,
                isSelected && styles.endTimeTextSelected,
              ]}>
                - {endTime}
              </Text>
            )}
            
            {!slot.available && (
              <Ionicons 
                name="close-circle" 
                size={16} 
                color={vetTheme.colors.danger} 
              />
            )}
          </View>

          {duration && slot.available && (
            <Text style={[
              styles.durationText,
              isSelected && styles.durationTextSelected,
            ]}>
              {duration} min
            </Text>
          )}

          {showReason && slot.conflictReason && (
            <Text style={styles.conflictReasonText}>
              {slot.conflictReason}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSuggestions = () => {
    if (availableSlots.length === 0) {
      return (
        <View style={styles.noSlotsContainer}>
          <Ionicons name="calendar-outline" size={48} color={vetTheme.colors.text.light} />
          <Text style={styles.noSlotsTitle}>Sin horarios disponibles</Text>
          <Text style={styles.noSlotsSubtitle}>
            No hay horarios disponibles para {selectedDate.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Text>
          <Text style={styles.suggestionText}>
            Intenta seleccionar otro día o reducir la duración de la consulta.
          </Text>
        </View>
      );
    }

    const nextAvailable = availableSlots[0];
    const morningSlots = availableSlots.filter(slot => timeToMinutes(slot.time) < 12 * 60);
    const afternoonSlots = availableSlots.filter(slot => timeToMinutes(slot.time) >= 12 * 60);

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Sugerencias:</Text>
        
        <View style={styles.suggestionRow}>
          <Ionicons name="time-outline" size={16} color={vetTheme.colors.primary} />
          <Text style={styles.suggestionLabel}>Próximo disponible:</Text>
          <TouchableOpacity onPress={() => handleTimeSelect(nextAvailable.time)}>
            <Text style={styles.suggestionTime}>{nextAvailable.time}</Text>
          </TouchableOpacity>
        </View>

        {morningSlots.length > 0 && (
          <View style={styles.suggestionRow}>
            <Ionicons name="sunny-outline" size={16} color={vetTheme.colors.accent} />
            <Text style={styles.suggestionLabel}>Mañana:</Text>
            <Text style={styles.suggestionInfo}>
              {morningSlots.length} horarios disponibles
            </Text>
          </View>
        )}

        {afternoonSlots.length > 0 && (
          <View style={styles.suggestionRow}>
            <Ionicons name="partly-sunny-outline" size={16} color={vetTheme.colors.secondary} />
            <Text style={styles.suggestionLabel}>Tarde:</Text>
            <Text style={styles.suggestionInfo}>
              {afternoonSlots.length} horarios disponibles
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Horarios para {selectedDate.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })}
        </Text>
        <Text style={styles.headerSubtitle}>
          Duración: {duration} minutos
        </Text>
      </View>

      {renderSuggestions()}

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {availableSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Disponibles ({availableSlots.length})
            </Text>
            <View style={styles.timeSlotsGrid}>
              {availableSlots.map(slot => renderTimeSlot(slot))}
            </View>
          </View>
        )}

        {unavailableSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              No disponibles ({unavailableSlots.length})
            </Text>
            <View style={styles.timeSlotsGrid}>
              {unavailableSlots.map(slot => renderTimeSlot(slot, true))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  header: {
    padding: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  headerTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    textTransform: 'capitalize',
  },
  headerSubtitle: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: 4,
  },
  suggestionsContainer: {
    backgroundColor: `${vetTheme.colors.primary}08`,
    margin: vetTheme.spacing.md,
    padding: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${vetTheme.colors.primary}20`,
  },
  suggestionsTitle: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.sm,
    marginRight: vetTheme.spacing.sm,
  },
  suggestionTime: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.primary,
  },
  suggestionInfo: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: vetTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vetTheme.spacing.sm,
  },
  timeSlot: {
    backgroundColor: vetTheme.colors.background,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  timeSlotDisabled: {
    backgroundColor: vetTheme.colors.surface,
    borderColor: vetTheme.colors.border.light,
    opacity: 0.6,
  },
  timeSlotSelected: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  timeSlotContent: {
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
  },
  timeTextDisabled: {
    color: vetTheme.colors.text.light,
  },
  timeTextSelected: {
    color: vetTheme.colors.text.inverse,
  },
  endTimeText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: 4,
  },
  endTimeTextSelected: {
    color: vetTheme.colors.text.inverse,
  },
  durationText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
    marginTop: 2,
  },
  durationTextSelected: {
    color: vetTheme.colors.text.inverse,
  },
  conflictReasonText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.danger,
    textAlign: 'center',
    marginTop: 2,
  },
  noSlotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: vetTheme.spacing.xxl,
  },
  noSlotsTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginTop: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.sm,
  },
  noSlotsSubtitle: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: vetTheme.spacing.sm,
  },
  suggestionText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TimeSlotPicker;