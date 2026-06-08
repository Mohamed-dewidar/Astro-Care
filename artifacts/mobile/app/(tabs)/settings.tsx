import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { ProgressRing } from "@/components/ProgressRing";
import { SpaceBackground } from "@/components/SpaceBackground";
import { useApp } from "@/context/AppContext";
import {
  getNotificationPermissionStatus,
  getScheduledNotificationCount,
  requestNotificationPermissions,
  type NotifPermStatus,
} from "@/utils/notifications";

const ACHIEVEMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "first-mission": "rocket",
  "7-day-streak": "repeat",
  "perfect-day": "star",
  "nutrition-commander": "trophy",
  "medication-master": "medical",
  "galaxy-explorer": "planet",
};

const ACHIEVEMENT_COLORS: Record<string, string> = {
  "first-mission": "#7C3AED",
  "7-day-streak": "#FB923C",
  "perfect-day": "#FBBF24",
  "nutrition-commander": "#22D3EE",
  "medication-master": "#3B82F6",
  "galaxy-explorer": "#22C55E",
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    achievements,
    todayStats,
    currentStreak,
    foods,
    todayMeals,
    todaysMedication,
  } = useApp();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const topPad = Platform.OS === "web" ? 80 : insets.top;
  const weeklyAdherence = 72;

  const [notifStatus, setNotifStatus] =
    useState<NotifPermStatus>("undetermined");
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    (async () => {
      const status = await getNotificationPermissionStatus();
      setNotifStatus(status);
      const count = await getScheduledNotificationCount();
      setScheduledCount(count);
    })();
  }, []);

  const handleEnableNotifications = async () => {
    const status = await requestNotificationPermissions();
    setNotifStatus(status);
    if (status === "granted") {
      const count = await getScheduledNotificationCount();
      setScheduledCount(count);
    } else if (status === "denied" && Platform.OS !== "web") {
      Alert.alert(
        "Notifications Blocked",
        "Open Settings → AstroCare → Notifications to allow alerts.",
        [{ text: "OK" }],
      );
    }
  };

  const notifStatusConfig = {
    granted: {
      label: "Active",
      sublabel: `${scheduledCount} reminders queued for today`,
      color: "#22C55E",
      icon: "notifications" as const,
    },
    denied: {
      label: "Blocked",
      sublabel: "Enable in your device Settings app",
      color: "#EF4444",
      icon: "notifications-off" as const,
    },
    undetermined: {
      label: "Not set up",
      sublabel: "Tap to enable mission reminders",
      color: "#FBBF24",
      icon: "notifications-outline" as const,
    },
  };
  const notifConfig = notifStatusConfig[notifStatus];

  return (
    <View style={styles.container}>
      <SpaceBackground />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 12, paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.profileCard} glowColor="#7C3AED">
          <LinearGradient
            colors={["rgba(124,58,237,0.2)", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={["#7C3AED", "#3B82F6"]}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.captainLabel}>Mission Commander</Text>
              <Text style={styles.captainName}>Captain</Text>
              <View style={styles.rankRow}>
                <Ionicons name="flame" size={14} color="#FBBF24" />
                <Text style={styles.rankText}>{currentStreak}-day streak</Text>
              </View>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementCount}>
                {unlockedCount}/{achievements.length}
              </Text>
              <Text style={styles.achievementLabel}>Badges</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <ProgressRing
              size={72}
              strokeWidth={6}
              progress={todayStats.adherence}
              gradientColors={["#7C3AED", "#22D3EE"]}
              label={`${todayStats.adherence}%`}
            />
            <Text style={styles.statCardLabel}>Today</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <ProgressRing
              size={72}
              strokeWidth={6}
              progress={weeklyAdherence}
              color="#3B82F6"
              label={`${weeklyAdherence}%`}
            />
            <Text style={styles.statCardLabel}>This Week</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <View style={styles.simpleStatValue}>
              <Text style={styles.bigNumber}>{currentStreak}</Text>
              <Ionicons name="flame" size={16} color="#FB923C" />
            </View>
            <Text style={styles.statCardLabel}>Streak</Text>
          </GlassCard>
        </View>

        <View style={styles.quickStats}>
          {[
            {
              label: "Foods",
              value: foods.length,
              icon: "nutrition" as const,
              color: "#22D3EE",
            },
            {
              label: "Meals Today",
              value: todayMeals.length,
              icon: "planet" as const,
              color: "#3B82F6",
            },
            {
              label: "Meds Today",
              value: todaysMedication.length,
              icon: "medical" as const,
              color: "#7C3AED",
            },
            {
              label: "Completed",
              value: todayStats.mealsCompleted + todayStats.medsCompleted,
              icon: "checkmark-circle" as const,
              color: "#22C55E",
            },
          ].map((stat) => (
            <GlassCard key={stat.label} style={styles.quickStatCard}>
              <View
                style={[
                  styles.quickStatIcon,
                  { backgroundColor: `${stat.color}20` },
                ]}
              >
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text style={styles.quickStatValue}>{stat.value}</Text>
              <Text style={styles.quickStatLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Notification Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Comms</Text>
          <GlassCard style={styles.notifCard} glowColor={notifConfig.color}>
            <View style={styles.notifRow}>
              <View
                style={[
                  styles.notifIcon,
                  {
                    backgroundColor: `${notifConfig.color}20`,
                    borderColor: `${notifConfig.color}44`,
                  },
                ]}
              >
                <Ionicons
                  name={notifConfig.icon}
                  size={22}
                  color={notifConfig.color}
                />
              </View>
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>Push Notifications</Text>
                <Text
                  style={[styles.notifStatus, { color: notifConfig.color }]}
                >
                  {notifConfig.label}
                </Text>
                <Text style={styles.notifSublabel}>{notifConfig.sublabel}</Text>
              </View>
            </View>

            {notifStatus !== "granted" && Platform.OS !== "web" && (
              <Pressable
                style={styles.notifBtn}
                onPress={handleEnableNotifications}
              >
                <LinearGradient
                  colors={["#7C3AED", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.notifBtnGradient}
                >
                  <Ionicons name="notifications" size={16} color="#FFFFFF" />
                  <Text style={styles.notifBtnText}>
                    {notifStatus === "denied"
                      ? "Open Settings"
                      : "Enable Notifications"}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

            {notifStatus === "granted" && (
              <View style={styles.notifTypes}>
                <View style={styles.notifTypeRow}>
                  <Ionicons name="planet" size={14} color="#3B82F6" />
                  <Text style={styles.notifTypeText}>
                    Meal reminders — 15 min early + at launch time
                  </Text>
                </View>
                <View style={styles.notifTypeRow}>
                  <Ionicons name="medical" size={14} color="#22D3EE" />
                  <Text style={styles.notifTypeText}>
                    Medication alerts — auto-adjusted to actual meal time
                  </Text>
                </View>
              </View>
            )}

            {Platform.OS === "web" && (
              <View style={styles.notifTypes}>
                <View style={styles.notifTypeRow}>
                  <Ionicons name="phone-portrait" size={14} color="#94A3B8" />
                  <Text style={styles.notifTypeText}>
                    Notifications require the Expo Go app on a real device.
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Badges</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const icon = ACHIEVEMENT_ICONS[achievement.id] ?? "star";
              const color = ACHIEVEMENT_COLORS[achievement.id] ?? "#7C3AED";
              return (
                <GlassCard
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    achievement.unlocked ? { borderColor: `${color}44` } : {},
                  ]}
                  glowColor={achievement.unlocked ? color : undefined}
                >
                  <View
                    style={[
                      styles.achievementIconContainer,
                      {
                        backgroundColor: achievement.unlocked
                          ? `${color}20`
                          : "rgba(255,255,255,0.04)",
                      },
                    ]}
                  >
                    {achievement.unlocked && (
                      <View
                        style={[
                          styles.achievementGlow,
                          { backgroundColor: color },
                        ]}
                      />
                    )}
                    <Ionicons
                      name={icon}
                      size={28}
                      color={achievement.unlocked ? color : "#334155"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.achievementTitle,
                      !achievement.unlocked && { color: "#475569" },
                    ]}
                    numberOfLines={2}
                  >
                    {achievement.title}
                  </Text>
                  {achievement.unlocked && (
                    <View
                      style={[
                        styles.unlockedBadge,
                        { backgroundColor: `${color}20` },
                      ]}
                    >
                      <Ionicons name="checkmark" size={10} color={color} />
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Info</Text>
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="rocket" size={18} color="#7C3AED" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>AstroCare</Text>
                <Text style={styles.infoValue}>
                  Navigate your health mission
                </Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Ionicons name="star" size={18} color="#FBBF24" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>1.0.0 — Mission Launch</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Ionicons name="planet" size={18} color="#3B82F6" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Theme</Text>
                <Text style={styles.infoValue}>Deep Space · Nebula Purple</Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  scroll: { paddingHorizontal: 16 },
  profileCard: { padding: 20, marginBottom: 16, overflow: "hidden" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 72, height: 72 },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { flex: 1 },
  captainLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  captainName: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rankText: { color: "#FBBF24", fontSize: 13, fontWeight: "600" },
  achievementBadge: { alignItems: "center" },
  achievementCount: { color: "#F8FAFC", fontSize: 22, fontWeight: "800" },
  achievementLabel: { color: "#64748B", fontSize: 11, marginTop: 2 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  statCard: { flex: 1, padding: 14, alignItems: "center", gap: 8 },
  statCardLabel: { color: "#64748B", fontSize: 12, fontWeight: "500" },
  simpleStatValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 72,
    justifyContent: "center",
  },
  bigNumber: { color: "#F8FAFC", fontSize: 32, fontWeight: "800" },
  quickStats: { flexDirection: "row", gap: 8, marginBottom: 20 },
  quickStatCard: { flex: 1, padding: 12, alignItems: "center", gap: 6 },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: { color: "#F8FAFC", fontSize: 18, fontWeight: "800" },
  quickStatLabel: { color: "#64748B", fontSize: 11, textAlign: "center" },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  notifCard: { padding: 18 },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  notifIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notifInfo: { flex: 1 },
  notifTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "600" },
  notifStatus: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  notifSublabel: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notifBtn: { marginTop: 14, borderRadius: 12, overflow: "hidden" },
  notifBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  notifBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  notifTypes: {
    marginTop: 14,
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  notifTypeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifTypeText: { color: "#64748B", fontSize: 12, flex: 1, lineHeight: 16 },
  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievementCard: {
    width: "30.5%",
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  achievementGlow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.2,
  },
  achievementTitle: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 14,
  },
  unlockedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: { padding: 16 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  infoText: { flex: 1 },
  infoLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "500" },
  infoValue: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 1,
  },
  infoDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
});
