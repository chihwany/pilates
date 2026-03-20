import { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Member } from "@/shared/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import BodyConditionTag from "@/components/member/BodyConditionTag";
import Button from "@/components/ui/Button";
import { getMember } from "@/lib/api/members";

const levelLabels: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const levelVariants: Record<string, "success" | "warning" | "primary"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "primary",
};

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await getMember(id);
      if (res.success && res.data) {
        setMember(res.data);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">회원 정보를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="px-6 py-6">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Button title="뒤로" onPress={() => router.back()} variant="outline" />
          <Text className="text-xl font-bold text-gray-900 ml-4">
            회원 상세
          </Text>
        </View>

        {/* 프로필 카드 */}
        <Card className="mb-4">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-[#6366F1]/10 items-center justify-center mb-2">
              <Text className="text-2xl text-[#6366F1]">
                {member.name.charAt(0)}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {member.name}
            </Text>
            <View className="mt-2">
              <Badge
                label={levelLabels[member.fitnessLevel]}
                variant={levelVariants[member.fitnessLevel]}
              />
            </View>
          </View>

          {member.phone && (
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-500">전화번호</Text>
              <Text className="text-sm text-gray-900">{member.phone}</Text>
            </View>
          )}
          {member.dateOfBirth && (
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-500">생년월일</Text>
              <Text className="text-sm text-gray-900">{member.dateOfBirth}</Text>
            </View>
          )}
          {member.notes && (
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-500">메모</Text>
              <Text className="text-sm text-gray-900">{member.notes}</Text>
            </View>
          )}
        </Card>

        {/* 신체 상태 */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            신체 상태
          </Text>
          {member.bodyConditions.length > 0 ? (
            <View className="gap-2">
              {member.bodyConditions.map((condition, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <BodyConditionTag condition={condition} />
                  {condition.notes && (
                    <Text className="text-xs text-gray-500">
                      {condition.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-gray-400">
              등록된 신체 상태 정보가 없습니다.
            </Text>
          )}
        </Card>

        {/* 운동 선호 */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            운동 선호
          </Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">선호 기구</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {member.exercisePreferences.preferredEquipment.map((eq) => (
                <Badge key={eq} label={eq} variant="primary" />
              ))}
            </View>
          </View>

          {member.exercisePreferences.avoidExercises.length > 0 && (
            <View className="mb-3">
              <Text className="text-xs text-gray-500 mb-1">피해야 할 운동</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {member.exercisePreferences.avoidExercises.map((ex) => (
                  <Badge key={ex} label={ex} variant="error" />
                ))}
              </View>
            </View>
          )}

          <View className="mb-3">
            <Text className="text-xs text-gray-500 mb-1">목표</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {member.exercisePreferences.goals.map((goal) => (
                <Badge key={goal} label={goal} variant="success" />
              ))}
            </View>
          </View>

          <View className="flex-row justify-between py-2 border-t border-gray-100">
            <Text className="text-sm text-gray-500">세션 시간</Text>
            <Text className="text-sm text-gray-900">
              {member.exercisePreferences.sessionDurationMinutes}분
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
