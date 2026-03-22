import { Stack } from "expo-router";
import { COLORS } from "@/constants/Colors";

export default function LogLayout() {
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
      <Stack.Screen name="index" options={{ title: "Log Entry" }} />
    </Stack>
  );
}
