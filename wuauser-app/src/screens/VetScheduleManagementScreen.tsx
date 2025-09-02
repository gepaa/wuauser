import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import scheduleService, { DaySchedule, TimeSlot, VetSchedule } from '../services/scheduleService';

const { width } = Dimensions.get('window');

interface VetScheduleManagementProps {
  navigation: any;
}

// Interfaces are now imported from scheduleService

const weekDays = [
  { key: 'monday', name: 'Lunes' },
  { key: 'tuesday', name: 'Martes' },
  { key: 'wednesday', name: 'Miércoles' },
  { key: 'thursday', name: 'Jueves' },
  { key: 'friday', name: 'Viernes' },
  { key: 'saturday', name: 'Sábado' },
  { key: 'sunday', name: 'Domingo' }
];

export const VetScheduleManagementScreen: React.FC<VetScheduleManagementProps> = ({ navigation }) => {
  const [vetSchedule, setVetSchedule] = useState<VetSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: '', endTime: '' });
  
  const vetId = 'vet_001'; // En producción vendría del contexto del usuario

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      console.log('📅 Loading vet schedule...');
      const schedule = await scheduleService.getVetSchedule(vetId);
      setVetSchedule(schedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'No se pudo cargar el horario');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  }, []);

  const toggleDayEnabled = (dayKey: string) => {
    if (!vetSchedule) return;
    
    const updatedSchedule = {
      ...vetSchedule,
      schedule: vetSchedule.schedule.map(day => 
        day.day === dayKey 
          ? { ...day, enabled: !day.enabled }
          : day
      )
    };
    
    setVetSchedule(updatedSchedule);
  };

  const openTimeSlotModal = (day: DaySchedule) => {
    setSelectedDay(day);
    setNewTimeSlot({ startTime: '', endTime: '' });
    setModalVisible(true);
  };

  const addTimeSlot = async () => {
    if (!selectedDay || !newTimeSlot.startTime || !newTimeSlot.endTime) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validate time format and logic
    if (newTimeSlot.startTime >= newTimeSlot.endTime) {
      Alert.alert('Error', 'La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    try {
      const success = await scheduleService.addTimeSlot(
        vetId,
        selectedDay.day,
        newTimeSlot.startTime,
        newTimeSlot.endTime
      );

      if (success) {
        await loadSchedule(); // Refresh the schedule
        setModalVisible(false);
        setNewTimeSlot({ startTime: '', endTime: '' });
      } else {
        Alert.alert('Error', 'No se pudo agregar el horario');
      }
    } catch (error) {
      console.error('Error adding time slot:', error);
      Alert.alert('Error', 'No se pudo agregar el horario');
    }
  };

  const removeTimeSlot = (dayKey: string, slotId: string) => {
    Alert.alert(
      'Eliminar Horario',
      '¿Estás seguro que deseas eliminar este horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await scheduleService.removeTimeSlot(vetId, dayKey, slotId);
              if (success) {
                await loadSchedule(); // Refresh the schedule
              } else {
                Alert.alert('Error', 'No se pudo eliminar el horario');
              }
            } catch (error) {
              console.error('Error removing time slot:', error);
              if (error.message?.includes('existing appointments')) {
                Alert.alert('Error', 'No se puede eliminar un horario que tiene citas programadas');
              } else {
                Alert.alert('Error', 'No se pudo eliminar el horario');
              }
            }
          }
        }
      ]
    );
  };

  const toggleSlotAvailability = async (dayKey: string, slotId: string) => {
    try {
      if (!vetSchedule) return;
      
      const currentSlot = vetSchedule.schedule
        .find(day => day.day === dayKey)?.timeSlots
        .find(slot => slot.id === slotId);
      
      if (!currentSlot) return;
      
      const success = await scheduleService.toggleSlotAvailability(
        vetId, 
        dayKey, 
        slotId, 
        !currentSlot.available
      );
      
      if (success) {
        await loadSchedule(); // Refresh the schedule
      } else {
        Alert.alert('Error', 'No se pudo cambiar la disponibilidad');
      }
    } catch (error) {
      console.error('Error toggling slot availability:', error);
      Alert.alert('Error', 'No se pudo cambiar la disponibilidad');
    }
  };

  const saveSchedule = async () => {
    try {
      if (!vetSchedule) {
        Alert.alert('Error', 'No hay horario para guardar');
        return;
      }

      console.log('💾 Saving schedule...');
      const success = await scheduleService.saveVetSchedule(vetSchedule);
      
      if (success) {
        Alert.alert('Éxito', 'Horario guardado correctamente');
      } else {
        Alert.alert('Error', 'No se pudo guardar el horario');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'No se pudo guardar el horario');
    }
  };

  const showCopyDayModal = () => {
    if (!vetSchedule) return;
    
    const daysWithSchedule = vetSchedule.schedule.filter(day => 
      day.enabled && day.timeSlots.length > 0
    );
    
    if (daysWithSchedule.length === 0) {
      Alert.alert('Info', 'No hay horarios configurados para copiar');
      return;
    }
    
    Alert.alert(
      'Copiar Horarios',
      'Próximamente podrás copiar horarios entre días de la semana',
      [{ text: 'OK' }]
    );
  };

  const showSpecialDaysInfo = () => {
    Alert.alert(
      'Días Especiales',
      'Próximamente podrás configurar horarios especiales para días festivos y fechas específicas',
      [{ text: 'OK' }]
    );
  };

  const renderDayCard = (day: DaySchedule) => (
    <View key={day.day} style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={styles.dayInfo}>
          <Text style={styles.dayName}>{day.dayName}</Text>
          <Text style={styles.daySubtitle}>
            {day.enabled 
              ? `${day.timeSlots.length} horarios configurados`
              : 'Día no disponible'
            }
          </Text>
        </View>
        <Switch
          value={day.enabled}
          onValueChange={() => toggleDayEnabled(day.day)}
          trackColor={{ false: '#E0E0E0', true: '#4ECDC4' }}
          thumbColor={day.enabled ? '#FFF' : '#FFF'}
        />
      </View>

      {day.enabled && (
        <View style={styles.timeSlotsContainer}>
          {day.timeSlots.length > 0 ? (
            <>
              {day.timeSlots.map((slot) => (
                <View key={slot.id} style={styles.timeSlot}>
                  <View style={styles.timeSlotInfo}>
                    <View style={styles.timeSlotTime}>
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color={slot.available ? '#4ECDC4' : '#FF6B6B'} 
                      />
                      <Text style={[
                        styles.timeSlotText,
                        { color: slot.available ? '#2A2A2A' : '#999' }
                      ]}>
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </View>
                    <Text style={[
                      styles.timeSlotStatus,
                      { color: slot.available ? '#4ECDC4' : '#FF6B6B' }
                    ]}>
                      {slot.available ? 'Disponible' : 'No disponible'}
                    </Text>
                  </View>
                  
                  <View style={styles.timeSlotActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.toggleButton]}
                      onPress={() => toggleSlotAvailability(day.day, slot.id)}
                    >
                      <Ionicons 
                        name={slot.available ? 'eye-off-outline' : 'eye-outline'} 
                        size={16} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => removeTimeSlot(day.day, slot.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          ) : null}
          
          <TouchableOpacity
            style={styles.addTimeSlotButton}
            onPress={() => openTimeSlotModal(day)}
          >
            <Ionicons name="add" size={20} color="#4ECDC4" />
            <Text style={styles.addTimeSlotText}>Agregar horario</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#F0FDFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Horarios</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={saveSchedule}
          >
            <Ionicons name="checkmark" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Configura tus horarios disponibles para citas
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {vetSchedule?.schedule.map(day => renderDayCard(day))}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={showCopyDayModal}
          >
            <Ionicons name="copy-outline" size={20} color="#2196F3" />
            <Text style={styles.quickActionText}>Copiar horarios</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={showSpecialDaysInfo}
          >
            <Ionicons name="calendar-outline" size={20} color="#FF9800" />
            <Text style={styles.quickActionText}>Días especiales</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.safetySpace} />
      </ScrollView>

      {/* Add Time Slot Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Agregar horario - {selectedDay?.dayName}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeInputsContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.timeInputLabel}>Hora de inicio</Text>
                <TextInput
                  style={styles.timeInputField}
                  value={newTimeSlot.startTime}
                  onChangeText={(text) => setNewTimeSlot(prev => ({ ...prev, startTime: text }))}
                  placeholder="09:00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.timeInputLabel}>Hora de fin</Text>
                <TextInput
                  style={styles.timeInputField}
                  value={newTimeSlot.endTime}
                  onChangeText={(text) => setNewTimeSlot(prev => ({ ...prev, endTime: text }))}
                  placeholder="17:00"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
              <Text style={styles.addButtonText}>Agregar Horario</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  dayCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  daySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  timeSlotsContainer: {
    gap: 12,
  },
  timeSlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSlotStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeSlotActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#E8F4FD',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
  },
  addTimeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
    gap: 8,
  },
  addTimeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  timeInput: {
    gap: 8,
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  timeInputField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  safetySpace: {
    height: 100,
  },
});

export default VetScheduleManagementScreen;