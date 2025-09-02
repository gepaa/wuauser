import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { vetTheme } from '../../../constants/vetTheme';
import { ViewMode, NuevaCitaData, Cita } from '../../../types/agenda';
import { generateMockCitas, mockDuenos } from '../../../constants/mockData';
import { NuevaCitaModal } from '../modals/NuevaCitaModal';
import { CalendarView } from '../calendar/CalendarView';
import { ViewModeSelector } from '../components/ViewModeSelector';

interface VetAgendaTabProps {
  navigation: any;
}

const estadoColors = {
  confirmada: '#2ECC71',    // Verde
  pendiente: '#F39C12',     // Naranja
  completada: '#95A5A6',    // Gris
  cancelada: '#E74C3C'      // Rojo
};

const estadoLabels = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const CitaCard: React.FC<{ cita: Cita; onCall: () => void; onChat: () => void }> = ({ cita, onCall, onChat }) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.citaCard,
          { borderLeftColor: estadoColors[cita.estado] }
        ]}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.citaContent}>
          <View style={styles.citaHeader}>
            <Text style={styles.citaHora}>{cita.hora}</Text>
            <View style={[
              styles.estadoBadge,
              { backgroundColor: estadoColors[cita.estado] }
            ]}>
              <Text style={styles.estadoText}>{estadoLabels[cita.estado]}</Text>
            </View>
          </View>
          
          <View style={styles.citaInfo}>
            <View style={styles.mascotaInfo}>
              <Ionicons name="paw" size={16} color={vetTheme.colors.primary} />
              <Text style={styles.mascotaNombre}>{cita.mascota}</Text>
            </View>
            
            <View style={styles.duenoInfo}>
              <Ionicons name="person" size={14} color={vetTheme.colors.text.secondary} />
              <Text style={styles.duenoNombre}>{cita.dueno}</Text>
            </View>
            
            <View style={styles.tipoInfo}>
              <Ionicons name="medical" size={14} color={vetTheme.colors.text.secondary} />
              <Text style={styles.tipoText}>{cita.tipo}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.citaAcciones}>
          <TouchableOpacity 
            style={[styles.accionButton, styles.callButton]}
            onPress={onCall}
          >
            <Ionicons name="call" size={18} color={vetTheme.colors.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accionButton, styles.chatButton]}
            onPress={onChat}
          >
            <Ionicons name="chatbubble" size={18} color={vetTheme.colors.accent} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const VetAgendaTab: React.FC<VetAgendaTabProps> = ({ navigation }) => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showNewCitaModal, setShowNewCitaModal] = useState(false);

  useEffect(() => {
    loadCitas();
  }, []);

  const loadCitas = async () => {
    setIsLoading(true);
    // Simular carga de API
    setTimeout(() => {
      // Generar 30 días de citas mock
      const mockCitasGenerated = generateMockCitas();
      setCitas(mockCitasGenerated);
      setIsLoading(false);
    }, 800);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadCitas();
    setRefreshing(false);
  }, []);

  const formatFecha = (fecha: Date): string => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const today = new Date();
    if (fecha.toDateString() === today.toDateString()) {
      return `Hoy: ${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
    }
    
    return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  };

  const cambiarDia = (direccion: 'anterior' | 'siguiente') => {
    const nuevaFecha = new Date(fechaActual);
    if (direccion === 'anterior') {
      nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    } else {
      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    }
    setFechaActual(nuevaFecha);
  };

  // Get appointments for current selected date
  const citasDelDia = citas.filter(cita => 
    cita.fecha.toDateString() === fechaActual.toDateString()
  );

  const citasFiltradas = filtroEstado === 'todas' 
    ? citasDelDia 
    : citasDelDia.filter(cita => cita.estado === filtroEstado);

  const handleLlamar = (cita: Cita) => {
    Alert.alert(
      `Llamar a ${cita.dueno}`,
      `¿Deseas llamar al dueño de ${cita.mascota}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Llamar', 
          onPress: () => {
            Linking.openURL(`tel:${cita.telefono.replace(/-/g, '')}`);
          }
        }
      ]
    );
  };

  const handleChat = (cita: Cita) => {
    // Navegar a mensajes con ese cliente
    navigation.navigate('VetMessages', {
      contacto: {
        nombre: cita.dueno,
        mascota: cita.mascota,
        telefono: cita.telefono
      }
    });
  };

  const handleNuevaCita = () => {
    setShowNewCitaModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreateCita = async (citaData: NuevaCitaData) => {
    try {
      // Find owner and pet info
      const dueno = mockDuenos.find(d => d.id === citaData.duenoId);
      const mascota = dueno?.mascotas.find(m => m.id === citaData.mascotaId);
      
      if (!dueno || !mascota) {
        throw new Error('No se encontró la información del dueño o mascota');
      }

      // Create new appointment
      const newCita: Cita = {
        id: Math.max(...citas.map(c => c.id)) + 1,
        fecha: citaData.fecha,
        hora: citaData.hora,
        mascota: mascota.nombre,
        dueno: dueno.nombre,
        tipo: citaData.tipo,
        estado: 'confirmada',
        telefono: dueno.telefono,
        duracion: citaData.duracion,
        notas: citaData.notas
      };

      // Add to citas list
      setCitas(prevCitas => [...prevCitas, newCita].sort((a, b) => {
        const dateA = new Date(`${a.fecha.toDateString()} ${a.hora}`);
        const dateB = new Date(`${b.fecha.toDateString()} ${b.hora}`);
        return dateA.getTime() - dateB.getTime();
      }));

      // Show success message
      Alert.alert(
        'Cita Creada',
        `Cita programada para ${mascota.nombre} el ${citaData.fecha.toLocaleDateString('es-ES')} a las ${citaData.hora}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDateSelect = (date: Date) => {
    setFechaActual(date);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const filtros = [
    { id: 'todas', label: 'Todas', count: citasDelDia.length },
    { id: 'confirmada', label: 'Confirmadas', count: citasDelDia.filter(c => c.estado === 'confirmada').length },
    { id: 'pendiente', label: 'Pendientes', count: citasDelDia.filter(c => c.estado === 'pendiente').length },
    { id: 'completada', label: 'Completadas', count: citasDelDia.filter(c => c.estado === 'completada').length },
  ];

  const renderCitaCard = ({ item }: { item: Cita }) => (
    <CitaCard
      cita={item}
      onCall={() => handleLlamar(item)}
      onChat={() => handleChat(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={64} color={vetTheme.colors.text.light} />
      </View>
      <Text style={styles.emptyTitle}>Sin citas programadas</Text>
      <Text style={styles.emptySubtitle}>
        No tienes citas programadas para {formatFecha(fechaActual).toLowerCase()}
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNuevaCita}>
        <Text style={styles.emptyButtonText}>Programar Nueva Cita</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* View Mode Selector */}
      <ViewModeSelector 
        currentMode={viewMode}
        onModeChange={handleViewModeChange}
      />

      {/* Calendar View for Week/Month modes */}
      {(viewMode === 'week' || viewMode === 'month') && (
        <CalendarView
          viewMode={viewMode}
          selectedDate={fechaActual}
          onDateSelect={handleDateSelect}
          citas={citas}
          onViewModeChange={handleViewModeChange}
        />
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <>
          {/* Header con fecha y navegación */}
          <View style={styles.header}>
            <View style={styles.fechaContainer}>
              <TouchableOpacity 
                style={styles.fechaButton}
                onPress={() => cambiarDia('anterior')}
              >
                <Ionicons name="chevron-back" size={24} color={vetTheme.colors.primary} />
              </TouchableOpacity>
              
              <Text style={styles.fechaText}>{formatFecha(fechaActual)}</Text>
              
              <TouchableOpacity 
                style={styles.fechaButton}
                onPress={() => cambiarDia('siguiente')}
              >
                <Ionicons name="chevron-forward" size={24} color={vetTheme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtros */}
          <View style={styles.filtrosContainer}>
            <FlatList
              data={filtros}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtrosList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filtroButton,
                    filtroEstado === item.id && styles.filtroButtonActive
                  ]}
                  onPress={() => setFiltroEstado(item.id)}
                >
                  <Text style={[
                    styles.filtroText,
                    filtroEstado === item.id && styles.filtroTextActive
                  ]}>
                    {item.label} ({item.count})
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Lista de citas */}
          <FlatList
            data={citasFiltradas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCitaCard}
            contentContainerStyle={styles.citasList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[vetTheme.colors.primary]}
                tintColor={vetTheme.colors.primary}
              />
            }
            ListEmptyComponent={!isLoading ? renderEmptyState : null}
          />
        </>
      )}

      {/* Botón flotante Nueva Cita */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleNuevaCita}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Nueva Cita Modal */}
      <NuevaCitaModal
        visible={showNewCitaModal}
        onClose={() => setShowNewCitaModal(false)}
        onSubmit={handleCreateCita}
        initialDate={fechaActual}
        existingCitas={citas}
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Cargando citas...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: vetTheme.colors.surface,
  },
  header: {
    backgroundColor: vetTheme.colors.background,
    paddingVertical: vetTheme.spacing.lg,
    paddingHorizontal: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fechaButton: {
    padding: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
    backgroundColor: `${vetTheme.colors.primary}10`,
  },
  fechaText: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  filtrosContainer: {
    backgroundColor: vetTheme.colors.background,
    paddingVertical: vetTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  filtrosList: {
    paddingHorizontal: vetTheme.spacing.md,
    gap: vetTheme.spacing.sm,
  },
  filtroButton: {
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.full,
    backgroundColor: vetTheme.colors.border.light,
  },
  filtroButtonActive: {
    backgroundColor: vetTheme.colors.primary,
  },
  filtroText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.secondary,
  },
  filtroTextActive: {
    color: vetTheme.colors.text.inverse,
  },
  citasList: {
    paddingHorizontal: vetTheme.spacing.md,
    paddingTop: vetTheme.spacing.md,
    paddingBottom: 100, // Space for floating button
  },
  citaCard: {
    flexDirection: 'row',
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.md,
    borderLeftWidth: 4,
    ...vetTheme.shadows.sm,
  },
  citaContent: {
    flex: 1,
  },
  citaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.sm,
  },
  citaHora: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
  },
  estadoBadge: {
    paddingHorizontal: vetTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: vetTheme.borderRadius.sm,
  },
  estadoText: {
    fontSize: vetTheme.typography.sizes.xs,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.inverse,
  },
  citaInfo: {
    gap: 6,
  },
  mascotaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mascotaNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
  },
  duenoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  duenoNombre: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  tipoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipoText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  citaAcciones: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: vetTheme.spacing.sm,
  },
  accionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...vetTheme.shadows.sm,
  },
  callButton: {
    backgroundColor: `${vetTheme.colors.secondary}15`,
  },
  chatButton: {
    backgroundColor: `${vetTheme.colors.accent}15`,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: vetTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...vetTheme.shadows.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.xxl * 2,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${vetTheme.colors.text.light}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xl,
  },
  emptyTitle: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: vetTheme.spacing.xl,
    paddingHorizontal: vetTheme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingHorizontal: vetTheme.spacing.xl,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
  },
  emptyButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.inverse,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    marginTop: vetTheme.spacing.md,
  },
});

export default VetAgendaTab;