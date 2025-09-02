import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  petName?: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isFromVet: boolean;
}

interface PatientCardProps {
  // Content
  messages: Message[];
  isLoading?: boolean;
  
  // Actions
  onMessagePress?: (message: Message) => void;
  onViewAllMessages?: () => void;
  
  // Styling
  style?: ViewStyle;
  showUnreadCount?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  messages = [],
  isLoading = false,
  onMessagePress,
  onViewAllMessages,
  style,
  showUnreadCount = true,
}) => {
  
  const getUnreadCount = (): number => {
    return messages.filter(msg => !msg.isRead && !msg.isFromVet).length;
  };
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `hace ${days}d`;
    }
  };
  
  const getAvatarColor = (name: string): string => {
    const colors = [Colors.accent, Colors.secondary, Colors.medical.vaccination, Colors.medical.preventive];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const renderMessage = (message: Message, index: number) => {
    const isLast = index === messages.length - 1;
    
    return (
      <TouchableOpacity
        key={message.id}
        style={[
          styles.messageItem,
          !isLast && styles.messageItemBorder,
          !message.isRead && !message.isFromVet && styles.unreadMessage
        ]}
        onPress={() => onMessagePress?.(message)}
        activeOpacity={0.7}
      >
        <View style={styles.messageLeft}>
          <View style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(message.senderName) }
          ]}>
            <Text style={styles.avatarText}>
              {getInitials(message.senderName)}
            </Text>
          </View>
          
          {!message.isRead && !message.isFromVet && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName} numberOfLines={1}>
              {message.senderName}
            </Text>
            {message.petName && (
              <Text style={styles.petName} numberOfLines={1}>
                • {message.petName}
              </Text>
            )}
            <Text style={styles.messageTime}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.messageText} numberOfLines={2}>
            {message.message}
          </Text>
        </View>
        
        <View style={styles.messageRight}>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={Colors.gray[400]} 
          />
        </View>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.header}>
          <Text style={styles.title}>Mensajes Recientes</Text>
        </View>
        <View style={styles.content}>
          {[...Array(3)].map((_, index) => (
            <View key={index} style={styles.skeletonMessage}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: '70%' }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }
  
  const unreadCount = getUnreadCount();
  const recentMessages = messages.slice(0, 3);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensajes Recientes</Text>
        {showUnreadCount && unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onViewAllMessages}
        >
          <Text style={styles.viewAllText}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {recentMessages.length > 0 ? (
          <>
            {recentMessages.map(renderMessage)}
            
            {messages.length > 3 && (
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={onViewAllMessages}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={Colors.accent} />
                <Text style={styles.showMoreText}>
                  Ver todos los mensajes ({messages.length})
                </Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-outline" size={32} color={Colors.gray[400]} />
            </View>
            <Text style={styles.emptyTitle}>Sin mensajes</Text>
            <Text style={styles.emptySubtitle}>
              Los mensajes de los dueños de mascotas aparecerán aquí
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card.large,
    ...Shadow.md,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  
  title: {
    ...Typography.headline.medium,
    color: Colors.text.primary,
    flex: 1,
  },
  
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  
  unreadBadgeText: {
    ...Typography.caption.small,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 10,
  },
  
  viewAllButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  
  viewAllText: {
    ...Typography.label.medium,
    color: Colors.accent,
  },
  
  content: {
    paddingBottom: Spacing.lg,
  },
  
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  
  messageItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  
  unreadMessage: {
    backgroundColor: Colors.accent + '08',
  },
  
  messageLeft: {
    position: 'relative',
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  
  avatarText: {
    ...Typography.label.medium,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  
  messageContent: {
    flex: 1,
  },
  
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  senderName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 0,
  },
  
  petName: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 0,
  },
  
  messageTime: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    marginLeft: 'auto',
  },
  
  messageText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  
  messageRight: {
    marginLeft: Spacing.sm,
  },
  
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.accent + '10',
    borderRadius: BorderRadius.button.medium,
    gap: Spacing.xs,
  },
  
  showMoreText: {
    ...Typography.body.medium,
    color: Colors.accent,
    fontWeight: '500',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  
  emptyTitle: {
    ...Typography.body.large,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  
  emptySubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  // Skeleton loading styles
  skeletonMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[200],
    marginRight: Spacing.md,
  },
  
  skeletonContent: {
    flex: 1,
  },
  
  skeletonLine: {
    height: 12,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.xs,
    marginBottom: 6,
  },
});

export default PatientCard;