import React, { useEffect } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
  gradientColors?: [string, string];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color = "#7C3AED",
  bgColor = "rgba(255,255,255,0.08)",
  label,
  sublabel,
  gradientColors,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        {gradientColors && (
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} />
              <Stop offset="100%" stopColor={gradientColors[1]} />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradientColors ? `url(#${gradId})` : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      {(label !== undefined || sublabel !== undefined) && (
        <View style={{ alignItems: "center" }}>
          {label !== undefined && (
            <Text style={{ color: "#F8FAFC", fontSize: 20, fontWeight: "700" }}>{label}</Text>
          )}
          {sublabel !== undefined && (
            <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>{sublabel}</Text>
          )}
        </View>
      )}
    </View>
  );
}
