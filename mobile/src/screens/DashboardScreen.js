import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Alert, Modal, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart, LineChart, BarChart, ProgressChart } from "react-native-chart-kit";
import Animated, { FadeInDown, FadeInRight, FadeInLeft, FadeInUp, ZoomIn, SlideInRight, Layout } from "react-native-reanimated";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Shadows, Glass, Gradients } from "../theme/colors";
import { formatINR, formatDate } from "../utils/format";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";

const WIDTH = Dimensions.get("window").width;
const CHART_W = WIDTH - 64;

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment",
  "Health", "Education", "Travel", "Rent", "Other",
];

const CHART_CONFIG = {
  backgroundGradientFrom: "transparent",
  backgroundGradientTo: "transparent",
  color: (op = 1) => `rgba(139,92,246,${op})`,
  labelColor: () => "rgba(30,27,75,0.6)",
  decimalPlaces: 0,
  propsForLabels: { fontSize: 10 },
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#8B5CF6" },
};

const PIE_COLORS = ["#8B5CF6", "#3B82F6", "#14B8A6", "#F59E0B", "#EF4444", "#EC4899", "#6366F1", "#F97316"];

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState(null);
  const [insights, setInsights] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [budgetSuggestions, setBudgetSuggestions] = useState([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [showCatPicker, setShowCatPicker] = useState(false);

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [showBudgetCatPicker, setShowBudgetCatPicker] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("expense");
  const [editCategory, setEditCategory] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [sum, cats, txns, trend, ins, budgets, hs, suggestions] = await Promise.all([
        api.get("/api/transactions/summary"),
        api.get("/api/transactions/categories"),
        api.get("/api/transactions?page=1&limit=10"),
        api.get("/api/transactions/monthly-trend"),
        api.get("/api/transactions/insights"),
        api.get("/api/budgets/status"),
        api.get("/api/health-score").catch(() => null),
        api.get("/api/budgets/suggest").catch(() => null),
      ]);
      setSummary(sum);
      setCategories(cats);
      setTransactions(txns.transactions || txns);
      setMonthlyTrend(trend);
      setInsights(ins);
      setBudgetStatus(budgets?.budgets || budgets || []);
      if (hs) setHealthScore(hs);
      if (suggestions) setBudgetSuggestions(suggestions.suggestions || []);
    } catch (err) {
      if (err.status === 401) logout();
    }
  }, [logout]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const addTransaction = async () => {
    if (!title.trim() || !amount.trim()) { Alert.alert("Error", "Enter title and amount"); return; }
    try {
      await api.post("/api/transactions", { title: title.trim(), amount: parseFloat(amount), type, category: category || "Other" });
      setTitle(""); setAmount(""); setCategory(""); fetchAll();
    } catch (err) { Alert.alert("Error", err.message); }
  };

  const openEdit = (txn) => {
    setEditId(txn.id); setEditTitle(txn.title); setEditAmount(String(txn.amount));
    setEditType(txn.type); setEditCategory(txn.category || ""); setEditModal(true);
  };
  const saveEdit = async () => {
    try {
      await api.put(`/api/transactions/${editId}`, { title: editTitle, amount: parseFloat(editAmount), type: editType, category: editCategory });
      setEditModal(false); fetchAll();
    } catch (err) { Alert.alert("Error", err.message); }
  };
  const confirmDelete = (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await api.delete(`/api/transactions/${id}`); fetchAll(); } catch (err) { Alert.alert("Error", err.message); } } },
    ]);
  };

  const addBudget = async () => {
    if (!budgetCategory || !budgetAmount) { Alert.alert("Error", "Enter category and amount"); return; }
    try {
      await api.post("/api/budgets", { category: budgetCategory, amount: parseFloat(budgetAmount) });
      setBudgetCategory(""); setBudgetAmount(""); fetchAll();
    } catch (err) { Alert.alert("Error", err.message); }
  };
  const setBudgetSuggestion = async (sg) => {
    try { await api.post("/api/budgets", { category: sg.category, amount: sg.suggestedBudget }); fetchAll(); } catch (err) { Alert.alert("Error", err.message); }
  };

  const pieData = categories.slice(0, 6).map((c, i) => ({
    name: c.category, amount: parseFloat(c.total),
    color: PIE_COLORS[i % PIE_COLORS.length], legendFontColor: Colors.textOnGlass, legendFontSize: 11,
  }));
  const lineData = monthlyTrend?.length > 0 ? {
    labels: monthlyTrend.map(m => m.month?.slice(5) || ""),
    datasets: [
      { data: monthlyTrend.map(m => parseFloat(m.income) || 0), color: () => "#8B5CF6", strokeWidth: 2 },
      { data: monthlyTrend.map(m => parseFloat(m.expense) || 0), color: () => "#EF4444", strokeWidth: 2 },
    ],
    legend: ["Income", "Expense"],
  } : null;

  return (
    <GradientBG>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.headerTitle}>Dashboard</Text>
          <Text style={st.headerSub}>MoniqoFi</Text>
        </View>
        <View style={st.headerBadge}><Text style={{ fontSize: 16, fontWeight: "900", color: Colors.purple }}>M</Text></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />} showsVerticalScrollIndicator={false}>

        {/* ── Stat Cards ── */}
        <View style={st.statsRow}>
          {[
            { label: "Income", value: summary.totalIncome, grad: Gradients.emerald, icon: "↑" },
            { label: "Expense", value: summary.totalExpense, grad: Gradients.danger, icon: "↓" },
            { label: "Balance", value: summary.balance, grad: Gradients.blue, icon: "◎" },
          ].map((it, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 150).springify()} style={{ flex: 1 }}>
              <LinearGradient colors={it.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.statCard, Shadows.md]}>
                <Text style={st.statIcon}>{it.icon}</Text>
                <Text style={st.statLabel}>{it.label}</Text>
                <Text style={st.statValue}>{formatINR(it.value)}</Text>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>

        {/* ── Health Score Featured ── */}
        {healthScore && (
          <Animated.View entering={FadeInLeft.delay(300).springify()}>
            <LinearGradient colors={Gradients.purple} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.featured, Shadows.glow]}>
              <View style={{ flex: 1 }}>
                <Text style={st.featLabel}>Health Score</Text>
                <Text style={st.featSub}>{healthScore.grade} — {healthScore.message?.slice(0, 50)}</Text>
              </View>
              <View style={st.scoreBubble}><Text style={st.scoreNum}>{healthScore.score}</Text></View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── Smart Insights ── */}
        {insights.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <GlassCard style={st.section} noBlur>
              <Text style={st.secTitle}>Smart Insights</Text>
              {insights.slice(0, 4).map((ins, i) => {
                const c = ins.type === "warning" ? Colors.yellow : ins.type === "success" ? Colors.emerald : Colors.blue;
                return (
                  <Animated.View key={i} entering={SlideInRight.delay(500 + i * 100).springify()}>
                    <View style={[st.insightCard, { borderLeftColor: c }]}>
                      <Text style={st.insightText}>{ins.message}</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Add Transaction ── */}
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>Add Transaction</Text>
          <TextInput style={st.input} placeholder="Title" placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} />
          <TextInput style={st.input} placeholder="Amount" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <View style={st.toggleRow}>
            <TouchableOpacity style={[st.toggleBtn, type === "expense" && { backgroundColor: Colors.red, borderColor: Colors.red }]} onPress={() => setType("expense")}>
              <Text style={[st.toggleText, type === "expense" && { color: "#fff" }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.toggleBtn, type === "income" && { backgroundColor: Colors.emerald, borderColor: Colors.emerald }]} onPress={() => setType("income")}>
              <Text style={[st.toggleText, type === "income" && { color: "#fff" }]}>Income</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={st.input} onPress={() => setShowCatPicker(true)}>
            <Text style={{ color: category ? Colors.textPrimary : Colors.textMuted }}>{category || "Select Category"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={addTransaction} style={{ borderRadius: 14, overflow: "hidden" }}>
            <LinearGradient colors={Gradients.purple} style={st.gradBtn}><Text style={st.gradBtnText}>Add Transaction</Text></LinearGradient>
          </TouchableOpacity>
        </GlassCard>

        {/* ── Charts ── */}
        {pieData.length > 0 && (
          <Animated.View entering={ZoomIn.delay(600).springify()}>
            <GlassCard style={st.section} noBlur>
              <Text style={st.secTitle}>Expense Breakdown</Text>
              <PieChart data={pieData} width={CHART_W} height={200} chartConfig={CHART_CONFIG} accessor="amount" backgroundColor="transparent" paddingLeft="0" absolute />
            </GlassCard>
          </Animated.View>
        )}
        {lineData && (
          <Animated.View entering={FadeInRight.delay(700).springify()}>
            <GlassCard style={st.section} noBlur>
              <Text style={st.secTitle}>Monthly Trend</Text>
              <LineChart data={lineData} width={CHART_W} height={220} chartConfig={CHART_CONFIG} bezier style={{ borderRadius: 14 }} />
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Budget Bar Chart ── */}
        {budgetStatus.length > 0 && (
          <Animated.View entering={FadeInUp.delay(750).springify()}>
            <GlassCard style={st.section} noBlur>
              <Text style={st.secTitle}>Budget vs Spent</Text>
              <BarChart
                data={{
                  labels: budgetStatus.slice(0, 5).map(b => b.category?.slice(0, 6) || ""),
                  datasets: [{ data: budgetStatus.slice(0, 5).map(b => b.spent || 0) }],
                }}
                width={CHART_W}
                height={200}
                chartConfig={{
                  backgroundGradientFrom: "transparent",
                  backgroundGradientTo: "transparent",
                  color: (op = 1) => `rgba(239,68,68,${op})`,
                  labelColor: () => "rgba(30,27,75,0.6)",
                  decimalPlaces: 0,
                  propsForLabels: { fontSize: 10 },
                  barPercentage: 0.6,
                }}
                style={{ borderRadius: 14 }}
                showBarTops={true}
                fromZero
              />
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red }} />
                  <Text style={{ fontSize: 11, color: Colors.textMuted }}>Spent</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* ── Budgets ── */}
        <Animated.View entering={FadeInDown.delay(800).springify()}>
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>Monthly Budgets</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            <TouchableOpacity style={[st.input, { flex: 1 }]} onPress={() => setShowBudgetCatPicker(true)}>
              <Text style={{ color: budgetCategory ? Colors.textPrimary : Colors.textMuted }}>{budgetCategory || "Category"}</Text>
            </TouchableOpacity>
            <TextInput style={[st.input, { flex: 1 }]} placeholder="Amount" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={budgetAmount} onChangeText={setBudgetAmount} />
            <TouchableOpacity onPress={addBudget}><LinearGradient colors={Gradients.purple} style={st.smallGrad}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Set</Text></LinearGradient></TouchableOpacity>
          </View>
          {budgetStatus.map((b, i) => {
            const pct = b.budgetAmount > 0 ? Math.round((b.spent / b.budgetAmount) * 100) : 0;
            const barGrad = pct >= 100 ? Gradients.danger : pct >= 80 ? [Colors.yellow, "#F59E0B"] : Gradients.purple;
            const barColor = pct >= 100 ? Colors.red : pct >= 80 ? Colors.yellow : Colors.purple;
            return (
              <View key={i} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.textPrimary }}>{b.category}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: barColor }}>{pct}%</Text>
                </View>
                <View style={st.progBg}>
                  <LinearGradient colors={barGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[st.progFill, { width: `${Math.min(pct, 100)}%` }]} />
                </View>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>{formatINR(b.spent)} / {formatINR(b.budgetAmount)}</Text>
              </View>
            );
          })}
        </GlassCard>
        </Animated.View>

        {/* ── AI Budget Suggestions ── */}
        {budgetSuggestions.length > 0 && (
          <Animated.View entering={FadeInLeft.delay(900).springify()}>
          <GlassCard style={st.section} noBlur>
            <Text style={st.secTitle}>AI Budget Suggestions</Text>
            {budgetSuggestions.map((sg, i) => (
              <Animated.View key={i} entering={SlideInRight.delay(950 + i * 80).springify()}>
              <View style={st.sugRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: Colors.textPrimary }}>{sg.category}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{sg.reason}</Text>
                </View>
                <TouchableOpacity onPress={() => setBudgetSuggestion(sg)}><LinearGradient colors={Gradients.emerald} style={st.smallGrad}><Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>{formatINR(sg.suggestedBudget)}</Text></LinearGradient></TouchableOpacity>
              </View>
              </Animated.View>
            ))}
          </GlassCard>
          </Animated.View>
        )}

        {/* ── Recent Transactions ── */}
        <Animated.View entering={FadeInUp.delay(1000).springify()}>
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={{ color: Colors.textMuted, textAlign: "center", padding: 20 }}>No transactions yet</Text>
          ) : transactions.map((txn, i) => (
            <Animated.View key={i} entering={FadeInRight.delay(1050 + i * 60).springify()}>
            <View style={st.txnRow}>
              <LinearGradient colors={txn.type === "income" ? Gradients.emerald : Gradients.danger} style={st.txnDot}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>{txn.type === "income" ? "+" : "−"}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>{txn.title}</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{txn.category || "—"} • {formatDate(txn.created_at)}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "800", color: txn.type === "income" ? Colors.emerald : Colors.red }}>{txn.type === "income" ? "+" : "-"}{formatINR(txn.amount)}</Text>
              <TouchableOpacity onPress={() => openEdit(txn)} style={{ padding: 4, marginLeft: 6 }}><Text style={{ fontSize: 14, color: Colors.purple, fontWeight: "700" }}>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(txn.id)} style={{ padding: 4 }}><Text style={{ fontSize: 14, color: Colors.red, fontWeight: "700" }}>Del</Text></TouchableOpacity>
            </View>
            </Animated.View>
          ))}
        </GlassCard>
        </Animated.View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Modals ── */}
      <Modal visible={showCatPicker} transparent animationType="slide">
        <View style={st.overlay}><View style={st.modal}>
          <Text style={st.modalTitle}>Select Category</Text>
          <View style={st.chipGrid}>{CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[st.chip, category === c && st.chipActive]} onPress={() => { setCategory(c); setShowCatPicker(false); }}>
              <Text style={[st.chipText, category === c && { color: "#fff" }]}>{c}</Text>
            </TouchableOpacity>
          ))}</View>
          <TouchableOpacity onPress={() => setShowCatPicker(false)} style={{ alignItems: "center", marginTop: 18 }}><Text style={{ color: Colors.purple, fontWeight: "600" }}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={showBudgetCatPicker} transparent animationType="slide">
        <View style={st.overlay}><View style={st.modal}>
          <Text style={st.modalTitle}>Budget Category</Text>
          <View style={st.chipGrid}>{CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[st.chip, budgetCategory === c && st.chipActive]} onPress={() => { setBudgetCategory(c); setShowBudgetCatPicker(false); }}>
              <Text style={[st.chipText, budgetCategory === c && { color: "#fff" }]}>{c}</Text>
            </TouchableOpacity>
          ))}</View>
          <TouchableOpacity onPress={() => setShowBudgetCatPicker(false)} style={{ alignItems: "center", marginTop: 18 }}><Text style={{ color: Colors.purple, fontWeight: "600" }}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={st.overlay}><View style={st.modal}>
          <Text style={st.modalTitle}>Edit Transaction</Text>
          <TextInput style={st.input} value={editTitle} onChangeText={setEditTitle} placeholder="Title" placeholderTextColor={Colors.textMuted} />
          <TextInput style={st.input} value={editAmount} onChangeText={setEditAmount} placeholder="Amount" keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
          <View style={st.toggleRow}>
            <TouchableOpacity style={[st.toggleBtn, editType === "expense" && { backgroundColor: Colors.red, borderColor: Colors.red }]} onPress={() => setEditType("expense")}><Text style={[st.toggleText, editType === "expense" && { color: "#fff" }]}>Expense</Text></TouchableOpacity>
            <TouchableOpacity style={[st.toggleBtn, editType === "income" && { backgroundColor: Colors.emerald, borderColor: Colors.emerald }]} onPress={() => setEditType("income")}><Text style={[st.toggleText, editType === "income" && { color: "#fff" }]}>Income</Text></TouchableOpacity>
          </View>
          <TextInput style={st.input} value={editCategory} onChangeText={setEditCategory} placeholder="Category" placeholderTextColor={Colors.textMuted} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditModal(false)}>
              <View style={st.secBtn}><Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>Cancel</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, borderRadius: 14, overflow: "hidden" }} onPress={saveEdit}>
              <LinearGradient colors={Gradients.purple} style={st.gradBtn}><Text style={st.gradBtnText}>Save</Text></LinearGradient>
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTitle: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: Colors.purple, fontWeight: "600", marginTop: 2 },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.7)", justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 18, padding: 14 },
  statIcon: { fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  statValue: { fontSize: 15, fontWeight: "800", color: "#fff", marginTop: 4 },

  featured: { borderRadius: 22, padding: 20, marginBottom: 16, flexDirection: "row", alignItems: "center" },
  featLabel: { fontSize: 17, fontWeight: "800", color: "#fff" },
  featSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 6, lineHeight: 18 },
  scoreBubble: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.25)", borderWidth: 2, borderColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center" },
  scoreNum: { fontSize: 22, fontWeight: "900", color: "#fff" },

  section: { padding: 18, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  insightCard: { borderLeftWidth: 3, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: "rgba(255,255,255,0.35)" },
  insightText: { fontSize: 13, color: Colors.textOnGlass, lineHeight: 19 },

  input: { ...Glass.input, padding: 13, fontSize: 14, color: Colors.textPrimary, marginBottom: 10 },

  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: "center", backgroundColor: "rgba(255,255,255,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.5)" },
  toggleText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },

  gradBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 14 },
  gradBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  smallGrad: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18, justifyContent: "center", alignItems: "center" },
  secBtn: { paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },

  progBg: { height: 8, backgroundColor: "rgba(139,92,246,0.12)", borderRadius: 4, marginTop: 6, overflow: "hidden" },
  progFill: { height: 8, borderRadius: 4 },

  sugRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.3)" },

  txnRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.25)", gap: 10 },
  txnDot: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },

  overlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 16, textAlign: "center" },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: "rgba(139,92,246,0.08)", borderWidth: 1, borderColor: "rgba(139,92,246,0.15)" },
  chipActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  chipText: { fontSize: 13, color: Colors.purple, fontWeight: "600" },
});
