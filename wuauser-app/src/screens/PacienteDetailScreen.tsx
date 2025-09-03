import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { vetTheme } from '../constants/vetTheme';
import { veterinariaService, type Paciente, type Consulta } from '../services/veterinariaService';

// ID temporal del veterinario para pruebas
const TEMP_VET_ID = 'mock-vet-id';

interface NuevaConsultaData {
  fecha: string;
  tipo: Consulta['tipo'];
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: string;
  vacunas: string;
  peso: string;
  temperatura: string;
  observaciones: string;
  costo: string;
  proximaVisita: string;
}

const mockPacientes: Record<number, Paciente> = {
  1: {
    id: 1,
    nombre: 'Max',
    especie: 'Perro',
    raza: 'Golden Retriever',
    edad: '3 años',
    dueno: {
      nombre: 'Carlos Rodríguez',
      telefono: '55-1234-5678',
      email: 'carlos@email.com'
    },
    historial: [
      {
        id: 1,
        fecha: '2025-08-28',
        tipo: 'Consulta General',
        motivo: 'Revisión rutinaria',
        diagnostico: 'Mascota en excelente estado de salud',
        tratamiento: 'Continuar con alimentación actual y ejercicio regular',
        medicamentos: [],
        vacunas: ['Rabia - refuerzo'],
        peso: '28.5 kg',
        temperatura: '38.2°C',
        observaciones: 'Muy activo y sociable. Responde bien a comandos.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$800',
        proximaVisita: '2025-12-28'
      },
      {
        id: 2,
        fecha: '2025-06-15',
        tipo: 'Vacunación',
        motivo: 'Vacunas anuales',
        diagnostico: 'Estado general bueno',
        tratamiento: 'Aplicación de vacunas según calendario',
        medicamentos: [],
        vacunas: ['Polivalente', 'Tos de las perreras'],
        peso: '28.0 kg',
        temperatura: '38.0°C',
        observaciones: 'Toleró bien las vacunas. Sin reacciones adversas.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$600'
      },
      {
        id: 3,
        fecha: '2025-03-10',
        tipo: 'Control',
        motivo: 'Control post-esterilización',
        diagnostico: 'Recuperación excelente',
        tratamiento: 'Retirada de puntos. Alta médica.',
        medicamentos: ['Antibiótico - finalizado'],
        vacunas: [],
        peso: '27.8 kg',
        temperatura: '37.9°C',
        observaciones: 'Herida completamente cicatrizada. Muy buen estado.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$300'
      },
      {
        id: 4,
        fecha: '2025-02-25',
        tipo: 'Cirugía',
        motivo: 'Esterilización',
        diagnostico: 'Procedimiento exitoso',
        tratamiento: 'Orquiectomía bajo anestesia general',
        medicamentos: ['Antibiótico 7 días', 'Analgésico 5 días'],
        vacunas: [],
        peso: '28.2 kg',
        temperatura: '37.8°C',
        observaciones: 'Cirugía sin complicaciones. Control en 10 días.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$2500'
      },
      {
        id: 5,
        fecha: '2025-01-20',
        tipo: 'Consulta General',
        motivo: 'Chequeo general',
        diagnostico: 'Excelente salud general',
        tratamiento: 'Limpieza dental profiláctica',
        medicamentos: [],
        vacunas: [],
        peso: '28.1 kg',
        temperatura: '38.1°C',
        observaciones: 'Dientes en buen estado. Recomendado cepillado regular.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$700'
      }
    ]
  },
  2: {
    id: 2,
    nombre: 'Luna',
    especie: 'Gato',
    raza: 'Siamés',
    edad: '2 años',
    dueno: {
      nombre: 'María García',
      telefono: '55-9876-5432',
      email: 'maria@email.com'
    },
    historial: [
      {
        id: 1,
        fecha: '2025-08-30',
        tipo: 'Control',
        motivo: 'Control de asma felino',
        diagnostico: 'Asma controlada',
        tratamiento: 'Continuar con inhalador',
        medicamentos: ['Inhalador broncodilatador'],
        vacunas: [],
        peso: '3.2 kg',
        temperatura: '38.5°C',
        observaciones: 'Respiración normal. Dueña reporta menor frecuencia de episodios.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$500'
      },
      {
        id: 2,
        fecha: '2025-07-10',
        tipo: 'Emergencia',
        motivo: 'Crisis asmática',
        diagnostico: 'Asma felino agudo',
        tratamiento: 'Nebulización y medicación de emergencia',
        medicamentos: ['Corticoide inyectable', 'Broncodilatador'],
        vacunas: [],
        peso: '3.1 kg',
        temperatura: '39.0°C',
        observaciones: 'Respondió bien al tratamiento. Estabilizada después de 2 horas.',
        veterinario: 'Dr. Guidopablo81',
        costo: '$1200'
      },
      {
        id: 3,
        fecha: '2025-05-15',
        tipo: 'Especialista',
        motivo: 'Consulta cardiológica',
        diagnostico: 'Corazón normal, síntomas respiratorios',
        tratamiento: 'Descartada cardiopatía',
        medicamentos: [],
        vacunas: [],
        peso: '3.0 kg',
        temperatura: '38.3°C',
        observaciones: 'Ecocardiografía normal. Síntomas relacionados con asma.',
        veterinario: 'Dra. Especialista Cardio',
        costo: '$1800'
      }
    ]
  }
};

const PacienteAvatar: React.FC<{ nombre: string; especie: 'Perro' | 'Gato'; size?: number }> = ({ 
  nombre, 
  especie, 
  size = 80 
}) => {
  const inicial = nombre.charAt(0).toUpperCase();
  const backgroundColor = especie === 'Perro' ? vetTheme.colors.status.success : vetTheme.colors.status.info;
  
  return (
    <View style={[
      styles.avatar, 
      { 
        backgroundColor: `${backgroundColor}20`,
        width: size,
        height: size,
        borderRadius: size / 2
      }
    ]}>
      <Text style={[
        styles.avatarText, 
        { 
          color: backgroundColor,
          fontSize: size / 3
        }
      ]}>
        {inicial}
      </Text>
    </View>
  );
};

const ConsultaCard: React.FC<{ 
  consulta: Consulta; 
  onPress: () => void;
}> = ({ consulta, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const getTypeColor = (tipo: Consulta['tipo']) => {
    switch (tipo) {
      case 'Emergencia': return vetTheme.colors.status.error;
      case 'Cirugía': return vetTheme.colors.accent;
      case 'Vacunación': return vetTheme.colors.status.success;
      case 'Control': return vetTheme.colors.status.info;
      case 'Especialista': return vetTheme.colors.primary;
      default: return vetTheme.colors.status.success;
    }
  };

  const getTypeIcon = (tipo: Consulta['tipo']) => {
    switch (tipo) {
      case 'Emergencia': return 'alert-circle';
      case 'Cirugía': return 'cut';
      case 'Vacunación': return 'medical';
      case 'Control': return 'checkmark-circle';
      case 'Especialista': return 'people';
      default: return 'clipboard';
    }
  };

  return (
    <TouchableOpacity style={[
      styles.consultaCard,
      { borderLeftColor: getTypeColor(consulta.tipo) }
    ]} onPress={onPress}>
      <View style={styles.consultaHeader}>
        <View style={styles.consultaHeaderLeft}>
          <View style={[
            styles.tipoIconContainer,
            { backgroundColor: `${getTypeColor(consulta.tipo)}20` }
          ]}>
            <Ionicons 
              name={getTypeIcon(consulta.tipo) as any} 
              size={20} 
              color={getTypeColor(consulta.tipo)} 
            />
          </View>
          <View style={styles.consultaHeaderInfo}>
            <Text style={styles.consultaFecha}>{formatDate(consulta.fecha)}</Text>
            <Text style={[styles.consultaTipo, { color: getTypeColor(consulta.tipo) }]}>
              {consulta.tipo}
            </Text>
          </View>
        </View>
        <Text style={styles.consultaCosto}>{consulta.costo}</Text>
      </View>

      <Text style={styles.consultaMotivo}>{consulta.motivo}</Text>
      <Text style={styles.consultaDiagnostico}>{consulta.diagnostico}</Text>
      
      {(consulta.medicamentos.length > 0 || consulta.vacunas.length > 0) && (
        <View style={styles.consultaExtras}>
          {consulta.medicamentos.length > 0 && (
            <View style={styles.extraItem}>
              <Ionicons name="medical" size={14} color={vetTheme.colors.accent} />
              <Text style={styles.extraText}>{consulta.medicamentos.join(', ')}</Text>
            </View>
          )}
          {consulta.vacunas.length > 0 && (
            <View style={styles.extraItem}>
              <Ionicons name="shield-checkmark" size={14} color={vetTheme.colors.status.success} />
              <Text style={styles.extraText}>{consulta.vacunas.join(', ')}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.consultaFooter}>
        <Text style={styles.consultaVet}>Dr. {consulta.veterinario}</Text>
        <View style={styles.consultaVitals}>
          <Text style={styles.vitalText}>{consulta.peso}</Text>
          <Text style={styles.vitalText}>{consulta.temperatura}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const NuevaConsultaModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (consulta: NuevaConsultaData) => void;
  pacienteNombre: string;
}> = ({ visible, onClose, onSave, pacienteNombre }) => {
  const [formData, setFormData] = useState<NuevaConsultaData>({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Consulta General',
    motivo: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: '',
    vacunas: '',
    peso: '',
    temperatura: '',
    observaciones: '',
    costo: '',
    proximaVisita: ''
  });

  const tiposConsulta: Consulta['tipo'][] = [
    'Consulta General',
    'Emergencia', 
    'Vacunación',
    'Cirugía',
    'Control',
    'Especialista'
  ];

  const handleSave = () => {
    if (!formData.motivo || !formData.diagnostico || !formData.tratamiento) {
      Alert.alert('Error', 'Los campos motivo, diagnóstico y tratamiento son obligatorios');
      return;
    }

    onSave(formData);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Consulta General',
      motivo: '',
      diagnostico: '',
      tratamiento: '',
      medicamentos: '',
      vacunas: '',
      peso: '',
      temperatura: '',
      observaciones: '',
      costo: '',
      proximaVisita: ''
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Nueva Consulta - {pacienteNombre}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Fecha *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.fecha}
              onChangeText={(text) => setFormData({...formData, fecha: text})}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tipo de Consulta *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tipoChipsContainer}>
                {tiposConsulta.map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.tipoChip,
                      formData.tipo === tipo && styles.tipoChipActive
                    ]}
                    onPress={() => setFormData({...formData, tipo})}
                  >
                    <Text style={[
                      styles.tipoChipText,
                      formData.tipo === tipo && styles.tipoChipTextActive
                    ]}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Motivo de la visita *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.motivo}
              onChangeText={(text) => setFormData({...formData, motivo: text})}
              placeholder="Ej. Revisión rutinaria, síntomas específicos..."
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Diagnóstico *</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={formData.diagnostico}
              onChangeText={(text) => setFormData({...formData, diagnostico: text})}
              placeholder="Diagnóstico médico..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Tratamiento aplicado *</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={formData.tratamiento}
              onChangeText={(text) => setFormData({...formData, tratamiento: text})}
              placeholder="Descripción del tratamiento..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.twoColumnContainer}>
            <View style={styles.halfWidth}>
              <Text style={styles.formLabel}>Peso</Text>
              <TextInput
                style={styles.formInput}
                value={formData.peso}
                onChangeText={(text) => setFormData({...formData, peso: text})}
                placeholder="Ej. 28.5 kg"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.formLabel}>Temperatura</Text>
              <TextInput
                style={styles.formInput}
                value={formData.temperatura}
                onChangeText={(text) => setFormData({...formData, temperatura: text})}
                placeholder="Ej. 38.2°C"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Medicamentos recetados</Text>
            <TextInput
              style={styles.formInput}
              value={formData.medicamentos}
              onChangeText={(text) => setFormData({...formData, medicamentos: text})}
              placeholder="Separar por comas: Antibiótico, Analgésico..."
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Vacunas aplicadas</Text>
            <TextInput
              style={styles.formInput}
              value={formData.vacunas}
              onChangeText={(text) => setFormData({...formData, vacunas: text})}
              placeholder="Separar por comas: Rabia, Polivalente..."
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Costo de la consulta</Text>
            <TextInput
              style={styles.formInput}
              value={formData.costo}
              onChangeText={(text) => setFormData({...formData, costo: text})}
              placeholder="Ej. $800"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Próxima visita recomendada</Text>
            <TextInput
              style={styles.formInput}
              value={formData.proximaVisita}
              onChangeText={(text) => setFormData({...formData, proximaVisita: text})}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Observaciones</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={formData.observaciones}
              onChangeText={(text) => setFormData({...formData, observaciones: text})}
              placeholder="Observaciones adicionales..."
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const ConsultaDetailModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  consulta: Consulta | null;
}> = ({ visible, onClose, consulta }) => {
  if (!consulta) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View />
          <Text style={styles.modalTitle}>Detalle de Consulta</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cerrar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Información General</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha:</Text>
              <Text style={styles.detailValue}>{formatDate(consulta.fecha)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo:</Text>
              <Text style={styles.detailValue}>{consulta.tipo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Veterinario:</Text>
              <Text style={styles.detailValue}>Dr. {consulta.veterinario}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Costo:</Text>
              <Text style={styles.detailValue}>{consulta.costo}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Consulta</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Motivo:</Text>
              <Text style={styles.detailValue}>{consulta.motivo}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Diagnóstico:</Text>
              <Text style={styles.detailValue}>{consulta.diagnostico}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tratamiento:</Text>
              <Text style={styles.detailValue}>{consulta.tratamiento}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Signos Vitales</Text>
            <View style={styles.twoColumnContainer}>
              <View style={styles.halfWidth}>
                <Text style={styles.detailLabel}>Peso:</Text>
                <Text style={styles.detailValue}>{consulta.peso}</Text>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.detailLabel}>Temperatura:</Text>
                <Text style={styles.detailValue}>{consulta.temperatura}</Text>
              </View>
            </View>
          </View>

          {(consulta.medicamentos.length > 0 || consulta.vacunas.length > 0) && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Medicación y Vacunas</Text>
              {consulta.medicamentos.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Medicamentos:</Text>
                  <Text style={styles.detailValue}>{consulta.medicamentos.join(', ')}</Text>
                </View>
              )}
              {consulta.vacunas.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vacunas:</Text>
                  <Text style={styles.detailValue}>{consulta.vacunas.join(', ')}</Text>
                </View>
              )}
            </View>
          )}

          {consulta.observaciones && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Observaciones</Text>
              <Text style={styles.detailValue}>{consulta.observaciones}</Text>
            </View>
          )}

          {consulta.proximaVisita && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Próxima Visita</Text>
              <Text style={styles.detailValue}>
                {formatDate(consulta.proximaVisita)}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const PacienteDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { pacienteId, paciente: pacienteParam } = route.params as { 
    pacienteId: number; 
    paciente?: Paciente 
  };
  
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [showNuevaConsulta, setShowNuevaConsulta] = useState(false);
  const [showConsultaDetail, setShowConsultaDetail] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);

  useEffect(() => {
    // Use passed paciente object first, fallback to mock data by ID
    const pacienteData = pacienteParam || mockPacientes[pacienteId];
    if (pacienteData) {
      setPaciente(pacienteData);
      navigation.setOptions({
        title: `${pacienteData.nombre} - Historial`,
        headerBackTitle: 'Pacientes'
      });
    }
  }, [pacienteId, pacienteParam]);

  if (!paciente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Paciente no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = () => {
    Linking.openURL(`tel:${paciente.dueno.telefono}`);
  };

  const handleNewAppointment = () => {
    Alert.alert(
      'Nueva Cita',
      `¿Deseas crear una nueva cita para ${paciente.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Crear Cita', onPress: () => console.log('Navigate to new appointment') }
      ]
    );
  };

  const handleSaveConsulta = async (consultaData: NuevaConsultaData) => {
    if (!paciente) return;

    try {
      const { data: nuevaConsulta, error } = await veterinariaService.crearNuevaConsulta(
        paciente.id,
        TEMP_VET_ID,
        consultaData
      );

      if (error) {
        console.error('Error guardando consulta:', error);
        Alert.alert('Error', 'No se pudo guardar la consulta');
        return;
      }

      // Actualizar el historial local
      if (nuevaConsulta) {
        setPaciente(prev => prev ? {
          ...prev,
          historial: [nuevaConsulta, ...(prev.historial || [])]
        } : null);
      }

      setShowNuevaConsulta(false);
      Alert.alert('Éxito', 'Consulta agregada correctamente');
    } catch (err) {
      console.error('Error en handleSaveConsulta:', err);
      Alert.alert('Error', 'Error de conexión al guardar la consulta');
    }
  };

  const handleConsultaPress = (consulta: Consulta) => {
    setSelectedConsulta(consulta);
    setShowConsultaDetail(true);
  };

  const sortedHistorial = [...paciente.historial].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Patient Header */}
      <View style={styles.patientHeader}>
        <View style={styles.patientHeaderTop}>
          <PacienteAvatar nombre={paciente.nombre} especie={paciente.especie} />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{paciente.nombre}</Text>
            <Text style={styles.patientBreed}>{paciente.raza} • {paciente.edad}</Text>
            <Text style={styles.ownerName}>{paciente.dueno.nombre}</Text>
            <Text style={styles.ownerContact}>{paciente.dueno.telefono}</Text>
          </View>
          <View style={styles.patientActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color={vetTheme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleNewAppointment}>
              <Ionicons name="calendar" size={20} color={vetTheme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.newConsultaButton}
          onPress={() => setShowNuevaConsulta(true)}
        >
          <Ionicons name="add" size={20} color={vetTheme.colors.background} />
          <Text style={styles.newConsultaButtonText}>Nueva Consulta</Text>
        </TouchableOpacity>
      </View>

      {/* Medical History */}
      <View style={styles.historialSection}>
        <View style={styles.historialHeader}>
          <Text style={styles.historialTitle}>Historial Médico</Text>
          <Text style={styles.historialCount}>{sortedHistorial.length} consulta{sortedHistorial.length !== 1 ? 's' : ''}</Text>
        </View>

        <FlatList
          data={sortedHistorial}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ConsultaCard 
              consulta={item} 
              onPress={() => handleConsultaPress(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historialList}
        />
      </View>

      {/* Modals */}
      <NuevaConsultaModal
        visible={showNuevaConsulta}
        onClose={() => setShowNuevaConsulta(false)}
        onSave={handleSaveConsulta}
        pacienteNombre={paciente.nombre}
      />

      <ConsultaDetailModal
        visible={showConsultaDetail}
        onClose={() => setShowConsultaDetail(false)}
        consulta={selectedConsulta}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: vetTheme.typography.sizes.lg,
    color: vetTheme.colors.status.error,
  },
  patientHeader: {
    backgroundColor: vetTheme.colors.background,
    padding: vetTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  patientHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.lg,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: vetTheme.spacing.md,
  },
  avatarText: {
    fontWeight: vetTheme.typography.weights.bold,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
  },
  patientBreed: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.sm,
  },
  ownerName: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  ownerContact: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  patientActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: vetTheme.spacing.sm,
    marginLeft: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.md,
    backgroundColor: `${vetTheme.colors.primary}10`,
  },
  newConsultaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
  },
  newConsultaButtonText: {
    color: vetTheme.colors.background,
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    marginLeft: vetTheme.spacing.sm,
  },
  historialSection: {
    flex: 1,
    padding: vetTheme.spacing.lg,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.md,
  },
  historialTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
  },
  historialCount: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  historialList: {
    paddingBottom: vetTheme.spacing.xl,
  },
  consultaCard: {
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  consultaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.sm,
  },
  consultaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tipoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: vetTheme.spacing.md,
  },
  consultaHeaderInfo: {
    flex: 1,
  },
  consultaFecha: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  consultaTipo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
  },
  consultaCosto: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.primary,
  },
  consultaMotivo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
  },
  consultaDiagnostico: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.md,
  },
  consultaExtras: {
    marginBottom: vetTheme.spacing.md,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  extraText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.xs,
    flex: 1,
  },
  consultaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: vetTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: vetTheme.colors.border.light,
  },
  consultaVet: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
  },
  consultaVitals: {
    flexDirection: 'row',
  },
  vitalText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  modalTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
  },
  modalCancelButton: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  modalSaveButton: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.semiBold,
  },
  modalContent: {
    flex: 1,
    padding: vetTheme.spacing.lg,
  },
  formGroup: {
    marginBottom: vetTheme.spacing.lg,
  },
  formLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    borderRadius: vetTheme.borderRadius.md,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    backgroundColor: vetTheme.colors.background,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48,
  },
  tipoChipsContainer: {
    flexDirection: 'row',
    paddingVertical: vetTheme.spacing.sm,
  },
  tipoChip: {
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.full,
    backgroundColor: vetTheme.colors.background,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
    marginRight: vetTheme.spacing.sm,
  },
  tipoChipActive: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  tipoChipText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  tipoChipTextActive: {
    color: vetTheme.colors.background,
    fontWeight: vetTheme.typography.weights.semiBold,
  },
  detailSection: {
    marginBottom: vetTheme.spacing.xl,
  },
  detailSectionTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.md,
    paddingBottom: vetTheme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: vetTheme.colors.primary,
  },
  detailRow: {
    marginBottom: vetTheme.spacing.md,
  },
  detailLabel: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  detailValue: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    lineHeight: 22,
  },
});

export default PacienteDetailScreen;