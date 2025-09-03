import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../constants/vetTheme';

interface EditServiciosScreenProps {
  navigation: any;
}

interface ServicioBase {
  id: string;
  nombre: string;
  categoria: 'consulta' | 'preventivo' | 'cirugia' | 'diagnostico' | 'emergencia' | 'domicilio';
  duracionBase: number;
  icono: string;
  descripcionBase: string;
}

interface ServicioConfiguracion {
  servicioId: string;
  precio: number;
  duracion: number;
  descripcion: string;
  activo: boolean;
  requisitos?: string;
  politicaCancelacion?: string;
}

const serviciosBase: ServicioBase[] = [
  {
    id: '1',
    nombre: 'Consulta General',
    categoria: 'consulta',
    duracionBase: 30,
    icono: 'medical-outline',
    descripcionBase: 'Examen clínico completo y diagnóstico veterinario'
  },
  {
    id: '2',
    nombre: 'Vacunación',
    categoria: 'preventivo',
    duracionBase: 15,
    icono: 'shield-checkmark-outline',
    descripcionBase: 'Aplicación de vacunas según calendario veterinario'
  },
  {
    id: '3',
    nombre: 'Desparasitación',
    categoria: 'preventivo',
    duracionBase: 20,
    icono: 'bug-outline',
    descripcionBase: 'Tratamiento antiparasitario interno y externo'
  },
  {
    id: '4',
    nombre: 'Cirugía Menor',
    categoria: 'cirugia',
    duracionBase: 90,
    icono: 'cut-outline',
    descripcionBase: 'Procedimientos quirúrgicos ambulatorios'
  },
  {
    id: '5',
    nombre: 'Análisis Clínicos',
    categoria: 'diagnostico',
    duracionBase: 45,
    icono: 'flask-outline',
    descripcionBase: 'Estudios de laboratorio y diagnóstico'
  },
  {
    id: '6',
    nombre: 'Urgencias',
    categoria: 'emergencia',
    duracionBase: 60,
    icono: 'medical-sharp',
    descripcionBase: 'Atención de emergencias veterinarias'
  },
  {
    id: '7',
    nombre: 'Consulta a Domicilio',
    categoria: 'domicilio',
    duracionBase: 60,
    icono: 'home-outline',
    descripcionBase: 'Consulta veterinaria en casa del cliente'
  }
];

export const EditServiciosScreen: React.FC<EditServiciosScreenProps> = ({ navigation }) => {
  const [serviciosConfig, setServiciosConfig] = useState<ServicioConfiguracion[]>([
    {
      servicioId: '1',
      precio: 350,
      duracion: 30,
      descripcion: 'Examen clínico completo con diagnóstico profesional',
      activo: true,
      requisitos: 'Traer historial médico si existe',
      politicaCancelacion: 'Cancelación gratuita hasta 2 horas antes'
    },
    {
      servicioId: '2',
      precio: 200,
      duracion: 15,
      descripcion: 'Vacunación completa según edad y especie',
      activo: true,
      requisitos: 'Mascota en ayuno no requerido',
      politicaCancelacion: 'Cancelación gratuita hasta 1 hora antes'
    },
    {
      servicioId: '6',
      precio: 800,
      duracion: 60,
      descripcion: 'Atención inmediata para emergencias',
      activo: true,
      requisitos: 'Disponible 24/7',
      politicaCancelacion: 'Sin cancelación en emergencias'
    }
  ]);

  const [loading, setLoading] = useState(false);

  const obtenerServicioConfig = (servicioId: string): ServicioConfiguracion | undefined => {
    return serviciosConfig.find(config => config.servicioId === servicioId);
  };

  const actualizarServicioConfig = (servicioId: string, updates: Partial<ServicioConfiguracion>) => {
    setServiciosConfig(prev => {
      const existingIndex = prev.findIndex(config => config.servicioId === servicioId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...updates };
        return updated;
      } else {
        const servicioBase = serviciosBase.find(s => s.id === servicioId);
        if (servicioBase) {
          const newConfig: ServicioConfiguracion = {
            servicioId,
            precio: 0,
            duracion: servicioBase.duracionBase,
            descripcion: servicioBase.descripcionBase,
            activo: false,
            ...updates
          };
          return [...prev, newConfig];
        }
        return prev;
      }
    });
  };

  const toggleServicio = (servicioId: string) => {
    const config = obtenerServicioConfig(servicioId);
    actualizarServicioConfig(servicioId, { 
      activo: !config?.activo,
      precio: config?.precio || 0,
      duracion: config?.duracion || serviciosBase.find(s => s.id === servicioId)?.duracionBase || 30,
      descripcion: config?.descripcion || serviciosBase.find(s => s.id === servicioId)?.descripcionBase || ''
    });
  };

  const validarServicios = (): boolean => {
    const serviciosActivos = serviciosConfig.filter(config => config.activo);
    
    for (const servicio of serviciosActivos) {
      if (!servicio.precio || servicio.precio <= 0) {
        Alert.alert('Error', 'Todos los servicios activos deben tener un precio válido');
        return false;
      }
      if (!servicio.descripcion.trim()) {
        Alert.alert('Error', 'Todos los servicios activos deben tener una descripción');
        return false;
      }
    }
    
    if (serviciosActivos.length === 0) {
      Alert.alert('Error', 'Debes activar al menos un servicio');
      return false;
    }
    
    return true;
  };

  const guardarServicios = async () => {
    if (!validarServicios()) return;
    
    setLoading(true);
    try {
      // Aquí iría la llamada a la API
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Éxito', 'Catálogo de servicios guardado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const getCategoriaColor = (categoria: ServicioBase['categoria']) => {
    const colores = {
      consulta: vetTheme.colors.primary,
      preventivo: vetTheme.colors.status.success,
      cirugia: vetTheme.colors.status.warning,
      diagnostico: vetTheme.colors.status.info,
      emergencia: vetTheme.colors.status.error,
      domicilio: '#9C27B0'
    };
    return colores[categoria];
  };

  const renderServicioItem = (servicioBase: ServicioBase) => {
    const config = obtenerServicioConfig(servicioBase.id);
    const isActive = config?.activo || false;

    return (
      <View key={servicioBase.id} style={styles.servicioCard}>
        {/* Header del Servicio */}
        <View style={styles.servicioHeader}>
          <View style={styles.servicioHeaderLeft}>
            <View style={[styles.servicioIconContainer, { backgroundColor: `${getCategoriaColor(servicioBase.categoria)}20` }]}>
              <Ionicons 
                name={servicioBase.icono as any} 
                size={24} 
                color={getCategoriaColor(servicioBase.categoria)} 
              />
            </View>
            <View style={styles.servicioInfo}>
              <Text style={styles.servicioNombre}>{servicioBase.nombre}</Text>
              <Text style={styles.servicioCategoria}>{servicioBase.categoria.toUpperCase()}</Text>
            </View>
          </View>
          <Switch
            value={isActive}
            onValueChange={() => toggleServicio(servicioBase.id)}
            trackColor={{ 
              false: vetTheme.colors.border.medium, 
              true: `${vetTheme.colors.primary}50` 
            }}
            thumbColor={isActive ? vetTheme.colors.primary : vetTheme.colors.text.light}
          />
        </View>

        {/* Configuración del Servicio (solo si está activo) */}
        {isActive && (
          <View style={styles.servicioConfig}>
            {/* Precio y Duración */}
            <View style={styles.precioRow}>
              <View style={styles.precioGroup}>
                <Text style={styles.configLabel}>Precio</Text>
                <View style={styles.precioInputContainer}>
                  <Text style={styles.precioSymbol}>$</Text>
                  <TextInput
                    style={styles.precioInput}
                    value={config?.precio?.toString() || ''}
                    onChangeText={(text) => actualizarServicioConfig(servicioBase.id, { 
                      precio: parseInt(text) || 0 
                    })}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>
              
              <View style={styles.duracionGroup}>
                <Text style={styles.configLabel}>Duración</Text>
                <View style={styles.duracionInputContainer}>
                  <TextInput
                    style={styles.duracionInput}
                    value={config?.duracion?.toString() || servicioBase.duracionBase.toString()}
                    onChangeText={(text) => actualizarServicioConfig(servicioBase.id, { 
                      duracion: parseInt(text) || servicioBase.duracionBase 
                    })}
                    keyboardType="numeric"
                  />
                  <Text style={styles.duracionText}>min</Text>
                </View>
              </View>
            </View>

            {/* Descripción */}
            <View style={styles.configGroup}>
              <Text style={styles.configLabel}>Descripción del Servicio</Text>
              <TextInput
                style={styles.descripcionInput}
                value={config?.descripcion || servicioBase.descripcionBase}
                onChangeText={(text) => actualizarServicioConfig(servicioBase.id, { descripcion: text })}
                placeholder="Describe este servicio para tus clientes"
                multiline
                numberOfLines={2}
                maxLength={150}
              />
              <Text style={styles.charCount}>{(config?.descripcion || servicioBase.descripcionBase).length}/150</Text>
            </View>

            {/* Requisitos */}
            <View style={styles.configGroup}>
              <Text style={styles.configLabel}>Requisitos Especiales (Opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={config?.requisitos || ''}
                onChangeText={(text) => actualizarServicioConfig(servicioBase.id, { requisitos: text })}
                placeholder="Ej: Ayuno de 12 horas, traer historial médico"
                maxLength={100}
              />
            </View>

            {/* Política de Cancelación */}
            <View style={styles.configGroup}>
              <Text style={styles.configLabel}>Política de Cancelación</Text>
              <TextInput
                style={styles.textInput}
                value={config?.politicaCancelacion || 'Cancelación gratuita hasta 2 horas antes'}
                onChangeText={(text) => actualizarServicioConfig(servicioBase.id, { politicaCancelacion: text })}
                placeholder="Ej: Cancelación gratuita hasta 2 horas antes"
                maxLength={80}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  const serviciosActivos = serviciosConfig.filter(config => config.activo).length;
  const ingresosPotenciales = serviciosConfig
    .filter(config => config.activo)
    .reduce((total, config) => total + config.precio, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicios y Precios</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Resumen */}
      <View style={styles.resumenContainer}>
        <View style={styles.resumenCard}>
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>{serviciosActivos}</Text>
            <Text style={styles.resumenLabel}>Servicios Activos</Text>
          </View>
          <View style={styles.resumenDivider} />
          <View style={styles.resumenItem}>
            <Text style={styles.resumenValue}>${ingresosPotenciales}</Text>
            <Text style={styles.resumenLabel}>Ingresos Potenciales</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.serviciosContainer}>
          <Text style={styles.sectionTitle}>Catálogo de Servicios</Text>
          <Text style={styles.sectionSubtitle}>
            Activa los servicios que ofreces y configura precios competitivos
          </Text>
          
          {serviciosBase.map(renderServicioItem)}
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={vetTheme.colors.status.info} />
            <Text style={styles.infoText}>
              Los precios mostrados son lo que cobras por servicio. Wuauser maneja el pago y te transfiere el 90% del monto.
            </Text>
          </View>
        </View>

        {/* Botón Guardar */}
        <View style={styles.guardarContainer}>
          <TouchableOpacity 
            style={[styles.guardarButton, loading && styles.guardarButtonDisabled]}
            onPress={guardarServicios}
            disabled={loading}
          >
            <Text style={styles.guardarButtonText}>
              {loading ? 'Guardando...' : 'Guardar Catálogo'}
            </Text>
          </TouchableOpacity>
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
  resumenContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  resumenCard: {
    flexDirection: 'row',
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.md,
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenValue: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.primary,
  },
  resumenLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: vetTheme.spacing.xs,
  },
  resumenDivider: {
    width: 1,
    backgroundColor: vetTheme.colors.border.light,
    marginHorizontal: vetTheme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  serviciosContainer: {
    backgroundColor: 'white',
    paddingVertical: vetTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    paddingHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    paddingHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.lg,
  },
  servicioCard: {
    backgroundColor: 'white',
    borderRadius: vetTheme.borderRadius.md,
    marginHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  servicioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: vetTheme.spacing.md,
  },
  servicioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  servicioIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: vetTheme.spacing.md,
  },
  servicioInfo: {
    flex: 1,
  },
  servicioNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  servicioCategoria: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    marginTop: 2,
  },
  servicioConfig: {
    padding: vetTheme.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: vetTheme.colors.border.light,
  },
  precioRow: {
    flexDirection: 'row',
    marginBottom: vetTheme.spacing.md,
    gap: vetTheme.spacing.md,
  },
  precioGroup: {
    flex: 2,
  },
  duracionGroup: {
    flex: 1,
  },
  configLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
  },
  precioInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.sm,
    backgroundColor: 'white',
  },
  precioSymbol: {
    paddingLeft: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  precioInput: {
    flex: 1,
    paddingVertical: vetTheme.spacing.sm,
    paddingRight: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
  },
  duracionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.sm,
    backgroundColor: 'white',
  },
  duracionInput: {
    flex: 1,
    paddingVertical: vetTheme.spacing.sm,
    paddingLeft: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
  },
  duracionText: {
    paddingRight: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  configGroup: {
    marginBottom: vetTheme.spacing.md,
  },
  descripcionInput: {
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.sm,
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.primary,
    backgroundColor: 'white',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  textInput: {
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.sm,
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.primary,
    backgroundColor: 'white',
  },
  charCount: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
    textAlign: 'right',
    marginTop: vetTheme.spacing.xs,
  },
  infoContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${vetTheme.colors.status.info}10`,
    borderRadius: vetTheme.borderRadius.sm,
    padding: vetTheme.spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.sm,
    lineHeight: 20,
  },
  guardarContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
  },
  guardarButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.lg,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
  },
  guardarButtonDisabled: {
    backgroundColor: vetTheme.colors.border.medium,
  },
  guardarButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: 'white',
  },
});

export default EditServiciosScreen;