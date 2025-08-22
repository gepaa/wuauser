import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { WuauserLogo } from '../components/WuauserLogo';
import { Colors } from '../constants/colors';
import { authService, dbService, supabase } from '../services/supabase';
import { useCustomAlert } from '../components/CustomAlert';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  navigation: any;
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onContinueAsGuest?: () => void;
}

interface FormData {
  email: string;
  password: string;
}

// Validation patterns
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  navigation, 
  onSuccess, 
  onNavigateToRegister, 
  onContinueAsGuest 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();
  const { signIn } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Load saved email on component mount
  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      const savedEmail = await SecureStore.getItemAsync('user_email');
      const savedSession = await SecureStore.getItemAsync('user_session');
      
      if (savedEmail) {
        setValue('email', savedEmail);
      }
      
      if (savedSession) {
        // Auto-login if valid session exists
        console.log('Sesión existente encontrada, verificando validez...');
        try {
          const { user, error } = await authService.getCurrentUser();
          if (user && !error) {
            handleNavigationAfterLogin(user);
          }
        } catch (error) {
          console.log('Sesión expirada, limpiando datos guardados');
          await clearSavedSession();
        }
      }
    } catch (error) {
      console.log('Error cargando sesión guardada:', error);
    }
  };

  const saveSession = async (email: string, session: any) => {
    try {
      await SecureStore.setItemAsync('user_email', email);
      await SecureStore.setItemAsync('user_session', JSON.stringify(session));
      console.log('Sesión guardada exitosamente');
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  };

  const clearSavedSession = async () => {
    try {
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_session');
      await SecureStore.deleteItemAsync('user_type');
    } catch (error) {
      console.error('Error limpiando sesión:', error);
    }
  };

  // Detect user type from email or session data
  const detectUserType = async (user: any) => {
    try {
      // Try to get user type from metadata or database
      const userType = user?.user_metadata?.tipo_usuario || 'dueno';
      await SecureStore.setItemAsync('user_type', userType);
      return userType;
    } catch (error) {
      console.log('Error detectando tipo de usuario:', error);
      return 'dueno'; // Default to dueno
    }
  };

  const handleNavigationAfterLogin = (user: any) => {
    console.log('=== DEBUG NAVEGACIÓN ===');
    console.log('Navigator state:', navigation.getState());
    console.log('Parent navigator:', navigation.getParent());
    console.log('Can go back:', navigation.canGoBack());
    console.log('Usuario tipo:', user?.user_metadata?.tipo_usuario);
    
    const userType = user?.user_metadata?.tipo_usuario || 'dueno';
    const targetScreen = userType === 'veterinario' ? 'VetDashboard' : 'HomeScreen';
    console.log('Target screen:', targetScreen);
    
    if (onSuccess) {
      console.log('Usando onSuccess callback');
      onSuccess();
      return;
    }
    
    // Intentar diferentes formas de navegar
    try {
      console.log('Intentando reset...');
      // Opción 1: Reset
      navigation.reset({
        index: 0,
        routes: [{ name: targetScreen }]
      });
      console.log('✅ Reset exitoso');
    } catch (e1) {
      console.error('❌ Reset failed:', e1);
      
      try {
        console.log('Intentando navigate...');
        // Opción 2: Navigate
        navigation.navigate(targetScreen as any);
        console.log('✅ Navigate exitoso');
      } catch (e2) {
        console.error('❌ Navigate failed:', e2);
        
        try {
          console.log('Intentando replace...');
          // Opción 3: Replace
          navigation.replace(targetScreen as any);
          console.log('✅ Replace exitoso');
        } catch (e3) {
          console.error('❌ Replace failed:', e3);
          console.error('🚨 NO SE PUEDE NAVEGAR A', targetScreen);
          
          // Último intento: navegar a una ruta que sabemos que existe
          try {
            console.log('Último intento: navegando a UserType...');
            navigation.navigate('UserType');
            console.log('✅ Navegación a UserType exitosa');
          } catch (e4) {
            console.error('❌ Ni siquiera UserType funciona:', e4);
            console.error('🆘 NAVEGACIÓN COMPLETAMENTE ROTA');
          }
        }
      }
    }
    console.log('=========================');
  };

  const handleLogin = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const { email, password } = data;
      
      // Login con Supabase
      const { data: authData, error } = await authService.signIn(email, password);
      
      if (error) throw error;
      
      if (authData?.user && authData?.session) {
        // IMPORTANTE: Verificar que la sesión realmente existe
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('=== SESIÓN DESPUÉS DE LOGIN ===');
        console.log('Sesión existe:', !!session);
        console.log('Access token:', session?.access_token ? 'Sí' : 'No');
        console.log('Usuario ID:', session?.user?.id);
        console.log('================================');
        
        if (!session) {
          // Si no hay sesión, intentar setear manualmente
          await supabase.auth.setSession({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token
          });
        }
        
        // Guardar en SecureStore
        await SecureStore.setItemAsync('supabase_session', JSON.stringify(authData.session));
        await SecureStore.setItemAsync('user_email', email);
        
        // Esperar un momento para que la sesión se establezca
        setTimeout(() => {
          handleNavigationAfterLogin(authData.user);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      showAlert({
        type: 'error',
        title: 'Error de Inicio de Sesión',
        message: error.message || 'No se pudo iniciar sesión'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordModalVisible(true);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim() || !EMAIL_PATTERN.test(resetEmail)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ingresa un email válido',
        position: 'top'
      });
      return;
    }

    setResetLoading(true);
    
    try {
      const { data, error } = await authService.resetPassword(resetEmail);
      
      if (error) {
        throw error;
      }
      
      showAlert({
        type: 'success',
        title: '¡Email Enviado!',
        message: 'Revisa tu correo electrónico para las instrucciones de recuperación de contraseña.',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              setForgotPasswordModalVisible(false);
              setResetEmail('');
            }
          }
        ]
      });
    } catch (error: any) {
      console.error('Error en reset password:', error);
      
      let errorMessage = 'No se pudo enviar el email. Intenta nuevamente.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const { data, error } = await authService.continuarComoGuest();
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        // Navigate directly to QR Scanner for guest users
        console.log('=== DEBUG NAVEGACIÓN ===');
        console.log('Intentando navegar a:', 'QRScanner');
        console.log('Rutas disponibles:', navigation.getState());
        console.log('=======================');
        navigation.reset({
          index: 0,
          routes: [{ name: 'QRScanner' }],
        });
      }
    } catch (error: any) {
      console.error('Error en guest login:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudo continuar como invitado. Intenta nuevamente.',
        position: 'top'
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FFF8E7', '#F4B740']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <WuauserLogo size={120} />
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>
              Bienvenido de nuevo a Wuauser
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                <Ionicons name="mail-outline" size={16} color="#2A2A2A" /> Email *
              </Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'El email es requerido',
                  pattern: {
                    value: EMAIL_PATTERN,
                    message: 'Ingresa un email válido (ejemplo: usuario@dominio.com)'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={[styles.inputWithIcon, errors.email && styles.inputError]}>
                      <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputField}
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                <Ionicons name="lock-closed-outline" size={16} color="#2A2A2A" /> Contraseña *
              </Text>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                      <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Tu contraseña"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={showPassword ? 'eye-off' : 'eye'} 
                          size={24} 
                          color="#999" 
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color={Colors.error} />
                        <Text style={styles.errorText}>{errors.password.message}</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordLink}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton, 
                (isLoading || !isValid) && styles.buttonDisabled
              ]}
              onPress={handleSubmit(handleLogin)}
              disabled={isLoading || !isValid}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={20} color="#6A6A6A" />
              <Text style={styles.guestButtonText}>
                Encontré una mascota (Invitado)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => {
                console.log('=== DEBUG NAVEGACIÓN ===');
                console.log('Intentando navegar a:', 'UserType');
                console.log('Rutas disponibles:', navigation.getState());
                console.log('=======================');
                navigation.navigate('UserType');
              }}
            >
              <Text style={styles.registerLinkText}>
                ¿No tienes cuenta? Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Forgot Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={forgotPasswordModalVisible}
        onRequestClose={() => setForgotPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
              <TouchableOpacity
                onPress={() => setForgotPasswordModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Ingresa tu email y te enviaremos las instrucciones para recuperar tu contraseña.
            </Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Email</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputField}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setForgotPasswordModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSendButton, resetLoading && styles.buttonDisabled]}
                onPress={handlePasswordReset}
                disabled={resetLoading}
              >
                <Text style={styles.modalSendText}>
                  {resetLoading ? 'Enviando...' : 'Enviar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 16,
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
  inputWithIcon: {
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
  inputIcon: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
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
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  forgotPasswordLink: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#F4B740',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#E85D4E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  guestButtonText: {
    color: '#6A6A6A',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  registerLinkText: {
    color: '#2A2A2A',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F4B740',
  },
  modalSendText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default LoginScreen;