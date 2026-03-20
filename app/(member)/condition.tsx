import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConditionScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-900">컨디션</Text>
        <Text className="text-base text-gray-500 mt-2">
          컨디션 입력 기능이 곧 추가됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}
