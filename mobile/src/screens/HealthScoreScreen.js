import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { BarChart } from "react-native-chart-kit";
import Animated, { FadeInDown, FadeInUp, ZoomIn, SlideInRight } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Gradients, Shadows, Glass } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";

const RADIUS = 70;
const CIRCUM = 2 * Math.PI * RADIUS;
const CHART_W = Dimensions.get("window").width - 64;

export default function HealthScoreScreen({ navigation }) {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get("/api/health-score");
      setData(res);
    } catch (err) { if (err.status === 401) logout(); }
    setLoading(false);
  }, [logout]);

  useEffect(() => { fetch(); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  if (loading) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={Colors.purple} /></View></GradientBG>;
  if (!data) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: Colors.textMuted }}>Unable to load health score</Text></View></GradientBG>;

  const pct = data.score / 100;
  const strokeDash = CIRCUM * pct;

  const gradeName = data.grade || "—";
  const gradeColor = data.score >= 80 ? Colors.emerald : data.score >= 60 ? Colors.yellow : Colors.red;

  return (
    <GradientBG>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.back}><Text style={{ fontSize: 22 }}>‹</Text></TouchableOpacity>
        <Text style={st.title}>Health Score</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />} showsVerticalScrollIndicator={false}>

        {/* Score Ring */}
        <Animated.View entering={ZoomIn.delay(200).springify()}>
          <LinearGradient colors={Gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.ringCard, Shadows.glow]}>
            <Svg width={170} height={170}>
              <Circle cx={85} cy={85} r={RADIUS} stroke="rgba(255,255,255,0.2)" strokeWidth={12} fill="none" />
              <Circle cx={85} cy={85} r={RADIUS} stroke="#fff" strokeWidth={12} fill="none" strokeDasharray={`${strokeDash} ${CIRCUM}`} strokeDashoffset={0} strokeLinecap="round" rotation={-90} origin="85,85" />
            </Svg>
            <View style={st.ringCenter}>
              <Text style={st.scoreNum}>{data.score}</Text>
              <Text style={st.scoreSub}>/100</Text>
            </View>
            <View style={[st.gradeBadge, { backgroundColor: gradeColor }]}><Text style={st.gradeText}>{gradeName}</Text></View>
          </LinearGradient>
        </Animated.View>

        {/* Message */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Assessment</Text>
            <Text style={{ fontSize: 14, color: Colors.textOnGlass, lineHeight: 22 }}>{data.message}</Text>
          </GlassCard>
        </Animated.View>

        {/* Score Breakdown Bar Chart */}
        {data.breakdown && Array.isArray(data.breakdown) && data.breakdown.length > 0 && (
          <Animated.View entering={FadeInUp.delay(450).springify()}>
            <GlassCard style={st.section} noBlur>
              <Text style={st.secTitle}>Score Breakdown</Text>
              <BarChart
                data={{
                  labels: data.breakdown.map(b => (b.label || "").slice(0, 8)),
                  datasets: [{ data: data.breakdown.map(b => b.score || 0) }],
                }}
                width={CHART_W}
                height={200}
                chartConfig={{
                  backgroundGradientFrom: "transparent",
                  backgroundGradientTo: "transparent",
                  color: (op = 1) => `rgba(139,92,246,${op})`,
                  labelColor: () => "rgba(30,27,75,0.6)",
                  decimalPlaces: 0,
                  propsForLabels: { fontSize: 9 },
                  barPercentage: 0.5,
                }}
                style={{ borderRadius: 14, marginBottom: 8 }}
                showBarTops={true}
                fromZero
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Detailed Breakdown */}
        {data.breakdown && Array.isArray(data.breakdown) && (
          <Animated.View entering={FadeInDown.delay(550).springify()}>
            <GlassCard style={st.section} noBlur>
              <Text style={st.secTitle}>Detailed Scores</Text>
              {data.breakdown.map((item, i) => {
                const barPct = item.max > 0 ? Math.min((item.score / item.max) * 100, 100) : 50;
                const barGrad = barPct >= 70 ? Gradients.emerald : barPct >= 40 ? [Colors.yellow, "#F59E0B"] : Gradients.danger;
                return (
                  <Animated.View key={i} entering={SlideInRight.delay(600 + i * 100).springify()}>
                    <View style={{ marginBottom: 14 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.textPrimary }}>{item.label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.textPrimary }}>{item.score}/{item.max}</Text>
                      </View>
                      <View style={st.progBg}>
                        <LinearGradient colors={barGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.progFill, { width: `${barPct}%` }]} />
                      </View>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>{item.detail}</Text>
                      {item.tip && (
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 6, paddingLeft: 4 }}>
                          <Text style={{ fontSize: 12, color: Colors.purple, fontWeight: "700" }}>Tip:</Text>
                          <Text style={{ flex: 1, fontSize: 11, color: Colors.purple, lineHeight: 16 }}>{item.tip}</Text>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </GlassCard>
          </Animated.View>
        )}

        {/* Tips */}
        {data.tips?.length > 0 && (
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Tips to Improve</Text>
            {data.tips.map((tip, i) => (
              <View key={i} style={st.tipRow}>
                <LinearGradient colors={Gradients.blue} style={st.tipDot}><Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>{i + 1}</Text></LinearGradient>
                <Text style={{ flex: 1, fontSize: 13, color: Colors.textOnGlass, lineHeight: 20 }}>{tip}</Text>
              </View>
            ))}
          </GlassCard>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 16, alignItems: "center" },

  ringCard: { width: 260, height: 280, borderRadius: 130, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  ringCenter: { position: "absolute", flexDirection: "row", alignItems: "baseline" },
  scoreNum: { fontSize: 44, fontWeight: "900", color: "#fff" },
  scoreSub: { fontSize: 16, color: "rgba(255,255,255,0.7)", marginLeft: 2 },
  gradeBadge: { position: "absolute", bottom: 18, paddingHorizontal: 18, paddingVertical: 6, borderRadius: 16 },
  gradeText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  section: { padding: 18, marginBottom: 16, width: "100%" },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  progBg: { height: 8, backgroundColor: "rgba(139,92,246,0.12)", borderRadius: 4, marginTop: 6, overflow: "hidden" },
  progFill: { height: 8, borderRadius: 4 },

  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tipDot: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
});
