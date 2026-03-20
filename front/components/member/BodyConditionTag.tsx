import { View, Text } from "react-native";
import type { BodyCondition } from "@/shared/types";

interface BodyConditionTagProps {
  condition: BodyCondition;
}

const severityClasses: Record<BodyCondition["severity"], string> = {
  mild: "bg-[#F59E0B]/10",
  moderate: "bg-[#EF4444]/15",
  severe: "bg-[#EF4444]/25",
};

const severityTextClasses: Record<BodyCondition["severity"], string> = {
  mild: "text-[#F59E0B]",
  moderate: "text-[#EF4444]",
  severe: "text-[#EF4444]",
};

export default function BodyConditionTag({ condition }: BodyConditionTagProps) {
  return (
    <View
      className={`rounded-full px-3 py-1 self-start ${severityClasses[condition.severity]}`}
    >
      <Text
        className={`text-xs font-medium ${severityTextClasses[condition.severity]}`}
      >
        {condition.area} - {condition.type}
      </Text>
    </View>
  );
}
