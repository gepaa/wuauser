import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, Chat } from '../types/chat';
import { chatService } from '../services/chatService';
import { Colors } from '../constants/colors';

interface ChatScreenProps {
  navigation: any;
  route: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { chat } = route.params;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId] = useState('owner1'); // Current user
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const flatListRef = useRef<FlatList>(null);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const chatSubscription = useRef<any>(null);
  const notificationSubscriptions = useRef<any>(null);

  useEffect(() => {
    console.log('ChatScreen useEffect iniciado');
    initializeChat();
    startTypingAnimation();
  }, []);

  useEffect(() => {
    // Mark messages as read when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      markMessagesAsRead();
    });

    return unsubscribe;
  }, [navigation, messages]);

  useEffect(() => {
    // Cleanup subscriptions on unmount
    return () => {
      if (chatSubscription.current) {
        console.log('🔌 Cleaning up chat subscription');
        chatService.unsubscribe(chatSubscription.current);
      }
      
      if (notificationSubscriptions.current) {
        console.log('🔔 Cleaning up notification subscriptions');
        notificationSubscriptions.current.receivedSubscription?.remove();
        notificationSubscriptions.current.responseSubscription?.remove();
      }
    };
  }, []);

  const initializeChat = async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('🔄 Initializing chat:', chat.id);
      
      // Check if realtime is available
      if (chatService.isRealtimeAvailable) {
        console.log('🌐 Realtime available - setting up subscription');
        setConnectionStatus('connected');
        
        // Subscribe to realtime messages
        const subscription = chatService.subscribeToChat(chat.id, (newMessage) => {
          console.log('📨 New realtime message:', newMessage);
          setMessages(prevMessages => {
            // Avoid duplicates
            if (prevMessages.find(msg => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
          
          // Auto-scroll to bottom when new message arrives
          setTimeout(() => scrollToBottom(), 100);
        });
        
        chatSubscription.current = subscription;
        
        // Load existing messages
        const existingMessages = await chatService.getMessages(chat.id);
        setMessages(existingMessages);
        
        // Start typing indicator simulation for demo
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }, 2000);
        
      } else {
        console.log('📱 Using local storage mode');
        setConnectionStatus('offline');
        
        // Load mock messages for demo
        const mockMessages: Message[] = [
          {
            id: '1',
            chatId: chat.id,
            senderId: 'vet2',
            type: 'text',
            text: 'Hola, ¿cómo está tu mascota después de la consulta?',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: true,
            status: 'read'
          },
          {
            id: '2',
            chatId: chat.id,
            senderId: userId,
            type: 'text',
            text: 'Mucho mejor, gracias doctor. Max ya está comiendo normal.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            read: true,
            status: 'read'
          },
          {
            id: '3',
            chatId: chat.id,
            senderId: 'vet2',
            type: 'text',
            text: 'Excelente noticia. ¿Ha tenido algún efecto secundario con las medicinas?',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            read: true,
            status: 'read'
          },
          {
            id: '4',
            chatId: chat.id,
            senderId: userId,
            type: 'text',
            text: 'No, todo bien. ¿Cuándo debería traerlo para la siguiente revisión?',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            read: false,
            status: 'delivered'
          }
        ];
        
        setMessages(mockMessages);
      }
      
      // Initialize chat notifications
      if (chatService.areNotificationsReady) {
        console.log('🔔 Setting up chat notification handlers...');
        const { receivedSubscription, responseSubscription } = chatService.addChatNotificationHandlers(
          (notification) => {
            console.log('📲 Chat notification received while in app:', notification);
            // Handle notification received while app is open
            // Could show an in-app banner or update UI
          },
          (response) => {
            console.log('👆 Chat notification tapped:', response);
            // Handle notification tap - navigation is already handled by the navigation system
            // Could scroll to specific message or highlight it
          }
        );

        notificationSubscriptions.current = {
          received: receivedSubscription,
          response: responseSubscription,
        };
      } else {
        // Try to initialize notifications if not ready
        console.log('🔔 Attempting to initialize chat notifications...');
        await chatService.initializeChatNotifications();
      }

      // Auto-scroll to bottom after messages load
      setTimeout(() => scrollToBottom(), 100);
      
    } catch (error) {
      console.error('Error loading chat:', error);
      setConnectionStatus('offline');
      Alert.alert('Error', 'No se pudieron cargar los mensajes');
    } finally {
      setIsLoading(false);
    }
  };

  const startTypingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(typingAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const markMessagesAsRead = async () => {
    try {
      console.log('✅ Marking messages as read for chat:', chat.id);
      await chatService.markMessagesAsRead(chat.id, userId);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.senderId !== userId ? { ...msg, read: true, status: 'read' } : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const messageText = inputText.trim();
    setInputText('');
    
    // Create optimistic message for UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      chatId: chat.id,
      type: 'text',
      senderId: userId,
      text: messageText,
      timestamp: new Date().toISOString(),
      read: false,
      status: 'sending'
    };
    
    // Add message optimistically
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 100);
    
    try {
      console.log('📤 Sending message:', messageText);
      
      // Send through chat service (will use Supabase if available, otherwise local)
      const sentMessage = await chatService.sendMessage(chat.id, userId, messageText);
      
      if (sentMessage) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? sentMessage : msg
        ));
        
        // If using local mode, simulate status updates
        if (!chatService.isRealtimeAvailable) {
          // Simulate delivery after 1 second
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === sentMessage.id 
                ? { ...msg, status: 'delivered' }
                : msg
            ));
          }, 1000);
          
          // Simulate read receipt after 3 seconds
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === sentMessage.id 
                ? { ...msg, status: 'read' }
                : msg
            ));
          }, 3000);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.senderId === userId) {
      Alert.alert(
        'Opciones de mensaje',
        '',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Copiar texto', 
            onPress: () => {
              // TODO: Copy text to clipboard
              console.log('Copying message:', message.text);
            }
          },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: () => deleteMessage(message.id)
          },
        ]
      );
    }
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Enviar imagen',
      '¿De dónde quieres seleccionar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cámara', onPress: () => console.log('Opening camera') },
        { text: 'Galería', onPress: () => console.log('Opening gallery') },
      ]
    );
  };

  const handleVoiceMessage = () => {
    Alert.alert('Próximamente', 'Los mensajes de voz estarán disponibles pronto');
  };

  const handleVideoCall = () => {
    Alert.alert(
      'Videollamada',
      `¿Quieres iniciar una videollamada con ${chat.participants.vet.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Llamar', 
          onPress: () => {
            console.log('Starting video call');
            Alert.alert('Funcionalidad próximamente', 'Las videollamadas estarán disponibles pronto');
          }
        },
      ]
    );
  };


  const renderMessageContent = (message: Message, isMyMessage: boolean) => {
    console.log('Rendering message:', message.id, message.type, message.text);
    
    switch (message.type) {
      case 'text':
        return (
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {message.text}
          </Text>
        );
        
      case 'image':
        return (
          <TouchableOpacity>
            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
            {message.text && (
              <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                {message.text}
              </Text>
            )}
          </TouchableOpacity>
        );
        
      case 'audio':
        return (
          <TouchableOpacity style={styles.audioMessage}>
            <Ionicons name="play-circle" size={32} color={isMyMessage ? '#FFF' : '#F4B740'} />
            <View style={styles.audioWave}>
              <View style={[styles.audioBar, { height: 10 }]} />
              <View style={[styles.audioBar, { height: 18 }]} />
              <View style={[styles.audioBar, { height: 14 }]} />
              <View style={[styles.audioBar, { height: 22 }]} />
              <View style={[styles.audioBar, { height: 16 }]} />
            </View>
            <Text style={[styles.audioDuration, isMyMessage && styles.myMessageText]}>
              0:{message.duration}
            </Text>
          </TouchableOpacity>
        );
        
      case 'appointment':
        return (
          <View style={styles.appointmentCard}>
            <Ionicons name="calendar" size={24} color={isMyMessage ? '#FFF' : '#F4B740'} />
            <Text style={[styles.appointmentTitle, isMyMessage && styles.myMessageText]}>
              Cita Agendada
            </Text>
            <Text style={[styles.appointmentDetails, isMyMessage && styles.myMessageText]}>
              {message.appointment?.service}
            </Text>
            <Text style={[styles.appointmentTime, isMyMessage && styles.myMessageText]}>
              {message.appointment?.date} - {message.appointment?.time}
            </Text>
            <TouchableOpacity style={styles.appointmentButton}>
              <Text style={styles.appointmentButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'location':
        return (
          <TouchableOpacity style={styles.locationMessage}>
            <View style={styles.mapPreview}>
              <Ionicons name="location" size={32} color="#F4B740" />
            </View>
            <Text style={[styles.locationAddress, isMyMessage && styles.myMessageText]}>
              {message.location?.address}
            </Text>
          </TouchableOpacity>
        );
        
      default:
        return null;
    }
  };

  const renderMessageStatus = (status: Message['status']) => {
    const iconColor = '#4CAF50';
    const size = 14;
    
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={size} color="#999" />;
      case 'sent':
        return <Ionicons name="checkmark" size={size} color="#999" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={size} color="#999" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={size} color={iconColor} />;
      default:
        return null;
    }
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageRow, styles.theirMessageRow]}>
        <View style={[styles.messageBubble, styles.theirMessage]}>
          <View style={styles.typingContainer}>
            <Animated.View style={[
              styles.typingDot,
              { 
                opacity: typingAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                })
              }
            ]} />
            <Animated.View style={[
              styles.typingDot,
              { 
                opacity: typingAnimation.interpolate({
                  inputRange: [0, 0.3, 0.8, 1],
                  outputRange: [0.3, 0.3, 1, 0.3],
                })
              }
            ]} />
            <Animated.View style={[
              styles.typingDot,
              { 
                opacity: typingAnimation.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0.3, 0.3, 1],
                })
              }
            ]} />
          </View>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === userId;
    console.log('Rendering message bubble:', item.id, 'Text:', item.text, 'Type:', item.type);
    
    return (
      <TouchableOpacity
        onLongPress={() => handleLongPressMessage(item)}
        delayLongPress={500}
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.theirMessageRow
        ]}
      >
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.text || 'Mensaje sin contenido'}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(item.timestamp)}
            </Text>
            
            {isMyMessage && (
              <View style={styles.messageStatusContainer}>
                {renderMessageStatus(item.status)}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };



  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'En línea';
      case 'connecting':
        return 'Conectando...';
      case 'offline':
        return 'Sin conexión';
      default:
        return 'Desconocido';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'rgba(255, 255, 255, 0.9)';
      case 'connecting':
        return 'rgba(255, 255, 255, 0.7)';
      case 'offline':
        return 'rgba(255, 100, 100, 0.9)';
      default:
        return 'rgba(255, 255, 255, 0.5)';
    }
  };

  console.log('ChatScreen render - messages count:', messages.length);
  console.log('ChatScreen render - messages data:', messages);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Ionicons name="chatbubbles" size={48} color="#007AFF" />
            <Text style={styles.loadingTitle}>Cargando chat...</Text>
            <Text style={styles.loadingSubtitle}>Conectando con {chat.participants.vet.name}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {chat.participants.vet.name}
            </Text>
            <Text style={[
              styles.headerStatus,
              { color: getConnectionStatusColor() }
            ]}>
              {getConnectionStatusText()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleVideoCall}>
            <Ionicons name="videocam" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        {messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No messages to display</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>No hay mensajes aún</Text>
                <Text style={styles.emptySubtext}>Comienza la conversación</Text>
              </View>
            )}
            ListFooterComponent={renderTypingIndicator}
          />
        )}
        
        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleImagePicker}
          >
            <Ionicons name="camera" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={connectionStatus === 'offline' ? 'Sin conexión...' : 'Escribe un mensaje...'}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxHeight={100}
              placeholderTextColor="#999"
              editable={connectionStatus !== 'offline'}
              onSubmitEditing={() => {
                if (inputText.trim()) {
                  sendMessage();
                }
              }}
            />
          </View>
          
          {inputText.length > 0 ? (
            <TouchableOpacity 
              style={[
                styles.sendButton,
                connectionStatus === 'offline' && styles.sendButtonDisabled
              ]} 
              onPress={sendMessage}
              disabled={connectionStatus === 'offline'}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={connectionStatus === 'offline' ? '#CCC' : '#FFF'} 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.micButton}
              onPress={handleVoiceMessage}
            >
              <Ionicons name="mic" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  
  // Chat container
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
  
  // Message styles
  messageRow: {
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  theirMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 2
  },
  myMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  theirMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginLeft: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  theirMessageTime: {
    color: '#999',
  },
  messageStatusContainer: {
    marginLeft: 4,
  },
  
  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  // New message type styles
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    minWidth: 200
  },
  audioWave: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 2
  },
  audioBar: {
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2
  },
  audioDuration: {
    fontSize: 12,
    fontWeight: '500'
  },
  appointmentCard: {
    padding: 12,
    alignItems: 'center',
    minWidth: 180
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4
  },
  appointmentDetails: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4
  },
  appointmentTime: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 8
  },
  appointmentButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  appointmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF'
  },
  locationMessage: {
    width: 200
  },
  mapPreview: {
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  locationAddress: {
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center'
  },
  statusContainer: {
    marginLeft: 4,
    alignSelf: 'flex-end'
  },
  // Input bar styles
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInputContainer: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  micButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ChatScreen;