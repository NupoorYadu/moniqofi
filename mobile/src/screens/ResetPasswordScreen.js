import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { api } from "../api/client";
import { Colors, Gradients } from "../theme/colors";
import { GlassCard } from "../components/GlassCard";

export default function ResetPasswordScreen({ navigation, route }) {
  // Token may come via deep link params or manual entry
  const [token, setToken]           = useState(route?.params?.token || "");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone]             = useState(false);

  const handleReset = async () => {
    if (!token.trim()) { Alert.alert("Required", "Paste the reset token from your email."); return; }
    if (password.length < 8)  { Alert.alert("Weak Password", "Password must be at least 8 characters."); return; }
    if (password !== confirm) { Alert.alert("Mismatch", "Passwords do not match."); return; }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token: token.trim(), password });
      setDone(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Reset failed — the link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#EDE9FE", "#DDD6FE", "#C4B5FD", "#F0ABFC"]} style={st.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">

          <Animated.View entering={FadeInUp.duration(600)} style={st.logoRow}>
            <LinearGradient colors={Gradients.purple} style={st.logoCircle}>
              <Text style={st.logoLetter}>M</Text>
            </LinearGradient>
            <Text style={st.appName}>MoniqoFi</Text>
          </Animated.View>

          {done ? (
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <GlassCard style={st.card}>
                <Text style={st.doneEmoji}>✅</Text>
                <Text style={st.cardTitle}>Password Reset!</Text>
                <Text style={st.cardDesc}>Your password has been updated. You can now sign in with your new password.</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")} style={st.submitBtn}>
                  <LinearGradient colors={Gradients.purple} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={st.submitGrad}>
                    <Text style={st.submitText}>Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </GlassCard>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <GlassCard style={st.card}>
                <Text style={st.cardTitle}>Reset Password</Text>
                <Text style={st.cardDesc}>
                  Paste the reset token from your email and enter your new password.
                </Text>

                {/* Token field */}
                <Text style={st.label}>Reset Token</Text>
                <View style={st.inputWrap}>
                  <TextInput
                    style={st.input}
                    placeholder="Paste token from email…"
                    placeholderTextColor="rgba(30,27,75,0.35)"
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* New password */}
                <Text style={st.label}>New Password</Text>
                <View style={st.inputWrap}>
                  <TextInput
                    style={[st.input, { flex: 1 }]}
                    placeholder="Min. 8 characters"
                    placeholderTextColor="rgba(30,27,75,0.35)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPass(p => !p)} style={st.eyeBtn}>
                    <Text style={st.eyeText}>{showPass ? "🙈" : "👁️"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm password */}
                <Text style={st.label}>Confirm Password</Text>
                <View style={st.inputWrap}>
                  <TextInput
                    style={[st.input, { flex: 1 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor="rgba(30,27,75,0.35)"
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={st.eyeBtn}>
                    <Text style={st.eyeText}>{showConfirm ? "🙈" : "👁️"}</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit */}
                <TouchableOpacity onPress={handleReset} disabled={loading} style={{ marginTop: 8 }}>
                  <LinearGradient colors={Gradients.purple} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={[st.submitGrad, loading && { opacity: 0.6 }]}>
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={st.submitText}>Reset Password</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </GlassCard>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(200).springify()} style={st.footer}>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={st.footerLink}>Back to Login</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  bg:           { flex: 1 },
  scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 60, justifyContent: "center" },
  logoRow:      { alignItems: "center", marginBottom: 32 },
  logoCircle:   { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 10, shadowColor: "#8B5CF6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  logoLetter:   { fontSize: 30, fontWeight: "900", color: "#fff" },
  appName:      { fontSize: 26, fontWeight: "900", color: "#1E1B4B", letterSpacing: -0.5 },
  card:         { padding: 24, marginBottom: 20 },
  cardTitle:    { fontSize: 22, fontWeight: "900", color: "#1E1B4B", marginBottom: 8 },
  cardDesc:     { fontSize: 13, color: "rgba(30,27,75,0.55)", lineHeight: 19, marginBottom: 20 },
  doneEmoji:    { fontSize: 48, textAlign: "center", marginBottom: 12 },
  label:        { fontSize: 13, fontWeight: "700", color: "#1E1B4B", marginBottom: 6, marginTop: 8 },
  inputWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(139,92,246,0.2)", paddingHorizontal: 14, height: 50, marginBottom: 4 },
  input:        { fontSize: 15, color: "#1E1B4B", flex: 1 },
  eyeBtn:       { padding: 4 },
  eyeText:      { fontSize: 18 },
  submitBtn:    { marginTop: 16 },
  submitGrad:   { paddingVertical: 15, borderRadius: 16, alignItems: "center" },
  submitText:   { color: "#fff", fontSize: 16, fontWeight: "800" },
  footer:       { alignItems: "center", marginTop: 8 },
  footerLink:   { fontSize: 14, color: Colors.purple, fontWeight: "700" },
});
