import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gradients } from "../theme/colors";

const { width: W, height: H } = Dimensions.get("window");

/**
 * Full-screen animated gradient background with floating orbs.
 * Wrap every screen root in this.
 */
export function GradientBG({ children, style }) {
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    loop(orb1, 7000);
    loop(orb2, 9000);
    loop(orb3, 11000);
  }, []);

  const t1 = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const t2 = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, -25] });
  const t3 = orb3.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={Gradients.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* Floating orbs */}
      <Animated.View
        style={[styles.orb, styles.orb1, { transform: [{ translateY: t1 }, { translateX: t1 }] }]}
      />
      <Animated.View
        style={[styles.orb, styles.orb2, { transform: [{ translateY: t2 }, { translateX: t2 }] }]}
      />
      <Animated.View
        style={[styles.orb, styles.orb3, { transform: [{ translateY: t3 }] }]}
      />

      {children}
    </View>
  );
}

const ORB = W * 0.7;

const styles = StyleSheet.create({
  root: { flex: 1 },
  orb: {
    position: "absolute",
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    opacity: 0.35,
  },
  orb1: { top: -ORB * 0.3, left: -ORB * 0.3, backgroundColor: "#C4B5FD" },
  orb2: { top: -ORB * 0.2, right: -ORB * 0.3, backgroundColor: "#5EEAD4" },
  orb3: { bottom: -ORB * 0.2, left: W * 0.2, backgroundColor: "#93C5FD" },
});
