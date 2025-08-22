import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { authService, dbService } from '../services/supabase';

interface RegisterVeterinarioScreenProps {
  navigation: any;
  onSuccess?: () => void;
  onNavigateBack?: () => void;
}

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cedulaProfesional: string;
  especialidad: string;
  clinica: string;
  direccionClinica: string;
  password: string;
  confirmPassword: string;
}

// Validation patterns for veterinarians
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^[0-9]{10}$/; // Exactly 10 digits for Mexican phone numbers
const CEDULA_PATTERN = /^([0-9]{7,8}|PRUEBA123)$/; // 7-8 digits for professional license or PRUEBA123 for testing
const PASSWORD_MIN_LENGTH = 8;

export const RegisterVeterinarioScreen: React.FC<RegisterVeterinarioScreenProps> = ({ 
  navigation, 
  onSuccess, 
  onNavigateBack 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'vet@test.com',
      telefono: '5512345678',
      cedulaProfesional: 'PRUEBA123',
      especialidad: 'Medicina Veterinaria General',
      clinica: 'Veterinaria San José',
      direccionClinica: 'Av. Principal 123, Col. Centro',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password');

  // Check if email already exists (same as dueño)
  const checkEmailExists = async (email: string) => {
    if (!email || !EMAIL_PATTERN.test(email)) return true;
    
    setEmailCheckLoading(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        const existingEmails = ['test@example.com', 'admin@wuauser.com', 'demo@test.com', 'vet@clinic.com'];
        if (existingEmails.includes(email.toLowerCase())) {
          return 'Este email ya está registrado';
        }
        return true;
      }
      
      const { data, error } = await authService.signIn(email, 'dummy-password');
      if (error && error.message.includes('Invalid login')) {
        return true;
      }
      return 'Este email ya está registrado';
    } catch (error) {
      console.log('Email check error:', error);
      return true;
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Helper component for form fields (same as RegisterDuenoScreen)
  const FormField = ({ 
    name, 
    label, 
    placeholder, 
    keyboardType = 'default',
    autoCapitalize = 'none',
    secureTextEntry = false,
    showPasswordToggle = false,
    showPassword: localShowPassword,
    onTogglePassword,
    rules
  }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            {showPasswordToggle ? (
              <View style={[styles.passwordContainer, errors[name] && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={placeholder}
                  placeholderTextColor="#999"
                  secureTextEntry={secureTextEntry && !localShowPassword}
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={onTogglePassword}>
                  <Ionicons 
                    name={localShowPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={[styles.input, errors[name] && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                placeholderTextColor="#999"
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                secureTextEntry={secureTextEntry}
              />
            )}
            {errors[name] && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{errors[name]?.message}</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );

  const handleRegister = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const { 
        nombre, 
        apellido, 
        email, 
        telefono, 
        cedulaProfesional, 
        especialidad,
        clinica, 
        direccionClinica, 
        password 
      } = data;
      
      const datosVeterinario = {
        nombre_completo: `${nombre} ${apellido}`,
        telefono: telefono,
        cedula_profesional: cedulaProfesional,
        especialidad: especialidad,
        nombre_clinica: clinica,
        direccion_clinica: direccionClinica,
        verificado: false, // Always start as unverified
        servicios: [], // Can be added later
      };
      
      // Registrar en Supabase Auth
      const { data: authData, error } = await authService.signUp(
        email,
        password,
        {
          tipo_usuario: 'veterinario',
          nombre_completo: `${nombre} ${apellido}`,
          cedula_profesional: cedulaProfesional
        }
      );
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      
      if (!authData?.user) {
        Alert.alert('Error', 'No se pudo crear el usuario');
        return;
      }
      
      // Crear perfil en la tabla profiles
      try {
        const profileData = {
          email: email.toLowerCase().trim(),
          nombre_completo: `${nombre} ${apellido}`,
          telefono: telefono,
          tipo_usuario: 'veterinario' as const,
          cedula_profesional: cedulaProfesional,
          especialidad: especialidad,
          nombre_clinica: clinica,
          direccion_clinica: direccionClinica,
          verificado: false
        };
        
        const { error: profileError } = await dbService.createProfile(authData.user.id, profileData);
        
        if (profileError) {
          console.error('Error creando perfil veterinario:', profileError);
          Alert.alert(
            'Advertencia', 
            'La cuenta se creó pero hubo un problema con el perfil. Intenta iniciar sesión.',
            [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
          );
          return;
        }
        
        console.log('✅ Perfil de veterinario creado exitosamente');
      } catch (profileError) {
        console.error('Error en creación de perfil veterinario:', profileError);
        Alert.alert(
          'Advertencia', 
          'La cuenta se creó pero hubo un problema con el perfil. Intenta iniciar sesión.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }
      
      if (authData?.user) {
        const isTestRegistration = cedulaProfesional === 'PRUEBA123';
        
        if (isTestRegistration) {
          Alert.alert(
            '¡Registro Exitoso!',
            'Tu cuenta de prueba ha sido creada. Puedes acceder inmediatamente a tu dashboard.',
            [
              {
                text: 'Continuar',
                onPress: () => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            '¡Solicitud Enviada!',
            'Tu solicitud está en revisión. Un administrador verificará tu información profesional y te contactará en las próximas 24-48 horas.',
            [
              {
                text: 'Entendido',
                onPress: () => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  }
                }
              }
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Error en registro de veterinario:', error);
      
      let errorMessage = 'No se pudo enviar la solicitud. Intenta nuevamente.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error en Registro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#4ECDC4', '#FFF8E7']}
          style={styles.gradient}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="stethoscope" size={40} color="#44A08D" />
            </View>
            <Text style={styles.title}>Registro Profesional</Text>
            <View style={styles.warningContainer}>
              <Ionicons name="information-circle" size={20} color="#FF9500" />
              <Text style={styles.warningText}>
                La cuenta profesional requiere verificación de credenciales
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <FormField
              name="nombre"
              label="Nombre *"
              placeholder="Tu nombre"
              autoCapitalize="words"
              rules={{
                required: 'El nombre es requerido',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                },
                pattern: {
                  value: /^[a-zA-ZÀ-ÿ\s]+$/,
                  message: 'El nombre solo puede contener letras'
                }
              }}
            />

            <FormField
              name="apellido"
              label="Apellido *"
              placeholder="Tu apellido"
              autoCapitalize="words"
              rules={{
                required: 'El apellido es requerido',
                minLength: {
                  value: 2,
                  message: 'El apellido debe tener al menos 2 caracteres'
                },
                pattern: {
                  value: /^[a-zA-ZÀ-ÿ\s]+$/,
                  message: 'El apellido solo puede contener letras'
                }
              }}
            />

            <FormField
              name="email"
              label="Email *"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              rules={{
                required: 'El email es requerido',
                pattern: {
                  value: EMAIL_PATTERN,
                  message: 'Ingresa un email válido (ejemplo: doctor@clinica.com)'
                },
                validate: checkEmailExists
              }}
            />

            <FormField
              name="telefono"
              label="Teléfono *"
              placeholder="5512345678 (solo números, 10 dígitos)"
              keyboardType="phone-pad"
              rules={{
                required: 'El teléfono es requerido',
                pattern: {
                  value: PHONE_PATTERN,
                  message: 'Ingresa exactamente 10 dígitos (ejemplo: 5512345678)'
                },
                minLength: {
                  value: 10,
                  message: 'El teléfono debe tener 10 dígitos'
                },
                maxLength: {
                  value: 10,
                  message: 'El teléfono debe tener 10 dígitos'
                }
              }}
            />

            <FormField
              name="cedulaProfesional"
              label="Cédula Profesional *"
              placeholder="1234567 (7-8 dígitos) o PRUEBA123 para testing"
              rules={{
                required: 'La cédula profesional es requerida',
                pattern: {
                  value: CEDULA_PATTERN,
                  message: 'Ingresa una cédula válida (7-8 dígitos) o PRUEBA123 para testing'
                },
                validate: (value: string) => {
                  if (value === 'PRUEBA123') return true;
                  if (!/^[0-9]{7,8}$/.test(value)) {
                    return 'Ingresa una cédula válida (7-8 dígitos) o PRUEBA123 para testing';
                  }
                  return true;
                }
              }}
            />

            <FormField
              name="especialidad"
              label="Especialidad *"
              placeholder="Medicina Veterinaria General, Cirugía, etc."
              autoCapitalize="words"
              rules={{
                required: 'La especialidad es requerida',
                minLength: {
                  value: 3,
                  message: 'La especialidad debe tener al menos 3 caracteres'
                }
              }}
            />

            <FormField
              name="clinica"
              label="Clínica/Consultorio"
              placeholder="Nombre de tu clínica o consultorio"
              autoCapitalize="words"
              rules={{
                minLength: {
                  value: 3,
                  message: 'El nombre de la clínica debe tener al menos 3 caracteres'
                }
              }}
            />

            <FormField
              name="direccionClinica"
              label="Dirección de la Clínica"
              placeholder="Dirección completa de tu consultorio"
              rules={{
                minLength: {
                  value: 10,
                  message: 'La dirección debe tener al menos 10 caracteres'
                }
              }}
            />

            <FormField
              name="password"
              label="Contraseña *"
              placeholder="Mínimo 8 caracteres con mayúsculas, minúsculas y números"
              secureTextEntry={true}
              showPasswordToggle={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              rules={{
                required: 'La contraseña es requerida',
                minLength: {
                  value: PASSWORD_MIN_LENGTH,
                  message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                  message: 'Debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 8 caracteres'
                }
              }}
            />

            <FormField
              name="confirmPassword"
              label="Confirmar Contraseña *"
              placeholder="Repite tu contraseña"
              secureTextEntry={true}
              showPasswordToggle={true}
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              rules={{
                required: 'Confirma tu contraseña',
                validate: (value: string) =>
                  value === watchPassword || 'Las contraseñas no coinciden'
              }}
            />

            <View style={styles.infoContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#44A08D" />
              <Text style={styles.infoText}>
                Usa "PRUEBA123" como cédula para acceso inmediato (testing)
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton, 
                (isLoading || !isValid) && styles.buttonDisabled
              ]}
              onPress={handleSubmit(handleRegister)}
              disabled={isLoading || !isValid}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Enviando solicitud...' : 'Solicitar Registro'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4ECDC4',
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 15,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    maxWidth: '90%',
  },
  warningText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 205, 196, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#44A08D',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#44A08D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#2A2A2A',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterVeterinarioScreen;