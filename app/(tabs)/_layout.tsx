import React from "react";
import { View } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import FloatingTabBar from "@/components/FloatingTabBar";
import { PlusCircle, List, BarChart2 } from "lucide-react-native";
import { COLORS } from "@/constants/Colors";

const TABS = [
  { name: "log", route: "/(tabs)/(log)" as const, lucideIcon: PlusCircle, label: "Log", icon: "add_circle" as const },
  { name: "history", route: "/(tabs)/(history)" as const, lucideIcon: List, label: "History", icon: "list" as const },
  { name: "insights", route: "/(tabs)/(insights)" as const, lucideIcon: BarChart2, label: "Insights", icon: "bar_chart" as const },
];

function TabBarWithIcons() {
  const pathname = usePathname();

  const activeIndex = React.useMemo(() => {
    if (pathname.includes("history")) return 1;
    if (pathname.includes("insights")) return 2;
    return 0;
  }, [pathname]);

  const router = useRouter();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <FloatingTabBar
        tabs={TABS.map((t) => ({
          name: t.name,
          route: t.route,
          icon: t.icon,
          label: t.label,
        }))}
        containerWidth={260}
        borderRadius={35}
        bottomMargin={20}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="(log)" />
        <Stack.Screen name="(history)" />
        <Stack.Screen name="(insights)" />
      </Stack>
      <TabBarWithIcons />
    </View>
  );
}
