import { apiFetch } from "./client";
import { Doctor } from "../types";

export async function login(email: string, password: string) {
  return apiFetch<{
    access_token: string;
    refresh_token: string;
    user: Doctor & { id: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<Doctor> {
  return apiFetch<Doctor>("/auth/me");
}

export async function logout(refresh_token: string) {
  return apiFetch("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
  });
}
