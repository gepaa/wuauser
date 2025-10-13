import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInUp,
  FadeInDown,
  SlideInRight,
  BounceIn,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { petService } from '../services/petService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MyPetsScreenProps {
  navigation: any;
}

interface Pet {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  edad?: number;
  peso?: number;
  foto_url?: string;
  qr_code?: string;
  microchip?: string;
  color?: string;
  sexo?: 'macho' | 'hembra';
  esterilizado?: boolean;
  fecha_nacimiento?: string;
  vacunado?: boolean;
  estado_salud?: 'excelente' | 'bueno' | 'regular' | 'requiere_atencion';
}

export const MyPetsScreen: React.FC<MyPetsScreenProps> = ({ navigation }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadPets = async () => {
      setIsLoading(true);
      try {
        // Leer de AsyncStorage en lugar de Supabase
        const petsJson = await AsyncStorage.getItem('user_pets');
        const pets = petsJson ? JSON.parse(petsJson) : [];
        
        console.log('Mascotas cargadas:', pets);
        setPets(pets);
      } catch (error) {
        console.error('Error cargando mascotas:', error);
        setPets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPets();
    
    // Recargar cuando la pantalla recibe foco
    const unsubscribe = navigation.addListener('focus', () => {
      loadPets();
    });
    
    return unsubscribe;
  }, [navigation]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const petsJson = await AsyncStorage.getItem('user_pets');
      const pets = petsJson ? JSON.parse(petsJson) : [];
      console.log('Mascotas recargadas:', pets);
      setPets(pets);
    } catch (error) {
      console.error('Error recargando mascotas:', error);
      setPets([]);
    } finally {
      setRefreshing(false);
    }
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

  const handleDeletePet = (petId: string) => {
    Alert.alert(
      'Eliminar Mascota',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const petsJson = await AsyncStorage.getItem('user_pets');
            const pets = petsJson ? JSON.parse(petsJson) : [];
            const filtered = pets.filter((p: Pet) => p.id !== petId);
            await AsyncStorage.setItem('user_pets', JSON.stringify(filtered));
            setPets(filtered);
          }
        }
      ]
    );
  };

  const renderPetCard = (pet: Pet) => (
    <TouchableOpacity 
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetail', { petId: pet.id, petData: pet })}
    >
      <View style={styles.petCardContent}>
        {/* Avatar circular pequeño */}
        <View style={styles.petAvatar}>
          {pet.foto_url ? (
            <Image source={{ uri: pet.foto_url }} style={styles.petImage} />
          ) : (
            <Ionicons name="paw" size={24} color="#F4B740" />
          )}
        </View>
        
        {/* Info de la mascota */}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{pet.nombre}</Text>
          <Text style={styles.petBreed}>
            {pet.especie} • {pet.raza || 'Sin raza'}
          </Text>
        </View>
        
        {/* Flecha y botón eliminar */}
        <View style={styles.petActions}>
          <TouchableOpacity
            onPress={() => handleDeletePet(pet.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Mascotas</Text>
        <Text style={styles.headerSubtitle}>
          {pets.length === 0 
            ? 'Aún no tienes mascotas registradas' 
            : `${pets.length} mascota${pets.length !== 1 ? 's' : ''} registrada${pets.length !== 1 ? 's' : ''}`
          }
        </Text>
      </View>

      <ScrollView 
        style={styles.petsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {pets.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="paw-outline" size={60} color="#DDD" />
            </View>
            <Text style={styles.emptyTitle}>Sin mascotas registradas</Text>
            <Text style={styles.emptyText}>
              Agrega tu primera mascota para comenzar
            </Text>
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddPet}>
              <Text style={styles.addButtonText}>Agregar Mascota</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Pets List */
          <View>
            {pets.map((pet) => renderPetCard(pet))}
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddPet}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },

  // Header Styles
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },

  // Content Styles
  petsList: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Pet Card Styles
  petCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  petAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  petActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF6B6B15',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 24,
    padding: 32,
    borderRadius: 50,
    backgroundColor: '#DDD15',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // Floating Button Styles
  floatingButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MyPetsScreen;