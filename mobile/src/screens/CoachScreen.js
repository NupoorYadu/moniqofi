import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Colors, Gradients, Glass } from "../theme/colors";
import { GradientBG } from "../components/GradientBG";
import { GlassCard, GlassPill } from "../components/GlassCard";

const QUICK_QS = [
  "How can I save more?",
  "Am I spending too much on food?",
  "What's a good emergency fund?",
  "Tips for my budget",
];

export default function CoachScreen() {
  const { logout } = useAuth();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI Financial Coach.\n\nAsk me anything about your finances — saving strategies, spending habits, budget tips, and more!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const send = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    const userMsg = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.filter(m => m.role === "user").map(m => m.content);
      const res = await api.post("/api/coach/ask", { question: msg, history });
      const reply = res.answer || "I'm not sure how to answer that.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      if (err.status === 401) { logout(); return; }
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 200);
  }, [input, messages, logout]);

  return (
    <GradientBG>
      <View style={st.header}>
        <Text style={st.title}>AI Coach</Text>
        <Text style={st.sub}>Your personal financial advisor</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={st.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[st.bubble, m.role === "user" ? st.userBubble : st.aiBubble]}>
              {m.role === "assistant" && <View style={st.aiDot}><Text style={{ fontSize: 14, fontWeight: "900", color: Colors.purple }}>M</Text></View>}
              <View style={[st.bubbleBody, m.role === "user" ? st.userBody : st.aiBody]}>
                <Text style={[st.bubbleText, m.role === "user" && { color: "#fff" }]}>{m.content}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={[st.bubble, st.aiBubble]}>
              <View style={st.aiDot}><Text style={{ fontSize: 14, fontWeight: "900", color: Colors.purple }}>M</Text></View>
              <View style={st.aiBody}><ActivityIndicator color={Colors.purple} size="small" /></View>
            </View>
          )}
        </ScrollView>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.quickRow}>
            {QUICK_QS.map((q, i) => (
              <TouchableOpacity key={i} onPress={() => send(q)}>
                <GlassPill style={st.quickPill}><Text style={{ fontSize: 12, color: Colors.purple, fontWeight: "600" }}>{q}</Text></GlassPill>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View style={st.inputBar}>
          <TextInput
            style={st.textInput} placeholder="Ask your AI coach…" placeholderTextColor={Colors.textMuted}
            value={input} onChangeText={setInput} multiline maxLength={500}
            onSubmitEditing={() => send()} returnKeyType="send"
          />
          <TouchableOpacity onPress={() => send()} disabled={loading || !input.trim()} style={{ borderRadius: 20, overflow: "hidden" }}>
            <LinearGradient colors={input.trim() ? Gradients.purple : ["rgba(139,92,246,0.3)", "rgba(139,92,246,0.3)"]} style={st.sendBtn}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBG>
  );
}

const st = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 8, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "900", color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: 12, color: Colors.purple, fontWeight: "600", marginTop: 2 },

  msgList: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 10 },
  bubble: { flexDirection: "row", marginBottom: 12, maxWidth: "88%" },
  userBubble: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  aiBubble: { alignSelf: "flex-start" },
  aiDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.5)", justifyContent: "center", alignItems: "center", marginRight: 8, marginTop: 2 },
  bubbleBody: { borderRadius: 20, padding: 14, maxWidth: "90%" },
  userBody: { backgroundColor: Colors.purple, borderBottomRightRadius: 6 },
  aiBody: { backgroundColor: "rgba(255,255,255,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 14, lineHeight: 21, color: Colors.textOnGlass },

  quickRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  quickPill: { paddingHorizontal: 14, paddingVertical: 9 },

  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.2)" },
  textInput: { flex: 1, ...Glass.input, padding: 13, paddingTop: 13, maxHeight: 100, fontSize: 14, color: Colors.textPrimary },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
});
