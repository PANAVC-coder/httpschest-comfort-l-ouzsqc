import React from "react";
import { Tabs } from "expo-router";
import FloatingTabBar, { TabBarItem } from "@/components/FloatingTabBar";
import { useWindowDimensions } from "react-native";

const TABS: TabBarItem[] = [
  { name: "(graph)", route: "/(tabs)/(graph)", icon: "show_chart", label: "Graph" },
  { name: "(track)", route: "/(tabs)/(track)", icon: "add_circle", label: "Track" },
  { name: "(chat)", route: "/(tabs)/(chat)", icon: "chat", label: "AI Chat" },
  { name: "(reports)", route: "/(tabs)/(reports)", icon: "description", label: "Reports" },
  { name: "(allergy)", route: "/(tabs)/(allergy)", icon: "coronavirus", label: "Allergy" },
  { name: "(profile)", route: "/(tabs)/(profile)", icon: "person", label: "Profile" },
];

export default function TabLayout() {
  const { width } = useWindowDimensions();
  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          tabs={TABS}
          containerWidth={width - 32}
          borderRadius={35}
          bottomMargin={20}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="(graph)" options={{ title: "Graph" }} />
      <Tabs.Screen name="(track)" options={{ title: "Track" }} />
      <Tabs.Screen name="(chat)" options={{ title: "AI Chat" }} />
      <Tabs.Screen name="(reports)" options={{ title: "Reports" }} />
      <Tabs.Screen name="(allergy)" options={{ title: "Allergy" }} />
      <Tabs.Screen name="(profile)" options={{ title: "Profile" }} />
    </Tabs>
  );
}
