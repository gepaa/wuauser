import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import ImageUpload from '../components/ImageUpload';
import storageService, { ImageUploadResult } from '../services/storageService';

const { width } = Dimensions.get('window');

interface MedicalHistoryScreenProps {
  navigation: any;
  route?: {
    params?: {
      petId: string;
      petName: string;
      petType: string;
      ownerName: string;
    };
  };
}

interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'vaccination' | 'surgery' | 'test_result' | 'emergency';
  title: string;
  description: string;
  vetName: string;
  clinicName: string;
  images: string[];
  medications?: Medication[];
  nextAppointment?: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface VitalSigns {
  weight: number;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  date: string;
}

const recordTypeColors = {
  consultation: '#3498DB',
  vaccination: '#2ECC71',
  surgery: '#E74C3C',
  test_result: '#9B59B6',
  emergency: '#E67E22'
};

const recordTypeIcons = {
  consultation: 'medical-outline',
  vaccination: 'shield-checkmark-outline',
  surgery: 'cut-outline',
  test_result: 'document-text-outline',
  emergency: 'alert-circle-outline'
};

export const MedicalHistoryScreen: React.FC<MedicalHistoryScreenProps> = ({ 
  navigation,
  route 
}) => {
  const { petId, petName = 'Max', petType = 'Perro', ownerName = 'Carlos R.' } = route?.params || {};
  
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [petImage, setPetImage] = useState<string>('');

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      // Mock data - En producción vendría de Supabase
      const mockRecords: MedicalRecord[] = [
        {
          id: '1',
          date: '2024-01-15',
          type: 'consultation',
          title: 'Consulta General',
          description: 'Revisión rutinaria. Mascota en excelente estado de salud. Se aplicó vacuna antirrábica.',
          vetName: 'Dr. Ana González',
          clinicName: 'Clínica Veterinaria del Centro',
          images: [],
          medications: [
            {
              id: '1',
              name: 'Vitamina B12',
              dosage: '1ml',
              frequency: 'Cada 15 días',
              duration: '3 meses',
              instructions: 'Aplicar vía intramuscular'
            }
          ],
          nextAppointment: '2024-02-15',
          notes: 'Continuar con alimentación actual. Próxima revisión en 1 mes.'
        },
        {
          id: '2',
          date: '2024-01-08',
          type: 'vaccination',
          title: 'Vacunación Múltiple',
          description: 'Se aplicaron vacunas: Parvovirus, Distemper, Hepatitis y Parainfluenza.',
          vetName: 'Dr. Miguel Torres',
          clinicName: 'Veterinaria San José',
          images: [],
          medications: [],
          notes: 'Reposo por 24 horas. Observar posibles reacciones.'
        },
        {
          id: '3',
          date: '2024-01-01',
          type: 'test_result',
          title: 'Análisis de Sangre',
          description: 'Resultados de laboratorio: Hemograma completo y química sanguínea dentro de parámetros normales.',
          vetName: 'Dr. Ana González',
          clinicName: 'Clínica Veterinaria del Centro',
          images: ['https://example.com/blood-test.jpg'],
          medications: [],
          notes: 'Todos los valores en rangos normales. Mascota saludable.'
        }
      ];

      const mockVitalSigns: VitalSigns[] = [
        {
          weight: 25.2,
          temperature: 38.5,
          heartRate: 90,
          respiratoryRate: 20,
          date: '2024-01-15'
        },
        {
          weight: 24.8,
          temperature: 38.3,
          heartRate: 95,
          respiratoryRate: 22,
          date: '2024-01-08'
        }
      ];

      setRecords(mockRecords);
      setVitalSigns(mockVitalSigns);
    } catch (error) {
      console.error('Error loading medical history:', error);
      Alert.alert('Error', 'No se pudo cargar el historial médico');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMedicalHistory();
    setRefreshing(false);
  }, []);

  const handlePetImageUpload = (result: ImageUploadResult) => {
    if (result.success && (result.url || result.localUri)) {
      const imageUri = result.url || result.localUri!;
      setPetImage(imageUri);
      console.log('✅ Pet image updated:', imageUri);
    }
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLatestVitalSigns = () => {
    return vitalSigns.length > 0 ? vitalSigns[0] : null;
  };

  const renderVitalSignsCard = () => {
    const latest = getLatestVitalSigns();
    if (!latest) return null;

    return (
      <View style={styles.vitalSignsCard}>
        <Text style={styles.sectionTitle}>Signos Vitales Recientes</Text>
        <Text style={styles.vitalSignsDate}>{formatDate(latest.date)}</Text>
        
        <View style={styles.vitalSignsGrid}>
          <View style={styles.vitalSignItem}>
            <Ionicons name="fitness-outline" size={24} color="#2ECC71" />
            <Text style={styles.vitalSignValue}>{latest.weight} kg</Text>
            <Text style={styles.vitalSignLabel}>Peso</Text>
          </View>
          
          <View style={styles.vitalSignItem}>
            <Ionicons name="thermometer-outline" size={24} color="#E74C3C" />
            <Text style={styles.vitalSignValue}>{latest.temperature}°C</Text>
            <Text style={styles.vitalSignLabel}>Temperatura</Text>
          </View>
          
          <View style={styles.vitalSignItem}>
            <Ionicons name="heart-outline" size={24} color="#E91E63" />
            <Text style={styles.vitalSignValue}>{latest.heartRate} bpm</Text>
            <Text style={styles.vitalSignLabel}>Pulso</Text>
          </View>
          
          <View style={styles.vitalSignItem}>
            <Ionicons name="pulse-outline" size={24} color="#3498DB" />
            <Text style={styles.vitalSignValue}>{latest.respiratoryRate}/min</Text>
            <Text style={styles.vitalSignLabel}>Respiración</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecordCard = (record: MedicalRecord) => (
    <TouchableOpacity
      key={record.id}
      style={styles.recordCard}
      onPress={() => setSelectedRecord(record)}
    >
      <View style={styles.recordHeader}>
        <View style={[
          styles.recordTypeIcon,
          { backgroundColor: recordTypeColors[record.type] }
        ]}>
          <Ionicons 
            name={recordTypeIcons[record.type] as any} 
            size={20} 
            color="#FFF" 
          />
        </View>
        
        <View style={styles.recordHeaderText}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
        </View>
        
        <View style={styles.recordActions}>
          {record.images.length > 0 && (
            <View style={styles.imagesBadge}>
              <Ionicons name="camera" size={12} color="#666" />
              <Text style={styles.imagesBadgeText}>{record.images.length}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#999" />
        </View>
      </View>
      
      <Text style={styles.recordDescription} numberOfLines={2}>
        {record.description}
      </Text>
      
      <View style={styles.recordFooter}>
        <Text style={styles.recordVet}>{record.vetName}</Text>
        <Text style={styles.recordClinic}>{record.clinicName}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecordDetailModal = () => {
    if (!selectedRecord) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!selectedRecord}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setSelectedRecord(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedRecord.title}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.recordDetailHeader}>
              <View style={[
                styles.recordTypeIconLarge,
                { backgroundColor: recordTypeColors[selectedRecord.type] }
              ]}>
                <Ionicons 
                  name={recordTypeIcons[selectedRecord.type] as any} 
                  size={32} 
                  color="#FFF" 
                />
              </View>
              <Text style={styles.recordDetailDate}>{formatDate(selectedRecord.date)}</Text>
              <Text style={styles.recordDetailVet}>{selectedRecord.vetName}</Text>
              <Text style={styles.recordDetailClinic}>{selectedRecord.clinicName}</Text>
            </View>

            <View style={styles.recordDetailSection}>
              <Text style={styles.recordDetailSectionTitle}>Descripción</Text>
              <Text style={styles.recordDetailText}>{selectedRecord.description}</Text>
            </View>

            {selectedRecord.medications && selectedRecord.medications.length > 0 && (
              <View style={styles.recordDetailSection}>
                <Text style={styles.recordDetailSectionTitle}>Medicamentos</Text>
                {selectedRecord.medications.map((medication) => (
                  <View key={medication.id} style={styles.medicationCard}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDetails}>
                      {medication.dosage} • {medication.frequency} • {medication.duration}
                    </Text>
                    <Text style={styles.medicationInstructions}>
                      {medication.instructions}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {selectedRecord.images.length > 0 && (
              <View style={styles.recordDetailSection}>
                <Text style={styles.recordDetailSectionTitle}>Imágenes</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.imagesContainer}>
                    {selectedRecord.images.map((imageUri, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.imageThumb}
                        onPress={() => openImageModal(imageUri)}
                      >
                        <Image source={{ uri: imageUri }} style={styles.imageThumbImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {selectedRecord.notes && (
              <View style={styles.recordDetailSection}>
                <Text style={styles.recordDetailSectionTitle}>Notas</Text>
                <Text style={styles.recordDetailText}>{selectedRecord.notes}</Text>
              </View>
            )}

            {selectedRecord.nextAppointment && (
              <View style={styles.nextAppointmentCard}>
                <Ionicons name="calendar-outline" size={20} color="#4ECDC4" />
                <Text style={styles.nextAppointmentText}>
                  Próxima cita: {formatDate(selectedRecord.nextAppointment)}
                </Text>
              </View>
            )}

            <View style={styles.safetySpace} />
          </ScrollView>
        </View>
      </Modal>
    );
  };

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
          <Text style={styles.headerTitle}>Historial Médico</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('UploadResults', {
              petId,
              petName,
              ownerName
            })}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Pet Info Card */}
        <View style={styles.petInfoCard}>
          <ImageUpload
            currentImage={petImage}
            onImageSelected={handlePetImageUpload}
            placeholder="Foto"
            size="small"
            shape="circle"
            uploadOptions={{
              maxWidth: 256,
              maxHeight: 256,
              quality: 0.8,
              aspect: [1, 1],
              allowsEditing: true
            }}
          />
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{petName}</Text>
            <Text style={styles.petDetails}>{petType} • {ownerName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Vital Signs */}
        {renderVitalSignsCard()}

        {/* Records */}
        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>Historial de Consultas</Text>
          {records.length > 0 ? (
            records.map(record => renderRecordCard(record))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No hay registros médicos</Text>
              <Text style={styles.emptyStateSubtext}>
                Los registros aparecerán aquí cuando se agreguen
              </Text>
            </View>
          )}
        </View>

        <View style={styles.safetySpace} />
      </ScrollView>

      {/* Record Detail Modal */}
      {renderRecordDetailModal()}

      {/* Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.imageModalImage} />
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
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  vitalSignsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  vitalSignsDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  vitalSignsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vitalSignItem: {
    alignItems: 'center',
    flex: 1,
  },
  vitalSignValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginTop: 8,
    marginBottom: 4,
  },
  vitalSignLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recordsSection: {
    marginBottom: 24,
  },
  recordCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordHeaderText: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  imagesBadgeText: {
    fontSize: 10,
    color: '#666',
  },
  recordDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  recordFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    gap: 2,
  },
  recordVet: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  recordClinic: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  recordDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordTypeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordDetailDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  recordDetailVet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 2,
  },
  recordDetailClinic: {
    fontSize: 12,
    color: '#999',
  },
  recordDetailSection: {
    marginBottom: 24,
  },
  recordDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  recordDetailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  medicationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageThumbImage: {
    width: '100%',
    height: '100%',
  },
  nextAppointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  nextAppointmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: width - 32,
    height: width - 32,
    resizeMode: 'contain',
  },
  safetySpace: {
    height: 100,
  },
});

export default MedicalHistoryScreen;