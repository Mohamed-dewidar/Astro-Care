import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  glowColor?: string;
  noBorder?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  glowColor,
  noBorder = false,
}: GlassCardProps) {
  const isIOS = Platform.OS === "ios";

  const borderStyle = noBorder
    ? {}
    : { borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" };

  const glowStyle = glowColor
    ? {
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }
    : {};

  if (isIOS) {
    return (
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[styles.card, borderStyle, glowStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.card, styles.fallback, borderStyle, glowStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  fallback: {
    backgroundColor: "rgba(11,16,38,0.85)",
  },
});
