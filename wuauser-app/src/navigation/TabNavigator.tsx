import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ownerTheme } from '../constants/ownerTheme';
import { HapticFeedback } from '../utils/hapticFeedback';
import { HomeScreen } from '../screens/HomeScreen';
import { MyPetsScreen } from '../screens/MyPetsScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import VetTabNavigator from './VetTabNavigator';
import roleService, { UserRole } from '../services/roleService';
import { chatService } from '../services/chatService';
// import { ModernTabBar } from '../components/owner';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('dueno');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // Initialize role service and subscribe to changes
    const initializeRole = async () => {
      await roleService.initialize();
      setCurrentRole(roleService.getCurrentRole());
    };

    initializeRole();
    loadUnreadCount();

    // Subscribe to role changes
    const unsubscribe = roleService.subscribe((newRole) => {
      setCurrentRole(newRole);
    });

    return unsubscribe;
  }, []);

  const loadUnreadCount = async () => {
    try {
      // Mock current user ID - in real app get from auth service
      const userId = 'owner_current';
      const count = await chatService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Return different navigators based on role
  if (currentRole === 'veterinario') {
    return <VetTabNavigator />;
  }

  // Owner navigation (existing)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'help-outline';
          
          switch (route.name) {
            case 'Inicio':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'MisMascotas':
              iconName = focused ? 'paw' : 'paw-outline';
              break;
            case 'ChatList':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Mapa':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: focused ? '#F4B740' + '15' : 'transparent',
            }}>
              <Ionicons 
                name={iconName as any} 
                size={focused ? size + 2 : size} 
                color={color} 
              />
            </View>
          );
        },
        tabBarActiveTintColor: '#F4B740',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          paddingTop: 15,
          height: Platform.OS === 'ios' ? 95 : 80,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarItemStyle: {
          flex: 1,
          paddingHorizontal: 4,
          marginHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        animation: 'shift',
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="Inicio" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="MisMascotas" 
        component={MyPetsScreen}
        options={{
          tabBarLabel: 'Mis Mascotas',
        }}
      />
      <Tab.Screen 
        name="ChatList" 
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Mensajes',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined
        }}
      />
      <Tab.Screen 
        name="Mapa" 
        component={MapScreen}
        options={{
          tabBarLabel: 'Mapa',
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;