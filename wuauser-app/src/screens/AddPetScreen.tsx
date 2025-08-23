import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/colors';
import { petService, PetData } from '../services/petService';
import { authService } from '../services/supabase';
import { CustomAlert, AlertType } from '../components/CustomAlert';
import Toast from 'react-native-toast-message';
import { RadioButton } from '../components/RadioButton';
import chipTrackingService from '../services/chipTrackingService';

interface AddPetScreenProps {
  navigation: any;
  route?: {
    params?: {
      editMode?: boolean;
      petData?: PetData;
    };
  };
}

interface FormData {
  nombre: string;
  especie: 'Perro' | 'Gato';
  raza: string;
  sexo: 'Macho' | 'Hembra';
  fecha_nacimiento: Date;
  color_señas: string;
  chip_numero: string;
  esterilizado: boolean;
  vacunas: string[];
  alergias_condiciones: string;
  veterinario_cabecera: string;
}

export const AddPetScreen: React.FC<AddPetScreenProps> = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [hasCollar, setHasCollar] = useState<boolean | null>(null);
  const [collarCode, setCollarCode] = useState('');
  const [collarVerified, setCollarVerified] = useState(false);
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: AlertType;
  }>({
    title: '',
    message: '',
    type: 'info'
  });

  const editMode = route?.params?.editMode || false;
  const editPetData = route?.params?.petData;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    getValues,
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      nombre: editPetData?.nombre || '',
      especie: editPetData?.especie || 'Perro',
      raza: editPetData?.raza || '',
      sexo: editPetData?.sexo || 'Macho',
      fecha_nacimiento: editPetData?.fecha_nacimiento ? new Date(editPetData.fecha_nacimiento) : new Date(),
      color_señas: editPetData?.color_señas || '',
      chip_numero: editPetData?.chip_numero || '',
      esterilizado: editPetData?.esterilizado || false,
      vacunas: editPetData?.vacunas || [],
      alergias_condiciones: editPetData?.alergias_condiciones || '',
      veterinario_cabecera: editPetData?.veterinario_cabecera || '',
    },
  });

  const watchedEspecie = watch('especie');
  const watchedNombre = watch('nombre');

  // Custom alert function
  const showAlert = (config: { title: string; message: string; type: AlertType }) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handlePhotoAction = () => {
    Alert.alert(
      'Foto de la Mascota',
      'Selecciona una opción:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar Foto',
          onPress: async () => {
            const result = await petService.takePhoto();
            if (result && !result.canceled) {
              setSelectedPhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Elegir de Galería',
          onPress: async () => {
            const result = await petService.pickImage();
            if (result && !result.canceled) {
              setSelectedPhoto(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  const toggleVaccine = (vaccine: string) => {
    const newVaccines = selectedVaccines.includes(vaccine)
      ? selectedVaccines.filter(v => v !== vaccine)
      : [...selectedVaccines, vaccine];
    
    setSelectedVaccines(newVaccines);
    setValue('vacunas', newVaccines);
  };

  const handleScanCollar = () => {
    // Navigate to collar scanner
    navigation.navigate('QRScanner', {
      onScanComplete: (scannedCode: string) => {
        handleCollarCodeScanned(scannedCode);
      }
    });
  };

  const handleCollarCodeScanned = async (scannedCode: string) => {
    try {
      setCollarCode(scannedCode);
      // Mock verification - in real app this would verify with collar API
      const isValidFormat = /^WUA-\d{4}-\d{4}$/.test(scannedCode);
      
      if (isValidFormat) {
        setCollarVerified(true);
        Toast.show({
          type: 'success',
          text1: '¡Collar verificado!',
          text2: 'GPS activado para tu mascota',
          position: 'top'
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Código inválido',
          message: 'El código del collar no es válido. Formato: WUA-XXXX-XXXX'
        });
        setCollarVerified(false);
      }
    } catch (error) {
      console.error('Error verifying collar:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudo verificar el collar'
      });
    }
  };

  const handleCollarCodeChange = async (code: string) => {
    setCollarCode(code);
    setCollarVerified(false);
    
    // Auto-verify if code has correct format
    if (/^WUA-\d{4}-\d{4}$/.test(code)) {
      await handleCollarCodeScanned(code);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      // Get current user data
      const { user } = await authService.getCurrentUser();
      const savedEmail = await SecureStore.getItemAsync('user_email');
      
      if (!user && !savedEmail) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'No se pudo identificar al usuario'
        });
        return;
      }

      // Pet registration without QR generation
      const petId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare pet data
      const petData: PetData = {
        nombre: data.nombre,
        especie: data.especie,
        raza: data.raza,
        sexo: data.sexo,
        fecha_nacimiento: data.fecha_nacimiento.toISOString().split('T')[0],
        color_señas: data.color_señas,
        collar_id: hasCollar && collarCode ? collarCode : null,
        has_gps: hasCollar && collarVerified,
        esterilizado: data.esterilizado,
        vacunas: data.vacunas,
        alergias_condiciones: data.alergias_condiciones,
        veterinario_cabecera: data.veterinario_cabecera,
        owner_id: user?.id || 'mock_owner',
      };

      // Upload photo if selected
      if (selectedPhoto) {
        const uploadResult = await petService.uploadPetPhoto(
          selectedPhoto, 
          petData.nombre.toLowerCase().replace(/\s+/g, '_')
        );
        
        if (uploadResult.url) {
          petData.foto_url = uploadResult.url;
        }
      }

      // Create or update pet
      let result;
      if (editMode && editPetData?.id) {
        result = await petService.updatePet(editPetData.id, petData);
      } else {
        const ownerData = {
          email: user?.email || savedEmail,
          telefono: user?.user_metadata?.telefono || '+52 555 000 0000',
        };
        result = await petService.createPet(petData, ownerData);
      }

      if (result.error) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.error
        });
        return;
      }

      // Verificar que se guardó correctamente
      if (result.data) {
        const saved = await AsyncStorage.getItem('user_pets');
        console.log('Mascotas después de guardar:', saved);
      }

      // Register collar if provided
      if (hasCollar && collarVerified && collarCode) {
        try {
          await chipTrackingService.registerChip({
            chipCode: collarCode,
            petId: result.data?.id || petId,
            verificationMethod: collarCode.includes('WUA') ? 'scan' : 'manual',
            isVerified: true
          });
        } catch (chipError) {
          console.error('Error registering collar:', chipError);
          // Don't fail the pet creation for collar registration errors
        }
      }

      // Pet saved successfully - show success alert
      Alert.alert(
        '¡Mascota Registrada!',
        `${data.nombre} se ha agregado exitosamente a tu perfil`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('HomeScreen', { screen: 'MisMascotas' })
          }
        ]
      );
      
      Toast.show({
        type: 'success',
        text1: '¡Mascota guardada!',
        text2: `${data.nombre} ha sido registrado exitosamente`,
        position: 'top'
      });

    } catch (error: any) {
      console.error('Error saving pet:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la mascota'
      });
    } finally {
      setIsLoading(false);
    }
  };


  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]}>
          <Text style={[styles.progressStepText, currentStep >= 1 && styles.progressStepTextActive]}>1</Text>
        </View>
        <View style={[styles.progressLine, currentStep >= 2 && styles.progressLineActive]} />
        <View style={[styles.progressStep, currentStep >= 2 && styles.progressStepActive]}>
          <Text style={[styles.progressStepText, currentStep >= 2 && styles.progressStepTextActive]}>2</Text>
        </View>
        <View style={[styles.progressLine, currentStep >= 3 && styles.progressLineActive]} />
        <View style={[styles.progressStep, currentStep >= 3 && styles.progressStepActive]}>
          <Text style={[styles.progressStepText, currentStep >= 3 && styles.progressStepTextActive]}>3</Text>
        </View>
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>Básica</Text>
        <Text style={styles.progressLabel}>Collar GPS</Text>
        <Text style={styles.progressLabel}>Médica</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Información Básica</Text>
      
      {/* Photo Section */}
      <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoAction}>
        {selectedPhoto ? (
          <Image source={{ uri: selectedPhoto }} style={styles.petPhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={40} color="#999" />
            <Text style={styles.photoPlaceholderText}>Agregar Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre de la mascota *</Text>
        <Controller
          control={control}
          name="nombre"
          rules={{ required: 'El nombre es requerido' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.nombre && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ej: Max, Luna, Rocky"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.nombre && <Text style={styles.errorText}>{errors.nombre.message}</Text>}
      </View>

      {/* Species */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Especie *</Text>
        <Controller
          control={control}
          name="especie"
          render={({ field: { value, onChange } }) => (
            <View style={styles.speciesContainer}>
              <TouchableOpacity
                style={[styles.speciesButton, value === 'Perro' && styles.speciesButtonActive]}
                onPress={() => onChange('Perro')}
              >
                <Ionicons name="paw" size={24} color={value === 'Perro' ? '#FFF' : '#F4B740'} />
                <Text style={[styles.speciesButtonText, value === 'Perro' && styles.speciesButtonTextActive]}>
                  Perro
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.speciesButton, value === 'Gato' && styles.speciesButtonActive]}
                onPress={() => onChange('Gato')}
              >
                <Ionicons name="paw" size={24} color={value === 'Gato' ? '#FFF' : '#4ECDC4'} />
                <Text style={[styles.speciesButtonText, value === 'Gato' && styles.speciesButtonTextActive]}>
                  Gato
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Breed */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Raza</Text>
        <Controller
          control={control}
          name="raza"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Selecciona o escribe la raza"
              placeholderTextColor="#999"
            />
          )}
        />
      </View>

      {/* Sex */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Sexo *</Text>
        <Controller
          control={control}
          name="sexo"
          render={({ field: { value, onChange } }) => (
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, value === 'Macho' && styles.genderButtonActive]}
                onPress={() => onChange('Macho')}
              >
                <Ionicons name="male" size={20} color={value === 'Macho' ? '#FFF' : '#2196F3'} />
                <Text style={[styles.genderButtonText, value === 'Macho' && styles.genderButtonTextActive]}>
                  Macho
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.genderButton, value === 'Hembra' && styles.genderButtonActive]}
                onPress={() => onChange('Hembra')}
              >
                <Ionicons name="female" size={20} color={value === 'Hembra' ? '#FFF' : '#E91E63'} />
                <Text style={[styles.genderButtonText, value === 'Hembra' && styles.genderButtonTextActive]}>
                  Hembra
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Birth Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fecha de nacimiento</Text>
        <Controller
          control={control}
          name="fecha_nacimiento"
          render={({ field: { value, onChange } }) => (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.dateButtonText}>
                {value.toLocaleDateString('es-MX')}
              </Text>
            </TouchableOpacity>
          )}
        />
        
        {showDatePicker && (
          /* DateTimePicker temporally disabled - requires @react-native-community/datetimepicker */
          <View style={{ padding: 20, backgroundColor: '#f0f0f0', marginTop: 10, borderRadius: 8 }}>
            <Text style={{ textAlign: 'center', color: '#999' }}>
              Selector de fecha no disponible temporalmente
            </Text>
            <TouchableOpacity 
              style={{ marginTop: 10, backgroundColor: Colors.primary, padding: 10, borderRadius: 5 }}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Color and Markings */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Color y señas particulares</Text>
        <Controller
          control={control}
          name="color_señas"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Describe el color y características distintivas"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🏷️ Collar Wuauser GPS</Text>
      
      <View style={styles.chipSection}>
        <Text style={styles.sectionDescription}>
          El collar Wuauser te permite rastrear la ubicación de tu mascota en tiempo real y recibir alertas si sale de zonas seguras.
        </Text>
        
        <TouchableOpacity 
          style={[styles.chipOption, hasCollar === true && styles.chipOptionSelected]} 
          onPress={() => setHasCollar(true)}
        >
          <RadioButton selected={hasCollar === true} color="#F4B740" />
          <View style={styles.chipOptionContent}>
            <Text style={[styles.chipOptionTitle, hasCollar === true && styles.chipOptionTitleSelected]}>
              Ya tengo collar Wuauser
            </Text>
            <Text style={styles.chipOptionSubtitle}>Escanearé el código del collar</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.chipOption, hasCollar === false && styles.chipOptionSelected]} 
          onPress={() => setHasCollar(false)}
        >
          <RadioButton selected={hasCollar === false} color="#F4B740" />
          <View style={styles.chipOptionContent}>
            <Text style={[styles.chipOptionTitle, hasCollar === false && styles.chipOptionTitleSelected]}>
              Aún no tengo collar
            </Text>
            <Text style={styles.chipOptionSubtitle}>Lo agregaré cuando lo compre</Text>
          </View>
        </TouchableOpacity>
        
        {hasCollar && (
          <View style={styles.scanSection}>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanCollar}>
              <Ionicons name="camera-outline" size={60} color="#F4B740" />
              <Text style={styles.scanButtonText}>Escanear Código del Collar</Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>O ingresa código manualmente:</Text>
            
            <TextInput
              style={[styles.chipInput, collarVerified && styles.chipInputVerified]}
              placeholder="WUA-XXXX-XXXX"
              value={collarCode}
              onChangeText={handleCollarCodeChange}
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            
            {collarVerified && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.successBannerText}>¡Collar verificado! GPS activado</Text>
              </View>
            )}
          </View>
        )}
        
        {hasCollar === false && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#F4B740" />
            <Text style={styles.infoText}>Podrás agregar el collar GPS más tarde desde el perfil de tu mascota</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Información Médica</Text>
      

      {/* Sterilized */}
      <View style={styles.inputContainer}>
        <Controller
          control={control}
          name="esterilizado"
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.label}>¿Está esterilizado/castrado?</Text>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#E0E0E0', true: '#F4B740' }}
                thumbColor={value ? '#FFF' : '#FFF'}
              />
            </View>
          )}
        />
      </View>

      {/* Vaccines */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Vacunas aplicadas</Text>
        <View style={styles.vaccinesContainer}>
          {petService.getCommonVaccines(watchedEspecie).map((vaccine) => (
            <TouchableOpacity
              key={vaccine.name}
              style={[
                styles.vaccineChip,
                selectedVaccines.includes(vaccine.name) && styles.vaccineChipActive,
                vaccine.required && styles.vaccineChipRequired
              ]}
              onPress={() => toggleVaccine(vaccine.name)}
            >
              <Text style={[
                styles.vaccineChipText,
                selectedVaccines.includes(vaccine.name) && styles.vaccineChipTextActive
              ]}>
                {vaccine.name}
                {vaccine.required && ' *'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Allergies */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Alergias o condiciones médicas</Text>
        <Controller
          control={control}
          name="alergias_condiciones"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Describe cualquier alergia o condición médica conocida"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      {/* Veterinarian */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Veterinario de cabecera</Text>
        <Controller
          control={control}
          name="veterinario_cabecera"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Nombre del veterinario o clínica"
              placeholderTextColor="#999"
            />
          )}
        />
      </View>
    </View>
  );

  // Removed QR step - no longer needed

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
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editMode ? 'Editar Mascota' : 'Agregar Mascota'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {renderProgressBar()}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
          onPress={currentStep === 3 ? handleSubmit(onSubmit) : handleNext}
          disabled={!isValid || isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading ? 'Guardando...' : currentStep === 3 ? 'Registrar Mascota' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Custom Alert Component */}
      <CustomAlert
        isOpen={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
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
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#4CAF50',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressStepTextActive: {
    color: '#FFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#4CAF50',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 240,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 24,
    textAlign: 'center',
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  speciesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  speciesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    gap: 8,
  },
  speciesButtonActive: {
    backgroundColor: '#F4B740',
    borderColor: '#F4B740',
  },
  speciesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  speciesButtonTextActive: {
    color: '#FFF',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  genderButtonTextActive: {
    color: '#FFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaccinesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vaccineChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  vaccineChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  vaccineChipRequired: {
    borderColor: '#FF9800',
  },
  vaccineChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  vaccineChipTextActive: {
    color: '#FFF',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 24,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButton: {
    backgroundColor: '#F4B740',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Chip section styles
  chipSection: {
    marginTop: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  chipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  chipOptionSelected: {
    borderColor: '#F4B740',
    backgroundColor: '#FFF8E7',
  },
  chipOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  chipOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  chipOptionTitleSelected: {
    color: '#F4B740',
  },
  chipOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scanSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 2,
    borderColor: '#F4B740',
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#FFF8E7',
    marginBottom: 16,
    width: '100%',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F4B740',
    marginTop: 8,
  },
  orText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  chipInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  chipInputVerified: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    width: '100%',
  },
  successBannerText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F4B740',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default AddPetScreen;