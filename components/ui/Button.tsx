import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

type ButtonVariant = "primary" | "outline" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#6366F1]",
  outline: "bg-transparent border-2 border-[#6366F1]",
  danger: "bg-[#EF4444]",
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  outline: "text-[#6366F1]",
  danger: "text-white",
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl py-4 px-6 items-center justify-center ${variantClasses[variant]} ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#6366F1" : "#FFFFFF"}
        />
      ) : (
        <Text
          className={`text-base font-semibold ${variantTextClasses[variant]}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
