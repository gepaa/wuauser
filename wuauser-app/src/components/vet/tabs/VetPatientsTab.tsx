import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../../../constants/vetTheme';
import { veterinariaService, type Paciente } from '../../../services/veterinariaService';

interface VetPatientsTabProps {
  navigation: any;
}

// ID temporal del veterinario para pruebas - en producción se obtendrá del contexto de autenticación
const TEMP_VET_ID = 'mock-vet-id';

// Mock data como fallback
const mockPacientes: Paciente[] = [
  {
    id: '1',
    nombre: 'Max',
    especie: 'Perro',
    raza: 'Golden Retriever',
    edad: '3 años',
    dueno: {
      nombre: 'Carlos Rodríguez',
      telefono: '55-1234-5678',
      email: 'carlos@email.com'
    },
    ultimaVisita: '2025-08-28',
    proximaCita: '2025-09-15',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: ['Pollo'],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 8,
      ultimoDiagnostico: 'Revisión rutinaria',
      peso: '28 kg'
    }
  },
  {
    id: '2',
    nombre: 'Luna',
    especie: 'Gato',
    raza: 'Siamés',
    edad: '2 años',
    dueno: {
      nombre: 'María García',
      telefono: '55-9876-5432',
      email: 'maria@email.com'
    },
    ultimaVisita: '2025-08-30',
    proximaCita: null,
    estado: 'activo',
    vacunasAlDia: false,
    alergias: [],
    condicionesMedicas: ['Asma felino'],
    foto: null,
    historialResumen: {
      totalVisitas: 5,
      ultimoDiagnostico: 'Control de asma',
      peso: '3.2 kg'
    }
  },
  {
    id: '3',
    nombre: 'Rocky',
    especie: 'Perro',
    raza: 'Bulldog Francés',
    edad: '5 años',
    dueno: {
      nombre: 'Ana López',
      telefono: '55-5555-1234',
      email: 'ana@email.com'
    },
    ultimaVisita: '2025-08-25',
    proximaCita: '2025-09-10',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: ['Polen'],
    condicionesMedicas: ['Dermatitis alérgica'],
    foto: null,
    historialResumen: {
      totalVisitas: 12,
      ultimoDiagnostico: 'Control dermatitis',
      peso: '12 kg'
    }
  },
  {
    id: '4',
    nombre: 'Mimi',
    especie: 'Gato',
    raza: 'Persa',
    edad: '4 años',
    dueno: {
      nombre: 'Jorge Hernández',
      telefono: '55-7777-8888',
      email: 'jorge@email.com'
    },
    ultimaVisita: '2025-08-20',
    proximaCita: '2025-09-20',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 6,
      ultimoDiagnostico: 'Limpieza dental',
      peso: '4.1 kg'
    }
  },
  {
    id: '5',
    nombre: 'Toby',
    especie: 'Perro',
    raza: 'Labrador',
    edad: '7 años',
    dueno: {
      nombre: 'Patricia Morales',
      telefono: '55-3333-4444',
      email: 'patricia@email.com'
    },
    ultimaVisita: '2025-08-15',
    proximaCita: null,
    estado: 'activo',
    vacunasAlDia: false,
    alergias: ['Soja', 'Trigo'],
    condicionesMedicas: ['Artritis'],
    foto: null,
    historialResumen: {
      totalVisitas: 15,
      ultimoDiagnostico: 'Control artritis',
      peso: '32 kg'
    }
  },
  {
    id: '6',
    nombre: 'Whiskers',
    especie: 'Gato',
    raza: 'Maine Coon',
    edad: '6 años',
    dueno: {
      nombre: 'Roberto Silva',
      telefono: '55-9999-0000',
      email: 'roberto@email.com'
    },
    ultimaVisita: '2025-08-18',
    proximaCita: '2025-09-18',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: ['Diabetes'],
    foto: null,
    historialResumen: {
      totalVisitas: 10,
      ultimoDiagnostico: 'Control diabetes',
      peso: '6.8 kg'
    }
  },
  {
    id: '7',
    nombre: 'Buddy',
    especie: 'Perro',
    raza: 'Beagle',
    edad: '2 años',
    dueno: {
      nombre: 'Laura Jiménez',
      telefono: '55-1111-2222',
      email: 'laura@email.com'
    },
    ultimaVisita: '2025-09-01',
    proximaCita: '2025-10-01',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 4,
      ultimoDiagnostico: 'Vacunación anual',
      peso: '15 kg'
    }
  },
  {
    id: '8',
    nombre: 'Garfield',
    especie: 'Gato',
    raza: 'Naranja común',
    edad: '5 años',
    dueno: {
      nombre: 'Miguel Vargas',
      telefono: '55-6666-7777',
      email: 'miguel@email.com'
    },
    ultimaVisita: '2025-08-22',
    proximaCita: null,
    estado: 'activo',
    vacunasAlDia: false,
    alergias: ['Pescado'],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 7,
      ultimoDiagnostico: 'Sobrepeso',
      peso: '5.5 kg'
    }
  },
  {
    id: '9',
    nombre: 'Bella',
    especie: 'Perro',
    raza: 'Pastor Alemán',
    edad: '4 años',
    dueno: {
      nombre: 'Carmen Ruiz',
      telefono: '55-8888-9999',
      email: 'carmen@email.com'
    },
    ultimaVisita: '2025-08-26',
    proximaCita: '2025-09-26',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: ['Displasia de cadera'],
    foto: null,
    historialResumen: {
      totalVisitas: 11,
      ultimoDiagnostico: 'Control displasia',
      peso: '26 kg'
    }
  },
  {
    id: '10',
    nombre: 'Shadow',
    especie: 'Gato',
    raza: 'Bombay',
    edad: '3 años',
    dueno: {
      nombre: 'Fernando Castro',
      telefono: '55-4444-5555',
      email: 'fernando@email.com'
    },
    ultimaVisita: '2025-08-29',
    proximaCita: '2025-09-12',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 6,
      ultimoDiagnostico: 'Revisión rutinaria',
      peso: '4.5 kg'
    }
  },
  {
    id: '11',
    nombre: 'Zeus',
    especie: 'Perro',
    raza: 'Rottweiler',
    edad: '6 años',
    dueno: {
      nombre: 'Sandra Mejía',
      telefono: '55-2222-3333',
      email: 'sandra@email.com'
    },
    ultimaVisita: '2025-08-12',
    proximaCita: null,
    estado: 'activo',
    vacunasAlDia: false,
    alergias: ['Pulgas'],
    condicionesMedicas: ['Problemas cardíacos'],
    foto: null,
    historialResumen: {
      totalVisitas: 14,
      ultimoDiagnostico: 'Control cardíaco',
      peso: '45 kg'
    }
  },
  {
    id: '12',
    nombre: 'Princess',
    especie: 'Gato',
    raza: 'Ragdoll',
    edad: '1 año',
    dueno: {
      nombre: 'Daniela Torres',
      telefono: '55-7777-1111',
      email: 'daniela@email.com'
    },
    ultimaVisita: '2025-08-31',
    proximaCita: '2025-09-28',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 3,
      ultimoDiagnostico: 'Esterilización',
      peso: '2.8 kg'
    }
  },
  {
    id: '13',
    nombre: 'Charlie',
    especie: 'Perro',
    raza: 'Cocker Spaniel',
    edad: '8 años',
    dueno: {
      nombre: 'Raúl Mendoza',
      telefono: '55-5555-6666',
      email: 'raul@email.com'
    },
    ultimaVisita: '2025-08-10',
    proximaCita: '2025-09-14',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: ['Ácaros'],
    condicionesMedicas: ['Cataratas'],
    foto: null,
    historialResumen: {
      totalVisitas: 18,
      ultimoDiagnostico: 'Control oftalmológico',
      peso: '16 kg'
    }
  },
  {
    id: '14',
    nombre: 'Nala',
    especie: 'Gato',
    raza: 'Bengalí',
    edad: '2 años',
    dueno: {
      nombre: 'Mónica Ramos',
      telefono: '55-9999-1111',
      email: 'monica@email.com'
    },
    ultimaVisita: '2025-08-27',
    proximaCita: null,
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 5,
      ultimoDiagnostico: 'Revisión rutinaria',
      peso: '3.8 kg'
    }
  },
  {
    id: '15',
    nombre: 'Rex',
    especie: 'Perro',
    raza: 'Doberman',
    edad: '5 años',
    dueno: {
      nombre: 'Alejandro Vega',
      telefono: '55-3333-7777',
      email: 'alejandro@email.com'
    },
    ultimaVisita: '2025-08-08',
    proximaCita: '2025-09-08',
    estado: 'activo',
    vacunasAlDia: false,
    alergias: [],
    condicionesMedicas: ['Torsión gástrica (historial)'],
    foto: null,
    historialResumen: {
      totalVisitas: 13,
      ultimoDiagnostico: 'Control post-quirúrgico',
      peso: '38 kg'
    }
  },
  {
    id: '16',
    nombre: 'Misty',
    especie: 'Gato',
    raza: 'Azul Ruso',
    edad: '7 años',
    dueno: {
      nombre: 'Valeria Ortega',
      telefono: '55-8888-2222',
      email: 'valeria@email.com'
    },
    ultimaVisita: '2025-08-14',
    proximaCita: '2025-09-21',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: ['Lácteos'],
    condicionesMedicas: ['Insuficiencia renal'],
    foto: null,
    historialResumen: {
      totalVisitas: 16,
      ultimoDiagnostico: 'Control renal',
      peso: '3.6 kg'
    }
  },
  {
    id: '17',
    nombre: 'Bruno',
    especie: 'Perro',
    raza: 'Boxer',
    edad: '3 años',
    dueno: {
      nombre: 'Ricardo Peña',
      telefono: '55-4444-8888',
      email: 'ricardo@email.com'
    },
    ultimaVisita: '2025-09-02',
    proximaCita: '2025-10-02',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 7,
      ultimoDiagnostico: 'Vacunación anual',
      peso: '30 kg'
    }
  },
  {
    id: '18',
    nombre: 'Cleo',
    especie: 'Gato',
    raza: 'Esfinge',
    edad: '4 años',
    dueno: {
      nombre: 'Esperanza Cruz',
      telefono: '55-6666-3333',
      email: 'esperanza@email.com'
    },
    ultimaVisita: '2025-08-24',
    proximaCita: null,
    estado: 'activo',
    vacunasAlDia: false,
    alergias: ['Productos de limpieza'],
    condicionesMedicas: ['Piel sensible'],
    foto: null,
    historialResumen: {
      totalVisitas: 9,
      ultimoDiagnostico: 'Dermatitis',
      peso: '4.2 kg'
    }
  },
  {
    id: '19',
    nombre: 'Rocco',
    especie: 'Perro',
    raza: 'Husky Siberiano',
    edad: '2 años',
    dueno: {
      nombre: 'Gabriela Moreno',
      telefono: '55-1111-9999',
      email: 'gabriela@email.com'
    },
    ultimaVisita: '2025-08-30',
    proximaCita: '2025-09-30',
    estado: 'activo',
    vacunasAlDia: true,
    alergias: [],
    condicionesMedicas: [],
    foto: null,
    historialResumen: {
      totalVisitas: 4,
      ultimoDiagnostico: 'Chequeo general',
      peso: '22 kg'
    }
  },
  {
    id: '20',
    nombre: 'Mittens',
    especie: 'Gato',
    raza: 'Calico',
    edad: '9 años',
    dueno: {
      nombre: 'Octavio Sandoval',
      telefono: '55-7777-4444',
      email: 'octavio@email.com'
    },
    ultimaVisita: '2025-08-05',
    proximaCita: '2025-09-05',
    estado: 'activo',
    vacunasAlDia: false,
    alergias: [],
    condicionesMedicas: ['Hipertiroidismo'],
    foto: null,
    historialResumen: {
      totalVisitas: 22,
      ultimoDiagnostico: 'Control hormonal',
      peso: '3.1 kg'
    }
  }
];

type SortOption = 'nombre' | 'ultimaVisita' | 'proximaCita';

const PacienteAvatar: React.FC<{ nombre: string; especie: 'Perro' | 'Gato' }> = ({ nombre, especie }) => {
  const inicial = nombre.charAt(0).toUpperCase();
  const backgroundColor = especie === 'Perro' ? vetTheme.colors.status.success : vetTheme.colors.status.info;
  
  return (
    <View style={[styles.avatar, { backgroundColor: `${backgroundColor}20` }]}>
      <Text style={[styles.avatarText, { color: backgroundColor }]}>{inicial}</Text>
    </View>
  );
};

const PacienteCard: React.FC<{
  paciente: Paciente;
  onCall: () => void;
  onNewAppointment: () => void;
  onViewHistory: () => void;
}> = ({ paciente, onCall, onNewAppointment, onViewHistory }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <PacienteAvatar nombre={paciente.nombre} especie={paciente.especie} />
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.petName}>{paciente.nombre}</Text>
              <Text style={styles.petAge}>{paciente.edad}</Text>
            </View>
            <Text style={styles.ownerName}>{paciente.dueno.nombre}</Text>
            <Text style={styles.ownerPhone}>{paciente.dueno.telefono}</Text>
            <View style={styles.detailsRow}>
              <Text style={styles.breedText}>{paciente.raza}</Text>
              <View style={styles.indicators}>
                <View style={[
                  styles.indicator,
                  { backgroundColor: paciente.vacunasAlDia ? vetTheme.colors.status.success : vetTheme.colors.status.error }
                ]} />
                {paciente.alergias.length > 0 && (
                  <Ionicons name="warning" size={12} color={vetTheme.colors.status.warning} />
                )}
                {paciente.condicionesMedicas.length > 0 && (
                  <Ionicons name="medical" size={12} color={vetTheme.colors.status.error} />
                )}
              </View>
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onCall}>
            <Ionicons name="call" size={20} color={vetTheme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onNewAppointment}>
            <Ionicons name="calendar" size={20} color={vetTheme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onViewHistory}>
            <Ionicons name="document-text" size={20} color={vetTheme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          Última visita: {formatDate(paciente.ultimaVisita)}
        </Text>
        {paciente.proximaCita && (
          <Text style={styles.footerText}>
            Próxima: {formatDate(paciente.proximaCita)}
          </Text>
        )}
      </View>
    </View>
  );
};

const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="paw" size={64} color={vetTheme.colors.text.secondary} />
    </View>
    <Text style={styles.emptyTitle}>No tienes pacientes registrados</Text>
    <Text style={styles.emptySubtitle}>
      Cuando tengas pacientes registrados, aparecerán aquí
    </Text>
  </View>
);

const SearchEmptyState: React.FC<{ onClear: () => void }> = ({ onClear }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="search" size={64} color={vetTheme.colors.text.secondary} />
    </View>
    <Text style={styles.emptyTitle}>No se encontraron pacientes</Text>
    <Text style={styles.emptySubtitle}>
      Prueba con otro término de búsqueda
    </Text>
    <TouchableOpacity style={styles.clearButton} onPress={onClear}>
      <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
    </TouchableOpacity>
  </View>
);

export const VetPatientsTab: React.FC<VetPatientsTabProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [especieFilter, setEspecieFilter] = useState<'todos' | 'perro' | 'gato'>('todos');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'activos' | 'inactivos'>('activos');
  const [sortBy, setSortBy] = useState<SortOption>('nombre');
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar pacientes al montar el componente
  useEffect(() => {
    loadPacientes();
  }, []);

  const loadPacientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await veterinariaService.getPacientesByVeterinario(TEMP_VET_ID);
      
      if (error) {
        console.error('Error cargando pacientes:', error);
        setError('Error al cargar los pacientes');
        // Usar datos mock como fallback
        setPacientes(mockPacientes);
      } else {
        setPacientes(data || mockPacientes);
      }
    } catch (err) {
      console.error('Error en loadPacientes:', err);
      setError('Error de conexión');
      setPacientes(mockPacientes);
    } finally {
      setLoading(false);
    }
  };

  const filteredPacientes = useMemo(() => {
    return pacientes
      .filter(p => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = p.nombre.toLowerCase().includes(searchLower) ||
                            p.dueno.nombre.toLowerCase().includes(searchLower);
        const matchesEspecie = especieFilter === 'todos' || 
                             p.especie.toLowerCase() === especieFilter;
        const matchesEstado = estadoFilter === 'todos' || p.estado === estadoFilter;
        
        return matchesSearch && matchesEspecie && matchesEstado;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'nombre':
            return a.nombre.localeCompare(b.nombre);
          case 'ultimaVisita':
            return new Date(b.ultimaVisita).getTime() - new Date(a.ultimaVisita).getTime();
          case 'proximaCita':
            if (!a.proximaCita && !b.proximaCita) return 0;
            if (!a.proximaCita) return 1;
            if (!b.proximaCita) return -1;
            return new Date(a.proximaCita).getTime() - new Date(b.proximaCita).getTime();
          default:
            return 0;
        }
      });
  }, [searchQuery, especieFilter, estadoFilter, sortBy]);

  const handleCall = (telefono: string) => {
    Linking.openURL(`tel:${telefono}`);
  };

  const handleNewAppointment = (paciente: Paciente) => {
    Alert.alert(
      'Nueva Cita',
      `¿Deseas crear una nueva cita para ${paciente.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Crear Cita', onPress: () => console.log('Navigate to new appointment') }
      ]
    );
  };

  const handleViewHistory = (paciente: Paciente) => {
    navigation.navigate('PacienteDetail', { 
      pacienteId: paciente.id,
      paciente: paciente
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPacientes();
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderFilterChips = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filtros:</Text>
      <View style={styles.chipRow}>
        {/* Especie Filters */}
        {['todos', 'perro', 'gato'].map((especie) => (
          <TouchableOpacity
            key={especie}
            style={[
              styles.filterChip,
              especieFilter === especie && styles.filterChipActive
            ]}
            onPress={() => setEspecieFilter(especie as any)}
          >
            <Text style={[
              styles.filterChipText,
              especieFilter === especie && styles.filterChipTextActive
            ]}>
              {especie === 'todos' ? 'Todos' : especie === 'perro' ? 'Perros' : 'Gatos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chipRow}>
        {/* Estado Filters */}
        {['activos', 'inactivos', 'todos'].map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.filterChip,
              estadoFilter === estado && styles.filterChipActive
            ]}
            onPress={() => setEstadoFilter(estado as any)}
          >
            <Text style={[
              styles.filterChipText,
              estadoFilter === estado && styles.filterChipTextActive
            ]}>
              {estado === 'activos' ? 'Activos' : estado === 'inactivos' ? 'Inactivos' : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={16} color={vetTheme.colors.primary} />
          <Text style={styles.sortButtonText}>Ordenar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSortModal = () => (
    <Modal visible={showSortModal} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
        <View style={styles.sortModal}>
          <Text style={styles.sortModalTitle}>Ordenar por:</Text>
          {[
            { key: 'nombre', label: 'Nombre' },
            { key: 'ultimaVisita', label: 'Última visita' },
            { key: 'proximaCita', label: 'Próxima cita' }
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                sortBy === option.key && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy(option.key as SortOption);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.key && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Ionicons name="checkmark" size={20} color={vetTheme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pacientes</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={vetTheme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar paciente o dueño..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={vetTheme.colors.text.secondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={vetTheme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderFilterChips()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredPacientes.length} paciente{filteredPacientes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredPacientes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PacienteCard
            paciente={item}
            onCall={() => handleCall(item.dueno.telefono)}
            onNewAppointment={() => handleNewAppointment(item)}
            onViewHistory={() => handleViewHistory(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          searchQuery.length > 0 ? 
            <SearchEmptyState onClear={clearSearch} /> : 
            <EmptyState />
        }
      />

      {renderSortModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  header: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingTop: vetTheme.spacing.md,
    paddingBottom: vetTheme.spacing.sm,
    backgroundColor: vetTheme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  headerTitle: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.md,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  searchInput: {
    flex: 1,
    marginLeft: vetTheme.spacing.sm,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
  },
  filtersContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.background,
  },
  filtersTitle: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: vetTheme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.full,
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    marginRight: vetTheme.spacing.sm,
    marginBottom: vetTheme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  filterChipText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: vetTheme.colors.background,
    fontWeight: vetTheme.typography.weights.semiBold,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.full,
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.primary,
  },
  sortButtonText: {
    marginLeft: vetTheme.spacing.xs,
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.medium,
  },
  resultsHeader: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.sm,
  },
  resultsCount: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    fontWeight: vetTheme.typography.weights.medium,
  },
  listContainer: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingBottom: vetTheme.spacing.xl,
  },
  card: {
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: vetTheme.spacing.md,
  },
  avatarText: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  petName: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginRight: vetTheme.spacing.sm,
  },
  petAge: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  ownerName: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginBottom: 2,
  },
  ownerPhone: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breedText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    flex: 1,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: vetTheme.spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: vetTheme.spacing.sm,
    marginLeft: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.md,
    backgroundColor: `${vetTheme.colors.primary}10`,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: vetTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: vetTheme.colors.border.light,
  },
  footerText: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vetTheme.spacing.xl * 2,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${vetTheme.colors.text.secondary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vetTheme.spacing.lg,
  },
  emptyTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    marginTop: vetTheme.spacing.lg,
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.sm,
    backgroundColor: vetTheme.colors.primary,
    borderRadius: vetTheme.borderRadius.md,
  },
  clearButtonText: {
    color: vetTheme.colors.background,
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.lg,
    margin: vetTheme.spacing.lg,
    minWidth: 250,
  },
  sortModalTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.md,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vetTheme.spacing.md,
    paddingHorizontal: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
  },
  sortOptionActive: {
    backgroundColor: `${vetTheme.colors.primary}10`,
  },
  sortOptionText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
  },
  sortOptionTextActive: {
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.semiBold,
  },
});

export default VetPatientsTab;