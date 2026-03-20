import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/lib/stores/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useState } from "react";
import type { UserRole } from "@/shared/types";

const registerSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요").min(2, "이름은 2자 이상이어야 합니다"),
    email: z.string().min(1, "이메일을 입력해주세요").email("올바른 이메일 형식이 아닙니다"),
    password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// Mock 회원가입 (BE 개발 전)
const mockRegister = async (name: string, email: string, role: UserRole) => {
  return {
    user: {
      id: "mock-user-" + Date.now(),
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };
};

export default function RegisterScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("member");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const result = await mockRegister(data.name, data.email, role);
      await setAuth(result.user, result.accessToken, result.refreshToken);

      if (result.user.role === "instructor") {
        router.replace("/(instructor)");
      } else {
        router.replace("/(member)");
      }
    } catch {
      Alert.alert("회원가입 실패", "잠시 후 다시 시도해주세요.");
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
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-[#6366F1] text-center">
              회원가입
            </Text>
            <Text className="text-base text-gray-500 text-center mt-2">
              Pilates AI에 가입하세요
            </Text>
          </View>

          {/* 역할 선택 토글 */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              역할 선택
            </Text>
            <View className="flex-row bg-gray-100 rounded-xl p-1">
              <TouchableOpacity
                onPress={() => setRole("member")}
                className={`flex-1 py-3 rounded-lg items-center ${
                  role === "member" ? "bg-[#6366F1]" : ""
                }`}
              >
                <Text
                  className={`font-semibold ${
                    role === "member" ? "text-white" : "text-gray-500"
                  }`}
                >
                  회원
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole("instructor")}
                className={`flex-1 py-3 rounded-lg items-center ${
                  role === "instructor" ? "bg-[#6366F1]" : ""
                }`}
              >
                <Text
                  className={`font-semibold ${
                    role === "instructor" ? "text-white" : "text-gray-500"
                  }`}
                >
                  강사
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="이름"
                placeholder="홍길동"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

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
                placeholder="6자 이상 입력하세요"
                secureTextEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="비밀번호 확인"
                placeholder="비밀번호를 다시 입력하세요"
                secureTextEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="text-sm text-blue-700 text-center">
              얼굴 사진 등록은 불필요합니다. 이메일과 비밀번호만으로 가입할 수 있습니다.
            </Text>
          </View>

          <Button
            title="회원가입"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 items-center"
          >
            <Text className="text-sm text-gray-500">
              이미 계정이 있으신가요?{" "}
              <Text className="text-[#6366F1] font-semibold">로그인</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
