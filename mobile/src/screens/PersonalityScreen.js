import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Gradients, Shadows, Glass } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard, GlassPill } from "../components/GlassCard";

const WIDTH = Dimensions.get("window").width;

export default function PersonalityScreen({ navigation }) {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try { const res = await api.get("/api/personality"); setData(res); } catch (err) { if (err.status === 401) logout(); }
    setLoading(false);
  }, [logout]);

  useEffect(() => { fetch(); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  if (loading) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={Colors.purple} /></View></GradientBG>;
  if (!data) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: Colors.textMuted }}>Unable to analyze personality</Text></View></GradientBG>;

  // Backend returns: { personality: { trait, emoji }, traits: [...], warnings, stats }
  const personality = data.personality || {};
  const pType = personality.trait || personality.type || "Unknown";
  const pEmoji = personality.emoji || "P";
  const traits = data.traits || [];
  const warnings = data.warnings || [];
  const stats = data.stats || {};
  const description = traits.length > 0 ? traits[0].description || "" : "";

  return (
    <GradientBG>
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.back}><Text style={{ fontSize: 22 }}>‹</Text></TouchableOpacity>
        <Text style={st.title}>Money Personality</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />} showsVerticalScrollIndicator={false}>

        {/* Type Card */}
        <LinearGradient colors={Gradients.blue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.typeCard, Shadows.glow]}>
          <Text style={{ fontSize: 32 }}>{pEmoji}</Text>
          <Text style={st.typeLabel}>Your Type</Text>
          <Text style={st.typeName}>{pType}</Text>
          {description ? <Text style={st.typeDesc}>{description}</Text> : null}
        </LinearGradient>

        {/* Traits */}
        {traits.length > 0 && (
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Traits</Text>
            {traits.map((t, i) => {
              const label = t.trait || t.name || String(t);
              const score = t.strength || t.score || 50;
              return (
                <View key={i} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.textPrimary }}>{label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.purple }}>{score}%</Text>
                  </View>
                  <View style={st.progBg}>
                    <LinearGradient colors={Gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.progFill, { width: `${Math.min(score, 100)}%` }]} />
                  </View>
                  {t.description && <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>{t.description}</Text>}
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Warnings</Text>
            {warnings.map((w, i) => {
              const txt = typeof w === "string" ? w : w.message || JSON.stringify(w);
              return (
                <View key={i} style={st.tipRow}>
                  <LinearGradient colors={Gradients.danger} style={st.tipDot}><Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>!</Text></LinearGradient>
                  <Text style={{ flex: 1, fontSize: 13, color: Colors.textOnGlass, lineHeight: 20 }}>{txt}</Text>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Stats */}
        {stats.totalTransactions > 0 && (
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Stats</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[
                { label: "Savings Rate", value: `${stats.savingsRate || 0}%` },
                { label: "Weekend Ratio", value: `${stats.weekendRatio || 0}%` },
                { label: "Late Night %", value: `${stats.lateNightPercent || 0}%` },
                { label: "Transactions", value: stats.totalTransactions },
              ].map((s, i) => (
                <View key={i} style={{ minWidth: "45%", marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>{s.label}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.textPrimary }}>{s.value}</Text>
                </View>
              ))}
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

  typeCard: { borderRadius: 22, padding: 28, alignItems: "center", marginBottom: 18 },
  typeLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600", marginTop: 10 },
  typeName: { fontSize: 24, fontWeight: "900", color: "#fff", marginTop: 4 },
  typeDesc: { fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 10, lineHeight: 20 },

  section: { padding: 18, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  progBg: { height: 8, backgroundColor: "rgba(139,92,246,0.12)", borderRadius: 4, marginTop: 6, overflow: "hidden" },
  progFill: { height: 8, borderRadius: 4 },

  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  tipDot: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
});
