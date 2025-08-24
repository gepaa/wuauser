export interface Chat {
  id: string;
  participantIds: [string, string]; // [ownerId, vetId]
  participants: {
    owner: { id: string; name: string; avatar?: string };
    vet: { id: string; name: string; clinic?: string };
  };
  lastMessage?: {
    text: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'audio' | 'location' | 'appointment' | 'file';
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number; // Para audio
  location?: { latitude: number; longitude: number; address: string };
  appointment?: { date: string; time: string; service: string };
  fileName?: string;
  timestamp: string;
  read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatUser {
  id: string;
  name: string;
  type: 'owner' | 'vet';
  avatar?: string;
  clinic?: string;
  isOnline?: boolean;
  lastSeen?: string;
}