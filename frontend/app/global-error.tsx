"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0A0A0A", color: "#fff", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: 16, background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: "#808080", fontSize: 14, marginBottom: 24 }}>
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              style={{ padding: "12px 32px", borderRadius: 12, background: "linear-gradient(135deg, #E50914, #B20710)", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 14 }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
