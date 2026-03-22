import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "auth" || segments[0] === "auth-callback" || segments[0] === "auth-popup";
    if (!user && !inAuthGroup) {
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/(graph)");
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    "DMSans-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
    "DMSans-Medium": require("../assets/fonts/SpaceMono-Regular.ttf"),
    "DMSans-SemiBold": require("../assets/fonts/SpaceMono-Bold.ttf"),
    "DMSans-Bold": require("../assets/fonts/SpaceMono-Bold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "#34C78A",
      background: "#F7FAF8",
      card: "#FFFFFF",
      text: "#1A2E24",
      border: "rgba(52, 199, 138, 0.15)",
      notification: "#EF4444",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#34C78A",
      background: "#0F1A14",
      card: "#1A2E24",
      text: "#F0FAF5",
      border: "rgba(52, 199, 138, 0.15)",
      notification: "#EF4444",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}>
        <SafeAreaProvider>
          <WidgetProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NavigationGuard>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                  <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="entry/[id]"
                    options={{
                      headerTransparent: true,
                      headerShadowVisible: false,
                      headerBackButtonDisplayMode: "minimal",
                      headerTintColor: "#34C78A",
                    }}
                  />
                </Stack>
              </NavigationGuard>
              <SystemBars style="auto" />
            </GestureHandlerRootView>
          </WidgetProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
