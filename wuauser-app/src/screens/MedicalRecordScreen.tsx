import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { MedicalRecord, MedicalRecordStats, MedicalRecordSummary } from '../types/medicalRecord';
import medicalRecordService from '../services/medicalRecordService';
import roleService from '../services/roleService';

const { width } = Dimensions.get('window');

interface MedicalRecordScreenProps {
  navigation: any;
  route: {
    params: {
      petId: string;
      petName: string;
      petAge?: string;
      petBreed?: string;
      chipId?: string;
    };
  };
}

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

const getRecordTypeIcon = (type: string) => {
  const icons = {
    consulta: 'medical-outline',
    vacuna: 'shield-checkmark-outline',
    cirugia: 'cut-outline',
    emergencia: 'warning-outline',
    laboratorio: 'flask-outline',
    revision: 'checkmark-circle-outline'
  };
  return icons[type as keyof typeof icons] || 'document-outline';
};

export const MedicalRecordScreen: React.FC<MedicalRecordScreenProps> = ({ navigation, route }) => {
  const { petId, petName, petAge, petBreed, chipId } = route.params;
  const [activeTab, setActiveTab] = useState('historial');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [recordStats, setRecordStats] = useState<MedicalRecordStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentRole, setCurrentRole] = useState(roleService.getCurrentRole());

  useEffect(() => {
    loadMedicalData();
    
    // Subscribe to role changes
    const unsubscribe = roleService.subscribe((newRole) => {
      setCurrentRole(newRole);
    });

    return unsubscribe;
  }, [petId]);

  const loadMedicalData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize service if needed
      await medicalRecordService.initialize();
      
      // Load records and stats
      const [records, stats] = await Promise.all([
        medicalRecordService.getRecordsByPet(petId),
        medicalRecordService.getRecordStats(petId)
      ]);
      
      setMedicalRecords(records);
      setRecordStats(stats);
    } catch (error) {
      console.error('Error loading medical data:', error);
      Alert.alert('Error', 'No se pudieron cargar los expedientes médicos');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMedicalData();
    setRefreshing(false);
  }, [petId]);

  const handleAddRecord = () => {
    navigation.navigate('AddMedicalRecord', { petId, petName });
  };

  const handleShareRecord = () => {
    Alert.alert(
      'Compartir Expediente',
      '¿Deseas compartir el expediente médico completo con un veterinario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Compartir', 
          onPress: () => {
            Alert.alert('Próximamente', 'La función de compartir estará disponible pronto.');
          }
        }
      ]
    );
  };

  const handleRecordPress = (record: MedicalRecord) => {
    navigation.navigate('MedicalRecordDetail', { recordId: record.id });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderPetHeader = () => (
    <View style={styles.petHeader}>
      <View style={styles.petInfo}>
        <View style={styles.petAvatarContainer}>
          <Ionicons name="paw" size={40} color="#FFF" />
        </View>
        <View style={styles.petDetails}>
          <Text style={styles.petName}>{petName}</Text>
          {petAge && <Text style={styles.petAge}>{petAge}</Text>}
          {petBreed && <Text style={styles.petBreed}>{petBreed}</Text>}
          {chipId && (
            <View style={styles.chipContainer}>
              <Ionicons name="radio" size={14} color="#666" />
              <Text style={styles.chipId}>Chip: {chipId}</Text>
            </View>
          )}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => Alert.alert('Próximamente', 'Información completa de la mascota.')}
      >
        <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  const renderStatsCards = () => {
    if (!recordStats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E8F4FD' }]}>
            <Text style={styles.statNumber}>{recordStats.totalRecords}</Text>
            <Text style={styles.statLabel}>Registros</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.statNumber}>{recordStats.pendingPrescriptions}</Text>
            <Text style={styles.statLabel}>Medicamentos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E8' }]}>
            <Text style={styles.statNumber}>{recordStats.upcomingVaccines}</Text>
            <Text style={styles.statLabel}>Vacunas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'historial', label: 'Historial', icon: 'time-outline' },
        { key: 'vacunas', label: 'Vacunas', icon: 'shield-checkmark-outline' },
        { key: 'laboratorios', label: 'Laboratorios', icon: 'flask-outline' },
        { key: 'documentos', label: 'Documentos', icon: 'document-outline' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Ionicons 
            name={tab.icon as any} 
            size={20} 
            color={activeTab === tab.key ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHistorialTab = () => {
    const historialRecords = medicalRecords.filter(record => 
      activeTab === 'historial' || 
      (activeTab === 'vacunas' && record.type === 'vacuna') ||
      (activeTab === 'laboratorios' && record.type === 'laboratorio')
    );

    if (historialRecords.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Sin registros</Text>
          <Text style={styles.emptyMessage}>
            {activeTab === 'historial' && 'No hay registros médicos aún'}
            {activeTab === 'vacunas' && 'No hay vacunas registradas'}
            {activeTab === 'laboratorios' && 'No hay resultados de laboratorio'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        {historialRecords.map((record, index) => (
          <TouchableOpacity
            key={record.id}
            style={styles.timelineItem}
            onPress={() => handleRecordPress(record)}
          >
            <View style={styles.timelineDot}>
              <View style={[styles.dot, { backgroundColor: getRecordTypeColor(record.type) }]} />
              {index < historialRecords.length - 1 && <View style={styles.line} />}
            </View>
            
            <View style={styles.timelineContent}>
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    <View style={styles.recordTypeContainer}>
                      <Ionicons 
                        name={getRecordTypeIcon(record.type) as any} 
                        size={16} 
                        color={getRecordTypeColor(record.type)} 
                      />
                      <Text style={[styles.recordType, { color: getRecordTypeColor(record.type) }]}>
                        {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {record.followUp?.scheduled && (
                    <View style={styles.followUpBadge}>
                      <Ionicons name="calendar" size={12} color="#FF9800" />
                    </View>
                  )}
                </View>
                
                <Text style={styles.vetName}>{record.vetName} - {record.clinicName}</Text>
                <Text style={styles.diagnosis}>{record.diagnosis || record.reason}</Text>
                
                {record.prescriptions && record.prescriptions.length > 0 && (
                  <View style={styles.prescriptionIndicator}>
                    <Ionicons name="medical" size={12} color="#4CAF50" />
                    <Text style={styles.prescriptionText}>
                      {record.prescriptions.length} medicamento{record.prescriptions.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                
                <View style={styles.recordFooter}>
                  <Text style={styles.viewDetails}>Ver detalles →</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDocumentosTab = () => {
    const recordsWithAttachments = medicalRecords.filter(record => 
      record.attachments && record.attachments.length > 0
    );

    if (recordsWithAttachments.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Sin documentos</Text>
          <Text style={styles.emptyMessage}>
            No hay documentos adjuntos en el expediente
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.documentsContainer}>
        {recordsWithAttachments.map(record => (
          <View key={record.id} style={styles.documentGroup}>
            <Text style={styles.documentGroupTitle}>
              {formatDate(record.date)} - {record.vetName}
            </Text>
            {record.attachments.map(attachment => (
              <TouchableOpacity key={attachment.id} style={styles.documentItem}>
                <Ionicons name="document-text-outline" size={24} color="#2196F3" />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{attachment.name}</Text>
                  <Text style={styles.documentType}>{attachment.type}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'historial':
      case 'vacunas':
      case 'laboratorios':
        return renderHistorialTab();
      case 'documentos':
        return renderDocumentosTab();
      default:
        return renderHistorialTab();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando expediente...</Text>
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
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expediente Médico</Text>
          <View style={styles.placeholder} />
        </View>
        
        {renderPetHeader()}
        {renderStatsCards()}
      </LinearGradient>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
        <View style={styles.safetySpace} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={currentRole === 'veterinario' ? handleAddRecord : handleShareRecord}
      >
        <Ionicons 
          name={currentRole === 'veterinario' ? 'add' : 'share-outline'} 
          size={24} 
          color="#FFF" 
        />
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
    color: Colors.text.secondary,
    marginTop: 12,
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
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  placeholder: {
    width: 40,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  petAge: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipId: {
    fontSize: 12,
    color: '#666',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
  },
  recordCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  recordTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordType: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  followUpBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vetName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  diagnosis: {
    fontSize: 16,
    color: '#2A2A2A',
    marginBottom: 12,
    lineHeight: 22,
  },
  prescriptionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  prescriptionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  recordFooter: {
    alignItems: 'flex-end',
  },
  viewDetails: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  documentsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  documentGroup: {
    marginBottom: 24,
  },
  documentGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  safetySpace: {
    height: 100,
  },
});

export default MedicalRecordScreen;