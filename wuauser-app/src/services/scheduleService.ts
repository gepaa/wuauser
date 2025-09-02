import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  maxAppointments?: number;
  currentAppointments?: number;
}

export interface DaySchedule {
  day: string;
  dayName: string;
  enabled: boolean;
  timeSlots: TimeSlot[];
}

export interface VetSchedule {
  vetId: string;
  schedule: DaySchedule[];
  timezone: string;
  appointmentDuration: number; // in minutes
  bufferTime: number; // time between appointments in minutes
  createdAt: string;
  updatedAt: string;
}

class ScheduleService {
  private readonly STORAGE_KEY_PREFIX = 'vet_schedule_';

  /**
   * Get veterinarian's complete schedule
   */
  async getVetSchedule(vetId: string): Promise<VetSchedule | null> {
    try {
      // Try Supabase first if available
      if (supabase) {
        console.log('🔄 Loading schedule from Supabase...');
        const { data, error } = await supabase
          .from('vet_schedules')
          .select('*')
          .eq('vet_id', vetId)
          .single();

        if (data && !error) {
          return this.transformSupabaseSchedule(data);
        }

        console.warn('Schedule not found in Supabase, trying local storage');
      }

      // Fallback to local storage
      console.log('📱 Loading schedule from local storage...');
      const scheduleJson = await AsyncStorage.getItem(`${this.STORAGE_KEY_PREFIX}${vetId}`);
      
      if (scheduleJson) {
        return JSON.parse(scheduleJson);
      }

      // Return default schedule if none exists
      return this.createDefaultSchedule(vetId);
    } catch (error) {
      console.error('Error getting vet schedule:', error);
      return this.createDefaultSchedule(vetId);
    }
  }

  /**
   * Save veterinarian's schedule
   */
  async saveVetSchedule(schedule: VetSchedule): Promise<boolean> {
    try {
      schedule.updatedAt = new Date().toISOString();

      // Try Supabase first if available
      if (supabase) {
        console.log('💾 Saving schedule to Supabase...');
        const { error } = await supabase
          .from('vet_schedules')
          .upsert({
            vet_id: schedule.vetId,
            schedule_data: schedule.schedule,
            timezone: schedule.timezone,
            appointment_duration: schedule.appointmentDuration,
            buffer_time: schedule.bufferTime,
            updated_at: schedule.updatedAt
          });

        if (!error) {
          // Also save locally for offline access
          await AsyncStorage.setItem(
            `${this.STORAGE_KEY_PREFIX}${schedule.vetId}`,
            JSON.stringify(schedule)
          );
          console.log('✅ Schedule saved successfully');
          return true;
        }

        console.warn('Failed to save to Supabase, saving locally:', error);
      }

      // Fallback to local storage
      console.log('📱 Saving schedule locally...');
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY_PREFIX}${schedule.vetId}`,
        JSON.stringify(schedule)
      );
      
      return true;
    } catch (error) {
      console.error('Error saving schedule:', error);
      return false;
    }
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(
    vetId: string, 
    date: string, // YYYY-MM-DD format
    excludeAppointmentId?: string
  ): Promise<TimeSlot[]> {
    try {
      const schedule = await this.getVetSchedule(vetId);
      if (!schedule) return [];

      const dayOfWeek = this.getDayOfWeek(date);
      const daySchedule = schedule.schedule.find(day => day.day === dayOfWeek);
      
      if (!daySchedule || !daySchedule.enabled) {
        return [];
      }

      // Filter available slots and check for existing appointments
      const availableSlots = daySchedule.timeSlots.filter(slot => slot.available);

      // If Supabase is available, check for existing appointments
      if (supabase) {
        const slotsWithAppointments = await this.checkSlotAvailability(
          vetId, 
          date, 
          availableSlots,
          excludeAppointmentId
        );
        return slotsWithAppointments;
      }

      return availableSlots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Check if a time slot is available for booking
   */
  async isSlotAvailable(
    vetId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const availableSlots = await this.getAvailableSlots(vetId, date, excludeAppointmentId);
      
      return availableSlots.some(slot => 
        slot.startTime === startTime && 
        slot.endTime === endTime &&
        (slot.currentAppointments || 0) < (slot.maxAppointments || 1)
      );
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  }

  /**
   * Block/unblock specific time slots
   */
  async toggleSlotAvailability(
    vetId: string,
    day: string,
    slotId: string,
    available: boolean
  ): Promise<boolean> {
    try {
      const schedule = await this.getVetSchedule(vetId);
      if (!schedule) return false;

      // Update the specific slot
      schedule.schedule = schedule.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return {
            ...daySchedule,
            timeSlots: daySchedule.timeSlots.map(slot =>
              slot.id === slotId ? { ...slot, available } : slot
            )
          };
        }
        return daySchedule;
      });

      return await this.saveVetSchedule(schedule);
    } catch (error) {
      console.error('Error toggling slot availability:', error);
      return false;
    }
  }

  /**
   * Add new time slot to a day
   */
  async addTimeSlot(
    vetId: string,
    day: string,
    startTime: string,
    endTime: string,
    maxAppointments: number = 1
  ): Promise<boolean> {
    try {
      const schedule = await this.getVetSchedule(vetId);
      if (!schedule) return false;

      const newSlot: TimeSlot = {
        id: `${day}_${Date.now()}`,
        startTime,
        endTime,
        available: true,
        maxAppointments,
        currentAppointments: 0
      };

      // Add to the specific day
      schedule.schedule = schedule.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return {
            ...daySchedule,
            timeSlots: [...daySchedule.timeSlots, newSlot]
          };
        }
        return daySchedule;
      });

      return await this.saveVetSchedule(schedule);
    } catch (error) {
      console.error('Error adding time slot:', error);
      return false;
    }
  }

  /**
   * Remove time slot from a day
   */
  async removeTimeSlot(vetId: string, day: string, slotId: string): Promise<boolean> {
    try {
      const schedule = await this.getVetSchedule(vetId);
      if (!schedule) return false;

      // Check if slot has existing appointments
      if (supabase) {
        const hasAppointments = await this.checkSlotHasAppointments(slotId);
        if (hasAppointments) {
          throw new Error('Cannot remove slot with existing appointments');
        }
      }

      // Remove from the specific day
      schedule.schedule = schedule.schedule.map(daySchedule => {
        if (daySchedule.day === day) {
          return {
            ...daySchedule,
            timeSlots: daySchedule.timeSlots.filter(slot => slot.id !== slotId)
          };
        }
        return daySchedule;
      });

      return await this.saveVetSchedule(schedule);
    } catch (error) {
      console.error('Error removing time slot:', error);
      return false;
    }
  }

  /**
   * Copy schedule from one day to another
   */
  async copyDaySchedule(
    vetId: string,
    fromDay: string,
    toDay: string
  ): Promise<boolean> {
    try {
      const schedule = await this.getVetSchedule(vetId);
      if (!schedule) return false;

      const sourceDay = schedule.schedule.find(day => day.day === fromDay);
      if (!sourceDay) return false;

      // Copy schedule with new IDs
      const copiedSlots: TimeSlot[] = sourceDay.timeSlots.map(slot => ({
        ...slot,
        id: `${toDay}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));

      // Update target day
      schedule.schedule = schedule.schedule.map(daySchedule => {
        if (daySchedule.day === toDay) {
          return {
            ...daySchedule,
            timeSlots: copiedSlots,
            enabled: true
          };
        }
        return daySchedule;
      });

      return await this.saveVetSchedule(schedule);
    } catch (error) {
      console.error('Error copying day schedule:', error);
      return false;
    }
  }

  // Private helper methods
  private createDefaultSchedule(vetId: string): VetSchedule {
    const weekDays = [
      { key: 'monday', name: 'Lunes' },
      { key: 'tuesday', name: 'Martes' },
      { key: 'wednesday', name: 'Miércoles' },
      { key: 'thursday', name: 'Jueves' },
      { key: 'friday', name: 'Viernes' },
      { key: 'saturday', name: 'Sábado' },
      { key: 'sunday', name: 'Domingo' }
    ];

    const schedule: DaySchedule[] = weekDays.map(day => ({
      day: day.key,
      dayName: day.name,
      enabled: ['saturday', 'sunday'].includes(day.key) ? false : true,
      timeSlots: day.key === 'sunday' ? [] : [
        {
          id: `${day.key}_morning`,
          startTime: '09:00',
          endTime: '12:00',
          available: true,
          maxAppointments: 6,
          currentAppointments: 0
        },
        {
          id: `${day.key}_afternoon`,
          startTime: '14:00',
          endTime: '18:00',
          available: true,
          maxAppointments: 8,
          currentAppointments: 0
        }
      ]
    }));

    return {
      vetId,
      schedule,
      timezone: 'America/Mexico_City',
      appointmentDuration: 30,
      bufferTime: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private transformSupabaseSchedule(supabaseData: any): VetSchedule {
    return {
      vetId: supabaseData.vet_id,
      schedule: supabaseData.schedule_data || [],
      timezone: supabaseData.timezone || 'America/Mexico_City',
      appointmentDuration: supabaseData.appointment_duration || 30,
      bufferTime: supabaseData.buffer_time || 10,
      createdAt: supabaseData.created_at,
      updatedAt: supabaseData.updated_at
    };
  }

  private getDayOfWeek(date: string): string {
    const dayNames = [
      'sunday', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday'
    ];
    
    const dateObj = new Date(date);
    return dayNames[dateObj.getDay()];
  }

  private async checkSlotAvailability(
    vetId: string,
    date: string,
    slots: TimeSlot[],
    excludeAppointmentId?: string
  ): Promise<TimeSlot[]> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('start_time, end_time, id')
        .eq('vet_id', vetId)
        .eq('date', date)
        .eq('status', 'confirmed')
        .neq('id', excludeAppointmentId || '');

      if (error) {
        console.error('Error checking appointments:', error);
        return slots;
      }

      // Count appointments for each slot
      return slots.map(slot => {
        const appointmentsInSlot = appointments?.filter(apt => 
          apt.start_time >= slot.startTime && apt.end_time <= slot.endTime
        ) || [];

        return {
          ...slot,
          currentAppointments: appointmentsInSlot.length
        };
      });
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return slots;
    }
  }

  private async checkSlotHasAppointments(slotId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('time_slot_id', slotId)
        .in('status', ['confirmed', 'pending']);

      return !error && (count || 0) > 0;
    } catch (error) {
      console.error('Error checking slot appointments:', error);
      return false;
    }
  }
}

export const scheduleService = new ScheduleService();
export default scheduleService;