"use client";

import { ReactNode } from "react";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import FloatingAIChat from "./components/FloatingAIChat";
import OnboardingModal from "./components/OnboardingModal";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <FloatingAIChat />
        <OnboardingModal />
      </ToastProvider>
    </ThemeProvider>
  );
}
