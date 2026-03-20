import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function MemberLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          borderTopColor: "#F3F4F6",
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "오늘",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"📋"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="condition"
        options={{
          title: "컨디션",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"💪"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "기록",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"📊"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"👤"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
