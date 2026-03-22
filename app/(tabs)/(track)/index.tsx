import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Stack } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { COLORS, comfortColor, comfortColorMuted } from "@/constants/Colors";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { apiPost } from "@/utils/api";
import { Check, Calendar } from "lucide-react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TRIGGERS = ["Stress", "Food", "Exercise", "Posture", "Weather", "Anxiety", "Caffeine", "Sleep"];

function SkeletonPulse({ width, height = 14, borderRadius = 8 }: { width: number | string; height?: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{ width, height, borderRadius, backgroundColor: COLORS.surfaceSecondary, opacity }}
    />
  );
}

export default function TrackScreen() {
  const [date, setDate] = useState(new Date());
  const [comfortLevel, setComfortLevel] = useState<number | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;

  const toggleTrigger = useCallback((trigger: string) => {
    console.log("[Track] Toggle trigger:", trigger);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  }, []);

  const handleSave = async () => {
    if (!comfortLevel) return;
    console.log("[Track] Save button pressed");
    console.log("[Track] Saving entry:", { date, comfortLevel, triggers: selectedTriggers, notes });
    setIsSaving(true);
    try {
      const payload = {
        date: date.toISOString(),
        comfortLevel,
        triggers: selectedTriggers,
        notes: notes.trim(),
      };
      console.log("[Track] POST /api/entries payload:", payload);
      await apiPost("/api/entries", payload);
      console.log("[Track] Entry saved successfully");

      if (Platform.OS === "ios") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setSaveSuccess(true);
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();

      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDate(new Date());
        setComfortLevel(null);
        setSelectedTriggers([]);
        setNotes("");
        setSaveSuccess(false);
        successScale.setValue(0);
      }, 1800);
    } catch (err: any) {
      console.error("[Track] Failed to save entry:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = comfortLevel !== null && !isSaving && !saveSuccess;

  const comfortLevelLabel = comfortLevel
    ? comfortLevel <= 2 ? "Severe" : comfortLevel <= 4 ? "Poor" : comfortLevel <= 6 ? "Fair" : comfortLevel <= 8 ? "Good" : "Excellent"
    : "";

  const saveButtonLabel = comfortLevel ? "Save entry" : "Select a comfort level";

  return (
    <>
      <Stack.Screen options={{ title: "Track" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Date/Time */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Calendar size={16} color={COLORS.primary} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary }}>
              Date & Time
            </Text>
          </View>
          <DateTimePicker
            value={date}
            mode="datetime"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(_, d) => {
              if (d) {
                console.log("[Track] Date changed:", d.toISOString());
                setDate(d);
              }
            }}
            themeVariant="light"
            accentColor={COLORS.primary}
            style={{ marginLeft: -8 }}
          />
        </View>

        {/* Comfort Level */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 4 }}>
            Comfort Level
          </Text>
          {comfortLevel ? (
            <Text style={{ fontSize: 13, color: comfortColor(comfortLevel), fontWeight: "500", marginBottom: 14 }}>
              {comfortLevel}
              {" — "}
              {comfortLevelLabel}
            </Text>
          ) : (
            <Text style={{ fontSize: 13, color: COLORS.textTertiary, marginBottom: 14 }}>
              Tap a number to select
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "nowrap" }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const isSelected = comfortLevel === n;
              const color = comfortColor(n);
              const mutedColor = comfortColorMuted(n);
              return (
                <AnimatedPressable
                  key={n}
                  onPress={() => {
                    console.log("[Track] Comfort level selected:", n);
                    setComfortLevel(n);
                  }}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 100,
                    backgroundColor: isSelected ? color : mutedColor,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: color + "40",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: isSelected ? "#FFFFFF" : color,
                    }}
                  >
                    {n}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Triggers */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 14 }}>
            Triggers
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TRIGGERS.map((trigger) => {
              const isSelected = selectedTriggers.includes(trigger);
              return (
                <AnimatedPressable
                  key={trigger}
                  onPress={() => toggleTrigger(trigger)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 100,
                    backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: isSelected ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: isSelected ? "#FFFFFF" : COLORS.textSecondary,
                    }}
                  >
                    {trigger}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: notesFocused ? COLORS.primary : COLORS.border,
            boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 10 }}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
            numberOfLines={4}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
            style={{
              fontSize: 15,
              color: COLORS.text,
              lineHeight: 22,
              minHeight: 88,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Save Button */}
        <AnimatedPressable
          onPress={() => {
            console.log("[Track] Save button pressed");
            handleSave();
          }}
          disabled={!canSave}
          style={{
            height: 56,
            borderRadius: 16,
            backgroundColor: saveSuccess ? "#22C55E" : COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          {isSaving ? (
            <SkeletonPulse width={120} height={16} borderRadius={8} />
          ) : saveSuccess ? (
            <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 8, transform: [{ scale: successScale }] }}>
              <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Entry saved!</Text>
            </Animated.View>
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: comfortLevel ? "#FFFFFF" : COLORS.textTertiary,
              }}
            >
              {saveButtonLabel}
            </Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </>
  );
}
