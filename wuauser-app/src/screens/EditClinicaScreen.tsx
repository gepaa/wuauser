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
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { vetTheme } from '../constants/vetTheme';

interface EditClinicaScreenProps {
  navigation: any;
}

interface FotoConsultorio {
  id: string;
  uri: string;
  tipo: 'exterior' | 'sala_espera' | 'consultorio' | 'equipo';
}

interface CertificacionInfo {
  id: string;
  nombre: string;
  uri: string;
}

export const EditClinicaScreen: React.FC<EditClinicaScreenProps> = ({ navigation }) => {
  const [consultorioData, setConsultorioData] = useState({
    nombre: 'Clínica Veterinaria San Pablo',
    direccion: 'Av. Insurgentes Sur 1234, Col. del Valle',
    telefono: '55-1234-5678',
    descripcion: 'Clínica veterinaria especializada en medicina general y cirugía menor. Contamos con equipo moderno y veterinarios certificados.',
    zonaCobertura: 10,
    aceptaUrgencias: true,
    serviciosDomicilio: true,
  });

  const [fotos, setFotos] = useState<FotoConsultorio[]>([
    {
      id: '1',
      uri: 'https://via.placeholder.com/300x200',
      tipo: 'exterior'
    },
    {
      id: '2', 
      uri: 'https://via.placeholder.com/300x200',
      tipo: 'sala_espera'
    }
  ]);

  const [certificaciones, setCertificaciones] = useState<CertificacionInfo[]>([
    {
      id: '1',
      nombre: 'Cédula Profesional',
      uri: 'https://via.placeholder.com/200x300'
    }
  ]);

  const [loading, setLoading] = useState(false);

  const actualizarDatos = (key: string, valor: any) => {
    setConsultorioData(prev => ({
      ...prev,
      [key]: valor
    }));
  };

  const seleccionarFoto = async (tipo: FotoConsultorio['tipo']) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const nuevaFoto: FotoConsultorio = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          tipo: tipo
        };
        setFotos(prev => [...prev, nuevaFoto]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const eliminarFoto = (id: string) => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => setFotos(prev => prev.filter(foto => foto.id !== id))
        }
      ]
    );
  };

  const subirCertificacion = async () => {
    try {
      const result = await ImagePicker.launchDocumentPickerAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (!result.canceled) {
        const nuevaCert: CertificacionInfo = {
          id: Date.now().toString(),
          nombre: `Certificado ${certificaciones.length + 1}`,
          uri: result.assets[0].uri
        };
        setCertificaciones(prev => [...prev, nuevaCert]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el documento');
    }
  };

  const guardarCambios = async () => {
    setLoading(true);
    try {
      // Aquí iría la llamada a la API para guardar
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Éxito', 'Configuración del consultorio guardada correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const renderFotoItem = ({ item }: { item: FotoConsultorio }) => (
    <View style={styles.fotoContainer}>
      <Image source={{ uri: item.uri }} style={styles.fotoPreview} />
      <TouchableOpacity 
        style={styles.eliminarFotoBtn}
        onPress={() => eliminarFoto(item.id)}
      >
        <Ionicons name="close-circle" size={20} color={vetTheme.colors.status.error} />
      </TouchableOpacity>
      <Text style={styles.fotoTipo}>{item.tipo.replace('_', ' ')}</Text>
    </View>
  );

  const renderCertificacionItem = ({ item }: { item: CertificacionInfo }) => (
    <View style={styles.certificacionItem}>
      <Ionicons name="document-text" size={24} color={vetTheme.colors.primary} />
      <Text style={styles.certificacionNombre}>{item.nombre}</Text>
      <TouchableOpacity
        onPress={() => setCertificaciones(prev => prev.filter(cert => cert.id !== item.id))}
      >
        <Ionicons name="trash-outline" size={20} color={vetTheme.colors.status.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar Consultorio</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Información Básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Consultorio</Text>
              <TextInput
                style={styles.textInput}
                value={consultorioData.nombre}
                onChangeText={(text) => actualizarDatos('nombre', text)}
                placeholder="Ej: Clínica Veterinaria San Pablo"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección Completa</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={consultorioData.direccion}
                onChangeText={(text) => actualizarDatos('direccion', text)}
                placeholder="Calle, número, colonia, ciudad"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono de Contacto</Text>
              <TextInput
                style={styles.textInput}
                value={consultorioData.telefono}
                onChangeText={(text) => actualizarDatos('telefono', text)}
                placeholder="55-1234-5678"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción del Consultorio</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                value={consultorioData.descripcion}
                onChangeText={(text) => actualizarDatos('descripcion', text)}
                placeholder="Describe tu consultorio, especialidades y servicios"
                multiline
                numberOfLines={4}
                maxLength={250}
              />
              <Text style={styles.charCount}>{consultorioData.descripcion.length}/250</Text>
            </View>
          </View>
        </View>

        {/* Fotos del Consultorio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fotos del Consultorio</Text>
          <Text style={styles.sectionSubtitle}>Sube hasta 6 fotos para mostrar tu consultorio</Text>
          
          <FlatList
            data={fotos}
            renderItem={renderFotoItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.fotosLista}
          />
          
          {fotos.length < 6 && (
            <View style={styles.agregarFotosContainer}>
              <TouchableOpacity 
                style={styles.agregarFotoBtn}
                onPress={() => seleccionarFoto('exterior')}
              >
                <Ionicons name="camera-outline" size={24} color={vetTheme.colors.primary} />
                <Text style={styles.agregarFotoText}>Foto Exterior</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.agregarFotoBtn}
                onPress={() => seleccionarFoto('sala_espera')}
              >
                <Ionicons name="people-outline" size={24} color={vetTheme.colors.primary} />
                <Text style={styles.agregarFotoText}>Sala de Espera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.agregarFotoBtn}
                onPress={() => seleccionarFoto('consultorio')}
              >
                <Ionicons name="medical-outline" size={24} color={vetTheme.colors.primary} />
                <Text style={styles.agregarFotoText}>Consultorio</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.agregarFotoBtn}
                onPress={() => seleccionarFoto('equipo')}
              >
                <Ionicons name="hardware-chip-outline" size={24} color={vetTheme.colors.primary} />
                <Text style={styles.agregarFotoText}>Equipo Médico</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Certificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificaciones y Documentos</Text>
          <Text style={styles.sectionSubtitle}>Sube tu cédula profesional y certificados</Text>
          
          <FlatList
            data={certificaciones}
            renderItem={renderCertificacionItem}
            keyExtractor={(item) => item.id}
            style={styles.certificacionesLista}
          />
          
          <TouchableOpacity style={styles.subirDocumentoBtn} onPress={subirCertificacion}>
            <Ionicons name="document-attach-outline" size={20} color={vetTheme.colors.primary} />
            <Text style={styles.subirDocumentoText}>Subir Documento</Text>
          </TouchableOpacity>
        </View>

        {/* Configuraciones de Marketplace */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuraciones del Marketplace</Text>
          <View style={styles.sectionContent}>
            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Zona de Cobertura</Text>
                <Text style={styles.configDescription}>Radio de atención en kilómetros</Text>
              </View>
              <TextInput
                style={styles.numberInput}
                value={consultorioData.zonaCobertura.toString()}
                onChangeText={(text) => actualizarDatos('zonaCobertura', parseInt(text) || 0)}
                keyboardType="numeric"
              />
              <Text style={styles.kmText}>km</Text>
            </View>

            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Acepto Urgencias</Text>
                <Text style={styles.configDescription}>Atención de emergencias fuera de horario</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleBtn, consultorioData.aceptaUrgencias && styles.toggleBtnActive]}
                onPress={() => actualizarDatos('aceptaUrgencias', !consultorioData.aceptaUrgencias)}
              >
                <Text style={[styles.toggleText, consultorioData.aceptaUrgencias && styles.toggleTextActive]}>
                  {consultorioData.aceptaUrgencias ? 'SÍ' : 'NO'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.configRow}>
              <View style={styles.configInfo}>
                <Text style={styles.configLabel}>Servicios a Domicilio</Text>
                <Text style={styles.configDescription}>Visitas veterinarias en casa del cliente</Text>
              </View>
              <TouchableOpacity 
                style={[styles.toggleBtn, consultorioData.serviciosDomicilio && styles.toggleBtnActive]}
                onPress={() => actualizarDatos('serviciosDomicilio', !consultorioData.serviciosDomicilio)}
              >
                <Text style={[styles.toggleText, consultorioData.serviciosDomicilio && styles.toggleTextActive]}>
                  {consultorioData.serviciosDomicilio ? 'SÍ' : 'NO'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Botón Guardar */}
        <View style={styles.guardarContainer}>
          <TouchableOpacity 
            style={[styles.guardarButton, loading && styles.guardarButtonDisabled]}
            onPress={guardarCambios}
            disabled={loading}
          >
            <Text style={styles.guardarButtonText}>
              {loading ? 'Guardando...' : 'Guardar Configuración'}
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: vetTheme.spacing.sm,
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
    marginBottom: vetTheme.spacing.md,
  },
  sectionContent: {
    paddingHorizontal: vetTheme.spacing.lg,
  },
  inputGroup: {
    marginBottom: vetTheme.spacing.lg,
  },
  label: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.sm,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    backgroundColor: 'white',
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    textAlign: 'right',
    marginTop: vetTheme.spacing.xs,
  },
  fotosLista: {
    paddingHorizontal: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
  },
  fotoContainer: {
    marginRight: vetTheme.spacing.md,
    alignItems: 'center',
  },
  fotoPreview: {
    width: 120,
    height: 90,
    borderRadius: vetTheme.borderRadius.sm,
    backgroundColor: vetTheme.colors.surface,
  },
  eliminarFotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  fotoTipo: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    marginTop: vetTheme.spacing.xs,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  agregarFotosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: vetTheme.spacing.lg,
    gap: vetTheme.spacing.sm,
  },
  agregarFotoBtn: {
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: vetTheme.borderRadius.sm,
    paddingVertical: vetTheme.spacing.md,
    paddingHorizontal: vetTheme.spacing.sm,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  agregarFotoText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    marginTop: vetTheme.spacing.xs,
    textAlign: 'center',
  },
  certificacionesLista: {
    paddingHorizontal: vetTheme.spacing.lg,
    maxHeight: 200,
  },
  certificacionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.md,
    paddingHorizontal: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.sm,
    marginBottom: vetTheme.spacing.sm,
  },
  certificacionNombre: {
    flex: 1,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    marginLeft: vetTheme.spacing.md,
  },
  subirDocumentoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: vetTheme.borderRadius.sm,
    paddingVertical: vetTheme.spacing.md,
    marginHorizontal: vetTheme.spacing.lg,
    marginTop: vetTheme.spacing.sm,
  },
  subirDocumentoText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.primary,
    marginLeft: vetTheme.spacing.sm,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  configInfo: {
    flex: 1,
  },
  configLabel: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  configDescription: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: 2,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.sm,
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.md,
    textAlign: 'center',
    width: 60,
  },
  kmText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.xs,
  },
  toggleBtn: {
    backgroundColor: vetTheme.colors.border.medium,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.sm,
    minWidth: 50,
  },
  toggleBtnActive: {
    backgroundColor: vetTheme.colors.primary,
  },
  toggleText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: vetTheme.typography.weights.medium,
  },
  toggleTextActive: {
    color: 'white',
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

export default EditClinicaScreen;