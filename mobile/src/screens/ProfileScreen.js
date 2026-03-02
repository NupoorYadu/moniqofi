import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  Modal, FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../context/AuthContext";
import { api, uploadFormData } from "../api/client";
import { Colors, Gradients, Shadows, Glass } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";

export default function ProfileScreen({ navigation }) {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try { const res = await api.get("/api/auth/me"); setUser(res); } catch (err) { if (err.status === 401) logout(); }
    setLoading(false);
  }, [logout]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  // ─── CSV Import ───────────────────────────────────────────────────────────
  const [importing, setImporting]     = useState(false);
  const [importPreview, setImportPreview] = useState(null); // { rows, skipped }
  const [confirming, setConfirming]   = useState(false);

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      setImporting(true);

      const formData = new FormData();
      formData.append("file", { uri: file.uri, name: file.name || "transactions.csv", type: file.mimeType || "text/csv" });

      const preview = await uploadFormData("/api/transactions/import/preview", formData);
      setImportPreview(preview);
    } catch (err) {
      Alert.alert("Import Error", err.message || "Failed to parse CSV");
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.rows?.length) return;
    setConfirming(true);
    try {
      const res = await api.post("/api/transactions/import/confirm", { rows: importPreview.rows });
      setImportPreview(null);
      Alert.alert("Import Complete", `Successfully imported ${res.imported || importPreview.rows.length} transactions.`);
    } catch (err) {
      Alert.alert("Error", err.message || "Import failed");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <GradientBG><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={Colors.purple} /></View></GradientBG>;

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <GradientBG>
      <View style={st.header}>
        <Text style={st.title}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + Info */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <LinearGradient colors={Gradients.purple} style={[st.avatar, Shadows.glow]}>
            <Text style={st.avatarText}>{initial}</Text>
          </LinearGradient>
          <Text style={st.name}>{user?.name || "User"}</Text>
          <Text style={st.email}>{user?.email || ""}</Text>
        </View>

        {/* Info Card */}
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>Account Details</Text>
          {[
            { label: "Name", value: user?.name },
            { label: "Email", value: user?.email },
            { label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—" },
          ].map((item, i) => (
            <View key={i} style={st.infoRow}>
              <Text style={st.infoLabel}>{item.label}</Text>
              <Text style={st.infoValue}>{item.value || "—"}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Quick Features */}
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>Quick Access</Text>
          {[
            { letter: "H", label: "Health Score", desc: "View your financial health", color: Colors.red },
            { letter: "P", label: "AI Personality", desc: "Discover your money type", color: Colors.blue },
            { letter: "S", label: "Future Simulation", desc: "Model your financial future", color: Colors.purple },
            { letter: "C", label: "AI Coach", desc: "Get personalized advice", color: Colors.emerald },
          ].map((item, i) => (
            <View key={i} style={st.featureRow}>
              <View style={[st.featureDot, { backgroundColor: item.color + "20" }]}><Text style={{ fontSize: 16, fontWeight: "900", color: item.color }}>{item.letter}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Connected Accounts */}
        <TouchableOpacity onPress={() => navigation.navigate("AIBrain", { screen: "ConnectedAccounts" })}>
          <GlassCard style={st.section} noBlur>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[st.featureDot, { backgroundColor: "#FBBF2420" }]}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#FBBF24" }}>B</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textPrimary }}>Connected Accounts</Text>
                <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 1 }}>Link banks & payment apps to auto-import spending</Text>
              </View>
              <Text style={{ fontSize: 18, color: Colors.textMuted }}>{">"}</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Import CSV */}
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>Import Transactions</Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 16, lineHeight: 18 }}>
            Upload a CSV file exported from your bank or any finance app. Preview rows before confirming.
          </Text>
          <TouchableOpacity onPress={handlePickCSV} disabled={importing}
            style={{ borderRadius: 14, overflow: "hidden" }}>
            <LinearGradient colors={["#8B5CF6", "#6366F1"]} style={{ paddingVertical: 14, alignItems: "center", borderRadius: 14 }}>
              {importing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>📂 Import CSV File</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>

        {/* CSV Preview Modal */}
        <Modal visible={!!importPreview} animationType="slide" transparent>
          <View style={st.modalOverlay}>
            <View style={st.modalBox}>
              <Text style={st.modalTitle}>Preview Import</Text>
              <Text style={st.modalSub}>{importPreview?.rows?.length || 0} transactions found{importPreview?.skipped ? `, ${importPreview.skipped} skipped` : ""}</Text>
              <FlatList
                data={importPreview?.rows || []}
                keyExtractor={(_, i) => String(i)}
                style={{ maxHeight: 320, marginBottom: 16 }}
                renderItem={({ item }) => (
                  <View style={st.previewRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.previewTitle} numberOfLines={1}>{item.title || item.description || "Transaction"}</Text>
                      <Text style={st.previewDate}>{item.date || ""} · {item.category || "Other"}</Text>
                    </View>
                    <Text style={[st.previewAmt, { color: item.type === "income" ? "#10B981" : "#EF4444" }]}>
                      {item.type === "income" ? "+" : "-"}₹{parseFloat(item.amount || 0).toLocaleString()}
                    </Text>
                  </View>
                )}
              />
              <View style={st.modalBtns}>
                <TouchableOpacity onPress={() => setImportPreview(null)} style={st.cancelBtn}>
                  <Text style={{ color: Colors.purple, fontWeight: "700", fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmImport} disabled={confirming} style={{ flex: 1 }}>
                  <LinearGradient colors={Gradients.purple} style={st.confirmBtn}>
                    {confirming
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Confirm Import</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* App Info */}
        <GlassCard style={st.section} noBlur>
          <Text style={st.secTitle}>App Info</Text>
          <View style={st.infoRow}>
            <Text style={st.infoLabel}>Version</Text>
            <Text style={st.infoValue}>1.0.0</Text>
          </View>
          <View style={st.infoRow}>
            <Text style={st.infoLabel}>Platform</Text>
            <Text style={st.infoValue}>React Native + Expo</Text>
          </View>
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={{ borderRadius: 14, overflow: "hidden", marginBottom: 40 }}>
          <LinearGradient colors={Gradients.danger} style={st.logoutBtn}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 12, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  avatarText: { fontSize: 32, fontWeight: "900", color: "#fff" },
  name: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  section: { padding: 18, marginBottom: 16 },
  secTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.25)" },
  infoLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: "600" },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: "700" },

  featureRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.25)" },
  featureDot: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },

  logoutBtn: { paddingVertical: 16, alignItems: "center", borderRadius: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox:     { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 20, fontWeight: "900", color: "#1E1B4B", marginBottom: 4 },
  modalSub:     { fontSize: 13, color: "rgba(30,27,75,0.5)", marginBottom: 16 },
  previewRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  previewTitle: { fontSize: 14, fontWeight: "700", color: "#1E1B4B" },
  previewDate:  { fontSize: 11, color: "rgba(30,27,75,0.45)", marginTop: 2 },
  previewAmt:   { fontSize: 14, fontWeight: "800" },
  modalBtns:    { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn:    { flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: 14, backgroundColor: "rgba(139,92,246,0.08)" },
  confirmBtn:   { paddingVertical: 14, alignItems: "center", borderRadius: 14 },
});
