import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, Message, ChatUser } from '../types/chat';

class ChatService {
  async getChats(userId: string): Promise<Chat[]> {
    try {
      const chatsJson = await AsyncStorage.getItem(`chats_${userId}`);
      return chatsJson ? JSON.parse(chatsJson) : [];
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
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
      const newMessage: Message = {
        id: Date.now().toString(),
        chatId,
        senderId,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        read: false
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
}

export const chatService = new ChatService();