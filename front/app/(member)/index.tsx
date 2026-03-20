import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/lib/stores/authStore";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SequenceCard } from "@/components/exercise/SequenceCard";
import { ExerciseItem } from "@/components/exercise/ExerciseItem";
import { SequenceLoading } from "@/components/exercise/SequenceLoading";
import { getTodaySequence } from "@/lib/api/sequences";
import type { ExerciseSequence, ExerciseInSequence } from "@/shared/types";

type ScreenState = "empty" | "loading" | "ready" | "error";

export default function MemberHome() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [sequence, setSequence] = useState<ExerciseSequence | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSequence = useCallback(async () => {
    setScreenState("loading");
    const res = await getTodaySequence();

    if (res.success && res.data) {
      setSequence(res.data);
      setScreenState("ready");
    } else if (res.error?.code === "NOT_FOUND" || res.error?.statusCode === 404) {
      setSequence(null);
      setScreenState("empty");
    } else if (res.error?.code === "NETWORK_ERROR") {
      // For dev: show empty state on network error (API not running)
      setSequence(null);
      setScreenState("empty");
    } else {
      setErrorMsg(res.error?.message || "시퀀스를 불러올 수 없습니다.");
      setScreenState("error");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSequence();
    }, [fetchSequence])
  );

  const goToCondition = () => {
    if (Platform.OS === "web") {
      router.push("/(member)/condition");
    } else {
      router.push("/(member)/condition");
    }
  };

  const renderExerciseItem = ({ item }: { item: ExerciseInSequence }) => (
    <ExerciseItem exercise={item} />
  );

  const keyExtractor = (item: ExerciseInSequence) =>
    `${item.order}-${item.catalogId}`;

  // ===== Loading State =====
  if (screenState === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <SequenceLoading />
      </SafeAreaView>
    );
  }

  // ===== Empty State (no condition check yet) =====
  if (screenState === "empty") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">{"🧘‍♀️"}</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            오늘의 시퀀스가 아직 없습니다
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-8">
            컨디션을 체크하면 AI가 맞춤 운동 시퀀스를 생성합니다
          </Text>
          <View className="w-full max-w-xs">
            <Button title="컨디션 체크하기" onPress={goToCondition} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Error State =====
  if (screenState === "error") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">{"⚠️"}</Text>
          <Text className="text-lg font-bold text-gray-900 mb-2">
            오류가 발생했습니다
          </Text>
          <Text className="text-sm text-gray-500 text-center mb-6">
            {errorMsg}
          </Text>
          <View className="w-full max-w-xs">
            <Button title="다시 시도" onPress={fetchSequence} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Ready State (sequence available) =====
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={sequence?.exercises ?? []}
        renderItem={renderExerciseItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Greeting */}
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              안녕하세요, {user?.name || "회원"}님
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              오늘의 맞춤 운동 시퀀스입니다
            </Text>

            {/* Sequence summary card */}
            {sequence && <SequenceCard sequence={sequence} />}

            {/* Exercise list header */}
            <Text className="text-lg font-bold text-gray-900 mb-3">
              운동 목록
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text className="text-sm text-gray-500 text-center">
              운동 목록이 비어있습니다.
            </Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
}
