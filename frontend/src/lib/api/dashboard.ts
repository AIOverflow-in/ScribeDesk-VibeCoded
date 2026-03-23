import { apiFetch } from "./client";
import { DashboardMetrics } from "../types";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>("/dashboard/metrics");
}
