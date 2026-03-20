import { useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/lib/stores/authStore";
import { getTodayDashboard } from "@/lib/api/sessions";
import { SessionStatusCard } from "@/components/dashboard/SessionStatusCard";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { DashboardData, DashboardSession } from "@/shared/types";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

export default function InstructorDashboard() {
  const user = useAuthStore((s) => s.user);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getTodayDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboard();
    }, [fetchDashboard])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const sessions = dashboard?.sessions
    ? [...dashboard.sessions].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      )
    : [];

  const renderHeader = () => (
    <View className="px-6 pt-6 pb-4">
      {/* Greeting */}
      <Text className="text-2xl font-bold text-gray-900">
        안녕하세요, {user?.name || "강사"}님
      </Text>
      <Text className="text-sm text-gray-500 mt-1">
        {dashboard?.date ? formatDateHeader(dashboard.date) : "오늘"}
      </Text>

      {/* Summary cards */}
      <View className="flex-row gap-3 mt-5">
        <Card className="flex-1 items-center py-4">
          <Text className="text-2xl font-bold text-[#6366F1]">
            {dashboard?.totalMembers ?? 0}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">전체 회원</Text>
        </Card>
        <Card className="flex-1 items-center py-4">
          <Text className="text-2xl font-bold text-[#F59E0B]">
            {dashboard?.conditionChecked ?? 0}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">컨디션 체크</Text>
        </Card>
        <Card className="flex-1 items-center py-4">
          <Text className="text-2xl font-bold text-[#10B981]">
            {dashboard?.sequenceGenerated ?? 0}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">시퀀스 생성</Text>
        </Card>
      </View>

      {/* Section title */}
      <Text className="text-lg font-bold text-gray-900 mt-6 mb-2">
        오늘의 세션
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: DashboardSession }) => (
    <View className="px-6">
      <SessionStatusCard session={item} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={sessions}
        keyExtractor={(item) => `${item.memberId}-${item.startTime}`}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="px-6">
            <Card>
              <Text className="text-sm text-gray-500 text-center py-4">
                오늘 예정된 세션이 없습니다.
              </Text>
            </Card>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={["#6366F1"]}
          />
        }
      />
    </SafeAreaView>
  );
}
