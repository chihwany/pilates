import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  ConditionAnalysisDetailed,
  Mood,
  SleepQuality,
  ExerciseCategory,
} from "@/shared/types";
import { ConditionResult } from "@/components/condition/ConditionResult";
import { ConditionEditor } from "@/components/condition/ConditionEditor";
import { CategorySelector } from "@/components/exercise/CategorySelector";
import Button from "@/components/ui/Button";

// ===== Mock AI Analysis =====

const MOCK_ANALYSIS: ConditionAnalysisDetailed = {
  energy: { level: 6, confidence: 0.82 },
  mood: { value: "CALM", confidence: 0.75 },
  stress: { level: 4, confidence: 0.7 },
  sleep: { quality: "FAIR", confidence: 0.68 },
  facialTension: {
    forehead: { level: 2, confidence: 0.6 },
    jaw: { level: 5, confidence: 0.72 },
    asymmetry: { value: "MILD_LEFT", confidence: 0.55 },
  },
  swelling: { level: "MILD", confidence: 0.63 },
  summary:
    "전반적으로 안정적인 컨디션입니다. 약간의 턱 긴장이 감지되며, 수면 상태는 보통 수준입니다. 중간 강도의 운동이 적합해 보입니다.",
  exerciseNote:
    "턱 긴장 완화를 위한 목/어깨 스트레칭을 시퀀스에 포함하는 것을 권장합니다.",
};

type ScreenState = "camera" | "edit";

export default function ConditionScreen() {
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [analysis] = useState<ConditionAnalysisDetailed>(MOCK_ANALYSIS);

  // Editable fields initialized from AI analysis
  const [energy, setEnergy] = useState(MOCK_ANALYSIS.energy.level);
  const [mood, setMood] = useState<Mood>(MOCK_ANALYSIS.mood.value);
  const [stress, setStress] = useState(MOCK_ANALYSIS.stress.level);
  const [sleep, setSleep] = useState<SleepQuality>(
    MOCK_ANALYSIS.sleep.quality
  );
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCapture = () => {
    // Mock: simulate AI analysis delay
    setScreenState("edit");
  };

  const handleRetake = () => {
    setScreenState("camera");
    // Reset to AI defaults
    setEnergy(MOCK_ANALYSIS.energy.level);
    setMood(MOCK_ANALYSIS.mood.value);
    setStress(MOCK_ANALYSIS.stress.level);
    setSleep(MOCK_ANALYSIS.sleep.quality);
    setNote("");
    setCategories([]);
  };

  const handleCategoryToggle = (cat: ExerciseCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Mock submit
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "등록 완료",
        "컨디션이 등록되었습니다. 시퀀스가 생성됩니다.",
        [{ text: "확인" }]
      );
    }, 1500);
  };

  // ===== Camera State =====
  if (screenState === "camera") {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            오늘의 컨디션을 체크하세요
          </Text>
          <Text className="text-sm text-gray-500 mb-8 text-center">
            얼굴을 촬영하면 AI가 컨디션을 분석합니다
          </Text>

          {/* Mock camera area */}
          <View className="w-64 h-80 bg-gray-100 rounded-3xl items-center justify-center mb-8 border-2 border-dashed border-gray-300">
            <Text className="text-5xl mb-3">{"📷"}</Text>
            <Text className="text-sm text-gray-400">카메라 미리보기</Text>
          </View>

          <TouchableOpacity
            onPress={handleCapture}
            className="w-20 h-20 rounded-full bg-[#6366F1] items-center justify-center"
            style={{
              shadowColor: "#6366F1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="w-16 h-16 rounded-full border-4 border-white items-center justify-center">
              <Text className="text-2xl">{"📷"}</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 mt-3">
            촬영 버튼을 눌러주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Edit State =====
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          컨디션 분석 결과
        </Text>

        {/* AI Analysis Result */}
        <ConditionResult analysis={analysis} />

        {/* Editable Section */}
        <View className="mb-2">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            {"✏️ "}컨디션 수정
          </Text>
          <Text className="text-xs text-gray-400 mb-4">
            AI 분석 결과를 확인하고 필요시 수정하세요
          </Text>
        </View>

        <ConditionEditor
          energy={energy}
          onEnergyChange={setEnergy}
          mood={mood}
          onMoodChange={setMood}
          stress={stress}
          onStressChange={setStress}
          sleep={sleep}
          onSleepChange={setSleep}
          note={note}
          onNoteChange={setNote}
        />

        {/* Category Selector */}
        <CategorySelector
          selected={categories}
          onToggle={handleCategoryToggle}
          maxSelection={2}
        />

        {/* Action buttons */}
        <View className="mt-4 gap-3">
          <Button
            title="등록 & 시퀀스 생성"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
          <Button
            title="다시 촬영"
            onPress={handleRetake}
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
