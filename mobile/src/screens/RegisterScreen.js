import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../api/client";
import { Colors, Glass, Gradients, Shadows } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard } from "../components/GlassCard";
import MoniqoLogo from "../components/MoniqoLogo";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) { Alert.alert("Error", "All fields are required"); return; }
    if (password !== confirm) { Alert.alert("Error", "Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", { name: name.trim(), email: email.trim().toLowerCase(), password });
      if (res.requiresVerification) {
        Alert.alert("Verify Your Email", "We sent a verification link to your email. Please verify before logging in.", [{ text: "OK", onPress: () => navigation.navigate("Login") }]);
      } else {
        Alert.alert("Success", "Account created! Please log in.", [{ text: "OK", onPress: () => navigation.navigate("Login") }]);
      }
    } catch (err) { Alert.alert("Error", err.message || "Registration failed"); }
    setLoading(false);
  };

  return (
    <GradientBG>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={st.container} keyboardShouldPersistTaps="handled">
          <View style={st.logoArea}>
            <LinearGradient colors={Gradients.purple} style={[st.logoCircle, Shadows.glow]}>
              <MoniqoLogo size={32} color="#fff" />
            </LinearGradient>
            <Text style={st.brand}>Create Account</Text>
            <Text style={st.tagline}>Start your financial wellness journey</Text>
          </View>

          <GlassCard style={st.formCard}>
            <TextInput style={st.input} placeholder="Full Name" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
            <TextInput style={st.input} placeholder="Email address" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={st.input} placeholder="Password" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={st.input} placeholder="Confirm Password" placeholderTextColor={Colors.textMuted} value={confirm} onChangeText={setConfirm} secureTextEntry />
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={{ borderRadius: 14, overflow: "hidden", marginTop: 6 }}>
              <LinearGradient colors={Gradients.purple} style={st.btn}><Text style={st.btnText}>{loading ? "Creating…" : "Sign Up"}</Text></LinearGradient>
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 24 }}>
            <Text style={st.footerText}>Already have an account? <Text style={st.link}>Sign In</Text></Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
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
