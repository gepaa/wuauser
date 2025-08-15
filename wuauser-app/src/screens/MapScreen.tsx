import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedGestureHandler, runOnJS, withSpring } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { height: screenHeight } = Dimensions.get('window');

export const MapScreen = () => {
  const veterinarios = [
    { id: 1, nombre: 'Hospital Veterinario Roma Norte', distancia: '1.2 km', rating: 4.9, abierto: true },
    { id: 2, nombre: 'Clínica Veterinaria Condesa', distancia: '2.5 km', rating: 4.7, abierto: true },
    { id: 3, nombre: 'Veterinaria del Valle', distancia: '3.8 km', rating: 4.5, abierto: false },
    { id: 4, nombre: 'Pet Care Polanco', distancia: '4.2 km', rating: 5.0, abierto: true },
    { id: 5, nombre: 'Animal Health Coyoacán', distancia: '5.1 km', rating: 4.6, abierto: true },
  ];

  const MIN_SHEET_HEIGHT = 120;
  const MAX_SHEET_HEIGHT = screenHeight * 0.6;
  
  // Snap points precisos
  const CLOSED_POSITION = screenHeight - MIN_SHEET_HEIGHT;
  const OPEN_POSITION = screenHeight - MAX_SHEET_HEIGHT;
  
  const translateY = useSharedValue(CLOSED_POSITION);
  const [isExpanded, setIsExpanded] = useState(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newY = context.startY + event.translationY;
      
      // Permitir deslizamiento con rebote suave en los límites
      if (newY < OPEN_POSITION) {
        // Rebote suave cuando se desliza más arriba del máximo
        const overshoot = OPEN_POSITION - newY;
        translateY.value = OPEN_POSITION - overshoot * 0.3;
      } else if (newY > CLOSED_POSITION) {
        // Rebote suave cuando se desliza más abajo del mínimo
        const overshoot = newY - CLOSED_POSITION;
        translateY.value = CLOSED_POSITION + overshoot * 0.3;
      } else {
        // Movimiento normal dentro de los límites
        translateY.value = newY;
      }
    },
    onEnd: (event) => {
      const velocity = event.velocityY;
      const currentY = translateY.value;
      const midPoint = (OPEN_POSITION + CLOSED_POSITION) / 2;
      
      // Lógica de velocidad mejorada para decidir dirección
      if (Math.abs(velocity) > 500) {
        // Velocidad alta: seguir dirección del gesto
        if (velocity > 0) {
          // Deslizando hacia abajo - cerrar
          translateY.value = withSpring(CLOSED_POSITION, {
            damping: 15,
            stiffness: 150,
          });
          runOnJS(setIsExpanded)(false);
        } else {
          // Deslizando hacia arriba - abrir
          translateY.value = withSpring(OPEN_POSITION, {
            damping: 15,
            stiffness: 150,
          });
          runOnJS(setIsExpanded)(true);
        }
      } else {
        // Velocidad baja: usar posición actual vs punto medio
        if (currentY > midPoint) {
          // Más cerca del estado cerrado
          translateY.value = withSpring(CLOSED_POSITION, {
            damping: 15,
            stiffness: 150,
          });
          runOnJS(setIsExpanded)(false);
        } else {
          // Más cerca del estado abierto
          translateY.value = withSpring(OPEN_POSITION, {
            damping: 15,
            stiffness: 150,
          });
          runOnJS(setIsExpanded)(true);
        }
      }
    },
  });

  const bottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const toggleSheet = () => {
    if (isExpanded) {
      translateY.value = withSpring(CLOSED_POSITION, {
        damping: 15,
        stiffness: 150,
      });
      setIsExpanded(false);
    } else {
      translateY.value = withSpring(OPEN_POSITION, {
        damping: 15,
        stiffness: 150,
      });
      setIsExpanded(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <Text style={styles.searchText}>Buscar clínicas, servicios...</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            <TouchableOpacity style={styles.filterChip}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <Text style={styles.filterText}>Abierto ahora</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Ionicons name="warning-outline" size={16} color="#FF9500" />
              <Text style={styles.filterText}>Emergencias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Ionicons name="heart-outline" size={16} color="#E85D4E" />
              <Text style={styles.filterText}>Especialidad</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Área del mapa */}
      <View style={styles.mapContainer}>
        <LinearGradient
          colors={['#E3F2FD', '#F3E5F5', '#FFF3E0']}
          style={styles.mapPlaceholder}
        >
          <View style={styles.placeholderIconContainer}>
            <Ionicons name="map" size={120} color={Colors.primary} />
          </View>
          <Text style={styles.placeholderText}>🗺️ El mapa estará disponible pronto</Text>
          <Text style={styles.placeholderSubtext}>
            Mientras tanto, explora los veterinarios en la lista
          </Text>
          <TouchableOpacity style={styles.tutorialButton}>
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.tutorialButtonText}>Ver tutorial</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Bottom Sheet con lista */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.bottomSheet, bottomSheetStyle]}>
          <View style={styles.dragIndicator} />
          <TouchableOpacity style={styles.sheetHeader} onPress={toggleSheet}>
            <Text style={styles.listTitle}>Veterinarios cercanos ({veterinarios.length})</Text>
            <Ionicons 
              name={isExpanded ? "chevron-down" : "chevron-up"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
          <ScrollView style={styles.vetList} showsVerticalScrollIndicator={false}>
            {veterinarios.map(vet => (
              <TouchableOpacity key={vet.id} style={styles.vetCard}>
                <View style={styles.vetInfo}>
                  <Text style={styles.vetName}>{vet.nombre}</Text>
                  <View style={styles.vetDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="location-outline" size={14} color="#666" />
                      <Text style={styles.detailText}>{vet.distancia}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.detailText}>{vet.rating}</Text>
                    </View>
                    <View style={[styles.statusBadge, vet.abierto ? styles.open : styles.closed]}>
                      <Text style={styles.statusText}>
                        {vet.abierto ? 'Abierto' : 'Cerrado'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchContainer: {
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  searchText: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  filters: {
    marginBottom: 5,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  filterText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
    borderRadius: 15,
  },
  placeholderIconContainer: {
    marginBottom: 20,
    opacity: 0.8,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    lineHeight: 22,
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 120,
    maxHeight: '60%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vetList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  vetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  vetDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    marginLeft: 3,
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  open: {
    backgroundColor: '#E8F5E9',
  },
  closed: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});