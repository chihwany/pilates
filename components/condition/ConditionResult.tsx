import { View, Text } from "react-native";
import type { ConditionAnalysisDetailed } from "@/shared/types";
import Card from "@/components/ui/Card";
import { ConditionBadge } from "./ConditionBadge";

interface ConditionResultProps {
  analysis: ConditionAnalysisDetailed;
}

export function ConditionResult({ analysis }: ConditionResultProps) {
  return (
    <Card className="mb-4">
      <Text className="text-base font-bold text-gray-900 mb-3">
        {"🤖 AI "}분석 결과
      </Text>

      {/* Badges row */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        <ConditionBadge type="energy" value={analysis.energy.level} />
        <ConditionBadge type="mood" value={analysis.mood.value} />
        <ConditionBadge type="stress" value={analysis.stress.level} />
      </View>

      {/* Summary */}
      <Text className="text-sm text-gray-600 leading-5 mb-3">
        {analysis.summary}
      </Text>

      {/* Facial tension info */}
      {(analysis.facialTension.forehead.level > 3 ||
        analysis.facialTension.jaw.level > 3) && (
        <View className="bg-[#F59E0B]/10 rounded-xl p-3">
          <Text className="text-sm font-semibold text-[#F59E0B] mb-1">
            {"⚠️ AI "}추가 감지
          </Text>
          {analysis.facialTension.forehead.level > 3 && (
            <Text className="text-xs text-gray-600">
              {"  "}이마 긴장 감지 (레벨 {analysis.facialTension.forehead.level}
              /10)
            </Text>
          )}
          {analysis.facialTension.jaw.level > 3 && (
            <Text className="text-xs text-gray-600">
              {"  "}턱 긴장 감지 (레벨 {analysis.facialTension.jaw.level}/10)
            </Text>
          )}
          {analysis.facialTension.asymmetry.value !== "NONE" && (
            <Text className="text-xs text-gray-600">
              {"  "}안면 비대칭: {analysis.facialTension.asymmetry.value}
            </Text>
          )}
        </View>
      )}

      {/* Exercise note from AI */}
      {analysis.exerciseNote && (
        <View className="bg-[#6366F1]/5 rounded-xl p-3 mt-3">
          <Text className="text-xs text-[#6366F1]">
            {"💡 "}{analysis.exerciseNote}
          </Text>
        </View>
      )}
    </Card>
  );
}
