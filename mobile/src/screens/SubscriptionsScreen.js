import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Gradients, Shadows } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";
import { formatINR } from "../utils/format";

const RADIUS = 55;
const CIRCUM = 2 * Math.PI * RADIUS;

export default function SubscriptionsScreen({ navigation }) {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try { const res = await api.get("/api/subscriptions"); setData(res); } catch (err) { if (err.status === 401) logout(); }
    setLoading(false);
  }, [logout]);

  useEffect(() => { fetch(); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  if (loading) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={Colors.purple} /></View></GradientBG>;
  if (!data) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: Colors.textMuted }}>Unable to scan subscriptions</Text></View></GradientBG>;

  const subs = data.subscriptions || [];
  const summary = data.summary || {};
  const total = summary.monthlyTotal || subs.reduce((s, x) => s + (x.amount || 0), 0);
  const leakScore = summary.leakScore ?? 0;
  const leakPct = leakScore / 100;
  const leakStroke = CIRCUM * leakPct;
  const leakColor = leakScore >= 60 ? Colors.red : leakScore >= 30 ? Colors.yellow : Colors.emerald;

  return (
    <GradientBG>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.back}><Text style={{ fontSize: 22 }}>‹</Text></TouchableOpacity>
        <Text style={st.title}>Subscriptions</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />} showsVerticalScrollIndicator={false}>

        {/* Top summary */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <LinearGradient colors={Gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.sumCard, Shadows.md]}>
            <Text style={st.sumLabel}>Monthly Total</Text>
            <Text style={st.sumValue}>{formatINR(total)}</Text>
          </LinearGradient>
          <LinearGradient colors={Gradients.danger} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.sumCard, Shadows.md]}>
            <Text style={st.sumLabel}>Leak Score</Text>
            <Text style={st.sumValue}>{leakScore}/100</Text>
          </LinearGradient>
        </View>

        {/* Leak ring */}
        <GlassCard style={[st.section, { alignItems: "center" }]} noBlur>
          <Text style={st.secTitle}>Subscription Leak</Text>
          <Svg width={140} height={140}>
            <Circle cx={70} cy={70} r={RADIUS} stroke="rgba(139,92,246,0.12)" strokeWidth={10} fill="none" />
            <Circle cx={70} cy={70} r={RADIUS} stroke={leakColor} strokeWidth={10} fill="none" strokeDasharray={`${leakStroke} ${CIRCUM}`} strokeLinecap="round" rotation={-90} origin="70,70" />
          </Svg>
          <View style={{ position: "absolute", top: 75, alignItems: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: leakColor }}>{leakScore}</Text>
          </View>
        </GlassCard>

        {/* Sub list */}
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>Detected Subscriptions</Text>
          {subs.length === 0 ? (
            <Text style={{ color: Colors.textMuted, textAlign: "center", padding: 16 }}>No recurring charges found</Text>
          ) : subs.map((sub, i) => (
            <View key={i} style={st.subRow}>
              <LinearGradient colors={sub.essential ? Gradients.emerald : Gradients.danger} style={st.subDot}>
                <Text style={{ color: "#fff", fontSize: 14 }}>{sub.essential ? "✓" : "!"}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>{sub.name || sub.title || "Subscription"}</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>{sub.frequency || "monthly"}{sub.essential ? "" : " — possible waste"}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "800", color: Colors.red }}>{formatINR(sub.amount)}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Tips / Advice */}
        {data.advice && (
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Advice</Text>
            <View style={st.tipRow}>
              <LinearGradient colors={Gradients.emerald} style={st.tipDot}><Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>!</Text></LinearGradient>
              <Text style={{ flex: 1, fontSize: 13, color: Colors.textOnGlass, lineHeight: 20 }}>{data.advice}</Text>
            </View>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  sumCard: { flex: 1, borderRadius: 18, padding: 16, alignItems: "center" },
  sumLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  sumValue: { fontSize: 18, fontWeight: "900", color: "#fff", marginTop: 6 },

  section: { padding: 18, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  subRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.25)" },
  subDot: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },

  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tipDot: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
});
