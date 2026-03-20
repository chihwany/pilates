import { api } from "./client";
import type { ExerciseCatalogItem } from "@/shared/types";

export async function getExerciseCatalog(filters?: {
  category?: string;
  search?: string;
  difficulty?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);

  const query = params.toString();
  return api.get<ExerciseCatalogItem[]>(`/exercises${query ? `?${query}` : ""}`);
}
