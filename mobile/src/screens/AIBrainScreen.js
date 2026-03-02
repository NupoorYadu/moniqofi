import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients, Shadows } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";

const FEATURES = [
  { key: "HealthScore",   letter: "H", label: "Health Score",          desc: "Overall financial health grade", grad: Gradients.purple },
  { key: "Personality",   letter: "P", label: "Money Personality",     desc: "Understand your spending style", grad: Gradients.blue },
  { key: "Simulation",    letter: "S", label: "Future Simulation",     desc: "Model your financial future",   grad: Gradients.teal },
  { key: "Subscriptions", letter: "F", label: "Subscription Scanner",  desc: "Find hidden recurring charges", grad: Gradients.emerald },
];

export default function AIBrainScreen({ navigation }) {
  return (
    <GradientBG>
      <View style={st.header}>
        <Text style={st.title}>AI Financial Brain</Text>
        <Text style={st.sub}>Powerful insights powered by AI</Text>
      </View>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <LinearGradient colors={Gradients.dark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.hero, Shadows.glow]}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#fff" }}>M</Text>
          <Text style={st.heroTitle}>Your AI Brain</Text>
          <Text style={st.heroSub}>Analyze your financial data with cutting-edge AI tools to get actionable insights and personalized advice.</Text>
        </LinearGradient>

        {/* Feature cards */}
        {FEATURES.map((f, i) => (
          <TouchableOpacity key={f.key} activeOpacity={0.8} onPress={() => navigation.navigate(f.key)}>
            <GlassCard style={st.card}>
              <LinearGradient colors={f.grad} style={st.iconCircle}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>{f.letter}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={st.cardLabel}>{f.label}</Text>
                <Text style={st.cardDesc}>{f.desc}</Text>
              </View>
              <Text style={{ fontSize: 18, color: Colors.textMuted }}>›</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* Extra tip */}
        <GlassCard style={[st.tip]} noBlur>
          <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 }}>Pro Tip</Text>
          <Text style={{ fontSize: 13, color: Colors.textOnGlass, lineHeight: 20 }}>
            Add more transactions to improve the accuracy of your AI insights. The more data, the smarter your financial brain becomes!
          </Text>
        </GlassCard>

        <View style={{ height: 30 }} />
      </ScrollView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 12, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: Colors.purple, fontWeight: "600", marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  hero: { borderRadius: 22, padding: 28, alignItems: "center", marginBottom: 18 },
  heroTitle: { fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 10 },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center", marginTop: 8, lineHeight: 20 },

  card: { flexDirection: "row", alignItems: "center", padding: 18, marginBottom: 12, gap: 14 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  cardLabel: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  cardDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },

  tip: { padding: 18, marginTop: 6 },
});
