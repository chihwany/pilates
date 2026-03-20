import { api } from "./client";
import type { ExerciseSequence } from "@/shared/types";

export async function getTodaySequence() {
  return api.get<ExerciseSequence>("/sequences/today");
}

export async function getSequence(sessionId: string) {
  return api.get<ExerciseSequence>(`/sequences/${sessionId}`);
}

export async function generateSequence(data: { sessionId: string }) {
  return api.post<ExerciseSequence>("/sequences/generate", data);
}

export async function updateSequence(
  id: string,
  data: Partial<Pick<ExerciseSequence, "exercises" | "totalDurationMinutes" | "difficulty" | "focusAreas" | "sequenceNote">>
) {
  return api.put<ExerciseSequence>(`/sequences/${id}`, data);
}
