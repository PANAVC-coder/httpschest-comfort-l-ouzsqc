import { Stack } from "expo-router/stack";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerLargeTitle: true,
        headerBackButtonDisplayMode: "minimal",
      }}
    />
  );
}
