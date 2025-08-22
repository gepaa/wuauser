import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { veterinarianService } from '../services/veterinarianService';
import { Colors } from '../constants/colors';

interface VetClinicSetupProps {
  navigation: any;
}

interface ClinicInfo {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  servicios: Service[];
  horarios: Schedule[];
}

interface Service {
  id: string;
  nombre: string;
  precio: string;
  categoria: string;
}

interface Schedule {
  dia: string;
  abierto: boolean;
  horaApertura: string;
  horaCierre: string;
}

const serviciosComunes = [
  { nombre: 'Consulta General', categoria: 'consulta', precioDefault: '350' },
  { nombre: 'Vacunación', categoria: 'consulta', precioDefault: '250' },
  { nombre: 'Desparasitación', categoria: 'consulta', precioDefault: '200' },
  { nombre: 'Cirugía Menor', categoria: 'cirugia', precioDefault: '800' },
  { nombre: 'Esterilización', categoria: 'cirugia', precioDefault: '1200' },
  { nombre: 'Limpieza Dental', categoria: 'consulta', precioDefault: '600' },
  { nombre: 'Rayos X', categoria: 'consulta', precioDefault: '500' },
  { nombre: 'Análisis Clínicos', categoria: 'consulta', precioDefault: '400' },
];

const diasSemana = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export const VetClinicSetupScreen: React.FC<VetClinicSetupProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    nombre: 'Veterinaria San José',
    direccion: 'Av. Principal 123, Col. Centro',
    telefono: '5512345678',
    email: 'info@veterinariasanjose.com',
    servicios: [],
    horarios: diasSemana.map(dia => ({
      dia,
      abierto: dia !== 'Domingo',
      horaApertura: '09:00',
      horaCierre: '18:00'
    }))
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: clinicInfo
  });

  useEffect(() => {
    loadSavedInfo();
  }, []);

  const loadSavedInfo = async () => {
    try {
      const savedInfo = await veterinarianService.getClinicInfo();
      if (savedInfo) {
        setClinicInfo(savedInfo);
      }
    } catch (error) {
      console.log('No hay información guardada previamente');
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveAndContinue = async () => {
    try {
      await veterinarianService.saveClinicInfo(clinicInfo);
      Alert.alert(
        '¡Configuración Guardada!',
        'La información de tu clínica ha sido guardada exitosamente. Ahora podrás recibir citas de clientes.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la información. Intenta nuevamente.');
    }
  };

  const toggleService = (serviceTemplate: any) => {
    const existingIndex = clinicInfo.servicios.findIndex(s => s.nombre === serviceTemplate.nombre);
    
    if (existingIndex >= 0) {
      // Remove service
      const newServicios = clinicInfo.servicios.filter((_, index) => index !== existingIndex);
      setClinicInfo({ ...clinicInfo, servicios: newServicios });
    } else {
      // Add service
      const newService: Service = {
        id: Date.now().toString(),
        nombre: serviceTemplate.nombre,
        precio: serviceTemplate.precioDefault,
        categoria: serviceTemplate.categoria
      };
      setClinicInfo({ ...clinicInfo, servicios: [...clinicInfo.servicios, newService] });
    }
  };

  const updateServicePrice = (serviceId: string, precio: string) => {
    const updatedServicios = clinicInfo.servicios.map(service =>
      service.id === serviceId ? { ...service, precio } : service
    );
    setClinicInfo({ ...clinicInfo, servicios: updatedServicios });
  };

  const toggleSchedule = (dia: string) => {
    const updatedHorarios = clinicInfo.horarios.map(horario =>
      horario.dia === dia ? { ...horario, abierto: !horario.abierto } : horario
    );
    setClinicInfo({ ...clinicInfo, horarios: updatedHorarios });
  };

  const updateScheduleTime = (dia: string, field: 'horaApertura' | 'horaCierre', value: string) => {
    const updatedHorarios = clinicInfo.horarios.map(horario =>
      horario.dia === dia ? { ...horario, [field]: value } : horario
    );
    setClinicInfo({ ...clinicInfo, horarios: updatedHorarios });
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Información de la Clínica</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre de la Clínica *</Text>
        <TextInput
          style={styles.input}
          value={clinicInfo.nombre}
          onChangeText={(text) => setClinicInfo({ ...clinicInfo, nombre: text })}
          placeholder="Nombre de tu veterinaria"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Dirección *</Text>
        <TextInput
          style={styles.input}
          value={clinicInfo.direccion}
          onChangeText={(text) => setClinicInfo({ ...clinicInfo, direccion: text })}
          placeholder="Dirección completa"
          multiline
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Teléfono *</Text>
        <TextInput
          style={styles.input}
          value={clinicInfo.telefono}
          onChangeText={(text) => setClinicInfo({ ...clinicInfo, telefono: text })}
          placeholder="5512345678"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email de Contacto</Text>
        <TextInput
          style={styles.input}
          value={clinicInfo.email}
          onChangeText={(text) => setClinicInfo({ ...clinicInfo, email: text })}
          placeholder="contacto@veterinaria.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Servicios y Precios</Text>
      <Text style={styles.stepSubtitle}>Selecciona los servicios que ofreces</Text>
      
      <ScrollView style={styles.servicesContainer} showsVerticalScrollIndicator={false}>
        {serviciosComunes.map((service, index) => {
          const isSelected = clinicInfo.servicios.some(s => s.nombre === service.nombre);
          const selectedService = clinicInfo.servicios.find(s => s.nombre === service.nombre);
          
          return (
            <View key={index} style={styles.serviceItem}>
              <TouchableOpacity
                style={[styles.serviceToggle, isSelected && styles.serviceSelected]}
                onPress={() => toggleService(service)}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "checkbox-outline"}
                  size={24}
                  color={isSelected ? "#2196F3" : "#999"}
                />
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, isSelected && styles.serviceSelectedText]}>
                    {service.nombre}
                  </Text>
                  <Text style={styles.serviceCategory}>{service.categoria}</Text>
                </View>
              </TouchableOpacity>
              
              {isSelected && (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={selectedService?.precio || service.precioDefault}
                    onChangeText={(text) => updateServicePrice(selectedService?.id || '', text)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Horarios de Atención</Text>
      <Text style={styles.stepSubtitle}>Define tus horarios por día</Text>
      
      <ScrollView style={styles.scheduleContainer} showsVerticalScrollIndicator={false}>
        {clinicInfo.horarios.map((horario, index) => (
          <View key={index} style={styles.scheduleItem}>
            <TouchableOpacity
              style={styles.dayToggle}
              onPress={() => toggleSchedule(horario.dia)}
            >
              <Ionicons
                name={horario.abierto ? "checkbox" : "checkbox-outline"}
                size={24}
                color={horario.abierto ? "#2196F3" : "#999"}
              />
              <Text style={[styles.dayName, horario.abierto && styles.dayActive]}>
                {horario.dia}
              </Text>
            </TouchableOpacity>
            
            {horario.abierto && (
              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Abre</Text>
                  <TextInput
                    style={styles.timeField}
                    value={horario.horaApertura}
                    onChangeText={(text) => updateScheduleTime(horario.dia, 'horaApertura', text)}
                    placeholder="09:00"
                  />
                </View>
                <Text style={styles.timeSeparator}>-</Text>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Cierra</Text>
                  <TextInput
                    style={styles.timeField}
                    value={horario.horaCierre}
                    onChangeText={(text) => updateScheduleTime(horario.dia, 'horaCierre', text)}
                    placeholder="18:00"
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¡Listo para Empezar!</Text>
      <Text style={styles.stepSubtitle}>Revisa tu configuración</Text>
      
      <ScrollView style={styles.summaryContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Clínica</Text>
          <Text style={styles.summaryText}>{clinicInfo.nombre}</Text>
          <Text style={styles.summaryText}>{clinicInfo.direccion}</Text>
          <Text style={styles.summaryText}>{clinicInfo.telefono}</Text>
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Servicios ({clinicInfo.servicios.length})</Text>
          {clinicInfo.servicios.map(service => (
            <Text key={service.id} style={styles.summaryText}>
              {service.nombre} - ${service.precio}
            </Text>
          ))}
        </View>
        
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Horarios</Text>
          {clinicInfo.horarios.filter(h => h.abierto).map(horario => (
            <Text key={horario.dia} style={styles.summaryText}>
              {horario.dia}: {horario.horaApertura} - {horario.horaCierre}
            </Text>
          ))}
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
          colors={['#2196F3', '#E3F2FD']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Configurar Clínica</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map(step => (
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
                {step < 4 && <View style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive
                ]} />}
              </View>
            ))}
          </View>

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
              style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
              onPress={currentStep === 4 ? saveAndContinue : nextStep}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 4 ? 'Guardar Configuración' : 'Siguiente'}
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
    backgroundColor: '#2196F3',
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
    color: '#2196F3',
  },
  progressLine: {
    width: 30,
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  servicesContainer: {
    maxHeight: 400,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceSelected: {
    opacity: 1,
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  serviceSelectedText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginRight: 4,
  },
  priceInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
  scheduleContainer: {
    maxHeight: 400,
  },
  scheduleItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
    marginLeft: 12,
  },
  dayActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
  },
  timeInput: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeField: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 70,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 12,
  },
  summaryContainer: {
    maxHeight: 400,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VetClinicSetupScreen;