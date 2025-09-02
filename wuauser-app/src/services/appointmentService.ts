import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import notificationService from './notificationService';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  ownerEmail: string;
  photo?: string;
}

export interface AppointmentSlot {
  time: string;
  available: boolean;
  duration: number; // minutes
}

export interface Appointment {
  id: string;
  vetId: string;
  vetName: string;
  petId: string;
  petName: string;
  ownerEmail: string;
  ownerName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  reason: string;
  isUrgent: boolean;
  isFirstTime: boolean;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // minutes
  category: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

const STORAGE_KEYS = {
  APPOINTMENTS: 'appointments',
  PETS: 'user_pets'
};

// Mock data for development
const mockPets: Pet[] = [
  {
    id: 'pet_1',
    name: 'Max',
    species: 'Perro',
    breed: 'Golden Retriever',
    age: 3,
    weight: 28,
    ownerEmail: 'dueno@test.com',
    photo: 'https://via.placeholder.com/100x100?text=Max'
  },
  {
    id: 'pet_2',
    name: 'Luna',
    species: 'Gato',
    breed: 'Siamés',
    age: 2,
    weight: 4,
    ownerEmail: 'dueno@test.com',
    photo: 'https://via.placeholder.com/100x100?text=Luna'
  }
];

const mockServices: Service[] = [
  {
    id: 'service_1',
    name: 'Consulta General',
    description: 'Revisión médica completa de tu mascota',
    price: 350,
    duration: 30,
    category: 'consulta'
  },
  {
    id: 'service_2',
    name: 'Vacunación',
    description: 'Aplicación de vacunas según calendario',
    price: 250,
    duration: 15,
    category: 'preventivo'
  },
  {
    id: 'service_3',
    name: 'Cirugía Menor',
    description: 'Procedimientos quirúrgicos ambulatorios',
    price: 1200,
    duration: 60,
    category: 'cirugia'
  },
  {
    id: 'service_4',
    name: 'Limpieza Dental',
    description: 'Limpieza y revisión dental completa',
    price: 600,
    duration: 45,
    category: 'dental'
  },
  {
    id: 'service_5',
    name: 'Consulta de Emergencia',
    description: 'Atención médica urgente',
    price: 500,
    duration: 45,
    category: 'emergencia'
  }
];

export const appointmentService = {
  // Pet Management
  async getUserPets(): Promise<{ data?: Pet[]; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation for development
        const savedPets = await AsyncStorage.getItem(STORAGE_KEYS.PETS);
        const pets = savedPets ? JSON.parse(savedPets) : mockPets;
        console.log('🐕 Mock getUserPets:', pets);
        return { data: pets };
      }

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_email', 'dueno@test.com'); // Replace with actual user email

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error getting user pets:', error);
      return { error: error.message };
    }
  },

  async addPet(pet: Omit<Pet, 'id'>): Promise<{ data?: Pet; error?: string }> {
    try {
      const newPet: Pet = {
        ...pet,
        id: `pet_${Date.now()}`
      };

      if (!supabase) {
        // Mock implementation
        const savedPets = await AsyncStorage.getItem(STORAGE_KEYS.PETS);
        const pets = savedPets ? JSON.parse(savedPets) : mockPets;
        pets.push(newPet);
        await AsyncStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
        console.log('🐕 Mock addPet:', newPet);
        return { data: newPet };
      }

      const { data, error } = await supabase
        .from('pets')
        .insert([pet])
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error adding pet:', error);
      return { error: error.message };
    }
  },

  // Service Management
  async getVetServices(vetId: string): Promise<{ data?: Service[]; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation
        console.log('🏥 Mock getVetServices for:', vetId);
        return { data: mockServices };
      }

      const { data, error } = await supabase
        .from('veterinarian_services')
        .select('*')
        .eq('veterinarian_id', vetId);

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error getting vet services:', error);
      return { error: error.message };
    }
  },

  // Appointment Availability
  async getAvailableSlots(
    vetId: string, 
    date: string, 
    serviceDuration: number
  ): Promise<{ data?: TimeSlot[]; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation
        console.log('📅 Mock getAvailableSlots for:', { vetId, date, serviceDuration });
        
        // Generate slots from 9:00 AM to 6:00 PM
        const slots: TimeSlot[] = [];
        const startHour = 9;
        const endHour = 18;
        const slotInterval = 30; // 30 minutes

        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += slotInterval) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            
            // Mock some slots as unavailable
            const isUnavailable = Math.random() < 0.3; // 30% chance of being unavailable
            
            slots.push({
              time,
              available: !isUnavailable
            });
          }
        }

        return { data: slots };
      }

      // Get existing appointments for the date
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('time, duration')
        .eq('vet_id', vetId)
        .eq('date', date)
        .eq('status', 'confirmed');

      if (appointmentsError) {
        return { error: appointmentsError.message };
      }

      // Get vet schedule for the day
      const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });
      
      // Generate available slots based on schedule and existing appointments
      const slots = this.generateTimeSlots(dayOfWeek, appointments || [], serviceDuration);
      
      return { data: slots };
    } catch (error: any) {
      console.error('Error getting available slots:', error);
      return { error: error.message };
    }
  },

  generateTimeSlots(
    dayOfWeek: string, 
    existingAppointments: any[], 
    serviceDuration: number
  ): TimeSlot[] {
    // Mock schedule: 9:00 AM to 6:00 PM
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    const slotInterval = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = apt.time;
          const aptEnd = this.addMinutesToTime(aptStart, apt.duration);
          const slotEnd = this.addMinutesToTime(time, serviceDuration);
          
          return this.timesOverlap(time, slotEnd, aptStart, aptEnd);
        });

        slots.push({
          time,
          available: !hasConflict
        });
      }
    }

    return slots;
  },

  addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  },

  timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  },

  // Appointment CRUD Operations
  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data?: Appointment; error?: string }> {
    try {
      const newAppointment: Appointment = {
        ...appointmentData,
        id: `apt_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!supabase) {
        // Mock implementation
        const savedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        const appointments = savedAppointments ? JSON.parse(savedAppointments) : [];
        appointments.push(newAppointment);
        await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
        
        // Schedule notification reminders
        try {
          const notificationIds = await notificationService.scheduleAppointmentReminders(newAppointment);
          console.log('📲 Notifications scheduled:', notificationIds);
        } catch (notificationError) {
          console.warn('Failed to schedule notifications:', notificationError);
          // Don't fail the appointment creation if notifications fail
        }
        
        console.log('📅 Mock createAppointment:', newAppointment);
        return { data: newAppointment };
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Schedule notification reminders for production too
      if (data) {
        try {
          const notificationIds = await notificationService.scheduleAppointmentReminders(data);
          console.log('📲 Notifications scheduled:', notificationIds);
        } catch (notificationError) {
          console.warn('Failed to schedule notifications:', notificationError);
          // Don't fail the appointment creation if notifications fail
        }
      }

      return { data };
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      return { error: error.message };
    }
  },

  async getVetAppointments(
    vetId: string, 
    filter: 'today' | 'week' | 'month' = 'today'
  ): Promise<{ data?: Appointment[]; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation
        const mockAppointments: Appointment[] = [
          {
            id: 'apt_1',
            vetId: 'vet_001',
            vetName: 'Dr. Juan Pérez',
            petId: 'pet_1',
            petName: 'Max',
            ownerEmail: 'maria@email.com',
            ownerName: 'María González',
            serviceId: 'service_1',
            serviceName: 'Consulta General',
            servicePrice: 350,
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            duration: 30,
            reason: 'Revisión general y vacunas',
            isUrgent: false,
            isFirstTime: false,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'apt_2',
            vetId: 'vet_001',
            vetName: 'Dr. Juan Pérez',
            petId: 'pet_2',
            petName: 'Luna',
            ownerEmail: 'carlos@email.com',
            ownerName: 'Carlos López',
            serviceId: 'service_2',
            serviceName: 'Vacunación',
            servicePrice: 250,
            date: new Date().toISOString().split('T')[0],
            time: '14:30',
            duration: 15,
            reason: 'Vacuna anual',
            isUrgent: false,
            isFirstTime: true,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        console.log('📅 Mock getVetAppointments:', { vetId, filter });
        return { data: mockAppointments };
      }

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('vet_id', vetId);

      const today = new Date();
      
      switch (filter) {
        case 'today':
          query = query.eq('date', today.toISOString().split('T')[0]);
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          query = query
            .gte('date', weekStart.toISOString().split('T')[0])
            .lte('date', weekEnd.toISOString().split('T')[0]);
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          query = query
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);
          break;
      }

      const { data, error } = await query.order('date', { ascending: true }).order('time', { ascending: true });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error getting vet appointments:', error);
      return { error: error.message };
    }
  },

  async getUserAppointments(userEmail: string): Promise<{ data?: Appointment[]; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation
        const mockUserAppointments: Appointment[] = [
          {
            id: 'apt_user_1',
            vetId: 'vet_001',
            vetName: 'Dr. Juan Pérez',
            petId: 'pet_1',
            petName: 'Max',
            ownerEmail: userEmail,
            ownerName: 'Usuario Test',
            serviceId: 'service_1',
            serviceName: 'Consulta General',
            servicePrice: 350,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            time: '15:00',
            duration: 30,
            reason: 'Revisión de rutina',
            isUrgent: false,
            isFirstTime: false,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        console.log('📅 Mock getUserAppointments for:', userEmail);
        return { data: mockUserAppointments };
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('owner_email', userEmail)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error getting user appointments:', error);
      return { error: error.message };
    }
  },

  async updateAppointmentStatus(
    appointmentId: string, 
    status: Appointment['status'],
    notes?: string
  ): Promise<{ data?: Appointment; error?: string }> {
    try {
      if (!supabase) {
        // Mock implementation
        console.log('📅 Mock updateAppointmentStatus:', { appointmentId, status, notes });
        
        const savedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        const appointments = savedAppointments ? JSON.parse(savedAppointments) : [];
        
        const appointmentIndex = appointments.findIndex((apt: Appointment) => apt.id === appointmentId);
        if (appointmentIndex >= 0) {
          appointments[appointmentIndex].status = status;
          appointments[appointmentIndex].updatedAt = new Date().toISOString();
          if (notes) {
            appointments[appointmentIndex].notes = notes;
          }
          
          await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
          return { data: appointments[appointmentIndex] };
        }
        
        return { error: 'Appointment not found' };
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data };
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      return { error: error.message };
    }
  },

  async cancelAppointment(appointmentId: string, reason?: string): Promise<{ data?: Appointment; error?: string }> {
    try {
      // Cancel notifications first
      await notificationService.cancelAppointmentReminders(appointmentId);
      console.log('📲 Notifications cancelled for appointment:', appointmentId);
    } catch (notificationError) {
      console.warn('Failed to cancel notifications:', notificationError);
      // Continue with cancellation even if notification cancellation fails
    }
    
    return this.updateAppointmentStatus(appointmentId, 'cancelled', reason);
  },

  async confirmAppointment(appointmentId: string): Promise<{ data?: Appointment; error?: string }> {
    return this.updateAppointmentStatus(appointmentId, 'confirmed');
  },

  // Utility functions
  formatAppointmentDateTime(date: string, time: string): string {
    const appointmentDate = new Date(date);
    const [hours, minutes] = time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes));
    
    return appointmentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getAppointmentStatusColor(status: Appointment['status']): string {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#666';
    }
  },

  getAppointmentStatusText(status: Appointment['status']): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return 'Desconocido';
    }
  },

  // Notification Management
  async initializeNotifications(): Promise<boolean> {
    try {
      return await notificationService.requestPermissions();
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  },

  async scheduleTestNotification(): Promise<string | null> {
    try {
      return await notificationService.scheduleTestNotification();
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return null;
    }
  },

  async areNotificationsEnabled(): Promise<boolean> {
    return await notificationService.areNotificationsEnabled();
  },

  async getAllScheduledNotifications() {
    return await notificationService.getAllScheduledNotifications();
  },

  async cancelAllNotifications(): Promise<void> {
    return await notificationService.cancelAllNotifications();
  },

  // Auto-update appointment statuses based on time
  async updateExpiredAppointments(): Promise<void> {
    try {
      const now = new Date();
      
      if (!supabase) {
        // Mock implementation - mark past confirmed appointments as completed
        const savedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        if (savedAppointments) {
          const appointments: Appointment[] = JSON.parse(savedAppointments);
          let hasUpdates = false;
          
          const updatedAppointments = appointments.map(apt => {
            const aptDateTime = new Date(`${apt.date}T${apt.time}:00`);
            const hoursSinceAppointment = (now.getTime() - aptDateTime.getTime()) / (1000 * 60 * 60);
            
            // Auto-complete confirmed appointments that passed 2+ hours ago
            if (apt.status === 'confirmed' && hoursSinceAppointment > 2) {
              hasUpdates = true;
              return {
                ...apt,
                status: 'completed' as const,
                notes: apt.notes ? `${apt.notes}\n[Auto-completada]` : '[Auto-completada]',
                updatedAt: new Date().toISOString()
              };
            }
            
            return apt;
          });
          
          if (hasUpdates) {
            await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updatedAppointments));
            console.log('🔄 Auto-updated expired appointments');
          }
        }
      }
    } catch (error) {
      console.error('Error updating expired appointments:', error);
    }
  },

  // Clear completed appointments and their notifications (cleanup)
  async cleanupOldAppointments(): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!supabase) {
        // Mock cleanup
        const savedAppointments = await AsyncStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        if (savedAppointments) {
          const appointments: Appointment[] = JSON.parse(savedAppointments);
          const recentAppointments = appointments.filter(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}:00`);
            return aptDate > oneDayAgo || apt.status !== 'completed';
          });

          // Cancel notifications for old completed appointments
          const oldCompleted = appointments.filter(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}:00`);
            return aptDate <= oneDayAgo && apt.status === 'completed';
          });

          for (const apt of oldCompleted) {
            await notificationService.cancelAppointmentReminders(apt.id);
          }

          await AsyncStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(recentAppointments));
          console.log('🧹 Cleaned up old appointments and notifications');
        }
      }
    } catch (error) {
      console.error('Error cleaning up old appointments:', error);
    }
  },

  // Get appointment statistics
  getAppointmentStats(appointments: Appointment[]): {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    todayCount: number;
    thisWeekCount: number;
  } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    const stats = {
      total: appointments.length,
      pending: appointments.filter(apt => apt.status === 'pending').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      todayCount: appointments.filter(apt => apt.date === today).length,
      thisWeekCount: appointments.filter(apt => apt.date >= weekStart).length,
    };
    
    return stats;
  },

  // Sort appointments by priority (status + date/time)
  sortAppointmentsByPriority(appointments: Appointment[]): Appointment[] {
    const statusPriority = {
      'pending': 1,
      'confirmed': 2,
      'completed': 3,
      'cancelled': 4,
    };
    
    return appointments.sort((a, b) => {
      // First sort by status priority
      const statusDiff = (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort by date and time
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }
};

export default appointmentService;