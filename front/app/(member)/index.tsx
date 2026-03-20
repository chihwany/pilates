import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/authStore";
import Card from "@/components/ui/Card";

export default function MemberHome() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name || "회원"}님
        </Text>
        <Text className="text-sm text-gray-500 mt-1">오늘의 운동을 확인하세요</Text>

        <View className="mt-6 gap-4">
          <Card>
            <Text className="text-base font-semibold text-gray-900 mb-1">
              오늘의 운동
            </Text>
            <Text className="text-sm text-gray-500">
              예정된 운동이 없습니다. 컨디션을 먼저 입력해주세요.
            </Text>
          </Card>

          <Card>
            <Text className="text-base font-semibold text-gray-900 mb-1">
              이번 주 요약
            </Text>
            <View className="flex-row justify-between mt-2">
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#6366F1]">0</Text>
                <Text className="text-xs text-gray-500">완료 세션</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#10B981]">0</Text>
                <Text className="text-xs text-gray-500">예정 세션</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </SafeAreaView>
  );
}
