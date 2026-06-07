import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "rocket", selected: "rocket.fill" } as any} />
        <Label>Mission</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="meals">
        <Icon
          sf={{ default: "moon.stars", selected: "moon.stars.fill" } as any}
        />
        <Label>Meals</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="medications">
        <Icon sf={{ default: "cross", selected: "cross.fill" } as any} />
        <Label>Meds</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <Icon sf={{ default: "calendar", selected: "calendar" } as any} />
        <Label>Calendar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" } as any}
        />
        <Label>Command</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.cosmicCyan,
        tabBarInactiveTintColor: "rgba(148,163,184,0.5)",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "rgba(5,8,22,0.97)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.08)",
          elevation: 0,
          height: 80 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(5,8,22,0.7)" },
              ]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(5,8,22,0.97)" },
              ]}
            />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600" as const,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mission",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView
                name={"rocket.fill" as any}
                tintColor={color}
                size={22}
              />
            ) : (
              <Ionicons name="rocket" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meals",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView
                name={"moon.stars.fill" as any}
                tintColor={color}
                size={22}
              />
            ) : (
              <Ionicons name="planet" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: "Meds",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView
                name={"cross.fill" as any}
                tintColor={color}
                size={22}
              />
            ) : (
              <Ionicons name="medical" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView
                name={"calendar" as any}
                tintColor={color}
                size={22}
              />
            ) : (
              <Ionicons name="calendar" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Command",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView
                name={"gearshape.fill" as any}
                tintColor={color}
                size={22}
              />
            ) : (
              <Ionicons name="settings" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
