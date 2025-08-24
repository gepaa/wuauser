import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { MyPetsScreen } from '../screens/MyPetsScreen';
import { MapScreen } from '../screens/MapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VetDashboardScreen } from '../screens/VetDashboardScreen';
import { VetAppointmentsScreen } from '../screens/VetAppointmentsScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import roleService, { UserRole } from '../services/roleService';
import { chatService } from '../services/chatService';

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

  // Dynamic tab configuration based on role
  const getTabConfig = () => {
    if (currentRole === 'veterinario') {
      return {
        tabs: [
          { name: 'Dashboard', component: VetDashboardScreen, label: 'Panel', icon: 'medical' },
          { name: 'Citas', component: VetAppointmentsScreen, label: 'Citas', icon: 'calendar' },
          { name: 'ChatList', component: ChatListScreen, label: 'Mensajes', icon: 'chatbubbles' },
          { name: 'Mapa', component: MapScreen, label: 'Mapa', icon: 'map' },
          { name: 'Perfil', component: ProfileScreen, label: 'Perfil', icon: 'person' }
        ]
      };
    } else {
      return {
        tabs: [
          { name: 'Inicio', component: HomeScreen, label: 'Inicio', icon: 'home' },
          { name: 'MisMascotas', component: MyPetsScreen, label: 'Mis Mascotas', icon: 'paw' },
          { name: 'ChatList', component: ChatListScreen, label: 'Mensajes', icon: 'chatbubbles' },
          { name: 'Mapa', component: MapScreen, label: 'Mapa', icon: 'map' },
          { name: 'Perfil', component: ProfileScreen, label: 'Perfil', icon: 'person' }
        ]
      };
    }
  };

  const tabConfig = getTabConfig();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const tab = tabConfig.tabs.find(t => t.name === route.name);
          const iconName = tab ? (focused ? tab.icon : `${tab.icon}-outline`) : 'help-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 70,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarItemStyle: {
          flex: 1,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        animation: 'shift',
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      {tabConfig.tabs.map((tab) => (
        <Tab.Screen 
          key={tab.name}
          name={tab.name} 
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarBadge: tab.name === 'ChatList' && unreadCount > 0 ? unreadCount : undefined
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default TabNavigator;