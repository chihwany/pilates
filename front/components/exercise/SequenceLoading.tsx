import { View, Text, ActivityIndicator } from "react-native";

export function SequenceLoading() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <ActivityIndicator size="large" color="#6366F1" />
      <Text className="text-lg font-semibold text-gray-900 mt-6 mb-2">
        AI가 맞춤 시퀀스를 생성 중입니다...
      </Text>
      <Text className="text-sm text-gray-400 text-center">
        약 5-10초 정도 소요됩니다
      </Text>
    </View>
  );
}
