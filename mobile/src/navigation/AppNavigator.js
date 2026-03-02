import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

// Auth screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";

// Main screens
import DashboardScreen from "../screens/DashboardScreen";
import LiveFeedScreen from "../screens/LiveFeedScreen";
import AIBrainScreen from "../screens/AIBrainScreen";
import HealthScoreScreen from "../screens/HealthScoreScreen";
import PersonalityScreen from "../screens/PersonalityScreen";
import SimulationScreen from "../screens/SimulationScreen";
import SubscriptionsScreen from "../screens/SubscriptionsScreen";
import GoalsScreen from "../screens/GoalsScreen";
import CoachScreen from "../screens/CoachScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ConnectedAccountsScreen from "../screens/ConnectedAccountsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AIStack = createNativeStackNavigator();

// Tab bar icon component
function TabIcon({ icon, focused }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
    </View>
  );
}

// AI Brain sub-stack (hub → detail pages)
function AIBrainStack() {
  return (
    <AIStack.Navigator screenOptions={{ headerShown: false }}>
      <AIStack.Screen name="AIBrainHub" component={AIBrainScreen} />
      <AIStack.Screen name="HealthScore" component={HealthScoreScreen} />
      <AIStack.Screen name="Personality" component={PersonalityScreen} />
      <AIStack.Screen name="Simulation" component={SimulationScreen} />
      <AIStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <AIStack.Screen name="ConnectedAccounts" component={ConnectedAccountsScreen} />
    </AIStack.Navigator>
  );
}

// Main tab navigator (after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.purple,
        tabBarInactiveTintColor: "rgba(30,27,75,0.35)",
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.65)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.6)",
          paddingBottom: 6,
          paddingTop: 6,
          height: 65,
          position: "absolute",
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LiveFeed"
        component={LiveFeedScreen}
        options={{
          tabBarLabel: "Live",
          tabBarIcon: ({ focused }) => <TabIcon icon="⚡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AIBrain"
        component={AIBrainStack}
        options={{
          tabBarLabel: "AI Brain",
          tabBarIcon: ({ focused }) => <TabIcon icon="🧠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: "Goals",
          tabBarIcon: ({ focused }) => <TabIcon icon="🎯" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Coach"
        component={CoachScreen}
        options={{
          tabBarLabel: "Coach",
          tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator: Auth stack or Main tabs based on login state
export default function AppNavigator() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#DDD6FE" }}>
        <Text style={{ fontSize: 32 }}>💜</Text>
        <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.purple, marginTop: 12 }}>
          MoniqoFi
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
