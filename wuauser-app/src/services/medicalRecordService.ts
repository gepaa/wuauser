import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  MedicalRecord, 
  MedicalRecordFilter, 
  MedicalRecordStats,
  MedicalRecordSummary,
  MedicalRecordPermissions,
  MedicalRecordTemplate
} from '../types/medicalRecord';
import roleService from './roleService';

const MEDICAL_RECORDS_KEY = 'medical_records';
const TEMPLATES_KEY = 'medical_record_templates';

class MedicalRecordService {
  private static instance: MedicalRecordService;

  static getInstance(): MedicalRecordService {
    if (!MedicalRecordService.instance) {
      MedicalRecordService.instance = new MedicalRecordService();
    }
    return MedicalRecordService.instance;
  }

  /**
   * Initialize service with mock data
   */
  async initialize(): Promise<void> {
    try {
      const existingRecords = await this.getAllRecords();
      if (existingRecords.length === 0) {
        await this.seedMockData();
      }
      
      const existingTemplates = await this.getTemplates();
      if (existingTemplates.length === 0) {
        await this.seedTemplates();
      }
    } catch (error) {
      console.error('Error initializing medical record service:', error);
    }
  }

  /**
   * Save a medical record
   */
  async saveMedicalRecord(record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord> {
    try {
      const newRecord: MedicalRecord = {
        ...record,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        date: new Date(record.date), // Ensure date is Date object
      };

      const records = await this.getAllRecords();
      records.push(newRecord);
      await this.saveAllRecords(records);

      return newRecord;
    } catch (error) {
      console.error('Error saving medical record:', error);
      throw error;
    }
  }

  /**
   * Update an existing medical record
   */
  async updateMedicalRecord(id: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord> {
    try {
      const records = await this.getAllRecords();
      const index = records.findIndex(record => record.id === id);
      
      if (index === -1) {
        throw new Error('Medical record not found');
      }

      const updatedRecord = {
        ...records[index],
        ...updates,
        updatedAt: new Date(),
      };

      records[index] = updatedRecord;
      await this.saveAllRecords(records);

      return updatedRecord;
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw error;
    }
  }

  /**
   * Get medical records by pet ID
   */
  async getRecordsByPet(petId: string, filter?: MedicalRecordFilter): Promise<MedicalRecord[]> {
    try {
      const allRecords = await this.getAllRecords();
      let records = allRecords.filter(record => record.petId === petId);

      // Apply filters
      if (filter) {
        records = this.applyFilters(records, filter);
      }

      // Sort by date (newest first)
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting records by pet:', error);
      return [];
    }
  }

  /**
   * Get medical records by veterinarian ID
   */
  async getRecordsByVet(vetId: string, filter?: MedicalRecordFilter): Promise<MedicalRecord[]> {
    try {
      const allRecords = await this.getAllRecords();
      let records = allRecords.filter(record => record.vetId === vetId);

      // Apply filters
      if (filter) {
        records = this.applyFilters(records, filter);
      }

      // Sort by date (newest first)
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting records by vet:', error);
      return [];
    }
  }

  /**
   * Get a specific medical record by ID
   */
  async getRecordById(id: string): Promise<MedicalRecord | null> {
    try {
      const records = await this.getAllRecords();
      return records.find(record => record.id === id) || null;
    } catch (error) {
      console.error('Error getting record by ID:', error);
      return null;
    }
  }

  /**
   * Get medical record statistics for a pet
   */
  async getRecordStats(petId: string): Promise<MedicalRecordStats> {
    try {
      const records = await this.getRecordsByPet(petId);
      
      const stats: MedicalRecordStats = {
        totalRecords: records.length,
        lastVisit: records.length > 0 ? new Date(records[0].date) : undefined,
        pendingPrescriptions: 0,
        upcomingVaccines: 0,
        recordsByType: {
          consulta: 0,
          vacuna: 0,
          cirugia: 0,
          emergencia: 0,
          laboratorio: 0,
          revision: 0,
        }
      };

      // Calculate statistics
      records.forEach(record => {
        stats.recordsByType[record.type]++;
        
        // Count pending prescriptions
        const pendingPrescriptions = record.prescriptions?.filter(p => !p.completed) || [];
        stats.pendingPrescriptions += pendingPrescriptions.length;
        
        // Count upcoming vaccines
        if (record.vaccines) {
          const upcomingVaccines = record.vaccines.filter(v => 
            v.nextDue && new Date(v.nextDue) > new Date()
          );
          stats.upcomingVaccines += upcomingVaccines.length;
        }
        
        // Find next appointment
        if (record.followUp?.scheduled && (!stats.nextAppointment || new Date(record.followUp.date) < stats.nextAppointment)) {
          stats.nextAppointment = new Date(record.followUp.date);
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting record stats:', error);
      return {
        totalRecords: 0,
        pendingPrescriptions: 0,
        upcomingVaccines: 0,
        recordsByType: {
          consulta: 0,
          vacuna: 0,
          cirugia: 0,
          emergencia: 0,
          laboratorio: 0,
          revision: 0,
        }
      };
    }
  }

  /**
   * Get record summaries for timeline view
   */
  async getRecordSummaries(petId: string, limit?: number): Promise<MedicalRecordSummary[]> {
    try {
      const records = await this.getRecordsByPet(petId);
      
      const summaries = records.map(record => ({
        id: record.id,
        date: new Date(record.date),
        type: record.type,
        vetName: record.vetName,
        diagnosis: record.diagnosis || record.reason,
        followUpNeeded: !!record.followUp?.scheduled
      }));

      return limit ? summaries.slice(0, limit) : summaries;
    } catch (error) {
      console.error('Error getting record summaries:', error);
      return [];
    }
  }

  /**
   * Share record with another veterinarian
   */
  async shareWithVet(recordId: string, vetId: string): Promise<void> {
    try {
      const record = await this.getRecordById(recordId);
      if (!record) {
        throw new Error('Medical record not found');
      }

      const sharedWith = record.sharedWith || [];
      if (!sharedWith.includes(vetId)) {
        sharedWith.push(vetId);
        await this.updateMedicalRecord(recordId, { sharedWith });
      }
    } catch (error) {
      console.error('Error sharing record with vet:', error);
      throw error;
    }
  }

  /**
   * Check permissions for a record
   */
  async getRecordPermissions(recordId: string, userId: string): Promise<MedicalRecordPermissions> {
    try {
      const record = await this.getRecordById(recordId);
      const currentRole = roleService.getCurrentRole();
      
      if (!record) {
        return {
          canView: false,
          canEdit: false,
          canDelete: false,
          canShare: false,
          canAddAttachments: false,
        };
      }

      const isOwner = record.vetId === userId;
      const isShared = record.sharedWith?.includes(userId) || false;
      const isVet = currentRole === 'veterinario';
      const isDueno = currentRole === 'dueno';

      return {
        canView: isOwner || isShared || isDueno,
        canEdit: isOwner && isVet,
        canDelete: isOwner && isVet,
        canShare: isDueno,
        canAddAttachments: isOwner && isVet,
      };
    } catch (error) {
      console.error('Error getting record permissions:', error);
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canAddAttachments: false,
      };
    }
  }

  /**
   * Delete a medical record
   */
  async deleteRecord(recordId: string): Promise<void> {
    try {
      const records = await this.getAllRecords();
      const filteredRecords = records.filter(record => record.id !== recordId);
      await this.saveAllRecords(filteredRecords);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  /**
   * Get medical record templates
   */
  async getTemplates(): Promise<MedicalRecordTemplate[]> {
    try {
      const templatesJson = await AsyncStorage.getItem(TEMPLATES_KEY);
      return templatesJson ? JSON.parse(templatesJson) : [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  /**
   * Private methods
   */
  private async getAllRecords(): Promise<MedicalRecord[]> {
    try {
      const recordsJson = await AsyncStorage.getItem(MEDICAL_RECORDS_KEY);
      const records = recordsJson ? JSON.parse(recordsJson) : [];
      
      // Convert date strings back to Date objects
      return records.map((record: any) => ({
        ...record,
        date: new Date(record.date),
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        followUp: record.followUp ? {
          ...record.followUp,
          date: new Date(record.followUp.date)
        } : undefined,
      }));
    } catch (error) {
      console.error('Error getting all records:', error);
      return [];
    }
  }

  private async saveAllRecords(records: MedicalRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MEDICAL_RECORDS_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Error saving all records:', error);
      throw error;
    }
  }

  private applyFilters(records: MedicalRecord[], filter: MedicalRecordFilter): MedicalRecord[] {
    return records.filter(record => {
      if (filter.type && record.type !== filter.type) return false;
      if (filter.vetId && record.vetId !== filter.vetId) return false;
      if (filter.dateFrom && new Date(record.date) < filter.dateFrom) return false;
      if (filter.dateTo && new Date(record.date) > filter.dateTo) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const searchableText = `${record.reason} ${record.diagnosis} ${record.treatment} ${record.vetName}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      return true;
    });
  }

  private generateId(): string {
    return `mr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async seedMockData(): Promise<void> {
    const mockRecords: MedicalRecord[] = [
      {
        id: 'mr_001',
        petId: 'pet_001',
        petName: 'Max',
        vetId: 'vet_001',
        vetName: 'Dr. García',
        clinicName: 'Veterinaria San José',
        date: new Date('2024-11-15'),
        type: 'consulta',
        reason: 'Vómito y letargo',
        symptoms: ['Vómito', 'Letargo', 'Pérdida de apetito'],
        diagnosis: 'Gastritis leve',
        treatment: 'Dieta blanda y medicación',
        vitalSigns: {
          weight: 25.5,
          temperature: 38.2,
          heartRate: 90
        },
        attachments: [],
        prescriptions: [
          {
            id: 'pres_001',
            medicine: 'Omeprazol',
            dosage: '20mg',
            frequency: 'Cada 12 horas',
            duration: '5 días',
            instructions: 'Administrar con alimento',
            startDate: new Date('2024-11-15'),
            endDate: new Date('2024-11-20'),
            completed: false
          }
        ],
        vaccines: [],
        procedures: [],
        labResults: [],
        followUp: {
          date: new Date('2024-11-22'),
          reason: 'Control post-tratamiento',
          scheduled: true
        },
        notes: 'Paciente respondió bien al tratamiento inicial',
        status: 'active',
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-11-15'),
        sharedWith: []
      },
      {
        id: 'mr_002',
        petId: 'pet_001',
        petName: 'Max',
        vetId: 'vet_002',
        vetName: 'Dra. López',
        clinicName: 'PetCare Center',
        date: new Date('2024-10-02'),
        type: 'vacuna',
        reason: 'Vacunación anual',
        symptoms: [],
        diagnosis: 'Aplicación de vacunas de rutina',
        treatment: 'Vacunas múltiples aplicadas',
        vitalSigns: {
          weight: 25.0,
          temperature: 38.5,
          heartRate: 85
        },
        attachments: [],
        prescriptions: [],
        vaccines: [
          {
            id: 'vac_001',
            name: 'Rabia',
            manufacturer: 'Zoetis',
            lotNumber: 'RB2024001',
            expiryDate: new Date('2025-10-01'),
            nextDue: new Date('2025-10-02'),
            site: 'Muslo derecho',
            reactions: 'Ninguna observada'
          },
          {
            id: 'vac_002',
            name: 'Parvovirus',
            manufacturer: 'Zoetis',
            lotNumber: 'PV2024001',
            expiryDate: new Date('2025-10-01'),
            nextDue: new Date('2025-10-02'),
            site: 'Muslo izquierdo',
            reactions: 'Ninguna observada'
          }
        ],
        procedures: [],
        labResults: [],
        notes: 'Vacunación sin complicaciones',
        status: 'completed',
        createdAt: new Date('2024-10-02'),
        updatedAt: new Date('2024-10-02'),
        sharedWith: []
      }
    ];

    await this.saveAllRecords(mockRecords);
  }

  private async seedTemplates(): Promise<void> {
    const templates: MedicalRecordTemplate[] = [
      {
        id: 'template_001',
        name: 'Consulta General',
        type: 'consulta',
        commonSymptoms: ['Vómito', 'Diarrea', 'Letargo', 'Pérdida de apetito', 'Fiebre'],
        commonDiagnoses: ['Gastroenteritis', 'Infección viral', 'Parásitos intestinales'],
        commonTreatments: ['Dieta blanda', 'Hidratación', 'Medicación sintomática'],
        requiredFields: ['reason', 'symptoms', 'diagnosis', 'treatment', 'vitalSigns.weight']
      },
      {
        id: 'template_002',
        name: 'Vacunación',
        type: 'vacuna',
        commonSymptoms: [],
        commonDiagnoses: ['Aplicación de vacunas de rutina', 'Refuerzo vacunal'],
        commonTreatments: ['Vacunas aplicadas según protocolo'],
        requiredFields: ['vaccines', 'vitalSigns.weight']
      }
    ];

    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }
}

export const medicalRecordService = MedicalRecordService.getInstance();
export default medicalRecordService;