import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Member } from "@/shared/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import BodyConditionTag from "@/components/member/BodyConditionTag";
import Button from "@/components/ui/Button";

const MOCK_MEMBERS: Record<string, Member> = {
  m1: {
    id: "m1",
    userId: "u1",
    name: "김민지",
    phone: "010-1234-5678",
    dateOfBirth: "1990-03-15",
    bodyConditions: [
      { type: "통증", area: "허리", severity: "moderate", notes: "만성 요통" },
      { type: "제한", area: "어깨", severity: "mild" },
    ],
    exercisePreferences: {
      preferredEquipment: ["리포머", "캐딜락"],
      avoidExercises: ["롤업"],
      goals: ["자세 교정", "코어 강화"],
      sessionDurationMinutes: 50,
    },
    fitnessLevel: "intermediate",
    notes: "주 2회 수업",
    isActive: true,
    createdAt: "2025-01-10",
    updatedAt: "2025-03-01",
  },
  m2: {
    id: "m2",
    userId: "u2",
    name: "박서준",
    bodyConditions: [
      { type: "통증", area: "무릎", severity: "severe", notes: "전방십자인대 수술 후" },
    ],
    exercisePreferences: {
      preferredEquipment: ["매트", "체어"],
      avoidExercises: ["점프보드", "런지"],
      goals: ["재활", "근력 회복"],
      sessionDurationMinutes: 40,
    },
    fitnessLevel: "beginner",
    notes: "재활 중, 주의 필요",
    isActive: true,
    createdAt: "2025-02-01",
    updatedAt: "2025-03-10",
  },
  m3: {
    id: "m3",
    userId: "u3",
    name: "이수진",
    phone: "010-9876-5432",
    bodyConditions: [],
    exercisePreferences: {
      preferredEquipment: ["리포머", "바렐"],
      avoidExercises: [],
      goals: ["유연성 향상", "체력 증진"],
      sessionDurationMinutes: 60,
    },
    fitnessLevel: "advanced",
    isActive: true,
    createdAt: "2024-06-01",
    updatedAt: "2025-03-15",
  },
  m4: {
    id: "m4",
    userId: "u4",
    name: "최예은",
    dateOfBirth: "1995-08-22",
    bodyConditions: [
      { type: "불편감", area: "목", severity: "mild", notes: "거북목" },
    ],
    exercisePreferences: {
      preferredEquipment: ["매트"],
      avoidExercises: [],
      goals: ["자세 교정"],
      sessionDurationMinutes: 50,
    },
    fitnessLevel: "beginner",
    isActive: true,
    createdAt: "2025-03-01",
    updatedAt: "2025-03-18",
  },
};

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
  const member = MOCK_MEMBERS[id ?? ""];

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
