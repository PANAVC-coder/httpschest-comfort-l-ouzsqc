import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Stack } from "expo-router";
import { COLORS, comfortColor } from "@/constants/Colors";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { apiGet } from "@/utils/api";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react-native";

const TIME_RANGES = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

interface InsightsData {
  averageComfort: number;
  totalEntries: number;
  trend: "improving" | "worsening" | "stable";
  trendValue?: number;
  dailyAverages: { date: string; average: number; count: number }[];
  topTriggers: { trigger: string; count: number }[];
}

function SkeletonPulse({ width, height = 14, borderRadius = 8 }: { width: number | string; height?: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ width, height, borderRadius, backgroundColor: COLORS.surfaceSecondary, opacity }} />
  );
}

function SkeletonInsights() {
  return (
    <View style={{ gap: 16, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 }}>
          <SkeletonPulse width={60} height={12} />
          <SkeletonPulse width={40} height={28} />
        </View>
        <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 }}>
          <SkeletonPulse width={60} height={12} />
          <SkeletonPulse width={40} height={28} />
        </View>
        <View style={{ flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 }}>
          <SkeletonPulse width={60} height={12} />
          <SkeletonPulse width={40} height={28} />
        </View>
      </View>
      <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 12 }}>
        <SkeletonPulse width={100} height={14} />
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 }}>
          {[60, 40, 75, 50, 90, 35, 65].map((h, i) => (
            <View key={i} style={{ flex: 1, height: h, borderRadius: 4, backgroundColor: COLORS.surfaceSecondary }} />
          ))}
        </View>
      </View>
    </View>
  );
}

function BarChartView({ data }: { data: { date: string; average: number; count: number }[] }) {
  const { width } = useWindowDimensions();
  const maxVal = 10;
  const barWidth = 28;
  const chartHeight = 100;

  const formatBarDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4, gap: 8, flexDirection: "row", alignItems: "flex-end" }}
    >
      {data.map((item, index) => {
        const barHeight = Math.max(4, (item.average / maxVal) * chartHeight);
        const color = comfortColor(Math.round(item.average));
        const dateLabel = formatBarDate(item.date);
        return (
          <View key={index} style={{ alignItems: "center", gap: 4, width: barWidth }}>
            <Text style={{ fontSize: 10, fontWeight: "600", color, marginBottom: 2 }}>
              {Number(item.average).toFixed(1)}
            </Text>
            <View
              style={{
                width: barWidth - 4,
                height: barHeight,
                borderRadius: 6,
                backgroundColor: color,
                opacity: 0.85,
              }}
            />
            <Text style={{ fontSize: 9, color: COLORS.textTertiary, textAlign: "center" }} numberOfLines={1}>
              {dateLabel}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function InsightsScreen() {
  const [selectedDays, setSelectedDays] = useState(7);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchInsights = useCallback(async (days: number) => {
    console.log("[Insights] Fetching insights for", days, "days from GET /api/insights?days=" + days);
    setLoading(true);
    setError("");
    try {
      const result = await apiGet<InsightsData>(`/api/insights?days=${days}`);
      console.log("[Insights] Received insights data:", result);
      setData(result);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err: any) {
      console.error("[Insights] Failed to fetch insights:", err);
      setError("Couldn't load insights. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [fadeAnim]);

  useEffect(() => {
    fetchInsights(selectedDays);
  }, [selectedDays]);

  const handleRangeChange = (days: number) => {
    console.log("[Insights] Time range changed to:", days, "days");
    setSelectedDays(days);
  };

  const trendIcon = data?.trend === "improving"
    ? <TrendingUp size={16} color={COLORS.primary} />
    : data?.trend === "worsening"
    ? <TrendingDown size={16} color={COLORS.danger} />
    : <Minus size={16} color={COLORS.amber} />;

  const trendLabel = data?.trend === "improving"
    ? "Improving"
    : data?.trend === "worsening"
    ? "Worsening"
    : "Stable";

  const trendColor = data?.trend === "improving"
    ? COLORS.primary
    : data?.trend === "worsening"
    ? COLORS.danger
    : COLORS.amber;

  const trendMuted = data?.trend === "improving"
    ? COLORS.primaryMuted
    : data?.trend === "worsening"
    ? COLORS.dangerMuted
    : COLORS.amberMuted;

  const avgColor = data ? comfortColor(Math.round(data.averageComfort)) : COLORS.textTertiary;
  const avgDisplay = data ? Number(data.averageComfort).toFixed(1) : "—";
  const totalDisplay = data ? String(data.totalEntries) : "—";

  return (
    <>
      <Stack.Screen options={{ title: "Insights" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Time range selector */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {TIME_RANGES.map((range) => {
              const isActive = selectedDays === range.value;
              return (
                <AnimatedPressable
                  key={range.value}
                  onPress={() => handleRangeChange(range.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: isActive ? COLORS.surface : "transparent",
                    boxShadow: isActive ? "0 1px 4px rgba(26,46,36,0.08)" : undefined,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? COLORS.text : COLORS.textSecondary,
                    }}
                  >
                    {range.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {loading ? (
          <SkeletonInsights />
        ) : error ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: COLORS.text, marginBottom: 8, textAlign: "center" }}>
              Couldn't load insights
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 20 }}>
              {error}
            </Text>
            <AnimatedPressable
              onPress={() => fetchInsights(selectedDays)}
              style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primaryMuted }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.primary }}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : !data || data.totalEntries === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: COLORS.primaryMuted,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <BarChart2 size={32} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "600", color: COLORS.text, marginBottom: 8 }}>
              No data yet
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20, maxWidth: 260 }}>
              Log a few entries to start seeing your comfort trends and patterns
            </Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, gap: 16 }}>
            {/* Summary cards */}
            <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20 }}>
              {/* Average comfort */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04)",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "500", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Avg
                </Text>
                <Text style={{ fontSize: 26, fontWeight: "700", color: avgColor, letterSpacing: -0.5 }}>
                  {avgDisplay}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>comfort</Text>
              </View>

              {/* Total entries */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04)",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "500", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total
                </Text>
                <Text style={{ fontSize: 26, fontWeight: "700", color: COLORS.text, letterSpacing: -0.5 }}>
                  {totalDisplay}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>entries</Text>
              </View>

              {/* Trend */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04)",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "500", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Trend
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: trendMuted,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    alignSelf: "flex-start",
                    marginTop: 2,
                  }}
                >
                  {trendIcon}
                  <Text style={{ fontSize: 11, fontWeight: "600", color: trendColor }}>
                    {trendLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily chart */}
            {data.dailyAverages && data.dailyAverages.length > 0 && (
              <View
                style={{
                  marginHorizontal: 20,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 16 }}>
                  Daily averages
                </Text>
                <View style={{ height: 140, justifyContent: "flex-end" }}>
                  <BarChartView data={data.dailyAverages} />
                </View>
              </View>
            )}

            {/* Top triggers */}
            {data.topTriggers && data.topTriggers.length > 0 && (
              <View
                style={{
                  marginHorizontal: 20,
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 14 }}>
                  Top triggers
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {data.topTriggers.map((item) => (
                    <View
                      key={item.trigger}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 100,
                        backgroundColor: COLORS.primaryMuted,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.primary }}>
                        {item.trigger}
                      </Text>
                      <View
                        style={{
                          backgroundColor: COLORS.primary,
                          borderRadius: 100,
                          minWidth: 18,
                          height: 18,
                          alignItems: "center",
                          justifyContent: "center",
                          paddingHorizontal: 5,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFFFFF" }}>
                          {item.count}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </>
  );
}
