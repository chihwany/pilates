import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Member, BodyCondition, ExercisePreferences } from "@/shared/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import BodyConditionTag from "@/components/member/BodyConditionTag";
import Button from "@/components/ui/Button";
import { getMember, updateMember } from "@/lib/api/members";

const levelLabels: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const levelVariants: Record<string, "success" | "warning" | "primary"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "primary",
};

const MUSCLE_GROUPS = [
  "코어",
  "허벅지",
  "종아리",
  "엉덩이",
  "어깨",
  "등",
  "가슴",
  "팔",
  "골반",
  "목",
  "척추",
];

const GOAL_OPTIONS = [
  "자세 교정",
  "코어 강화",
  "유연성 향상",
  "재활",
  "근력 강화",
  "체력 증진",
  "밸런스",
  "스트레스 해소",
];

const SESSION_DURATION_OPTIONS = [40, 50, 60];

const SEVERITY_OPTIONS: { value: BodyCondition["severity"]; label: string }[] = [
  { value: "mild", label: "경미" },
  { value: "moderate", label: "보통" },
  { value: "severe", label: "심각" },
];

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editBodyConditions, setEditBodyConditions] = useState<BodyCondition[]>([]);
  const [editPreferences, setEditPreferences] = useState<ExercisePreferences>({
    preferredEquipment: [],
    targetMuscles: [],
    avoidExercises: [],
    goals: [],
    sessionDurationMinutes: 50,
  });

  // New body condition form
  const [newConditionType, setNewConditionType] = useState("");
  const [newConditionArea, setNewConditionArea] = useState("");
  const [newConditionSeverity, setNewConditionSeverity] =
    useState<BodyCondition["severity"]>("mild");
  const [newConditionNotes, setNewConditionNotes] = useState("");
  const [showAddCondition, setShowAddCondition] = useState(false);

  // Avoid exercises as comma-separated string
  const [avoidExercisesText, setAvoidExercisesText] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await getMember(id);
      if (res.success && res.data) {
        setMember(res.data);
      }
      setLoading(false);
    })();
  }, [id]);

  function enterEditMode() {
    if (!member) return;
    setEditBodyConditions([...(member.bodyConditions || [])]);
    const prefs = member.exercisePreferences || {
      preferredEquipment: [],
      targetMuscles: [],
      avoidExercises: [],
      goals: [],
      sessionDurationMinutes: 50,
    };
    setEditPreferences({
      ...prefs,
      targetMuscles: prefs.targetMuscles || [],
    });
    setAvoidExercisesText((prefs.avoidExercises || []).join(", "));
    setShowAddCondition(false);
    resetNewConditionForm();
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setShowAddCondition(false);
    resetNewConditionForm();
  }

  function resetNewConditionForm() {
    setNewConditionType("");
    setNewConditionArea("");
    setNewConditionSeverity("mild");
    setNewConditionNotes("");
  }

  function addBodyCondition() {
    if (!newConditionType.trim() || !newConditionArea.trim()) return;
    const newCondition: BodyCondition = {
      type: newConditionType.trim(),
      area: newConditionArea.trim(),
      severity: newConditionSeverity,
      ...(newConditionNotes.trim() ? { notes: newConditionNotes.trim() } : {}),
    };
    setEditBodyConditions((prev) => [...prev, newCondition]);
    resetNewConditionForm();
    setShowAddCondition(false);
  }

  function removeBodyCondition(index: number) {
    setEditBodyConditions((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleMuscle(muscle: string) {
    setEditPreferences((prev) => {
      const muscles = prev.targetMuscles || [];
      return {
        ...prev,
        targetMuscles: muscles.includes(muscle)
          ? muscles.filter((m) => m !== muscle)
          : [...muscles, muscle],
      };
    });
  }

  function toggleGoal(goal: string) {
    setEditPreferences((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  }

  function setSessionDuration(minutes: number) {
    setEditPreferences((prev) => ({
      ...prev,
      sessionDurationMinutes: minutes,
    }));
  }

  async function handleSave() {
    if (!id || !member) return;
    setSaving(true);

    const avoidList = avoidExercisesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await updateMember(id, {
      bodyConditions: editBodyConditions,
      exercisePreferences: {
        ...editPreferences,
        avoidExercises: avoidList,
      },
    });

    if (res.success && res.data) {
      setMember(res.data);
      setIsEditing(false);
    } else {
      const msg = res.error?.message || "저장에 실패했습니다.";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("오류", msg);
      }
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">회원 정보를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerClassName="px-6 py-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Button title="뒤로" onPress={() => router.back()} variant="outline" />
            <Text className="text-xl font-bold text-gray-900 ml-4">
              회원 상세
            </Text>
          </View>
          {!isEditing ? (
            <Button title="편집" onPress={enterEditMode} variant="outline" />
          ) : (
            <Button title="취소" onPress={cancelEdit} variant="outline" />
          )}
        </View>

        {/* 프로필 카드 */}
        <Card className="mb-4">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-[#6366F1]/10 items-center justify-center mb-2">
              <Text className="text-2xl text-[#6366F1]">
                {member.name.charAt(0)}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">
              {member.name}
            </Text>
            <View className="mt-2">
              <Badge
                label={levelLabels[member.fitnessLevel]}
                variant={levelVariants[member.fitnessLevel]}
              />
            </View>
          </View>

          {member.phone && (
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-500">전화번호</Text>
              <Text className="text-sm text-gray-900">{member.phone}</Text>
            </View>
          )}
          {member.dateOfBirth && (
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-500">생년월일</Text>
              <Text className="text-sm text-gray-900">{member.dateOfBirth}</Text>
            </View>
          )}
          {member.notes && (
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text className="text-sm text-gray-500">메모</Text>
              <Text className="text-sm text-gray-900">{member.notes}</Text>
            </View>
          )}
        </Card>

        {/* 신체 상태 */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            신체 상태
          </Text>

          {isEditing ? (
            <View className="gap-2">
              {editBodyConditions.map((condition, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <BodyConditionTag condition={condition} />
                  {condition.notes && (
                    <Text className="text-xs text-gray-500 flex-1">
                      {condition.notes}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => removeBodyCondition(index)}
                    className="w-6 h-6 rounded-full bg-[#EF4444]/10 items-center justify-center"
                  >
                    <Text className="text-xs text-[#EF4444] font-bold">X</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {editBodyConditions.length === 0 && !showAddCondition && (
                <Text className="text-sm text-gray-400">
                  등록된 신체 상태가 없습니다
                </Text>
              )}

              {showAddCondition ? (
                <View className="mt-2 p-3 bg-gray-50 rounded-xl gap-3">
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">유형</Text>
                    <TextInput
                      value={newConditionType}
                      onChangeText={setNewConditionType}
                      placeholder="예: 통증, 제한, 불편감"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">부위</Text>
                    <TextInput
                      value={newConditionArea}
                      onChangeText={setNewConditionArea}
                      placeholder="예: 허리, 어깨, 무릎"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">심각도</Text>
                    <View className="flex-row gap-2">
                      {SEVERITY_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setNewConditionSeverity(opt.value)}
                          className={`flex-1 py-2 rounded-lg items-center border ${
                            newConditionSeverity === opt.value
                              ? "bg-[#6366F1] border-[#6366F1]"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              newConditionSeverity === opt.value
                                ? "text-white"
                                : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">메모 (선택)</Text>
                    <TextInput
                      value={newConditionNotes}
                      onChangeText={setNewConditionNotes}
                      placeholder="추가 메모"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddCondition(false);
                        resetNewConditionForm();
                      }}
                      className="flex-1 py-2 rounded-lg items-center border border-gray-200"
                    >
                      <Text className="text-sm text-gray-700">취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={addBodyCondition}
                      disabled={!newConditionType.trim() || !newConditionArea.trim()}
                      className={`flex-1 py-2 rounded-lg items-center ${
                        newConditionType.trim() && newConditionArea.trim()
                          ? "bg-[#6366F1]"
                          : "bg-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          newConditionType.trim() && newConditionArea.trim()
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        추가
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setShowAddCondition(true)}
                  className="mt-2 py-2 rounded-lg border border-dashed border-gray-300 items-center"
                >
                  <Text className="text-sm text-gray-500">+ 신체 상태 추가</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (member.bodyConditions || []).length > 0 ? (
            <View className="gap-2">
              {(member.bodyConditions || []).map((condition, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <BodyConditionTag condition={condition} />
                  {condition.notes && (
                    <Text className="text-xs text-gray-500">
                      {condition.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-gray-400">
              등록된 신체 상태가 없습니다
            </Text>
          )}
        </Card>

        {/* 타겟 근육 */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            타겟 근육
          </Text>

          {isEditing ? (
            <View className="gap-4">
              {/* 근육 그룹 태그 */}
              <View>
                <Text className="text-xs text-gray-500 mb-2">근육 그룹</Text>
                <View className="flex-row flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((muscle) => {
                    const selected = (editPreferences.targetMuscles || []).includes(muscle);
                    return (
                      <TouchableOpacity
                        key={muscle}
                        onPress={() => toggleMuscle(muscle)}
                        className={`px-3 py-1.5 rounded-full border ${
                          selected
                            ? "bg-[#6366F1] border-[#6366F1]"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            selected ? "text-white font-medium" : "text-gray-700"
                          }`}
                        >
                          {muscle}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 피해야 할 운동 */}
              <View>
                <Text className="text-xs text-gray-500 mb-1">
                  피해야 할 운동 (콤마 구분)
                </Text>
                <TextInput
                  value={avoidExercisesText}
                  onChangeText={setAvoidExercisesText}
                  placeholder="예: 플랭크, 데드리프트"
                  placeholderTextColor="#9CA3AF"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                />
              </View>

              {/* 운동 목표 */}
              <View>
                <Text className="text-xs text-gray-500 mb-2">운동 목표</Text>
                <View className="flex-row flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const selected = editPreferences.goals.includes(goal);
                    return (
                      <TouchableOpacity
                        key={goal}
                        onPress={() => toggleGoal(goal)}
                        className={`px-3 py-1.5 rounded-full border ${
                          selected
                            ? "bg-[#10B981] border-[#10B981]"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            selected ? "text-white font-medium" : "text-gray-700"
                          }`}
                        >
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 세션 시간 */}
              <View>
                <Text className="text-xs text-gray-500 mb-2">세션 시간</Text>
                <View className="flex-row gap-2">
                  {SESSION_DURATION_OPTIONS.map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      onPress={() => setSessionDuration(minutes)}
                      className={`flex-1 py-2 rounded-lg items-center border ${
                        editPreferences.sessionDurationMinutes === minutes
                          ? "bg-[#6366F1] border-[#6366F1]"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          editPreferences.sessionDurationMinutes === minutes
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {minutes}분
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : member.exercisePreferences ? (
            <>
              {(member.exercisePreferences.targetMuscles || []).length > 0 && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">근육 그룹</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {member.exercisePreferences.targetMuscles.map((muscle) => (
                      <Badge key={muscle} label={muscle} variant="primary" />
                    ))}
                  </View>
                </View>
              )}

              {(member.exercisePreferences.avoidExercises || []).length > 0 && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">
                    피해야 할 운동
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {member.exercisePreferences.avoidExercises.map((ex) => (
                      <Badge key={ex} label={ex} variant="error" />
                    ))}
                  </View>
                </View>
              )}

              {(member.exercisePreferences.goals || []).length > 0 && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-500 mb-1">운동 목표</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {member.exercisePreferences.goals.map((goal) => (
                      <Badge key={goal} label={goal} variant="success" />
                    ))}
                  </View>
                </View>
              )}

              {member.exercisePreferences.sessionDurationMinutes && (
                <View className="flex-row justify-between py-2 border-t border-gray-100">
                  <Text className="text-sm text-gray-500">세션 시간</Text>
                  <Text className="text-sm text-gray-900">
                    {member.exercisePreferences.sessionDurationMinutes}분
                  </Text>
                </View>
              )}

              {!(member.exercisePreferences.targetMuscles || []).length &&
                !(member.exercisePreferences.avoidExercises || []).length &&
                !(member.exercisePreferences.goals || []).length &&
                !member.exercisePreferences.sessionDurationMinutes && (
                  <Text className="text-sm text-gray-400">
                    등록된 타겟 근육이 없습니다
                  </Text>
                )}
            </>
          ) : (
            <Text className="text-sm text-gray-400">
              등록된 타겟 근육이 없습니다
            </Text>
          )}
        </Card>

        {/* 저장 버튼 */}
        {isEditing && (
          <View className="mb-6">
            <Button
              title="저장"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
