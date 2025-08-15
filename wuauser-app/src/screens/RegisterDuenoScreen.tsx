import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { authService } from '../services/supabase';

interface RegisterDuenoScreenProps {
  navigation: any;
  onSuccess?: () => void;
  onNavigateBack?: () => void;
}

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

// Validation patterns
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_PATTERN = /^[0-9]{10}$/; // Exactly 10 digits for Mexican phone numbers
const PASSWORD_MIN_LENGTH = 8;

export const RegisterDuenoScreen: React.FC<RegisterDuenoScreenProps> = ({ 
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
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password');

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email || !EMAIL_PATTERN.test(email)) return true; // Let pattern validation handle invalid emails
    
    setEmailCheckLoading(true);
    try {
      // In development mode, simulate email check
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Simulate that some emails already exist
        const existingEmails = ['test@example.com', 'admin@wuauser.com', 'demo@test.com'];
        if (existingEmails.includes(email.toLowerCase())) {
          return 'Este email ya está registrado';
        }
        return true;
      }
      
      // In production, check with Supabase
      const { data, error } = await authService.signIn(email, 'dummy-password');
      if (error && error.message.includes('Invalid login')) {
        return true; // Email doesn't exist, which is good for registration
      }
      return 'Este email ya está registrado';
    } catch (error) {
      console.log('Email check error:', error);
      return true; // Allow registration if check fails
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Helper component for form fields
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
                <Ionicons name="alert-circle" size={16} color={colors.error} />
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
      const { nombre, apellido, email, telefono, password } = data;
      
      const datosPersonales = {
        nombre_completo: `${nombre} ${apellido}`,
        telefono: telefono,
      };
      
      const { data: result, error } = await authService.registrarDueno(
        email,
        password,
        datosPersonales
      );
      
      if (error) {
        throw error;
      }
      
      if (result?.user) {
        Alert.alert(
          '¡Registro Exitoso!',
          'Tu cuenta ha sido creada correctamente. Revisa tu email para confirmar tu cuenta.',
          [
            {
              text: 'Continuar',
              onPress: () => {
                if (onSuccess) {
                  onSuccess();
                } else {
                  // Navigate to HomeScreen (main app)
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'HomeScreen' }],
                  });
                }
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      let errorMessage = 'No se pudo crear la cuenta. Intenta nuevamente.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error en Registro', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta de Dueño</Text>
            <Text style={styles.subtitle}>
              Únete a la comunidad de cuidadores de mascotas más grande de México
            </Text>
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
                  message: 'Ingresa un email válido (ejemplo: usuario@dominio.com)'
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

            <TouchableOpacity
              style={[
                styles.registerButton, 
                (isLoading || !isValid) && styles.buttonDisabled
              ]}
              onPress={handleSubmit(handleRegister)}
              disabled={isLoading || !isValid}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
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
  );
};

const styles = StyleSheet.create({
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
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
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#E85D4E',
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

export default RegisterDuenoScreen;