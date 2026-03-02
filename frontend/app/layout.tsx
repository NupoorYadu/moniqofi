import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ErrorBoundary from "./components/ErrorBoundary";
import Providers from "./Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MoniqoFi - AI-Powered Personal Finance",
    template: "%s | MoniqoFi",
  },
  description:
    "Smart financial management with AI-driven insights, budgeting, goal tracking, and personalized coaching.",
  keywords: [
    "personal finance",
    "budgeting",
    "AI finance",
    "money management",
    "financial health",
    "goal tracking",
  ],
  authors: [{ name: "MoniqoFi" }],
  creator: "MoniqoFi",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MoniqoFi",
    title: "MoniqoFi - AI-Powered Personal Finance",
    description:
      "Smart financial management with AI-driven insights, budgeting, goal tracking, and personalized coaching.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MoniqoFi - AI-Powered Personal Finance",
    description:
      "Smart financial management with AI-driven insights and personalized coaching.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
