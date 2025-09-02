import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import ImageUpload from '../components/ImageUpload';
import storageService, { ImageUploadResult } from '../services/storageService';

const { width } = Dimensions.get('window');

interface UploadResultsScreenProps {
  navigation: any;
  route?: {
    params?: {
      appointmentId?: string;
      petName?: string;
      ownerName?: string;
    };
  };
}

interface MedicalResult {
  id: string;
  type: 'blood_test' | 'xray' | 'ultrasound' | 'other';
  title: string;
  description: string;
  images: string[];
  notes: string;
  date: string;
}

const resultTypes = [
  {
    id: 'blood_test',
    name: 'Análisis de Sangre',
    icon: 'water-outline',
    color: '#E74C3C'
  },
  {
    id: 'xray',
    name: 'Radiografía',
    icon: 'scan-outline',
    color: '#3498DB'
  },
  {
    id: 'ultrasound',
    name: 'Ultrasonido',
    icon: 'pulse-outline',
    color: '#9B59B6'
  },
  {
    id: 'other',
    name: 'Otros',
    icon: 'document-text-outline',
    color: '#34495E'
  }
];

export const UploadResultsScreen: React.FC<UploadResultsScreenProps> = ({ 
  navigation,
  route 
}) => {
  const { appointmentId, petName, ownerName } = route?.params || {};
  
  const [selectedType, setSelectedType] = useState<string>('blood_test');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (result: ImageUploadResult) => {
    if (result.success && (result.url || result.localUri)) {
      const imageUri = result.url || result.localUri!;
      setUploadedImages(prev => [...prev, imageUri]);
    }
  };

  const handleImageRemove = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMultipleImageUpload = async () => {
    try {
      setIsUploading(true);
      console.log('📷 Starting multiple image upload...');
      
      const results = await storageService.uploadMultipleImages(5, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.9
      });

      const successfulUploads = results
        .filter(result => result.success && (result.url || result.localUri))
        .map(result => result.url || result.localUri!);

      if (successfulUploads.length > 0) {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
        console.log(`✅ ${successfulUploads.length} images uploaded successfully`);
      } else {
        Alert.alert('Info', 'No se seleccionaron imágenes');
      }
    } catch (error) {
      console.error('❌ Multiple upload error:', error);
      Alert.alert('Error', 'Error al subir las imágenes');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el resultado');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa una descripción');
      return;
    }

    if (uploadedImages.length === 0) {
      Alert.alert('Error', 'Por favor sube al menos una imagen del resultado');
      return;
    }

    try {
      const newResult: MedicalResult = {
        id: Date.now().toString(),
        type: selectedType as any,
        title: title.trim(),
        description: description.trim(),
        images: uploadedImages,
        notes: notes.trim(),
        date: new Date().toISOString()
      };

      console.log('💾 Saving medical result:', newResult);
      
      // En producción, esto se guardaría en Supabase
      // await medicalResultsService.saveMedicalResult(appointmentId, newResult);

      Alert.alert(
        'Éxito',
        'Resultado médico guardado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving result:', error);
      Alert.alert('Error', 'No se pudo guardar el resultado');
    }
  };

  const selectedTypeData = resultTypes.find(type => type.id === selectedType);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <Text style={styles.headerTitle}>Subir Resultados</Text>
          <View style={styles.placeholder} />
        </View>
        {petName && ownerName && (
          <Text style={styles.headerSubtitle}>
            {petName} • {ownerName}
          </Text>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Resultado</Text>
          <View style={styles.typeGrid}>
            {resultTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <View style={[
                  styles.typeIcon,
                  { backgroundColor: type.color },
                  selectedType === type.id && styles.typeIconSelected
                ]}>
                  <Ionicons 
                    name={type.icon as any} 
                    size={24} 
                    color={selectedType === type.id ? type.color : '#FFF'} 
                  />
                </View>
                <Text style={[
                  styles.typeName,
                  selectedType === type.id && styles.typeNameSelected
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Título del Resultado</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder={`Ej: ${selectedTypeData?.name} - ${new Date().toLocaleDateString('es-MX')}`}
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe los hallazgos y resultados principales..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Imágenes del Resultado</Text>
            <TouchableOpacity
              style={styles.multipleUploadButton}
              onPress={handleMultipleImageUpload}
              disabled={isUploading}
            >
              <Ionicons name="images-outline" size={16} color="#4ECDC4" />
              <Text style={styles.multipleUploadText}>Múltiples</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.imageGrid}>
            {/* Add new image button */}
            <ImageUpload
              onImageSelected={handleImageUpload}
              placeholder="Agregar imagen"
              uploadOptions={{
                maxWidth: 1024,
                maxHeight: 1024,
                quality: 0.9,
                aspect: [4, 3],
                allowsEditing: false
              }}
              size="medium"
              shape="rectangle"
              disabled={isUploading}
            />

            {/* Display uploaded images */}
            {uploadedImages.map((imageUri, index) => (
              <View key={index} style={styles.uploadedImageContainer}>
                <ImageUpload
                  currentImage={imageUri}
                  onImageRemoved={() => handleImageRemove(index)}
                  size="medium"
                  shape="rectangle"
                  disabled={isUploading}
                />
              </View>
            ))}
          </View>
          
          <Text style={styles.imageHint}>
            Se recomiendan imágenes claras y bien iluminadas. Máximo 5 imágenes.
          </Text>
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas Adicionales (Opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Instrucciones de seguimiento, recomendaciones adicionales..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Storage Info */}
        <View style={styles.storageInfo}>
          <Ionicons 
            name={storageService.isStorageAvailable ? "cloud-upload-outline" : "phone-portrait-outline"} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.storageInfoText}>
            {storageService.isStorageAvailable 
              ? 'Las imágenes se guardarán en la nube de forma segura'
              : 'Las imágenes se guardarán localmente en el dispositivo'
            }
          </Text>
        </View>

        <View style={styles.safetySpace} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, isUploading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isUploading}
        >
          <Text style={styles.saveButtonText}>
            {isUploading ? 'Subiendo...' : 'Guardar Resultado'}
          </Text>
          <Ionicons name="checkmark" size={20} color="#FFF" />
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
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
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  multipleUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 16,
    gap: 4,
  },
  multipleUploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 56) / 2,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  typeCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.05)',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  typeNameSelected: {
    color: '#4ECDC4',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#2A2A2A',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  uploadedImageContainer: {
    // Additional styling if needed
  },
  imageHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  storageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  storageInfoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  safetySpace: {
    height: 20,
  },
});

export default UploadResultsScreen;