import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/authStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">내 프로필</Text>

        <Card className="mb-4">
          <View className="items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-[#6366F1]/10 items-center justify-center mb-3">
              <Text className="text-3xl text-[#6366F1]">
                {user?.name?.charAt(0) || "?"}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {user?.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">{user?.email}</Text>
            <Badge label="회원" variant="primary" />
          </View>
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            내 정보
          </Text>
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-sm text-gray-500">이름</Text>
            <Text className="text-sm text-gray-900">{user?.name}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-sm text-gray-500">이메일</Text>
            <Text className="text-sm text-gray-900">{user?.email}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-gray-500">역할</Text>
            <Text className="text-sm text-gray-900">회원</Text>
          </View>
        </Card>

        <TouchableOpacity className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 items-center">
          <Text className="text-[#6366F1] font-semibold">프로필 편집</Text>
        </TouchableOpacity>

        <Button title="로그아웃" onPress={handleLogout} variant="danger" />
      </View>
    </SafeAreaView>
  );
}
