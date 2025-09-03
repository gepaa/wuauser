import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { vetTheme } from '../constants/vetTheme';

interface PerfilPublicoScreenProps {
  navigation: any;
}

interface Resena {
  id: string;
  clienteNombre: string;
  mascotaNombre: string;
  rating: number;
  comentario: string;
  fecha: string;
  avatar?: string;
}

interface FotoConsultorio {
  id: string;
  uri: string;
  descripcion: string;
}

interface ServicioPublico {
  nombre: string;
  precio: number;
  duracion: number;
  descripcion: string;
}

const mockVeterinarioPublico = {
  id: '1',
  nombre: 'Dr. Guido Pablo Rodríguez',
  especialidad: 'Medicina General Veterinaria',
  experiencia: '8 años',
  rating: 4.8,
  totalReviews: 127,
  avatar: null,
  verificado: true,
  clinica: {
    nombre: 'Clínica Veterinaria San Ángel',
    direccion: 'Av. Revolución 1425, San Ángel, CDMX',
    telefono: '55-5555-1234',
    coordenadas: { lat: 19.3498, lng: -99.1890 },
    descripcion: 'Clínica veterinaria especializada en medicina general y cirugía menor. Contamos con equipo moderno y veterinarios certificados para brindar el mejor cuidado a tu mascota.',
    horarios: [
      { dia: 'Lunes - Viernes', horas: '08:00 - 18:00' },
      { dia: 'Sábado', horas: '09:00 - 15:00' },
      { dia: 'Domingo', horas: 'Cerrado' }
    ],
    fotos: [
      { id: '1', uri: 'https://via.placeholder.com/400x300', descripcion: 'Exterior de la clínica' },
      { id: '2', uri: 'https://via.placeholder.com/400x300', descripcion: 'Sala de espera' },
      { id: '3', uri: 'https://via.placeholder.com/400x300', descripcion: 'Consultorio principal' },
      { id: '4', uri: 'https://via.placeholder.com/400x300', descripcion: 'Equipo médico' }
    ]
  },
  servicios: [
    {
      nombre: 'Consulta General',
      precio: 350,
      duracion: 30,
      descripcion: 'Examen clínico completo con diagnóstico profesional'
    },
    {
      nombre: 'Vacunación',
      precio: 200,
      duracion: 15,
      descripcion: 'Vacunación completa según edad y especie'
    },
    {
      nombre: 'Cirugía Menor',
      precio: 1200,
      duracion: 90,
      descripcion: 'Procedimientos quirúrgicos ambulatorios'
    },
    {
      nombre: 'Urgencias',
      precio: 800,
      duracion: 60,
      descripcion: 'Atención inmediata para emergencias'
    }
  ],
  politicas: {
    cancelacion: 'Cancelación gratuita hasta 2 horas antes de la cita',
    pago: 'Pago anticipado requerido. Aceptamos tarjetas y transferencias',
    urgencias: 'Disponible para emergencias 24/7 con cargo adicional'
  }
};

const mockResenas: Resena[] = [
  {
    id: '1',
    clienteNombre: 'María González',
    mascotaNombre: 'Luna',
    rating: 5,
    comentario: 'Excelente atención. El Dr. Rodríguez es muy profesional y cuidadoso con Luna. Instalaciones muy limpias.',
    fecha: '2024-01-15'
  },
  {
    id: '2',
    clienteNombre: 'Carlos Mendoza',
    mascotaNombre: 'Max',
    rating: 5,
    comentario: 'Muy recomendado. Salvó la vida de mi perro en una emergencia. Siempre disponible y muy experimentado.',
    fecha: '2024-01-10'
  },
  {
    id: '3',
    clienteNombre: 'Ana Martínez',
    mascotaNombre: 'Mimi',
    rating: 4,
    comentario: 'Buena atención, aunque el consultorio es un poco pequeño. El doctor explica todo muy bien.',
    fecha: '2024-01-08'
  },
  {
    id: '4',
    clienteNombre: 'Jorge Ramírez',
    mascotaNombre: 'Rocky',
    rating: 5,
    comentario: 'Llevamos años viniendo aquí. Confianza total en el Dr. Rodríguez. Precios justos y excelente servicio.',
    fecha: '2024-01-05'
  },
  {
    id: '5',
    clienteNombre: 'Laura Herrera',
    mascotaNombre: 'Coco',
    rating: 4,
    comentario: 'Muy profesional. Mi gato se sintió cómodo durante toda la consulta. Recomendado.',
    fecha: '2024-01-02'
  }
];

const { width } = Dimensions.get('window');

export const PerfilPublicoScreen: React.FC<PerfilPublicoScreenProps> = ({ navigation }) => {
  const [fotoSeleccionada, setFotoSeleccionada] = useState<FotoConsultorio | null>(null);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color={vetTheme.colors.accent} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color={vetTheme.colors.accent} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color={vetTheme.colors.text.light} />
      );
    }

    return stars;
  };

  const renderFotoItem = ({ item, index }: { item: FotoConsultorio; index: number }) => (
    <TouchableOpacity
      style={styles.fotoItem}
      onPress={() => setFotoSeleccionada(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.fotoImage} />
      <Text style={styles.fotoDescripcion}>{item.descripcion}</Text>
    </TouchableOpacity>
  );

  const renderResenaItem = ({ item }: { item: Resena }) => (
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
            <Text style={styles.mascotaNombre}>Dueño de {item.mascotaNombre}</Text>
          </View>
        </View>
        <View style={styles.resenaRating}>
          <View style={styles.resenaStars}>
            {renderStars(item.rating)}
          </View>
          <Text style={styles.resenaFecha}>{item.fecha}</Text>
        </View>
      </View>
      <Text style={styles.resenaComentario}>{item.comentario}</Text>
    </View>
  );

  const renderServicioItem = ({ item }: { item: ServicioPublico }) => (
    <View style={styles.servicioCard}>
      <View style={styles.servicioHeader}>
        <Text style={styles.servicioNombre}>{item.nombre}</Text>
        <Text style={styles.servicioPrecio}>${item.precio}</Text>
      </View>
      <Text style={styles.servicioDescripcion}>{item.descripcion}</Text>
      <Text style={styles.servicioDuracion}>{item.duracion} minutos</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={vetTheme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Así te ven tus clientes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Profesional */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {mockVeterinarioPublico.avatar ? (
              <Image source={{ uri: mockVeterinarioPublico.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {mockVeterinarioPublico.nombre.split(' ').map(n => n.charAt(0)).join('')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.veterinarioNombre}>{mockVeterinarioPublico.nombre}</Text>
            <Text style={styles.veterinarioEspecialidad}>{mockVeterinarioPublico.especialidad}</Text>
            <Text style={styles.veterinarioExperiencia}>{mockVeterinarioPublico.experiencia} de experiencia</Text>
            
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(mockVeterinarioPublico.rating)}
              </View>
              <Text style={styles.ratingText}>
                {mockVeterinarioPublico.rating} • {mockVeterinarioPublico.totalReviews} reseñas
              </Text>
            </View>
            
            {mockVeterinarioPublico.verificado && (
              <View style={styles.verificadoBadge}>
                <Ionicons name="shield-checkmark" size={16} color={vetTheme.colors.status.success} />
                <Text style={styles.verificadoText}>Verificado por WUAUSER</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.agendarButton}>
            <Text style={styles.agendarButtonText}>Agendar Cita</Text>
          </TouchableOpacity>
        </View>

        {/* Galería del Consultorio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería del Consultorio</Text>
          <FlatList
            data={mockVeterinarioPublico.clinica.fotos}
            renderItem={renderFotoItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.fotosLista}
          />
        </View>

        {/* Información del Consultorio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{mockVeterinarioPublico.clinica.nombre}</Text>
          <Text style={styles.consultorioDescripcion}>{mockVeterinarioPublico.clinica.descripcion}</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={vetTheme.colors.primary} />
            <Text style={styles.infoText}>{mockVeterinarioPublico.clinica.direccion}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color={vetTheme.colors.primary} />
            <Text style={styles.infoText}>{mockVeterinarioPublico.clinica.telefono}</Text>
          </View>

          {/* Horarios */}
          <View style={styles.horariosContainer}>
            <Text style={styles.horariosTitle}>Horarios de Atención</Text>
            {mockVeterinarioPublico.clinica.horarios.map((horario, index) => (
              <View key={index} style={styles.horarioItem}>
                <Text style={styles.horarioDia}>{horario.dia}</Text>
                <Text style={styles.horarioHoras}>{horario.horas}</Text>
              </View>
            ))}
          </View>

          {/* Botón Ver en Mapa */}
          <TouchableOpacity style={styles.verMapaButton}>
            <Ionicons name="map-outline" size={16} color={vetTheme.colors.primary} />
            <Text style={styles.verMapaText}>Ver en mapa</Text>
          </TouchableOpacity>
        </View>

        {/* Servicios y Precios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios y Precios</Text>
          <FlatList
            data={mockVeterinarioPublico.servicios}
            renderItem={renderServicioItem}
            keyExtractor={(item) => item.nombre}
            scrollEnabled={false}
          />
        </View>

        {/* Políticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Políticas</Text>
          <View style={styles.politicaItem}>
            <Ionicons name="time-outline" size={16} color={vetTheme.colors.text.secondary} />
            <Text style={styles.politicaText}>{mockVeterinarioPublico.politicas.cancelacion}</Text>
          </View>
          <View style={styles.politicaItem}>
            <Ionicons name="card-outline" size={16} color={vetTheme.colors.text.secondary} />
            <Text style={styles.politicaText}>{mockVeterinarioPublico.politicas.pago}</Text>
          </View>
          <View style={styles.politicaItem}>
            <Ionicons name="medical-outline" size={16} color={vetTheme.colors.text.secondary} />
            <Text style={styles.politicaText}>{mockVeterinarioPublico.politicas.urgencias}</Text>
          </View>
        </View>

        {/* Reseñas de Clientes */}
        <View style={styles.section}>
          <View style={styles.resenasHeader}>
            <Text style={styles.sectionTitle}>Reseñas de Clientes</Text>
            <TouchableOpacity>
              <Text style={styles.verTodasText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={mockResenas}
            renderItem={renderResenaItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Botón de Contacto Flotante */}
        <View style={styles.contactoContainer}>
          <TouchableOpacity style={styles.contactoButton}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.contactoButtonText}>Enviar Mensaje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.agendarFloatingButton}>
            <Text style={styles.agendarFloatingText}>Agendar Cita</Text>
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
  profileHeader: {
    backgroundColor: 'white',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: vetTheme.colors.border.light,
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
  profileInfo: {
    alignItems: 'center',
    marginBottom: vetTheme.spacing.lg,
  },
  veterinarioNombre: {
    fontSize: vetTheme.typography.sizes['2xl'],
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.text.primary,
    marginBottom: vetTheme.spacing.xs,
    textAlign: 'center',
  },
  veterinarioEspecialidad: {
    fontSize: vetTheme.typography.sizes.lg,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
    textAlign: 'center',
  },
  veterinarioExperiencia: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.light,
    marginBottom: vetTheme.spacing.md,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: vetTheme.spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  ratingText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
  },
  verificadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${vetTheme.colors.status.success}15`,
    paddingHorizontal: vetTheme.spacing.md,
    paddingVertical: vetTheme.spacing.xs,
    borderRadius: vetTheme.borderRadius.lg,
  },
  verificadoText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.status.success,
    marginLeft: vetTheme.spacing.xs,
    fontWeight: vetTheme.typography.weights.medium,
  },
  agendarButton: {
    backgroundColor: vetTheme.colors.primary,
    paddingHorizontal: vetTheme.spacing.xl,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.lg,
  },
  agendarButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.semiBold,
    color: 'white',
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
  fotosLista: {
    marginHorizontal: -vetTheme.spacing.lg,
    paddingHorizontal: vetTheme.spacing.lg,
  },
  fotoItem: {
    marginRight: vetTheme.spacing.md,
    alignItems: 'center',
  },
  fotoImage: {
    width: 150,
    height: 100,
    borderRadius: vetTheme.borderRadius.md,
    marginBottom: vetTheme.spacing.xs,
  },
  fotoDescripcion: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.secondary,
    textAlign: 'center',
  },
  consultorioDescripcion: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: vetTheme.spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.md,
  },
  infoText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.text.primary,
    marginLeft: vetTheme.spacing.md,
    flex: 1,
  },
  horariosContainer: {
    marginTop: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.md,
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
  },
  horarioHoras: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.primary,
    fontWeight: vetTheme.typography.weights.medium,
  },
  verMapaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: vetTheme.spacing.sm,
  },
  verMapaText: {
    fontSize: vetTheme.typography.sizes.md,
    color: vetTheme.colors.primary,
    marginLeft: vetTheme.spacing.xs,
    fontWeight: vetTheme.typography.weights.medium,
  },
  servicioCard: {
    backgroundColor: vetTheme.colors.surface,
    borderRadius: vetTheme.borderRadius.md,
    padding: vetTheme.spacing.md,
    marginBottom: vetTheme.spacing.sm,
    borderWidth: 1,
    borderColor: vetTheme.colors.border.light,
  },
  servicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.xs,
  },
  servicioNombre: {
    fontSize: vetTheme.typography.sizes.md,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  servicioPrecio: {
    fontSize: vetTheme.typography.sizes.lg,
    fontWeight: vetTheme.typography.weights.bold,
    color: vetTheme.colors.primary,
  },
  servicioDescripcion: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginBottom: vetTheme.spacing.xs,
  },
  servicioDuracion: {
    fontSize: vetTheme.typography.sizes.xs,
    color: vetTheme.colors.text.light,
  },
  politicaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vetTheme.spacing.sm,
  },
  politicaText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.text.secondary,
    marginLeft: vetTheme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  resenasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vetTheme.spacing.md,
  },
  verTodasText: {
    fontSize: vetTheme.typography.sizes.sm,
    color: vetTheme.colors.primary,
    fontWeight: vetTheme.typography.weights.medium,
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
    fontSize: vetTheme.typography.sizes.sm,
    fontWeight: vetTheme.typography.weights.medium,
    color: vetTheme.colors.text.primary,
  },
  mascotaNombre: {
    fontSize: vetTheme.typography.sizes.xs,
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
  contactoContainer: {
    flexDirection: 'row',
    paddingHorizontal: vetTheme.spacing.lg,
    paddingVertical: vetTheme.spacing.xl,
    gap: vetTheme.spacing.md,
  },
  contactoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.secondary,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
  },
  contactoButtonText: {
    fontSize: vetTheme.typography.sizes.md,
    color: 'white',
    marginLeft: vetTheme.spacing.xs,
    fontWeight: vetTheme.typography.weights.medium,
  },
  agendarFloatingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: vetTheme.colors.primary,
    paddingVertical: vetTheme.spacing.md,
    borderRadius: vetTheme.borderRadius.md,
  },
  agendarFloatingText: {
    fontSize: vetTheme.typography.sizes.md,
    color: 'white',
    fontWeight: vetTheme.typography.weights.semiBold,
  },
});

export default PerfilPublicoScreen;