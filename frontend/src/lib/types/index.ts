export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  signature_url?: string;
  role: "DOCTOR" | "SUPER_ADMIN";
}

export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: string;
  created_at: string;
}

export interface Encounter {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: "CREATED" | "ACTIVE" | "PAUSED" | "FINISHED";
  start_time?: string;
  end_time?: string;
  transcript_text: string;
  template_id?: string;
  created_at: string;
}

export interface PatientEncounterSummary {
  id: string;
  status: string;
  start_time?: string;
  end_time?: string;
  template_name?: string;
  summary: {
    chief_complaint?: string;
    assessment?: string;
    plan?: string;
    diagnosis: string[];
  } | null;
  medications: Array<{ name: string; dosage: string; frequency: string }>;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  encounter_id: string;
  speaker: string;
  text: string;
  start_time: number;
  end_time: number;
  is_interim?: boolean;
}

export interface Vitals {
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
  spo2?: string;
  respiratory_rate?: string;
}

export interface ClinicalSummary {
  id?: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  assessment?: string;
  plan?: string;
  summary_text: string;
  vitals?: Vitals;
  diagnosis: string[];
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  is_suggested: boolean;
}

export interface Prescription {
  id: string;
  encounter_id: string;
  medications: Medication[];
  approved: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  encounter_id: string;
  template_id?: string;
  template_name?: string;
  content: string;
  pdf_url?: string;
  created_at: string;
}

export interface Task {
  id: string;
  doctor_id: string;
  encounter_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

export interface Template {
  id: string;
  doctor_id?: string;
  name: string;
  type: string;
  content: string;
  is_predefined: boolean;
  created_at: string;
}

export interface PartialAnalysis {
  key_points: string[];
  symptoms: string[];
  possible_diagnoses: string[];
  items_to_clarify: string[];
}

export interface FinalAnalysis {
  summary?: ClinicalSummary;
  vitals?: Vitals;
  prescriptions: Medication[];
  summary_id?: string;
}

// WebSocket message types
export type WSMessageType =
  | "CONNECTED"
  | "TRANSCRIPT_INTERIM"
  | "TRANSCRIPT_FINAL"
  | "PARTIAL_ANALYSIS"
  | "FINAL_ANALYSIS"
  | "PROCESSING_STARTED"
  | "FINISHING"
  | "PAUSED"
  | "RESUMED"
  | "ERROR";

export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
}

export interface EncounterListItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  status: "CREATED" | "ACTIVE" | "PAUSED" | "FINISHED";
  start_time?: string;
  end_time?: string;
  duration_secs?: number;
  created_at: string;
}

export interface EncounterDetail {
  encounter: Encounter & {
    patient_name: string;
    patient_age?: number;
    patient_gender?: string;
  };
  summary: ClinicalSummary | null;
  prescriptions: Medication[];
  segments: TranscriptSegment[];
}

export interface DashboardMetrics {
  total_patients: number;
  total_encounters: number;
  finished_encounters: number;
  reports_generated: number;
  pending_tasks: number;
  completed_tasks: number;
  recent_encounters: Array<{
    id: string;
    patient_name: string;
    status: string;
    created_at: string;
  }>;
}
