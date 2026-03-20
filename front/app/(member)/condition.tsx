import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type {
  ConditionAnalysisDetailed,
  Mood,
  SleepQuality,
  ExerciseCategory,
} from "@/shared/types";
import { ConditionResult } from "@/components/condition/ConditionResult";
import { ConditionEditor } from "@/components/condition/ConditionEditor";
import { CategorySelector } from "@/components/exercise/CategorySelector";
import { WebCamera } from "@/components/camera/WebCamera";
import { NativeCamera } from "@/components/camera/NativeCamera";
import Button from "@/components/ui/Button";
import { analyzeCondition, registerCondition } from "@/lib/api/condition";
import { generateSequence } from "@/lib/api/sequences";

const showAlert = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
};

type ScreenState = "camera" | "analyzing" | "edit" | "registering" | "generating";

export default function ConditionScreen() {
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [analysis, setAnalysis] = useState<ConditionAnalysisDetailed | null>(null);

  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState<Mood>("CALM");
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState<SleepQuality>("FAIR");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleAnalyze = async (base64: string) => {
    setCapturedImage(base64);
    setScreenState("analyzing");
    const res = await analyzeCondition(base64);

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
      setScreenState("camera");
    }
  };

  const handleRetake = () => {
    setScreenState("camera");
    setAnalysis(null);
    setCapturedImage(null);
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

    // 단계 1: 컨디션 등록
    setScreenState("registering");

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

    if (!res.success || !res.data) {
      showAlert("등록 실패", res.error?.message || "다시 시도해주세요.");
      setScreenState("edit");
      return;
    }

    // 단계 2: 시퀀스 생성
    setScreenState("generating");

    const sessionData = res.data as { id?: string };
    let sequenceSuccess = false;

    if (sessionData.id) {
      try {
        const seqRes = await generateSequence({ sessionId: sessionData.id });
        console.log("[condition] generateSequence result:", JSON.stringify(seqRes).substring(0, 200));
        if (seqRes.success) {
          sequenceSuccess = true;
        } else {
          console.log("[condition] generateSequence failed:", seqRes.error?.message);
          showAlert("시퀀스 생성 실패", seqRes.error?.message || "시퀀스 생성에 실패했습니다. 오늘 탭에서 다시 시도해주세요.");
        }
      } catch (err) {
        console.log("[condition] generateSequence error:", err);
        showAlert("시퀀스 생성 오류", "네트워크 오류가 발생했습니다.");
      }
    } else {
      console.log("[condition] no sessionId in response:", JSON.stringify(res.data).substring(0, 200));
    }

    // 완료 → 오늘 탭으로 이동
    setScreenState("camera");
    setAnalysis(null);
    setCapturedImage(null);
    setNote("");
    setCategories([]);
    router.replace("/(member)/");
  };

  // ===== Loading States =====
  if (screenState === "analyzing" || screenState === "registering" || screenState === "generating") {
    const loadingConfig = {
      analyzing: { emoji: "🔍", title: "컨디션 분석 중", sub: "AI가 얼굴을 분석하고 있습니다..." },
      registering: { emoji: "📋", title: "컨디션 등록 중", sub: "분석 결과를 저장하고 있습니다..." },
      generating: { emoji: "🧘‍♀️", title: "시퀀스 생성 중", sub: "AI가 맞춤 운동 시퀀스를 생성하고 있습니다..." },
    };
    const config = loadingConfig[screenState];

    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-6">{config.emoji}</Text>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-xl font-bold text-gray-900 mt-6">
            {config.title}
          </Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            {config.sub}
          </Text>
          <Text className="text-xs text-gray-400 mt-6">
            잠시만 기다려주세요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

          {Platform.OS === "web" ? (
            /* Web: live webcam */
            <View className="mb-2">
              <WebCamera
                onCapture={handleAnalyze}
                onError={(msg) => showAlert("카메라 오류", msg)}
              />
            </View>
          ) : (
            /* Native: expo-camera */
            <NativeCamera
              onCapture={handleAnalyze}
              onError={(msg) => showAlert("카메라 오류", msg)}
            />
          )}
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

        {/* Captured image thumbnail (web only) */}
        {capturedImage && Platform.OS === "web" && (
          <View className="items-center mb-4">
            <Image
              source={{ uri: `data:image/jpeg;base64,${capturedImage}` }}
              className="w-20 h-20 rounded-full"
              resizeMode="cover"
              style={{ transform: [{ scaleX: -1 }] }}
            />
            <Text className="text-xs text-gray-400 mt-1">이 사진으로 분석했습니다</Text>
          </View>
        )}

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
