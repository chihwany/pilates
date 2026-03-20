import { View, Text } from "react-native";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100",
  primary: "bg-[#6366F1]/10",
  success: "bg-[#10B981]/10",
  warning: "bg-[#F59E0B]/10",
  error: "bg-[#EF4444]/10",
};

const variantTextClasses: Record<BadgeVariant, string> = {
  default: "text-gray-700",
  primary: "text-[#6366F1]",
  success: "text-[#10B981]",
  warning: "text-[#F59E0B]",
  error: "text-[#EF4444]",
};

export default function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <View className={`rounded-full px-3 py-1 self-start ${variantClasses[variant]}`}>
      <Text className={`text-xs font-medium ${variantTextClasses[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
