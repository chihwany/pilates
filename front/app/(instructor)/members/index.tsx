import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { Member } from "@/shared/types";
import MemberCard from "@/components/member/MemberCard";
import { getMembers } from "@/lib/api/members";

export default function MemberListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const res = await getMembers(search || undefined);
    if (res.success && res.data) {
      setMembers(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 300);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const filtered = members;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-6 pb-2">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          회원 관리
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-2"
          placeholder="회원 이름 검색..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" className="mt-10" color="#6366F1" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 pb-6"
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              onPress={() =>
                router.push(`/(instructor)/members/${item.id}`)
              }
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-gray-400">검색 결과가 없습니다</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
