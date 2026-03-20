import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function InstructorLayout() {
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
          title: "홈",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"🏠"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "회원",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"👥"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "스케줄",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"📅"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: "세션",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"🏋️"}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "설정",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{"⚙️"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}
