import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { authService } from '../services/supabase';
import { Colors } from '../constants/colors';

export const EmailConfirmScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // En una implementación real, aquí procesarías el token de confirmación
        // Por ahora, simplemente simulamos una confirmación exitosa
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setStatus('success');
        setIsLoading(false);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 3000);
        
      } catch (error) {
        console.error('Error confirmando email:', error);
        setStatus('error');
        setIsLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [navigation]);

  const handleGoToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleResendEmail = () => {
    Alert.alert(
      'Reenviar Email',
      'Esta función estará disponible en la próxima actualización.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isLoading && (
          <>
            <Text style={styles.title}>Confirmando email...</Text>
            <Text style={styles.subtitle}>
              Por favor espera mientras procesamos tu confirmación.
            </Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.title}>¡Email confirmado!</Text>
            <Text style={styles.subtitle}>
              Tu cuenta ha sido activada exitosamente. 
              Serás redirigido al login automáticamente.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleGoToLogin}
            >
              <Text style={styles.buttonText}>Ir al Login</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.title}>Error de confirmación</Text>
            <Text style={styles.subtitle}>
              No pudimos confirmar tu email. El enlace puede haber expirado 
              o ser inválido.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleResendEmail}
            >
              <Text style={styles.buttonText}>Reenviar Email</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={handleGoToLogin}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Volver al Login
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
});