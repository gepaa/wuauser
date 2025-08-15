import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Image,
  Share,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import { colors } from '../constants/colors';
import { petService, PetData, VaccinationRecord, MedicalRecord } from '../services/petService';

const { width } = Dimensions.get('window');

interface PetDetailScreenProps {
  navigation: any;
  route: {
    params: {
      petId: string;
      petData?: PetData;
    };
  };
}

export const PetDetailScreen: React.FC<PetDetailScreenProps> = ({ navigation, route }) => {
  const { petId, petData: initialPetData } = route.params;
  
  const [petData, setPetData] = useState<PetData | null>(initialPetData || null);
  const [activeTab, setActiveTab] = useState<'info' | 'qr' | 'medical' | 'gallery'>('info');
  const [isLoading, setIsLoading] = useState(!initialPetData);
  const [refreshing, setRefreshing] = useState(false);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [qrRef, setQrRef] = useState<ViewShot | null>(null);

  useEffect(() => {
    if (!initialPetData) {
      loadPetData();
    }
    loadMedicalData();
  }, []);

  const loadPetData = async () => {
    try {
      const result = await petService.getPetById(petId);
      if (result.data) {
        setPetData(result.data);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMedicalData = async () => {
    try {
      const [vaccinationResult, medicalResult] = await Promise.all([
        petService.getPetVaccinations(petId),
        petService.getPetMedicalRecords(petId)
      ]);

      if (vaccinationResult.data) {
        setVaccinations(vaccinationResult.data);
      }

      if (medicalResult.data) {
        setMedicalRecords(medicalResult.data);
      }
    } catch (error) {
      console.error('Error loading medical data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPetData(), loadMedicalData()]);
    setRefreshing(false);
  }, []);

  const handleEdit = () => {
    navigation.navigate('AddPet', {
      editMode: true,
      petData: petData,
    });
  };

  const handleShareQR = async () => {
    if (!petData?.qr_id) return;

    try {
      const qrUrl = `https://wuauser.com/pet/${petData.qr_id}`;
      await Share.share({
        message: `¡Ayuda a ${petData.nombre} a volver a casa! Escanea este código QR: ${qrUrl}`,
        url: qrUrl,
        title: `Código QR de ${petData.nombre}`,
      });
    } catch (error) {
      console.error('Error sharing QR:', error);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrRef || !petData) return;

    try {
      const hasPermission = await MediaLibrary.requestPermissionsAsync();
      if (!hasPermission.granted) {
        Alert.alert('Permisos', 'Se necesitan permisos para guardar la imagen');
        return;
      }

      const uri = await qrRef.capture();
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Wuauser QR', asset, false);
      
      Alert.alert(
        '¡Guardado!',
        `El código QR de ${petData.nombre} se guardó en tu galería.`
      );
    } catch (error) {
      console.error('Error downloading QR:', error);
      Alert.alert('Error', 'No se pudo guardar el código QR');
    }
  };

  const calculateAge = (birthDate: string): string => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${Math.abs(months)} mes${Math.abs(months) !== 1 ? 'es' : ''}`;
    } else if (years === 1 && months < 0) {
      return `${12 + months} mes${12 + months !== 1 ? 'es' : ''}`;
    } else {
      return `${years} año${years !== 1 ? 's' : ''}`;
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'info' && styles.activeTab]}
        onPress={() => setActiveTab('info')}
      >
        <Ionicons 
          name="information-circle-outline" 
          size={20} 
          color={activeTab === 'info' ? colors.primary : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
          Info
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
        onPress={() => setActiveTab('qr')}
      >
        <Ionicons 
          name="qr-code-outline" 
          size={20} 
          color={activeTab === 'qr' ? colors.primary : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
          QR
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'medical' && styles.activeTab]}
        onPress={() => setActiveTab('medical')}
      >
        <Ionicons 
          name="medical-outline" 
          size={20} 
          color={activeTab === 'medical' ? colors.primary : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'medical' && styles.activeTabText]}>
          Médico
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
        onPress={() => setActiveTab('gallery')}
      >
        <Ionicons 
          name="images-outline" 
          size={20} 
          color={activeTab === 'gallery' ? colors.primary : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>
          Galería
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="paw" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Especie</Text>
            <Text style={styles.infoValue}>{petData?.especie}</Text>
          </View>
        </View>

        {petData?.raza && (
          <View style={styles.infoRow}>
            <Ionicons name="library-outline" size={20} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Raza</Text>
              <Text style={styles.infoValue}>{petData.raza}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name={petData?.sexo === 'Macho' ? 'male' : 'female'} size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>{petData?.sexo}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Edad</Text>
            <Text style={styles.infoValue}>
              {petData?.fecha_nacimiento ? calculateAge(petData.fecha_nacimiento) : 'No especificada'}
            </Text>
          </View>
        </View>

        {petData?.color_señas && (
          <View style={styles.infoRow}>
            <Ionicons name="color-palette" size={20} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Color y señas</Text>
              <Text style={styles.infoValue}>{petData.color_señas}</Text>
            </View>
          </View>
        )}

        {petData?.chip_numero && (
          <View style={styles.infoRow}>
            <Ionicons name="radio" size={20} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Microchip</Text>
              <Text style={styles.infoValue}>{petData.chip_numero}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="medical" size={20} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Esterilizado</Text>
            <Text style={styles.infoValue}>{petData?.esterilizado ? 'Sí' : 'No'}</Text>
          </View>
        </View>

        {petData?.alergias_condiciones && (
          <View style={styles.infoRow}>
            <Ionicons name="warning" size={20} color="#FF9800" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Alergias/Condiciones</Text>
              <Text style={styles.infoValue}>{petData.alergias_condiciones}</Text>
            </View>
          </View>
        )}

        {petData?.veterinario_cabecera && (
          <View style={styles.infoRow}>
            <Ionicons name="person-circle" size={20} color={colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Veterinario</Text>
              <Text style={styles.infoValue}>{petData.veterinario_cabecera}</Text>
            </View>
          </View>
        )}
      </View>

      {petData?.vacunas && petData.vacunas.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Vacunas</Text>
          <View style={styles.vaccinesGrid}>
            {petData.vacunas.map((vaccine, index) => (
              <View key={index} style={styles.vaccineChip}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.vaccineText}>{vaccine}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderQRTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Código QR de {petData?.nombre}</Text>
      
      <ViewShot ref={setQrRef} style={styles.qrContainer}>
        <View style={styles.qrCard}>
          {petData?.qr_id && (
            <View style={{ width: 250, height: 250, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}>
              <Ionicons name="qr-code-outline" size={100} color="#ccc" />
              <Text style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>QR Code</Text>
            </View>
          )}
          
          <View style={styles.qrInfo}>
            <Text style={styles.qrPetName}>{petData?.nombre}</Text>
            <Text style={styles.qrPetInfo}>
              {petData?.especie} • {petData?.raza}
            </Text>
            <Text style={styles.qrMessage}>
              ¡Ayúdame a volver a casa!
            </Text>
          </View>
        </View>
      </ViewShot>

      <View style={styles.qrActions}>
        <TouchableOpacity style={styles.qrActionButton} onPress={handleShareQR}>
          <LinearGradient
            colors={['#4ECDC4', '#95E1D3']}
            style={styles.qrActionGradient}
          >
            <Ionicons name="share-outline" size={24} color="#FFF" />
          </LinearGradient>
          <Text style={styles.qrActionText}>Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qrActionButton} onPress={handleDownloadQR}>
          <LinearGradient
            colors={['#F4B740', '#FFD54F']}
            style={styles.qrActionGradient}
          >
            <Ionicons name="download-outline" size={24} color="#FFF" />
          </LinearGradient>
          <Text style={styles.qrActionText}>Descargar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.qrInstructions}>
        <Text style={styles.instructionsTitle}>¿Cómo usar el código QR?</Text>
        
        <View style={styles.instructionItem}>
          <Ionicons name="print-outline" size={20} color="#666" />
          <Text style={styles.instructionText}>
            Imprime el código QR y pégalo en el collar de {petData?.nombre}
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <Ionicons name="qr-code-outline" size={20} color="#666" />
          <Text style={styles.instructionText}>
            Cualquiera puede escanear el código si {petData?.nombre} se pierde
          </Text>
        </View>

        <View style={styles.instructionItem}>
          <Ionicons name="notifications-outline" size={20} color="#666" />
          <Text style={styles.instructionText}>
            Recibirás una notificación automática cuando sea escaneado
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMedicalTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Historial Médico</Text>
      
      {/* Vaccinations Section */}
      <View style={styles.medicalSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vacunas</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {vaccinations.length > 0 ? (
          vaccinations.map((vaccination) => (
            <View key={vaccination.id} style={styles.medicalRecord}>
              <View style={styles.recordIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              </View>
              <View style={styles.recordContent}>
                <Text style={styles.recordTitle}>{vaccination.vaccine_name}</Text>
                <Text style={styles.recordDate}>
                  Aplicada: {new Date(vaccination.date_administered).toLocaleDateString('es-MX')}
                </Text>
                {vaccination.next_due_date && (
                  <Text style={styles.recordNextDue}>
                    Próxima: {new Date(vaccination.next_due_date).toLocaleDateString('es-MX')}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={40} color="#DDD" />
            <Text style={styles.emptyText}>No hay vacunas registradas</Text>
          </View>
        )}
      </View>

      {/* Medical Records Section */}
      <View style={styles.medicalSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consultas Veterinarias</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {medicalRecords.length > 0 ? (
          medicalRecords.map((record) => (
            <View key={record.id} style={styles.medicalRecord}>
              <View style={styles.recordIcon}>
                <Ionicons name="document-text" size={20} color="#2196F3" />
              </View>
              <View style={styles.recordContent}>
                <Text style={styles.recordTitle}>{record.reason}</Text>
                <Text style={styles.recordDate}>
                  {new Date(record.visit_date).toLocaleDateString('es-MX')}
                </Text>
                <Text style={styles.recordVet}>Dr. {record.veterinarian}</Text>
                {record.diagnosis && (
                  <Text style={styles.recordDiagnosis}>{record.diagnosis}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color="#DDD" />
            <Text style={styles.emptyText}>No hay consultas registradas</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderGalleryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Galería de {petData?.nombre}</Text>
      
      <View style={styles.gallery}>
        {/* Main photo */}
        {petData?.foto_url && (
          <TouchableOpacity style={styles.mainPhoto}>
            <Image source={{ uri: petData.foto_url }} style={styles.mainPhotoImage} />
          </TouchableOpacity>
        )}
        
        {/* Add photos placeholder */}
        <View style={styles.galleryGrid}>
          <TouchableOpacity style={styles.addPhotoButton}>
            <Ionicons name="camera-outline" size={30} color="#999" />
            <Text style={styles.addPhotoText}>Agregar Fotos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addPhotoButton}>
            <Ionicons name="images-outline" size={30} color="#999" />
            <Text style={styles.addPhotoText}>Desde Galería</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.galleryHint}>
          Agrega más fotos de {petData?.nombre} para ayudar a identificarla mejor
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando mascota...</Text>
      </View>
    );
  }

  if (!petData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={60} color="#FF9800" />
        <Text style={styles.errorText}>No se pudo cargar la información de la mascota</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPetData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          
          <View style={styles.petHeaderInfo}>
            <TouchableOpacity style={styles.petPhotoContainer}>
              {petData.foto_url ? (
                <Image source={{ uri: petData.foto_url }} style={styles.petHeaderPhoto} />
              ) : (
                <View style={styles.petPhotoPlaceholder}>
                  <Ionicons name="paw" size={30} color="#999" />
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.petHeaderText}>
              <Text style={styles.petName}>{petData.nombre}</Text>
              <Text style={styles.petSubtitle}>
                {petData.especie} • {petData.raza || 'Sin raza específica'}
              </Text>
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {renderTabBar()}
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'qr' && renderQRTab()}
        {activeTab === 'medical' && renderMedicalTab()}
        {activeTab === 'gallery' && renderGalleryTab()}
      </ScrollView>

      {/* Floating Edit Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleEdit}>
        <LinearGradient
          colors={['#4ECDC4', '#95E1D3']}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="create" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  petHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  petPhotoContainer: {
    marginRight: 12,
  },
  petHeaderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  petPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petHeaderText: {
    flex: 1,
  },
  petName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  petSubtitle: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  vaccinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vaccineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  vaccineText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  qrPetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  qrPetInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  qrMessage: {
    fontSize: 16,
    color: '#F4B740',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  qrActionButton: {
    alignItems: 'center',
  },
  qrActionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  qrInstructions: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#4A4A4A',
    flex: 1,
    lineHeight: 20,
  },
  medicalSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicalRecord: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  recordNextDue: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  recordVet: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 2,
  },
  recordDiagnosis: {
    fontSize: 12,
    color: '#4A4A4A',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  gallery: {
    alignItems: 'center',
  },
  mainPhoto: {
    marginBottom: 20,
  },
  mainPhotoImage: {
    width: width - 80,
    height: width - 80,
    borderRadius: 12,
  },
  galleryGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  addPhotoButton: {
    width: (width - 80) / 2,
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  galleryHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PetDetailScreen;