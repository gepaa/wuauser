import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationAlert, SafeZone, PetLocation } from '../types/chipTracking';
import chipTrackingService from './chipTrackingService';

const ALERTS_KEY = 'location_alerts';

class LocationAlertsService {
  private static instance: LocationAlertsService;

  static getInstance(): LocationAlertsService {
    if (!LocationAlertsService.instance) {
      LocationAlertsService.instance = new LocationAlertsService();
    }
    return LocationAlertsService.instance;
  }

  /**
   * Create a new location alert
   */
  async createAlert(alert: Omit<LocationAlert, 'id' | 'timestamp' | 'isRead'>): Promise<LocationAlert> {
    try {
      const newAlert: LocationAlert = {
        ...alert,
        id: this.generateId(),
        timestamp: new Date(),
        isRead: false,
      };

      const alerts = await this.getAllAlerts();
      alerts.unshift(newAlert); // Add to beginning for latest first
      await this.saveAlerts(alerts);

      // Show notification
      await this.showNotification(newAlert);

      return newAlert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get all alerts for a pet
   */
  async getAlertsForPet(petId: string, limit?: number): Promise<LocationAlert[]> {
    try {
      const alerts = await this.getAllAlerts();
      const petAlerts = alerts.filter(alert => alert.petId === petId);
      
      return limit ? petAlerts.slice(0, limit) : petAlerts;
    } catch (error) {
      console.error('Error getting alerts for pet:', error);
      return [];
    }
  }

  /**
   * Get unread alerts count
   */
  async getUnreadCount(petId?: string): Promise<number> {
    try {
      const alerts = await this.getAllAlerts();
      const unreadAlerts = alerts.filter(alert => 
        !alert.isRead && (petId ? alert.petId === petId : true)
      );
      
      return unreadAlerts.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      const alertIndex = alerts.findIndex(alert => alert.id === alertId);
      
      if (alertIndex !== -1) {
        alerts[alertIndex].isRead = true;
        await this.saveAlerts(alerts);
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }

  /**
   * Mark all alerts as read for a pet
   */
  async markAllAsRead(petId: string): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      let updated = false;
      
      alerts.forEach(alert => {
        if (alert.petId === petId && !alert.isRead) {
          alert.isRead = true;
          updated = true;
        }
      });
      
      if (updated) {
        await this.saveAlerts(alerts);
      }
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  }

  /**
   * Check for safe zone violations
   */
  async checkSafeZoneViolations(petLocation: PetLocation): Promise<void> {
    try {
      const safeZones = await chipTrackingService.getSafeZones(petLocation.petId);
      
      for (const zone of safeZones) {
        if (!zone.isActive) continue;
        
        const distance = this.calculateDistance(
          petLocation.latitude,
          petLocation.longitude,
          zone.centerLatitude,
          zone.centerLongitude
        );
        
        const isInZone = distance <= zone.radius;
        const wasInZone = await this.getPetZoneStatus(petLocation.petId, zone.id);
        
        // Check for zone exit
        if (wasInZone && !isInZone && zone.notifications.onExit) {
          await this.createAlert({
            petId: petLocation.petId,
            chipId: petLocation.chipId,
            type: 'zone_exit',
            message: `${petLocation.petName} ha salido de la zona segura "${zone.name}"`,
            location: petLocation,
            priority: 'high'
          });
        }
        
        // Check for zone entry
        if (!wasInZone && isInZone && zone.notifications.onEntry) {
          await this.createAlert({
            petId: petLocation.petId,
            chipId: petLocation.chipId,
            type: 'zone_entry',
            message: `${petLocation.petName} ha entrado a la zona segura "${zone.name}"`,
            location: petLocation,
            priority: 'medium'
          });
        }
        
        // Update zone status
        await this.setPetZoneStatus(petLocation.petId, zone.id, isInZone);
      }
    } catch (error) {
      console.error('Error checking safe zone violations:', error);
    }
  }

  /**
   * Check for low battery alerts
   */
  async checkBatteryLevel(petLocation: PetLocation): Promise<void> {
    try {
      if (petLocation.battery <= 20) {
        const lastBatteryAlert = await this.getLastBatteryAlert(petLocation.petId);
        const now = new Date().getTime();
        
        // Only send battery alert once per 6 hours
        if (!lastBatteryAlert || (now - new Date(lastBatteryAlert.timestamp).getTime()) > 6 * 60 * 60 * 1000) {
          await this.createAlert({
            petId: petLocation.petId,
            chipId: petLocation.chipId,
            type: 'low_battery',
            message: `El chip de ${petLocation.petName} tiene batería baja (${petLocation.battery}%)`,
            location: petLocation,
            priority: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Error checking battery level:', error);
    }
  }

  /**
   * Check for signal loss
   */
  async checkSignalStatus(petLocation: PetLocation): Promise<void> {
    try {
      const timeSinceUpdate = Date.now() - new Date(petLocation.timestamp).getTime();
      
      // Alert if no signal for more than 1 hour
      if (timeSinceUpdate > 60 * 60 * 1000) {
        const lastSignalAlert = await this.getLastSignalAlert(petLocation.petId);
        const now = new Date().getTime();
        
        // Only send signal alert once per 2 hours
        if (!lastSignalAlert || (now - new Date(lastSignalAlert.timestamp).getTime()) > 2 * 60 * 60 * 1000) {
          await this.createAlert({
            petId: petLocation.petId,
            chipId: petLocation.chipId,
            type: 'no_signal',
            message: `Se ha perdido la señal del chip de ${petLocation.petName}`,
            location: petLocation,
            priority: 'critical'
          });
        }
      }
    } catch (error) {
      console.error('Error checking signal status:', error);
    }
  }

  /**
   * Delete old alerts (keep only last 30 days)
   */
  async cleanupOldAlerts(): Promise<void> {
    try {
      const alerts = await this.getAllAlerts();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredAlerts = alerts.filter(alert => 
        new Date(alert.timestamp) > thirtyDaysAgo
      );
      
      if (filteredAlerts.length !== alerts.length) {
        await this.saveAlerts(filteredAlerts);
      }
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async getAllAlerts(): Promise<LocationAlert[]> {
    try {
      const alertsJson = await AsyncStorage.getItem(ALERTS_KEY);
      const alerts = alertsJson ? JSON.parse(alertsJson) : [];
      
      return alerts.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp),
        location: alert.location ? {
          ...alert.location,
          timestamp: new Date(alert.location.timestamp)
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting all alerts:', error);
      return [];
    }
  }

  private async saveAlerts(alerts: LocationAlert[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving alerts:', error);
      throw error;
    }
  }

  private async getPetZoneStatus(petId: string, zoneId: string): Promise<boolean> {
    try {
      const statusKey = `zone_status_${petId}_${zoneId}`;
      const status = await AsyncStorage.getItem(statusKey);
      return status === 'true';
    } catch (error) {
      return false;
    }
  }

  private async setPetZoneStatus(petId: string, zoneId: string, isInZone: boolean): Promise<void> {
    try {
      const statusKey = `zone_status_${petId}_${zoneId}`;
      await AsyncStorage.setItem(statusKey, isInZone.toString());
    } catch (error) {
      console.error('Error setting pet zone status:', error);
    }
  }

  private async getLastBatteryAlert(petId: string): Promise<LocationAlert | null> {
    try {
      const alerts = await this.getAlertsForPet(petId);
      return alerts.find(alert => alert.type === 'low_battery') || null;
    } catch (error) {
      return null;
    }
  }

  private async getLastSignalAlert(petId: string): Promise<LocationAlert | null> {
    try {
      const alerts = await this.getAlertsForPet(petId);
      return alerts.find(alert => alert.type === 'no_signal') || null;
    } catch (error) {
      return null;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private async showNotification(alert: LocationAlert): Promise<void> {
    try {
      // In a real app, this would trigger push notifications
      console.log('📍 Location Alert:', alert.message);
      
      // Could integrate with Expo Notifications here
      // await Notifications.scheduleNotificationAsync({
      //   content: {
      //     title: 'Wuauser Alert',
      //     body: alert.message,
      //     data: { alertId: alert.id, petId: alert.petId },
      //   },
      //   trigger: null, // Show immediately
      // });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const locationAlertsService = LocationAlertsService.getInstance();
export default locationAlertsService;