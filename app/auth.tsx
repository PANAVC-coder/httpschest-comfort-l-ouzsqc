import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { COLORS } from "@/constants/Colors";
import { Heart, Mail, Lock, User, Eye, EyeOff, ChevronDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthScreen() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const emailFormHeight = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/(log)");
    }
  }, [user]);

  const toggleEmailForm = () => {
    console.log("[Auth] Toggle email form, expanding:", !emailExpanded);
    const toValue = emailExpanded ? 0 : mode === "signup" ? 220 : 160;
    setEmailExpanded(!emailExpanded);
    Animated.spring(emailFormHeight, {
      toValue,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const handleModeSwitch = (newMode: "signin" | "signup") => {
    console.log("[Auth] Switching mode to:", newMode);
    setMode(newMode);
    setError("");
    if (emailExpanded) {
      const toValue = newMode === "signup" ? 220 : 160;
      Animated.spring(emailFormHeight, {
        toValue,
        useNativeDriver: false,
        tension: 60,
        friction: 10,
      }).start();
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    console.log("[Auth] Submitting email form, mode:", mode, "email:", email);
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      console.log("[Auth] Email auth success");
    } catch (err: any) {
      console.error("[Auth] Email auth error:", err);
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApple = async () => {
    console.log("[Auth] Sign in with Apple pressed");
    setError("");
    setIsSocialLoading("apple");
    try {
      await signInWithApple();
      console.log("[Auth] Apple sign in success");
    } catch (err: any) {
      console.error("[Auth] Apple sign in error:", err);
      if (!err?.message?.includes("cancel")) {
        setError(err?.message || "Apple sign in failed.");
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleGoogle = async () => {
    console.log("[Auth] Sign in with Google pressed");
    setError("");
    setIsSocialLoading("google");
    try {
      await signInWithGoogle();
      console.log("[Auth] Google sign in success");
    } catch (err: any) {
      console.error("[Auth] Google sign in error:", err);
      if (!err?.message?.includes("cancel")) {
        setError(err?.message || "Google sign in failed.");
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const isSignUp = mode === "signup";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: contentOpacity, alignItems: "center" }}>
          {/* Logo */}
          <Animated.View style={{ transform: [{ scale: logoScale }], marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: COLORS.primaryMuted,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: COLORS.border,
              }}
            >
              <Heart size={36} color={COLORS.primary} strokeWidth={2} fill={COLORS.primary} />
            </View>
          </Animated.View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: COLORS.text,
              letterSpacing: -0.5,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Chest Comfort Log
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: COLORS.textSecondary,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 40,
              maxWidth: 280,
            }}
          >
            Track your chest comfort, understand your patterns
          </Text>

          {/* Mode toggle */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: COLORS.surfaceSecondary,
              borderRadius: 12,
              padding: 4,
              marginBottom: 28,
              width: "100%",
            }}
          >
            {(["signin", "signup"] as const).map((m) => {
              const isActive = mode === m;
              const label = m === "signin" ? "Sign In" : "Sign Up";
              return (
                <AnimatedPressable
                  key={m}
                  onPress={() => handleModeSwitch(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: isActive ? COLORS.surface : "transparent",
                    boxShadow: isActive ? "0 1px 4px rgba(26,46,36,0.08)" : undefined,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isActive ? "600" : "400",
                      color: isActive ? COLORS.text : COLORS.textSecondary,
                    }}
                  >
                    {label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Apple Sign In */}
          <AnimatedPressable
            onPress={handleApple}
            disabled={isSocialLoading !== null}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              backgroundColor: "#000000",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              gap: 10,
            }}
          >
            {isSocialLoading === "apple" ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 22 }}></Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                  {isSignUp ? "Sign up with Apple" : "Sign in with Apple"}
                </Text>
              </>
            )}
          </AnimatedPressable>

          {/* Google Sign In */}
          <AnimatedPressable
            onPress={handleGoogle}
            disabled={isSocialLoading !== null}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              backgroundColor: COLORS.surface,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              gap: 10,
              borderWidth: 1.5,
              borderColor: COLORS.border,
              boxShadow: "0 1px 3px rgba(26,46,36,0.06)",
            }}
          >
            {isSocialLoading === "google" ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 16, lineHeight: 20 }}>🌐</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.text }}>
                  {isSignUp ? "Sign up with Google" : "Sign in with Google"}
                </Text>
              </>
            )}
          </AnimatedPressable>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ marginHorizontal: 12, fontSize: 13, color: COLORS.textTertiary }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View>

          {/* Email toggle */}
          <AnimatedPressable
            onPress={toggleEmailForm}
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              gap: 6,
              marginBottom: 4,
            }}
          >
            <Mail size={16} color={COLORS.primary} />
            <Text style={{ fontSize: 14, fontWeight: "500", color: COLORS.primary }}>
              {isSignUp ? "Sign up with email" : "Sign in with email"}
            </Text>
            <Animated.View style={{ transform: [{ rotate: emailExpanded ? "180deg" : "0deg" }] }}>
              <ChevronDown size={16} color={COLORS.primary} />
            </Animated.View>
          </AnimatedPressable>

          {/* Email form */}
          <Animated.View style={{ width: "100%", overflow: "hidden", height: emailFormHeight }}>
            <View style={{ paddingTop: 12, gap: 12 }}>
              {isSignUp && (
                <View>
                  <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.textSecondary, marginBottom: 6 }}>
                    Full name
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: COLORS.surfaceSecondary,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: nameFocused ? COLORS.primary : COLORS.border,
                      paddingHorizontal: 14,
                      height: 48,
                      gap: 10,
                    }}
                  >
                    <User size={16} color={COLORS.textTertiary} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Your name"
                      placeholderTextColor={COLORS.textTertiary}
                      autoCapitalize="words"
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      style={{ flex: 1, fontSize: 15, color: COLORS.text }}
                    />
                  </View>
                </View>
              )}

              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.textSecondary, marginBottom: 6 }}>
                  Email address
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.surfaceSecondary,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: emailFocused ? COLORS.primary : COLORS.border,
                    paddingHorizontal: 14,
                    height: 48,
                    gap: 10,
                  }}
                >
                  <Mail size={16} color={COLORS.textTertiary} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    style={{ flex: 1, fontSize: 15, color: COLORS.text }}
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: "500", color: COLORS.textSecondary, marginBottom: 6 }}>
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.surfaceSecondary,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: passwordFocused ? COLORS.primary : COLORS.border,
                    paddingHorizontal: 14,
                    height: 48,
                    gap: 10,
                  }}
                >
                  <Lock size={16} color={COLORS.textTertiary} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textTertiary}
                    secureTextEntry={!showPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    style={{ flex: 1, fontSize: 15, color: COLORS.text }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    {showPassword
                      ? <EyeOff size={16} color={COLORS.textTertiary} />
                      : <Eye size={16} color={COLORS.textTertiary} />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <Text style={{ fontSize: 13, color: COLORS.danger, textAlign: "center" }}>{error}</Text>
              ) : null}

              <AnimatedPressable
                onPress={handleEmailSubmit}
                disabled={isSubmitting}
                style={{
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: COLORS.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                    {isSignUp ? "Create account" : "Sign in"}
                  </Text>
                )}
              </AnimatedPressable>
            </View>
          </Animated.View>

          {error && !emailExpanded ? (
            <Text style={{ fontSize: 13, color: COLORS.danger, textAlign: "center", marginTop: 8 }}>{error}</Text>
          ) : null}

          <Text
            style={{
              fontSize: 12,
              color: COLORS.textTertiary,
              textAlign: "center",
              marginTop: 32,
              lineHeight: 18,
              maxWidth: 280,
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
