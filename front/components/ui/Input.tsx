import { View, Text, TextInput, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 ${
          error ? "border-[#EF4444]" : "border-gray-200"
        }`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && (
        <Text className="text-sm text-[#EF4444] mt-1">{error}</Text>
      )}
    </View>
  );
}
