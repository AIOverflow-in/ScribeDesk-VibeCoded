import { apiFetch, BASE_URL, getAccessToken } from "./client";
import { Encounter, EncounterListItem, EncounterDetail } from "../types";

export async function listEncounters(): Promise<EncounterListItem[]> {
  return apiFetch<EncounterListItem[]>("/encounters");
}

export async function getEncounterDetail(id: string): Promise<EncounterDetail> {
  return apiFetch<EncounterDetail>(`/encounters/${id}/detail`);
}

export async function startEncounter(patient_id: string, template_id?: string): Promise<Encounter> {
  return apiFetch<Encounter>("/encounters/start", {
    method: "POST",
    body: JSON.stringify({ patient_id, template_id: template_id || null }),
  });
}

export async function pauseEncounter(id: string): Promise<Encounter> {
  return apiFetch<Encounter>(`/encounters/${id}/pause`, { method: "PATCH" });
}

export async function resumeEncounter(id: string): Promise<Encounter> {
  return apiFetch<Encounter>(`/encounters/${id}/resume`, { method: "PATCH" });
}

export async function finishEncounter(id: string): Promise<Encounter> {
  return apiFetch<Encounter>(`/encounters/${id}/finish`, { method: "POST" });
}

export async function getEncounter(id: string): Promise<Encounter> {
  return apiFetch<Encounter>(`/encounters/${id}`);
}

export async function generatePrescription(id: string) {
  return apiFetch<Array<{ name: string; dosage: string; frequency: string; duration: string; instructions: string; is_suggested: boolean }>>(`/encounters/${id}/generate-prescription`, { method: "POST" });
}

export async function regenerateSummary(id: string, templateId?: string) {
  return apiFetch<import("../types").ClinicalSummary>(`/encounters/${id}/regenerate-summary`, {
    method: "POST",
    body: JSON.stringify({ template_id: templateId || null }),
  });
}

export async function uploadSessionAudio(id: string, blob: Blob): Promise<void> {
  const token = getAccessToken();
  const form = new FormData();
  form.append("file", blob, "session.webm");
  const res = await fetch(`${BASE_URL}/encounters/${id}/upload-audio`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
}
