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
import { ownerTheme } from '../constants/ownerTheme';

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

  const renderVeterinarioItem = ({ item, index }: { item: MockVeterinario; index: number }) => (
    <VetSearchCard
      veterinario={item}
      onPress={() => abrirPerfilVeterinario(item)}
      index={index}
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
                  color={filtros.aceptaUrgencias ? 'white' : ownerTheme.colors.text.secondary} 
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
                  color={filtros.serviciosDomicilio ? 'white' : ownerTheme.colors.text.secondary} 
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
          <Ionicons name="arrow-back" size={24} color={ownerTheme.colors.textPrimary} />
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
          <Ionicons name="search" size={20} color={ownerTheme.colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, especialidad o servicio"
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor={ownerTheme.colors.text.light}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={ownerTheme.colors.text.light} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setMostrarFiltros(true)}
        >
          <Ionicons name="options" size={20} color={ownerTheme.colors.primary} />
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
            color={vistaActiva === 'lista' ? ownerTheme.colors.primary : ownerTheme.colors.text.secondary} 
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
            color={vistaActiva === 'mapa' ? ownerTheme.colors.primary : ownerTheme.colors.text.secondary} 
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
              <Ionicons name="search" size={48} color={ownerTheme.colors.text.light} />
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
    backgroundColor: ownerTheme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ownerTheme.spacing.lg,
    paddingVertical: ownerTheme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: ownerTheme.colors.border.light,
  },
  backButton: {
    padding: ownerTheme.spacing.sm,
    marginLeft: -ownerTheme.spacing.sm,
    marginRight: ownerTheme.spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: ownerTheme.typography.weights.bold,
    color: ownerTheme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: ownerTheme.typography.sizes.sm,
    color: ownerTheme.colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: ownerTheme.spacing.lg,
    paddingVertical: ownerTheme.spacing.md,
    backgroundColor: 'white',
    gap: ownerTheme.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ownerTheme.colors.surface,
    borderRadius: ownerTheme.borderRadius.lg,
    paddingHorizontal: ownerTheme.spacing.md,
    paddingVertical: ownerTheme.spacing.sm,
    borderWidth: 1,
    borderColor: ownerTheme.colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.primary,
    marginLeft: ownerTheme.spacing.sm,
  },
  filterButton: {
    backgroundColor: ownerTheme.colors.surface,
    borderRadius: ownerTheme.borderRadius.lg,
    paddingHorizontal: ownerTheme.spacing.md,
    paddingVertical: ownerTheme.spacing.sm,
    borderWidth: 1,
    borderColor: ownerTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: ownerTheme.colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ownerTheme.spacing.md,
    gap: ownerTheme.spacing.xs,
  },
  tabActivo: {
    borderBottomWidth: 2,
    borderBottomColor: ownerTheme.colors.primary,
  },
  tabText: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.secondary,
  },
  tabTextActivo: {
    color: ownerTheme.colors.primary,
    fontWeight: ownerTheme.typography.weights.medium,
  },
  listaContainer: {
    paddingVertical: ownerTheme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ownerTheme.spacing.xl,
    paddingVertical: ownerTheme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: ownerTheme.typography.sizes.lg,
    fontWeight: ownerTheme.typography.weights.medium,
    color: ownerTheme.colors.text.secondary,
    marginTop: ownerTheme.spacing.md,
    marginBottom: ownerTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.light,
    textAlign: 'center',
  },
  mapa: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: ownerTheme.colors.primary,
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
    borderTopColor: ownerTheme.colors.primary,
    marginTop: -2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: ownerTheme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ownerTheme.spacing.lg,
    paddingVertical: ownerTheme.spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: ownerTheme.colors.border.light,
  },
  modalCancelText: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.secondary,
  },
  modalTitle: {
    fontSize: ownerTheme.typography.sizes.lg,
    fontWeight: ownerTheme.typography.weights.semiBold,
    color: ownerTheme.colors.text.primary,
  },
  modalResetText: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.primary,
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  filtroItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ownerTheme.spacing.lg,
    paddingVertical: ownerTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ownerTheme.colors.border.light,
  },
  filtroTitulo: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.primary,
  },
  filtroValor: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.secondary,
  },
  filtrosBooleanos: {
    padding: ownerTheme.spacing.lg,
    gap: ownerTheme.spacing.md,
  },
  filtroBooleano: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ownerTheme.colors.surface,
    paddingHorizontal: ownerTheme.spacing.md,
    paddingVertical: ownerTheme.spacing.md,
    borderRadius: ownerTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ownerTheme.colors.border.medium,
  },
  filtroBooleanoActivo: {
    backgroundColor: ownerTheme.colors.primary,
    borderColor: ownerTheme.colors.primary,
  },
  filtroBooleanoTexto: {
    fontSize: ownerTheme.typography.sizes.md,
    color: ownerTheme.colors.text.secondary,
    marginLeft: ownerTheme.spacing.sm,
  },
  filtroBooleanoTextoActivo: {
    color: 'white',
  },
  modalFooter: {
    paddingHorizontal: ownerTheme.spacing.lg,
    paddingVertical: ownerTheme.spacing.lg,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: ownerTheme.colors.border.light,
  },
  aplicarFiltrosButton: {
    backgroundColor: ownerTheme.colors.primary,
    paddingVertical: ownerTheme.spacing.lg,
    borderRadius: ownerTheme.borderRadius.md,
    alignItems: 'center',
  },
  aplicarFiltrosText: {
    fontSize: ownerTheme.typography.sizes.md,
    fontWeight: ownerTheme.typography.weights.semiBold,
    color: 'white',
  },
});

export default VetSearchScreen;