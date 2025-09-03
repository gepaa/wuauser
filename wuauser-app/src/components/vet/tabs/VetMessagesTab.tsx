import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../../../constants/vetTheme';

interface Conversacion {
  id: string;
  duenoId: string;
  duenoNombre: string;
  mascotaNombre: string;
  mascotaId: string;
  ultimoMensaje: {
    texto: string;
    timestamp: string;
    remitente: 'dueno' | 'veterinario';
    leido: boolean;
  };
  mensajesNoLeidos: number;
  esEmergencia: boolean;
  avatar?: string | null;
}

interface VetMessagesTabProps {
  navigation: any;
}

// ID temporal del veterinario
const TEMP_VET_ID = 'mock-vet-id';

// Mock data de conversaciones expandidas con más detalle  
const mockConversaciones: Conversacion[] = [
  {
    id: '1',
    duenoId: '1',
    duenoNombre: 'María Elena Vásquez',
    mascotaNombre: 'Luna',
    mascotaId: '1',
    ultimoMensaje: {
      texto: 'Vigila si tiene vómitos, diarrea, dificultad para respirar o si no mejora en 24 horas.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      remitente: 'veterinario',
      leido: false
    },
    mensajesNoLeidos: 2,
    esEmergencia: false,
    avatar: null
  },
  {
    id: '2',
    duenoId: '2',
    duenoNombre: 'Carlos Mendoza',
    mascotaNombre: 'Max',
    mascotaId: '2',
    ultimoMensaje: {
      texto: '¿Max puede comer normalmente después de la cirugía?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      remitente: 'dueno',
      leido: false
    },
    mensajesNoLeidos: 1,
    esEmergencia: false,
    avatar: null
  },
  {
    id: '3',
    duenoId: '3',
    duenoNombre: 'Ana Patricia López',
    mascotaNombre: 'Rocky',
    mascotaId: '3',
    ultimoMensaje: {
      texto: 'URGENTE: Rocky no puede respirar bien',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      remitente: 'dueno',
      leido: false
    },
    mensajesNoLeidos: 4,
    esEmergencia: true,
    avatar: null
  },
  {
    id: '4',
    duenoId: '4',
    duenoNombre: 'Jorge Alberto Hernández',
    mascotaNombre: 'Mimi',
    mascotaId: '4',
    ultimoMensaje: {
      texto: 'Excelente, Mimi ya está comiendo normal. Muchas gracias doctor.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      remitente: 'dueno',
      leido: true
    },
    mensajesNoLeidos: 0,
    esEmergencia: false,
    avatar: null
  },
  {
    id: '5',
    duenoId: '5',
    duenoNombre: 'Patricia Alejandra Morales',
    mascotaNombre: 'Toby',
    mascotaId: '5',
    ultimoMensaje: {
      texto: 'Recordatorio: próxima vacuna el viernes 6 de septiembre a las 10:00 AM.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      remitente: 'veterinario',
      leido: true
    },
    mensajesNoLeidos: 0,
    esEmergencia: false,
    avatar: null
  },
  {
    id: '6',
    duenoId: '6',
    duenoNombre: 'Roberto José Silva',
    mascotaNombre: 'Whiskers',
    mascotaId: '6',
    ultimoMensaje: {
      texto: 'Doctor, ¿a qué hora exacta debo administrar la insulina a Whiskers?',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      remitente: 'dueno',
      leido: false
    },
    mensajesNoLeidos: 2,
    esEmergencia: false,
    avatar: null
  },
  {
    id: '7',
    duenoId: '7',
    duenoNombre: 'Laura Isabel Jiménez',
    mascotaNombre: 'Buddy',
    mascotaId: '7',
    ultimoMensaje: {
      texto: 'Perfecto, Buddy se ve muy animado después del tratamiento.',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      remitente: 'dueno',
      leido: true
    },
    mensajesNoLeidos: 0,
    esEmergencia: false,
    avatar: null
  },
  {
    id: '8',
    duenoId: '8',
    duenoNombre: 'Miguel Ángel Vargas',
    mascotaNombre: 'Garfield',
    mascotaId: '8',
    ultimoMensaje: {
      texto: 'Perfecto doctor, seguiremos las indicaciones al pie de la letra.',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      remitente: 'dueno',
      leido: true
    },
    mensajesNoLeidos: 0,
    esEmergencia: false,
    avatar: null
  }
];

const ConversacionAvatar: React.FC<{ nombre: string; mascota: string }> = ({ nombre, mascota }) => {
  const inicial = nombre.charAt(0).toUpperCase();
  const inicialMascota = mascota.charAt(0).toUpperCase();
  
  return (
    <View style={styles.avatarContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{inicial}</Text>
      </View>
      <View style={styles.avatarMascota}>
        <Text style={styles.avatarMascotaText}>{inicialMascota}</Text>
      </View>
    </View>
  );
};

const ConversacionCard: React.FC<{
  conversacion: Conversacion;
  onPress: () => void;
}> = ({ conversacion, onPress }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return 'Ayer';
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const truncateMessage = (texto: string, maxLength: number = 50) => {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity style={[
      styles.conversacionCard,
      conversacion.esEmergencia && styles.conversacionEmergencia
    ]} onPress={onPress}>
      <ConversacionAvatar nombre={conversacion.duenoNombre} mascota={conversacion.mascotaNombre} />
      
      <View style={styles.conversacionContent}>
        <View style={styles.conversacionHeader}>
          <Text style={styles.duenoNombre}>
            {conversacion.duenoNombre}
          </Text>
          <View style={styles.conversacionMeta}>
            {conversacion.esEmergencia && (
              <Ionicons name="alert-circle" size={16} color={vetTheme.colors.status.error} />
            )}
            <Text style={styles.timestamp}>
              {formatTimestamp(conversacion.ultimoMensaje.timestamp)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.mascotaNombre}>
          🐾 {conversacion.mascotaNombre}
        </Text>
        
        <View style={styles.mensajePreview}>
          <Text style={[
            styles.ultimoMensaje,
            !conversacion.ultimoMensaje.leido && styles.mensajeNoLeido
          ]}>
            {conversacion.ultimoMensaje.remitente === 'veterinario' && 'Tú: '}
            {truncateMessage(conversacion.ultimoMensaje.texto)}
          </Text>
          
          {conversacion.mensajesNoLeidos > 0 && (
            <View style={styles.badgeNoLeidos}>
              <Text style={styles.badgeText}>
                {conversacion.mensajesNoLeidos > 9 ? '9+' : conversacion.mensajesNoLeidos}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={vetTheme.colors.text.secondary} />
    </View>
    <Text style={styles.emptyTitle}>No hay mensajes</Text>
    <Text style={styles.emptySubtitle}>
      Los mensajes de tus clientes aparecerán aquí
    </Text>
  </View>
);

export const VetMessagesTab: React.FC<VetMessagesTabProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'no_leidos' | 'emergencias'>('todos');
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConversaciones();
  }, []);

  const loadConversaciones = async () => {
    try {
      setLoading(true);
      // Aquí se conectará con el servicio real de Supabase
      // const { data } = await messagingService.getConversaciones(TEMP_VET_ID);
      // Por ahora usar mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carga
      setConversaciones(mockConversaciones);
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
      setConversaciones(mockConversaciones);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversaciones();
    setRefreshing(false);
  };

  const filteredConversaciones = useMemo(() => {
    let filtered = conversaciones;

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.duenoNombre.toLowerCase().includes(query) ||
        c.mascotaNombre.toLowerCase().includes(query) ||
        c.ultimoMensaje.texto.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro por tipo
    switch (filterType) {
      case 'no_leidos':
        filtered = filtered.filter(c => c.mensajesNoLeidos > 0);
        break;
      case 'emergencias':
        filtered = filtered.filter(c => c.esEmergencia);
        break;
    }

    // Ordenar por timestamp más reciente
    return filtered.sort((a, b) => 
      new Date(b.ultimoMensaje.timestamp).getTime() - 
      new Date(a.ultimoMensaje.timestamp).getTime()
    );
  }, [conversaciones, searchQuery, filterType]);

  const handleConversacionPress = (conversacion: Conversacion) => {
    navigation.navigate('Chat', {
      conversacionId: conversacion.id,
      duenoNombre: conversacion.duenoNombre,
      mascotaNombre: conversacion.mascotaNombre,
      duenoId: conversacion.duenoId,
      mascotaId: conversacion.mascotaId
    });
  };

  const totalNoLeidos = conversaciones.reduce((total, c) => total + c.mensajesNoLeidos, 0);

  const renderFilterChips = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>
        Mensajes {totalNoLeidos > 0 && `(${totalNoLeidos} sin leer)`}
      </Text>
      <View style={styles.chipRow}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'no_leidos', label: 'No leídos' },
          { key: 'emergencias', label: 'Emergencias' }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              filterType === filter.key && styles.filterChipActive
            ]}
            onPress={() => setFilterType(filter.key as any)}
          >
            <Text style={[
              styles.filterChipText,
              filterType === filter.key && styles.filterChipTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando mensajes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={vetTheme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={vetTheme.colors.text.secondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={vetTheme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderFilterChips()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredConversaciones.length} conversación{filteredConversaciones.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredConversaciones}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversacionCard
            conversacion={item}
            onPress={() => handleConversacionPress(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<EmptyState />}
      />
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
  },
  filterChip: {
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.full,
    backgroundColor: vetTheme.colors.surface,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.medium,
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
  conversacionCard: {
    backgroundColor: vetTheme.colors.background,
    borderRadius: vetTheme.borderRadius.lg,
    padding: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conversacionEmergencia: {
    borderLeftWidth: 4,
    borderLeftColor: vetTheme.colors.status.error,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: vetTheme.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${vetTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.primary,
  },
  avatarMascota: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: vetTheme.colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: vetTheme.colors.background,
  },
  avatarMascotaText: {
    fontSize: 10,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.background,
  },
  conversacionContent: {
    flex: 1,
  },
  conversacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  duenoNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    flex: 1,
  },
  conversacionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.xs,
  },
  mascotaNombre: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  mensajePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ultimoMensaje: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    flex: 1,
    marginRight: vetTheme.spacing.sm,
  },
  mensajeNoLeido: {
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
  },
  badgeNoLeidos: {
    backgroundColor: vetTheme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: vetTheme.typography.sizes.md,
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
});

export default VetMessagesTab;