import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, BarChart } from "react-native-chart-kit";
import Animated, { FadeInDown, FadeInUp, FadeInRight, ZoomIn, SlideInRight } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Gradients, Shadows, Glass } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";
import { formatINR } from "../utils/format";

const CHART_W = Dimensions.get("window").width - 64;

export default function SimulationScreen({ navigation }) {
  const { logout } = useAuth();
  const [years, setYears] = useState("5");
  const [investmentReturn, setInvestmentReturn] = useState("8");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSim = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/simulation/project", {
        years: parseInt(years) || 5,
        investmentReturn: parseFloat(investmentReturn) || 8,
      });
      setData(res);
    } catch (err) {
      if (err.status === 401) logout();
      Alert.alert("Error", err.message || "Simulation failed");
    }
    setLoading(false);
  }, [years, investmentReturn, logout]);

  // Backend returns { projections: { currentPath, optimizedPath, aggressivePath }, finalAmounts, milestones, whatIf }
  const paths = data?.projections;
  const currentPath = paths?.currentPath || [];
  const optimizedPath = paths?.optimizedPath || [];
  const chartData = currentPath.length > 0 ? {
    labels: currentPath.map(p => `Y${p.year}`),
    datasets: [
      { data: currentPath.map(p => p.amount || 0), color: () => "#8B5CF6", strokeWidth: 2 },
      { data: optimizedPath.map(p => p.amount || 0), color: () => "#14B8A6", strokeWidth: 2 },
    ],
    legend: ["Current", "Optimized"],
  } : null;

  return (
    <GradientBG>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.back}><Text style={{ fontSize: 22 }}>‹</Text></TouchableOpacity>
        <Text style={st.title}>Future Simulation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Params */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
        <GlassCard style={st.section}>
          <Text style={st.secTitle}>Parameters</Text>
          <View style={st.paramRow}>
            <View style={{ flex: 1 }}>
              <Text style={st.paramLabel}>Years (1-30)</Text>
              <TextInput style={st.input} value={years} onChangeText={setYears} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.paramLabel}>Return % (annual)</Text>
              <TextInput style={st.input} value={investmentReturn} onChangeText={setInvestmentReturn} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
          <TouchableOpacity onPress={runSim} disabled={loading} style={{ borderRadius: 14, overflow: "hidden", marginTop: 6 }}>
            <LinearGradient colors={Gradients.purple} style={st.btn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>Run Simulation</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>
        </Animated.View>

        {/* Results */}
        {data && (
          <>
            {/* Summary stats */}
            <View style={st.statsRow}>
              {[
                { label: "Current Path", value: data.finalAmounts?.current, grad: Gradients.purple },
                { label: "Optimized", value: data.finalAmounts?.optimized, grad: Gradients.emerald },
                { label: "Aggressive", value: data.finalAmounts?.aggressive, grad: Gradients.blue },
              ].filter(s => s.value != null).map((s, i) => (
                <Animated.View key={i} entering={FadeInUp.delay(300 + i * 120).springify()} style={{ flex: 1, minWidth: 100 }}>
                <LinearGradient colors={s.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.statCard, Shadows.md]}>
                  <Text style={st.statLabel}>{s.label}</Text>
                  <Text style={st.statValue}>{typeof s.value === "number" ? formatINR(s.value) : String(s.value)}</Text>
                </LinearGradient>
                </Animated.View>
              ))}
            </View>

            {/* Chart */}
            {chartData && (
              <Animated.View entering={FadeInRight.delay(500).springify()}>
              <GlassCard style={st.section} noBlur>
                <Text style={st.secTitle}>Projection</Text>
                <LineChart
                  data={chartData} width={CHART_W} height={220} bezier
                  chartConfig={{
                    backgroundGradientFrom: "transparent", backgroundGradientTo: "transparent",
                    color: (op = 1) => `rgba(139,92,246,${op})`, labelColor: () => "rgba(30,27,75,0.6)",
                    decimalPlaces: 0, propsForLabels: { fontSize: 10 },
                    propsForDots: { r: "3", strokeWidth: "2", stroke: "#8B5CF6" },
                  }}
                  style={{ borderRadius: 14 }}
                />
              </GlassCard>
              </Animated.View>
            )}

            {/* Milestones */}
            {data.milestones?.length > 0 && (
              <Animated.View entering={FadeInDown.delay(600).springify()}>
              <GlassCard style={st.section} noBlur>
                <Text style={st.secTitle}>Milestones</Text>
                {data.milestones.map((ms, i) => (
                  <Animated.View key={i} entering={SlideInRight.delay(650 + i * 80).springify()}>
                  <View style={st.tipRow}>
                    <LinearGradient colors={Gradients.teal} style={st.tipDot}><Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{ms.label}</Text></LinearGradient>
                    <Text style={{ flex: 1, fontSize: 13, color: Colors.textOnGlass, lineHeight: 20 }}>Reach {ms.label} in {ms.yearsToReach} years ({ms.monthsToReach} months)</Text>
                  </View>
                  </Animated.View>
                ))}
              </GlassCard>
              </Animated.View>
            )}

            {/* What-If Scenarios */}
            {data.whatIf?.length > 0 && (
              <Animated.View entering={FadeInDown.delay(700).springify()}>
              <GlassCard style={st.section} noBlur>
                <Text style={st.secTitle}>What If?</Text>
                {data.whatIf.map((w, i) => (
                  <Animated.View key={i} entering={SlideInRight.delay(750 + i * 80).springify()}>
                  <View style={st.tipRow}>
                    <LinearGradient colors={Gradients.emerald} style={st.tipDot}><Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{i + 1}</Text></LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: Colors.textOnGlass, lineHeight: 20 }}>{w.scenario}</Text>
                      <Text style={{ fontSize: 12, color: Colors.purple, fontWeight: "700", marginTop: 4 }}>+{formatINR(w.projectedGain)} projected gain</Text>
                    </View>
                  </View>
                  </Animated.View>
                ))}
              </GlassCard>
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.45)", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  section: { padding: 18, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  paramRow: { flexDirection: "row", gap: 12 },
  paramLabel: { fontSize: 12, fontWeight: "700", color: Colors.textMuted, marginBottom: 6 },
  input: { ...Glass.input, padding: 13, fontSize: 14, color: Colors.textPrimary },

  btn: { paddingVertical: 15, alignItems: "center", borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 100, borderRadius: 18, padding: 14 },
  statLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  statValue: { fontSize: 14, fontWeight: "800", color: "#fff", marginTop: 4 },

  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tipDot: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
});
