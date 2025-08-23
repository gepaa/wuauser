import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PetData {
  id?: string;
  nombre: string;
  especie: 'Perro' | 'Gato';
  raza?: string;
  sexo: 'Macho' | 'Hembra';
  fecha_nacimiento: string;
  color_señas: string;
  foto_url?: string;
  collar_id?: string;
  has_gps?: boolean;
  esterilizado: boolean;
  vacunas: string[];
  alergias_condiciones?: string;
  veterinario_cabecera?: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface VaccinationRecord {
  id?: string;
  pet_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  veterinarian?: string;
  notes?: string;
}

export interface MedicalRecord {
  id?: string;
  pet_id: string;
  visit_date: string;
  veterinarian: string;
  reason: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  cost?: number;
}

const commonBreeds = {
  Perro: [
    'Labrador Retriever', 'Golden Retriever', 'Pastor Alemán', 'Bulldog Francés',
    'Chihuahua', 'Yorkshire Terrier', 'Poodle', 'Rottweiler', 'Beagle',
    'Dachshund', 'Siberian Husky', 'Boxer', 'Border Collie', 'Cocker Spaniel',
    'Schnauzer', 'Boston Terrier', 'Shih Tzu', 'Pug', 'Mastín', 'Mestizo'
  ],
  Gato: [
    'Persa', 'Siamés', 'Maine Coon', 'Ragdoll', 'British Shorthair',
    'Abisinio', 'Scottish Fold', 'Sphynx', 'Bengali', 'Russian Blue',
    'Norwegian Forest', 'Oriental', 'Birmano', 'American Shorthair',
    'Exotic Shorthair', 'Devon Rex', 'Angora Turco', 'Común Europeo', 'Mestizo'
  ]
};

const commonVaccines = {
  Perro: [
    { name: 'Parvovirus', required: true },
    { name: 'Moquillo', required: true },
    { name: 'Hepatitis', required: true },
    { name: 'Parainfluenza', required: true },
    { name: 'Rabia', required: true },
    { name: 'Bordetella', required: false },
    { name: 'Leptospirosis', required: false },
    { name: 'Enfermedad de Lyme', required: false }
  ],
  Gato: [
    { name: 'Panleucopenia', required: true },
    { name: 'Rinotraqueítis', required: true },
    { name: 'Calicivirus', required: true },
    { name: 'Rabia', required: true },
    { name: 'Leucemia Felina', required: false },
    { name: 'Peritonitis Infecciosa', required: false },
    { name: 'Clamidiosis', required: false }
  ]
};

export const petService = {
  getCommonBreeds(species: 'Perro' | 'Gato'): string[] {
    return commonBreeds[species] || [];
  },

  getCommonVaccines(species: 'Perro' | 'Gato') {
    return commonVaccines[species] || [];
  },

  async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  },

  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  },

  async takePhoto(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Se necesitan permisos de cámara para tomar fotos');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      return result;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  },

  async pickImage(): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Se necesitan permisos para acceder a la galería');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      return result;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  },

  async uploadPetPhoto(imageUri: string, petId: string): Promise<{ url?: string; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock uploadPetPhoto:', { imageUri, petId });
        return { url: 'https://via.placeholder.com/300x300?text=Pet+Photo' };
      }

      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileName = `pets/${petId}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        return { error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(fileName);

      return { url: publicUrl };
    } catch (error: any) {
      console.error('Error uploading pet photo:', error);
      return { error: error.message };
    }
  },

  async createPet(petData: Partial<PetData>, ownerData: any): Promise<{ data?: PetData; error?: string }> {
    try {
      const petId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newPet: PetData = {
        id: petId,
        nombre: petData.nombre || '',
        especie: petData.especie || 'Perro',
        raza: petData.raza || '',
        sexo: petData.sexo || 'Macho',
        fecha_nacimiento: petData.fecha_nacimiento || new Date().toISOString(),
        color_señas: petData.color_señas || '',
        collar_id: petData.collar_id || null,
        has_gps: !!petData.collar_id,
        esterilizado: petData.esterilizado || false,
        vacunas: petData.vacunas || [],
        alergias_condiciones: petData.alergias_condiciones || '',
        veterinario_cabecera: petData.veterinario_cabecera || '',
        owner_id: ownerData.id || 'local_owner',
        foto_url: petData.foto_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Guardar SOLO en AsyncStorage
      const petsKey = 'user_pets';
      const existingPetsJson = await AsyncStorage.getItem(petsKey);
      const existingPets = existingPetsJson ? JSON.parse(existingPetsJson) : [];
      
      existingPets.push(newPet);
      await AsyncStorage.setItem(petsKey, JSON.stringify(existingPets));
      
      // También guardar individualmente para acceso rápido
      await AsyncStorage.setItem(`pet_${petId}`, JSON.stringify(newPet));
      
      console.log('Mascota guardada localmente:', newPet);
      return { data: newPet };
      
    } catch (error: any) {
      console.error('Error guardando mascota:', error);
      return { error: error.message || 'Error al guardar mascota' };
    }
  },

  async updatePet(petId: string, updates: Partial<PetData>): Promise<{ data?: PetData; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock updatePet:', { petId, updates });
        return { data: { ...updates, id: petId } as PetData };
      }

      const { data, error } = await supabase
        .from('pets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', petId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as PetData };
    } catch (error: any) {
      console.error('Error updating pet:', error);
      return { error: error.message };
    }
  },

  async deletePet(petId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Eliminar de AsyncStorage
      const petsKey = 'user_pets';
      const existingPetsJson = await AsyncStorage.getItem(petsKey);
      const existingPets = existingPetsJson ? JSON.parse(existingPetsJson) : [];
      
      // Filtrar la mascota a eliminar
      const updatedPets = existingPets.filter((pet: PetData) => pet.id !== petId);
      
      // Guardar la lista actualizada
      await AsyncStorage.setItem(petsKey, JSON.stringify(updatedPets));
      
      // También eliminar la entrada individual
      await AsyncStorage.removeItem(`pet_${petId}`);
      
      console.log('Mascota eliminada:', petId);
      return { success: true };
    } catch (error: any) {
      console.error('Error eliminando mascota:', error);
      return { success: false, error: error.message || 'Error al eliminar mascota' };
    }
  },

  async getPetById(petId: string): Promise<{ data?: PetData; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPetById:', petId);
        const mockPet: PetData = {
          id: petId,
          nombre: 'Max',
          especie: 'Perro',
          raza: 'Golden Retriever',
          sexo: 'Macho',
          fecha_nacimiento: '2020-05-15',
          color_señas: 'Dorado con mancha blanca en el pecho',
          collar_id: 'WUA-1234-5678',
          esterilizado: true,
          vacunas: ['Parvovirus', 'Moquillo', 'Rabia'],
          alergias_condiciones: 'Alérgico al pollo',
          has_gps: true,
          owner_id: 'mock_owner',
          created_at: new Date().toISOString(),
        };
        return { data: mockPet };
      }

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as PetData };
    } catch (error: any) {
      console.error('Error getting pet by ID:', error);
      return { error: error.message };
    }
  },

  async getUserPets(userId: string): Promise<{ data?: PetData[]; error?: string }> {
    try {
      const petsKey = 'user_pets';
      const petsJson = await AsyncStorage.getItem(petsKey);
      const pets = petsJson ? JSON.parse(petsJson) : [];
      
      return { data: pets };
    } catch (error: any) {
      console.error('Error obteniendo mascotas:', error);
      return { data: [] }; // Retornar array vacío si no hay mascotas
    }
  },

  async addVaccinationRecord(record: VaccinationRecord): Promise<{ data?: VaccinationRecord; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock addVaccinationRecord:', record);
        return { data: { ...record, id: `mock_vac_${Date.now()}` } };
      }

      const { data, error } = await supabase
        .from('vaccination_records')
        .insert(record)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as VaccinationRecord };
    } catch (error: any) {
      console.error('Error adding vaccination record:', error);
      return { error: error.message };
    }
  },

  async getPetVaccinations(petId: string): Promise<{ data?: VaccinationRecord[]; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPetVaccinations:', petId);
        return { data: [] };
      }

      const { data, error } = await supabase
        .from('vaccination_records')
        .select('*')
        .eq('pet_id', petId)
        .order('date_administered', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data as VaccinationRecord[] };
    } catch (error: any) {
      console.error('Error getting pet vaccinations:', error);
      return { error: error.message };
    }
  },

  async addMedicalRecord(record: MedicalRecord): Promise<{ data?: MedicalRecord; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock addMedicalRecord:', record);
        return { data: { ...record, id: `mock_med_${Date.now()}` } };
      }

      const { data, error } = await supabase
        .from('medical_records')
        .insert(record)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as MedicalRecord };
    } catch (error: any) {
      console.error('Error adding medical record:', error);
      return { error: error.message };
    }
  },

  async getPetMedicalRecords(petId: string): Promise<{ data?: MedicalRecord[]; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPetMedicalRecords:', petId);
        return { data: [] };
      }

      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('visit_date', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data as MedicalRecord[] };
    } catch (error: any) {
      console.error('Error getting pet medical records:', error);
      return { error: error.message };
    }
  },

  // Alias para getPetsByOwner
  async getPetsByOwner(ownerId: string): Promise<{ data?: PetData[]; error?: string }> {
    try {
      const petsKey = 'user_pets';
      const petsJson = await AsyncStorage.getItem(petsKey);
      const pets = petsJson ? JSON.parse(petsJson) : [];
      
      return { data: pets };
    } catch (error: any) {
      console.error('Error obteniendo mascotas:', error);
      return { data: [] }; // Retornar array vacío si no hay mascotas
    }
  },
};

export default petService;