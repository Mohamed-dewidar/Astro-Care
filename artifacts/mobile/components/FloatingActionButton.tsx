import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FABAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

interface FABProps {
  actions: FABAction[];
}

export interface FABHandle {
  close: () => void;
}

export const FloatingActionButton = forwardRef<FABHandle, FABProps>(function FloatingActionButton(
  { actions },
  ref
) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(actions.map(() => new Animated.Value(0))).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    close: () => setOpen(false),
  }));

  useEffect(() => {
    const toValue = open ? 1 : 0;
    Animated.parallel([
      Animated.spring(rotateAnim, { toValue, useNativeDriver: true, tension: 100, friction: 8 }),
      Animated.timing(glowAnim, { toValue, duration: 200, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue, duration: 200, useNativeDriver: true }),
      ...itemAnims.map((anim, i) =>
        Animated.spring(anim, {
          toValue,
          useNativeDriver: true,
          delay: open ? i * 40 : (actions.length - 1 - i) * 40,
          tension: 120,
          friction: 8,
        })
      ),
    ]).start();
  }, [open]);

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  return (
    <>
      {open && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, { zIndex: 90 }]}
          onPress={() => setOpen(false)}
        />
      )}

      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents="none"
      />

      <View style={[styles.container, { bottom: insets.bottom + 90 }]}>
        {open && actions.map((action, i) => (
          <Animated.View
            key={action.label}
            style={[
              styles.actionContainer,
              {
                opacity: itemAnims[i],
                transform: [
                  { translateY: itemAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                  { scale: itemAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                ],
              },
            ]}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Pressable
              style={[styles.actionBtn, { borderColor: `${action.color}44`, backgroundColor: `${action.color}22` }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setOpen(false);
                action.onPress();
              }}
            >
              <Ionicons name={action.icon} size={20} color={action.color} />
            </Pressable>
          </Animated.View>
        ))}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setOpen(prev => !prev);
          }}
        >
          <Animated.View style={{ opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), position: "absolute", top: -4, left: -4, right: -4, bottom: -4, borderRadius: 36, backgroundColor: "rgba(124,58,237,0.3)" }} />
          <LinearGradient
            colors={["#7C3AED", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,7,18,0.7)",
    zIndex: 89,
  },
  container: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    zIndex: 100,
    gap: 12,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionLabel: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "rgba(11,16,38,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
