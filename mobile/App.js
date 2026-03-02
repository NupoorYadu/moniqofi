import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

function NetworkBanner() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>No internet connection</Text>
    </View>
  );
}

function ErrorFallback({ error, onReset }) {
  const msg = error?.message || "Unknown error";
  const stack = error?.stack || "";
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <ScrollView style={{ maxHeight: 350, width: "100%", marginVertical: 12 }}>
        <Text selectable style={{ color: "#FF4444", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 12 }}>
          {msg}
        </Text>
        <Text selectable style={{ color: "#FFAA44", fontSize: 10, lineHeight: 16 }}>
          {stack.substring(0, 2000)}
        </Text>
      </ScrollView>
      <Text style={styles.errorButton} onPress={onReset}>
        Try Again
      </Text>
    </View>
  );
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App ErrorBoundary:", error, info);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    // In production, send to crash reporting service (e.g., Sentry)
  }

  resetError = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.resetError} />;
    }
    return this.props.children;
  }
}

export default function App() {
  console.log("[App] Rendering App component");
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <NetworkBanner />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#E50914",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  bannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#808080",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    color: "#E50914",
    fontSize: 16,
    fontWeight: "600",
    padding: 12,
  },
});
