import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "rocket" as const,
    iconColor: "#7C3AED",
    title: "Welcome aboard,\nCaptain.",
    subtitle: "Your health mission starts here.",
    gradient: ["#1E0B4A", "#030712"] as [string, string],
  },
  {
    icon: "planet" as const,
    iconColor: "#3B82F6",
    title: "Build your\nnutrition galaxy.",
    subtitle: "Create meals, foods, and daily plans.",
    gradient: ["#0A1C4A", "#030712"] as [string, string],
  },
  {
    icon: "medical" as const,
    iconColor: "#22D3EE",
    title: "Never miss\na protocol.",
    subtitle: "Receive intelligent meal and medication reminders.",
    gradient: ["#043A4A", "#030712"] as [string, string],
  },
  {
    icon: "navigate" as const,
    iconColor: "#FBBF24",
    title: "Navigate toward\nbetter health.",
    subtitle: "Stay on track every day.",
    gradient: ["#2D1A04", "#030712"] as [string, string],
  },
];

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const goToSlide = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(index);
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goToSlide(current + 1);
    } else {
      completeOnboarding();
      router.replace("/(tabs)");
    }
  };

  const slide = SLIDES[current];

  const topPad = Platform.OS === "web" ? 80 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient
        colors={slide.gradient}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.starField}>
        {Array.from({ length: 40 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.sin(i * 2.3) * 50 + 50}%` as any,
                top: `${Math.cos(i * 1.7) * 45 + 45}%` as any,
                width: i % 5 === 0 ? 3 : 1.5,
                height: i % 5 === 0 ? 3 : 1.5,
                opacity: 0.3 + (i % 7) * 0.07,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.iconContainer, { borderColor: `${slide.iconColor}40`, backgroundColor: `${slide.iconColor}15` }]}>
          <Ionicons name={slide.icon} size={64} color={slide.iconColor} />
          <View style={[styles.iconGlow, { backgroundColor: slide.iconColor }]} />
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  i === current
                    ? { width: 24, backgroundColor: slide.iconColor }
                    : { width: 8, backgroundColor: "rgba(255,255,255,0.3)" },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleNext}>
          <LinearGradient
            colors={[slide.iconColor, `${slide.iconColor}AA`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {current < SLIDES.length - 1 ? "Continue" : "Begin Mission"}
            </Text>
            <Ionicons
              name={current < SLIDES.length - 1 ? "arrow-forward" : "rocket"}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>

        {current > 0 && (
          <Pressable onPress={() => goToSlide(current - 1)} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  starField: { ...StyleSheet.absoluteFillObject },
  star: { position: "absolute", borderRadius: 2, backgroundColor: "#FFFFFF" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconContainer: {
    width: 140, height: 140, borderRadius: 70, alignItems: "center",
    justifyContent: "center", borderWidth: 2, marginBottom: 48, overflow: "hidden",
  },
  iconGlow: {
    position: "absolute", width: 80, height: 80, borderRadius: 40, opacity: 0.15,
  },
  title: {
    color: "#F8FAFC", fontSize: 36, fontWeight: "800", textAlign: "center",
    letterSpacing: -0.5, lineHeight: 44,
  },
  subtitle: {
    color: "#94A3B8", fontSize: 17, textAlign: "center", marginTop: 16, lineHeight: 24,
  },
  footer: { width: "100%", paddingHorizontal: 24, gap: 20, alignItems: "center" },
  dots: { flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  button: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30,
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  backBtn: { paddingVertical: 8 },
  backText: { color: "#64748B", fontSize: 15 },
});
