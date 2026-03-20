import { View, Text } from "react-native";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { ExerciseSequence } from "@/shared/types";

interface SequenceCardProps {
  sequence: ExerciseSequence;
}

const difficultyLabel: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const difficultyVariant: Record<string, "success" | "warning" | "error"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "error",
};

export function SequenceCard({ sequence }: SequenceCardProps) {
  return (
    <Card className="mb-4">
      {/* Top row: duration + difficulty */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-3xl font-bold text-[#6366F1]">
            {sequence.totalDurationMinutes}
          </Text>
          <Text className="text-sm text-gray-500 ml-1 mt-1">분</Text>
        </View>
        <Badge
          label={difficultyLabel[sequence.difficulty] || sequence.difficulty}
          variant={difficultyVariant[sequence.difficulty] || "default"}
        />
      </View>

      {/* Exercise count */}
      <Text className="text-sm text-gray-600 mb-3">
        {sequence.exercises.length}개 운동
      </Text>

      {/* Focus areas */}
      {sequence.focusAreas.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {sequence.focusAreas.map((area) => (
            <Badge key={area} label={area} variant="primary" />
          ))}
        </View>
      )}

      {/* Sequence note */}
      {sequence.sequenceNote && (
        <View className="bg-[#6366F1]/5 rounded-xl p-3">
          <Text className="text-xs text-gray-500 mb-1">AI 추천 노트</Text>
          <Text className="text-sm text-gray-700 leading-5">
            {sequence.sequenceNote}
          </Text>
        </View>
      )}
    </Card>
  );
}
