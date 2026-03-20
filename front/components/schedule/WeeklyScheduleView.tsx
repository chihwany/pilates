import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import type { WeeklySchedule, DayOfWeek, FitnessLevel } from "@/shared/types";
import { ScheduleItem } from "./ScheduleItem";

type ScheduleWithLevel = WeeklySchedule & { memberLevel?: FitnessLevel };

interface WeeklyScheduleViewProps {
  schedules: ScheduleWithLevel[];
  onAddPress: (day: DayOfWeek) => void;
}

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "월", value: 1 },
  { label: "화", value: 2 },
  { label: "수", value: 3 },
  { label: "목", value: 4 },
  { label: "금", value: 5 },
];

export function WeeklyScheduleView({
  schedules,
  onAddPress,
}: WeeklyScheduleViewProps) {
  const today = new Date().getDay() as DayOfWeek;
  const initialDay = today >= 1 && today <= 5 ? today : (1 as DayOfWeek);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay);

  const filtered = schedules
    .filter((s) => s.dayOfWeek === selectedDay && s.isActive)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <View className="flex-1">
      {/* Day tabs */}
      <View className="flex-row justify-between px-4 py-3 bg-white border-b border-gray-100">
        {DAYS.map((day) => {
          const isSelected = day.value === selectedDay;
          const count = schedules.filter(
            (s) => s.dayOfWeek === day.value && s.isActive
          ).length;
          return (
            <TouchableOpacity
              key={day.value}
              onPress={() => setSelectedDay(day.value)}
              className={`flex-1 mx-1 py-2.5 rounded-xl items-center ${
                isSelected ? "bg-[#6366F1]" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  isSelected ? "text-white" : "text-gray-600"
                }`}
              >
                {day.label}
              </Text>
              {count > 0 && (
                <Text
                  className={`text-xs mt-0.5 ${
                    isSelected ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {count}건
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Schedule list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <ScheduleItem schedule={item} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">{"📭"}</Text>
            <Text className="text-base text-gray-400">
              이 요일에 등록된 스케줄이 없습니다
            </Text>
          </View>
        }
      />

      {/* Add button */}
      <TouchableOpacity
        onPress={() => onAddPress(selectedDay)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#6366F1] items-center justify-center"
        style={{
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text className="text-2xl text-white font-bold">+</Text>
      </TouchableOpacity>
    </View>
  );
}
