export interface MedicalRecord {
  id: string;
  petId: string;
  petName: string; // Para facilitar visualización
  vetId: string;
  vetName: string; // Para facilitar visualización
  clinicName?: string;
  date: Date;
  type: 'consulta' | 'vacuna' | 'cirugia' | 'emergencia' | 'laboratorio' | 'revision';
  
  // Información básica
  reason: string;
  symptoms: string[];
  diagnosis: string;
  treatment: string;
  
  // Signos vitales
  vitalSigns?: {
    weight?: number; // kg
    temperature?: number; // °C
    heartRate?: number; // bpm
    respiratoryRate?: number; // rpm
    bloodPressure?: string; // e.g., "120/80"
  };
  
  // Archivos adjuntos
  attachments: MedicalAttachment[];
  
  // Medicamentos recetados
  prescriptions: Prescription[];
  
  // Vacunas (si type === 'vacuna')
  vaccines?: Vaccine[];
  
  // Procedimientos (si type === 'cirugia')
  procedures?: Procedure[];
  
  // Resultados de laboratorio (si type === 'laboratorio')
  labResults?: LabResult[];
  
  // Próxima cita o seguimiento
  followUp?: {
    date: Date;
    reason: string;
    scheduled: boolean;
  };
  
  // Notas adicionales
  notes?: string;
  
  // Estado del registro
  status: 'active' | 'completed' | 'cancelled';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Permisos de acceso
  sharedWith?: string[]; // IDs de veterinarios con acceso
}

export interface MedicalAttachment {
  id: string;
  type: 'imagen' | 'pdf' | 'lab_results' | 'xray' | 'ultrasound';
  url: string;
  name: string;
  size?: number; // bytes
  uploadedAt: Date;
  description?: string;
}

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string; // e.g., "10mg"
  frequency: string; // e.g., "Cada 8 horas"
  duration: string; // e.g., "7 días"
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  completed: boolean;
}

export interface Vaccine {
  id: string;
  name: string; // e.g., "Rabia", "Parvovirus"
  manufacturer?: string;
  lotNumber?: string;
  expiryDate?: Date;
  nextDue?: Date;
  site?: string; // Sitio de aplicación
  reactions?: string; // Reacciones observadas
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  anesthesia?: string;
  duration?: number; // minutos
  complications?: string;
  postOpInstructions?: string;
}

export interface LabResult {
  id: string;
  testName: string;
  result: string;
  normalRange?: string;
  unit?: string;
  abnormal: boolean;
  notes?: string;
}

// Tipos para filtrado y búsqueda
export type MedicalRecordType = 'consulta' | 'vacuna' | 'cirugia' | 'emergencia' | 'laboratorio' | 'revision';

export interface MedicalRecordFilter {
  type?: MedicalRecordType;
  dateFrom?: Date;
  dateTo?: Date;
  vetId?: string;
  search?: string;
}

// Estadísticas del expediente
export interface MedicalRecordStats {
  totalRecords: number;
  lastVisit?: Date;
  nextAppointment?: Date;
  pendingPrescriptions: number;
  upcomingVaccines: number;
  recordsByType: {
    [key in MedicalRecordType]: number;
  };
}

// Resumen para mostrar en cards
export interface MedicalRecordSummary {
  id: string;
  date: Date;
  type: MedicalRecordType;
  vetName: string;
  diagnosis: string;
  followUpNeeded: boolean;
}

// Permisos de acceso
export interface MedicalRecordPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canAddAttachments: boolean;
}

// Template para tipos comunes de consulta
export interface MedicalRecordTemplate {
  id: string;
  name: string;
  type: MedicalRecordType;
  commonSymptoms: string[];
  commonDiagnoses: string[];
  commonTreatments: string[];
  requiredFields: string[];
}

export default MedicalRecord;