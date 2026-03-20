import { useState, useEffect, useCallback } from "react";
import { View, Text, Platform, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WeeklyScheduleView } from "@/components/schedule/WeeklyScheduleView";
import type { WeeklySchedule, DayOfWeek } from "@/shared/types";
import { getSchedules } from "@/lib/api/schedules";

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
};

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const res = await getSchedules();
    if (res.success && res.data) {
      setSchedules(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleAddSchedule = (day: DayOfWeek) => {
    showAlert("스케줄 추가", "스케줄 추가 기능은 곧 제공됩니다.");
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
      {loading ? (
        <ActivityIndicator size="large" className="mt-10" color="#6366F1" />
      ) : (
        <WeeklyScheduleView
          schedules={schedules}
          onAddPress={handleAddSchedule}
        />
      )}
    </SafeAreaView>
  );
}
