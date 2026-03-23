import { apiFetch } from "./client";
import { Template } from "../types";

export async function listTemplates(): Promise<Template[]> {
  return apiFetch<Template[]>("/templates");
}

export async function createTemplate(data: {
  name: string;
  type: string;
  content: string;
}): Promise<Template> {
  return apiFetch<Template>("/templates", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
  return apiFetch<Template>(`/templates/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteTemplate(id: string): Promise<void> {
  return apiFetch<void>(`/templates/${id}`, { method: "DELETE" });
}
