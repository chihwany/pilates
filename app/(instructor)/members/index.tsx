import { useState } from "react";
import { View, Text, TextInput, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { Member } from "@/shared/types";
import MemberCard from "@/components/member/MemberCard";

const MOCK_MEMBERS: Member[] = [
  {
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
  {
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
  {
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
  {
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
];

export default function MemberListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = MOCK_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          회원 관리
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-2"
          placeholder="회원 이름 검색..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 pb-6"
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onPress={() =>
              router.push(`/(instructor)/members/${item.id}`)
            }
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-gray-400">검색 결과가 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
