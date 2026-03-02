"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "./components/SplashScreen";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    const token = localStorage.getItem("token");
    router.push(token ? "/dashboard" : "/login");
  }, [router]);

  // Skip splash if user already saw it this session
  useEffect(() => {
    if (sessionStorage.getItem("splashSeen")) {
      setShowSplash(false);
      const token = localStorage.getItem("token");
      router.push(token ? "/dashboard" : "/login");
    }
  }, [router]);

  useEffect(() => {
    if (!showSplash) {
      sessionStorage.setItem("splashSeen", "1");
    }
  }, [showSplash]);

  return (
    <div className="min-h-screen bg-black">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </div>
  );
}