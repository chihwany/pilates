import { View, Text, TouchableOpacity, TextInput } from "react-native";
import type { Mood, SleepQuality } from "@/shared/types";
import { Slider } from "@/components/ui/Slider";

interface ConditionEditorProps {
  energy: number;
  onEnergyChange: (v: number) => void;
  mood: Mood;
  onMoodChange: (v: Mood) => void;
  stress: number;
  onStressChange: (v: number) => void;
  sleep: SleepQuality;
  onSleepChange: (v: SleepQuality) => void;
  note: string;
  onNoteChange: (v: string) => void;
}

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "HAPPY", emoji: "😊", label: "행복" },
  { value: "CALM", emoji: "😌", label: "평온" },
  { value: "SAD", emoji: "😢", label: "우울" },
  { value: "STRESSED", emoji: "😰", label: "스트레스" },
  { value: "TIRED", emoji: "😴", label: "피곤" },
];

const SLEEP_OPTIONS: { value: SleepQuality; label: string }[] = [
  { value: "GOOD", label: "좋음" },
  { value: "FAIR", label: "보통" },
  { value: "POOR", label: "부족" },
];

export function ConditionEditor({
  energy,
  onEnergyChange,
  mood,
  onMoodChange,
  stress,
  onStressChange,
  sleep,
  onSleepChange,
  note,
  onNoteChange,
}: ConditionEditorProps) {
  return (
    <View>
      {/* Energy slider */}
      <Slider
        label="에너지 레벨"
        min={1}
        max={10}
        value={energy}
        onValueChange={onEnergyChange}
        minLabel="나쁨"
        maxLabel="좋음"
        invertColor
      />

      {/* Mood selection */}
      <Text className="text-sm font-medium text-gray-700 mb-2">무드</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {MOODS.map((m) => {
          const isSelected = mood === m.value;
          return (
            <TouchableOpacity
              key={m.value}
              onPress={() => onMoodChange(m.value)}
              className={`flex-row items-center px-3 py-2 rounded-xl border ${
                isSelected
                  ? "bg-[#6366F1] border-[#6366F1]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text className="text-base mr-1">{m.emoji}</Text>
              <Text
                className={`text-sm font-medium ${
                  isSelected ? "text-white" : "text-gray-600"
                }`}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stress slider */}
      <Slider
        label="스트레스 레벨"
        min={1}
        max={10}
        value={stress}
        onValueChange={onStressChange}
        minLabel="적음"
        maxLabel="많음"
      />

      {/* Sleep selection */}
      <Text className="text-sm font-medium text-gray-700 mb-2">수면 상태</Text>
      <View className="flex-row gap-2 mb-4">
        {SLEEP_OPTIONS.map((s) => {
          const isSelected = sleep === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              onPress={() => onSleepChange(s.value)}
              className={`flex-1 py-2.5 rounded-xl items-center border ${
                isSelected
                  ? "bg-[#6366F1] border-[#6366F1]"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? "text-white" : "text-gray-600"
                }`}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Note input */}
      <Text className="text-sm font-medium text-gray-700 mb-2">추가 메모</Text>
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-4"
        placeholder="오늘 특이사항을 입력하세요..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        value={note}
        onChangeText={onNoteChange}
        style={{ minHeight: 80 }}
      />
    </View>
  );
}
