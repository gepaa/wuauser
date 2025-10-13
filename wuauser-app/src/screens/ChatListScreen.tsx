import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, ChatUser } from '../types/chat';
import { chatService } from '../services/chatService';
import { Colors } from '../constants/colors';

interface ChatListScreenProps {
  navigation: any;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);

  useEffect(() => {
    console.log('ChatsListScreen montado');
    const initializeScreen = async () => {
      await loadCurrentUser();
      await loadChats();
    };
    
    initializeScreen();
    
    const unsubscribe = navigation.addListener('focus', () => {
      loadChats();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadCurrentUser = async () => {
    try {
      // Mock current user - in real app get from auth service
      const user: ChatUser = {
        id: 'owner_current',
        name: 'Usuario Actual',
        type: 'owner'
      };
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadChats = async () => {
    try {
      console.log('Iniciando carga de chats...');
      setIsLoading(true);

      if (currentUser) {
        // Usar el servicio de chat para obtener datos
        const chatsData = await chatService.getChats(currentUser.id);
        console.log('Chats cargados:', chatsData.length);
        setChats(chatsData);
      } else {
        // Si no hay usuario, usar datos mock básicos
        const mockChats: Chat[] = [
          {
            id: 'chat_demo_1',
            participantIds: ['owner1', 'vet1'],
            participants: {
              owner: { id: 'owner1', name: 'Tú' },
              vet: {
                id: 'vet1',
                name: 'Dra. María González',
                clinic: 'Veterinaria San José'
              }
            },
            lastMessage: {
              text: 'Gracias por atender a Yoky, ya está mucho mejor',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              senderId: 'owner1'
            },
            unreadCount: 2,
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'chat_demo_2',
            participantIds: ['owner1', 'vet2'],
            participants: {
              owner: { id: 'owner1', name: 'Tú' },
              vet: {
                id: 'vet2',
                name: 'Dr. Carlos Ruiz',
                clinic: 'Hospital Animal Center'
              }
            },
            lastMessage: {
              text: 'La próxima cita es el martes a las 4pm',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              senderId: 'vet2'
            },
            unreadCount: 0,
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ];

        console.log('Chats mock cargados:', mockChats.length);
        setChats(mockChats);
      }

    } catch (error) {
      console.error('Error cargando chats:', error);
      setChats([]); // Mostrar vacío en caso de error
    } finally {
      setIsLoading(false); // IMPORTANTE: Siempre quitar el loading
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [currentUser]);

  const handleChatPress = (chat: Chat) => {
    navigation.navigate('Chat', { chat: chat });
  };

  const handleNewChatPress = () => {
    setShowNewChatModal(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      try {
        const results = await chatService.searchVeterinarians(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching veterinarians:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleStartChat = async (vet: ChatUser) => {
    if (!currentUser) return;
    
    try {
      const existingChat = chats.find(chat => 
        chat.participantIds.includes(vet.id)
      );
      
      if (existingChat) {
        setShowNewChatModal(false);
        handleChatPress(existingChat);
        return;
      }
      
      const newChat = await chatService.createChat(currentUser, vet);
      setShowNewChatModal(false);
      await loadChats();
      
      navigation.navigate('Chat', { chat: newChat });
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'No se pudo iniciar la conversación');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diff < 604800000) { // Less than 7 days
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const renderChatItem = ({ item: chat }: { item: Chat }) => {
    const otherUser = currentUser?.type === 'owner' 
      ? chat.participants.vet 
      : chat.participants.owner;
    
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => handleChatPress(chat)}
      >
        <View style={styles.chatAvatar}>
          <Ionicons 
            name={currentUser?.type === 'owner' ? 'medical' : 'paw'} 
            size={24} 
            color="#F4B740" 
          />
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {otherUser.name}
            </Text>
            {chat.lastMessage && (
              <Text style={styles.chatTime}>
                {formatTime(chat.lastMessage.timestamp)}
              </Text>
            )}
          </View>
          
          <View style={styles.chatFooter}>
            <Text style={styles.chatLastMessage} numberOfLines={1}>
              {chat.lastMessage?.text || 'Conversación iniciada'}
            </Text>
            {chat.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          {currentUser?.type === 'owner' && chat.participants.vet.clinic && (
            <Text style={styles.chatClinic} numberOfLines={1}>
              {chat.participants.vet.clinic}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderVetSearchResult = ({ item: vet }: { item: ChatUser }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleStartChat(vet)}
    >
      <View style={styles.searchResultAvatar}>
        <Ionicons name="medical" size={20} color="#F4B740" />
      </View>
      
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{vet.name}</Text>
        {vet.clinic && (
          <Text style={styles.searchResultClinic}>{vet.clinic}</Text>
        )}
        <View style={styles.onlineStatus}>
          <View style={[
            styles.onlineIndicator, 
            { backgroundColor: vet.isOnline ? '#4CAF50' : '#999' }
          ]} />
          <Text style={styles.onlineText}>
            {vet.isOnline ? 'En línea' : 'Desconectado'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4B740" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4B740" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4B740" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Conversaciones</Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChatPress}
          >
            <Ionicons name="add" size={24} color="#F4B740" />
          </TouchableOpacity>
        </View>

      {/* Chat List */}
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#DDD" />
          <Text style={styles.emptyTitle}>Sin conversaciones</Text>
          <Text style={styles.emptyText}>
            Inicia una conversación con un veterinario
          </Text>
          <TouchableOpacity 
            style={styles.startChatButton}
            onPress={handleNewChatPress}
          >
            <Text style={styles.startChatText}>Nuevo Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={styles.chatList}
        />
      )}

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowNewChatModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo Chat</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>
          
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar veterinario..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
          
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderVetSearchResult}
            style={styles.searchResults}
            ListEmptyComponent={() => (
              <View style={styles.searchEmptyContainer}>
                {searchQuery.length === 0 ? (
                  <Text style={styles.searchEmptyText}>
                    Busca veterinarios por nombre o clínica
                  </Text>
                ) : (
                  <Text style={styles.searchEmptyText}>
                    No se encontraron veterinarios
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4B740', // Color del header
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4B740',
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  chatClinic: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#F4B740',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: '#F4B740',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startChatText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginLeft: 16,
  },
  modalHeaderSpacer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2A2A2A',
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  searchResultClinic: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#999',
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchEmptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ChatListScreen;