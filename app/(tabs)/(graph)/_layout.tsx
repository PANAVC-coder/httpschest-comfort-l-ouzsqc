import { Stack } from "expo-router/stack";

export default function GraphLayout() {
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
