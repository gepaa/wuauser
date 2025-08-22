// NOTIFICATION SERVICE - COMMENTED OUT DUE TO MISSING expo-notifications DEPENDENCY
// This file is temporarily commented out to allow the app to compile
// To enable notifications, install expo-notifications package and uncomment this code

/*
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from './appointmentService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  appointmentId: string;
  type: 'day_before' | 'hour_before';
  scheduledTime: string;
  notificationId: string;
}

const STORAGE_KEY = 'scheduled_notifications';

export const notificationService = {
  // Initialize notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications not supported on web');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('appointment-reminders', {
          name: 'Recordatorios de Citas',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F4B740',
          sound: 'default',
        });
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Schedule appointment reminders
  async scheduleAppointmentReminders(appointment: Appointment): Promise<string[]> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('❌ Cannot schedule notifications - no permissions');
        return [];
      }

      const scheduledIds: string[] = [];
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
      const now = new Date();

      // Schedule 1 day before reminder
      const dayBeforeTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
      if (dayBeforeTime > now) {
        const dayBeforeId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🐕 Recordatorio de Cita - Mañana',
            body: `Tu mascota ${appointment.petName} tiene cita con ${appointment.vetName} mañana a las ${appointment.time}`,
            data: {
              appointmentId: appointment.id,
              type: 'day_before',
              vetName: appointment.vetName,
              petName: appointment.petName,
              time: appointment.time,
              service: appointment.serviceName,
            },
            sound: 'default',
          },
          trigger: {
            date: dayBeforeTime,
          },
        });
        
        scheduledIds.push(dayBeforeId);
        console.log('📅 Day before reminder scheduled for:', dayBeforeTime);
      }

      // Schedule 1 hour before reminder
      const hourBeforeTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
      if (hourBeforeTime > now) {
        const hourBeforeId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Recordatorio de Cita - En 1 hora',
            body: `¡No olvides! ${appointment.petName} tiene cita con ${appointment.vetName} en 1 hora (${appointment.time})`,
            data: {
              appointmentId: appointment.id,
              type: 'hour_before',
              vetName: appointment.vetName,
              petName: appointment.petName,
              time: appointment.time,
              service: appointment.serviceName,
            },
            sound: 'default',
          },
          trigger: {
            date: hourBeforeTime,
          },
        });
        
        scheduledIds.push(hourBeforeId);
        console.log('⏰ Hour before reminder scheduled for:', hourBeforeTime);
      }

      // Save notification IDs for later management
      await this.saveNotificationData(appointment.id, scheduledIds);

      return scheduledIds;
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
      return [];
    }
  },

  // Cancel appointment notifications
  async cancelAppointmentReminders(appointmentId: string): Promise<void> {
    try {
      const notificationData = await this.getNotificationData(appointmentId);
      
      if (notificationData && notificationData.length > 0) {
        const notificationIds = notificationData.map(data => data.notificationId);
        await Notifications.cancelScheduledNotificationAsync(...notificationIds);
        
        // Remove from storage
        await this.removeNotificationData(appointmentId);
        
        console.log('❌ Cancelled notifications for appointment:', appointmentId);
      }
    } catch (error) {
      console.error('Error cancelling appointment reminders:', error);
    }
  },

  // Save notification data to storage
  async saveNotificationData(appointmentId: string, notificationIds: string[]): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const notifications: { [key: string]: string[] } = existingData ? JSON.parse(existingData) : {};
      
      notifications[appointmentId] = notificationIds;
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification data:', error);
    }
  },

  // Get notification data from storage
  async getNotificationData(appointmentId: string): Promise<NotificationData[] | null> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existingData) return null;

      const notifications: { [key: string]: string[] } = JSON.parse(existingData);
      const notificationIds = notifications[appointmentId];
      
      if (!notificationIds) return null;

      // Convert to NotificationData format
      return notificationIds.map((id, index) => ({
        appointmentId,
        type: index === 0 ? 'day_before' : 'hour_before',
        scheduledTime: new Date().toISOString(), // Placeholder
        notificationId: id,
      }));
    } catch (error) {
      console.error('Error getting notification data:', error);
      return null;
    }
  },

  // Remove notification data from storage
  async removeNotificationData(appointmentId: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existingData) return;

      const notifications: { [key: string]: string[] } = JSON.parse(existingData);
      delete notifications[appointmentId];
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error removing notification data:', error);
    }
  },

  // Get all scheduled notifications
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('❌ All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  },

  // Handle notification received (when app is open)
  addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  },

  // Handle notification response (when user taps notification)
  addNotificationResponseReceivedListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  // Schedule test notification (for development)
  async scheduleTestNotification(): Promise<string> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('No notification permissions');
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Notificación de Prueba',
          body: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
          data: { test: true },
        },
        trigger: {
          seconds: 5,
        },
      });

      console.log('🧪 Test notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      throw error;
    }
  },

  // Format notification time for display
  formatNotificationTime(date: string, time: string): string {
    const appointmentDate = new Date(`${date}T${time}:00`);
    return appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  },

  // Get badge count
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  },

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  },

  // Clear badge
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }
};

export default notificationService;
*/

// Temporary placeholder to prevent import errors
export const notificationService = {
  scheduleTestNotification: async () => Promise.resolve('disabled'),
  scheduleAppointmentReminders: async () => Promise.resolve([]),
  cancelAppointmentReminders: async () => Promise.resolve(),
};

export default notificationService;