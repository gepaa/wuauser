import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { mockVeterinarios, MockVeterinario, calcularDistancia, getProximaDisponibilidad } from '../data/mockVeterinarios';
import VetSearchCard from '../components/search/VetSearchCard';
import { vetTheme } from '../constants/vetTheme';

interface VetSearchScreenProps {
  navigation: any;
}

interface FiltrosBusqueda {
  distanciaMaxima: number;
  precioMin: number;
  precioMax: number;
  servicios: string[];
  ratingMinimo: number;
  disponibilidad: string;
  aceptaUrgencias: boolean;
  serviciosDomicilio: boolean;
}

type VistaActiva = 'lista' | 'mapa';

const { width, height } = Dimensions.get('window');

const filtrosIniciales: FiltrosBusqueda = {
  distanciaMaxima: 10,
  precioMin: 0,
  precioMax: 5000,
  servicios: [],
  ratingMinimo: 0,
  disponibilidad: 'cualquiera',
  aceptaUrgencias: false,
  serviciosDomicilio: false,
};

export const VetSearchScreen: React.FC<VetSearchScreenProps> = ({ navigation }) => {
  const [busqueda, setBusqueda] = useState('');
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{lat: number, lng: number} | null>(null);
  const [veterinarios, setVeterinarios] = useState<MockVeterinario[]>([]);
  const [veterinariosFiltrados, setVeterinariosFiltrados] = useState<MockVeterinario[]>([]);
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('lista');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosBusqueda>(filtrosIniciales);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerUbicacion();
    cargarVeterinarios();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [busqueda, filtros, veterinarios]);

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a tu ubicación para encontrar veterinarios cerca de ti.');
        // Usar ubicación por defecto (Centro de CDMX)
        setUbicacionUsuario({ lat: 19.4326, lng: -99.1332 });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUbicacionUsuario({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Usar ubicación por defecto
      setUbicacionUsuario({ lat: 19.4326, lng: -99.1332 });
    }
  };

  const cargarVeterinarios = async () => {
    setCargando(true);
    try {
      // Simular carga desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVeterinarios(mockVeterinarios);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los veterinarios');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...veterinarios];

    // Calcular distancias y agregar disponibilidad
    if (ubicacionUsuario) {
      resultado = resultado.map(vet => ({
        ...vet,
        distancia: calcularDistancia(
          ubicacionUsuario.lat,
          ubicacionUsuario.lng,
          vet.ubicacion.lat,
          vet.ubicacion.lng
        ),
        proximaDisponibilidad: getProximaDisponibilidad(vet.id)
      }));

      // Filtrar por distancia
      resultado = resultado.filter(vet => (vet.distancia || 0) <= filtros.distanciaMaxima);
    }

    // Filtrar por búsqueda de texto
    if (busqueda.trim()) {
      const textoBusqueda = busqueda.toLowerCase();
      resultado = resultado.filter(vet => 
        vet.nombre.toLowerCase().includes(textoBusqueda) ||
        vet.especialidad.toLowerCase().includes(textoBusqueda) ||
        vet.clinica.nombre.toLowerCase().includes(textoBusqueda) ||
        vet.servicios.some(s => s.nombre.toLowerCase().includes(textoBusqueda))
      );
    }

    // Filtrar por precio
    resultado = resultado.filter(vet => {
      const precioMinimo = Math.min(...vet.servicios.map(s => s.precio));
      return precioMinimo >= filtros.precioMin && precioMinimo <= filtros.precioMax;
    });

    // Filtrar por rating
    if (filtros.ratingMinimo > 0) {
      resultado = resultado.filter(vet => vet.rating >= filtros.ratingMinimo);
    }

    // Filtrar por servicios específicos
    if (filtros.servicios.length > 0) {
      resultado = resultado.filter(vet => 
        filtros.servicios.some(servicioFiltro =>
          vet.servicios.some(s => s.categoria === servicioFiltro || s.nombre.toLowerCase().includes(servicioFiltro.toLowerCase()))
        )
      );
    }

    // Filtrar por características especiales
    if (filtros.aceptaUrgencias) {
      resultado = resultado.filter(vet => vet.configuraciones.aceptaUrgencias);
    }

    if (filtros.serviciosDomicilio) {
      resultado = resultado.filter(vet => vet.configuraciones.serviciosDomicilio);
    }

    // Ordenar por distancia
    resultado.sort((a, b) => (a.distancia || 0) - (b.distancia || 0));

    setVeterinariosFiltrados(resultado);
  };

  const abrirPerfilVeterinario = (veterinario: MockVeterinario) => {
    navigation.navigate('VetProfileDetail', { veterinarioId: veterinario.id });
  };

  const renderVeterinarioItem = ({ item }: { item: MockVeterinario }) => (
    <VetSearchCard
      veterinario={item}
      onPress={() => abrirPerfilVeterinario(item)}
    />
  );

  const renderMapaMarker = (veterinario: MockVeterinario) => (
    <Marker
      key={veterinario.id}
      coordinate={{
        latitude: veterinario.ubicacion.lat,
        longitude: veterinario.ubicacion.lng
      }}
      title={veterinario.nombre}
      description={`${veterinario.especialidad} • ${veterinario.rating}⭐`}
      onCalloutPress={() => abrirPerfilVeterinario(veterinario)}
    >
      <View style={styles.markerContainer}>
        <View style={styles.marker}>
          <Ionicons name="medical" size={16} color="white" />
        </View>
        <View style={styles.markerTriangle} />
      </View>
    </Marker>
  );

  const FiltrosModal = () => (
    <Modal
      visible={mostrarFiltros}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setMostrarFiltros(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setMostrarFiltros(false)}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtros</Text>
          <TouchableOpacity onPress={() => {
            setFiltros(filtrosIniciales);
            setMostrarFiltros(false);
          }}>
            <Text style={styles.modalResetText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.modalContent}
          data={[
            {
              titulo: 'Distancia Máxima',
              tipo: 'distancia',
              valor: filtros.distanciaMaxima
            },
            {
              titulo: 'Rango de Precios',
              tipo: 'precio',
              valor: `$${filtros.precioMin} - $${filtros.precioMax}`
            },
            {
              titulo: 'Rating Mínimo',
              tipo: 'rating',
              valor: filtros.ratingMinimo
            }
          ]}
          renderItem={({ item }) => (
            <View style={styles.filtroItem}>
              <Text style={styles.filtroTitulo}>{item.titulo}</Text>
              <Text style={styles.filtroValor}>{item.valor}</Text>
            </View>
          )}
          keyExtractor={(item) => item.tipo}
          ListFooterComponent={() => (
            <View style={styles.filtrosBooleanos}>
              <TouchableOpacity
                style={[styles.filtroBooleano, filtros.aceptaUrgencias && styles.filtroBooleanoActivo]}
                onPress={() => setFiltros(prev => ({ ...prev, aceptaUrgencias: !prev.aceptaUrgencias }))}
              >
                <Ionicons 
                  name="medical" 
                  size={16} 
                  color={filtros.aceptaUrgencias ? 'white' : vetTheme.colors.text.secondary} 
                />
                <Text style={[
                  styles.filtroBooleanoTexto,
                  filtros.aceptaUrgencias && styles.filtroBooleanoTextoActivo
                ]}>
                  Acepta Urgencias
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filtroBooleano, filtros.serviciosDomicilio && styles.filtroBooleanoActivo]}
                onPress={() => setFiltros(prev => ({ ...prev, serviciosDomicilio: !prev.serviciosDomicilio }))}
              >
                <Ionicons 
                  name="home" 
                  size={16} 
                  color={filtros.serviciosDomicilio ? 'white' : vetTheme.colors.text.secondary} 
                />
                <Text style={[
                  styles.filtroBooleanoTexto,
                  filtros.serviciosDomicilio && styles.filtroBooleanoTextoActivo
                ]}>
                  Servicio a Domicilio
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.aplicarFiltrosButton}
            onPress={() => setMostrarFiltros(false)}
          >
            <Text style={styles.aplicarFiltrosText}>
              Aplicar Filtros ({veterinariosFiltrados.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Veterinarios</Text>
          <Text style={styles.headerSubtitle}>
            {ubicacionUsuario ? `${veterinariosFiltrados.length} cerca de ti` : 'Cargando ubicación...'}
          </Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={vetTheme.colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, especialidad o servicio"
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor={vetTheme.colors.text.light}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={vetTheme.colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setMostrarFiltros(true)}
        >
          <Ionicons name="options" size={20} color={vetTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs de vista */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, vistaActiva === 'lista' && styles.tabActivo]}
          onPress={() => setVistaActiva('lista')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={vistaActiva === 'lista' ? vetTheme.colors.primary : vetTheme.colors.text.secondary} 
          />
          <Text style={[
            styles.tabText,
            vistaActiva === 'lista' && styles.tabTextActivo
          ]}>
            Lista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, vistaActiva === 'mapa' && styles.tabActivo]}
          onPress={() => setVistaActiva('mapa')}
        >
          <Ionicons 
            name="map" 
            size={20} 
            color={vistaActiva === 'mapa' ? vetTheme.colors.primary : vetTheme.colors.text.secondary} 
          />
          <Text style={[
            styles.tabText,
            vistaActiva === 'mapa' && styles.tabTextActivo
          ]}>
            Mapa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {vistaActiva === 'lista' ? (
        <FlatList
          data={veterinariosFiltrados}
          renderItem={renderVeterinarioItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color={vetTheme.colors.text.light} />
              <Text style={styles.emptyTitle}>No se encontraron veterinarios</Text>
              <Text style={styles.emptySubtitle}>
                Intenta ajustar tus filtros de búsqueda
              </Text>
            </View>
          )}
        />
      ) : (
        ubicacionUsuario && (
          <MapView
            style={styles.mapa}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: ubicacionUsuario.lat,
              longitude: ubicacionUsuario.lng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {veterinariosFiltrados.map(renderMapaMarker)}
          </MapView>
        )
      )}

      <FiltrosModal />
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
    marginRight: vetTheme.spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: 'white',
    gap: vetTheme.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.lg,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    marginLeft: vetTheme.spacing.sm,
  },
  filterButton: {
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.lg,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vetTheme.spacing.md,
    gap: vetTheme.spacing.xs,
  },
  tabActivo: {
    borderBottomWidth: 2,
    borderBottomColor: vetTheme.colors.primary,
  },
  tabText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  tabTextActivo: {
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.medium,
  },
  listaContainer: {
    paddingVertical: vetTheme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: vetTheme.spacing.xl,
    paddingVertical: vetTheme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.secondary,
    marginTop: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.light,
    textAlign: 'center',
  },
  mapa: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: vetTheme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: vetTheme.colors.primary,
    marginTop: -2,
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  modalCancelText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  modalTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
  },
  modalResetText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.primary,
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  filtroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  filtroTitulo: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
  },
  filtroValor: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  filtrosBooleanos: {
    padding: vetTheme.spacing.lg,
    gap: vetTheme.spacing.md,
  },
  filtroBooleano: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vetTheme.colors.surface,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
  },
  filtroBooleanoActivo: {
    backgroundColor: vetTheme.colors.primary,
    borderColor: vetTheme.colors.primary,
  },
  filtroBooleanoTexto: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.sm,
  },
  filtroBooleanoTextoActivo: {
    color: 'white',
  },
  modalFooter: {
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.lg,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: vetTheme.colors.border.light,
  },
  aplicarFiltrosButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.lg,
    borderRadius: vetTheme.borderRadius.md,
    alignItems: 'center',
  },
  aplicarFiltrosText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: 'white',
  },
});

export default VetSearchScreen;