import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, RefreshControl, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp, ZoomIn, SlideInRight, Layout } from "react-native-reanimated";
import { ProgressChart } from "react-native-chart-kit";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Gradients, Shadows, Glass } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";
import { formatINR } from "../utils/format";

const SCREEN_W = Dimensions.get("window").width;

export default function GoalsScreen() {
  const { logout } = useAuth();
  const [goals, setGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  const [contribModal, setContribModal] = useState(false);
  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmt, setContribAmt] = useState("");

  const fetch = useCallback(async () => {
    try { const res = await api.get("/api/goals"); setGoals(res); } catch (err) { if (err.status === 401) logout(); }
  }, [logout]);

  useEffect(() => { fetch(); }, [fetch]);
  const onRefresh = async () => { setRefreshing(true); await fetch(); setRefreshing(false); };

  const addGoal = async () => {
    if (!title.trim() || !target) { Alert.alert("Error", "Enter name and target amount"); return; }
    try { await api.post("/api/goals", { title: title.trim(), targetAmount: parseFloat(target) }); setTitle(""); setTarget(""); fetch(); } catch (err) { Alert.alert("Error", err.message); }
  };

  const contribute = async () => {
    if (!contribAmt) return;
    try { await api.post(`/api/goals/${contribGoal.id}/contribute`, { amount: parseFloat(contribAmt) }); setContribModal(false); setContribAmt(""); fetch(); } catch (err) { Alert.alert("Error", err.message); }
  };

  const deleteGoal = (id) => {
    Alert.alert("Delete Goal", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await api.delete(`/api/goals/${id}`); fetch(); } catch (err) { Alert.alert("Error", err.message); } } },
    ]);
  };

  return (
    <GradientBG>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={st.header}>
        <Text style={st.title}>Savings Goals</Text>
        <Text style={st.sub}>Track your financial targets</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />} showsVerticalScrollIndicator={false}>

        {/* Overall Progress Ring */}
        {goals.length > 0 && (
          <Animated.View entering={ZoomIn.delay(200).springify()}>
            <GlassCard style={st.section}>
              <Text style={st.secTitle}>Overall Progress</Text>
              <ProgressChart
                data={{ labels: goals.slice(0, 4).map(g => (g.title || g.name)?.slice(0, 6) || "Goal"), data: goals.slice(0, 4).map(g => g.target_amount > 0 ? Math.min(g.saved_amount / g.target_amount, 1) : 0) }}
                width={SCREEN_W - 80}
                height={180}
                strokeWidth={12}
                radius={28}
                chartConfig={{
                  backgroundGradientFrom: "transparent", backgroundGradientTo: "transparent",
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  labelColor: () => Colors.textMuted,
                  strokeWidth: 2,
                }}
                hideLegend={false}
                style={{ borderRadius: 16 }}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Add Goal */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
        <GlassCard style={st.section}>
          <Text style={st.secTitle}>New Goal</Text>
          <TextInput style={st.input} placeholder="Goal name" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} />
          <TextInput style={st.input} placeholder="Target amount" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={target} onChangeText={setTarget} />
          <TouchableOpacity onPress={addGoal} style={{ borderRadius: 14, overflow: "hidden" }}>
            <LinearGradient colors={Gradients.purple} style={st.btn}><Text style={st.btnText}>Create Goal</Text></LinearGradient>
          </TouchableOpacity>
        </GlassCard>
        </Animated.View>

        {/* Goals List */}
        {goals.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(400)}>
          <GlassCard style={st.section} noBlur>
            <Text style={{ color: Colors.textMuted, textAlign: "center", padding: 20 }}>No goals yet — create one above!</Text>
          </GlassCard>
          </Animated.View>
        ) : goals.map((g, i) => {
          const pct = g.target_amount > 0 ? Math.round((g.saved_amount / g.target_amount) * 100) : 0;
          const barGrad = pct >= 100 ? Gradients.emerald : pct >= 50 ? Gradients.blue : Gradients.purple;
          return (
            <Animated.View key={g.id || i} entering={SlideInRight.delay(400 + i * 100).springify()} layout={Layout.springify()}>
            <GlassCard style={st.goalCard} noBlur>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={st.goalName}>{g.title || g.name}</Text>
                  <Text style={st.goalMeta}>{formatINR(g.saved_amount || 0)} / {formatINR(g.target_amount)}</Text>
                </View>
                <View style={[st.pctBadge, { backgroundColor: pct >= 100 ? Colors.emerald : Colors.purple }]}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>{pct}%</Text>
                </View>
              </View>
              <View style={st.progBg}>
                <LinearGradient colors={barGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.progFill, { width: `${Math.min(pct, 100)}%` }]} />
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <TouchableOpacity style={{ flex: 1, borderRadius: 12, overflow: "hidden" }} onPress={() => { setContribGoal(g); setContribModal(true); }}>
                  <LinearGradient colors={Gradients.emerald} style={st.smallBtn}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>+ Contribute</Text></LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[st.delBtn]} onPress={() => deleteGoal(g.id)}>
                  <Text style={{ color: Colors.red, fontWeight: "700", fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
            </Animated.View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Contribute Modal */}
      <Modal visible={contribModal} transparent animationType="fade">
        <View style={st.overlay}>
        <Animated.View entering={FadeInUp.springify()} style={st.modal}>
          <Text style={st.modalTitle}>Contribute to {contribGoal?.title || contribGoal?.name}</Text>
          <TextInput style={st.input} placeholder="Amount" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={contribAmt} onChangeText={setContribAmt} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setContribModal(false)}>
              <View style={st.secBtn}><Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>Cancel</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, borderRadius: 14, overflow: "hidden" }} onPress={contribute}>
              <LinearGradient colors={Gradients.emerald} style={st.btn}><Text style={st.btnText}>Contribute</Text></LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View></View>
      </Modal>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 12, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: Colors.purple, fontWeight: "600", marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  section: { padding: 18, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },
  input: { ...Glass.input, padding: 13, fontSize: 14, color: Colors.textPrimary, marginBottom: 10 },

  btn: { paddingVertical: 14, alignItems: "center", borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  smallBtn: { paddingVertical: 11, alignItems: "center", borderRadius: 12 },
  delBtn: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", justifyContent: "center" },
  secBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },

  goalCard: { padding: 18, marginBottom: 14 },
  goalName: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  goalMeta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  pctBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14 },

  progBg: { height: 10, backgroundColor: "rgba(139,92,246,0.12)", borderRadius: 5, marginTop: 12, overflow: "hidden" },
  progFill: { height: 10, borderRadius: 5 },

  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 16, textAlign: "center" },
});
