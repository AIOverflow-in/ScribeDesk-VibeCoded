import { apiFetch } from "./client";
import { Report } from "../types";

export async function generateReport(encounter_id: string, template_id: string): Promise<Report> {
  return apiFetch<Report>(`/encounters/${encounter_id}/reports`, {
    method: "POST",
    body: JSON.stringify({ template_id }),
  });
}

export async function listReports(encounter_id: string): Promise<Report[]> {
  return apiFetch<Report[]>(`/encounters/${encounter_id}/reports`);
}

export async function updateReport(report_id: string, content: string): Promise<Report> {
  return apiFetch<Report>(`/encounters/reports/${report_id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}
