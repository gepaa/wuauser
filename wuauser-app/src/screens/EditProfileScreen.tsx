import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { useCustomAlert } from '../components/CustomAlert';

interface EditProfileScreenProps {
  navigation: any;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^(\+52)?[\s\-]?(\d{2,3})[\s\-]?(\d{4})[\s\-]?(\d{4})$/;

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<ProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Watch form values to detect changes
  const watchedValues = watch();

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty, watchedValues]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      // Cargar perfil guardado
      const savedProfile = await SecureStore.getItemAsync('user_profile');
      const savedEmail = await SecureStore.getItemAsync('user_email');
      const savedImage = await SecureStore.getItemAsync('profile_image');

      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        reset({
          name: profile.name || profile.nombre_completo || '',
          email: profile.email || savedEmail || '',
          phone: profile.phone || profile.telefono || '',
        });
      } else if (savedEmail) {
        // Si no hay perfil, usar datos base del email
        const baseName = savedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        reset({
          name: baseName,
          email: savedEmail,
          phone: '+52 55 1234 5678',
        });
      } else {
        // Valores por defecto
        reset({
          name: 'Usuario',
          email: '',
          phone: '',
        });
      }

      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cargar el perfil',
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showAlert({
          type: 'warning',
          title: 'Permisos necesarios',
          message: 'Se necesitan permisos para acceder a tus fotos.'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        setHasChanges(true);
        
        // Save to SecureStore
        await SecureStore.setItemAsync('profile_image', imageUri);
        
        Toast.show({
          type: 'success',
          text1: 'Foto actualizada',
          text2: 'Tu foto de perfil se ha cambiado exitosamente',
          position: 'top'
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo cambiar la foto',
        position: 'top'
      });
    }
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      // Load existing profile to preserve other fields
      const existingProfile = await SecureStore.getItemAsync('user_profile');
      const currentProfile = existingProfile ? JSON.parse(existingProfile) : {};

      // Create updated profile data with both English and Spanish field names for compatibility
      const profileData = {
        ...currentProfile,
        name: data.name,
        nombre_completo: data.name,
        email: data.email,
        phone: data.phone,
        telefono: data.phone,
        updated_at: new Date().toISOString(),
      };

      // Save updated profile
      await SecureStore.setItemAsync('user_profile', JSON.stringify(profileData));

      // Also update the email separately
      await SecureStore.setItemAsync('user_email', data.email);

      // Reset form dirty state
      reset(data);
      setHasChanges(false);

      showAlert({
        type: 'success',
        title: '¡Perfil actualizado!',
        message: 'Tus cambios se han guardado exitosamente.',
        buttons: [
          {
            text: 'Continuar',
            onPress: () => navigation.goBack()
          }
        ]
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      showAlert({
        type: 'error',
        title: 'Error al guardar',
        message: 'No se pudieron guardar los cambios. Intenta nuevamente.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    if (hasChanges) {
      showAlert({
        type: 'warning',
        title: 'Descartar cambios',
        message: '¿Estás seguro de que quieres descartar los cambios realizados?',
        buttons: [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {}
          },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => {
              loadUserProfile();
              setHasChanges(false);
              navigation.goBack();
            }
          }
        ]
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.background, Colors.white]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleDiscardChanges}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={handleImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color={Colors.text.light} />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Toca para cambiar foto</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Ionicons name="person-outline" size={16} color={Colors.text.primary} /> Nombre completo *
              </Text>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'El nombre es requerido',
                  minLength: {
                    value: 2,
                    message: 'El nombre debe tener al menos 2 caracteres'
                  },
                  maxLength: {
                    value: 50,
                    message: 'El nombre no puede exceder 50 caracteres'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                      <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#999"
                        autoCapitalize="words"
                      />
                    </View>
                    {errors.name && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={Colors.error} />
                        <Text style={styles.errorText}>{errors.name.message}</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Ionicons name="mail-outline" size={16} color={Colors.text.primary} /> Email *
              </Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'El email es requerido',
                  pattern: {
                    value: EMAIL_PATTERN,
                    message: 'Ingresa un email válido'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                      <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="tu@email.com"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    {errors.email && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={Colors.error} />
                        <Text style={styles.errorText}>{errors.email.message}</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                <Ionicons name="call-outline" size={16} color={Colors.text.primary} /> Teléfono *
              </Text>
              <Controller
                control={control}
                name="phone"
                rules={{
                  required: 'El teléfono es requerido',
                  pattern: {
                    value: PHONE_PATTERN,
                    message: 'Ingresa un teléfono válido (ej: +52 55 1234 5678)'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                      <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="+52 55 1234 5678"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                      />
                    </View>
                    {errors.phone && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={Colors.error} />
                        <Text style={styles.errorText}>{errors.phone.message}</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, (!isValid || !hasChanges) && styles.buttonDisabled]}
              onPress={handleSubmit(handleSaveProfile)}
              disabled={!isValid || !hasChanges || isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Text>
            </TouchableOpacity>

            {hasChanges && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  loadUserProfile();
                  setHasChanges(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Descartar cambios</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
      
      {AlertComponent}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginRight: 40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  imageHint: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  form: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;