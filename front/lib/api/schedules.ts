import { api } from "./client";
import type { WeeklySchedule } from "@/shared/types";

export async function getSchedules(dayOfWeek?: number) {
  const query = dayOfWeek !== undefined ? `?dayOfWeek=${dayOfWeek}` : "";
  return api.get<WeeklySchedule[]>(`/schedules${query}`);
}

export async function createSchedule(data: {
  memberId: string;
  dayOfWeek: number;
  startTime: string;
}) {
  return api.post<WeeklySchedule>("/schedules", data);
}

export async function deleteSchedule(id: string) {
  return api.delete<{ id: string }>(`/schedules/${id}`);
}
