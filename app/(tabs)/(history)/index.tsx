import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Animated,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { COLORS, comfortColor, comfortColorMuted, comfortLabel } from "@/constants/Colors";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { apiGet, apiDelete } from "@/utils/api";
import { Trash2, PlusCircle, RotateCcw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Entry {
  id: string;
  date: string;
  comfortLevel: number;
  triggers: string[];
  notes?: string;
}

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (entryDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (entryDay.getTime() === yesterday.getTime()) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + `, ${timeStr}`;
}

function SkeletonCard() {
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
    <Animated.View
      style={{
        opacity,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ width: 140, height: 14, borderRadius: 7, backgroundColor: COLORS.surfaceSecondary }} />
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceSecondary }} />
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <View style={{ width: 60, height: 26, borderRadius: 13, backgroundColor: COLORS.surfaceSecondary }} />
        <View style={{ width: 70, height: 26, borderRadius: 13, backgroundColor: COLORS.surfaceSecondary }} />
      </View>
      <View style={{ width: "80%", height: 12, borderRadius: 6, backgroundColor: COLORS.surfaceSecondary }} />
    </Animated.View>
  );
}

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

function UndoToast({ message, onUndo, onDismiss }: { message: string; onUndo: () => void; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(80)).current;
  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: COLORS.text,
        borderRadius: 14,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        transform: [{ translateY }],
        zIndex: 999,
        boxShadow: "0 4px 20px rgba(26,46,36,0.2)",
      }}
    >
      <Text style={{ fontSize: 14, color: "#FFFFFF", flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={onUndo} style={{ paddingLeft: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <RotateCcw size={14} color={COLORS.primary} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.primary }}>Undo</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [undoEntry, setUndoEntry] = useState<Entry | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchEntries = useCallback(async () => {
    console.log("[History] Fetching entries from GET /api/entries");
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<Entry[]>("/api/entries");
      console.log("[History] Fetched", data?.length ?? 0, "entries");
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("[History] Failed to fetch entries:", err);
      setError("Couldn't load your entries. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = useCallback(async (entry: Entry) => {
    console.log("[History] Deleting entry:", entry.id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setUndoEntry(entry);
    try {
      await apiDelete(`/api/entries/${entry.id}`);
      console.log("[History] Entry deleted:", entry.id);
    } catch (err) {
      console.error("[History] Delete failed, restoring entry:", err);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setEntries((prev) => [entry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, []);

  const handleUndo = useCallback(async () => {
    if (!undoEntry) return;
    console.log("[History] Undoing delete for entry:", undoEntry.id);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEntries((prev) => [undoEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setUndoEntry(null);
  }, [undoEntry]);

  const renderEntry = useCallback(({ item, index }: { item: Entry; index: number }) => {
    const color = comfortColor(item.comfortLevel);
    const mutedColor = comfortColorMuted(item.comfortLevel);
    const label = comfortLabel(item.comfortLevel);
    const dateStr = formatEntryDate(item.date);
    const triggers = Array.isArray(item.triggers) ? item.triggers : [];
    const visibleTriggers = triggers.slice(0, 3);
    const extraCount = triggers.length - 3;

    return (
      <AnimatedListItem index={index}>
        <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
          <AnimatedPressable
            onPress={() => {
              console.log("[History] Navigating to entry detail:", item.id);
              router.push(`/entry/${item.id}`);
            }}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
            }}
          >
            {/* Header row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" }}>
                {dateStr}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: mutedColor,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: color + "40",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color }}>{item.comfortLevel}</Text>
                </View>
                <AnimatedPressable
                  onPress={() => handleDelete(item)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: COLORS.dangerMuted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={15} color={COLORS.danger} />
                </AnimatedPressable>
              </View>
            </View>

            {/* Label */}
            <Text style={{ fontSize: 13, fontWeight: "600", color, marginBottom: 8 }}>
              {label}
            </Text>

            {/* Triggers */}
            {triggers.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {visibleTriggers.map((t) => (
                  <View
                    key={t}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 100,
                      backgroundColor: COLORS.primaryMuted,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "500", color: COLORS.primary }}>{t}</Text>
                  </View>
                ))}
                {extraCount > 0 && (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 100,
                      backgroundColor: COLORS.surfaceSecondary,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "500", color: COLORS.textSecondary }}>
                      +{extraCount} more
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Notes */}
            {item.notes ? (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ fontSize: 13, color: COLORS.textTertiary, lineHeight: 18 }}
              >
                {item.notes}
              </Text>
            ) : null}
          </AnimatedPressable>
        </View>
      </AnimatedListItem>
    );
  }, [handleDelete, router]);

  return (
    <>
      <Stack.Screen options={{ title: "History" }} />
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {loading ? (
          <View style={{ paddingTop: 120 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: COLORS.text, marginBottom: 8, textAlign: "center" }}>
              Couldn't load entries
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 20 }}>
              {error}
            </Text>
            <AnimatedPressable
              onPress={fetchEntries}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: COLORS.primaryMuted,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.primary }}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : entries.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
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
              <PlusCircle size={32} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "600", color: COLORS.text, marginBottom: 8 }}>
              No entries yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 24,
                maxWidth: 260,
              }}
            >
              Start logging to track your chest comfort over time
            </Text>
            <AnimatedPressable
              onPress={() => {
                console.log("[History] Navigate to log tab");
                router.push("/(tabs)/(log)");
              }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>Log your first entry</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {undoEntry && (
          <UndoToast
            message="Entry deleted"
            onUndo={handleUndo}
            onDismiss={() => setUndoEntry(null)}
          />
        )}
      </View>
    </>
  );
}
