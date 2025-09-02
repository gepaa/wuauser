import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import * as Haptics from 'expo-haptics';
import { vetTheme } from '../../../constants/vetTheme';
import { NuevaCitaData, Dueno, Mascota } from '../../../types/agenda';
import { 
  mockDuenos, 
  tiposConsulta, 
  duracionesDisponibles,
  getHorariosLibres 
} from '../../../constants/mockData';
import { Cita } from '../../../types/agenda';

interface NuevaCitaModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (citaData: NuevaCitaData) => Promise<void>;
  initialDate?: Date;
  existingCitas: Cita[];
}

interface FormData {
  fecha: Date;
  hora: string;
  duenoId: string;
  mascotaId: string;
  tipo: string;
  duracion: number;
  notas: string;
}

export const NuevaCitaModal: React.FC<NuevaCitaModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialDate = new Date(),
  existingCitas
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDueno, setSelectedDueno] = useState<Dueno | null>(null);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      fecha: initialDate,
      hora: '',
      duenoId: '',
      mascotaId: '',
      tipo: '',
      duracion: 30,
      notas: ''
    }
  });

  const watchedFecha = watch('fecha');
  const watchedDuenoId = watch('duenoId');
  const watchedTipo = watch('tipo');

  // Update available hours when date changes
  useEffect(() => {
    if (watchedFecha) {
      const libres = getHorariosLibres(existingCitas, watchedFecha);
      setAvailableHours(libres);
      
      // Reset hour if current selection is no longer available
      const currentHour = watch('hora');
      if (currentHour && !libres.includes(currentHour)) {
        setValue('hora', '');
      }
    }
  }, [watchedFecha, existingCitas]);

  // Update selected owner when duenoId changes
  useEffect(() => {
    if (watchedDuenoId) {
      const dueno = mockDuenos.find(d => d.id.toString() === watchedDuenoId);
      setSelectedDueno(dueno || null);
      setValue('mascotaId', ''); // Reset pet selection
    } else {
      setSelectedDueno(null);
    }
  }, [watchedDuenoId]);

  // Auto-set duration based on consultation type
  useEffect(() => {
    if (watchedTipo) {
      const tipo = tiposConsulta.find(t => t.id === watchedTipo);
      if (tipo) {
        setValue('duracion', tipo.duracionDefault);
      }
    }
  }, [watchedTipo]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('fecha', selectedDate);
    }
  };

  const validateForm = (data: FormData): string | null => {
    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(data.fecha);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return 'No puedes programar citas en fechas pasadas';
    }

    // Required fields validation
    if (!data.hora) return 'Selecciona una hora';
    if (!data.duenoId) return 'Selecciona un dueño';
    if (!data.mascotaId) return 'Selecciona una mascota';
    if (!data.tipo) return 'Selecciona el tipo de consulta';

    return null;
  };

  const onFormSubmit = async (data: FormData) => {
    const validationError = validateForm(data);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        fecha: data.fecha,
        hora: data.hora,
        duenoId: parseInt(data.duenoId),
        mascotaId: parseInt(data.mascotaId),
        tipo: data.tipo,
        duracion: data.duracion,
        notas: data.notas.trim() || undefined
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      reset();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la cita. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={vetTheme.colors.text.secondary} />
      </TouchableOpacity>
      <Text style={styles.title}>Nueva Cita</Text>
      <TouchableOpacity 
        onPress={handleSubmit(onFormSubmit)} 
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        disabled={isSubmitting}
      >
        <Text style={[styles.saveButtonText, isSubmitting && styles.saveButtonTextDisabled]}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderDateSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fecha y Hora</Text>
      
      <Controller
        control={control}
        name="fecha"
        rules={{ required: 'La fecha es obligatoria' }}
        render={({ field: { value } }) => (
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={vetTheme.colors.primary} />
            <Text style={styles.dateButtonText}>
              {value.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </TouchableOpacity>
        )}
      />

      {showDatePicker && (
        <DateTimePicker
          value={watchedFecha}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      <Controller
        control={control}
        name="hora"
        rules={{ required: 'La hora es obligatoria' }}
        render={({ field: { value, onChange } }) => (
          <View style={styles.hoursContainer}>
            <Text style={styles.subsectionTitle}>Horas Disponibles</Text>
            {availableHours.length === 0 ? (
              <Text style={styles.noHoursText}>No hay horas disponibles para esta fecha</Text>
            ) : (
              <View style={styles.hoursGrid}>
                {availableHours.map((hora) => (
                  <TouchableOpacity
                    key={hora}
                    style={[
                      styles.hourButton,
                      value === hora && styles.hourButtonSelected
                    ]}
                    onPress={() => {
                      onChange(hora);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.hourButtonText,
                      value === hora && styles.hourButtonTextSelected
                    ]}>
                      {hora}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );

  const renderPatientSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Paciente</Text>
      
      <Controller
        control={control}
        name="duenoId"
        rules={{ required: 'Selecciona un dueño' }}
        render={({ field: { value, onChange } }) => (
          <View>
            <Text style={styles.fieldLabel}>Dueño</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity 
                style={[styles.selectButton, errors.duenoId && styles.selectButtonError]}
                onPress={() => {
                  Alert.alert(
                    'Seleccionar Dueño',
                    'Selecciona un dueño',
                    mockDuenos.map(dueno => ({
                      text: dueno.nombre,
                      onPress: () => onChange(dueno.id.toString())
                    })).concat([{ text: 'Cancelar', style: 'cancel' }])
                  );
                }}
              >
                <Text style={[styles.selectButtonText, !value && styles.selectButtonPlaceholder]}>
                  {value ? mockDuenos.find(d => d.id.toString() === value)?.nombre : 'Seleccionar dueño'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={vetTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {selectedDueno && (
        <Controller
          control={control}
          name="mascotaId"
          rules={{ required: 'Selecciona una mascota' }}
          render={({ field: { value, onChange } }) => (
            <View>
              <Text style={styles.fieldLabel}>Mascota</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity 
                  style={[styles.selectButton, errors.mascotaId && styles.selectButtonError]}
                  onPress={() => {
                    Alert.alert(
                      'Seleccionar Mascota',
                      'Selecciona una mascota',
                      selectedDueno.mascotas.map(mascota => ({
                        text: `${mascota.nombre} (${mascota.especie} - ${mascota.raza})`,
                        onPress: () => onChange(mascota.id.toString())
                      })).concat([{ text: 'Cancelar', style: 'cancel' }])
                    );
                  }}
                >
                  <Text style={[styles.selectButtonText, !value && styles.selectButtonPlaceholder]}>
                    {value ? selectedDueno.mascotas.find(m => m.id.toString() === value)?.nombre : 'Seleccionar mascota'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={vetTheme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderConsultationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Consulta</Text>
      
      <Controller
        control={control}
        name="tipo"
        rules={{ required: 'Selecciona el tipo de consulta' }}
        render={({ field: { value, onChange } }) => (
          <View>
            <Text style={styles.fieldLabel}>Tipo de Consulta</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity 
                style={[styles.selectButton, errors.tipo && styles.selectButtonError]}
                onPress={() => {
                  Alert.alert(
                    'Tipo de Consulta',
                    'Selecciona el tipo de consulta',
                    tiposConsulta.map(tipo => ({
                      text: tipo.label,
                      onPress: () => onChange(tipo.id)
                    })).concat([{ text: 'Cancelar', style: 'cancel' }])
                  );
                }}
              >
                <Text style={[styles.selectButtonText, !value && styles.selectButtonPlaceholder]}>
                  {value ? tiposConsulta.find(t => t.id === value)?.label : 'Seleccionar tipo'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={vetTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="duracion"
        render={({ field: { value, onChange } }) => (
          <View>
            <Text style={styles.fieldLabel}>Duración</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => {
                  Alert.alert(
                    'Duración',
                    'Selecciona la duración',
                    duracionesDisponibles.map(duracion => ({
                      text: duracion.label,
                      onPress: () => onChange(duracion.value)
                    })).concat([{ text: 'Cancelar', style: 'cancel' }])
                  );
                }}
              >
                <Text style={styles.selectButtonText}>
                  {duracionesDisponibles.find(d => d.value === value)?.label}
                </Text>
                <Ionicons name="chevron-down" size={20} color={vetTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="notas"
        render={({ field: { value, onChange } }) => (
          <View>
            <Text style={styles.fieldLabel}>Notas (Opcional)</Text>
            <TextInput
              style={styles.notesInput}
              value={value}
              onChangeText={onChange}
              placeholder="Agregar notas o comentarios..."
              placeholderTextColor={vetTheme.colors.text.light}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderDateSection()}
          {renderPatientSection()}
          {renderConsultationSection()}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
    backgroundColor: vetTheme.colors.background,
  },
  closeButton: {
    padding: vetTheme.spacing.sm,
  },
  title: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
  },
  saveButtonDisabled: {
    backgroundColor: vetTheme.colors.text.light,
  },
  saveButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.inverse,
  },
  saveButtonTextDisabled: {
    color: vetTheme.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: vetTheme.colors.background,
    marginVertical: vetTheme.spacing.sm,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    borderRadius: vetTheme.borderRadius.md,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.md,
  },
  dateButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    marginLeft: vetTheme.spacing.sm,
    textTransform: 'capitalize',
  },
  hoursContainer: {
    marginTop: vetTheme.spacing.sm,
  },
  subsectionTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
  },
  noHoursText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    padding: vetTheme.spacing.lg,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vetTheme.spacing.sm,
  },
  hourButton: {
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    borderRadius: vetTheme.borderRadius.md,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  hourButtonSelected: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  hourButtonText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  hourButtonTextSelected: {
    color: vetTheme.colors.text.inverse,
  },
  fieldLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  selectContainer: {
    marginBottom: vetTheme.spacing.md,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    borderRadius: vetTheme.borderRadius.md,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
  },
  selectButtonError: {
    borderColor: vetTheme.colors.danger,
  },
  selectButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: vetTheme.colors.text.light,
  },
  notesInput: {
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    borderRadius: vetTheme.borderRadius.md,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    minHeight: 80,
  },
  bottomPadding: {
    height: 50,
  },
});

export default NuevaCitaModal;