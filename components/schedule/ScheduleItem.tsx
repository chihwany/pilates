import { View, Text } from "react-native";
import type { WeeklySchedule, FitnessLevel } from "@/shared/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ScheduleItemProps {
  schedule: WeeklySchedule & { memberLevel?: FitnessLevel };
}

const TIME_COLORS: Record<string, string> = {
  morning: "#10B981",
  afternoon: "#F59E0B",
  evening: "#6366F1",
};

function getTimeSlot(time: string): string {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const LEVEL_LABELS: Record<FitnessLevel, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const LEVEL_VARIANT: Record<FitnessLevel, "success" | "warning" | "error"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "error",
};

export function ScheduleItem({ schedule }: ScheduleItemProps) {
  const slot = getTimeSlot(schedule.startTime);
  const barColor = TIME_COLORS[slot];
  const level = schedule.memberLevel || "beginner";

  return (
    <Card className="mb-3">
      <View className="flex-row">
        {/* Time color bar */}
        <View
          className="w-1 rounded-full mr-3"
          style={{ backgroundColor: barColor }}
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">
              {schedule.startTime}
            </Text>
            <Badge
              label={LEVEL_LABELS[level]}
              variant={LEVEL_VARIANT[level]}
            />
          </View>
          <Text className="text-base text-gray-600 mt-1">
            {schedule.memberName || "회원"}
          </Text>
        </View>
      </View>
    </Card>
  );
}
