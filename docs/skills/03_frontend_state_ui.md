# NativeWind v4, Zustand v5, TanStack Query v5, React Hook Form v7 + Zod v3

---

## 1. NativeWind v4 Expo 설정

### 설치

```bash
npx expo install nativewind@^4.0 tailwindcss@^3.4 react-native-reanimated react-native-safe-area-context
```

### tailwind.config.js

```js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: { primary: "#6366f1", secondary: "#f59e0b" },
    },
  },
  plugins: [],
};
```

### global.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### babel.config.js

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### metro.config.js

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

### app/_layout.tsx에서 CSS 임포트

```tsx
import "../global.css";
```

### nativewind-env.d.ts (TypeScript className 지원)

```ts
/// <reference types="nativewind/types" />
```

---

## 2. NativeWind 기본 사용법

### className 사용

```tsx
import { View, Text } from "react-native";

export function Card() {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-md mx-4 my-2">
      <Text className="text-lg font-bold text-gray-900">Card Title</Text>
      <Text className="text-sm text-gray-500 mt-1">Description</Text>
    </View>
  );
}
```

### 조건부 스타일링 (clsx + tailwind-merge)

```bash
npm install clsx tailwind-merge
```

```tsx
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | false | null)[]) {
  return twMerge(clsx(inputs));
}

// 사용
<Pressable
  className={cn(
    "px-6 py-3 rounded-xl items-center",
    variant === "primary" && "bg-indigo-500",
    variant === "outline" && "border-2 border-indigo-500",
    disabled && "opacity-50"
  )}
>
```

### 다크 모드

```tsx
<View className="bg-white dark:bg-gray-900">
  <Text className="text-gray-900 dark:text-gray-100">Adapts</Text>
</View>
```

---

## 3. Zustand v5 스토어

### 설치

```bash
npm install zustand
```

### 기본 스토어

```ts
import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: { id: string; name: string; role: string } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));
```

### 컴포넌트에서 사용 (셀렉터로 최적화)

```tsx
const token = useAuthStore((state) => state.token);
const logout = useAuthStore((state) => state.logout);
```

### Persist 미들웨어 (AsyncStorage)

```bash
npx expo install @react-native-async-storage/async-storage
```

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
```

---

## 4. TanStack Query v5 셋업

### 설치

```bash
npm install @tanstack/react-query
```

### QueryClientProvider (app/_layout.tsx)

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: 2,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
```

---

## 5. TanStack Query useQuery / useMutation

### API 클라이언트

```ts
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  get: <T>(ep: string) => fetchAPI<T>(ep),
  post: <T>(ep: string, body: unknown) => fetchAPI<T>(ep, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(ep: string, body: unknown) => fetchAPI<T>(ep, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(ep: string) => fetchAPI<T>(ep, { method: "DELETE" }),
};
```

### queryKey 팩토리 패턴 (권장)

```ts
export const memberKeys = {
  all: ["members"] as const,
  lists: () => [...memberKeys.all, "list"] as const,
  list: (filters: { search?: string }) => [...memberKeys.lists(), filters] as const,
  details: () => [...memberKeys.all, "detail"] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
};
```

### useQuery (조회)

```ts
import { useQuery } from "@tanstack/react-query";

export function useMembers(search?: string) {
  return useQuery({
    queryKey: memberKeys.list({ search }),
    queryFn: () => api.get<Member[]>(`/members${search ? `?search=${search}` : ""}`),
  });
}

export function useMemberDetail(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => api.get<Member>(`/members/${id}`),
    enabled: !!id,
  });
}
```

### 컴포넌트에서 사용

```tsx
const { data, isLoading, isError, error, refetch } = useMembers();

if (isLoading) return <ActivityIndicator />;
if (isError) return <Text>Error: {error.message}</Text>;
```

### useMutation (변경)

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMemberInput) => api.post<Member>("/members", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
```

### 컴포넌트에서 사용

```tsx
const { mutate, isPending } = useCreateMember();

const handleCreate = () => {
  mutate(formData, {
    onSuccess: (data) => Alert.alert("Success", `Created: ${data.name}`),
  });
};
```

---

## 6. React Hook Form v7 + Zod 통합

### 설치

```bash
npm install react-hook-form zod @hookform/resolvers
```

### 기본 패턴

```tsx
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "이메일 필수").email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(8, "8자 이상"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    console.log("Validated:", data);
  };

  return (
    <View className="flex-1 justify-center px-6">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border rounded-xl px-4 py-3 ${errors.email ? "border-red-500" : "border-gray-300"}`}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>}

      <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting}
        className="bg-indigo-500 py-3 rounded-xl items-center mt-4">
        <Text className="text-white font-semibold">{isSubmitting ? "로그인 중..." : "로그인"}</Text>
      </Pressable>
    </View>
  );
}
```

### 재사용 FormField 컴포넌트

```tsx
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";

interface FormFieldProps<T extends FieldValues> extends Omit<TextInputProps, "value"> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  error?: string;
}

export function FormField<T extends FieldValues>({ control, name, label, error, ...props }: FormFieldProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border rounded-xl px-4 py-3 ${error ? "border-red-500" : "border-gray-300"}`}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            {...props}
          />
        )}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
```

---

## 7. Zod 스키마 정의 패턴 (프론트/백 공유)

### shared/types.ts (공유 스키마)

```ts
import { z } from "zod";

// Base 스키마
export const memberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  bodyConditions: z.array(z.object({
    type: z.string(),
    area: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]),
    notes: z.string().optional(),
  })).default([]),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  createdAt: z.string().datetime(),
});

// 파생 스키마
export const createMemberSchema = memberSchema.omit({ id: true, createdAt: true });
export const updateMemberSchema = createMemberSchema.partial();

// 타입 추론
export type Member = z.infer<typeof memberSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
```

### 백엔드에서 검증

```ts
app.post("/api/members", async (c) => {
  const body = await c.req.json();
  const result = createMemberSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: "Validation failed", details: result.error.flatten().fieldErrors }, 400);
  }
  // result.data는 타입 안전한 CreateMemberInput
});
```

### 프론트에서 폼 검증

```tsx
const { control, handleSubmit } = useForm<CreateMemberInput>({
  resolver: zodResolver(createMemberSchema),
});
```

---

## 요약

| 라이브러리 | 핵심 포인트 |
|---|---|
| **NativeWind v4** | `nativewind/preset`, `withNativeWind` metro, `global.css` 임포트, `jsxImportSource: "nativewind"` |
| **Zustand v5** | `create<T>()()` (미들웨어 시), `persist` + `AsyncStorage`, 셀렉터로 리렌더링 최적화 |
| **TanStack Query v5** | queryKey 팩토리, `invalidateQueries` 캐시 무효화, `enabled` 조건부 실행 |
| **RHF v7 + Zod** | `zodResolver(schema)`, `Controller`로 RN 래핑, `z.infer`로 타입 추론 |
| **Zod 공유** | `omit/partial/pick`으로 파생, `safeParse`로 서버 검증, 프론트/백 타입 통일 |
