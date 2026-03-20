import { api } from "./client";
import type { ConditionAnalysisDetailed } from "@/shared/types";

export async function analyzeCondition(imageBase64: string) {
  return api.post<ConditionAnalysisDetailed>("/condition/analyze", {
    image: imageBase64,
  });
}

export async function registerCondition(data: {
  date: string;
  memberId?: string;
  conditionAiRaw: unknown;
  conditionFinal: {
    energy: number;
    mood: string;
    stress: number;
    sleep: string;
    summary?: string;
  };
  memberNote?: string;
  requestedCategories: string[];
}) {
  return api.post("/condition/register", data);
}
