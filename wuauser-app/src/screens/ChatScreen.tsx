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
  Image
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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    console.log('ChatScreen useEffect iniciado');
    
    const mockMessages: Message[] = [
      {
        id: '1',
        chatId: chat.id,
        senderId: 'vet2',
        type: 'text',
        text: 'Hola, ¿cómo está tu mascota?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: true,
        status: 'read'
      },
      {
        id: '2',
        chatId: chat.id,
        senderId: userId,
        type: 'text',
        text: 'Mucho mejor, gracias doctor',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: true,
        status: 'read'
      },
      {
        id: '3',
        chatId: chat.id,
        senderId: userId,
        type: 'text',
        text: 'Ya está comiendo normal',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true,
        status: 'delivered'
      },
      {
        id: '4',
        chatId: chat.id,
        senderId: 'vet2',
        type: 'text',
        text: 'Excelente, me alegra escuchar eso',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        status: 'sent'
      }
    ];
    
    console.log('Mensajes cargados:', mockMessages);
    setMessages(mockMessages);
  }, []);

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
    
    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      type: 'text',
      senderId: userId,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      read: false,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    try {
      // Simulate message sending process
      await chatService.saveMessage(newMessage);
      
      // Update message status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'sent' }
          : msg
      ));
      
      // Simulate delivery after 1 second
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        ));
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      // Keep message as 'sending' if error occurs
    }
    
    // Scroll al final
    setTimeout(() => {
      flatListRef.current?.scrollToEnd();
    }, 100);
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === userId;
    console.log('Rendering message bubble:', item.id, 'Text:', item.text, 'Type:', item.type);
    
    return (
      <View style={[
        styles.messageRow,
        isMyMessage ? styles.myMessageRow : styles.theirMessageRow
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          {/* ASEGURAR QUE SE RENDERICE EL TEXTO */}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.text || 'Mensaje sin contenido'}
          </Text>
          
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.theirMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };



  console.log('ChatScreen render - messages count:', messages.length);
  console.log('ChatScreen render - messages data:', messages);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F4B740" />
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
            <Text style={styles.headerStatus}>En línea</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="call" size={24} color="#FFF" />
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
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Lista vacía</Text>
              </View>
            )}
          />
        )}
        
        {/* Input */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={24} color="#666" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Mensaje..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxHeight={100}
            placeholderTextColor="#999"
          />
          
          {inputText.length > 0 ? (
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={24} color="#F4B740" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

// Estilos estilo WhatsApp pero con colores Wuauser
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4B740', // Color del header
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#E8E8E8'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F4B740',
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
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E8E8E8',
  },
  messageRow: {
    marginVertical: 2,
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
    backgroundColor: '#F4B740', // Fondo amarillo
    alignSelf: 'flex-end',
    borderTopRightRadius: 4 // Radio menor en la esquina del lado del emisor
  },
  theirMessage: {
    backgroundColor: '#F0F0F0', // Fondo gris claro
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#333', // Color oscuro para mensajes recibidos
    marginBottom: 4
  },
  myMessageText: {
    color: '#FFF' // Texto blanco para mis mensajes (fondo amarillo)
  },
  theirMessageText: {
    color: '#333' // Texto oscuro para mensajes del otro
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)' // Tiempo más claro en mis mensajes
  },
  theirMessageTime: {
    color: '#999' // Tiempo gris en mensajes recibidos
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.8)' // Tiempo más claro en mis mensajes
  },
  theirTimeText: {
    color: '#999' // Tiempo gris en mensajes recibidos
  },
  messageStatus: {
    marginLeft: 4,
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F8F9FA',
    color: '#2A2A2A'
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4B740',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default ChatScreen;