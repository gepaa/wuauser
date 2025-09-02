import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, Message, ChatUser } from '../types/chat';
import { chatRealtimeService } from './chatRealtimeService';
import { chatNotificationService } from './chatNotificationService';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

class ChatService {
  private realtimeSubscriptions = new Map<string, RealtimeChannel>();
  private isNotificationsInitialized = false;

  async getChats(userId: string): Promise<Chat[]> {
    try {
      // Try Supabase first if available
      if (supabase) {
        console.log('🔄 Loading chats from Supabase...');
        const supabaseChats = await chatRealtimeService.getUserChats(userId);
        
        if (supabaseChats.length > 0) {
          // Cache in AsyncStorage for offline access
          await AsyncStorage.setItem(`chats_${userId}`, JSON.stringify(supabaseChats));
          return supabaseChats;
        }
      }

      // Fallback to local storage
      console.log('📱 Loading chats from local storage...');
      const chatsJson = await AsyncStorage.getItem(`chats_${userId}`);
      return chatsJson ? JSON.parse(chatsJson) : [];
    } catch (error) {
      console.error('Error getting chats:', error);
      // Fallback to local storage on error
      const chatsJson = await AsyncStorage.getItem(`chats_${userId}`);
      return chatsJson ? JSON.parse(chatsJson) : [];
    }
  }
  
  async saveMessage(message: Message): Promise<void> {
    try {
      const messagesKey = `messages_${message.chatId}`;
      const existingJson = await AsyncStorage.getItem(messagesKey);
      const existing = existingJson ? JSON.parse(existingJson) : [];
      existing.push(message);
      await AsyncStorage.setItem(messagesKey, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }
  
  async createChat(ownerId: string, vetId: string): Promise<Chat> {
    try {
      const chatId = `chat_${Date.now()}`;
      const newChat: Chat = {
        id: chatId,
        participantIds: [ownerId, vetId],
        participants: {
          owner: { id: ownerId, name: 'Tú' },
          vet: { id: vetId, name: 'Veterinario', clinic: 'Clínica' }
        },
        unreadCount: 0,
        createdAt: new Date().toISOString()
      };
      
      // Guardar chat para ambos usuarios
      const ownerChats = await this.getChats(ownerId);
      const vetChats = await this.getChats(vetId);
      
      ownerChats.push(newChat);
      vetChats.push(newChat);
      
      await AsyncStorage.setItem(`chats_${ownerId}`, JSON.stringify(ownerChats));
      await AsyncStorage.setItem(`chats_${vetId}`, JSON.stringify(vetChats));
      
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const messagesKey = `messages_${chatId}`;
      const messagesJson = await AsyncStorage.getItem(messagesKey);
      const messages = messagesJson ? JSON.parse(messagesJson) : [];
      
      return messages.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async sendMessage(chatId: string, senderId: string, text: string): Promise<Message> {
    try {
      const messageData = {
        chatId,
        senderId,
        type: 'text' as const,
        text: text.trim(),
        read: false,
        status: 'sending' as const
      };

      // Try Supabase first if available
      if (supabase) {
        console.log('📤 Sending message via Supabase...');
        const supabaseMessage = await chatRealtimeService.sendMessage(chatId, messageData);
        
        if (supabaseMessage) {
          // Also save locally for offline access
          await this.saveMessage(supabaseMessage);
          
          // Send notification to other participants (handled by realtime triggers)
          // The notification will be sent automatically via Supabase triggers/functions
          
          return supabaseMessage;
        }
      }

      // Fallback to local storage
      console.log('📱 Sending message locally...');
      const newMessage: Message = {
        id: Date.now().toString(),
        ...messageData,
        timestamp: new Date().toISOString(),
      };

      await this.saveMessage(newMessage);
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get unread message count for user
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const chats = await this.getChats(userId);
      let totalUnread = 0;
      
      for (const chat of chats) {
        const messages = await this.getMessages(chat.id);
        const unreadMessages = messages.filter(msg => 
          msg.senderId !== userId && !msg.read
        );
        totalUnread += unreadMessages.length;
      }
      
      return totalUnread;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Try Supabase first if available
      if (supabase) {
        console.log('✅ Marking messages as read in Supabase...');
        await chatRealtimeService.markMessagesAsRead(chatId, userId);
      }

      // Also update locally
      const messagesKey = `messages_${chatId}`;
      const messagesJson = await AsyncStorage.getItem(messagesKey);
      const messages = messagesJson ? JSON.parse(messagesJson) : [];
      
      let updated = false;
      messages.forEach((msg: Message) => {
        if (msg.senderId !== userId && !msg.read) {
          msg.read = true;
          updated = true;
        }
      });
      
      if (updated) {
        await AsyncStorage.setItem(messagesKey, JSON.stringify(messages));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Realtime methods
  subscribeToChat(chatId: string, onMessage: (message: Message) => void): RealtimeChannel | null {
    if (!supabase) {
      console.log('⚠️ Supabase not available - realtime disabled');
      return null;
    }

    console.log(`🔌 Subscribing to chat: ${chatId}`);
    const subscription = chatRealtimeService.subscribeToChat(chatId, (message) => {
      console.log('📨 Received realtime message:', message);
      // Also save locally for offline access
      this.saveMessage(message);
      onMessage(message);
    });

    this.realtimeSubscriptions.set(`chat_${chatId}`, subscription);
    return subscription;
  }

  subscribeToUserChats(userId: string, onChatUpdate: (chat: Chat) => void): RealtimeChannel | null {
    if (!supabase) {
      console.log('⚠️ Supabase not available - realtime disabled');
      return null;
    }

    console.log(`🔌 Subscribing to user chats: ${userId}`);
    const subscription = chatRealtimeService.subscribeToUserChats(userId, (chat) => {
      console.log('💬 Received chat update:', chat);
      onChatUpdate(chat);
    });

    this.realtimeSubscriptions.set(`user_chats_${userId}`, subscription);
    return subscription;
  }

  unsubscribe(subscription: RealtimeChannel): void {
    chatRealtimeService.unsubscribe(subscription);
    
    // Remove from our tracking
    for (const [key, channel] of this.realtimeSubscriptions.entries()) {
      if (channel === subscription) {
        this.realtimeSubscriptions.delete(key);
        break;
      }
    }
  }

  unsubscribeFromChat(chatId: string): void {
    const subscription = this.realtimeSubscriptions.get(`chat_${chatId}`);
    if (subscription) {
      this.unsubscribe(subscription);
    }
  }

  unsubscribeFromUserChats(userId: string): void {
    const subscription = this.realtimeSubscriptions.get(`user_chats_${userId}`);
    if (subscription) {
      this.unsubscribe(subscription);
    }
  }

  unsubscribeAll(): void {
    for (const subscription of this.realtimeSubscriptions.values()) {
      chatRealtimeService.unsubscribe(subscription);
    }
    this.realtimeSubscriptions.clear();
  }

  async createOrGetChat(ownerId: string, vetId: string, appointmentId?: string): Promise<Chat | null> {
    try {
      // Try Supabase first if available
      if (supabase) {
        console.log('🔄 Creating/getting chat from Supabase...');
        const chat = await chatRealtimeService.createOrGetChat(ownerId, vetId, appointmentId);
        
        if (chat) {
          // Cache locally
          const chatsOwner = await this.getChats(ownerId);
          const chatsVet = await this.getChats(vetId);
          
          if (!chatsOwner.find(c => c.id === chat.id)) {
            chatsOwner.push(chat);
            await AsyncStorage.setItem(`chats_${ownerId}`, JSON.stringify(chatsOwner));
          }
          
          if (!chatsVet.find(c => c.id === chat.id)) {
            chatsVet.push(chat);
            await AsyncStorage.setItem(`chats_${vetId}`, JSON.stringify(chatsVet));
          }
          
          return chat;
        }
      }

      // Fallback to local implementation
      return await this.createChat(ownerId, vetId);
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      // Fallback to local implementation
      return await this.createChat(ownerId, vetId);
    }
  }

  // Notification methods
  async initializeChatNotifications(): Promise<boolean> {
    try {
      console.log('🔔 Initializing chat notifications...');
      const initialized = await chatNotificationService.initialize();
      this.isNotificationsInitialized = initialized;
      return initialized;
    } catch (error) {
      console.error('Error initializing chat notifications:', error);
      return false;
    }
  }

  async sendChatNotification(
    recipientId: string,
    message: Message,
    chat: Chat,
    senderName: string
  ): Promise<boolean> {
    try {
      if (!this.isNotificationsInitialized) {
        console.log('⚠️ Chat notifications not initialized');
        return false;
      }

      return await chatNotificationService.sendChatMessageNotification(
        recipientId,
        message,
        chat,
        senderName
      );
    } catch (error) {
      console.error('Error sending chat notification:', error);
      return false;
    }
  }

  async scheduleLocalChatNotification(
    title: string,
    body: string,
    chatId: string,
    senderId: string,
    messageId: string,
    delaySeconds: number = 0
  ): Promise<string | null> {
    try {
      return await chatNotificationService.scheduleLocalChatNotification(
        title,
        body,
        {
          type: 'chat_message',
          chatId,
          senderId,
          senderName: 'Usuario',
          messageId,
          messagePreview: body,
          timestamp: new Date().toISOString(),
        },
        delaySeconds
      );
    } catch (error) {
      console.error('Error scheduling local chat notification:', error);
      return null;
    }
  }

  addChatNotificationHandlers(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void
  ) {
    // Add listeners for notifications
    const receivedSubscription = chatNotificationService.addChatNotificationReceivedListener(
      onNotificationReceived
    );

    const responseSubscription = chatNotificationService.addChatNotificationResponseReceivedListener(
      onNotificationTapped
    );

    return {
      receivedSubscription,
      responseSubscription,
    };
  }

  async clearChatBadge(): Promise<void> {
    await chatNotificationService.clearChatBadge();
  }

  async disableChatNotifications(): Promise<void> {
    await chatNotificationService.disableNotifications();
  }

  // Check if realtime is available
  get isRealtimeAvailable(): boolean {
    return !!supabase;
  }

  // Check if notifications are ready
  get areNotificationsReady(): boolean {
    return this.isNotificationsInitialized && chatNotificationService.isReady;
  }

  get pushToken(): string | null {
    return chatNotificationService.pushTokenValue;
  }
}

export const chatService = new ChatService();