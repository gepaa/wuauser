import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface VetChatsProfessionalProps {
  navigation: any;
}

interface ChatMessage {
  id: string;
  patientName: string;
  ownerName: string;
  lastMessage: string;
  timestamp: Date;
  unread: boolean;
  priority: 'normal' | 'urgent' | 'emergency';
  ownerPhone?: string;
}

export const VetChatsProfessional: React.FC<VetChatsProfessionalProps> = ({ navigation }) => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    // Mock data for chats
    const mockChats: ChatMessage[] = [
      {
        id: '1',
        patientName: 'Max',
        ownerName: 'Carlos Rodríguez',
        lastMessage: '¿Max puede comer normalmente después de la cirugía?',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        unread: true,
        priority: 'urgent',
        ownerPhone: '+52 55 1234 5678'
      },
      {
        id: '2',
        patientName: 'Luna',
        ownerName: 'María García',
        lastMessage: 'Gracias doctor, Luna ya está mejor 🐕',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        unread: false,
        priority: 'normal',
        ownerPhone: '+52 55 2345 6789'
      },
      {
        id: '3',
        patientName: 'Rocky',
        ownerName: 'Juan Pérez',
        lastMessage: '¡EMERGENCIA! Rocky no puede respirar bien',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        unread: true,
        priority: 'emergency',
        ownerPhone: '+52 55 3456 7890'
      },
      {
        id: '4',
        patientName: 'Milo',
        ownerName: 'Ana López',
        lastMessage: '¿A qué hora sería mejor traer a Milo mañana?',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        unread: false,
        priority: 'normal',
        ownerPhone: '+52 55 4567 8901'
      }
    ];
    setChats(mockChats);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return Colors.error;
      case 'urgent': return Colors.warning;
      case 'normal': return Colors.gray[400];
      default: return Colors.gray[400];
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'warning';
      case 'urgent': return 'alert';
      case 'normal': return 'chatbubble';
      default: return 'chatbubble';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `hace ${days}d`;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleChatPress = (chat: ChatMessage) => {
    // Navigate to individual chat
    navigation.navigate('Chat', {
      otherUser: {
        id: `owner_${chat.id}`,
        name: chat.ownerName,
        petName: chat.patientName
      }
    });
  };

  const handleCallPress = (chat: ChatMessage) => {
    Alert.alert(
      `Llamar a ${chat.ownerName}`,
      `¿Deseas llamar al dueño de ${chat.patientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => {/* Handle call */} }
      ]
    );
  };

  const unreadCount = chats.filter(chat => chat.unread).length;
  const emergencyCount = chats.filter(chat => chat.priority === 'emergency').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensajes</Text>
        <View style={styles.headerStats}>
          {emergencyCount > 0 && (
            <View style={[styles.badge, { backgroundColor: Colors.error }]}>
              <Ionicons name="warning" size={12} color="#FFF" />
              <Text style={styles.badgeText}>{emergencyCount}</Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
          <Text style={styles.statNumber}>{chats.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="mail-unread" size={20} color={Colors.warning} />
          <Text style={[styles.statNumber, { color: Colors.warning }]}>{unreadCount}</Text>
          <Text style={styles.statLabel}>No Leídos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning" size={20} color={Colors.error} />
          <Text style={[styles.statNumber, { color: Colors.error }]}>{emergencyCount}</Text>
          <Text style={styles.statLabel}>Emergencias</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chatsContainer}>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={[
                  styles.chatCard,
                  chat.unread && styles.unreadChat,
                  chat.priority === 'emergency' && styles.emergencyChat
                ]}
                onPress={() => handleChatPress(chat)}
                activeOpacity={0.7}
              >
                <View style={styles.chatHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={[
                      styles.avatar,
                      { backgroundColor: getPriorityColor(chat.priority) }
                    ]}>
                      <Text style={styles.avatarText}>
                        {getInitials(chat.ownerName)}
                      </Text>
                    </View>
                    {chat.priority !== 'normal' && (
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(chat.priority) }
                      ]}>
                        <Ionicons 
                          name={getPriorityIcon(chat.priority)} 
                          size={12} 
                          color="#FFF" 
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.chatContent}>
                    <View style={styles.chatInfo}>
                      <Text style={styles.ownerName}>{chat.ownerName}</Text>
                      <Text style={styles.petName}>• {chat.patientName}</Text>
                      <Text style={styles.timestamp}>{formatTime(chat.timestamp)}</Text>
                    </View>
                    <Text 
                      style={[
                        styles.lastMessage,
                        chat.unread && styles.unreadMessage,
                        chat.priority === 'emergency' && styles.emergencyMessage
                      ]} 
                      numberOfLines={2}
                    >
                      {chat.lastMessage}
                    </Text>
                  </View>

                  <View style={styles.chatActions}>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCallPress(chat)}
                    >
                      <Ionicons name="call" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    {chat.unread && (
                      <View style={styles.unreadIndicator} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No hay mensajes</Text>
              <Text style={styles.emptySubtitle}>
                Los mensajes de los dueños aparecerán aquí
              </Text>
            </View>
          )}
        </View>

        <View style={styles.safetySpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  chatsContainer: {
    paddingHorizontal: 20,
  },
  chatCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  unreadChat: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  emergencyChat: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    backgroundColor: Colors.error + '08',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priorityIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  chatContent: {
    flex: 1,
  },
  chatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D29',
  },
  petName: {
    fontSize: 14,
    color: Colors.gray[500],
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.gray[400],
    marginLeft: 'auto',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#1A1D29',
    fontWeight: '500',
  },
  emergencyMessage: {
    color: Colors.error,
    fontWeight: '600',
  },
  chatActions: {
    alignItems: 'center',
    gap: 12,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  safetySpace: {
    height: 20,
  },
});

export default VetChatsProfessional;