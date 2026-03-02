import React from "react";
import { View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Glass, Shadows, Colors } from "../theme/colors";

/**
 * Glassmorphic card with backdrop blur.
 * Falls back to a semi-transparent surface on Android.
 */
export function GlassCard({ children, style, intensity = 40, heavy = false, noBlur = false }) {
  const glassStyle = heavy ? Glass.heavy : Glass.card;

  if (noBlur) {
    return (
      <View style={[glassStyle, Shadows.md, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[{ borderRadius: 20, overflow: "hidden" }, Shadows.md, style]}>
      <BlurView intensity={intensity} tint="light" style={[StyleSheet.absoluteFill]} />
      <View style={[glassStyle, { backgroundColor: "transparent", borderWidth: 0 }, styles.inner]}>
        {children}
      </View>
    </View>
  );
}

/**
 * Smaller glass chip / pill shape.
 */
export function GlassPill({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.4)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.5)",
          borderRadius: 30,
          paddingHorizontal: 14,
          paddingVertical: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 20,
  },
});
