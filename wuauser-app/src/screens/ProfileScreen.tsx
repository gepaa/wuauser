import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { authService, supabase } from '../services/supabase';
import { useCustomAlert } from '../components/CustomAlert';
import { useUserProfile } from '../hooks/useUserProfile';
import { RoleSwitcher } from '../components/owner/RoleSwitcher';
import roleService, { UserRole } from '../services/roleService';

interface ProfileScreenProps {
  navigation: any;
}

interface UserData {
  nombre_completo: string;
  email: string;
  telefono?: string;
  tipo_usuario: string;
}

interface ProfileOption {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { profile, loading, refreshProfile } = useUserProfile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('dueno');
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    // Initialize role and subscribe to changes
    const initializeRole = async () => {
      await roleService.initialize();
      setCurrentRole(roleService.getCurrentRole());
    };

    initializeRole();

    // Subscribe to role changes
    const unsubscribe = roleService.subscribe((newRole) => {
      setCurrentRole(newRole);
    });

    return unsubscribe;
  }, []);

  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedNotifications = await SecureStore.getItemAsync('notifications_enabled');
        const savedLocation = await SecureStore.getItemAsync('location_enabled');

        if (savedNotifications !== null) {
          setNotificationsEnabled(JSON.parse(savedNotifications));
        }

        if (savedLocation !== null) {
          setLocationEnabled(JSON.parse(savedLocation));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save notification setting when it changes
  useEffect(() => {
    const saveNotificationSetting = async () => {
      try {
        await SecureStore.setItemAsync('notifications_enabled', JSON.stringify(notificationsEnabled));

        if (profile) { // Only show toast if profile is loaded (not initial load)
          if (notificationsEnabled) {
            Toast.show({
              type: 'success',
              text1: 'Notificaciones activadas',
              text2: 'Recibirás alertas importantes de Wuauser',
              position: 'bottom'
            });
          } else {
            Toast.show({
              type: 'info',
              text1: 'Notificaciones desactivadas',
              text2: 'No recibirás alertas automáticas',
              position: 'bottom'
            });
          }
        }
      } catch (error) {
        console.error('Error saving notification setting:', error);
      }
    };

    // Only save if not the first render
    if (profile) {
      saveNotificationSetting();
    }
  }, [notificationsEnabled, profile]);

  // Save location setting when it changes
  useEffect(() => {
    const saveLocationSetting = async () => {
      try {
        await SecureStore.setItemAsync('location_enabled', JSON.stringify(locationEnabled));

        if (profile) { // Only show toast if profile is loaded (not initial load)
          if (locationEnabled) {
            Toast.show({
              type: 'success',
              text1: 'Ubicación activada',
              text2: 'Podrás ver servicios veterinarios cercanos',
              position: 'bottom'
            });
          } else {
            Toast.show({
              type: 'info',
              text1: 'Ubicación desactivada',
              text2: 'No se mostrarán servicios basados en ubicación',
              position: 'bottom'
            });
          }
        }
      } catch (error) {
        console.error('Error saving location setting:', error);
      }
    };

    // Only save if not the first render
    if (profile) {
      saveLocationSetting();
    }
  }, [locationEnabled, profile]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );


  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleMyPets = () => {
    // Navigate to MyPets tab (using getParent to access tab navigator)
    navigation.getParent()?.navigate('MisMascotas');
  };

  const handleMapView = () => {
    // Navigate to Map tab
    navigation.getParent()?.navigate('Mapa');
  };

  const handleHome = () => {
    // Navigate to Home tab
    navigation.getParent()?.navigate('Inicio');
  };

  const handlePaymentMethods = () => {
    Toast.show({
      type: 'info',
      text1: 'Próximamente',
      text2: 'La gestión de métodos de pago estará disponible pronto.',
      position: 'bottom'
    });
  };

  const handleNotifications = () => {
    // Toggle automático ya funciona, solo mostrar info adicional
    showAlert({
      type: 'info',
      title: 'Configuración de Notificaciones',
      message: 'Las notificaciones te ayudan a estar al día con:\n\n• Recordatorios de citas\n• Mensajes de veterinarios\n• Actualizaciones importantes\n• Alertas de mascotas perdidas',
      buttons: [
        { text: 'Entendido', onPress: () => {} }
      ]
    });
  };

  const handlePrivacy = () => {
    showAlert({
      type: 'info',
      title: 'Privacidad y Seguridad',
      message: 'Tu privacidad es importante para nosotros.\n\nWuauser protege:\n• Información personal\n• Datos de mascotas\n• Ubicación (solo cuando autorices)\n• Conversaciones con veterinarios\n\nLa configuración avanzada estará disponible pronto.',
      buttons: [
        { text: 'Entendido', onPress: () => {} }
      ]
    });
  };

  const handleHelp = () => {
    showAlert({
      type: 'info',
      title: 'Centro de Ayuda - Wuauser',
      message: '¿En qué podemos ayudarte hoy?',
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'WhatsApp Soporte',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Contactando soporte...',
              text2: 'WhatsApp: +52 55 1234 5678',
              position: 'bottom'
            });
          }
        },
        {
          text: 'Email Soporte',
          onPress: () => {
            Toast.show({
              type: 'info',
              text1: 'Soporte por Email',
              text2: 'Escríbenos a: soporte@wuauser.com',
              position: 'bottom'
            });
          }
        }
      ]
    });
  };

  const handleAbout = () => {
    showAlert({
      type: 'info',
      title: 'Acerca de Wuauser',
      message: 'Wuauser v1.0.0\n\nConectando veterinarios con dueños de mascotas en México.\n\n© 2024 Wuauser. Todos los derechos reservados.'
    });
  };

  const handleLogout = () => {
    showAlert({
      type: 'warning',
      title: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear session from SecureStore
              await SecureStore.deleteItemAsync('user_email');
              await SecureStore.deleteItemAsync('user_session');
              await SecureStore.deleteItemAsync('user_type');
              
              // Sign out from Supabase
              await authService.signOut();
              
              // Navigate back to login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error logging out:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'No se pudo cerrar sesión. Intenta nuevamente.'
              });
            }
          }
        }
      ]
    });
  };

  const profileOptions: ProfileOption[] = [
    {
      id: 'edit_profile',
      title: 'Editar Perfil',
      subtitle: 'Actualizar información personal',
      icon: 'person-outline',
      color: '#2196F3',
      action: handleEditProfile,
      showArrow: true,
    },
    {
      id: 'my_pets',
      title: 'Mis Mascotas',
      subtitle: 'Gestionar mascotas registradas',
      icon: 'paw-outline',
      color: '#F4B740',
      action: handleMyPets,
      showArrow: true,
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      subtitle: 'Configurar alertas y avisos',
      icon: 'notifications-outline',
      color: '#FF9800',
      action: handleNotifications,
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E0E0E0', true: '#FF9800' }}
          thumbColor={notificationsEnabled ? '#FFF' : '#999'}
        />
      ),
    },
    {
      id: 'location',
      title: 'Ubicación',
      subtitle: 'Servicios basados en ubicación',
      icon: 'location-outline',
      color: '#4CAF50',
      action: () => {},
      rightComponent: (
        <Switch
          value={locationEnabled}
          onValueChange={setLocationEnabled}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor={locationEnabled ? '#FFF' : '#999'}
        />
      ),
    },
    {
      id: 'payment',
      title: 'Métodos de Pago',
      subtitle: 'Tarjetas y métodos de pago',
      icon: 'card-outline',
      color: '#9C27B0',
      action: handlePaymentMethods,
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacidad y Seguridad',
      subtitle: 'Configuración de privacidad',
      icon: 'shield-outline',
      color: '#607D8B',
      action: handlePrivacy,
      showArrow: true,
    },
    {
      id: 'help',
      title: 'Centro de Ayuda',
      subtitle: 'FAQ y soporte',
      icon: 'help-circle-outline',
      color: '#795548',
      action: handleHelp,
      showArrow: true,
    },
    {
      id: 'about',
      title: 'Acerca de',
      subtitle: 'Información de la app',
      icon: 'information-circle-outline',
      color: '#9E9E9E',
      action: handleAbout,
      showArrow: true,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with user info */}
      <LinearGradient
        colors={['#F4B740', '#FFF8E7']}
        style={styles.header}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#F4B740" />
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{profile?.nombre_completo || 'Sin nombre'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'Sin email'}</Text>
            {profile?.telefono && (
              <Text style={styles.userPhone}>{profile.telefono}</Text>
            )}
            <View style={styles.userTypeBadge}>
              <Text style={styles.userTypeText}>
                {profile?.tipo_usuario === 'veterinario' ? '🩺 Veterinario' : '🐕 Dueño de Mascota'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Role Switcher */}
      <View style={styles.roleSwitcherContainer}>
        <RoleSwitcher 
          currentRole={currentRole}
          onRoleSwitch={(newRole) => {
            setCurrentRole(newRole);
            // Navigate to the appropriate home screen for the new role
            const homeScreen = roleService.getHomeScreen(newRole);
            navigation.reset({
              index: 0,
              routes: [{ name: homeScreen }],
            });
          }}
        />
      </View>

      {/* Profile Options */}
      <View style={styles.optionsContainer}>
        {profileOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionItem}
            onPress={option.action}
            activeOpacity={0.8}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              
              <View style={styles.optionTexts}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.optionRight}>
              {option.rightComponent || (option.showArrow && (
                <Ionicons name="chevron-forward" size={20} color="#999" />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Refresh Profile Button */}
      <View style={styles.refreshContainer}>
        <TouchableOpacity 
          style={styles.refreshProfileButton} 
          onPress={refreshProfile}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color="#F4B740" />
          <Text style={styles.refreshProfileText}>Actualizar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Wuauser v1.0.0</Text>
      </View>

      {/* Safety Space */}
      <View style={styles.safetySpace} />
      </ScrollView>
      
      {AlertComponent}
    </>
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
    color: Colors.text.secondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  optionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  optionRight: {
    marginLeft: 12,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  versionContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  safetySpace: {
    height: 100,
  },
  roleSwitcherContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  refreshContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  refreshProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(244, 183, 64, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 183, 64, 0.3)',
    gap: 8,
  },
  refreshProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F4B740',
  },
});

export default ProfileScreen;