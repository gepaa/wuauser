export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          user_type: 'owner' | 'vet'
          phone?: string
          avatar_url?: string
          location?: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          user_type: 'owner' | 'vet'
          phone?: string
          avatar_url?: string
          location?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          user_type?: 'owner' | 'vet'
          phone?: string
          avatar_url?: string
          location?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      veterinarian_profiles: {
        Row: {
          id: string
          user_id: string
          license_number: string
          specialties: string[]
          clinic_name?: string
          clinic_address?: string
          years_experience: number
          consultation_fee?: number
          emergency_fee?: number
          is_verified: boolean
          bio?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          license_number: string
          specialties: string[]
          clinic_name?: string
          clinic_address?: string
          years_experience: number
          consultation_fee?: number
          emergency_fee?: number
          is_verified?: boolean
          bio?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          license_number?: string
          specialties?: string[]
          clinic_name?: string
          clinic_address?: string
          years_experience?: number
          consultation_fee?: number
          emergency_fee?: number
          is_verified?: boolean
          bio?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veterinarian_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      pets: {
        Row: {
          id: string
          owner_id: string
          name: string
          species: string
          breed?: string
          age?: number
          weight?: number
          color?: string
          gender: 'male' | 'female'
          is_sterilized: boolean
          microchip_id?: string
          qr_code?: string
          profile_image_url?: string
          medical_conditions?: string[]
          allergies?: string[]
          current_medications?: string[]
          emergency_contact?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          species: string
          breed?: string
          age?: number
          weight?: number
          color?: string
          gender: 'male' | 'female'
          is_sterilized?: boolean
          microchip_id?: string
          qr_code?: string
          profile_image_url?: string
          medical_conditions?: string[]
          allergies?: string[]
          current_medications?: string[]
          emergency_contact?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          species?: string
          breed?: string
          age?: number
          weight?: number
          color?: string
          gender?: 'male' | 'female'
          is_sterilized?: boolean
          microchip_id?: string
          qr_code?: string
          profile_image_url?: string
          medical_conditions?: string[]
          allergies?: string[]
          current_medications?: string[]
          emergency_contact?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          id: string
          owner_id: string
          vet_id: string
          pet_id: string
          appointment_type: 'consultation' | 'emergency' | 'checkup' | 'vaccination'
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          scheduled_at: string
          duration_minutes: number
          notes?: string
          vet_notes?: string
          total_fee?: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          vet_id: string
          pet_id: string
          appointment_type: 'consultation' | 'emergency' | 'checkup' | 'vaccination'
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          scheduled_at: string
          duration_minutes: number
          notes?: string
          vet_notes?: string
          total_fee?: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          vet_id?: string
          pet_id?: string
          appointment_type?: 'consultation' | 'emergency' | 'checkup' | 'vaccination'
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          scheduled_at?: string
          duration_minutes?: number
          notes?: string
          vet_notes?: string
          total_fee?: number
          payment_status?: 'pending' | 'paid' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vet_id_fkey"
            columns: ["vet_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            referencedRelation: "pets"
            referencedColumns: ["id"]
          }
        ]
      }
      pet_medical_records: {
        Row: {
          id: string
          pet_id: string
          vet_id: string
          appointment_id?: string
          record_type: 'vaccination' | 'treatment' | 'diagnosis' | 'medication' | 'surgery'
          title: string
          description: string
          medications?: string[]
          next_appointment_date?: string
          attachments?: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pet_id: string
          vet_id: string
          appointment_id?: string
          record_type: 'vaccination' | 'treatment' | 'diagnosis' | 'medication' | 'surgery'
          title: string
          description: string
          medications?: string[]
          next_appointment_date?: string
          attachments?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pet_id?: string
          vet_id?: string
          appointment_id?: string
          record_type?: 'vaccination' | 'treatment' | 'diagnosis' | 'medication' | 'surgery'
          title?: string
          description?: string
          medications?: string[]
          next_appointment_date?: string
          attachments?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_medical_records_pet_id_fkey"
            columns: ["pet_id"]
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_medical_records_vet_id_fkey"
            columns: ["vet_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          appointment_id?: string
          message_type: 'text' | 'image' | 'document'
          content: string
          attachment_url?: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          appointment_id?: string
          message_type: 'text' | 'image' | 'document'
          content: string
          attachment_url?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          appointment_id?: string
          message_type?: 'text' | 'image' | 'document'
          content?: string
          attachment_url?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_veterinarians: {
        Args: {
          lat: number
          long: number
          radius_km: number
        }
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          user_type: 'owner' | 'vet'
          phone?: string
          avatar_url?: string
          location?: Json
          is_active: boolean
          created_at: string
          updated_at: string
          distance_km?: number
        }[]
      }
    }
    Enums: {
      user_type: 'owner' | 'vet'
      appointment_type: 'consultation' | 'emergency' | 'checkup' | 'vaccination'
      appointment_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'paid' | 'refunded'
      pet_gender: 'male' | 'female'
      record_type: 'vaccination' | 'treatment' | 'diagnosis' | 'medication' | 'surgery'
      message_type: 'text' | 'image' | 'document'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}