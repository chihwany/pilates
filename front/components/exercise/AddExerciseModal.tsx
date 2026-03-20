import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getExerciseCatalog } from "@/lib/api/exercises";
import type { ExerciseCatalogItem, ExerciseCategory } from "@/shared/types";

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: ExerciseCatalogItem) => void;
}

const CATEGORY_FILTERS: { value: ExerciseCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "CORE", label: "코어" },
  { value: "FLEXIBILITY", label: "유연성" },
  { value: "UPPER_BODY", label: "상체" },
  { value: "LOWER_BODY", label: "하체" },
  { value: "BALANCE", label: "밸런스" },
  { value: "STRETCHING", label: "스트레칭" },
  { value: "BREATHING", label: "호흡" },
  { value: "POSTURE", label: "자세" },
  { value: "STRENGTH", label: "근력" },
];

const difficultyLabel: Record<string, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

export function AddExerciseModal({
  visible,
  onClose,
  onAdd,
}: AddExerciseModalProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "ALL">("ALL");
  const [results, setResults] = useState<ExerciseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { category?: string; search?: string } = {};
      if (category !== "ALL") filters.category = category;
      if (search.trim()) filters.search = search.trim();
      const res = await getExerciseCatalog(filters);
      if (res.success && res.data) {
        setResults(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    if (visible) {
      fetchCatalog();
    }
  }, [visible, fetchCatalog]);

  const handleAdd = (item: ExerciseCatalogItem) => {
    onAdd(item);
  };

  const renderItem = ({ item }: { item: ExerciseCatalogItem }) => (
    <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-900">
            {item.nameKo}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">{item.name}</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            <Badge label={item.category} variant="primary" />
            {item.equipment && item.equipment !== "none" && (
              <Badge label={item.equipment} variant="default" />
            )}
            {item.difficulty && (
              <Badge
                label={difficultyLabel[item.difficulty] || item.difficulty}
                variant={
                  item.difficulty === "beginner"
                    ? "success"
                    : item.difficulty === "advanced"
                    ? "error"
                    : "warning"
                }
              />
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleAdd(item)}
          className="bg-[#6366F1] rounded-xl px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">추가</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const content = (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-900">운동 추가</Text>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-base text-[#6366F1] font-semibold">닫기</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-6 pt-4">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="운동명 검색..."
          placeholderTextColor="#9CA3AF"
          className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white mb-3"
          returnKeyType="search"
          onSubmitEditing={fetchCatalog}
        />
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={CATEGORY_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12 }}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            onPress={() => setCategory(cat.value)}
            className={`mr-2 px-4 py-2 rounded-full border ${
              category === cat.value
                ? "bg-[#6366F1] border-[#6366F1]"
                : "bg-white border-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                category === cat.value ? "text-white" : "text-gray-600"
              }`}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-gray-400 text-base">
                검색 결과가 없습니다
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </Modal>
  );
}
