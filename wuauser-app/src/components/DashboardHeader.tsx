import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography, TextStyles } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import { AnimatedButton } from './AnimatedButton';

interface DashboardHeaderProps {
  // User info
  userName: string;
  userTitle?: string;
  
  // Status indicators
  isOnline?: boolean;
  unreadNotifications?: number;
  
  // Actions
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  
  // Appearance
  showGreeting?: boolean;
  showStatus?: boolean;
  showSearch?: boolean;
  backgroundColor?: string;
  
  // Navigation
  navigation?: any;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  userTitle = 'Dr.',
  isOnline = true,
  unreadNotifications = 0,
  onProfilePress,
  onNotificationsPress,
  onSearchPress,
  onSettingsPress,
  showGreeting = true,
  showStatus = true,
  showSearch = true,
  backgroundColor,
  navigation,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute for greeting
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Get appropriate greeting based on time
  const getGreeting = (): string => {
    const hour = currentTime.getHours();
    
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };
  
  // Get user's first name
  const getFirstName = (): string => {
    const name = userName.replace('Dr. ', '').replace('Dra. ', '');
    return name.split(' ')[0];
  };
  
  // Handle notification press
  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      // Default navigation to notifications
      navigation?.navigate('Notifications');
    }
  };
  
  // Handle profile press
  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      // Default navigation to profile
      navigation?.navigate('Perfil');
    }
  };
  
  // Handle search press
  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      Alert.alert('Búsqueda', 'Próximamente podrás buscar pacientes, citas y más.');
    }
  };
  
  // Handle settings press
  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      Alert.alert('Configuración', 'Próximamente disponible.');
    }
  };
  
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={backgroundColor || Colors.primary}
        translucent={false}
      />
      
      <LinearGradient
        colors={[
          backgroundColor || Colors.primary,
          backgroundColor || Colors.primary + 'E6'
        ]}
        style={styles.container}
      >
        {/* Top Row - Profile and Actions */}
        <View style={styles.topRow}>
          {/* Profile Section */}
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={handleProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={Colors.primary} 
                />
              </View>
              
              {/* Online status indicator */}
              {showStatus && isOnline && (
                <View style={styles.statusIndicator} />
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.userTitle}>{userTitle}</Text>
              <Text style={styles.userName}>{getFirstName()}</Text>
            </View>
          </TouchableOpacity>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Search Button */}
            {showSearch && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="search-outline" 
                  size={22} 
                  color={Colors.text.inverse} 
                />
              </TouchableOpacity>
            )}
            
            {/* Notifications Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNotificationsPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="notifications-outline" 
                size={22} 
                color={Colors.text.inverse} 
              />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Settings Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="settings-outline" 
                size={22} 
                color={Colors.text.inverse} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Greeting Section */}
        {showGreeting && (
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>
              {getGreeting()}, {userTitle} {getFirstName()} 👋
            </Text>
            <Text style={styles.greetingSubtext}>
              ¿Cómo va tu consulta hoy?
            </Text>
          </View>
        )}
        
        {/* Connection Status */}
        {showStatus && (
          <View style={styles.statusSection}>
            <View style={[
              styles.connectionStatus, 
              { backgroundColor: isOnline ? Colors.success : Colors.warning }
            ]}>
              <View style={[
                styles.connectionDot,
                { backgroundColor: Colors.text.inverse }
              ]} />
              <Text style={styles.connectionText}>
                {isOnline ? 'Conectado' : 'Sin conexión'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.layout.screenPadding.horizontal,
    ...Shadow.lg,
  },
  
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.text.inverse,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.text.inverse,
  },
  
  profileInfo: {
    flex: 1,
  },
  
  userTitle: {
    ...Typography.caption.medium,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginBottom: 2,
  },
  
  userName: {
    ...Typography.title.large,
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Shadow.xs,
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.text.inverse,
  },
  
  notificationBadgeText: {
    ...Typography.caption.small,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 10,
  },
  
  greetingSection: {
    marginBottom: Spacing.md,
  },
  
  greetingText: {
    ...Typography.headline.medium,
    color: Colors.text.inverse,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  greetingSubtext: {
    ...Typography.body.medium,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  
  statusSection: {
    alignItems: 'flex-start',
  },
  
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  connectionText: {
    ...Typography.caption.medium,
    color: Colors.text.inverse,
    fontWeight: '500',
  },
});

export default DashboardHeader;