import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export const MapScreen = () => {
  const veterinarios = [
    { id: 1, nombre: 'Hospital Veterinario Roma Norte', distancia: '1.2 km', rating: 4.9, abierto: true },
    { id: 2, nombre: 'Clínica Veterinaria Condesa', distancia: '2.5 km', rating: 4.7, abierto: true },
    { id: 3, nombre: 'Veterinaria del Valle', distancia: '3.8 km', rating: 4.5, abierto: false },
    { id: 4, nombre: 'Pet Care Polanco', distancia: '4.2 km', rating: 5.0, abierto: true },
    { id: 5, nombre: 'Animal Health Coyoacán', distancia: '5.1 km', rating: 4.6, abierto: true },
  ];

  return (
    <View style={styles.container}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
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

      {/* Placeholder del mapa */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={80} color="#CCC" />
        <Text style={styles.placeholderText}>Mapa disponible próximamente</Text>
        <Text style={styles.placeholderSubtext}>
          Por ahora, puedes ver la lista de veterinarios cercanos
        </Text>
      </View>

      {/* Lista de veterinarios */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Veterinarios cercanos ({veterinarios.length})</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
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
    marginBottom: 10,
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    margin: 15,
    borderRadius: 15,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 15,
    maxHeight: 300,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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