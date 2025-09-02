import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import appointmentService, { Pet, Service, TimeSlot, Appointment } from '../services/appointmentService';
import { Colors } from '../constants/colors';

interface BookAppointmentProps {
  navigation: any;
  route: {
    params: {
      vetId: string;
      vetName: string;
    };
  };
}

interface BookingData {
  vetId: string;
  vetName: string;
  selectedPet?: Pet;
  selectedService?: Service;
  selectedDate?: string;
  selectedTime?: string;
  reason: string;
  isUrgent: boolean;
  isFirstTime: boolean;
}

export const BookAppointmentScreen: React.FC<BookAppointmentProps> = ({ navigation, route }) => {
  const { vetId, vetName } = route.params;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    vetId,
    vetName,
    reason: '',
    isUrgent: false,
    isFirstTime: false,
  });

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (currentStep === 1) {
      loadUserPets();
    } else if (currentStep === 2) {
      loadVetServices();
    }
  }, [currentStep]);

  const initializeScreen = async () => {
    // Initialize notifications on app start
    try {
      const notificationsEnabled = await appointmentService.initializeNotifications();
      if (!notificationsEnabled) {
        console.log('⚠️ Notifications not enabled - reminders will not work');
      } else {
        console.log('✅ Notifications enabled - reminders will work');
        
        // Test notification (development only)
        if (__DEV__) {
          console.log('📱 Testing notification in 5 seconds...');
          await appointmentService.scheduleTestNotification();
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  useEffect(() => {
    if (bookingData.selectedDate && bookingData.selectedService) {
      loadAvailableSlots();
    }
  }, [bookingData.selectedDate, bookingData.selectedService]);

  const loadUserPets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await appointmentService.getUserPets();
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar las mascotas');
        return;
      }
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert('Error', 'No se pudieron cargar las mascotas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVetServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await appointmentService.getVetServices(vetId);
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los servicios');
        return;
      }
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'No se pudieron cargar los servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!bookingData.selectedDate || !bookingData.selectedService) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await appointmentService.getAvailableSlots(
        vetId,
        bookingData.selectedDate,
        bookingData.selectedService.duration
      );
      if (error) {
        Alert.alert('Error', 'No se pudieron cargar los horarios disponibles');
        return;
      }
      setAvailableSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1: return !!bookingData.selectedPet;
      case 2: return !!bookingData.selectedService;
      case 3: return !!bookingData.selectedDate && !!bookingData.selectedTime;
      case 4: return bookingData.reason.trim().length > 0;
      default: return true;
    }
  };

  const handleAddNewPet = () => {
    navigation.navigate('AddPet', {
      onPetAdded: (newPet: Pet) => {
        setPets([...pets, newPet]);
        setBookingData({ ...bookingData, selectedPet: newPet });
      }
    });
  };

  const handleConfirmBooking = async () => {
    if (!bookingData.selectedPet || !bookingData.selectedService || 
        !bookingData.selectedDate || !bookingData.selectedTime) {
      Alert.alert('Error', 'Faltan datos para completar la reserva');
      return;
    }

    setIsLoading(true);
    try {
      const appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
        vetId: bookingData.vetId,
        vetName: bookingData.vetName,
        petId: bookingData.selectedPet.id,
        petName: bookingData.selectedPet.name,
        ownerEmail: bookingData.selectedPet.ownerEmail,
        ownerName: 'Usuario Test', // Replace with actual user name
        serviceId: bookingData.selectedService.id,
        serviceName: bookingData.selectedService.name,
        servicePrice: bookingData.selectedService.price,
        date: bookingData.selectedDate,
        time: bookingData.selectedTime,
        duration: bookingData.selectedService.duration,
        reason: bookingData.reason,
        isUrgent: bookingData.isUrgent,
        isFirstTime: bookingData.isFirstTime,
        status: 'pending'
      };

      const { data, error } = await appointmentService.createAppointment(appointmentData);
      
      if (error) {
        Alert.alert('Error', 'No se pudo crear la cita. Intenta nuevamente.');
        return;
      }

      const notificationsEnabled = await appointmentService.areNotificationsEnabled();
      const reminderMessage = notificationsEnabled 
        ? '\n\n📲 Te enviaremos recordatorios 1 día antes y 1 hora antes de tu cita.'
        : '\n\n⚠️ Activa las notificaciones para recibir recordatorios de tu cita.';

      Alert.alert(
        '¡Cita Agendada!',
        `Tu cita ha sido registrada exitosamente. Recibirás una confirmación pronto.${reminderMessage}`,
        [
          {
            text: 'Ver mis citas',
            onPress: () => navigation.navigate('MyAppointments')
          },
          {
            text: 'Volver al inicio',
            onPress: () => navigation.navigate('HomeScreen')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'No se pudo crear la cita. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4, 5].map(step => (
        <View key={step} style={styles.progressStep}>
          <View style={[
            styles.progressCircle,
            currentStep >= step && styles.progressActive
          ]}>
            <Text style={[
              styles.progressText,
              currentStep >= step && styles.progressTextActive
            ]}>
              {step}
            </Text>
          </View>
          {step < 5 && <View style={[
            styles.progressLine,
            currentStep > step && styles.progressLineActive
          ]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selecciona tu mascota</Text>
      <Text style={styles.stepSubtitle}>¿Para cuál de tus mascotas es la cita?</Text>
      
      <ScrollView style={styles.petsContainer} showsVerticalScrollIndicator={false}>
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={[
              styles.petItem,
              bookingData.selectedPet?.id === pet.id && styles.petItemSelected
            ]}
            onPress={() => setBookingData({ ...bookingData, selectedPet: pet })}
          >
            <Image
              source={{ uri: pet.photo || 'https://via.placeholder.com/60x60?text=Pet' }}
              style={styles.petPhoto}
            />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petDetails}>
                {pet.species} • {pet.breed} • {pet.age} años
              </Text>
              {pet.weight && (
                <Text style={styles.petWeight}>{pet.weight} kg</Text>
              )}
            </View>
            {bookingData.selectedPet?.id === pet.id && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.addPetButton} onPress={handleAddNewPet}>
          <Ionicons name="add-circle-outline" size={24} color="#F4B740" />
          <Text style={styles.addPetText}>Agregar nueva mascota</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selecciona el servicio</Text>
      <Text style={styles.stepSubtitle}>¿Qué tipo de atención necesitas?</Text>
      
      <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceItem,
              bookingData.selectedService?.id === service.id && styles.serviceItemSelected
            ]}
            onPress={() => setBookingData({ ...bookingData, selectedService: service })}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.description && (
                <Text style={styles.serviceDescription}>{service.description}</Text>
              )}
              <View style={styles.serviceDetails}>
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.serviceMetaText}>{service.duration} min</Text>
                </View>
                <View style={styles.serviceMeta}>
                  <Ionicons name="pricetag-outline" size={16} color="#666" />
                  <Text style={styles.serviceMetaText}>{service.category}</Text>
                </View>
              </View>
            </View>
            <View style={styles.servicePriceContainer}>
              <Text style={styles.servicePrice}>${service.price}</Text>
              {bookingData.selectedService?.id === service.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => {
    const generateNextDays = () => {
      const days = [];
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
      return days;
    };

    const availableDays = generateNextDays();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Selecciona fecha y hora</Text>
        <Text style={styles.stepSubtitle}>¿Cuándo te gustaría agendar la cita?</Text>
        
        <View style={styles.dateSelector}>
          <Text style={styles.dateSelectorTitle}>Selecciona una fecha</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateOptions}
          >
            {availableDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateOption,
                  bookingData.selectedDate === day.date && styles.dateOptionSelected
                ]}
                onPress={() => {
                  setBookingData({ ...bookingData, selectedDate: day.date, selectedTime: undefined });
                }}
              >
                <Text style={[
                  styles.dateOptionText,
                  bookingData.selectedDate === day.date && styles.dateOptionTextSelected
                ]}>
                  {day.display}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {bookingData.selectedDate && (
          <View style={styles.timeSlotsContainer}>
            <Text style={styles.timeSlotsTitle}>Horarios disponibles</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlots}
            >
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    !slot.available && styles.timeSlotUnavailable,
                    bookingData.selectedTime === slot.time && styles.timeSlotSelected
                  ]}
                  onPress={() => {
                    if (slot.available) {
                      setBookingData({ ...bookingData, selectedTime: slot.time });
                    }
                  }}
                  disabled={!slot.available}
                >
                  <Text style={[
                    styles.timeSlotText,
                    !slot.available && styles.timeSlotTextUnavailable,
                    bookingData.selectedTime === slot.time && styles.timeSlotTextSelected
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Detalles adicionales</Text>
      <Text style={styles.stepSubtitle}>Cuéntanos más sobre la consulta</Text>
      
      <View style={styles.detailsContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Motivo de la consulta *</Text>
          <TextInput
            style={styles.textArea}
            value={bookingData.reason}
            onChangeText={(text) => setBookingData({ ...bookingData, reason: text })}
            placeholder="Describe los síntomas o el motivo de la consulta..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.switchContainer}>
          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>¿Es urgente?</Text>
              <Text style={styles.switchDescription}>
                La mascota necesita atención inmediata
              </Text>
            </View>
            <Switch
              value={bookingData.isUrgent}
              onValueChange={(value) => setBookingData({ ...bookingData, isUrgent: value })}
              trackColor={{ false: '#E0E0E0', true: '#F4B740' }}
              thumbColor={bookingData.isUrgent ? '#FFF' : '#FFF'}
            />
          </View>
          
          <View style={styles.switchItem}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>¿Primera vez con este veterinario?</Text>
              <Text style={styles.switchDescription}>
                Nunca has visitado esta clínica antes
              </Text>
            </View>
            <Switch
              value={bookingData.isFirstTime}
              onValueChange={(value) => setBookingData({ ...bookingData, isFirstTime: value })}
              trackColor={{ false: '#E0E0E0', true: '#F4B740' }}
              thumbColor={bookingData.isFirstTime ? '#FFF' : '#FFF'}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirmar cita</Text>
      <Text style={styles.stepSubtitle}>Revisa los detalles de tu cita</Text>
      
      <ScrollView style={styles.summaryContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Veterinario</Text>
            <Text style={styles.summaryText}>{bookingData.vetName}</Text>
          </View>
          
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Mascota</Text>
            <Text style={styles.summaryText}>
              {bookingData.selectedPet?.name} ({bookingData.selectedPet?.species})
            </Text>
          </View>
          
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Servicio</Text>
            <Text style={styles.summaryText}>{bookingData.selectedService?.name}</Text>
            <Text style={styles.summarySubtext}>
              Duración: {bookingData.selectedService?.duration} minutos
            </Text>
          </View>
          
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Fecha y hora</Text>
            <Text style={styles.summaryText}>
              {appointmentService.formatAppointmentDateTime(
                bookingData.selectedDate || '',
                bookingData.selectedTime || ''
              )}
            </Text>
          </View>
          
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Motivo</Text>
            <Text style={styles.summaryText}>{bookingData.reason}</Text>
          </View>
          
          {(bookingData.isUrgent || bookingData.isFirstTime) && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Observaciones</Text>
              {bookingData.isUrgent && (
                <Text style={styles.urgentText}>• Consulta urgente</Text>
              )}
              {bookingData.isFirstTime && (
                <Text style={styles.firstTimeText}>• Primera visita</Text>
              )}
            </View>
          )}
          
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total a pagar:</Text>
            <Text style={styles.totalPrice}>${bookingData.selectedService?.price}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#F4B740', '#FFF8E7']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Agendar Cita</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Indicator */}
          {renderProgressIndicator()}

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderCurrentStep()}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.navigation}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                <Text style={styles.backButtonText}>Anterior</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                currentStep === 1 && styles.nextButtonFull,
                !canProceedToNextStep() && styles.nextButtonDisabled
              ]}
              onPress={currentStep === 5 ? handleConfirmBooking : nextStep}
              disabled={!canProceedToNextStep() || isLoading}
            >
              <Text style={styles.nextButtonText}>
                {isLoading ? 'Cargando...' : 
                 currentStep === 5 ? 'Confirmar Cita' : 'Siguiente'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4B740',
  },
  container: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  placeholder: {
    width: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressActive: {
    backgroundColor: '#FFF',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  progressTextActive: {
    color: '#F4B740',
  },
  progressLine: {
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  petsContainer: {
    maxHeight: 400,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
  },
  petItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  petPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  petWeight: {
    fontSize: 12,
    color: '#999',
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F4B740',
    borderStyle: 'dashed',
  },
  addPetText: {
    fontSize: 16,
    color: '#F4B740',
    fontWeight: '600',
    marginLeft: 8,
  },
  servicesContainer: {
    maxHeight: 400,
  },
  serviceItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
  },
  serviceItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F4B740',
    marginBottom: 8,
  },
  dateSelector: {
    marginBottom: 20,
  },
  dateSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  dateOptions: {
    paddingHorizontal: 4,
  },
  dateOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  dateOptionSelected: {
    backgroundColor: '#F4B740',
  },
  dateOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  dateOptionTextSelected: {
    color: '#FFF',
  },
  timeSlotsContainer: {
    marginTop: 20,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  timeSlots: {
    paddingHorizontal: 4,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  timeSlotSelected: {
    backgroundColor: '#F4B740',
  },
  timeSlotUnavailable: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  timeSlotTextSelected: {
    color: '#FFF',
  },
  timeSlotTextUnavailable: {
    color: '#999',
  },
  detailsContainer: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  switchContainer: {
    gap: 16,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    maxHeight: 400,
  },
  summaryCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  summarySection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  summarySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  urgentText: {
    fontSize: 14,
    color: '#FF5722',
    fontWeight: '500',
  },
  firstTimeText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#F4B740',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F4B740',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2A2A2A',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: '#999',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookAppointmentScreen;