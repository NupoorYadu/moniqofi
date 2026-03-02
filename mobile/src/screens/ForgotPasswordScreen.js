import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../api/client";
import { Colors, Glass, Gradients, Shadows } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";
import MoniqoLogo from "../components/MoniqoLogo";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) { Alert.alert("Error", "Enter your email"); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: email.trim().toLowerCase() });
      Alert.alert(
        "Email Sent",
        "If an account exists, a reset link has been sent.\n\nYou can also tap 'Enter Token' to manually paste the token from the email.",
        [
          { text: "Enter Token", onPress: () => navigation.navigate("ResetPassword") },
          { text: "OK", onPress: () => navigation.navigate("Login") },
        ]
      );
    } catch (err) { Alert.alert("Info", "If your email is registered, you'll receive a reset link."); }
    setLoading(false);
  };

  return (
    <GradientBG>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={st.container}>
          <View style={st.logoArea}>
            <LinearGradient colors={Gradients.blue} style={[st.logoCircle, Shadows.glow]}>
              <MoniqoLogo size={32} color="#fff" />
            </LinearGradient>
            <Text style={st.brand}>Reset Password</Text>
            <Text style={st.tagline}>We'll send you a recovery link</Text>
          </View>

          <GlassCard style={st.formCard}>
            <TextInput style={st.input} placeholder="Email address" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity onPress={handleReset} disabled={loading} style={{ borderRadius: 14, overflow: "hidden", marginTop: 6 }}>
              <LinearGradient colors={Gradients.blue} style={st.btn}><Text style={st.btnText}>{loading ? "Sending…" : "Send Reset Link"}</Text></LinearGradient>
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")} style={{ marginTop: 16 }}>
            <Text style={st.footerText}>Already have a token? <Text style={st.link}>Reset Password</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 12 }}>
            <Text style={st.footerText}>Back to <Text style={st.link}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logoArea: { alignItems: "center", marginBottom: 30 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  logoEmoji: { fontSize: 28 },
  brand: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary },
  tagline: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  formCard: { padding: 24 },
  input: { ...Glass.input, padding: 14, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },
  btn: { paddingVertical: 15, alignItems: "center", borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  link: { color: Colors.purple, fontWeight: "700", fontSize: 13 },
  footerText: { textAlign: "center", color: Colors.textOnGlass, fontSize: 13 },
});
