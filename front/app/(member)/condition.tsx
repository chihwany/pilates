import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
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
import { analyzeCondition, registerCondition } from "@/lib/api/condition";

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
};

type ScreenState = "camera" | "edit";

export default function ConditionScreen() {
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [analysis, setAnalysis] = useState<ConditionAnalysisDetailed | null>(null);

  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState<Mood>("CALM");
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState<SleepQuality>("FAIR");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = async () => {
    setIsAnalyzing(true);
    const res = await analyzeCondition("mock-base64-image");
    setIsAnalyzing(false);

    if (res.success && res.data) {
      const data = res.data;
      setAnalysis(data);
      setEnergy(data.energy.level);
      setMood(data.mood.value as Mood);
      setStress(data.stress.level);
      setSleep(data.sleep.quality as SleepQuality);
      setScreenState("edit");
    } else {
      showAlert("분석 실패", res.error?.message || "다시 시도해주세요.");
    }
  };

  const handleRetake = () => {
    setScreenState("camera");
    setAnalysis(null);
    setNote("");
    setCategories([]);
  };

  const handleCategoryToggle = (cat: ExerciseCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (!analysis) return;
    setIsSubmitting(true);

    const today = new Date().toISOString().split("T")[0];
    const res = await registerCondition({
      date: today,
      conditionAiRaw: analysis,
      conditionFinal: {
        energy,
        mood,
        stress,
        sleep,
        summary: analysis.summary,
      },
      memberNote: note || undefined,
      requestedCategories: categories,
    });

    setIsSubmitting(false);
    if (res.success) {
      showAlert("등록 완료", "컨디션이 등록되었습니다. 시퀀스가 생성됩니다.");
      setScreenState("camera");
      setAnalysis(null);
      setNote("");
      setCategories([]);
    } else {
      showAlert("등록 실패", res.error?.message || "다시 시도해주세요.");
    }
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
            disabled={isAnalyzing}
            className={`w-20 h-20 rounded-full bg-[#6366F1] items-center justify-center ${isAnalyzing ? "opacity-50" : ""}`}
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
            {isAnalyzing ? "AI가 분석 중입니다..." : "촬영 버튼을 눌러주세요"}
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
        {analysis && <ConditionResult analysis={analysis} />}

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
