import { api } from "./client";
import type { DashboardData } from "@/shared/types";

export async function getTodayDashboard() {
  return api.get<DashboardData>("/sessions/today-dashboard");
}
