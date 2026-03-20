import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { DashboardSession } from "@/shared/types";

interface SessionStatusCardProps {
  session: DashboardSession;
}

function getStatusBadge(session: DashboardSession): {
  label: string;
  variant: "default" | "warning" | "success" | "primary";
} {
  if (session.wasModified) {
    return { label: "수정됨", variant: "primary" };
  }
  if (session.sequenceGenerated) {
    return { label: "시퀀스 완료", variant: "success" };
  }
  if (session.conditionChecked) {
    return { label: "컨디션 완료", variant: "warning" };
  }
  return { label: "대기중", variant: "default" };
}

function formatTime(time: string): string {
  // "HH:MM:SS" or "HH:MM" → "HH:MM"
  return time.slice(0, 5);
}

export function SessionStatusCard({ session }: SessionStatusCardProps) {
  const router = useRouter();
  const status = getStatusBadge(session);

  const handlePress = () => {
    if (session.sequenceId) {
      router.push({
        pathname: "/(instructor)/session",
        params: {
          sequenceId: session.sequenceId,
          sessionId: session.sessionId || "",
          memberName: session.memberName,
          conditionSummary: session.conditionSummary || "",
        },
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={session.sequenceId ? 0.7 : 1}
      disabled={!session.sequenceId}
    >
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="bg-[#6366F1]/10 rounded-lg px-3 py-1.5 mr-3">
              <Text className="text-sm font-bold text-[#6366F1]">
                {formatTime(session.startTime)}
              </Text>
            </View>
            <Text className="text-base font-semibold text-gray-900">
              {session.memberName}
            </Text>
          </View>
          <Badge label={status.label} variant={status.variant} />
        </View>

        {session.conditionSummary && (
          <View className="bg-gray-50 rounded-xl px-3 py-2 mb-2">
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {session.conditionSummary}
            </Text>
          </View>
        )}

        {session.sequenceGenerated && (
          <View className="flex-row items-center gap-3">
            {session.exerciseCount != null && (
              <Text className="text-xs text-gray-400">
                {session.exerciseCount}개 운동
              </Text>
            )}
            {session.totalDurationMinutes != null && (
              <Text className="text-xs text-gray-400">
                {session.totalDurationMinutes}분
              </Text>
            )}
            {session.difficulty && (
              <Text className="text-xs text-gray-400">
                {session.difficulty === "beginner"
                  ? "초급"
                  : session.difficulty === "intermediate"
                  ? "중급"
                  : session.difficulty === "advanced"
                  ? "고급"
                  : session.difficulty}
              </Text>
            )}
          </View>
        )}

        {!session.sequenceId && session.conditionChecked && (
          <Text className="text-xs text-gray-400 mt-1">
            시퀀스 생성 대기 중...
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}
