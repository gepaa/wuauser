import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../constants/vetTheme';

interface ConfiguracionesScreenProps {
  navigation: any;
}

interface ConfiguracionItem {
  titulo: string;
  descripcion?: string;
  tipo: 'switch' | 'navigation' | 'picker';
  icono: string;
  valor?: boolean;
  opciones?: string[];
  valorActual?: string;
  onPress?: () => void;
  onChange?: (value: any) => void;
}

export const ConfiguracionesScreen: React.FC<ConfiguracionesScreenProps> = ({ navigation }) => {
  const [configuraciones, setConfiguraciones] = useState({
    notificacionesPush: true,
    notificacionesEmail: true,
    notificacionesSMS: false,
    sonidosApp: true,
    vibracion: true,
    notificacionesNoche: false,
    idioma: 'Español',
    tema: 'Claro',
    actualizacionesAutomaticas: true,
  });

  const actualizarConfiguracion = (key: string, valor: any) => {
    setConfiguraciones(prev => ({
      ...prev,
      [key]: valor
    }));
  };

  const secciones = [
    {
      titulo: 'Notificaciones',
      items: [
        {
          titulo: 'Notificaciones Push',
          descripcion: 'Recibir notificaciones de citas y mensajes',
          tipo: 'switch' as const,
          icono: 'notifications-outline',
          valor: configuraciones.notificacionesPush,
          onChange: (valor: boolean) => actualizarConfiguracion('notificacionesPush', valor)
        },
        {
          titulo: 'Notificaciones por Email',
          descripcion: 'Recibir resúmenes diarios por correo',
          tipo: 'switch' as const,
          icono: 'mail-outline',
          valor: configuraciones.notificacionesEmail,
          onChange: (valor: boolean) => actualizarConfiguracion('notificacionesEmail', valor)
        },
        {
          titulo: 'Notificaciones SMS',
          descripcion: 'Recordatorios de citas por mensaje de texto',
          tipo: 'switch' as const,
          icono: 'chatbubble-outline',
          valor: configuraciones.notificacionesSMS,
          onChange: (valor: boolean) => actualizarConfiguracion('notificacionesSMS', valor)
        },
        {
          titulo: 'Modo No Molestar',
          descripcion: 'Pausar notificaciones de 22:00 a 7:00',
          tipo: 'switch' as const,
          icono: 'moon-outline',
          valor: configuraciones.notificacionesNoche,
          onChange: (valor: boolean) => actualizarConfiguracion('notificacionesNoche', valor)
        }
      ]
    },
    {
      titulo: 'Sonido y Vibración',
      items: [
        {
          titulo: 'Sonidos de la App',
          descripcion: 'Sonidos para notificaciones y acciones',
          tipo: 'switch' as const,
          icono: 'volume-high-outline',
          valor: configuraciones.sonidosApp,
          onChange: (valor: boolean) => actualizarConfiguracion('sonidosApp', valor)
        },
        {
          titulo: 'Vibración',
          descripcion: 'Vibrar para notificaciones importantes',
          tipo: 'switch' as const,
          icono: 'phone-portrait-outline',
          valor: configuraciones.vibracion,
          onChange: (valor: boolean) => actualizarConfiguracion('vibracion', valor)
        }
      ]
    },
    {
      titulo: 'Preferencias',
      items: [
        {
          titulo: 'Idioma',
          descripcion: 'Español',
          tipo: 'navigation' as const,
          icono: 'language-outline',
          onPress: () => Alert.alert('Idioma', 'Próximamente más opciones de idioma')
        },
        {
          titulo: 'Tema',
          descripcion: configuraciones.tema,
          tipo: 'navigation' as const,
          icono: 'color-palette-outline',
          onPress: () => mostrarSelectorTema()
        },
        {
          titulo: 'Actualizaciones Automáticas',
          descripcion: 'Mantener la app siempre actualizada',
          tipo: 'switch' as const,
          icono: 'refresh-outline',
          valor: configuraciones.actualizacionesAutomaticas,
          onChange: (valor: boolean) => actualizarConfiguracion('actualizacionesAutomaticas', valor)
        }
      ]
    },
    {
      titulo: 'Privacidad y Seguridad',
      items: [
        {
          titulo: 'Datos de Diagnóstico',
          descripcion: 'Compartir datos anónimos para mejorar la app',
          tipo: 'switch' as const,
          icono: 'analytics-outline',
          valor: true,
          onChange: () => {}
        },
        {
          titulo: 'Política de Privacidad',
          tipo: 'navigation' as const,
          icono: 'shield-checkmark-outline',
          onPress: () => navigation.navigate('Privacidad')
        },
        {
          titulo: 'Términos de Uso',
          tipo: 'navigation' as const,
          icono: 'document-text-outline',
          onPress: () => navigation.navigate('Terminos')
        }
      ]
    }
  ];

  const mostrarSelectorTema = () => {
    Alert.alert(
      'Seleccionar Tema',
      'Elige el tema de la aplicación',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Claro', 
          onPress: () => actualizarConfiguracion('tema', 'Claro')
        },
        { 
          text: 'Oscuro', 
          onPress: () => actualizarConfiguracion('tema', 'Oscuro')
        },
        { 
          text: 'Automático', 
          onPress: () => actualizarConfiguracion('tema', 'Automático')
        }
      ]
    );
  };

  const renderConfiguracionItem = (item: ConfiguracionItem, index: number) => (
    <View key={index} style={styles.configItem}>
      <View style={styles.configItemLeft}>
        <Ionicons name={item.icono as any} size={20} color={vetTheme.colors.text.secondary} style={styles.configIcon} />
        <View style={styles.configInfo}>
          <Text style={styles.configTitulo}>{item.titulo}</Text>
          {item.descripcion && (
            <Text style={styles.configDescripcion}>{item.descripcion}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.configItemRight}>
        {item.tipo === 'switch' && (
          <Switch
            value={item.valor}
            onValueChange={item.onChange}
            trackColor={{ 
              false: vetTheme.colors.border.medium, 
              true: `${vetTheme.colors.primary}50` 
            }}
            thumbColor={item.valor ? vetTheme.colors.primary : vetTheme.colors.text.light}
          />
        )}
        {item.tipo === 'navigation' && (
          <TouchableOpacity onPress={item.onPress} style={styles.navigationButton}>
            <Ionicons name="chevron-forward" size={16} color={vetTheme.colors.text.light} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuraciones</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {secciones.map((seccion, sectionIndex) => (
          <View key={sectionIndex} style={styles.seccion}>
            <Text style={styles.seccionTitulo}>{seccion.titulo}</Text>
            <View style={styles.seccionContent}>
              {seccion.items.map((item, itemIndex) => 
                renderConfiguracionItem(item, itemIndex)
              )}
            </View>
          </View>
        ))}

        <View style={styles.guardarContainer}>
          <TouchableOpacity style={styles.guardarButton}>
            <Text style={styles.guardarButtonText}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Las configuraciones se guardan automáticamente en tu dispositivo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  backButton: {
    padding: vetTheme.spacing.sm,
    marginLeft: -vetTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  seccion: {
    backgroundColor: 'white',
    marginTop: vetTheme.spacing.sm,
  },
  seccionTitulo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    paddingHorizontal: vetTheme.spacing.lg,
    paddingTop: vetTheme.spacing.lg,
    paddingBottom: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seccionContent: {
    paddingHorizontal: vetTheme.spacing.lg,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vetTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  configItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  configIcon: {
    marginRight: vetTheme.spacing.md,
  },
  configInfo: {
    flex: 1,
  },
  configTitulo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: 2,
  },
  configDescripcion: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    lineHeight: 18,
  },
  configItemRight: {
    marginLeft: vetTheme.spacing.md,
  },
  navigationButton: {
    padding: vetTheme.spacing.xs,
  },
  guardarContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
  },
  guardarButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.md,
    paddingHorizontal: vetTheme.spacing.xl,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
  },
  guardarButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: 'white',
  },
  infoContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingBottom: vetTheme.spacing.xl,
  },
  infoText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConfiguracionesScreen;