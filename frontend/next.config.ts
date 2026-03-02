import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict React mode for catching bugs
  reactStrictMode: true,

  // Standalone output for Docker builds (copies only needed files)
  output: "standalone",

  // Disable x-powered-by header
  poweredByHeader: false,

  // Production security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Compression is handled by Next.js by default in production

  // Redirect trailing slashes for consistency
  skipTrailingSlashRedirect: false,
};

export default nextConfig;
