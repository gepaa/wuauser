import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { MedicalRecord, Prescription, Vaccine, MedicalRecordTemplate } from '../types/medicalRecord';
import medicalRecordService from '../services/medicalRecordService';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface AddMedicalRecordScreenProps {
  navigation: any;
  route: {
    params: {
      petId: string;
      petName: string;
    };
  };
}

const recordTypes = [
  { key: 'consulta', label: 'Consulta General', icon: 'medical-outline', color: '#2196F3' },
  { key: 'vacuna', label: 'Vacunación', icon: 'shield-checkmark-outline', color: '#4CAF50' },
  { key: 'cirugia', label: 'Cirugía', icon: 'cut-outline', color: '#FF9800' },
  { key: 'emergencia', label: 'Emergencia', icon: 'warning-outline', color: '#F44336' },
  { key: 'laboratorio', label: 'Laboratorio', icon: 'flask-outline', color: '#9C27B0' },
  { key: 'revision', label: 'Revisión', icon: 'checkmark-circle-outline', color: '#00BCD4' },
];

export const AddMedicalRecordScreen: React.FC<AddMedicalRecordScreenProps> = ({ navigation, route }) => {
  const { petId, petName } = route.params;
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [recordType, setRecordType] = useState('consulta');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  
  // Vital signs
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  
  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState({
    medicine: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  // Vaccines (if type is 'vacuna')
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [currentVaccine, setCurrentVaccine] = useState({
    name: '',
    manufacturer: '',
    lotNumber: '',
    site: '',
    reactions: ''
  });
  
  // Follow up
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [vetData, setVetData] = useState({ id: '', name: '', clinic: '' });

  useEffect(() => {
    loadVetData();
  }, []);

  const loadVetData = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('user_email');
      if (savedEmail) {
        setVetData({
          id: 'vet_001',
          name: 'Dr. ' + savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          clinic: 'Veterinaria San José'
        });
      }
    } catch (error) {
      console.error('Error loading vet data:', error);
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const addPrescription = () => {
    if (currentPrescription.medicine && currentPrescription.dosage) {
      const newPrescription: Prescription = {
        id: `pres_${Date.now()}`,
        medicine: currentPrescription.medicine,
        dosage: currentPrescription.dosage,
        frequency: currentPrescription.frequency,
        duration: currentPrescription.duration,
        instructions: currentPrescription.instructions,
        startDate: new Date(),
        completed: false
      };
      
      setPrescriptions([...prescriptions, newPrescription]);
      setCurrentPrescription({
        medicine: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const addVaccine = () => {
    if (currentVaccine.name) {
      const newVaccine: Vaccine = {
        id: `vac_${Date.now()}`,
        name: currentVaccine.name,
        manufacturer: currentVaccine.manufacturer,
        lotNumber: currentVaccine.lotNumber,
        site: currentVaccine.site,
        reactions: currentVaccine.reactions,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        nextDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
      
      setVaccines([...vaccines, newVaccine]);
      setCurrentVaccine({
        name: '',
        manufacturer: '',
        lotNumber: '',
        site: '',
        reactions: ''
      });
    }
  };

  const removeVaccine = (index: number) => {
    setVaccines(vaccines.filter((_, i) => i !== index));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return recordType && reason;
      case 2:
        return weight; // At least weight is required
      case 3:
        return diagnosis && treatment;
      case 4:
        return true; // Prescriptions are optional
      case 5:
        return true; // Follow-up is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSaveRecord();
      }
    } else {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos obligatorios.');
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveRecord = async () => {
    try {
      setIsLoading(true);
      
      const recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        petId,
        petName,
        vetId: vetData.id,
        vetName: vetData.name,
        clinicName: vetData.clinic,
        date: new Date(),
        type: recordType as any,
        reason,
        symptoms,
        diagnosis,
        treatment,
        vitalSigns: {
          weight: weight ? parseFloat(weight) : undefined,
          temperature: temperature ? parseFloat(temperature) : undefined,
          heartRate: heartRate ? parseInt(heartRate) : undefined,
          respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        },
        attachments: [],
        prescriptions,
        vaccines: recordType === 'vacuna' ? vaccines : undefined,
        procedures: [],
        labResults: [],
        followUp: followUpNeeded ? {
          date: new Date(followUpDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
          reason: followUpReason,
          scheduled: true
        } : undefined,
        notes,
        status: 'active',
        sharedWith: []
      };

      await medicalRecordService.saveMedicalRecord(recordData);
      
      Alert.alert(
        'Registro Guardado',
        'El registro médico se ha guardado exitosamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving medical record:', error);
      Alert.alert('Error', 'No se pudo guardar el registro médico.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            step === currentStep && styles.activeStepCircle,
            step < currentStep && styles.completedStepCircle
          ]}>
            {step < currentStep ? (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                step === currentStep && styles.activeStepNumber
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 5 && <View style={[
            styles.stepLine,
            step < currentStep && styles.completedStepLine
          ]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Información Básica</Text>
      
      <Text style={styles.label}>Tipo de Registro *</Text>
      <View style={styles.typeGrid}>
        {recordTypes.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeCard,
              recordType === type.key && styles.selectedTypeCard,
              { borderColor: type.color }
            ]}
            onPress={() => setRecordType(type.key)}
          >
            <Ionicons 
              name={type.icon as any} 
              size={24} 
              color={recordType === type.key ? type.color : '#666'} 
            />
            <Text style={[
              styles.typeLabel,
              recordType === type.key && { color: type.color }
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Motivo de la Consulta *</Text>
      <TextInput
        style={styles.textInput}
        value={reason}
        onChangeText={setReason}
        placeholder="Ej: Control de rutina, problema digestivo..."
        multiline
      />

      <Text style={styles.label}>Síntomas Observados</Text>
      <View style={styles.symptomContainer}>
        <View style={styles.symptomInputContainer}>
          <TextInput
            style={styles.symptomInput}
            value={symptomInput}
            onChangeText={setSymptomInput}
            placeholder="Agregar síntoma"
            onSubmitEditing={addSymptom}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSymptom}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.symptomList}>
          {symptoms.map((symptom, index) => (
            <View key={index} style={styles.symptomChip}>
              <Text style={styles.symptomText}>{symptom}</Text>
              <TouchableOpacity onPress={() => removeSymptom(index)}>
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Examen Físico</Text>
      
      <View style={styles.vitalSignsGrid}>
        <View style={styles.vitalSignItem}>
          <Text style={styles.label}>Peso (kg) *</Text>
          <TextInput
            style={styles.numberInput}
            value={weight}
            onChangeText={setWeight}
            placeholder="25.5"
            keyboardType="decimal-pad"
          />
        </View>
        
        <View style={styles.vitalSignItem}>
          <Text style={styles.label}>Temperatura (°C)</Text>
          <TextInput
            style={styles.numberInput}
            value={temperature}
            onChangeText={setTemperature}
            placeholder="38.5"
            keyboardType="decimal-pad"
          />
        </View>
        
        <View style={styles.vitalSignItem}>
          <Text style={styles.label}>Frecuencia Cardíaca</Text>
          <TextInput
            style={styles.numberInput}
            value={heartRate}
            onChangeText={setHeartRate}
            placeholder="90"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.vitalSignItem}>
          <Text style={styles.label}>Frecuencia Respiratoria</Text>
          <TextInput
            style={styles.numberInput}
            value={respiratoryRate}
            onChangeText={setRespiratoryRate}
            placeholder="25"
            keyboardType="numeric"
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Diagnóstico y Tratamiento</Text>
      
      <Text style={styles.label}>Diagnóstico *</Text>
      <TextInput
        style={styles.textInput}
        value={diagnosis}
        onChangeText={setDiagnosis}
        placeholder="Diagnóstico del veterinario..."
        multiline
      />

      <Text style={styles.label}>Tratamiento *</Text>
      <TextInput
        style={styles.textInput}
        value={treatment}
        onChangeText={setTreatment}
        placeholder="Plan de tratamiento recomendado..."
        multiline
      />

      <Text style={styles.label}>Notas Adicionales</Text>
      <TextInput
        style={styles.textInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Observaciones adicionales..."
        multiline
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>
        {recordType === 'vacuna' ? 'Vacunas Aplicadas' : 'Receta Médica'}
      </Text>
      
      {recordType === 'vacuna' ? (
        <>
          <View style={styles.prescriptionForm}>
            <Text style={styles.label}>Nueva Vacuna</Text>
            <TextInput
              style={styles.textInput}
              value={currentVaccine.name}
              onChangeText={(text) => setCurrentVaccine({...currentVaccine, name: text})}
              placeholder="Nombre de la vacuna"
            />
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  style={styles.textInput}
                  value={currentVaccine.manufacturer}
                  onChangeText={(text) => setCurrentVaccine({...currentVaccine, manufacturer: text})}
                  placeholder="Fabricante"
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  style={styles.textInput}
                  value={currentVaccine.lotNumber}
                  onChangeText={(text) => setCurrentVaccine({...currentVaccine, lotNumber: text})}
                  placeholder="Lote"
                />
              </View>
            </View>
            
            <TextInput
              style={styles.textInput}
              value={currentVaccine.site}
              onChangeText={(text) => setCurrentVaccine({...currentVaccine, site: text})}
              placeholder="Sitio de aplicación"
            />
            
            <TouchableOpacity style={styles.addButton} onPress={addVaccine}>
              <Text style={styles.addButtonText}>Agregar Vacuna</Text>
            </TouchableOpacity>
          </View>
          
          {vaccines.map((vaccine, index) => (
            <View key={index} style={styles.prescriptionItem}>
              <View style={styles.prescriptionInfo}>
                <Text style={styles.prescriptionMedicine}>{vaccine.name}</Text>
                <Text style={styles.prescriptionDetails}>
                  {vaccine.manufacturer} - Lote: {vaccine.lotNumber}
                </Text>
                <Text style={styles.prescriptionDetails}>Sitio: {vaccine.site}</Text>
              </View>
              <TouchableOpacity onPress={() => removeVaccine(index)}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      ) : (
        <>
          <View style={styles.prescriptionForm}>
            <Text style={styles.label}>Nuevo Medicamento</Text>
            <TextInput
              style={styles.textInput}
              value={currentPrescription.medicine}
              onChangeText={(text) => setCurrentPrescription({...currentPrescription, medicine: text})}
              placeholder="Nombre del medicamento"
            />
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  style={styles.textInput}
                  value={currentPrescription.dosage}
                  onChangeText={(text) => setCurrentPrescription({...currentPrescription, dosage: text})}
                  placeholder="Dosis (ej: 10mg)"
                />
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  style={styles.textInput}
                  value={currentPrescription.frequency}
                  onChangeText={(text) => setCurrentPrescription({...currentPrescription, frequency: text})}
                  placeholder="Frecuencia"
                />
              </View>
            </View>
            
            <TextInput
              style={styles.textInput}
              value={currentPrescription.duration}
              onChangeText={(text) => setCurrentPrescription({...currentPrescription, duration: text})}
              placeholder="Duración (ej: 7 días)"
            />
            
            <TextInput
              style={styles.textInput}
              value={currentPrescription.instructions}
              onChangeText={(text) => setCurrentPrescription({...currentPrescription, instructions: text})}
              placeholder="Instrucciones especiales"
              multiline
            />
            
            <TouchableOpacity style={styles.addButton} onPress={addPrescription}>
              <Text style={styles.addButtonText}>Agregar Medicamento</Text>
            </TouchableOpacity>
          </View>
          
          {prescriptions.map((prescription, index) => (
            <View key={index} style={styles.prescriptionItem}>
              <View style={styles.prescriptionInfo}>
                <Text style={styles.prescriptionMedicine}>{prescription.medicine}</Text>
                <Text style={styles.prescriptionDetails}>
                  {prescription.dosage} - {prescription.frequency}
                </Text>
                <Text style={styles.prescriptionDetails}>Duración: {prescription.duration}</Text>
              </View>
              <TouchableOpacity onPress={() => removePrescription(index)}>
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Seguimiento</Text>
      
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setFollowUpNeeded(!followUpNeeded)}
      >
        <View style={[styles.checkbox, followUpNeeded && styles.checkedCheckbox]}>
          {followUpNeeded && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </View>
        <Text style={styles.checkboxLabel}>Agendar cita de seguimiento</Text>
      </TouchableOpacity>
      
      {followUpNeeded && (
        <>
          <Text style={styles.label}>Motivo del Seguimiento</Text>
          <TextInput
            style={styles.textInput}
            value={followUpReason}
            onChangeText={setFollowUpReason}
            placeholder="Control post-tratamiento, revisión de resultados..."
            multiline
          />
        </>
      )}
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuevo Registro</Text>
          <View style={styles.placeholder} />
        </View>
        
        <Text style={styles.petName}>Para: {petName}</Text>
        {renderStepIndicator()}
      </LinearGradient>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
        <View style={styles.safetySpace} />
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={previousStep}>
            <Text style={styles.secondaryButtonText}>Anterior</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.primaryButton, !validateCurrentStep() && styles.disabledButton]}
          onPress={nextStep}
          disabled={!validateCurrentStep() || isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep === 5 ? 'Guardar Registro' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  placeholder: {
    width: 40,
  },
  petName: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#2196F3',
  },
  completedStepCircle: {
    backgroundColor: '#4CAF50',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  activeStepNumber: {
    color: '#FFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  completedStepLine: {
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    minHeight: 50,
  },
  numberInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  typeCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  selectedTypeCard: {
    borderWidth: 2,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  symptomContainer: {
    marginBottom: 20,
  },
  symptomInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  symptomInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  symptomList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  symptomText: {
    fontSize: 14,
    color: '#2196F3',
  },
  vitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  vitalSignItem: {
    width: (width - 64) / 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  prescriptionForm: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionMedicine: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  prescriptionDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  safetySpace: {
    height: 100,
  },
});

export default AddMedicalRecordScreen;