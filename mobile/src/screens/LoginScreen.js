import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Glass, Gradients, Shadows } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";
import MoniqoLogo from "../components/MoniqoLogo";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) { Alert.alert("Error", "Enter email and password"); return; }
    setLoading(true);
    try {
      const data = await api.post("/api/auth/login", { email: email.trim().toLowerCase(), password });
      if (data.token) await login(data.token);
    } catch (err) {
      if (err.data?.requiresVerification) {
        Alert.alert("Email Not Verified", "Please check your email and verify your account before logging in.");
      } else {
        Alert.alert("Login Failed", err.message || "Invalid credentials");
      }
    }
    setLoading(false);
  };

  return (
    <GradientBG>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={st.container}>
          {/* Logo */}
          <View style={st.logoArea}>
            <LinearGradient colors={Gradients.purple} style={[st.logoCircle, Shadows.glow]}>
              <MoniqoLogo size={36} color="#fff" />
            </LinearGradient>
            <Text style={st.brand}>MoniqoFi</Text>
            <Text style={st.tagline}>Smart finances, beautifully simple</Text>
          </View>

          {/* Glass Form */}
          <GlassCard style={st.formCard}>
            <Text style={st.formTitle}>Welcome Back</Text>
            <TextInput
              style={st.input} placeholder="Email address" placeholderTextColor={Colors.textMuted}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            />
            <TextInput
              style={st.input} placeholder="Password" placeholderTextColor={Colors.textMuted}
              value={password} onChangeText={setPassword} secureTextEntry
            />
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "flex-end", marginBottom: 18 }}>
              <Text style={st.link}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ borderRadius: 14, overflow: "hidden" }}>
              <LinearGradient colors={Gradients.purple} style={st.btn}>
                <Text style={st.btnText}>{loading ? "Signing in…" : "Sign In"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>

          {/* Footer */}
          <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 24 }}>
            <Text style={st.footerText}>Don't have an account? <Text style={st.link}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logoArea: { alignItems: "center", marginBottom: 36 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  logoEmoji: { fontSize: 32 },
  brand: { fontSize: 30, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },

  formCard: { padding: 24 },
  formTitle: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, marginBottom: 20, textAlign: "center" },
  input: { ...Glass.input, padding: 14, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },
  btn: { paddingVertical: 15, alignItems: "center", borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  link: { color: Colors.purple, fontWeight: "700", fontSize: 13 },
  footerText: { textAlign: "center", color: Colors.textOnGlass, fontSize: 13 },
});
