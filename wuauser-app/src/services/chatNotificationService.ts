import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Message, Chat } from '../types/chat';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    
    // Check if notification is from chat
    if (data?.type === 'chat_message') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

export interface ChatNotificationData {
  type: 'chat_message';
  chatId: string;
  senderId: string;
  senderName: string;
  messageId: string;
  messagePreview: string;
  timestamp: string;
}

class ChatNotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      console.log('🔔 Initializing chat notifications...');

      // Request permissions
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('❌ Chat notifications disabled - no permissions');
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (!token) {
        console.log('❌ Chat notifications disabled - no push token');
        return false;
      }

      this.pushToken = token;
      
      // Save token to user profile if authenticated
      await this.savePushTokenToProfile(token);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      this.isInitialized = true;
      console.log('✅ Chat notifications initialized successfully');
      return true;

    } catch (error) {
      console.error('Error initializing chat notifications:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications not supported on web');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Chat notification permissions not granted');
        return false;
      }

      console.log('✅ Chat notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting chat notification permissions:', error);
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    try {
      // Check if we already have a token cached
      const cachedToken = await AsyncStorage.getItem('expo_push_token');
      if (cachedToken) {
        console.log('📱 Using cached push token');
        return cachedToken;
      }

      // Get new token
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Add this to your .env
      });

      if (token) {
        // Cache the token
        await AsyncStorage.setItem('expo_push_token', token);
        console.log('📱 Got new push token:', token.substring(0, 20) + '...');
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async savePushTokenToProfile(token: string): Promise<void> {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save token to user profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_token: token,
          push_notifications_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving push token to profile:', error);
      } else {
        console.log('✅ Push token saved to profile');
      }
    } catch (error) {
      console.error('Error in savePushTokenToProfile:', error);
    }
  }

  async setupAndroidChannels(): Promise<void> {
    try {
      // Chat messages channel
      await Notifications.setNotificationChannelAsync('chat_messages', {
        name: 'Mensajes de Chat',
        description: 'Notificaciones de mensajes nuevos en chats',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        sound: 'default',
        enableLights: true,
        enableVibration: true,
        showBadge: true,
      });

      // Chat notifications channel
      await Notifications.setNotificationChannelAsync('chat_notifications', {
        name: 'Notificaciones de Chat',
        description: 'Notificaciones generales del sistema de chat',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#007AFF',
        sound: 'default',
      });

      console.log('✅ Android notification channels configured');
    } catch (error) {
      console.error('Error setting up Android channels:', error);
    }
  }

  async sendChatMessageNotification(
    recipientId: string,
    message: Message,
    chat: Chat,
    senderName: string
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.log('⚠️ Chat notifications not initialized');
        return false;
      }

      // Get recipient's push token from profile
      const recipientToken = await this.getRecipientPushToken(recipientId);
      if (!recipientToken) {
        console.log('❌ No push token for recipient:', recipientId);
        return false;
      }

      // Create notification payload
      const notificationPayload = {
        to: recipientToken,
        sound: 'default',
        title: `💬 ${senderName}`,
        body: this.formatMessagePreview(message),
        data: {
          type: 'chat_message',
          chatId: chat.id,
          senderId: message.senderId,
          senderName,
          messageId: message.id,
          messagePreview: message.text?.substring(0, 50) || 'Mensaje',
          timestamp: message.timestamp,
        } as ChatNotificationData,
        channelId: Platform.OS === 'android' ? 'chat_messages' : undefined,
        categoryId: 'chat_message',
        badge: await this.getUnreadBadgeCount(recipientId),
      };

      // Send via Expo Push Service
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      const result = await response.json();
      
      if (result.data?.status === 'ok') {
        console.log('✅ Chat notification sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send chat notification:', result);
        return false;
      }

    } catch (error) {
      console.error('Error sending chat notification:', error);
      return false;
    }
  }

  private async getRecipientPushToken(userId: string): Promise<string | null> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('push_token, push_notifications_enabled')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error getting recipient push token:', error);
        return null;
      }

      if (!data?.push_notifications_enabled || !data?.push_token) {
        return null;
      }

      return data.push_token;
    } catch (error) {
      console.error('Error in getRecipientPushToken:', error);
      return null;
    }
  }

  private formatMessagePreview(message: Message): string {
    switch (message.type) {
      case 'text':
        return message.text || 'Mensaje';
      case 'image':
        return '📷 Imagen';
      case 'audio':
        return '🎵 Mensaje de voz';
      case 'location':
        return '📍 Ubicación';
      case 'appointment':
        return '📅 Información de cita';
      case 'file':
        return `📄 ${message.fileName || 'Archivo'}`;
      default:
        return 'Mensaje';
    }
  }

  private async getUnreadBadgeCount(userId: string): Promise<number> {
    try {
      if (!supabase) return 0;

      // Get unread messages count for user
      const { data, error } = await supabase.rpc('get_unread_message_count', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return data?.reduce((total: number, chat: any) => total + parseInt(chat.unread_count), 0) || 0;
    } catch (error) {
      console.error('Error in getUnreadBadgeCount:', error);
      return 0;
    }
  }

  async scheduleLocalChatNotification(
    title: string,
    body: string,
    data: ChatNotificationData,
    delaySeconds: number = 0
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          categoryId: 'chat_message',
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      });

      console.log('📱 Local chat notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return null;
    }
  }

  async cancelChatNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Chat notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling chat notification:', error);
    }
  }

  async clearChatBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('🧹 Chat badge cleared');
    } catch (error) {
      console.error('Error clearing chat badge:', error);
    }
  }

  // Handle notification response (when user taps notification)
  addChatNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'chat_message') {
        console.log('👆 Chat notification tapped:', data);
        handler(response);
      }
    });
  }

  // Handle notification received while app is open
  addChatNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      
      if (data?.type === 'chat_message') {
        console.log('📲 Chat notification received while app open:', data);
        handler(notification);
      }
    });
  }

  async updatePushTokenInProfile(): Promise<void> {
    try {
      if (this.pushToken) {
        await this.savePushTokenToProfile(this.pushToken);
      }
    } catch (error) {
      console.error('Error updating push token in profile:', error);
    }
  }

  async disableNotifications(): Promise<void> {
    try {
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ 
          push_notifications_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      console.log('🔕 Chat notifications disabled for user');
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  }

  get isReady(): boolean {
    return this.isInitialized && !!this.pushToken;
  }

  get pushTokenValue(): string | null {
    return this.pushToken;
  }
}

export const chatNotificationService = new ChatNotificationService();
export default chatNotificationService;