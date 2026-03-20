import { View, Text, TouchableOpacity } from "react-native";
import type { Member } from "@/shared/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import BodyConditionTag from "./BodyConditionTag";

interface MemberCardProps {
  member: Member;
  onPress: () => void;
}

const levelLabels: Record<Member["fitnessLevel"], string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const levelVariants: Record<
  Member["fitnessLevel"],
  "success" | "warning" | "primary"
> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "primary",
};

export default function MemberCard({ member, onPress }: MemberCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-gray-900">
            {member.name}
          </Text>
          <Badge
            label={levelLabels[member.fitnessLevel]}
            variant={levelVariants[member.fitnessLevel]}
          />
        </View>
        {member.bodyConditions.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {member.bodyConditions.map((condition, index) => (
              <BodyConditionTag key={index} condition={condition} />
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
