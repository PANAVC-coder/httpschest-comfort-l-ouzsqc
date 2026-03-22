import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { COLORS, comfortColor, comfortColorMuted, comfortLabel } from "@/constants/Colors";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { apiGet, apiPut, apiDelete } from "@/utils/api";
import { Pencil, Trash2, X, Check, Calendar } from "lucide-react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TRIGGERS = ["Stress", "Food", "Exercise", "Posture", "Weather", "Anxiety", "Caffeine", "Sleep"];

interface Entry {
  id: string;
  date: string;
  comfortLevel: number;
  triggers: string[];
  notes?: string;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
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

function DeleteConfirmModal({
  visible,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(26,46,36,0.5)",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 340,
            boxShadow: "0 8px 32px rgba(26,46,36,0.2)",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>
            Delete this entry?
          </Text>
          <Text style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 24 }}>
            This action cannot be undone. The entry will be permanently removed.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <AnimatedPressable
              onPress={onCancel}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                backgroundColor: COLORS.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.text }}>Cancel</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={onConfirm}
              disabled={isDeleting}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                backgroundColor: COLORS.danger,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Delete entry</Text>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditModal({
  visible,
  entry,
  onSave,
  onClose,
}: {
  visible: boolean;
  entry: Entry;
  onSave: (updated: Partial<Entry>) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(new Date(entry.date));
  const [comfortLevel, setComfortLevel] = useState(entry.comfortLevel);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(entry.triggers || []);
  const [notes, setNotes] = useState(entry.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(new Date(entry.date));
      setComfortLevel(entry.comfortLevel);
      setSelectedTriggers(entry.triggers || []);
      setNotes(entry.notes || "");
    }
  }, [visible, entry]);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSave = async () => {
    console.log("[EntryDetail] Saving edit for entry:", entry.id);
    setIsSaving(true);
    try {
      await onSave({
        date: date.toISOString(),
        comfortLevel,
        triggers: selectedTriggers,
        notes: notes.trim(),
      });
      console.log("[EntryDetail] Edit saved successfully");
      onClose();
    } catch (err) {
      console.error("[EntryDetail] Edit save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <AnimatedPressable onPress={onClose}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <X size={20} color={COLORS.textSecondary} />
              <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>Cancel</Text>
            </View>
          </AnimatedPressable>
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>Edit Entry</Text>
          <AnimatedPressable onPress={handleSave} disabled={isSaving}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              {isSaving ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <Check size={18} color={COLORS.primary} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary }}>Save</Text>
                </>
              )}
            </View>
          </AnimatedPressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Date */}
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Calendar size={16} color={COLORS.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary }}>Date & Time</Text>
            </View>
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_, d) => { if (d) setDate(d); }}
              themeVariant="light"
              accentColor={COLORS.primary}
              style={{ marginLeft: -8 }}
            />
          </View>

          {/* Comfort Level */}
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 14 }}>
              Comfort Level
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const isSelected = comfortLevel === n;
                const color = comfortColor(n);
                const mutedColor = comfortColorMuted(n);
                return (
                  <AnimatedPressable
                    key={n}
                    onPress={() => setComfortLevel(n)}
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
                    <Text style={{ fontSize: 13, fontWeight: "700", color: isSelected ? "#FFFFFF" : color }}>{n}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>

          {/* Triggers */}
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 14 }}>Triggers</Text>
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
                    <Text style={{ fontSize: 13, fontWeight: "500", color: isSelected ? "#FFFFFF" : COLORS.textSecondary }}>
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
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 10 }}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={4}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
              style={{ fontSize: 15, color: COLORS.text, lineHeight: 22, minHeight: 88, textAlignVertical: "top" }}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchEntry = useCallback(async () => {
    if (!id) return;
    console.log("[EntryDetail] Fetching entry from GET /api/entries/" + id);
    setLoading(true);
    setError("");
    try {
      const data = await apiGet<Entry>(`/api/entries/${id}`);
      console.log("[EntryDetail] Fetched entry:", data);
      setEntry(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } catch (err: any) {
      console.error("[EntryDetail] Failed to fetch entry:", err);
      setError("Couldn't load this entry.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const handleEdit = async (updated: Partial<Entry>) => {
    if (!entry) return;
    console.log("[EntryDetail] PUT /api/entries/" + entry.id, updated);
    await apiPut(`/api/entries/${entry.id}`, updated);
    setEntry({ ...entry, ...updated } as Entry);
    if (Platform.OS === "ios") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    console.log("[EntryDetail] DELETE /api/entries/" + entry.id);
    setIsDeleting(true);
    try {
      await apiDelete(`/api/entries/${entry.id}`);
      console.log("[EntryDetail] Entry deleted, navigating back");
      if (Platform.OS === "ios") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      router.back();
    } catch (err) {
      console.error("[EntryDetail] Delete failed:", err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const headerTitle = entry ? formatFullDate(entry.date) : "Entry";
  const color = entry ? comfortColor(entry.comfortLevel) : COLORS.textTertiary;
  const mutedColor = entry ? comfortColorMuted(entry.comfortLevel) : COLORS.surfaceSecondary;
  const label = entry ? comfortLabel(entry.comfortLevel) : "";
  const timeStr = entry ? formatTime(entry.date) : "";
  const triggers = entry?.triggers ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          title: headerTitle,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <AnimatedPressable
                onPress={() => {
                  console.log("[EntryDetail] Edit button pressed");
                  setShowEdit(true);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.primaryMuted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Pencil size={16} color={COLORS.primary} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => {
                  console.log("[EntryDetail] Delete button pressed");
                  setShowDeleteConfirm(true);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: COLORS.dangerMuted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={16} color={COLORS.danger} />
              </AnimatedPressable>
            </View>
          ),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ gap: 16, paddingTop: 16 }}>
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, gap: 12 }}>
              <SkeletonPulse width={80} height={60} borderRadius={12} />
              <SkeletonPulse width={120} height={16} />
              <SkeletonPulse width={80} height={14} />
            </View>
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 10 }}>
              <SkeletonPulse width={80} height={14} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SkeletonPulse width={70} height={28} borderRadius={14} />
                <SkeletonPulse width={80} height={28} borderRadius={14} />
              </View>
            </View>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 17, fontWeight: "600", color: COLORS.text, marginBottom: 8 }}>Couldn't load entry</Text>
            <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: 20 }}>{error}</Text>
            <AnimatedPressable
              onPress={fetchEntry}
              style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primaryMuted }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.primary }}>Try again</Text>
            </AnimatedPressable>
          </View>
        ) : entry ? (
          <Animated.View style={{ opacity: fadeAnim, gap: 16 }}>
            {/* Comfort level hero */}
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: COLORS.border,
                boxShadow: "0 1px 3px rgba(26,46,36,0.04), 0 4px 12px rgba(26,46,36,0.03)",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: mutedColor,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: color + "40",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 36, fontWeight: "800", color, letterSpacing: -1 }}>
                  {entry.comfortLevel}
                </Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: "700", color, marginBottom: 4 }}>
                {label}
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
                {timeStr}
              </Text>
            </View>

            {/* Triggers */}
            {triggers.length > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                  Triggers
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {triggers.map((t) => (
                    <View
                      key={t}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: COLORS.primaryMuted,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.primary }}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Notes */}
            {entry.notes ? (
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  boxShadow: "0 1px 3px rgba(26,46,36,0.04)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  Notes
                </Text>
                <Text selectable style={{ fontSize: 15, color: COLORS.text, lineHeight: 22 }}>
                  {entry.notes}
                </Text>
              </View>
            ) : null}

            {/* Delete button */}
            <AnimatedPressable
              onPress={() => {
                console.log("[EntryDetail] Delete button (bottom) pressed");
                setShowDeleteConfirm(true);
              }}
              style={{
                height: 52,
                borderRadius: 14,
                backgroundColor: COLORS.dangerMuted,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Trash2 size={18} color={COLORS.danger} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.danger }}>Delete entry</Text>
            </AnimatedPressable>
          </Animated.View>
        ) : null}
      </ScrollView>

      {entry && (
        <EditModal
          visible={showEdit}
          entry={entry}
          onSave={handleEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
