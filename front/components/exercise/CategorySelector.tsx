import { View, Text, TouchableOpacity } from "react-native";
import type { ExerciseCategory } from "@/shared/types";

interface CategorySelectorProps {
  selected: ExerciseCategory[];
  onToggle: (category: ExerciseCategory) => void;
  maxSelection?: number;
}

const CATEGORIES: { value: ExerciseCategory; emoji: string; label: string }[] =
  [
    { value: "CORE", emoji: "🎯", label: "코어집중" },
    { value: "FLEXIBILITY", emoji: "🧘", label: "유연성" },
    { value: "UPPER_BODY", emoji: "💪", label: "상체강화" },
    { value: "LOWER_BODY", emoji: "🦵", label: "하체강화" },
    { value: "BALANCE", emoji: "⚖️", label: "밸런스" },
    { value: "STRETCHING", emoji: "🤸", label: "스트레칭" },
    { value: "BREATHING", emoji: "🌬️", label: "호흡/릴랙스" },
    { value: "POSTURE", emoji: "🧍", label: "자세교정" },
    { value: "STRENGTH", emoji: "🏋️", label: "근력강화" },
    { value: "REHABILITATION", emoji: "🩹", label: "재활" },
    { value: "PRENATAL", emoji: "🤰", label: "산전" },
    { value: "POSTNATAL", emoji: "👶", label: "산후" },
    { value: "CARDIO_ENDURANCE", emoji: "❤️‍🔥", label: "심폐/지구력" },
    { value: "COORDINATION", emoji: "🤹", label: "협응력" },
    { value: "RELAXATION_RECOVERY", emoji: "🧖", label: "이완/회복" },
    { value: "SPINE_MOBILITY", emoji: "🦴", label: "척추가동성" },
    { value: "HIP_PELVIS", emoji: "🦿", label: "골반/고관절" },
    { value: "FOOT_ANKLE", emoji: "🦶", label: "발/발목" },
    { value: "FUNCTIONAL", emoji: "🔄", label: "기능적움직임" },
    { value: "FULL_BODY", emoji: "🏃", label: "전신통합" },
    { value: "LATERAL_MOVEMENT", emoji: "↔️", label: "측면움직임" },
    { value: "PELVIC_FLOOR", emoji: "🫁", label: "골반저근" },
  ];

export function CategorySelector({
  selected,
  onToggle,
  maxSelection = 2,
}: CategorySelectorProps) {
  const handleToggle = (cat: ExerciseCategory) => {
    if (selected.includes(cat)) {
      onToggle(cat);
    } else if (selected.length < maxSelection) {
      onToggle(cat);
    }
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium text-gray-700">
          운동 카테고리
        </Text>
        <Text className="text-xs text-gray-400">
          {selected.length}/{maxSelection} 선택
        </Text>
      </View>
      <View className="flex-row flex-wrap">
        {CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.value);
          const isDisabled = !isSelected && selected.length >= maxSelection;
          return (
            <TouchableOpacity
              key={cat.value}
              onPress={() => handleToggle(cat.value)}
              disabled={isDisabled}
              className={`w-[48%] mr-[2%] mb-2 py-3 px-3 rounded-xl border flex-row items-center ${
                isSelected
                  ? "bg-[#6366F1] border-[#6366F1]"
                  : isDisabled
                  ? "bg-gray-50 border-gray-100 opacity-50"
                  : "bg-white border-gray-200"
              }`}
            >
              <Text className="text-lg mr-2">{cat.emoji}</Text>
              <Text
                className={`text-sm font-medium ${
                  isSelected ? "text-white" : "text-gray-700"
                }`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
