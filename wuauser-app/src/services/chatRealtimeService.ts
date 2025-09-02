import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Chat, Message, ChatUser } from '../types/chat';

export interface ChatRealtimeService {
  subscribeToChat(chatId: string, onMessage: (message: Message) => void): RealtimeChannel;
  subscribeToUserChats(userId: string, onChatUpdate: (chat: Chat) => void): RealtimeChannel;
  unsubscribe(subscription: RealtimeChannel): void;
  sendMessage(chatId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null>;
  createOrGetChat(ownerId: string, vetId: string, appointmentId?: string): Promise<Chat | null>;
  getMessages(chatId: string, limit?: number, offset?: number): Promise<Message[]>;
  getUserChats(userId: string): Promise<Chat[]>;
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;
}

class ChatRealtimeServiceImpl implements ChatRealtimeService {
  private subscriptions = new Map<string, RealtimeChannel>();

  async createOrGetChat(ownerId: string, vetId: string, appointmentId?: string): Promise<Chat | null> {
    try {
      // First, try to find existing chat between these users
      const { data: existingChat, error: findError } = await supabase
        .from('chats')
        .select(`
          id,
          owner_id,
          vet_id,
          appointment_id,
          created_at,
          updated_at,
          last_message_at,
          profiles_owner:owner_id (id, nombre_completo, email, tipo_usuario),
          profiles_vet:vet_id (id, nombre_completo, email, tipo_usuario, nombre_clinica)
        `)
        .eq('owner_id', ownerId)
        .eq('vet_id', vetId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding existing chat:', findError);
        return null;
      }

      if (existingChat) {
        // Transform to Chat interface
        return this.transformSupabaseChatToChat(existingChat);
      }

      // Create new chat if none exists
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          owner_id: ownerId,
          vet_id: vetId,
          appointment_id: appointmentId || null,
        })
        .select(`
          id,
          owner_id,
          vet_id,
          appointment_id,
          created_at,
          updated_at,
          last_message_at,
          profiles_owner:owner_id (id, nombre_completo, email, tipo_usuario),
          profiles_vet:vet_id (id, nombre_completo, email, tipo_usuario, nombre_clinica)
        `)
        .single();

      if (createError) {
        console.error('Error creating new chat:', createError);
        return null;
      }

      return this.transformSupabaseChatToChat(newChat);
    } catch (error) {
      console.error('Error in createOrGetChat:', error);
      return null;
    }
  }

  async sendMessage(chatId: string, messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: messageData.senderId,
          message_type: messageData.type || 'text',
          content: messageData.text,
          image_url: messageData.imageUrl,
          audio_url: messageData.audioUrl,
          audio_duration: messageData.duration,
          location_data: messageData.location ? JSON.stringify(messageData.location) : null,
          appointment_data: messageData.appointment ? JSON.stringify(messageData.appointment) : null,
          file_name: messageData.fileName,
          metadata: { status: 'sent' }
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return this.transformSupabaseMessageToMessage(data);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }

  async getMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting messages:', error);
        return [];
      }

      return data.map(msg => this.transformSupabaseMessageToMessage(msg));
    } catch (error) {
      console.error('Error in getMessages:', error);
      return [];
    }
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          owner_id,
          vet_id,
          appointment_id,
          created_at,
          updated_at,
          last_message_at,
          profiles_owner:owner_id (id, nombre_completo, email, tipo_usuario),
          profiles_vet:vet_id (id, nombre_completo, email, tipo_usuario, nombre_clinica)
        `)
        .or(`owner_id.eq.${userId},vet_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error getting user chats:', error);
        return [];
      }

      return data.map(chat => this.transformSupabaseChatToChat(chat));
    } catch (error) {
      console.error('Error in getUserChats:', error);
      return [];
    }
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Call the Supabase function we created
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_chat_id: chatId,
        p_user_id: userId
      });

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  }

  subscribeToChat(chatId: string, onMessage: (message: Message) => void): RealtimeChannel {
    const channelName = `chat_${chatId}`;
    
    // Remove existing subscription if any
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(this.subscriptions.get(channelName)!);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📥 New message received:', payload);
          const message = this.transformSupabaseMessageToMessage(payload.new);
          onMessage(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('📝 Message updated:', payload);
          const message = this.transformSupabaseMessageToMessage(payload.new);
          onMessage(message);
        }
      )
      .subscribe((status) => {
        console.log(`🔌 Chat subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  subscribeToUserChats(userId: string, onChatUpdate: (chat: Chat) => void): RealtimeChannel {
    const channelName = `user_chats_${userId}`;
    
    // Remove existing subscription if any
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(this.subscriptions.get(channelName)!);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `or(owner_id.eq.${userId},vet_id.eq.${userId})`
        },
        async (payload) => {
          console.log('💬 Chat updated:', payload);
          // Fetch the complete chat data with profiles
          const { data } = await supabase
            .from('chats')
            .select(`
              id,
              owner_id,
              vet_id,
              appointment_id,
              created_at,
              updated_at,
              last_message_at,
              profiles_owner:owner_id (id, nombre_completo, email, tipo_usuario),
              profiles_vet:vet_id (id, nombre_completo, email, tipo_usuario, nombre_clinica)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const chat = this.transformSupabaseChatToChat(data);
            onChatUpdate(chat);
          }
        }
      )
      .subscribe((status) => {
        console.log(`🔌 User chats subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, channel);
    return channel;
  }

  unsubscribe(subscription: RealtimeChannel): void {
    supabase.removeChannel(subscription);
    
    // Remove from our tracking
    for (const [key, channel] of this.subscriptions.entries()) {
      if (channel === subscription) {
        this.subscriptions.delete(key);
        break;
      }
    }
  }

  // Helper methods to transform Supabase data to our interfaces
  private transformSupabaseChatToChat(supabaseChat: any): Chat {
    return {
      id: supabaseChat.id,
      participantIds: [supabaseChat.owner_id, supabaseChat.vet_id],
      participants: {
        owner: {
          id: supabaseChat.profiles_owner?.id || supabaseChat.owner_id,
          name: supabaseChat.profiles_owner?.nombre_completo || 'Usuario',
          avatar: undefined // TODO: Add avatar support
        },
        vet: {
          id: supabaseChat.profiles_vet?.id || supabaseChat.vet_id,
          name: supabaseChat.profiles_vet?.nombre_completo || 'Veterinario',
          clinic: supabaseChat.profiles_vet?.nombre_clinica || 'Clínica'
        }
      },
      unreadCount: 0, // TODO: Calculate from messages
      createdAt: supabaseChat.created_at,
      lastMessage: undefined // TODO: Get from last message
    };
  }

  private transformSupabaseMessageToMessage(supabaseMessage: any): Message {
    const metadata = supabaseMessage.metadata || {};
    
    return {
      id: supabaseMessage.id,
      chatId: supabaseMessage.chat_id,
      senderId: supabaseMessage.sender_id,
      type: supabaseMessage.message_type || 'text',
      text: supabaseMessage.content,
      imageUrl: supabaseMessage.image_url,
      audioUrl: supabaseMessage.audio_url,
      duration: supabaseMessage.audio_duration,
      location: supabaseMessage.location_data ? JSON.parse(supabaseMessage.location_data) : undefined,
      appointment: supabaseMessage.appointment_data ? JSON.parse(supabaseMessage.appointment_data) : undefined,
      fileName: supabaseMessage.file_name,
      timestamp: supabaseMessage.created_at,
      read: this.isMessageRead(supabaseMessage.read_by),
      status: metadata.status || 'sent'
    };
  }

  private isMessageRead(readBy: any): boolean {
    if (!readBy || typeof readBy !== 'object') return false;
    
    // Check if current user has read the message
    // This is simplified - in a real app you'd check against current user ID
    return Object.keys(readBy).length > 0;
  }
}

export const chatRealtimeService = new ChatRealtimeServiceImpl();
export default chatRealtimeService;