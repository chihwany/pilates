import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSequence, updateSequence } from "@/lib/api/sequences";
import { AddExerciseModal } from "@/components/exercise/AddExerciseModal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type {
  ExerciseSequence,
  ExerciseInSequence,
  ExerciseCatalogItem,
} from "@/shared/types";
import { useFocusEffect } from "expo-router";

const difficultyLabel: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const difficultyVariant: Record<string, "success" | "warning" | "error"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "error",
};

const categoryLabels: Record<string, string> = {
  core: "코어",
  flexibility: "유연성",
  upper_body: "상체",
  lower_body: "하체",
  balance: "밸런스",
  stretching: "스트레칭",
  breathing: "호흡",
  posture: "자세",
  strength: "근력",
};

const categoryColors: Record<string, string> = {
  core: "#6366F1",
  flexibility: "#10B981",
  upper_body: "#F59E0B",
  lower_body: "#EF4444",
  balance: "#8B5CF6",
  stretching: "#06B6D4",
  breathing: "#EC4899",
  posture: "#14B8A6",
  strength: "#F97316",
};

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}분 ${sec}초` : `${min}분`;
  }
  return `${seconds}초`;
}

interface EditableExercise extends ExerciseInSequence {
  _editing?: boolean;
}

export default function SessionReviewScreen() {
  const params = useLocalSearchParams<{
    sequenceId: string;
    sessionId: string;
    memberName: string;
    conditionSummary: string;
  }>();
  const router = useRouter();

  const [sequence, setSequence] = useState<ExerciseSequence | null>(null);
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchSequence = useCallback(async () => {
    if (!params.sequenceId) return;
    setLoading(true);
    try {
      const res = await getSequence(params.sequenceId);
      if (res.success && res.data) {
        setSequence(res.data);
        setExercises(res.data.exercises.map((e) => ({ ...e })));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [params.sequenceId]);

  useFocusEffect(
    useCallback(() => {
      fetchSequence();
    }, [fetchSequence])
  );

  const handleDeleteExercise = (order: number) => {
    const confirmDelete = () => {
      setExercises((prev) => {
        const updated = prev
          .filter((e) => e.order !== order)
          .map((e, idx) => ({ ...e, order: idx + 1 }));
        return updated;
      });
      setHasChanges(true);
    };

    if (Platform.OS === "web") {
      if (window.confirm("이 운동을 삭제하시겠습니까?")) {
        confirmDelete();
      }
    } else {
      Alert.alert("운동 삭제", "이 운동을 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "삭제", style: "destructive", onPress: confirmDelete },
      ]);
    }
  };

  const handleEditField = (
    order: number,
    field: "sets" | "reps" | "durationSeconds",
    value: string
  ) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;

    setExercises((prev) =>
      prev.map((e) => (e.order === order ? { ...e, [field]: num } : e))
    );
    setHasChanges(true);
  };

  const toggleEdit = (order: number) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.order === order ? { ...e, _editing: !e._editing } : e
      )
    );
  };

  const handleAddExercise = (item: ExerciseCatalogItem) => {
    const newExercise: EditableExercise = {
      catalogId: item.id,
      name: item.name,
      nameKo: item.nameKo,
      category: item.category,
      equipment: item.equipment,
      sets: 3,
      reps: 10,
      durationSeconds: 60,
      order: exercises.length + 1,
      reason: "강사 추가",
    };
    setExercises((prev) => [...prev, newExercise]);
    setHasChanges(true);
    setAddModalVisible(false);
  };

  const handleSave = async () => {
    if (!sequence) return;
    setSaving(true);
    try {
      const cleanExercises = exercises.map(
        ({ _editing, ...rest }) => rest
      );
      const totalSeconds = cleanExercises.reduce(
        (sum, e) => sum + e.durationSeconds * e.sets,
        0
      );
      const totalMinutes = Math.ceil(totalSeconds / 60);

      const res = await updateSequence(sequence.id, {
        exercises: cleanExercises,
        totalDurationMinutes: totalMinutes,
      });

      if (res.success) {
        setHasChanges(false);
        if (Platform.OS === "web") {
          window.alert("저장되었습니다.");
        } else {
          Alert.alert("저장 완료", "시퀀스가 성공적으로 저장되었습니다.");
        }
      } else {
        const msg = res.error?.message || "저장에 실패했습니다.";
        if (Platform.OS === "web") {
          window.alert(msg);
        } else {
          Alert.alert("오류", msg);
        }
      }
    } catch {
      const msg = "저장 중 오류가 발생했습니다.";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("오류", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!params.sequenceId) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-gray-900">세션</Text>
          <Text className="text-base text-gray-500 mt-2">
            대시보드에서 세션을 선택해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!sequence) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-gray-500">
            시퀀스를 불러올 수 없습니다.
          </Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-4">
            <Text className="text-[#6366F1] font-semibold">돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-[#6366F1] font-semibold text-base">
                {"< 뒤로"}
              </Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              시퀀스 리뷰
            </Text>
            <View style={{ width: 50 }} />
          </View>
        </View>

        {/* Member info */}
        <View className="bg-white px-6 py-4 mb-2">
          <Text className="text-xl font-bold text-gray-900">
            {params.memberName || "회원"}
          </Text>
          {params.conditionSummary ? (
            <View className="bg-gray-50 rounded-xl px-3 py-2 mt-2">
              <Text className="text-sm text-gray-600">
                {params.conditionSummary}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Sequence info */}
        <View className="bg-white px-6 py-4 mb-2">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Text className="text-3xl font-bold text-[#6366F1]">
                {sequence.totalDurationMinutes}
              </Text>
              <Text className="text-sm text-gray-500 ml-1 mt-1">분</Text>
            </View>
            <Badge
              label={
                difficultyLabel[sequence.difficulty] || sequence.difficulty
              }
              variant={difficultyVariant[sequence.difficulty] || "default"}
            />
          </View>
          <Text className="text-sm text-gray-600">
            {exercises.length}개 운동
          </Text>
          {sequence.focusAreas.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {sequence.focusAreas.map((area) => (
                <Badge key={area} label={area} variant="primary" />
              ))}
            </View>
          )}
          {sequence.sequenceNote && (
            <View className="bg-[#6366F1]/5 rounded-xl p-3 mt-3">
              <Text className="text-xs text-gray-500 mb-1">AI 노트</Text>
              <Text className="text-sm text-gray-700 leading-5">
                {sequence.sequenceNote}
              </Text>
            </View>
          )}
        </View>

        {/* Exercise list */}
        <View className="px-6 pt-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            운동 목록
          </Text>
          {exercises.map((exercise) => {
            const barColor =
              categoryColors[exercise.category] || "#9CA3AF";
            const categoryLabel =
              categoryLabels[exercise.category] || exercise.category;

            return (
              <View
                key={exercise.order}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-row mb-3"
              >
                {/* Category color bar */}
                <View style={{ width: 4, backgroundColor: barColor }} />

                <View className="flex-1 p-4">
                  {/* Top row */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View
                        style={{ backgroundColor: barColor }}
                        className="w-7 h-7 rounded-full items-center justify-center mr-3"
                      >
                        <Text className="text-xs font-bold text-white">
                          {exercise.order}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {exercise.nameKo}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {exercise.name}
                        </Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() => toggleEdit(exercise.order)}
                        className="bg-gray-100 rounded-lg px-3 py-1.5"
                      >
                        <Text className="text-xs font-medium text-gray-600">
                          {exercise._editing ? "완료" : "편집"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteExercise(exercise.order)}
                        className="bg-[#EF4444]/10 rounded-lg px-2.5 py-1.5"
                      >
                        <Text className="text-xs font-bold text-[#EF4444]">
                          X
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Badges */}
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    <View
                      style={{ backgroundColor: `${barColor}15` }}
                      className="rounded-full px-3 py-1"
                    >
                      <Text
                        style={{ color: barColor }}
                        className="text-xs font-medium"
                      >
                        {categoryLabel}
                      </Text>
                    </View>
                    {exercise.equipment && exercise.equipment !== "none" && (
                      <View className="bg-gray-100 rounded-full px-3 py-1">
                        <Text className="text-xs font-medium text-gray-600">
                          {exercise.equipment}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Editable fields */}
                  {exercise._editing ? (
                    <View className="flex-row items-center gap-3 mt-1">
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-600 mr-1">
                          세트:
                        </Text>
                        <TextInput
                          value={String(exercise.sets)}
                          onChangeText={(v) =>
                            handleEditField(exercise.order, "sets", v)
                          }
                          keyboardType="numeric"
                          className="border border-gray-200 rounded-lg px-2 py-1 w-12 text-center text-sm text-gray-900"
                        />
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-600 mr-1">
                          횟수:
                        </Text>
                        <TextInput
                          value={String(exercise.reps || 0)}
                          onChangeText={(v) =>
                            handleEditField(exercise.order, "reps", v)
                          }
                          keyboardType="numeric"
                          className="border border-gray-200 rounded-lg px-2 py-1 w-12 text-center text-sm text-gray-900"
                        />
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-600 mr-1">
                          초:
                        </Text>
                        <TextInput
                          value={String(exercise.durationSeconds)}
                          onChangeText={(v) =>
                            handleEditField(
                              exercise.order,
                              "durationSeconds",
                              v
                            )
                          }
                          keyboardType="numeric"
                          className="border border-gray-200 rounded-lg px-2 py-1 w-14 text-center text-sm text-gray-900"
                        />
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-3">
                      <Text className="text-sm text-gray-700">
                        {exercise.sets}세트
                        {exercise.reps ? ` x ${exercise.reps}회` : ""}
                      </Text>
                      <Text className="text-sm text-gray-400">|</Text>
                      <Text className="text-sm text-gray-700">
                        {formatDuration(exercise.durationSeconds)}
                      </Text>
                    </View>
                  )}

                  {/* Reason */}
                  {exercise.reason && !exercise._editing && (
                    <View className="mt-2 bg-gray-50 rounded-xl p-3">
                      <Text className="text-xs text-gray-500 mb-0.5">
                        추천 이유
                      </Text>
                      <Text className="text-sm text-gray-700 leading-5">
                        {exercise.reason}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title="운동 추가"
              variant="outline"
              onPress={() => setAddModalVisible(true)}
            />
          </View>
          <View className="flex-1">
            <Button
              title="저장"
              onPress={handleSave}
              loading={saving}
              disabled={!hasChanges}
            />
          </View>
        </View>
      </View>

      {/* Add exercise modal */}
      <AddExerciseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddExercise}
      />
    </SafeAreaView>
  );
}
