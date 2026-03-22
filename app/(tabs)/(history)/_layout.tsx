import { Stack } from "expo-router";
import { COLORS } from "@/constants/Colors";

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerBlurEffect: "none",
        headerLargeTitle: true,
        headerBackButtonDisplayMode: "minimal",
        headerTintColor: COLORS.primary,
      }}
    >
      <Stack.Screen name="index" options={{ title: "History" }} />
    </Stack>
  );
}
