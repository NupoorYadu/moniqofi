import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { Colors } from "../theme/colors";
import { api } from "../api/client";
import { GlassCard } from "../components/GlassCard";

const TABS = [
  { key: "aa",    label: "Setu AA",  emoji: "🏦", desc: "Indian banks (RBI-regulated)" },
  { key: "plaid", label: "Plaid",    emoji: "🌍", desc: "International banks" },
];

// ─── Plaid panel ─────────────────────────────────────────────────────────────
function PlaidPanel() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.get("/api/plaid/accounts");
      setAccounts(data.filter((a) => a.status === "active"));
    } catch (e) { console.log("Plaid fetch:", e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleConnect = async () => {
    try {
      const { link_token } = await api.post("/api/plaid/create-link-token", { platform: "mobile" });
      if (link_token) {
        const url = `https://cdn.plaid.com/link/v2/stable/link.html?token=${link_token}`;
        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
          setTimeout(fetchAccounts, 3000);
        } else {
          Alert.alert("Setup Required", "Connect via the MoniqoFi web app for now.");
        }
      }
    } catch { Alert.alert("Error", "Failed to initialize bank connection"); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg("");
    try {
      const data = await api.post("/api/plaid/sync");
      setSyncMsg(data.message || `Synced ${data.synced} transactions`);
      fetchAccounts();
    } catch { setSyncMsg("Sync failed"); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(""), 5000); }
  };

  const handleUnlink = (id, name) => Alert.alert("Disconnect Account", `Remove ${name}?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Disconnect", style: "destructive", onPress: async () => {
      try { await api.delete(`/api/plaid/accounts/${id}`); fetchAccounts(); }
      catch { Alert.alert("Error", "Failed to disconnect"); }
    }},
  ]);

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={Colors.purple} /></View>;

  return (
    <ScrollView contentContainerStyle={st.panelContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAccounts(); }} />}>
      {syncMsg !== "" && <View style={st.msgBox}><Text style={st.msgText}>{syncMsg}</Text></View>}
      <View style={st.actionRow}>
        <TouchableOpacity onPress={handleConnect} style={{ flex: 1 }}>
          <LinearGradient colors={[Colors.purple, Colors.blue]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={st.connectGrad}>
            <Text style={st.connectText}>+ Connect Bank</Text>
          </LinearGradient>
        </TouchableOpacity>
        {accounts.length > 0 && (
          <TouchableOpacity onPress={handleSync} disabled={syncing} style={[st.syncBtn, syncing && { opacity: 0.5 }]}>
            {syncing ? <ActivityIndicator size="small" color={Colors.purple} /> : <Text style={st.syncBtnText}>Sync All</Text>}
          </TouchableOpacity>
        )}
      </View>
      {accounts.length === 0 ? (
        <GlassCard style={st.emptyCard}>
          <Text style={st.emptyTitle}>No accounts linked</Text>
          <Text style={st.emptyDesc}>Connect your international bank or card via Plaid above.</Text>
        </GlassCard>
      ) : accounts.map((item, i) => (
        <Animated.View key={String(item.id)} entering={FadeInRight.delay(i * 80).springify()}>
          <GlassCard style={st.accountCard}>
            <View style={st.accountRow}>
              <View style={[st.accountIcon, { backgroundColor: "#10B98120" }]}>
                <Text style={[st.accountIconText, { color: "#10B981" }]}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.accountName}>{item.institution_name}</Text>
                <Text style={st.accountSub}>{item.account_name || item.account_type}{item.account_mask ? ` ****${item.account_mask}` : ""}</Text>
                <View style={st.statusRow}>
                  <View style={st.statusBadge}><View style={st.statusDot} /><Text style={st.statusText}>Connected</Text></View>
                  {item.last_synced && <Text style={st.syncedText}>Synced {new Date(item.last_synced).toLocaleDateString()}</Text>}
                </View>
              </View>
              <TouchableOpacity onPress={() => handleUnlink(item.id, item.institution_name)} style={st.unlinkBtn}>
                <Text style={st.unlinkText}>x</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>
      ))}
      <Text style={st.secNote}>🔒 Bank credentials are never stored. Connections secured via Plaid 256-bit encryption.</Text>
    </ScrollView>
  );
}

// ─── Setu AA panel ───────────────────────────────────────────────────────────
function SetuAAPanel() {
  const [banks, setBanks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [fetching, setFetching] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBanks = useCallback(async () => {
    try {
      const data = await api.get("/api/aa/banks");
      setBanks(Array.isArray(data) ? data : data.banks || []);
    } catch (e) { console.log("AA banks:", e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchBanks(); }, [fetchBanks]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const res = await api.post("/api/aa/consent", {
        fiTypes: ["DEPOSIT", "MUTUAL_FUNDS", "SIP"],
        fromDate: startDate, toDate: endDate,
      });
      const redirectUrl = res.redirectUrl || res.url || res.consentUrl;
      if (redirectUrl) {
        if (await Linking.canOpenURL(redirectUrl)) {
          await Linking.openURL(redirectUrl);
          setTimeout(fetchBanks, 4000);
        } else { Alert.alert("Error", "Cannot open consent URL"); }
      } else { Alert.alert("Error", "No redirect URL received"); }
    } catch (e) { Alert.alert("Connection Error", e.message || "Failed to start consent"); }
    finally { setConnecting(false); }
  };

  const handleFetch = (consentId, bankName) => Alert.alert("Fetch Bank Data", `Pull latest data from ${bankName}?`, [
    { text: "Cancel", style: "cancel" },
    { text: "Fetch", onPress: async () => {
      setFetching(consentId);
      try {
        const res = await api.post(`/api/aa/fetch/${consentId}`);
        Alert.alert("Success", res.message || "Data fetched successfully");
        fetchBanks();
      } catch (e) { Alert.alert("Error", e.message || "Fetch failed"); }
      finally { setFetching(null); }
    }},
  ]);

  const statusColor = (s) => (s === "ACTIVE" || s === "active") ? "#10B981" : (s === "PENDING" || s === "pending") ? "#F59E0B" : "#EF4444";

  if (loading) return <View style={st.center}><ActivityIndicator size="large" color={Colors.purple} /></View>;

  return (
    <ScrollView contentContainerStyle={st.panelContent} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBanks(); }} />}>
      <GlassCard style={st.infoBanner}>
        <Text style={st.infoTitle}>🏦 Account Aggregator (RBI-regulated)</Text>
        <Text style={st.infoDesc}>Share data from any Indian bank with RBI-compliant consent — no credentials needed. Works with SBI, HDFC, ICICI, Axis & 100+ banks.</Text>
      </GlassCard>

      <TouchableOpacity onPress={handleConnect} disabled={connecting} style={{ marginBottom: 20 }}>
        <LinearGradient colors={["#8B5CF6", "#3B82F6"]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={[st.connectGrad, connecting && { opacity: 0.6 }]}>
          {connecting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.connectText}>+ Connect via Account Aggregator</Text>}
        </LinearGradient>
      </TouchableOpacity>

      {banks.length === 0 ? (
        <GlassCard style={st.emptyCard}>
          <Text style={st.emptyTitle}>No banks linked</Text>
          <Text style={st.emptyDesc}>Tap above to link your Indian bank account via the RBI Account Aggregator framework.</Text>
        </GlassCard>
      ) : banks.map((bank, i) => {
        const sc = statusColor(bank.status);
        return (
          <Animated.View key={bank.consentId || bank.id || i} entering={FadeInRight.delay(i * 80).springify()}>
            <GlassCard style={st.accountCard}>
              <View style={st.accountRow}>
                <View style={[st.accountIcon, { backgroundColor: Colors.purple + "20" }]}>
                  <Text style={{ fontSize: 20 }}>🏦</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.accountName}>{bank.bankName || bank.fipName || "Indian Bank"}</Text>
                  <Text style={st.accountSub}>{bank.maskedAccountNumber || bank.accountType || "Account"}</Text>
                  <View style={st.statusRow}>
                    <View style={[st.statusBadge, { backgroundColor: sc + "20" }]}>
                      <View style={[st.statusDot, { backgroundColor: sc }]} />
                      <Text style={[st.statusText, { color: sc }]}>{bank.status || "Active"}</Text>
                    </View>
                    {bank.lastFetched && <Text style={st.syncedText}>Fetched {new Date(bank.lastFetched).toLocaleDateString()}</Text>}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleFetch(bank.consentId, bank.bankName || "bank")} disabled={fetching === bank.consentId} style={st.fetchBtn}>
                  {fetching === bank.consentId ? <ActivityIndicator size="small" color={Colors.purple} /> : <Text style={st.fetchBtnText}>Fetch</Text>}
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>
        );
      })}
      <Text style={st.secNote}>🔒 MoniqoFi is an RBI-approved FIU. Data is fetched only with your explicit consent.</Text>
    </ScrollView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ConnectedAccountsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("aa");

  return (
    <LinearGradient colors={["#EDE9FE", "#DDD6FE", "#C4B5FD"]} style={st.container}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Text style={st.backText}>&#8249;</Text>
        </TouchableOpacity>
        <Text style={st.title}>Connected Accounts</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()} style={st.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
            style={[st.tabBtn, activeTab === tab.key && st.tabBtnActive]}>
            <Text style={[st.tabLabel, activeTab === tab.key && st.tabLabelActive]}>{tab.emoji} {tab.label}</Text>
            <Text style={[st.tabDesc, activeTab === tab.key && st.tabDescActive]}>{tab.desc}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {activeTab === "aa" ? <SetuAAPanel /> : <PlaidPanel />}
    </LinearGradient>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container:  { flex: 1 },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 8 },
  backBtn:    { width: 36, height: 36, justifyContent: "center" },
  backText:   { fontSize: 26, color: "#1E1B4B", fontWeight: "600" },
  title:      { fontSize: 22, fontWeight: "900", color: "#1E1B4B" },
  tabRow:     { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  tabBtn:     { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.35)", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(139,92,246,0.15)" },
  tabBtnActive:   { backgroundColor: "rgba(139,92,246,0.12)", borderColor: Colors.purple },
  tabLabel:   { fontSize: 13, fontWeight: "800", color: "rgba(30,27,75,0.5)" },
  tabLabelActive: { color: Colors.purple },
  tabDesc:    { fontSize: 10, color: "rgba(30,27,75,0.35)", marginTop: 2, textAlign: "center" },
  tabDescActive:  { color: "rgba(139,92,246,0.7)" },
  panelContent: { padding: 16, paddingBottom: 100 },
  center:     { flex: 1, justifyContent: "center", alignItems: "center" },
  msgBox:     { backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 12, padding: 12, marginBottom: 16 },
  msgText:    { color: "#10B981", fontSize: 13, fontWeight: "600" },
  infoBanner: { padding: 16, marginBottom: 16 },
  infoTitle:  { fontSize: 14, fontWeight: "800", color: "#1E1B4B", marginBottom: 4 },
  infoDesc:   { fontSize: 12, color: "rgba(30,27,75,0.55)", lineHeight: 18 },
  actionRow:  { flexDirection: "row", gap: 12, marginBottom: 20 },
  connectGrad:{ paddingVertical: 15, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  connectText:{ color: "#fff", fontSize: 15, fontWeight: "800" },
  syncBtn:    { paddingHorizontal: 20, borderRadius: 16, backgroundColor: "rgba(139,92,246,0.1)", justifyContent: "center", alignItems: "center" },
  syncBtnText:{ color: Colors.purple, fontSize: 14, fontWeight: "700" },
  emptyCard:  { padding: 32, alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#1E1B4B", marginBottom: 6 },
  emptyDesc:  { fontSize: 13, color: "rgba(30,27,75,0.45)", textAlign: "center", lineHeight: 18, maxWidth: 260 },
  accountCard:{ marginBottom: 12, padding: 16 },
  accountRow: { flexDirection: "row", alignItems: "flex-start" },
  accountIcon:{ width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 12 },
  accountIconText: { fontSize: 18, fontWeight: "900" },
  accountName:{ fontSize: 15, fontWeight: "800", color: "#1E1B4B" },
  accountSub: { fontSize: 12, color: "rgba(30,27,75,0.5)", marginTop: 2 },
  statusRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  statusBadge:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(16,185,129,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  statusText: { fontSize: 10, fontWeight: "700", color: "#10B981" },
  syncedText: { fontSize: 10, color: "rgba(30,27,75,0.35)" },
  unlinkBtn:  { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(239,68,68,0.08)" },
  unlinkText: { fontSize: 14, fontWeight: "700", color: "#EF4444" },
  fetchBtn:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(139,92,246,0.1)", justifyContent: "center", alignItems: "center", minWidth: 60 },
  fetchBtnText: { fontSize: 12, fontWeight: "700", color: Colors.purple },
  secNote:    { fontSize: 11, color: "rgba(30,27,75,0.4)", lineHeight: 16, textAlign: "center", marginTop: 16, paddingHorizontal: 8 },
});
