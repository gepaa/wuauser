import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import storageService, { ImageUploadResult, ImageUploadOptions } from '../services/storageService';

const { width } = Dimensions.get('window');

interface ImageUploadProps {
  onImageSelected?: (result: ImageUploadResult) => void;
  onImageRemoved?: () => void;
  currentImage?: string;
  placeholder?: string;
  uploadOptions?: ImageUploadOptions;
  size?: 'small' | 'medium' | 'large';
  shape?: 'circle' | 'square' | 'rectangle';
  disabled?: boolean;
  showProgress?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  onImageRemoved,
  currentImage,
  placeholder = 'Agregar imagen',
  uploadOptions = {},
  size = 'medium',
  shape = 'square',
  disabled = false,
  showProgress = true
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(currentImage || null);

  const sizeStyles = {
    small: { width: 80, height: 80 },
    medium: { width: 120, height: 120 },
    large: { width: 200, height: 200 }
  };

  const shapeStyles = {
    circle: { borderRadius: sizeStyles[size].width / 2 },
    square: { borderRadius: 12 },
    rectangle: { borderRadius: 12, height: sizeStyles[size].height * 0.75 }
  };

  const handleImageUpload = async () => {
    if (disabled || isUploading) return;

    try {
      setIsUploading(true);

      console.log('📷 Starting image upload...');
      const result = await storageService.pickImage(uploadOptions);

      if (result.success && (result.url || result.localUri)) {
        const imageUri = result.url || result.localUri!;
        setLocalImage(imageUri);
        
        console.log('✅ Image upload successful:', imageUri);
        onImageSelected?.(result);
      } else if (result.error && !result.error.includes('cancelad')) {
        console.error('❌ Upload failed:', result.error);
        Alert.alert('Error', result.error || 'No se pudo subir la imagen');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      Alert.alert('Error', 'Error inesperado al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = () => {
    if (disabled) return;

    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro que deseas eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setLocalImage(null);
            onImageRemoved?.();
          }
        }
      ]
    );
  };

  const renderContent = () => {
    if (isUploading && showProgress) {
      return (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.uploadingText}>Subiendo...</Text>
        </View>
      );
    }

    if (localImage) {
      return (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: localImage }} 
            style={[
              styles.image, 
              sizeStyles[size], 
              shapeStyles[shape]
            ]}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleImageRemove}
            disabled={disabled}
          >
            <Ionicons name="close-circle" size={24} color="#FF4444" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.placeholderContainer}>
        <LinearGradient
          colors={disabled ? ['#F5F5F5', '#F5F5F5'] : ['#4ECDC4', '#45B7AA']}
          style={[styles.placeholderIcon, shapeStyles[shape]]}
        >
          <Ionicons 
            name="camera" 
            size={size === 'large' ? 32 : size === 'medium' ? 24 : 20} 
            color={disabled ? '#999' : '#FFF'} 
          />
        </LinearGradient>
        <Text style={[
          styles.placeholderText,
          { color: disabled ? '#999' : Colors.text.primary }
        ]}>
          {placeholder}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles[size],
        shapeStyles[shape],
        disabled && styles.disabled
      ]}
      onPress={handleImageUpload}
      disabled={disabled || isUploading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: '#F8F8F8',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

export default ImageUpload;