import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { veterinarianService, VeterinarianData } from '../services/veterinarianService';
import { chatService } from '../services/chatService';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface VetPublicProfileProps {
  navigation: any;
  route: {
    params: {
      vetId: string;
    };
  };
}

interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  price?: number;
  duration?: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  petType?: string;
}

export const VetPublicProfileScreen: React.FC<VetPublicProfileProps> = ({ navigation, route }) => {
  const { vetId } = route.params;
  const [vetData, setVetData] = useState<VeterinarianData | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    loadVetData();
  }, []);

  const loadVetData = async () => {
    try {
      const { data, error } = await veterinarianService.getVeterinarianById(vetId);
      if (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil del veterinario');
        navigation.goBack();
        return;
      }
      setVetData(data || null);
    } catch (error) {
      console.error('Error loading vet data:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigation.navigate('BookAppointment', {
      vetId: vetData?.id,
      vetName: vetData?.name
    });
  };

  const handleSendMessage = async () => {
    try {
      if (!vetData) return;
      
      // Mock current user ID - in real app get from auth service
      const currentUserId = 'owner_current';
      const vetId = vetData.id;
      
      // Check if chat already exists
      const existingChats = await chatService.getChats(currentUserId);
      const existingChat = existingChats.find(chat => 
        chat.participantIds.includes(vetId)
      );
      
      if (existingChat) {
        // Navigate to existing chat
        navigation.navigate('Chat', { chat: existingChat });
      } else {
        // Create new chat
        const newChat = await chatService.createChat(currentUserId, vetId);
        
        // Update chat with vet info
        newChat.participants.vet.name = vetData.nombre_completo || vetData.email.split('@')[0];
        newChat.participants.vet.clinic = vetData.nombre_clinica;
        
        navigation.navigate('Chat', { chat: newChat });
      }
    } catch (error) {
      console.error('Error creating/opening chat:', error);
      Alert.alert('Error', 'No se pudo abrir la conversación');
    }
  };

  const handleDirections = () => {
    if (vetData?.location) {
      const url = `https://maps.google.com/maps?daddr=${vetData.location.latitude},${vetData.location.longitude}`;
      Linking.openURL(url);
    }
  };

  const getCurrentDaySchedule = () => {
    if (!vetData?.schedule) return null;
    const currentDay = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    return vetData.schedule.find(s => s.day.toLowerCase() === currentDay.toLowerCase());
  };

  const isCurrentlyOpen = () => {
    const schedule = getCurrentDaySchedule();
    if (!schedule || !schedule.isOpen) return false;
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= schedule.openTime && currentTime <= schedule.closeTime;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < Math.floor(rating) ? 'star' : index < rating ? 'star-half' : 'star-outline'}
        size={16}
        color="#F4B740"
      />
    ));
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#F4B740', '#FFF8E7']}
      style={styles.header}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
      </TouchableOpacity>
      
      <View style={styles.profileContainer}>
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120x120?text=Dr' }}
            style={styles.profilePhoto}
          />
          {vetData?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>
        
        <View style={styles.nameContainer}>
          <Text style={styles.vetName}>{vetData?.name || 'Dr. Veterinario'}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderStars(vetData?.rating || 0)}
            </View>
            <Text style={styles.ratingText}>
              {vetData?.rating?.toFixed(1)} ({vetData?.reviewCount} reseñas)
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isCurrentlyOpen() ? '#4CAF50' : '#FF5722' }]} />
            <Text style={styles.statusText}>
              {isCurrentlyOpen() ? 'Abierto ahora' : 'Cerrado'}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
        <Ionicons name="calendar" size={20} color="#FFF" />
        <Text style={styles.bookButtonText}>Agendar Cita</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderProfessionalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información Profesional</Text>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Ionicons name="school-outline" size={20} color="#F4B740" />
          <Text style={styles.infoLabel}>Cédula Profesional</Text>
          <Text style={styles.infoValue}>12345678</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={20} color="#F4B740" />
          <Text style={styles.infoLabel}>Experiencia</Text>
          <Text style={styles.infoValue}>8 años</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="language-outline" size={20} color="#F4B740" />
          <Text style={styles.infoLabel}>Idiomas</Text>
          <Text style={styles.infoValue}>Español, Inglés</Text>
        </View>
      </View>
      
      <View style={styles.specialtiesContainer}>
        <Text style={styles.subsectionTitle}>Especialidades</Text>
        <View style={styles.specialtyChips}>
          {vetData?.specialties?.map((specialty, index) => (
            <View key={index} style={styles.specialtyChip}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAboutMe = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sobre Mí</Text>
      <Text style={styles.aboutText}>
        {vetData?.description || 
        'Veterinario apasionado por el cuidado integral de las mascotas. Mi filosofía se basa en brindar atención personalizada y de calidad, tratando a cada paciente con el amor y respeto que merece.'}
      </Text>
      
      <View style={styles.philosophyContainer}>
        <Text style={styles.subsectionTitle}>Mi Filosofía</Text>
        <Text style={styles.philosophyText}>
          "Cada mascota es única y merece un cuidado especializado. Mi compromiso es brindar el mejor tratamiento médico con calidez humana."
        </Text>
      </View>
    </View>
  );

  const renderServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Servicios y Precios</Text>
      
      {vetData?.services?.map((service, index) => (
        <TouchableOpacity
          key={service.id}
          style={styles.serviceItem}
          onPress={() => setExpandedService(expandedService === service.id ? null : service.id)}
        >
          <View style={styles.serviceHeader}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCategory}>{service.category}</Text>
            </View>
            <View style={styles.servicePriceContainer}>
              {service.price && (
                <Text style={styles.servicePrice}>${service.price}</Text>
              )}
              <Ionicons
                name={expandedService === service.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </View>
          </View>
          
          {expandedService === service.id && (
            <Animated.View style={styles.serviceDetails}>
              <Text style={styles.serviceDescription}>
                {service.description || 'Servicio profesional de calidad para el cuidado de tu mascota.'}
              </Text>
              <View style={styles.serviceMetadata}>
                <View style={styles.metadataItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.metadataText}>45 min aprox.</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderLocation = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ubicación</Text>
      
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="location" size={40} color="#F4B740" />
          <Text style={styles.mapPlaceholderText}>Mapa de ubicación</Text>
        </View>
      </View>
      
      <View style={styles.addressContainer}>
        <Text style={styles.address}>{vetData?.location?.address}</Text>
        <Text style={styles.cityState}>
          {vetData?.location?.city}, {vetData?.location?.state}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
        <Ionicons name="navigate" size={20} color="#F4B740" />
        <Text style={styles.directionsText}>Cómo llegar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Horarios de Atención</Text>
      
      <View style={styles.scheduleContainer}>
        {vetData?.schedule?.map((schedule, index) => (
          <View key={index} style={styles.scheduleItem}>
            <Text style={styles.scheduleDay}>{schedule.day}</Text>
            <Text style={[
              styles.scheduleTime,
              schedule.isOpen && styles.scheduleTimeOpen
            ]}>
              {schedule.isOpen ? `${schedule.openTime} - ${schedule.closeTime}` : 'Cerrado'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviews = () => {
    const mockReviews: Review[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'María González',
        rating: 5,
        comment: 'Excelente atención, muy profesional y cariñoso con mi perrito.',
        date: '2024-01-15',
        petType: 'Perro'
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Carlos López',
        rating: 4,
        comment: 'Buen servicio, aunque un poco caro. El doctor explica muy bien.',
        date: '2024-01-10',
        petType: 'Gato'
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Ana Martínez',
        rating: 5,
        comment: 'Salvó a mi gatita en una emergencia. Muy recomendado!',
        date: '2024-01-08',
        petType: 'Gato'
      }
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reseñas ({vetData?.reviewCount || 0})</Text>
        
        <View style={styles.reviewsSummary}>
          <View style={styles.ratingOverview}>
            <Text style={styles.averageRating}>{vetData?.rating?.toFixed(1) || '0.0'}</Text>
            <View style={styles.starsLarge}>
              {renderStars(vetData?.rating || 0)}
            </View>
            <Text style={styles.reviewCount}>{vetData?.reviewCount || 0} reseñas</Text>
          </View>
        </View>
        
        {mockReviews.slice(0, 3).map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <View style={styles.reviewStars}>
                  {renderStars(review.rating)}
                </View>
              </View>
              <Text style={styles.reviewDate}>
                {new Date(review.date).toLocaleDateString('es-ES')}
              </Text>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            {review.petType && (
              <Text style={styles.reviewPetType}>Consulta: {review.petType}</Text>
            )}
          </View>
        ))}
        
        <TouchableOpacity style={styles.viewAllReviews}>
          <Text style={styles.viewAllReviewsText}>Ver todas las reseñas</Text>
          <Ionicons name="chevron-forward" size={16} color="#F4B740" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderGallery = () => {
    const mockPhotos = [
      'https://via.placeholder.com/200x150?text=Clinica+1',
      'https://via.placeholder.com/200x150?text=Consultorio',
      'https://via.placeholder.com/200x150?text=Recepcion',
      'https://via.placeholder.com/200x150?text=Quirofano',
      'https://via.placeholder.com/200x150?text=Equipo',
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Galería</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gallery}
          contentContainerStyle={styles.galleryContent}
        >
          {mockPhotos.map((photo, index) => (
            <TouchableOpacity key={index} style={styles.galleryItem}>
              <Image source={{ uri: photo }} style={styles.galleryImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFloatingButtons = () => (
    <View style={styles.floatingContainer}>
      <TouchableOpacity style={styles.messageButton} onPress={handleSendMessage}>
        <Ionicons name="chatbubble" size={24} color="#FFF" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.bookFloatingButton} onPress={handleBookAppointment}>
        <Ionicons name="calendar" size={24} color="#FFF" />
        <Text style={styles.bookFloatingText}>Agendar</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!vetData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVetData}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        {renderProfessionalInfo()}
        {renderAboutMe()}
        {renderServices()}
        {renderLocation()}
        {renderSchedule()}
        {renderReviews()}
        {renderGallery()}
        
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
      
      {renderFloatingButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F4B740',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  nameContainer: {
    flex: 1,
  },
  vetName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  specialtiesContainer: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 12,
  },
  specialtyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyChip: {
    backgroundColor: '#F4B740',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  philosophyContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F4B740',
  },
  philosophyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  serviceItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 16,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F4B740',
    marginRight: 8,
  },
  serviceDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  serviceMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  addressContainer: {
    marginBottom: 16,
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  cityState: {
    fontSize: 14,
    color: '#666',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  directionsText: {
    fontSize: 16,
    color: '#F4B740',
    fontWeight: '600',
    marginLeft: 8,
  },
  scheduleContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#666',
  },
  scheduleTimeOpen: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  reviewsSummary: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingOverview: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F4B740',
    marginBottom: 4,
  },
  starsLarge: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewPetType: {
    fontSize: 12,
    color: '#F4B740',
    fontWeight: '500',
  },
  viewAllReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  viewAllReviewsText: {
    fontSize: 16,
    color: '#F4B740',
    fontWeight: '600',
    marginRight: 4,
  },
  gallery: {
    marginHorizontal: -20,
  },
  galleryContent: {
    paddingHorizontal: 20,
  },
  galleryItem: {
    marginRight: 12,
  },
  galleryImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookFloatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4B740',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookFloatingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default VetPublicProfileScreen;