import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { authService, dbService } from '../services/supabase';

interface MyPetsScreenProps {
  navigation: any;
}

interface Pet {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  edad?: number;
  foto_url?: string;
  qr_code?: string;
}

export const MyPetsScreen: React.FC<MyPetsScreenProps> = ({ navigation }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Mock pets data for development
        const mockPets: Pet[] = [
          // Empty for now to show empty state
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
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  }, []);

  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  const handlePetDetails = (pet: Pet) => {
    navigation.navigate('PetDetail', {
      petId: pet.id,
      petData: pet,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando mascotas...</Text>
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
        <Text style={styles.headerTitle}>Mis Mascotas</Text>
        <Text style={styles.headerSubtitle}>
          {pets.length === 0 
            ? 'Aún no tienes mascotas registradas' 
            : `${pets.length} mascota${pets.length !== 1 ? 's' : ''} registrada${pets.length !== 1 ? 's' : ''}`
          }
        </Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {pets.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="paw-outline" size={80} color="#DDD" />
            </View>
            <Text style={styles.emptyTitle}>Sin Mascotas Registradas</Text>
            <Text style={styles.emptyDescription}>
              Agrega a tu primer compañero peludo para comenzar a usar todas las funciones de Wuauser
            </Text>
            
            <TouchableOpacity style={styles.addFirstPetButton} onPress={handleAddPet}>
              <LinearGradient
                colors={['#4ECDC4', '#95E1D3']}
                style={styles.addFirstPetGradient}
              >
                <Ionicons name="add-circle" size={24} color="#FFF" />
                <Text style={styles.addFirstPetText}>Agregar Primera Mascota</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>¿Por qué registrar a tu mascota?</Text>
              
              <View style={styles.benefitItem}>
                <Ionicons name="qr-code" size={20} color="#F4B740" />
                <Text style={styles.benefitText}>Código QR único para identificación</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="medical" size={20} color="#E85D4E" />
                <Text style={styles.benefitText}>Historial médico siempre disponible</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="location" size={20} color="#4ECDC4" />
                <Text style={styles.benefitText}>Ayuda para encontrarla si se pierde</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="people" size={20} color="#95E1D3" />
                <Text style={styles.benefitText}>Conexión con veterinarios cercanos</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Pets List */
          <View style={styles.petsContainer}>
            {pets.map((pet) => (
              <TouchableOpacity 
                key={pet.id} 
                style={styles.petCard}
                onPress={() => handlePetDetails(pet)}
              >
                <View style={styles.petAvatar}>
                  {pet.foto_url ? (
                    // TODO: Add Image component when photos are implemented
                    <Ionicons name="image" size={40} color="#999" />
                  ) : (
                    <Ionicons name="paw" size={40} color="#F4B740" />
                  )}
                </View>
                
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.nombre}</Text>
                  <Text style={styles.petDetails}>
                    {pet.especie} {pet.raza ? `• ${pet.raza}` : ''}
                  </Text>
                  {pet.edad && (
                    <Text style={styles.petAge}>{pet.edad} año{pet.edad !== 1 ? 's' : ''}</Text>
                  )}
                </View>
                
                <View style={styles.petActions}>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Add Another Pet Button */}
            <TouchableOpacity style={styles.addAnotherPetButton} onPress={handleAddPet}>
              <Ionicons name="add-circle-outline" size={24} color="#F4B740" />
              <Text style={styles.addAnotherPetText}>Agregar Otra Mascota</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Safety Space */}
        <View style={styles.safetySpace} />
      </ScrollView>

      {/* Floating Add Button */}
      {pets.length > 0 && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddPet}>
          <LinearGradient
            colors={['#F4B740', '#FFD54F']}
            style={styles.floatingButtonGradient}
          >
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
    color: Colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  addFirstPetButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstPetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  addFirstPetText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  benefitsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#4A4A4A',
    flex: 1,
  },
  petsContainer: {
    paddingTop: 20,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  petAge: {
    fontSize: 12,
    color: '#999',
  },
  petActions: {
    marginLeft: 12,
  },
  addAnotherPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F4B740',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  addAnotherPetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F4B740',
  },
  safetySpace: {
    height: 100,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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

export default MyPetsScreen;