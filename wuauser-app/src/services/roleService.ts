import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'veterinario' | 'dueno';

interface RoleData {
  currentRole: UserRole;
  email: string;
  timestamp: string;
}

class RoleService {
  private static instance: RoleService;
  private currentRole: UserRole = 'dueno';
  private listeners: Array<(role: UserRole) => void> = [];

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  /**
   * Initialize role service and load saved role
   */
  async initialize(): Promise<void> {
    try {
      const savedRole = await this.loadSavedRole();
      if (savedRole) {
        this.currentRole = savedRole;
      } else {
        // Determine initial role based on user type
        const userType = await SecureStore.getItemAsync('user_type');
        this.currentRole = userType === 'veterinario' ? 'veterinario' : 'dueno';
        await this.saveRole(this.currentRole);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing role service:', error);
      this.currentRole = 'dueno'; // Default fallback
    }
  }

  /**
   * Get current user role
   */
  getCurrentRole(): UserRole {
    return this.currentRole;
  }

  /**
   * Switch to the opposite role
   */
  async switchRole(): Promise<UserRole> {
    try {
      const newRole: UserRole = this.currentRole === 'veterinario' ? 'dueno' : 'veterinario';
      await this.setRole(newRole);
      return newRole;
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  }

  /**
   * Set specific role
   */
  async setRole(role: UserRole): Promise<void> {
    try {
      this.currentRole = role;
      await this.saveRole(role);
      this.notifyListeners();
    } catch (error) {
      console.error('Error setting role:', error);
      throw error;
    }
  }

  /**
   * Check if user can switch to veterinarian role
   */
  async canSwitchToVet(): Promise<boolean> {
    try {
      // Check if user has veterinarian credentials
      const userEmail = await SecureStore.getItemAsync('user_email');
      
      if (!userEmail) return false;

      // In development, allow switch for test vet account
      if (process.env.NODE_ENV === 'development') {
        return userEmail === 'vet@test.com' || userEmail.includes('vet');
      }

      // In production, check if user has veterinarian profile
      // This would typically involve a Supabase query
      return true; // For now, allow all users to switch
    } catch (error) {
      console.error('Error checking vet permissions:', error);
      return false;
    }
  }

  /**
   * Get role display information
   */
  getRoleInfo(role?: UserRole): { title: string; subtitle: string; icon: string } {
    const currentRole = role || this.currentRole;
    
    switch (currentRole) {
      case 'veterinario':
        return {
          title: 'Modo Veterinario',
          subtitle: 'Gestiona tu clínica y consultas',
          icon: 'medical'
        };
      case 'dueno':
        return {
          title: 'Modo Dueño',
          subtitle: 'Cuida de tus mascotas',
          icon: 'heart'
        };
      default:
        return {
          title: 'Usuario',
          subtitle: 'Bienvenido a Wuauser',
          icon: 'person'
        };
    }
  }

  /**
   * Get navigation target for current role
   */
  getHomeScreen(role?: UserRole): string {
    const currentRole = role || this.currentRole;
    
    switch (currentRole) {
      case 'veterinario':
        return 'VetDashboard';
      case 'dueno':
        return 'HomeScreen';
      default:
        return 'HomeScreen';
    }
  }

  /**
   * Subscribe to role changes
   */
  subscribe(listener: (role: UserRole) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all role data (logout)
   */
  async clearRole(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user_role_data');
      this.currentRole = 'dueno';
      this.listeners = [];
    } catch (error) {
      console.error('Error clearing role data:', error);
    }
  }

  /**
   * Save role to storage
   */
  private async saveRole(role: UserRole): Promise<void> {
    try {
      const userEmail = await SecureStore.getItemAsync('user_email');
      
      const roleData: RoleData = {
        currentRole: role,
        email: userEmail || '',
        timestamp: new Date().toISOString()
      };

      await AsyncStorage.setItem('user_role_data', JSON.stringify(roleData));
    } catch (error) {
      console.error('Error saving role:', error);
      throw error;
    }
  }

  /**
   * Load saved role from storage
   */
  private async loadSavedRole(): Promise<UserRole | null> {
    try {
      const savedData = await AsyncStorage.getItem('user_role_data');
      
      if (!savedData) return null;

      const roleData: RoleData = JSON.parse(savedData);
      
      // Validate that saved role belongs to current user
      const currentEmail = await SecureStore.getItemAsync('user_email');
      if (roleData.email !== currentEmail) {
        await AsyncStorage.removeItem('user_role_data');
        return null;
      }

      return roleData.currentRole;
    } catch (error) {
      console.error('Error loading saved role:', error);
      return null;
    }
  }

  /**
   * Notify all listeners of role change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentRole);
      } catch (error) {
        console.error('Error notifying role listener:', error);
      }
    });
  }

  /**
   * Get role-specific stats (for dashboard)
   */
  async getRoleStats(role?: UserRole): Promise<any> {
    const currentRole = role || this.currentRole;
    
    switch (currentRole) {
      case 'veterinario':
        return {
          appointments: 5,
          patients: 127,
          earnings: '$12,400',
          rating: '4.8',
          todayAppointments: [
            {
              id: '1',
              time: '09:00',
              petName: 'Max',
              ownerName: 'Carlos Rodríguez',
              service: 'Consulta General'
            },
            {
              id: '2',
              time: '10:30',
              petName: 'Luna',
              ownerName: 'María García',
              service: 'Vacunación'
            },
            {
              id: '3',
              time: '14:00',
              petName: 'Rocky',
              ownerName: 'Juan Pérez',
              service: 'Control Post-operatorio'
            }
          ]
        };
      case 'dueno':
        return {
          pets: 0,
          appointments: 0,
          nextAppointment: null,
          emergencyContacts: []
        };
      default:
        return {};
    }
  }
}

// Export singleton instance
export const roleService = RoleService.getInstance();
export default roleService;