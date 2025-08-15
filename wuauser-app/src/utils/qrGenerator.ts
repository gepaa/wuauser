import { nanoid } from 'nanoid';
import { supabase } from '../services/supabase';

export interface PetQRData {
  petId: string;
  name: string;
  species: string;
  breed?: string;
  photoUrl?: string;
  ownerContact: string;
  emergencyInfo?: string;
}

export interface QRGenerationResult {
  qrId: string;
  qrUrl: string;
  publicUrl: string;
  success: boolean;
  error?: string;
}

export const qrGenerator = {
  generateUniquePetId(): string {
    const timestamp = Date.now().toString(36);
    const randomId = nanoid(8);
    return `pet_${timestamp}_${randomId}`;
  },

  generateQRUrl(petId: string): string {
    return `https://wuauser.com/pet/${petId}`;
  },

  createPetQRData(petData: any, ownerData: any): PetQRData {
    return {
      petId: petData.id || this.generateUniquePetId(),
      name: petData.nombre,
      species: petData.especie,
      breed: petData.raza,
      photoUrl: petData.foto_url,
      ownerContact: ownerData.telefono || ownerData.email,
      emergencyInfo: petData.informacion_emergencia,
    };
  },

  async savePetQRData(qrData: PetQRData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock savePetQRData:', qrData);
        return { success: true };
      }

      const { error } = await supabase
        .from('pet_qr_codes')
        .upsert({
          pet_id: qrData.petId,
          qr_data: qrData,
          created_at: new Date().toISOString(),
          is_active: true,
        });

      if (error) {
        console.error('Error saving QR data:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in savePetQRData:', error);
      return { success: false, error: error.message };
    }
  },

  async generatePetQR(petData: any, ownerData: any): Promise<QRGenerationResult> {
    try {
      const petId = petData.id || this.generateUniquePetId();
      const qrUrl = this.generateQRUrl(petId);
      const publicUrl = `https://wuauser.com/found/${petId}`;

      const qrData = this.createPetQRData({ ...petData, id: petId }, ownerData);
      
      const saveResult = await this.savePetQRData(qrData);
      if (!saveResult.success) {
        return {
          qrId: petId,
          qrUrl,
          publicUrl,
          success: false,
          error: saveResult.error,
        };
      }

      return {
        qrId: petId,
        qrUrl,
        publicUrl,
        success: true,
      };
    } catch (error: any) {
      console.error('Error generating pet QR:', error);
      return {
        qrId: '',
        qrUrl: '',
        publicUrl: '',
        success: false,
        error: error.message,
      };
    }
  },

  async getPetByQRId(qrId: string): Promise<{ data: PetQRData | null; error?: string }> {
    try {
      if (!supabase) {
        console.log('🎭 Mock getPetByQRId:', qrId);
        return {
          data: {
            petId: qrId,
            name: 'Max',
            species: 'Perro',
            breed: 'Golden Retriever',
            ownerContact: '+52 555 123 4567',
            emergencyInfo: 'Necesita medicación diaria',
          },
        };
      }

      const { data, error } = await supabase
        .from('pet_qr_codes')
        .select('qr_data')
        .eq('pet_id', qrId)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data.qr_data as PetQRData };
    } catch (error: any) {
      console.error('Error getting pet by QR ID:', error);
      return { data: null, error: error.message };
    }
  },

  async recordQRScan(qrId: string, scanLocation?: { latitude: number; longitude: number }): Promise<void> {
    try {
      if (!supabase) {
        console.log('🎭 Mock recordQRScan:', { qrId, scanLocation });
        return;
      }

      await supabase
        .from('qr_scans')
        .insert({
          pet_id: qrId,
          scanned_at: new Date().toISOString(),
          location: scanLocation,
          user_agent: 'mobile-app',
        });

      console.log('QR scan recorded successfully');
    } catch (error) {
      console.error('Error recording QR scan:', error);
    }
  },

  async notifyOwnerOfScan(qrId: string, scanLocation?: { latitude: number; longitude: number }): Promise<void> {
    try {
      if (!supabase) {
        console.log('🎭 Mock notifyOwnerOfScan:', { qrId, scanLocation });
        return;
      }

      const { data: petData } = await supabase
        .from('pets')
        .select('owner_id, nombre')
        .eq('qr_id', qrId)
        .single();

      if (petData) {
        await supabase
          .from('notifications')
          .insert({
            user_id: petData.owner_id,
            type: 'pet_found',
            title: `¡${petData.nombre} fue encontrado!`,
            message: 'Alguien escaneó el código QR de tu mascota',
            data: {
              pet_id: qrId,
              scan_location: scanLocation,
            },
            created_at: new Date().toISOString(),
          });

        console.log('Owner notification sent successfully');
      }
    } catch (error) {
      console.error('Error notifying owner:', error);
    }
  },
};

export default qrGenerator;