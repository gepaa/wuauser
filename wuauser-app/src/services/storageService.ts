import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  localUri?: string;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
}

class StorageService {
  private readonly STORAGE_BUCKET = 'wuauser-uploads';
  
  /**
   * Request permission for camera and media library
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu cámara y galería para subir imágenes',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Show image picker options (camera or library)
   */
  async pickImage(options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { success: false, error: 'Permisos no concedidos' };
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Seleccionar Imagen',
          '¿De dónde quieres obtener la imagen?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => resolve({ success: false, error: 'Cancelado por el usuario' })
            },
            {
              text: 'Cámara',
              onPress: async () => {
                const result = await this.pickFromCamera(options);
                resolve(result);
              }
            },
            {
              text: 'Galería',
              onPress: async () => {
                const result = await this.pickFromLibrary(options);
                resolve(result);
              }
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error in pickImage:', error);
      return { success: false, error: 'Error al seleccionar imagen' };
    }
  }

  /**
   * Pick image from camera
   */
  async pickFromCamera(options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect || [1, 1],
        quality: options.quality || 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'Captura cancelada' };
      }

      const asset = result.assets[0];
      return await this.processAndUploadImage(asset.uri, options);
    } catch (error) {
      console.error('Error picking from camera:', error);
      return { success: false, error: 'Error al tomar foto' };
    }
  }

  /**
   * Pick image from library
   */
  async pickFromLibrary(options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect || [1, 1],
        quality: options.quality || 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'Selección cancelada' };
      }

      const asset = result.assets[0];
      return await this.processAndUploadImage(asset.uri, options);
    } catch (error) {
      console.error('Error picking from library:', error);
      return { success: false, error: 'Error al seleccionar imagen' };
    }
  }

  /**
   * Process and upload image
   */
  private async processAndUploadImage(
    uri: string, 
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      // First, optimize the image
      const processedImage = await this.optimizeImage(uri, options);
      
      if (!processedImage) {
        return { success: false, error: 'Error al procesar la imagen' };
      }

      // Try to upload to Supabase if available
      if (supabase) {
        console.log('☁️ Uploading to Supabase Storage...');
        const uploadResult = await this.uploadToSupabase(processedImage);
        
        if (uploadResult.success) {
          return uploadResult;
        }
        
        console.warn('Supabase upload failed, keeping image locally');
      }

      // Fallback: keep image locally
      console.log('📱 Keeping image locally...');
      return {
        success: true,
        localUri: processedImage,
        url: processedImage // For local usage
      };
    } catch (error) {
      console.error('Error processing and uploading image:', error);
      return { success: false, error: 'Error al subir imagen' };
    }
  }

  /**
   * Optimize image (resize and compress)
   */
  private async optimizeImage(
    uri: string, 
    options: ImageUploadOptions = {}
  ): Promise<string | null> {
    try {
      const { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = options;

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: maxWidth, height: maxHeight } }
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Error optimizing image:', error);
      return null;
    }
  }

  /**
   * Upload to Supabase Storage
   */
  private async uploadToSupabase(uri: string): Promise<ImageUploadResult> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase no disponible' };
      }

      // Generate unique filename
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return { success: false, error: 'Archivo no encontrado' };
      }

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        localUri: uri
      };
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      return { success: false, error: 'Error en la subida' };
    }
  }

  /**
   * Upload pet profile image
   */
  async uploadPetImage(
    petId: string, 
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    const defaultOptions = {
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.8,
      aspect: [1, 1] as [number, number],
      allowsEditing: true
    };

    return await this.pickImage({ ...defaultOptions, ...options });
  }

  /**
   * Upload medical result image
   */
  async uploadMedicalImage(
    appointmentId: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    const defaultOptions = {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.9,
      aspect: [4, 3] as [number, number],
      allowsEditing: false
    };

    return await this.pickImage({ ...defaultOptions, ...options });
  }

  /**
   * Upload user avatar
   */
  async uploadUserAvatar(
    userId: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    const defaultOptions = {
      maxWidth: 256,
      maxHeight: 256,
      quality: 0.8,
      aspect: [1, 1] as [number, number],
      allowsEditing: true
    };

    return await this.pickImage({ ...defaultOptions, ...options });
  }

  /**
   * Delete image from storage
   */
  async deleteImage(url: string): Promise<boolean> {
    try {
      if (!supabase || !url.includes(this.STORAGE_BUCKET)) {
        // If it's a local file, try to delete it
        if (url.startsWith('file://')) {
          await FileSystem.deleteAsync(url, { idempotent: true });
        }
        return true;
      }

      // Extract filename from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([fileName]);

      if (error) {
        console.error('Error deleting from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Get signed URL for private images
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  /**
   * Bulk upload images
   */
  async uploadMultipleImages(
    count: number = 5,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [{ success: false, error: 'Permisos no concedidos' }];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: options.quality || 0.8,
        selectionLimit: count,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [{ success: false, error: 'Selección cancelada' }];
      }

      const uploadPromises = result.assets.map(async (asset) => {
        return await this.processAndUploadImage(asset.uri, options);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      return [{ success: false, error: 'Error al subir imágenes múltiples' }];
    }
  }

  /**
   * Check if storage is available
   */
  get isStorageAvailable(): boolean {
    return !!supabase;
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo(): Promise<{ used: number; limit: number; available: number } | null> {
    try {
      if (!supabase) return null;

      // Note: This would require custom RPC function in Supabase
      // For now, return mock data
      return {
        used: 0,
        limit: 1024 * 1024 * 1024, // 1GB
        available: 1024 * 1024 * 1024
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();
export default storageService;