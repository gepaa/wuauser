import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WuauserLogo } from '../components/WuauserLogo';
import { Colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface UserTypeScreenProps {
  navigation: any;
}

interface UserTypeCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: [string, string];
  onPress: () => void;
  badge?: string;
}

const UserTypeCard: React.FC<UserTypeCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  gradient,
  onPress,
  badge
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradient}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
              <Text style={styles.cardDescription}>{description}</Text>
            </View>
          </View>
          
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const UserTypeScreen: React.FC<UserTypeScreenProps> = ({ navigation }) => {
  const handleUserTypeSelection = async (userType: string, screen: string) => {
    try {
      await AsyncStorage.setItem('userType', userType);
      navigation.navigate(screen);
    } catch (error) {
      console.error('Error guardando tipo de usuario:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <WuauserLogo size={80} />
        <Text style={styles.welcomeText}>Bienvenido a Wuauser</Text>
        <Text style={styles.questionText}>¿Cómo quieres usar Wuauser?</Text>
      </View>

      <View style={styles.cardsContainer}>
        <UserTypeCard
          title="Dueño de Mascota"
          subtitle="Para cuidadores"
          description="Encuentra veterinarios cerca de ti, agenda citas y mantén el historial médico de tu mascota"
          icon={<MaterialCommunityIcons name="paw" size={60} color="#FFF" />}
          gradient={['#F4B740', '#E85D4E']}
          onPress={() => handleUserTypeSelection('dueno', 'RegisterDueno')}
        />

        <UserTypeCard
          title="Veterinario"
          subtitle="Cuenta Profesional"
          description="Ofrece tus servicios, gestiona tu agenda y conecta con dueños de mascotas en tu área"
          icon={<FontAwesome5 name="stethoscope" size={60} color="#FFF" />}
          gradient={['#4ECDC4', '#44A08D']}
          onPress={() => handleUserTypeSelection('veterinario', 'RegisterVeterinario')}
          badge="Cuenta Profesional"
        />

        <UserTypeCard
          title="Encontré una Mascota"
          subtitle="Acceso rápido"
          description="Reporta una mascota perdida o encontrada para ayudar a reunirla con su familia"
          icon={<MaterialCommunityIcons name="hand-heart" size={60} color="#FFF" />}
          gradient={['#A8A8A8', '#6C6C6C']}
          onPress={() => handleUserTypeSelection('guest', 'QRScanner')}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginTop: 20,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#4A4A4A',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  cardContainer: {
    marginBottom: 5,
  },
  card: {
    minHeight: 220,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    position: 'relative',
    justifyContent: 'space-between',
  },
  badge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  iconContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 15,
    textAlign: 'left',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  loginLink: {
    paddingVertical: 15,
  },
  loginText: {
    fontSize: 16,
    color: '#F4B740',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default UserTypeScreen;