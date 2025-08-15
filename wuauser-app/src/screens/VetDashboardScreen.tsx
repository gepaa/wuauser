import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../constants/colors';
import { authService } from '../services/supabase';

const { width } = Dimensions.get('window');

interface VetDashboardProps {
  navigation: any;
}

interface VetData {
  nombre_completo: string;
  email: string;
}

export const VetDashboardScreen: React.FC<VetDashboardProps> = ({ navigation }) => {
  const [vetData, setVetData] = useState<VetData | null>(null);
  const [activeTab, setActiveTab] = useState('citas');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVetData();
  }, []);

  const loadVetData = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('user_email');
      
      if (savedEmail) {
        if (process.env.NODE_ENV === 'development') {
          const mockVetData: VetData = {
            nombre_completo: 'Dr. ' + savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: savedEmail
          };
          setVetData(mockVetData);
        } else {
          const { user, error } = await authService.getCurrentUser();
          if (user && !error) {
            setVetData({
              nombre_completo: user.user_metadata?.nombre_completo || 'Dr. Veterinario',
              email: user.email || ''
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading vet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVetName = () => {
    if (!vetData?.nombre_completo) return 'Doctor';
    const name = vetData.nombre_completo.replace('Dr. ', '').replace('Dra. ', '');
    return name.split(' ')[0];
  };

  const renderTabContent = () => {
    const commonMessage = (
      <View style={styles.verificationContainer}>
        <Ionicons name="time-outline" size={48} color="#FF9800" />
        <Text style={styles.verificationTitle}>Cuenta en Verificación</Text>
        <Text style={styles.verificationMessage}>
          Tu cuenta profesional está siendo revisada por nuestro equipo. 
          Recibirás una notificación una vez que sea aprobada.
        </Text>
        <Text style={styles.verificationTime}>
          Tiempo estimado: 24-48 horas
        </Text>
      </View>
    );

    return commonMessage;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#E3F2FD']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Panel Veterinario</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido, Dr. {getVetName()}
        </Text>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'citas' && styles.activeTab]}
          onPress={() => setActiveTab('citas')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={activeTab === 'citas' ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'citas' && styles.activeTabText]}>
            Citas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pacientes' && styles.activeTab]}
          onPress={() => setActiveTab('pacientes')}
        >
          <Ionicons 
            name="paw-outline" 
            size={20} 
            color={activeTab === 'pacientes' ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'pacientes' && styles.activeTabText]}>
            Pacientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'servicios' && styles.activeTab]}
          onPress={() => setActiveTab('servicios')}
        >
          <Ionicons 
            name="medical-outline" 
            size={20} 
            color={activeTab === 'servicios' ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'servicios' && styles.activeTabText]}>
            Servicios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'perfil' && styles.activeTab]}
          onPress={() => setActiveTab('perfil')}
        >
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={activeTab === 'perfil' ? '#2196F3' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'perfil' && styles.activeTabText]}>
            Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
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
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  verificationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 12,
  },
  verificationMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  verificationTime: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
});

export default VetDashboardScreen;