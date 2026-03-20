import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { ExerciseInSequence } from "@/shared/types";

interface ExerciseItemProps {
  exercise: ExerciseInSequence;
}

const categoryColors: Record<string, string> = {
  core: "#6366F1",
  flexibility: "#10B981",
  upper_body: "#F59E0B",
  lower_body: "#EF4444",
  balance: "#8B5CF6",
  stretching: "#06B6D4",
  breathing: "#EC4899",
  posture: "#14B8A6",
  strength: "#F97316",
};

const categoryLabels: Record<string, string> = {
  core: "코어",
  flexibility: "유연성",
  upper_body: "상체",
  lower_body: "하체",
  balance: "밸런스",
  stretching: "스트레칭",
  breathing: "호흡",
  posture: "자세",
  strength: "근력",
};

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
  }
  return `${seconds}초`;
}

export function ExerciseItem({ exercise }: ExerciseItemProps) {
  const [expanded, setExpanded] = useState(false);
  const barColor = categoryColors[exercise.category] || "#9CA3AF";
  const categoryLabel = categoryLabels[exercise.category] || exercise.category;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((prev) => !prev)}
      activeOpacity={0.7}
      className="mb-3"
    >
      <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-row">
        {/* Category color bar */}
        <View style={{ width: 4, backgroundColor: barColor }} />

        <View className="flex-1 p-4">
          {/* Top row: order badge + name */}
          <View className="flex-row items-center mb-2">
            <View
              style={{ backgroundColor: barColor }}
              className="w-7 h-7 rounded-full items-center justify-center mr-3"
            >
              <Text className="text-xs font-bold text-white">
                {exercise.order}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {exercise.nameKo}
              </Text>
              <Text className="text-xs text-gray-400">{exercise.name}</Text>
            </View>
          </View>

          {/* Badges row: category + equipment */}
          <View className="flex-row flex-wrap gap-2 mb-2">
            <View
              style={{ backgroundColor: `${barColor}15` }}
              className="rounded-full px-3 py-1"
            >
              <Text style={{ color: barColor }} className="text-xs font-medium">
                {categoryLabel}
              </Text>
            </View>
            {exercise.equipment && exercise.equipment !== "none" && (
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs font-medium text-gray-600">
                  {exercise.equipment}
                </Text>
              </View>
            )}
          </View>

          {/* Sets / reps / duration */}
          <View className="flex-row items-center gap-3">
            <Text className="text-sm text-gray-700">
              {exercise.sets}세트
              {exercise.reps ? ` x ${exercise.reps}회` : ""}
            </Text>
            <Text className="text-sm text-gray-400">|</Text>
            <Text className="text-sm text-gray-700">
              {formatDuration(exercise.durationSeconds)}
            </Text>
          </View>

          {/* Expandable reason */}
          {expanded && exercise.reason && (
            <View className="mt-3 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs text-gray-500 mb-1">추천 이유</Text>
              <Text className="text-sm text-gray-700 leading-5">
                {exercise.reason}
              </Text>
            </View>
          )}

          {/* Expand hint */}
          {!expanded && exercise.reason && (
            <Text className="text-xs text-gray-400 mt-2">
              탭하여 추천 이유 보기
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
