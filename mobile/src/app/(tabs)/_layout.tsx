import { Tabs } from "expo-router";
import { Text } from "react-native";
import { palette } from "@/constants/theme";

const labels: Record<string, string> = { index: "Главная", navigator: "Навигатор", coach: "Коуч", community: "Сообщество", profile: "Профиль" };
const icons: Record<string, string> = { index: "⌂", navigator: "⌕", coach: "✓", community: "◉", profile: "●" };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: palette.primary,
      tabBarInactiveTintColor: palette.muted,
      tabBarLabel: labels[route.name] ?? route.name,
      tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: "700" }}>{icons[route.name] ?? "•"}</Text>,
      tabBarStyle: { height: 66, paddingTop: 6, paddingBottom: 8, borderTopColor: palette.border },
    })}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="navigator" />
      <Tabs.Screen name="coach" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
