import { supabase } from './supabase';
import { qrGenerator } from '../utils/qrGenerator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface PetData {
  id?: string;
  nombre: string;
  especie: 'Perro' | 'Gato';
  raza?: string;
  sexo: 'Macho' | 'Hembra';
  fecha_nacimiento: string;
  color_señas: string;
  foto_url?: string;
  chip_numero?: string;
  esterilizado: boolean;
  vacunas: string[];
  alergias_condiciones?: string;
  veterinario_cabecera?: string;
  qr_id?: string;
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

  async createPet(petData: PetData, ownerData: any): Promise<{ data?: PetData; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation for development
        console.log('🎭 Mock createPet:', petData);
        const mockPet: PetData = {
          ...petData,
          id: `mock_pet_${Date.now()}`,
          qr_id: qrGenerator.generateUniquePetId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { data: mockPet };
      }

      // Generate QR for the pet
      const qrResult = await qrGenerator.generatePetQR(petData, ownerData);
      if (!qrResult.success) {
        return { error: qrResult.error || 'Error generando código QR' };
      }

      const petWithQR = {
        ...petData,
        qr_id: qrResult.qrId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pets')
        .insert(petWithQR)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: data as PetData };
    } catch (error: any) {
      console.error('Error creating pet:', error);
      return { error: error.message };
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
      if (!supabase) {
        console.log('🎭 Mock deletePet:', petId);
        return { success: true };
      }

      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      return { success: false, error: error.message };
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
          chip_numero: '123456789012345',
          esterilizado: true,
          vacunas: ['Parvovirus', 'Moquillo', 'Rabia'],
          alergias_condiciones: 'Alérgico al pollo',
          qr_id: 'mock_qr_123',
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
      if (!supabase) {
        console.log('🎭 Mock getUserPets:', userId);
        return { data: [] }; // Return empty array for mock
      }

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { error: error.message };
      }

      return { data: data as PetData[] };
    } catch (error: any) {
      console.error('Error getting user pets:', error);
      return { error: error.message };
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
};

export default petService;