import { apiFetch } from "./client";
import { Patient, PatientEncounterSummary } from "../types";

export async function searchPatients(q: string = ""): Promise<Patient[]> {
  return apiFetch<Patient[]>(`/patients?q=${encodeURIComponent(q)}`);
}

export async function getPatients(): Promise<Patient[]> {
  return apiFetch<Patient[]>("/patients?q=");
}

export async function getPatientEncounters(patientId: string): Promise<PatientEncounterSummary[]> {
  return apiFetch<PatientEncounterSummary[]>(`/patients/${patientId}/encounters`);
}

export async function createPatient(data: {
  name: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: string;
}): Promise<Patient> {
  return apiFetch<Patient>("/patients", { method: "POST", body: JSON.stringify(data) });
}

export async function getPatient(id: string): Promise<Patient> {
  return apiFetch<Patient>(`/patients/${id}`);
}
