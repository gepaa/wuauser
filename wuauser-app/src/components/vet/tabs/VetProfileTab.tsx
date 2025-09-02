import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../../../constants/vetTheme';

interface VetProfileTabProps {
  navigation: any;
}

export const VetProfileTab: React.FC<VetProfileTabProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={64} color={vetTheme.colors.primary} />
        </View>
        <Text style={styles.title}>Próximamente - Perfil</Text>
        <Text style={styles.subtitle}>
          Aquí podrás ver y editar tu perfil profesional y configuración
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${vetTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vetTheme.spacing.xl,
  },
  title: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: vetTheme.spacing.md,
  },
  subtitle: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default VetProfileTab;