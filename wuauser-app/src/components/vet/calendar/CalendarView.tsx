import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { vetTheme } from '../../../constants/vetTheme';
import { Cita, ViewMode, WeekDay } from '../../../types/agenda';
import { getCitasPorFecha } from '../../../constants/mockData';

interface CalendarViewProps {
  viewMode: ViewMode;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  citas: Cita[];
  onViewModeChange: (mode: ViewMode) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CELL_WIDTH = screenWidth / 7 - 8;

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewMode,
  selectedDate,
  onDateSelect,
  citas,
  onViewModeChange
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [currentWeek, setCurrentWeek] = useState(getWeekStart(selectedDate));

  useEffect(() => {
    if (viewMode === 'month') {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else if (viewMode === 'week') {
      setCurrentWeek(getWeekStart(selectedDate));
    }
  }, [selectedDate, viewMode]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    d.setDate(diff);
    return d;
  }

  function getWeekDays(startDate: Date): WeekDay[] {
    const days: WeekDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayAppointments = getCitasPorFecha(citas, date);
      
      days.push({
        date,
        dayNumber: date.getDate(),
        dayName: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
        isToday: date.toDateString() === today.toDateString(),
        appointments: dayAppointments
      });
    }
    
    return days;
  }

  function getMonthDays(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from Monday of the week containing first day
    const firstDayOfWeek = firstDay.getDay();
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    const days: Date[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(newWeek.getDate() - 7);
    } else {
      newWeek.setDate(newWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDatePress = (date: Date) => {
    onDateSelect(date);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (viewMode !== 'day') {
      onViewModeChange('day');
    }
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.viewModeButton,
            viewMode === mode && styles.viewModeButtonActive
          ]}
          onPress={() => {
            onViewModeChange(mode);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === mode && styles.viewModeTextActive
          ]}>
            {mode === 'day' ? 'Día' : mode === 'week' ? 'Semana' : 'Mes'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMonthHeader = () => (
    <View style={styles.monthHeader}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigateMonth('prev')}
      >
        <Ionicons name="chevron-back" size={24} color={vetTheme.colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.monthTitle}>
        {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
      </Text>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigateMonth('next')}
      >
        <Ionicons name="chevron-forward" size={24} color={vetTheme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderWeekHeader = () => (
    <View style={styles.weekHeader}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigateWeek('prev')}
      >
        <Ionicons name="chevron-back" size={24} color={vetTheme.colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.weekTitle}>
        Semana del {currentWeek.getDate()} de {currentWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
      </Text>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigateWeek('next')}
      >
        <Ionicons name="chevron-forward" size={24} color={vetTheme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderDayNames = () => (
    <View style={styles.dayNamesContainer}>
      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
        <View key={index} style={styles.dayNameCell}>
          <Text style={styles.dayNameText}>{day}</Text>
        </View>
      ))}
    </View>
  );

  const renderMonthView = () => {
    const monthDays = getMonthDays(currentMonth);
    const today = new Date();
    const currentMonthValue = currentMonth.getMonth();

    return (
      <View style={styles.monthGrid}>
        {monthDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentMonthValue;
          const isToday = day.toDateString() === today.toDateString();
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const dayAppointments = getCitasPorFecha(citas, day);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.monthDayCell,
                isToday && styles.todayCell,
                isSelected && styles.selectedDayCell,
                !isCurrentMonth && styles.otherMonthCell
              ]}
              onPress={() => handleDatePress(day)}
              disabled={!isCurrentMonth}
            >
              <Text style={[
                styles.monthDayText,
                !isCurrentMonth && styles.otherMonthText,
                isToday && styles.todayText,
                isSelected && styles.selectedDayText
              ]}>
                {day.getDate()}
              </Text>
              {dayAppointments.length > 0 && isCurrentMonth && (
                <View style={styles.appointmentIndicator}>
                  <Text style={styles.appointmentCount}>
                    {dayAppointments.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentWeek);

    return (
      <View style={styles.weekContainer}>
        <View style={styles.weekDaysHeader}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDayHeader,
                day.isToday && styles.todayWeekHeader,
                day.date.toDateString() === selectedDate.toDateString() && styles.selectedWeekHeader
              ]}
              onPress={() => handleDatePress(day.date)}
            >
              <Text style={[
                styles.weekDayName,
                day.isToday && styles.todayWeekText,
                day.date.toDateString() === selectedDate.toDateString() && styles.selectedWeekText
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                day.isToday && styles.todayWeekText,
                day.date.toDateString() === selectedDate.toDateString() && styles.selectedWeekText
              ]}>
                {day.dayNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.weekAppointments} showsVerticalScrollIndicator={false}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayColumn}>
              {day.appointments.map((appointment, appointmentIndex) => (
                <View key={appointmentIndex} style={styles.weekAppointmentCard}>
                  <Text style={styles.weekAppointmentTime}>{appointment.hora}</Text>
                  <Text style={styles.weekAppointmentTitle} numberOfLines={1}>
                    {appointment.mascota}
                  </Text>
                  <Text style={styles.weekAppointmentSubtitle} numberOfLines={1}>
                    {appointment.tipo}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderViewModeSelector()}
      
      {viewMode === 'month' && (
        <>
          {renderMonthHeader()}
          {renderDayNames()}
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderMonthView()}
          </ScrollView>
        </>
      )}

      {viewMode === 'week' && (
        <>
          {renderWeekHeader()}
          {renderWeekView()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: vetTheme.colors.background,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: vetTheme.colors.surface,
    marginHorizontal: vetTheme.spacing.md,
    marginVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.lg,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: vetTheme.colors.primary,
  },
  viewModeText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.secondary,
  },
  viewModeTextActive: {
    color: vetTheme.colors.text.inverse,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
  },
  navButton: {
    padding: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
    backgroundColor: `${vetTheme.colors.primary}10`,
  },
  monthTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    textTransform: 'capitalize',
  },
  weekTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    textTransform: 'capitalize',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    paddingHorizontal: vetTheme.spacing.md,
    paddingBottom: vetTheme.spacing.sm,
  },
  dayNameCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dayNameText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.secondary,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: vetTheme.spacing.md,
  },
  monthDayCell: {
    width: CELL_WIDTH,
    height: CELL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
    borderRadius: vetTheme.borderRadius.sm,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: `${vetTheme.colors.secondary}20`,
  },
  selectedDayCell: {
    backgroundColor: vetTheme.colors.primary,
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  monthDayText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  otherMonthText: {
    color: vetTheme.colors.text.light,
  },
  todayText: {
    color: vetTheme.colors.secondary,
    fontWeight: vetTheme.typography.weights.bold,
  },
  selectedDayText: {
    color: vetTheme.colors.text.inverse,
  },
  appointmentIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: vetTheme.colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentCount: {
    fontSize: 10,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.inverse,
  },
  weekContainer: {
    flex: 1,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: vetTheme.spacing.md,
    paddingBottom: vetTheme.spacing.md,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.sm,
    marginHorizontal: 2,
    borderRadius: vetTheme.borderRadius.md,
  },
  todayWeekHeader: {
    backgroundColor: `${vetTheme.colors.secondary}15`,
  },
  selectedWeekHeader: {
    backgroundColor: vetTheme.colors.primary,
  },
  weekDayName: {
    fontSize: vetTheme.typography.sizes.xs,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.secondary,
    marginBottom: 2,
  },
  weekDayNumber: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
  },
  todayWeekText: {
    color: vetTheme.colors.secondary,
  },
  selectedWeekText: {
    color: vetTheme.colors.text.inverse,
  },
  weekAppointments: {
    flex: 1,
    paddingHorizontal: vetTheme.spacing.md,
  },
  weekDayColumn: {
    marginBottom: vetTheme.spacing.md,
  },
  weekAppointmentCard: {
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.sm,
    padding: vetTheme.spacing.sm,
    marginBottom: vetTheme.spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: vetTheme.colors.primary,
  },
  weekAppointmentTime: {
    fontSize: vetTheme.typography.sizes.xs,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.primary,
    marginBottom: 2,
  },
  weekAppointmentTitle: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: 2,
  },
  weekAppointmentSubtitle: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
  },
});

export default CalendarView;