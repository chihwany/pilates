import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/authStore";
import { useRouter } from "expo-router";
import Button from "@/components/ui/Button";

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">설정</Text>

        <View className="bg-white rounded-2xl p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900">
            {user?.name}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">{user?.email}</Text>
          <Text className="text-sm text-[#6366F1] mt-1">강사</Text>
        </View>

        <Button title="로그아웃" onPress={handleLogout} variant="danger" />
      </View>
    </SafeAreaView>
  );
}
