import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  RefreshControl,
  Linking,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../constants/colors';
import { veterinarianService, VeterinarianData, VeterinarianReview } from '../services/veterinarianService';

const { width, height } = Dimensions.get('window');

interface VetDetailScreenProps {
  navigation: any;
  route: {
    params: {
      vetId: string;
      vetData?: VeterinarianData;
    };
  };
}

export const VetDetailScreen: React.FC<VetDetailScreenProps> = ({ navigation, route }) => {
  const { vetId, vetData: initialVetData } = route.params;
  
  const [vetData, setVetData] = useState<VeterinarianData | null>(initialVetData || null);
  const [reviews, setReviews] = useState<VeterinarianReview[]>([]);
  const [isLoading, setIsLoading] = useState(!initialVetData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!initialVetData) {
      loadVetData();
    }
    loadReviews();
  }, []);

  const loadVetData = async () => {
    try {
      const result = await veterinarianService.getVeterinarianById(vetId);
      if (result.data) {
        setVetData(result.data);
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error loading vet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const result = await veterinarianService.getVeterinarianReviews(vetId);
      if (result.data) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadVetData(), loadReviews()]);
    setRefreshing(false);
  }, []);

  const handleCall = () => {
    if (!vetData?.phone) return;
    
    Alert.alert(
      `Llamar a ${vetData.name}`,
      `¿Deseas llamar ahora?\n\n${vetData.phone}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => Linking.openURL(`tel:${vetData.phone}`)
        }
      ]
    );
  };

  const handleWhatsApp = () => {
    if (!vetData?.whatsapp) return;
    
    const message = encodeURIComponent(`Hola, me interesa agendar una cita para mi mascota en ${vetData.name}`);
    const whatsappUrl = `whatsapp://send?phone=${vetData.whatsapp}&text=${message}`;
    
    Linking.canOpenURL(whatsappUrl).then((canOpen) => {
      if (canOpen) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp no disponible', 'WhatsApp no está instalado en este dispositivo');
      }
    });
  };

  const handleDirections = () => {
    if (!vetData?.location) return;
    
    const { latitude, longitude } = vetData.location;
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    Linking.openURL(mapsUrl);
  };

  const handleScheduleAppointment = () => {
    Alert.alert(
      'Agendar Cita',
      `¿Te gustaría agendar una cita en ${vetData?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            Alert.alert('Próximamente', 'La función de agenda estará disponible pronto.');
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    if (!vetData) return;
    
    try {
      await Share.share({
        message: `Te recomiendo ${vetData.name} - ${vetData.location.address}. Rating: ${vetData.rating}⭐`,
        title: `${vetData.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color="#FFD700" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#DDD" />);
    }
    
    return stars;
  };

  const renderPhotos = () => (
    <View style={styles.photosContainer}>
      {vetData?.photos && vetData.photos.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const index = Math.round(nativeEvent.contentOffset.x / width);
            setSelectedImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {vetData.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="camera-outline" size={60} color="#DDD" />
          <Text style={styles.photoPlaceholderText}>Sin fotos disponibles</Text>
        </View>
      )}
      
      {vetData?.photos && vetData.photos.length > 1 && (
        <View style={styles.photoIndicators}>
          {vetData.photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.photoIndicator,
                selectedImageIndex === index && styles.activePhotoIndicator
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.scheduleContainer}>
      <Text style={styles.sectionTitle}>Horarios</Text>
      {vetData?.schedule.map((day, index) => (
        <View key={index} style={styles.scheduleRow}>
          <Text style={[styles.scheduleDay, !day.isOpen && styles.closedDay]}>
            {day.day}
          </Text>
          <Text style={[styles.scheduleTime, !day.isOpen && styles.closedTime]}>
            {day.isOpen ? `${day.openTime} - ${day.closeTime}` : 'Cerrado'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderServices = () => (
    <View style={styles.servicesContainer}>
      <Text style={styles.sectionTitle}>Servicios</Text>
      <View style={styles.servicesGrid}>
        {vetData?.services.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.price && (
                <Text style={styles.servicePrice}>${service.price}</Text>
              )}
            </View>
            {service.description && (
              <Text style={styles.serviceDescription}>{service.description}</Text>
            )}
            <View style={styles.serviceCategoryTag}>
              <Text style={styles.serviceCategoryText}>
                {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviews = () => (
    <View style={styles.reviewsContainer}>
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>Reseñas</Text>
        <View style={styles.reviewsSummary}>
          <View style={styles.overallRating}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.overallRatingText}>{vetData?.rating}</Text>
          </View>
          <Text style={styles.reviewCount}>({vetData?.reviewCount} reseñas)</Text>
        </View>
      </View>

      {reviews.length > 0 ? (
        reviews.slice(0, 3).map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.userName}</Text>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
              </View>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <View style={styles.reviewFooter}>
              {review.petType && (
                <View style={styles.petTypeTag}>
                  <Text style={styles.petTypeText}>{review.petType}</Text>
                </View>
              )}
              <Text style={styles.reviewDate}>
                {new Date(review.date).toLocaleDateString('es-MX')}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.noReviews}>
          <Ionicons name="chatbubble-outline" size={40} color="#DDD" />
          <Text style={styles.noReviewsText}>Sin reseñas aún</Text>
        </View>
      )}

      {reviews.length > 3 && (
        <TouchableOpacity style={styles.seeAllReviews}>
          <Text style={styles.seeAllReviewsText}>Ver todas las reseñas</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <Text style={styles.sectionTitle}>Ubicación</Text>
      <View style={styles.mapWrapper}>
        {/* MapView temporarily disabled - requires react-native-maps installation */}
        <View style={[styles.map, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="map-outline" size={48} color="#ccc" />
          <Text style={{ color: '#999', marginTop: 8 }}>Mapa no disponible</Text>
        </View>
        <TouchableOpacity style={styles.mapOverlay} onPress={handleDirections}>
          <Ionicons name="navigate-outline" size={24} color={colors.primary} />
          <Text style={styles.mapOverlayText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.address}>{vetData?.location.address}</Text>
      <Text style={styles.cityState}>
        {vetData?.location.city}, {vetData?.location.state}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  if (!vetData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={60} color="#FF9800" />
        <Text style={styles.errorText}>No se pudo cargar la información</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVetData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#E3F2FD']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2A2A2A" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#2A2A2A" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Photos */}
        {renderPhotos()}

        {/* Basic Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameSection}>
            <Text style={styles.vetName}>{vetData.name}</Text>
            {vetData.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingSection}>
            <View style={styles.stars}>
              {renderStars(vetData.rating)}
            </View>
            <Text style={styles.ratingText}>
              {vetData.rating} ({vetData.reviewCount} reseñas)
            </Text>
          </View>

          <View style={styles.statusSection}>
            <View style={[styles.statusDot, { backgroundColor: vetData.isOpen ? '#4CAF50' : '#FF5722' }]} />
            <Text style={[styles.statusText, { color: vetData.isOpen ? '#4CAF50' : '#FF5722' }]}>
              {vetData.isOpen ? 'Abierto ahora' : 'Cerrado'}
              {vetData.nextOpenTime && !vetData.isOpen && ` • Abre ${vetData.nextOpenTime}`}
            </Text>
          </View>

          {vetData.description && (
            <Text style={styles.description}>{vetData.description}</Text>
          )}

          <View style={styles.specialtiesSection}>
            <Text style={styles.specialtiesLabel}>Especialidades:</Text>
            <View style={styles.specialties}>
              {vetData.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.primaryActionButton} onPress={handleScheduleAppointment}>
            <Ionicons name="calendar" size={20} color="#FFF" />
            <Text style={styles.primaryActionButtonText}>Agendar Cita</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActionButtons}>
            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#4CAF50" />
              <Text style={styles.secondaryActionButtonText}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.secondaryActionButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryActionButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={20} color="#2196F3" />
              <Text style={styles.secondaryActionButtonText}>Cómo llegar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule */}
        {renderSchedule()}

        {/* Services */}
        {renderServices()}

        {/* Reviews */}
        {renderReviews()}

        {/* Map */}
        {renderMap()}

        {/* Safety Space */}
        <View style={styles.safetySpace} />
      </ScrollView>
    </View>
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
    padding: 20,
    backgroundColor: '#FFF',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  photosContainer: {
    height: 250,
    position: 'relative',
  },
  photo: {
    width: width,
    height: 250,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: width,
    height: 250,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  photoIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activePhotoIndicator: {
    backgroundColor: '#FFF',
  },
  infoContainer: {
    padding: 20,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  vetName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 22,
    marginBottom: 16,
  },
  specialtiesSection: {
    marginBottom: 8,
  },
  specialtiesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  primaryActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 4,
  },
  secondaryActionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  scheduleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  scheduleTime: {
    fontSize: 16,
    color: '#4A4A4A',
  },
  closedDay: {
    color: '#999',
  },
  closedTime: {
    color: '#999',
  },
  servicesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceCategoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceCategoryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  reviewsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallRatingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petTypeTag: {
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  petTypeText: {
    fontSize: 12,
    color: '#F4B740',
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  seeAllReviews: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  seeAllReviewsText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  mapContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  mapWrapper: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  mapMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapOverlayText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  address: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
    marginBottom: 4,
  },
  cityState: {
    fontSize: 14,
    color: '#666',
  },
  safetySpace: {
    height: 100,
  },
});

export default VetDetailScreen;