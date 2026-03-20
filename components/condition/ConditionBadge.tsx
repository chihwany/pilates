import { View, Text } from "react-native";
import type { Mood } from "@/shared/types";

interface ConditionBadgeProps {
  type: "energy" | "mood" | "stress";
  value: number | Mood;
}

const MOOD_CONFIG: Record<Mood, { label: string; color: string; bg: string }> =
  {
    HAPPY: { label: "행복", color: "#10B981", bg: "bg-[#10B981]/10" },
    CALM: { label: "평온", color: "#6366F1", bg: "bg-[#6366F1]/10" },
    SAD: { label: "우울", color: "#6B7280", bg: "bg-gray-100" },
    STRESSED: { label: "스트레스", color: "#EF4444", bg: "bg-[#EF4444]/10" },
    TIRED: { label: "피곤", color: "#F59E0B", bg: "bg-[#F59E0B]/10" },
  };

function getEnergyConfig(val: number) {
  if (val >= 7) return { label: `에너지 ${val}`, color: "#10B981", bg: "bg-[#10B981]/10" };
  if (val >= 4) return { label: `에너지 ${val}`, color: "#F59E0B", bg: "bg-[#F59E0B]/10" };
  return { label: `에너지 ${val}`, color: "#EF4444", bg: "bg-[#EF4444]/10" };
}

function getStressConfig(val: number) {
  if (val <= 3) return { label: `스트레스 ${val}`, color: "#10B981", bg: "bg-[#10B981]/10" };
  if (val <= 6) return { label: `스트레스 ${val}`, color: "#F59E0B", bg: "bg-[#F59E0B]/10" };
  return { label: `스트레스 ${val}`, color: "#EF4444", bg: "bg-[#EF4444]/10" };
}

export function ConditionBadge({ type, value }: ConditionBadgeProps) {
  let config: { label: string; color: string; bg: string };

  if (type === "mood") {
    config = MOOD_CONFIG[value as Mood] || MOOD_CONFIG.CALM;
  } else if (type === "energy") {
    config = getEnergyConfig(value as number);
  } else {
    config = getStressConfig(value as number);
  }

  return (
    <View className={`rounded-full px-3 py-1.5 ${config.bg}`}>
      <Text className="text-xs font-semibold" style={{ color: config.color }}>
        {config.label}
      </Text>
    </View>
  );
}
