import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/authStore";
import { login as loginApi } from "@/lib/api/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Mock 로그인 (BE 개발 전)
const mockLogin = async (email: string, _password: string) => {
  const isInstructor = email.includes("instructor") || email.includes("강사");
  return {
    user: {
      id: "mock-user-1",
      email,
      name: isInstructor ? "김필라 강사" : "이회원",
      role: (isInstructor ? "instructor" : "member") as "instructor" | "member",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };
};

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      // BE 준비 전까지 mock 사용
      const result = await mockLogin(data.email, data.password);
      await setAuth(result.user, result.accessToken, result.refreshToken);

      if (result.user.role === "instructor") {
        router.replace("/(instructor)");
      } else {
        router.replace("/(member)");
      }
    } catch {
      Alert.alert("로그인 실패", "이메일 또는 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10">
            <Text className="text-3xl font-bold text-[#6366F1] text-center">
              Pilates AI
            </Text>
            <Text className="text-base text-gray-500 text-center mt-2">
              AI 기반 맞춤 필라테스 시퀀스
            </Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="이메일"
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="비밀번호"
                placeholder="비밀번호를 입력하세요"
                secureTextEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <View className="mt-2">
            <Button
              title="로그인"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            className="mt-6 items-center"
          >
            <Text className="text-sm text-gray-500">
              계정이 없으신가요?{" "}
              <Text className="text-[#6366F1] font-semibold">회원가입</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
