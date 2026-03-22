import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { TrendingUp } from "lucide-react-native";

const PRIMARY = "#34C78A";
const BACKGROUND = "#F7FAF8";
const TEXT = "#1A2E24";
const TEXT_SECONDARY = "#5A7A6A";

export default function GraphScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Graph" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: BACKGROUND }}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: PRIMARY + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <TrendingUp size={36} color={PRIMARY} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: "700", color: TEXT, marginBottom: 10, textAlign: "center" }}>
          Graph
        </Text>
        <Text style={{ fontSize: 15, color: TEXT_SECONDARY, textAlign: "center", lineHeight: 22 }}>
          View your chest comfort trends over time
        </Text>
      </ScrollView>
    </>
  );
}
