import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// ─── Locale detection (12 vs 24-hour clock) ──────────────────────────────────

function detectIs12Hour(): boolean {
  try {
    const formatted = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      hour12: undefined,
    }).format(new Date(2000, 0, 1, 13, 0, 0));
    return /[AaPp][Mm]/.test(formatted);
  } catch {
    return false;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H = 40;    // height of each row
const VISIBLE = 3;   // rows visible in the drum (odd: center = selected)
const PAD = Math.floor(VISIBLE / 2); // 1 padding row top + bottom

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0"));
const MINUTES  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const AMPM     = ["AM", "PM"];

// ─── Single scroll column ────────────────────────────────────────────────────

interface WheelProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
}

function Wheel({ items, selectedIndex, onChange, width = 64 }: WheelProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [curIdx, setCurIdx] = useState(selectedIndex);
  const curIdxRef = useRef(selectedIndex);
  const isMounted = useRef(false);

  // Scroll to initial position once
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      isMounted.current = true;
    }, 60);
    return () => clearTimeout(t);
  }, []);

  // Keep in sync if parent changes value (e.g. AM/PM switch recalculates hour)
  useEffect(() => {
    if (!isMounted.current) return;
    if (selectedIndex === curIdxRef.current) return;
    curIdxRef.current = selectedIndex;
    setCurIdx(selectedIndex);
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: true });
  }, [selectedIndex]);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      if (clamped !== curIdxRef.current) {
        curIdxRef.current = clamped;
        setCurIdx(clamped);
        onChange(clamped);
      }
    },
    [items.length, onChange]
  );

  return (
    <View style={[styles.wheelOuter, { width }]}>
      {/* Purple glass selection rail behind center row */}
      <View style={styles.selectorRail} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        style={{ height: ITEM_H * VISIBLE }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={8}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        contentContainerStyle={{
          paddingTop: ITEM_H * PAD,
          paddingBottom: ITEM_H * PAD,
        }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - curIdx);
          const isSelected = dist === 0;
          return (
            <View key={item + i} style={styles.itemRow}>
              <Text
                style={[
                  styles.itemBase,
                  isSelected ? styles.itemSelected : dist === 1 ? styles.itemNear : styles.itemFar,
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Gradient fade — top */}
      <LinearGradient
        colors={["#030712", "rgba(3,7,18,0)"]}
        style={[styles.fade, styles.fadeTop]}
        pointerEvents="none"
      />
      {/* Gradient fade — bottom */}
      <LinearGradient
        colors={["rgba(3,7,18,0)", "#030712"]}
        style={[styles.fade, styles.fadeBottom]}
        pointerEvents="none"
      />
    </View>
  );
}

// ─── Public TimePicker ────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string;           // always stored as "HH:MM" 24-hour
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const is12 = useMemo(detectIs12Hour, []);

  const parts   = value.split(":");
  const hour24  = Math.min(parseInt(parts[0] ?? "8", 10), 23);
  const minute  = Math.min(parseInt(parts[1] ?? "0", 10), 59);

  // Derive 12-hour state
  const isPM   = hour24 >= 12;
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  // Index in HOURS_12: "12"=0, "01"=1, …, "11"=11
  const hour12Idx = hour12 === 12 ? 0 : hour12;

  // ── 24-hour handlers ──────────────────────────────────────────────────────
  const handle24Hour = useCallback(
    (i: number) => onChange(`${String(i).padStart(2, "0")}:${String(minute).padStart(2, "0")}`),
    [minute, onChange]
  );

  // ── 12-hour handlers ──────────────────────────────────────────────────────
  const handle12Hour = useCallback(
    (i: number) => {
      // i is 0..11, but HOURS_12[0] = "12", [1] = "01", etc.
      const displayHour = i === 0 ? 12 : i;
      let h24 = isPM ? (displayHour === 12 ? 12 : displayHour + 12) : (displayHour === 12 ? 0 : displayHour);
      onChange(`${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    },
    [minute, isPM, onChange]
  );

  const handleMinute = useCallback(
    (i: number) => {
      onChange(`${String(hour24).padStart(2, "0")}:${String(i).padStart(2, "0")}`);
    },
    [hour24, onChange]
  );

  const toggleAMPM = useCallback(() => {
    let newH = isPM ? hour24 - 12 : hour24 + 12;
    newH = Math.max(0, Math.min(23, newH));
    onChange(`${String(newH).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  }, [isPM, hour24, minute, onChange]);

  // Format preview
  const preview = useMemo(() => {
    if (is12) {
      const h = hour12 === 0 ? 12 : hour12;
      return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
    }
    return value;
  }, [is12, hour12, minute, isPM, value]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.wheelRow}>
        {is12 ? (
          <>
            <Wheel
              key="h12"
              items={HOURS_12}
              selectedIndex={hour12Idx}
              onChange={handle12Hour}
              width={56}
            />
            <Text style={styles.separator}>:</Text>
            <Wheel
              key="min12"
              items={MINUTES}
              selectedIndex={minute}
              onChange={handleMinute}
              width={56}
            />
            {/* AM / PM toggle */}
            <Pressable onPress={toggleAMPM} style={styles.ampmBtn}>
              <Text style={[styles.ampmText, !isPM && styles.ampmActive]}>AM</Text>
              <Text style={[styles.ampmText, isPM && styles.ampmActive]}>PM</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Wheel
              key="h24"
              items={HOURS_24}
              selectedIndex={hour24}
              onChange={handle24Hour}
              width={56}
            />
            <Text style={styles.separator}>:</Text>
            <Wheel
              key="min24"
              items={MINUTES}
              selectedIndex={minute}
              onChange={handleMinute}
              width={56}
            />
          </>
        )}
      </View>

      <Text style={styles.preview}>{preview}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  label: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  wheelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelOuter: {
    height: ITEM_H * VISIBLE,
    overflow: "hidden",
    position: "relative",
  },
  selectorRail: {
    position: "absolute",
    top: ITEM_H * PAD,
    left: 4,
    right: 4,
    height: ITEM_H,
    borderRadius: 10,
    backgroundColor: "rgba(124,58,237,0.18)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.5)",
    zIndex: 1,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ITEM_H * PAD,
    zIndex: 2,
    ...(Platform.OS === "web" ? { pointerEvents: "none" } : {}),
  },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
  itemRow: {
    height: ITEM_H,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBase: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  itemSelected: {
    color: "#F8FAFC",
    fontSize: 26,
    fontWeight: "700",
  },
  itemNear: {
    color: "#475569",
    fontSize: 17,
    fontWeight: "400",
    opacity: 0.7,
  },
  itemFar: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "400",
    opacity: 0.3,
  },
  separator: {
    color: "#7C3AED",
    fontSize: 24,
    fontWeight: "700",
    marginHorizontal: 2,
    marginBottom: 2,
  },
  preview: {
    color: "#6D28D9",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginTop: 6,
  },
  // AM/PM toggle
  ampmBtn: {
    marginLeft: 10,
    backgroundColor: "rgba(124,58,237,0.1)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.3)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    alignItems: "center",
  },
  ampmText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  ampmActive: {
    color: "#A78BFA",
    fontWeight: "700",
  },
});
