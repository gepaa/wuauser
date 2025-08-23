import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { petService } from '../services/petService';

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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 60,
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  petsList: {
    padding: 16,
  },
  petCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: '#666',
  },
  petActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#F4B740',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4B740',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default MyPetsScreen;