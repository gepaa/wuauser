import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { mockVeterinarios, mockResenas, MockVeterinario, MockResena } from '../data/mockVeterinarios';
import { vetTheme } from '../constants/vetTheme';

interface VetProfileDetailScreenProps {
  navigation: any;
  route: {
    params: {
      veterinarioId: string;
    };
  };
}

const { width } = Dimensions.get('window');

export const VetProfileDetailScreen: React.FC<VetProfileDetailScreenProps> = ({ navigation, route }) => {
  const { veterinarioId } = route.params;
  const [veterinario, setVeterinario] = useState<MockVeterinario | null>(null);
  const [resenas, setResenas] = useState<MockResena[]>([]);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatosVeterinario();
  }, [veterinarioId]);

  const cargarDatosVeterinario = async () => {
    setCargando(true);
    try {
      // Simular carga desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const vet = mockVeterinarios.find(v => v.id === veterinarioId);
      if (vet) {
        setVeterinario(vet);
        // Cargar reseñas del veterinario
        const resenasVet = mockResenas.filter(r => r.veterinarioId === veterinarioId);
        setResenas(resenasVet);
      } else {
        Alert.alert('Error', 'Veterinario no encontrado');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos del veterinario');
      navigation.goBack();
    } finally {
      setCargando(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color={vetTheme.colors.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={size} color={vetTheme.colors.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={size} color={vetTheme.colors.text.light} />
      );
    }

    return stars;
  };

  const abrirMapa = () => {
    if (!veterinario) return;
    
    const url = `https://maps.apple.com/?q=${encodeURIComponent(veterinario.clinica.nombre)}&ll=${veterinario.ubicacion.lat},${veterinario.ubicacion.lng}`;
    Linking.openURL(url);
  };

  const llamarVeterinario = () => {
    if (!veterinario) return;
    
    Alert.alert(
      'Llamar al Veterinario',
      `¿Deseas llamar a ${veterinario.clinica.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Llamar', 
          onPress: () => Linking.openURL(`tel:${veterinario.clinica.telefono}`)
        }
      ]
    );
  };

  const reservarServicio = (servicioId: string) => {
    navigation.navigate('BookAppointment', {
      veterinarioId: veterinario?.id,
      servicioId: servicioId
    });
  };

  const renderFotoGaleria = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.fotoGaleriaContainer}
      onPress={() => setFotoSeleccionada(index)}
    >
      <Image source={{ uri: item }} style={styles.fotoGaleria} />
    </TouchableOpacity>
  );

  const renderServicio = ({ item }: { item: any }) => (
    <View style={styles.servicioCard}>
      <View style={styles.servicioHeader}>
        <View style={styles.servicioInfo}>
          <Text style={styles.servicioNombre}>{item.nombre}</Text>
          <Text style={styles.servicioDescripcion}>{item.descripcion}</Text>
          <View style={styles.servicioDuracion}>
            <Ionicons name="time" size={14} color={vetTheme.colors.text.secondary} />
            <Text style={styles.servicioDuracionTexto}>{item.duracion} min</Text>
          </View>
        </View>
        <View style={styles.servicioPrecioContainer}>
          <Text style={styles.servicioPrecio}>${item.precio}</Text>
          <TouchableOpacity
            style={styles.reservarButton}
            onPress={() => reservarServicio(item.id)}
          >
            <Text style={styles.reservarButtonText}>Reservar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderResena = ({ item }: { item: MockResena }) => (
    <View style={styles.resenaCard}>
      <View style={styles.resenaHeader}>
        <View style={styles.clienteInfo}>
          <View style={styles.clienteAvatar}>
            <Text style={styles.clienteInitial}>
              {item.clienteNombre.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.clienteNombre}>{item.clienteNombre}</Text>
            <Text style={styles.mascotaInfo}>Dueño de {item.mascotaNombre} • {item.servicio}</Text>
          </View>
        </View>
        <View style={styles.resenaRating}>
          <View style={styles.resenaStars}>
            {renderStars(item.rating, 14)}
          </View>
          <Text style={styles.resenaFecha}>{new Date(item.fecha).toLocaleDateString('es-MX')}</Text>
        </View>
      </View>
      <Text style={styles.resenaComentario}>{item.comentario}</Text>
    </View>
  );

  const getDistribucionRating = () => {
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    resenas.forEach(r => {
      distribucion[r.rating as keyof typeof distribucion]++;
    });
    return distribucion;
  };

  if (cargando || !veterinario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const distribucionRating = getDistribucionRating();
  const totalResenas = resenas.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={llamarVeterinario} style={styles.callButton}>
          <Ionicons name="call" size={20} color={vetTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Profesional */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {veterinario.avatar ? (
              <Image source={{ uri: veterinario.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {veterinario.nombre.split(' ').map(n => n.charAt(0)).join('')}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.veterinarioNombre}>{veterinario.nombre}</Text>
          <Text style={styles.veterinarioEspecialidad}>{veterinario.especialidad}</Text>
          <Text style={styles.veterinarioExperiencia}>{veterinario.experiencia} años de experiencia</Text>
          
          {/* Rating detallado */}
          <View style={styles.ratingDetallado}>
            <View style={styles.ratingPrincipal}>
              <Text style={styles.ratingNumero}>{veterinario.rating}</Text>
              <View style={styles.starsContainer}>
                {renderStars(veterinario.rating, 20)}
              </View>
            </View>
            <Text style={styles.totalResenasText}>
              {veterinario.totalReviews} reseñas • {veterinario.ubicacion.colonia}
            </Text>
          </View>

          {/* Verificación */}
          {veterinario.verificado && (
            <View style={styles.verificacionBadge}>
              <Ionicons name="shield-checkmark" size={16} color={vetTheme.colors.status.success} />
              <Text style={styles.verificacionText}>Verificado por WUAUSER</Text>
              <Text style={styles.verificacionAnios}>{Math.floor(Math.random() * 3) + 1} años en WUAUSER</Text>
            </View>
          )}
        </View>

        {/* Galería del Consultorio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería del Consultorio</Text>
          <View style={styles.galeriaContainer}>
            <Image 
              source={{ uri: veterinario.clinica.fotos[fotoSeleccionada] }} 
              style={styles.fotoPrincipal} 
            />
            <FlatList
              data={veterinario.clinica.fotos}
              renderItem={renderFotoGaleria}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.fotosLista}
            />
          </View>
        </View>

        {/* Información del Consultorio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{veterinario.clinica.nombre}</Text>
          <Text style={styles.consultorioDescripcion}>{veterinario.clinica.descripcion}</Text>
          
          <View style={styles.infoConsultorio}>
            <TouchableOpacity style={styles.infoItem} onPress={abrirMapa}>
              <Ionicons name="location" size={20} color={vetTheme.colors.primary} />
              <View style={styles.infoTexto}>
                <Text style={styles.infoTitulo}>Dirección</Text>
                <Text style={styles.infoDescripcion}>
                  {veterinario.ubicacion.direccion}, {veterinario.ubicacion.colonia}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={vetTheme.colors.text.light} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoItem} onPress={llamarVeterinario}>
              <Ionicons name="call" size={20} color={vetTheme.colors.primary} />
              <View style={styles.infoTexto}>
                <Text style={styles.infoTitulo}>Teléfono</Text>
                <Text style={styles.infoDescripcion}>{veterinario.clinica.telefono}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={vetTheme.colors.text.light} />
            </TouchableOpacity>
          </View>

          {/* Horarios */}
          <View style={styles.horariosContainer}>
            <Text style={styles.horariosTitle}>Horarios de Atención</Text>
            {Object.entries(veterinario.horarios)
              .filter(([_, horario]) => horario.activo)
              .map(([dia, horario]) => (
                <View key={dia} style={styles.horarioItem}>
                  <Text style={styles.horarioDia}>
                    {dia.charAt(0).toUpperCase() + dia.slice(1)}
                  </Text>
                  <Text style={styles.horarioHoras}>
                    {horario.inicio} - {horario.fin}
                  </Text>
                </View>
              ))}
          </View>

          {/* Características especiales */}
          <View style={styles.caracteristicasContainer}>
            {veterinario.configuraciones.aceptaUrgencias && (
              <View style={styles.caracteristica}>
                <Ionicons name="medical" size={16} color={vetTheme.colors.status.error} />
                <Text style={styles.caracteristicaTexto}>Acepta urgencias 24h</Text>
              </View>
            )}
            {veterinario.configuraciones.serviciosDomicilio && (
              <View style={styles.caracteristica}>
                <Ionicons name="home" size={16} color={vetTheme.colors.primary} />
                <Text style={styles.caracteristicaTexto}>Servicio a domicilio</Text>
              </View>
            )}
          </View>

          {/* Mini mapa */}
          <View style={styles.miniMapaContainer}>
            <MapView
              style={styles.miniMapa}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: veterinario.ubicacion.lat,
                longitude: veterinario.ubicacion.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: veterinario.ubicacion.lat,
                  longitude: veterinario.ubicacion.lng
                }}
                title={veterinario.clinica.nombre}
              />
            </MapView>
            <TouchableOpacity style={styles.abrirMapaButton} onPress={abrirMapa}>
              <Text style={styles.abrirMapaText}>Ver en mapa completo</Text>
              <Ionicons name="chevron-forward" size={14} color={vetTheme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Servicios y Precios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios y Precios</Text>
          <FlatList
            data={veterinario.servicios}
            renderItem={renderServicio}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Reseñas */}
        <View style={styles.section}>
          <View style={styles.resenasHeader}>
            <Text style={styles.sectionTitle}>Reseñas ({totalResenas})</Text>
            
            {/* Distribución de ratings */}
            <View style={styles.distribucionRating}>
              {[5, 4, 3, 2, 1].map(rating => (
                <View key={rating} style={styles.ratingDistribucionRow}>
                  <Text style={styles.ratingNumeroSmall}>{rating}</Text>
                  <Ionicons name="star" size={12} color={vetTheme.colors.accent} />
                  <View style={styles.ratingBarContainer}>
                    <View 
                      style={[
                        styles.ratingBar,
                        { width: `${totalResenas > 0 ? (distribucionRating[rating as keyof typeof distribucionRating] / totalResenas) * 100 : 0}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.ratingCount}>
                    {distribucionRating[rating as keyof typeof distribucionRating]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <FlatList
            data={resenas}
            renderItem={renderResena}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Botones de acción */}
        <View style={styles.accionesContainer}>
          <TouchableOpacity style={styles.contactoButton} onPress={llamarVeterinario}>
            <Ionicons name="call" size={20} color="white" />
            <Text style={styles.contactoButtonText}>Llamar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.reservarPrincipalButton}
            onPress={() => navigation.navigate('BookAppointment', { veterinarioId: veterinario.id })}
          >
            <Text style={styles.reservarPrincipalText}>Reservar Cita</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingTop: vetTheme.spacing.sm,
    paddingBottom: vetTheme.spacing.md,
    backgroundColor: 'white',
  },
  backButton: {
    padding: vetTheme.spacing.sm,
  },
  callButton: {
    padding: vetTheme.spacing.sm,
    backgroundColor: `${vetTheme.colors.primary}15`,
    borderRadius: vetTheme.borderRadius.md,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: 'white',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: vetTheme.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: vetTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: vetTheme.typography.weights.bold,
    color: 'white',
  },
  veterinarioNombre: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  veterinarioEspecialidad: {
    fontSize: vetTheme.typography.sizes.lg,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  veterinarioExperiencia: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.light,
    textAlign: 'center',
    marginBottom: vetTheme.spacing.lg,
  },
  ratingDetallado: {
    alignItems: 'center',
    marginBottom: vetTheme.spacing.md,
  },
  ratingPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.sm,
  },
  ratingNumero: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginRight: vetTheme.spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  totalResenasText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
  },
  verificacionBadge: {
    backgroundColor: `${vetTheme.colors.status.success}15`,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificacionText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.status.success,
    fontWeight: vetTheme.typography.weights.medium,
    marginLeft: vetTheme.spacing.xs,
    marginRight: vetTheme.spacing.sm,
  },
  verificacionAnios: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
  },
  section: {
    backgroundColor: 'white',
    marginTop: vetTheme.spacing.sm,
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.md,
  },
  galeriaContainer: {
    marginHorizontal: -vetTheme.spacing.lg,
  },
  fotoPrincipal: {
    width: width,
    height: 200,
    resizeMode: 'cover',
  },
  fotosLista: {
    paddingHorizontal: vetTheme.spacing.lg,
    marginTop: vetTheme.spacing.md,
  },
  fotoGaleriaContainer: {
    marginRight: vetTheme.spacing.sm,
  },
  fotoGaleria: {
    width: 80,
    height: 60,
    borderRadius: vetTheme.borderRadius.sm,
  },
  consultorioDescripcion: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: vetTheme.spacing.lg,
  },
  infoConsultorio: {
    marginBottom: vetTheme.spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vetTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
  },
  infoTexto: {
    flex: 1,
    marginLeft: vetTheme.spacing.md,
  },
  infoTitulo: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  infoDescripcion: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginTop: 2,
  },
  horariosContainer: {
    marginBottom: vetTheme.spacing.lg,
  },
  horariosTitle: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.sm,
  },
  horarioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vetTheme.spacing.xs,
  },
  horarioDia: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  horarioHoras: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.primary,
    fontWeight: vetTheme.typography.weights.medium,
  },
  caracteristicasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.lg,
  },
  caracteristica: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vetTheme.colors.surface,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
  },
  caracteristicaTexto: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.primary,
    marginLeft: vetTheme.spacing.xs,
  },
  miniMapaContainer: {
    borderRadius: vetTheme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  miniMapa: {
    height: 150,
  },
  abrirMapaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vetTheme.spacing.md,
    backgroundColor: vetTheme.colors.surface,
  },
  abrirMapaText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.medium,
    marginRight: vetTheme.spacing.xs,
  },
  servicioCard: {
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.lg,
    marginBottom: vetTheme.spacing.md,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  servicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  servicioInfo: {
    flex: 1,
    marginRight: vetTheme.spacing.md,
  },
  servicioNombre: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
  },
  servicioDescripcion: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: vetTheme.spacing.sm,
  },
  servicioDuracion: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicioDuracionTexto: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    marginLeft: vetTheme.spacing.xs,
  },
  servicioPrecioContainer: {
    alignItems: 'flex-end',
  },
  servicioPrecio: {
    fontSize: vetTheme.typography.sizes.xl,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.status.success,
    marginBottom: vetTheme.spacing.sm,
  },
  reservarButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.sm,
    borderRadius: vetTheme.borderRadius.md,
  },
  reservarButtonText: {
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: 'white',
  },
  resenasHeader: {
    marginBottom: vetTheme.spacing.lg,
  },
  distribucionRating: {
    marginTop: vetTheme.spacing.md,
    gap: vetTheme.spacing.xs,
  },
  ratingDistribucionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vetTheme.spacing.xs,
  },
  ratingNumeroSmall: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    width: 12,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: vetTheme.colors.border.light,
    borderRadius: 4,
    marginHorizontal: vetTheme.spacing.sm,
  },
  ratingBar: {
    height: '100%',
    backgroundColor: vetTheme.colors.accent,
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
    width: 20,
    textAlign: 'right',
  },
  resenaCard: {
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  resenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vetTheme.spacing.sm,
  },
  clienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clienteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: vetTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: vetTheme.spacing.sm,
  },
  clienteInitial: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.bold,
    color: 'white',
  },
  clienteNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  mascotaInfo: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.light,
  },
  resenaRating: {
    alignItems: 'flex-end',
  },
  resenaStars: {
    flexDirection: 'row',
    marginBottom: vetTheme.spacing.xs,
  },
  resenaFecha: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
  },
  resenaComentario: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    lineHeight: 20,
  },
  accionesContainer: {
    flexDirection: 'row',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
    gap: vetTheme.spacing.md,
    backgroundColor: 'white',
  },
  contactoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.secondary,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
    gap: vetTheme.spacing.xs,
  },
  contactoButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    color: 'white',
    fontWeight: vetTheme.typography.weights.medium,
  },
  reservarPrincipalButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
  },
  reservarPrincipalText: {
    fontSize: vetTheme.typography.sizes.md,
    color: 'white',
    fontWeight: vetTheme.typography.weights.semiBold,
  },
});

export default VetProfileDetailScreen;