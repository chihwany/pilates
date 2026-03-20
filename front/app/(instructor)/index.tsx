import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/authStore";
import Card from "@/components/ui/Card";

export default function InstructorDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name || "강사"}님
        </Text>
        <Text className="text-sm text-gray-500 mt-1">오늘도 좋은 하루 되세요</Text>

        <View className="mt-6 gap-4">
          <Card>
            <Text className="text-base font-semibold text-gray-900 mb-1">
              오늘의 수업
            </Text>
            <Text className="text-sm text-gray-500">
              예정된 수업이 없습니다.
            </Text>
          </Card>

          <Card>
            <Text className="text-base font-semibold text-gray-900 mb-1">
              회원 현황
            </Text>
            <View className="flex-row justify-between mt-2">
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#6366F1]">4</Text>
                <Text className="text-xs text-gray-500">전체 회원</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#10B981]">4</Text>
                <Text className="text-xs text-gray-500">활성 회원</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-[#F59E0B]">0</Text>
                <Text className="text-xs text-gray-500">오늘 세션</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </SafeAreaView>
  );
}
