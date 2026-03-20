import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WeeklyScheduleView } from "@/components/schedule/WeeklyScheduleView";
import type { WeeklySchedule, DayOfWeek, FitnessLevel } from "@/shared/types";

// ===== Mock Data =====

const MOCK_SCHEDULES: (WeeklySchedule & { memberLevel?: FitnessLevel })[] = [
  {
    id: "s1",
    instructorId: "inst-1",
    memberId: "m1",
    memberName: "김민지",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "09:50",
    isActive: true,
    memberLevel: "intermediate",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "s2",
    instructorId: "inst-1",
    memberId: "m2",
    memberName: "이서연",
    dayOfWeek: 1,
    startTime: "10:00",
    endTime: "10:50",
    isActive: true,
    memberLevel: "beginner",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "s3",
    instructorId: "inst-1",
    memberId: "m3",
    memberName: "박지훈",
    dayOfWeek: 2,
    startTime: "11:00",
    endTime: "11:50",
    isActive: true,
    memberLevel: "advanced",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "s4",
    instructorId: "inst-1",
    memberId: "m4",
    memberName: "최유진",
    dayOfWeek: 3,
    startTime: "14:00",
    endTime: "14:50",
    isActive: true,
    memberLevel: "intermediate",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "s5",
    instructorId: "inst-1",
    memberId: "m5",
    memberName: "정하은",
    dayOfWeek: 3,
    startTime: "15:00",
    endTime: "15:50",
    isActive: true,
    memberLevel: "beginner",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
  {
    id: "s6",
    instructorId: "inst-1",
    memberId: "m1",
    memberName: "김민지",
    dayOfWeek: 5,
    startTime: "09:00",
    endTime: "09:50",
    isActive: true,
    memberLevel: "intermediate",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-01",
  },
];

const DAY_NAMES: Record<number, string> = {
  1: "월요일",
  2: "화요일",
  3: "수요일",
  4: "목요일",
  5: "금요일",
};

export default function ScheduleScreen() {
  const [schedules] = useState(MOCK_SCHEDULES);

  const handleAddSchedule = (day: DayOfWeek) => {
    Alert.alert(
      "스케줄 추가",
      `${DAY_NAMES[day] || ""}에 새 스케줄을 추가하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "추가",
          onPress: () => {
            Alert.alert("알림", "BE API 연동 후 사용 가능합니다.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-2 pb-3">
        <Text className="text-2xl font-bold text-gray-900">주간 스케줄</Text>
        <Text className="text-sm text-gray-500 mt-1">
          요일별 회원 스케줄을 관리하세요
        </Text>
      </View>

      {/* Weekly schedule view */}
      <WeeklyScheduleView
        schedules={schedules}
        onAddPress={handleAddSchedule}
      />
    </SafeAreaView>
  );
}
