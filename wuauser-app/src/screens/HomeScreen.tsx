import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/colors';
import { authService, dbService, supabase } from '../services/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import roleService from '../services/roleService';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

interface UserData {
  nombre_completo: string;
  email: string;
  tipo_usuario: string;
}

interface Pet {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  foto_url?: string;
}

const petTips = [
  {
    id: 1,
    title: "Hidratación Diaria",
    description: "Tu mascota necesita agua fresca disponible 24/7. Cambia el agua todos los días y asegúrate de que el recipiente esté siempre limpio.",
    icon: "water-outline",
    color: "#4ECDC4"
  },
  {
    id: 2,
    title: "Calendario de Vacunas",
    description: "Las vacunas previenen enfermedades graves. Mantén un calendario actualizado y consulta con tu veterinario sobre refuerzos anuales.",
    icon: "medical-outline",
    color: "#E85D4E"
  },
  {
    id: 3,
    title: "Ejercicio Según la Edad",
    description: "Los cachorros necesitan juegos cortos, los adultos 30-60 min diarios, y los seniors ejercicio suave pero constante.",
    icon: "walk-outline",
    color: "#F4B740"
  },
  {
    id: 4,
    title: "Higiene Dental",
    description: "Cepilla los dientes de tu mascota 2-3 veces por semana. El 80% de perros mayores de 3 años tienen problemas dentales.",
    icon: "medical-outline",
    color: "#9C27B0"
  },
  {
    id: 5,
    title: "Alimentación Balanceada",
    description: "Usa alimento de calidad apropiado para la edad. Evita chocolate, uvas, cebolla y otros alimentos tóxicos para mascotas.",
    icon: "nutrition-outline",
    color: "#FF9800"
  },
  {
    id: 6,
    title: "Revisiones Preventivas",
    description: "Visita al veterinario cada 6-12 meses para chequeos. La detección temprana puede salvar vidas y ahorrar dinero.",
    icon: "heart-outline",
    color: "#E91E63"
  }
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { profile, loading } = useUserProfile();
  const [pets, setPets] = useState<Pet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserPets();
  }, []);


  const loadUserPets = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Mock pets data for development
        const mockPets: Pet[] = [
          // Empty array to show "Add First Pet" card
        ];
        setPets(mockPets);
      } else {
        // In production, fetch from Supabase
        const { user } = await authService.getCurrentUser();
        if (user) {
          const { data, error } = await dbService.getUserPets(user.id);
          if (data && !error) {
            setPets(data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserPets();
    setRefreshing(false);
  }, []);

  const handleAddFirstPet = () => {
    navigation.navigate('AddPet');
  };

  const handleVeterinariansNearby = () => {
    Alert.alert(
      'Veterinarios Cerca',
      '¿Buscar veterinarios en tu área?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Buscar',
          onPress: () => {
            // TODO: Navigate to Veterinarians Map screen
            Alert.alert('Próximamente', 'El mapa de veterinarios estará disponible pronto.');
          }
        }
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergencia Veterinaria',
      'En caso de emergencia real, contacta inmediatamente:\n\n• Tu veterinario de confianza\n• Clínica veterinaria 24hrs más cercana\n• Servicios de emergencia veterinaria',
      [
        {
          text: 'Entendido',
          style: 'default'
        },
        {
          text: 'Ver Contactos',
          onPress: () => {
            Alert.alert('Próximamente', 'La lista de contactos de emergencia estará disponible pronto.');
          }
        }
      ]
    );
  };

  const handleMyQR = () => {
    if (pets.length === 0) {
      Alert.alert(
        'Sin Mascotas Registradas',
        'Primero debes agregar una mascota para generar su código QR.',
        [
          {
            text: 'OK',
            style: 'default'
          },
          {
            text: 'Agregar Mascota',
            onPress: handleAddFirstPet
          }
        ]
      );
    } else {
      Alert.alert('Próximamente', 'La función de códigos QR estará disponible pronto.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getUserFirstName = () => {
    // Usar el nombre del perfil real del hook
    const userName = profile?.nombre_completo?.split(' ')[0] || 'Usuario';
    return userName;
  };

  const handleRoleSwitch = async () => {
    const canSwitch = await roleService.canSwitchToVet();
    
    if (!canSwitch) {
      Alert.alert(
        'Acceso Denegado',
        'No tienes permisos para acceder al modo veterinario. Contacta al administrador si eres un veterinario registrado.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cambiar a Modo Veterinario',
      'Te cambiará a la vista profesional de veterinario. ¿Continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cambiar',
          onPress: async () => {
            try {
              await roleService.switchRole();
              // The TabNavigator will automatically update thanks to the subscription
            } catch (error) {
              Alert.alert('Error', 'No se pudo cambiar el rol');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with greeting */}
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.header}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {getUserFirstName()} 👋
          </Text>
          <Text style={styles.subGreetingText}>
            ¿Cómo está tu mascota hoy?
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Add First Pet Card or Pet Summary */}
        {pets.length === 0 ? (
          <TouchableOpacity 
            style={styles.addPetCard} 
            onPress={handleAddFirstPet}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4ECDC4', '#95E1D3']}
              style={styles.addPetGradient}
            >
              <View style={styles.addPetContent}>
                <View style={styles.addPetIcon}>
                  <Ionicons name="add-circle" size={48} color="#FFF" />
                </View>
                <Text style={styles.addPetTitle}>Agregar Primera Mascota</Text>
                <Text style={styles.addPetDescription}>
                  Registra a tu compañero peludo y mantén su información siempre a mano
                </Text>
                <View style={styles.addPetButton}>
                  <Text style={styles.addPetButtonText}>Comenzar</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4ECDC4" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.petsOverview}>
            <Text style={styles.sectionTitle}>Mis Mascotas</Text>
            <Text style={styles.petsSummary}>
              Tienes {pets.length} mascota{pets.length !== 1 ? 's' : ''} registrada{pets.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
          
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#E8F4FD' }]}
              onPress={handleVeterinariansNearby}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="medical" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Veterinarios</Text>
              <Text style={styles.quickAccessSubtitle}>Cerca de ti</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#FFEBEE' }]}
              onPress={handleEmergency}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#F44336' }]}>
                <Ionicons name="warning" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Emergencias</Text>
              <Text style={styles.quickAccessSubtitle}>24/7</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#F3E5F5' }]}
              onPress={handleMyQR}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="qr-code" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Mi QR</Text>
              <Text style={styles.quickAccessSubtitle}>Identificación</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickAccessButton, { backgroundColor: '#E8F5E8' }]}
              onPress={() => navigation.navigate('QRScanner')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="scan" size={24} color="#FFF" />
              </View>
              <Text style={styles.quickAccessTitle}>Escanear</Text>
              <Text style={styles.quickAccessSubtitle}>Encontré una</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet Care Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Tips de Cuidado</Text>
          
          {petTips.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
                <Ionicons name={tip.icon as any} size={20} color="#FFF" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Role Switch */}
        <TouchableOpacity style={styles.roleSwitchCard} onPress={handleRoleSwitch}>
          <View style={styles.roleSwitchContent}>
            <View style={styles.roleSwitchIcon}>
              <Ionicons name="medical" size={24} color="#2196F3" />
            </View>
            <View style={styles.roleSwitchTextContainer}>
              <Text style={styles.roleSwitchTitle}>¿Eres Veterinario?</Text>
              <Text style={styles.roleSwitchSubtitle}>Cambia al modo profesional</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#2196F3" />
          </View>
        </TouchableOpacity>

        {/* Safety Space */}
        <View style={styles.safetySpace} />
      </View>
    </ScrollView>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 30,
  },
  greetingContainer: {
    marginTop: 20,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  subGreetingText: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  addPetCard: {
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  addPetGradient: {
    padding: 24,
  },
  addPetContent: {
    alignItems: 'center',
  },
  addPetIcon: {
    marginBottom: 16,
  },
  addPetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  addPetDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  addPetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  petsOverview: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A2A2A',
    marginBottom: 20,
  },
  petsSummary: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  quickAccessContainer: {
    marginBottom: 36,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  quickAccessButton: {
    width: (width - 64) / 2,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 140,
    justifyContent: 'center',
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  quickAccessTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 6,
    textAlign: 'center',
  },
  quickAccessSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsContainer: {
    marginBottom: 36,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  roleSwitchCard: {
    marginBottom: 20,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  roleSwitchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  roleSwitchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleSwitchTextContainer: {
    flex: 1,
  },
  roleSwitchTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  roleSwitchSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  safetySpace: {
    height: 100,
  },
});

export default HomeScreen;