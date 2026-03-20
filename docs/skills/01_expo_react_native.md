# Expo SDK 52+ 핵심 라이브러리 사용 가이드

---

## 1. Expo 프로젝트 초기화

```bash
# 기본 프로젝트 생성 (blank 템플릿)
npx create-expo-app@latest my-app

# 특정 템플릿으로 생성
npx create-expo-app@latest my-app --template tabs

# 프로젝트 디렉토리로 이동 후 실행
cd my-app
npx expo start
```

SDK 52+에서는 **Expo Go 대신 development build** 사용을 권장합니다.

```bash
# development build 생성
npx expo install expo-dev-client
npx expo run:android
npx expo run:ios
```

---

## 2. expo-router v4 파일 기반 라우팅

### 설치

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

`package.json`에 진입점 설정:

```json
{
  "main": "expo-router/entry"
}
```

`app.json` 설정:

```json
{
  "expo": {
    "scheme": "myapp",
    "plugins": ["expo-router"]
  }
}
```

### 디렉토리 구조 예시

```
app/
├── _layout.tsx          # 루트 레이아웃
├── index.tsx            # 홈 화면 (/)
├── (auth)/              # 그룹 레이아웃 (URL에 반영 안 됨)
│   ├── _layout.tsx
│   ├── login.tsx        # /login
│   └── register.tsx     # /register
├── (tabs)/              # 탭 네비게이터 그룹
│   ├── _layout.tsx
│   ├── home.tsx         # /home
│   ├── profile.tsx      # /profile
│   └── settings.tsx     # /settings
├── exercise/
│   ├── _layout.tsx      # 스택 레이아웃
│   ├── index.tsx        # /exercise
│   └── [id].tsx         # /exercise/123 (동적 라우트)
└── +not-found.tsx       # 404 페이지
```

### 루트 레이아웃 (`app/_layout.tsx`)

```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="exercise" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### 탭 네비게이터 (`app/(tabs)/_layout.tsx`)

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 스택 레이아웃 (`app/exercise/_layout.tsx`)

```tsx
import { Stack } from "expo-router";

export default function ExerciseLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Exercises" }} />
      <Stack.Screen name="[id]" options={{ title: "Exercise Detail" }} />
    </Stack>
  );
}
```

### 그룹 레이아웃 (`app/(auth)/_layout.tsx`)

그룹은 괄호 `()`로 감싸며, URL 경로에 포함되지 않습니다.

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

### 네비게이션 (페이지 이동)

```tsx
import { Link, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      {/* 선언적 Link */}
      <Link href="/exercise/42">Go to Exercise 42</Link>

      {/* 프로그래밍 방식 */}
      <Pressable onPress={() => router.push("/profile")}>
        <Text>Go to Profile</Text>
      </Pressable>

      {/* replace: 히스토리 스택에 쌓지 않음 */}
      <Pressable onPress={() => router.replace("/(auth)/login")}>
        <Text>Login</Text>
      </Pressable>

      {/* back */}
      <Pressable onPress={() => router.back()}>
        <Text>Go Back</Text>
      </Pressable>
    </>
  );
}
```

### 동적 라우트 파라미터 (`app/exercise/[id].tsx`)

```tsx
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Exercise ID: {id}</Text>
    </View>
  );
}
```

---

## 3. expo-camera 기본 사용법

### 설치

```bash
npx expo install expo-camera
```

`app.json` 플러그인 설정:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera for condition analysis."
        }
      ]
    ]
  }
}
```

### 카메라 열기, 사진 촬영, base64 변환

SDK 52+에서는 `CameraView` 컴포넌트를 사용합니다 (기존 `Camera`는 deprecated).

```tsx
import { useState, useRef } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera permission is required.</Text>
        <Pressable onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.7,
      exif: false,
    });
    if (result) {
      setPhoto(result.uri);
      // base64 데이터를 API로 전송
      // await sendToAPI(result.base64);
    }
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <Pressable onPress={() => setPhoto(null)}>
          <Text>Take Another</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.controls}>
          <Pressable onPress={() => setFacing(f => f === "back" ? "front" : "back")}>
            <Text style={styles.buttonText}>Flip</Text>
          </Pressable>
          <Pressable onPress={takePicture}>
            <Text style={styles.buttonText}>Capture</Text>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  camera: { flex: 1 },
  preview: { flex: 1 },
  controls: {
    flex: 1, flexDirection: "row", justifyContent: "space-around",
    alignItems: "flex-end", paddingBottom: 40,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
```

---

## 4. expo-notifications Push 알림 설정

### 설치

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Push 토큰 등록 및 알림 수신

```tsx
import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

// 포그라운드 알림 표시 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Expo Push Token 가져오기
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    alert("Push notifications require a physical device.");
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return undefined;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error("Project ID not found.");

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return tokenData.data;
}

// 커스텀 훅
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener(setNotification);

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);
      });

    return () => {
      notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { expoPushToken, notification };
}
```

---

## 5. expo-secure-store JWT 토큰 저장/조회

### 설치

```bash
npx expo install expo-secure-store
```

### 토큰 저장/조회/삭제

```tsx
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
```

### 인증 컨텍스트 + expo-router 연동

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";

interface AuthContextType {
  token: string | null;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync("auth_token");
      setToken(saved);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!token && !inAuth) router.replace("/(auth)/login");
    else if (token && inAuth) router.replace("/(tabs)/home");
  }, [token, segments, isLoading]);

  const signIn = async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync("auth_token", accessToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    setToken(accessToken);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("refresh_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 주요 참고 사항 (SDK 52+)

| 항목 | 참고 |
|---|---|
| **New Architecture** | SDK 52부터 기본 활성화 |
| **expo-camera** | `Camera` deprecated → `CameraView` 사용 |
| **expo-router v4** | typed routes 지원 (`"experiments": { "typedRoutes": true }`) |
| **expo-secure-store** | iOS Keychain, Android EncryptedSharedPreferences. 최대 2KB |
| **expo-notifications** | Android `useNextNotificationsApi: true` 권장 |
| **Development Build** | 카메라/알림 등 네이티브 모듈은 Expo Go 대신 dev build 필수 |
