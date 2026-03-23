import { apiFetch } from "./client";

export interface AdminDoctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export async function listDoctors(search?: string): Promise<AdminDoctor[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<AdminDoctor[]>(`/admin/doctors${q}`);
}

export async function createDoctor(body: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialization?: string;
}): Promise<AdminDoctor> {
  return apiFetch<AdminDoctor>("/admin/doctors", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function setDoctorStatus(id: string, is_active: boolean): Promise<void> {
  await apiFetch(`/admin/doctors/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ is_active }),
  });
}

export async function resetDoctorPassword(id: string, new_password: string): Promise<void> {
  await apiFetch(`/admin/doctors/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password }),
  });
}
