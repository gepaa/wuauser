import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Logo } from '../components/Logo';
import { colors } from '../constants/colors';
import type { TipoUsuario } from '../types';

interface UserTypeSelectionScreenProps {
  onSelectUserType: (tipo: TipoUsuario) => void;
  onNavigateToLogin: () => void;
}

export const UserTypeSelectionScreen: React.FC<UserTypeSelectionScreenProps> = ({
  onSelectUserType,
  onNavigateToLogin,
}) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size="large" showText={true} />
          <Text style={styles.title}>¿Cómo quieres usar Wuauser?</Text>
          <Text style={styles.subtitle}>
            Selecciona el tipo de cuenta que mejor se adapte a ti
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelectUserType('dueno')}
          >
            <Text style={styles.optionTitle}>Soy Dueño de Mascota</Text>
            <Text style={styles.optionDescription}>
              Busco veterinarios para el cuidado de mi mascota
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => onSelectUserType('veterinario')}
          >
            <Text style={styles.optionTitle}>Soy Veterinario</Text>
            <Text style={styles.optionDescription}>
              Quiero ofrecer mis servicios veterinarios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestOption}
            onPress={() => onSelectUserType('guest')}
          >
            <Text style={styles.guestText}>Continuar como invitado</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  guestOption: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  guestText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});