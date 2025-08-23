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
// ViewShot import removed - no longer needed
import { Colors } from '../constants/colors';
import { petService, PetData, VaccinationRecord, MedicalRecord } from '../services/petService';
import medicalRecordService from '../services/medicalRecordService';
import { MedicalRecordStats, MedicalRecordSummary } from '../types/medicalRecord';
import chipTrackingService from '../services/chipTrackingService';
import { ChipStatus, SafeZone } from '../types/chipTracking';

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
  const [activeTab, setActiveTab] = useState<'info' | 'collar' | 'medical' | 'gallery'>('info');
  const [isLoading, setIsLoading] = useState(!initialPetData);
  const [refreshing, setRefreshing] = useState(false);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  // Removed QR ref - no longer needed
  
  // New medical record system
  const [medicalStats, setMedicalStats] = useState<MedicalRecordStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<MedicalRecordSummary[]>([]);
  
  // Chip tracking
  const [chipStatus, setChipStatus] = useState<ChipStatus | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);

  useEffect(() => {
    if (!initialPetData) {
      loadPetData();
    }
    loadMedicalData();
    loadChipData();
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
      // Initialize new medical record service
      await medicalRecordService.initialize();
      
      // Load medical stats and recent records from new system
      const [stats, summaries] = await Promise.all([
        medicalRecordService.getRecordStats(petId),
        medicalRecordService.getRecordSummaries(petId, 3) // Last 3 records
      ]);
      
      setMedicalStats(stats);
      setRecentRecords(summaries);
      
      // Load old system data for compatibility
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

  const loadChipData = async () => {
    try {
      const status = await chipTrackingService.getChipStatus(petId);
      setChipStatus(status);
      
      const zones = await chipTrackingService.getSafeZones(petId);
      setSafeZones(zones);
    } catch (error) {
      console.error('Error loading chip data:', error);
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

  const handleShareCollar = async () => {
    if (!petData?.collar_id) return;

    try {
      const collarUrl = `https://wuauser.com/pet/${petData.collar_id}`;
      await Share.share({
        message: `¡Ayuda a ${petData.nombre} a volver a casa! Collar ID: ${petData.collar_id}`,
        url: collarUrl,
        title: `Collar GPS de ${petData.nombre}`,
      });
    } catch (error) {
      console.error('Error sharing collar:', error);
    }
  };

  // QR download function removed - no longer needed

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
          color={activeTab === 'info' ? Colors.primary : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
          Info
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'collar' && styles.activeTab]}
        onPress={() => setActiveTab('collar')}
      >
        <Ionicons 
          name="watch-outline" 
          size={20} 
          color={activeTab === 'collar' ? Colors.primary : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'collar' && styles.activeTabText]}>
          Collar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'medical' && styles.activeTab]}
        onPress={() => setActiveTab('medical')}
      >
        <Ionicons 
          name="medical-outline" 
          size={20} 
          color={activeTab === 'medical' ? Colors.primary : '#666'} 
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
          color={activeTab === 'gallery' ? Colors.primary : '#666'} 
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
          <Ionicons name="paw" size={20} color={Colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Especie</Text>
            <Text style={styles.infoValue}>{petData?.especie}</Text>
          </View>
        </View>

        {petData?.raza && (
          <View style={styles.infoRow}>
            <Ionicons name="library-outline" size={20} color={Colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Raza</Text>
              <Text style={styles.infoValue}>{petData.raza}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name={petData?.sexo === 'Macho' ? 'male' : 'female'} size={20} color={Colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Sexo</Text>
            <Text style={styles.infoValue}>{petData?.sexo}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Edad</Text>
            <Text style={styles.infoValue}>
              {petData?.fecha_nacimiento ? calculateAge(petData.fecha_nacimiento) : 'No especificada'}
            </Text>
          </View>
        </View>

        {petData?.color_señas && (
          <View style={styles.infoRow}>
            <Ionicons name="color-palette" size={20} color={Colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Color y señas</Text>
              <Text style={styles.infoValue}>{petData.color_señas}</Text>
            </View>
          </View>
        )}

        {petData?.collar_id && (
          <View style={styles.infoRow}>
            <Ionicons name="watch" size={20} color={Colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Collar GPS</Text>
              <Text style={styles.infoValue}>{petData.collar_id}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="medical" size={20} color={Colors.primary} />
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
            <Ionicons name="person-circle" size={20} color={Colors.primary} />
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

  const renderCollarTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Collar GPS de {petData?.nombre}</Text>
      
      {/* Collar GPS Section */}
      <View style={styles.collarSection}>
        {petData?.collar_id ? (
          <View style={styles.collarActive}>
            <View style={styles.collarHeader}>
              <Ionicons name="checkmark-circle" color="#4CAF50" size={32} />
              <View style={styles.collarInfo}>
                <Text style={styles.collarStatus}>Collar GPS Activo</Text>
                <Text style={styles.collarId}>ID: {petData.collar_id}</Text>
                <Text style={styles.collarSignal}>Señal: Fuerte • Última actualización: Hace 2 min</Text>
              </View>
            </View>
            
            <View style={styles.collarActions}>
              <TouchableOpacity style={styles.trackButton} onPress={() => navigation.navigate('MapScreen')}>
                <LinearGradient
                  colors={['#4ECDC4', '#95E1D3']}
                  style={styles.collarActionGradient}
                >
                  <Ionicons name="location" size={20} color="#FFF" />
                  <Text style={styles.collarActionText}>Ver en Mapa</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.configButton}>
                <LinearGradient
                  colors={['#F4B740', '#FFD54F']}
                  style={styles.collarActionGradient}
                >
                  <Ionicons name="settings" size={20} color="#FFF" />
                  <Text style={styles.collarActionText}>Configurar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <View style={styles.collarStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>Batería</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24h</Text>
                <Text style={styles.statLabel}>Tiempo activo</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>2.3km</Text>
                <Text style={styles.statLabel}>Distancia hoy</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noCollar}>
            <View style={styles.noCollarHeader}>
              <Ionicons name="alert-circle" color="#FFB800" size={32} />
              <View style={styles.collarInfo}>
                <Text style={styles.collarStatus}>Sin Collar GPS</Text>
                <Text style={styles.noCollarText}>Tu mascota aún no tiene collar Wuauser</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.addCollarButton}>
              <LinearGradient
                colors={['#F4B740', '#FFD54F']}
                style={styles.addCollarGradient}
              >
                <Ionicons name="add-circle" size={24} color="#FFF" />
                <Text style={styles.addCollarText}>Agregar Collar Wuauser</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Beneficios del collar GPS:</Text>
              <View style={styles.benefitItem}>
                <Ionicons name="location" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>Ubicación en tiempo real</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>Zonas seguras configurables</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="notifications" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>Alertas instantáneas</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="battery-half" size={16} color="#4CAF50" />
                <Text style={styles.benefitText}>7 días de batería</Text>
              </View>
            </View>
          </View>
        )}
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

  const handleViewMedicalRecord = () => {
    navigation.navigate('MedicalRecord', {
      petId,
      petName: petData?.nombre || 'Mascota',
      petAge: petData?.fecha_nacimiento ? calculateAge(petData.fecha_nacimiento) : undefined,
      petBreed: petData?.raza,
      collarId: petData?.collar_id
    });
  };

  const formatRecordDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRecordTypeColor = (type: string) => {
    const colors = {
      consulta: '#2196F3',
      vacuna: '#4CAF50',
      cirugia: '#FF9800',
      emergencia: '#F44336',
      laboratorio: '#9C27B0',
      revision: '#00BCD4'
    };
    return colors[type as keyof typeof colors] || '#757575';
  };

  const getChipStatusColor = (status: ChipStatus['status']) => {
    const colors = {
      active: '#4CAF50',
      inactive: '#FF9800',
      low_battery: '#FF9800',
      no_signal: '#F44336',
      offline: '#999'
    };
    return colors[status] || '#999';
  };

  const getChipStatusText = (status: ChipStatus['status']) => {
    const texts = {
      active: 'Activo',
      inactive: 'Inactivo',
      low_battery: 'Batería baja',
      no_signal: 'Sin señal',
      offline: 'Desconectado'
    };
    return texts[status] || 'Desconocido';
  };

  const handleConfigureSafeZone = () => {
    Alert.alert(
      'Configurar Zona Segura',
      'Esta funcionalidad permitirá definir áreas geográficas seguras para tu mascota.',
      [
        { text: 'Cancelar' },
        { text: 'Próximamente', style: 'default' }
      ]
    );
  };

  const renderMedicalTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Historial Médico</Text>
      
      {/* New Medical Record System Card */}
      <TouchableOpacity style={styles.medicalRecordCard} onPress={handleViewMedicalRecord}>
        <View style={styles.medicalRecordHeader}>
          <View style={styles.medicalRecordTitle}>
            <Ionicons name="document-text" size={24} color="#2196F3" />
            <Text style={styles.medicalRecordTitleText}>Expediente Médico Completo</Text>
          </View>
          <View style={styles.medicalRecordBadge}>
            <Text style={styles.medicalRecordBadgeText}>
              {medicalStats?.totalRecords || 0} registros
            </Text>
          </View>
        </View>
        
        {medicalStats && (
          <View style={styles.medicalStatsRow}>
            <View style={styles.medicalStatItem}>
              <Text style={styles.medicalStatNumber}>{medicalStats.pendingPrescriptions}</Text>
              <Text style={styles.medicalStatLabel}>Medicamentos</Text>
            </View>
            <View style={styles.medicalStatItem}>
              <Text style={styles.medicalStatNumber}>{medicalStats.upcomingVaccines}</Text>
              <Text style={styles.medicalStatLabel}>Vacunas pendientes</Text>
            </View>
            <View style={styles.medicalStatItem}>
              <Text style={styles.medicalStatNumber}>
                {medicalStats.lastVisit ? formatRecordDate(medicalStats.lastVisit).split(' ')[0] : '--'}
              </Text>
              <Text style={styles.medicalStatLabel}>Última visita</Text>
            </View>
          </View>
        )}
        
        {recentRecords.length > 0 && (
          <View style={styles.recentRecordsSection}>
            <Text style={styles.recentRecordsTitle}>Registros recientes:</Text>
            {recentRecords.slice(0, 2).map((record) => (
              <View key={record.id} style={styles.recentRecordItem}>
                <View style={[styles.recordTypeDot, { backgroundColor: getRecordTypeColor(record.type) }]} />
                <Text style={styles.recentRecordText}>
                  {formatRecordDate(record.date)} - {record.diagnosis}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.medicalRecordFooter}>
          <Text style={styles.viewCompleteText}>Ver expediente completo →</Text>
        </View>
      </TouchableOpacity>

      {/* Chip Tracking Section */}
      {chipStatus && (
        <View style={styles.chipTrackingCard}>
          <View style={styles.chipTrackingHeader}>
            <View style={styles.chipTrackingTitle}>
              <Ionicons name="location" size={24} color={getChipStatusColor(chipStatus.status)} />
              <Text style={styles.chipTrackingTitleText}>Chip Wuauser</Text>
            </View>
            <View style={[styles.chipStatusBadge, { backgroundColor: getChipStatusColor(chipStatus.status) }]}>
              <Text style={styles.chipStatusText}>{getChipStatusText(chipStatus.status)}</Text>
            </View>
          </View>
          
          <View style={styles.chipStatsRow}>
            <View style={styles.chipStatItem}>
              <Text style={styles.chipStatNumber}>{chipStatus.batteryLevel}%</Text>
              <Text style={styles.chipStatLabel}>Batería</Text>
            </View>
            <View style={styles.chipStatItem}>
              <Text style={styles.chipStatNumber}>{chipStatus.signalStrength}</Text>
              <Text style={styles.chipStatLabel}>Señal</Text>
            </View>
            <View style={styles.chipStatItem}>
              <Text style={styles.chipStatNumber}>{chipStatus.isInSafeZone ? 'Sí' : 'No'}</Text>
              <Text style={styles.chipStatLabel}>En zona segura</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.locationAlert} onPress={handleConfigureSafeZone}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <View style={styles.locationAlertContent}>
              <Text style={styles.locationAlertTitle}>Configurar zona segura</Text>
              <Text style={styles.locationAlertSubtitle}>
                Recibe alertas si sale del área ({safeZones.length} configuradas)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Vaccinations Section */}
      <View style={styles.medicalSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vacunas</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={16} color={Colors.primary} />
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
            <Ionicons name="add" size={16} color={Colors.primary} />
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
        {activeTab === 'collar' && renderCollarTab()}
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
    backgroundColor: Colors.primary,
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
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
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
  // New Medical Record Card Styles
  medicalRecordCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.1)',
  },
  medicalRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicalRecordTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medicalRecordTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  medicalRecordBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  medicalRecordBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  medicalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  medicalStatItem: {
    alignItems: 'center',
  },
  medicalStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  medicalStatLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  recentRecordsSection: {
    marginBottom: 12,
  },
  recentRecordsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  recentRecordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 8,
  },
  recordTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  recentRecordText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  medicalRecordFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  viewCompleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  // Chip Tracking Card Styles
  chipTrackingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  chipTrackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipTrackingTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipTrackingTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
    marginLeft: 8,
  },
  chipStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  chipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  chipStatItem: {
    alignItems: 'center',
  },
  chipStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  chipStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  locationAlertContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  locationAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  locationAlertSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Collar GPS Styles
  collarSection: {
    marginTop: 16,
  },
  collarActive: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  collarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  collarInfo: {
    flex: 1,
    marginLeft: 12,
  },
  collarStatus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  collarId: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  collarSignal: {
    fontSize: 12,
    color: '#666',
  },
  collarActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  trackButton: {
    flex: 1,
  },
  configButton: {
    flex: 1,
  },
  collarActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  collarActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  collarStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noCollar: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFB800',
  },
  noCollarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  noCollarText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addCollarButton: {
    marginBottom: 20,
  },
  addCollarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addCollarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#4A4A4A',
  },
});

export default PetDetailScreen;