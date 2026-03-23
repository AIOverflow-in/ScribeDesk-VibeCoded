import { apiFetch } from "./client";
import { Task } from "../types";

export async function listTasks(status?: string): Promise<Task[]> {
  const q = status ? `?status=${status}` : "";
  return apiFetch<Task[]>(`/tasks${q}`);
}

export async function createTask(data: {
  title: string;
  description?: string;
  due_date?: string;
  encounter_id?: string;
}): Promise<Task> {
  return apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/tasks/${id}`, { method: "DELETE" });
}
