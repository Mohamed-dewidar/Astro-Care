import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width, height } = Dimensions.get("window");

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  delay: number;
}

function StarField() {
  const stars: Star[] = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        opacity: new Animated.Value(Math.random() * 0.6 + 0.1),
        delay: Math.random() * 4000,
      })),
    []
  );

  const animRefs = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    stars.forEach((star) => {
      const animate = () => {
        const anim = Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.9 + 0.1,
            duration: 1800 + Math.random() * 2400,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.2 + 0.05,
            duration: 1800 + Math.random() * 2400,
            useNativeDriver: true,
          }),
        ]);
        animRefs.current.push(anim);
        anim.start(animate);
      };
      setTimeout(animate, star.delay);
    });
    return () => {
      animRefs.current.forEach((a) => a.stop());
    };
  }, []);

  return (
    <>
      {stars.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </>
  );
}

export function SpaceBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#030712", "#050816", "#0B1026"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <StarField />
      {children && <View style={StyleSheet.absoluteFill}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },
});
