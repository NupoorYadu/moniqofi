"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MoniqoLogo from "./MoniqoLogo";

/**
 * Netflix-style cinematic splash screen.
 * Phases: darkness → logo reveal → glow pulse → text slide → hold → burst → fade.
 * Total duration: ~7.5 seconds, deliberate & cinematic.
 */
export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"dark" | "logo" | "text" | "hold" | "burst" | "done">("dark");

  /* Stable random values so particles don't re-randomize on phase change */
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        size: 1.5 + (((i * 7 + 3) % 11) / 11) * 3,
        color: i % 4 === 0 ? "#E50914" : i % 4 === 1 ? "#ff4555" : i % 4 === 2 ? "#ffffff18" : "#6366F130",
        x: ((i * 17 + 5) % 100),
        y: ((i * 31 + 11) % 100),
        drift: 80 + ((i * 13) % 120),
        dur: 3 + ((i * 7) % 4),
        delay: 1 + ((i * 11) % 30) / 10,
      })),
    []
  );

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("logo"), 400),        // 0.4s — darkness, then logo fades in
      setTimeout(() => setPhase("text"), 2600),        // 2.6s — text slides up
      setTimeout(() => setPhase("hold"), 4600),        // 4.6s — hold everything visible
      setTimeout(() => setPhase("burst"), 5800),       // 5.8s — burst & collapse
      setTimeout(() => setPhase("done"), 6800),        // 6.8s — exit animation starts
      setTimeout(onComplete, 7400),                    // 7.4s — call parent
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const isVisible = phase !== "done";
  const showLogo = phase !== "dark";
  const showText = phase === "text" || phase === "hold" || phase === "burst";
  const isBurst = phase === "burst";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* ─── Ambient particles ─── */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0],
                scale: [0, 1.2, 0],
                y: [0, -p.drift],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* ─── Red atmospheric fog ─── */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 700,
              height: 700,
              background:
                "radial-gradient(circle, rgba(229,9,20,0.12) 0%, rgba(229,9,20,0.04) 40%, transparent 70%)",
              filter: "blur(60px)",
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.6, 1.3], opacity: [0, 0.7, 0.35] }}
            transition={{ duration: 3.5, ease: "easeOut", delay: 0.3 }}
          />

          {/* Indigo secondary glow */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 450,
              height: 450,
              background:
                "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)",
              filter: "blur(40px)",
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3] }}
            transition={{ duration: 3, delay: 0.8, ease: "easeOut" }}
          />

          {/* ─── Main centred content ─── */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Logo wrapper */}
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={
                isBurst
                  ? { scale: [1, 1.25, 0], opacity: [1, 1, 0] }
                  : showLogo
                  ? { scale: [0.3, 1.15, 1], opacity: 1 }
                  : {}
              }
              transition={
                isBurst
                  ? { duration: 1, ease: [0.4, 0, 0.2, 1] }
                  : { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
              }
            >
              {/* Glow behind logo */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  width: 200,
                  height: 200,
                  background:
                    "radial-gradient(circle, rgba(229,9,20,0.35) 0%, transparent 70%)",
                  filter: "blur(25px)",
                  top: "50%",
                  left: "50%",
                  translate: "-50% -50%",
                }}
                initial={{ opacity: 0 }}
                animate={showLogo ? { opacity: [0, 1, 0.5] } : {}}
                transition={{ duration: 2, delay: 0.5 }}
              />

              {/* Outer spinning ring */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 180,
                  height: 180,
                  top: "50%",
                  left: "50%",
                  translate: "-50% -50%",
                  border: "2px solid transparent",
                  borderTopColor: "#E50914",
                  borderRightColor: "#E5091440",
                }}
                initial={{ opacity: 0, rotate: 0 }}
                animate={showLogo ? { opacity: [0, 0.7, 0], rotate: 720 } : {}}
                transition={{ duration: 3.5, ease: "easeInOut" }}
              />

              {/* Inner counter-spinning ring */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 220,
                  height: 220,
                  top: "50%",
                  left: "50%",
                  translate: "-50% -50%",
                  border: "1px solid transparent",
                  borderBottomColor: "#6366F125",
                  borderLeftColor: "#6366F110",
                }}
                initial={{ opacity: 0, rotate: 180 }}
                animate={showLogo ? { opacity: [0, 0.4, 0], rotate: -360 } : {}}
                transition={{ duration: 4, ease: "easeInOut", delay: 0.4 }}
              />

              <MoniqoLogo size={120} />
            </motion.div>

            {/* ─── Brand text ─── */}
            <motion.div
              className="mt-10 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={showText && !isBurst ? { opacity: 1 } : isBurst ? { opacity: 0 } : {}}
              transition={{ duration: isBurst ? 0.6 : 0.5 }}
            >
              {/* MoniqoFi title */}
              <motion.h1
                className="text-5xl sm:text-6xl font-black tracking-tight text-center"
                initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
                animate={
                  showText
                    ? isBurst
                      ? { y: -20, opacity: 0, filter: "blur(4px)", scale: 0.95 }
                      : { y: 0, opacity: 1, filter: "blur(0px)" }
                    : {}
                }
                transition={{
                  duration: isBurst ? 0.7 : 1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <span className="text-[#E50914]">Moniqo</span>
                <span className="text-white">Fi</span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                className="text-gray-500 text-sm sm:text-base mt-3 tracking-[0.3em] uppercase text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={
                  showText && !isBurst
                    ? { opacity: 0.7, y: 0 }
                    : isBurst
                    ? { opacity: 0, y: -10 }
                    : {}
                }
                transition={{
                  duration: isBurst ? 0.5 : 0.9,
                  delay: isBurst ? 0 : 0.3,
                  ease: "easeOut",
                }}
              >
                Smart Finance, Smarter You
              </motion.p>

              {/* Subtle divider line */}
              <motion.div
                className="mt-5 h-px bg-gradient-to-r from-transparent via-[#E50914]/30 to-transparent"
                initial={{ width: 0 }}
                animate={showText && !isBurst ? { width: 180 } : { width: 0 }}
                transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
              />
            </motion.div>

            {/* ─── Red light burst ─── */}
            <AnimatePresence>
              {isBurst && (
                <>
                  {/* Central flash */}
                  <motion.div
                    className="absolute pointer-events-none"
                    style={{
                      width: 400,
                      height: 400,
                      top: "50%",
                      left: "50%",
                      translate: "-50% -50%",
                      background:
                        "radial-gradient(circle, rgba(229,9,20,0.7) 0%, rgba(229,9,20,0.15) 40%, transparent 65%)",
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 3.5], opacity: [1, 0] }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />

                  {/* Light rays */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={`ray-${i}`}
                      className="absolute pointer-events-none"
                      style={{
                        width: 2,
                        height: 100,
                        top: "50%",
                        left: "50%",
                        translate: "-50% -100%",
                        background: "linear-gradient(to top, #E50914, transparent)",
                        transformOrigin: "bottom center",
                        rotate: `${i * 30}deg`,
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: [0, 1, 0], opacity: [0, 0.8, 0] }}
                      transition={{ duration: 0.8, delay: i * 0.025, ease: "easeOut" }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Bottom loading bar ─── */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-56 flex flex-col items-center gap-3">
            <div className="w-full h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#E50914] to-[#ff4555]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
            <motion.span
              className="text-[10px] tracking-[0.25em] uppercase text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              Loading
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
