const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

/**
 * Build the wallet SVG.
 * @param {number} size      - Output pixel size (informational, resvg handles scaling)
 * @param {string} bg        - Background fill ("#0A0A0A" | "transparent")
 * @param {boolean} adaptive - true = add 22% padding on each side for Android adaptive safe zone
 */
function buildSVG(size, bg = "#0A0A0A", adaptive = false) {
  // For adaptive icons the wallet must fit inside the ~66% safe-zone circle.
  // We expand the viewBox by 32 units on each side (content 120, total 184) → padding = 32/184 ≈ 17%
  // Combined with Android's own 18% masking this keeps all artwork in the safe zone.
  const PAD   = adaptive ? 32 : 0;
  const TOTAL = 120 + PAD * 2; // 184 or 120
  const vbX   = -PAD;
  const vbY   = -PAD;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="${vbX} ${vbY} ${TOTAL} ${TOTAL}" fill="none"
  xmlns="http://www.w3.org/2000/svg">

  <!-- Background (skipped for adaptive/transparent) -->
  ${bg !== "transparent" ? `<rect x="${vbX}" y="${vbY}" width="${TOTAL}" height="${TOTAL}" rx="${TOTAL * 0.12}" fill="${bg}"/>` : ""}

  <!-- Back banknote — teal, angled left -->
  <g transform="rotate(-15 30 35)">
    <rect x="10" y="6" width="38" height="56" rx="6" fill="#2DD4BF"/>
    <rect x="17" y="18" width="24" height="2.5" rx="1.2" fill="#fff" opacity="0.35"/>
    <rect x="17" y="24" width="17" height="2" rx="1" fill="#fff" opacity="0.2"/>
    <rect x="17" y="44" width="24" height="2" rx="1" fill="#fff" opacity="0.15"/>
  </g>

  <!-- Front banknote — mint green, slight angle -->
  <g transform="rotate(6 52 26)">
    <rect x="34" y="2" width="34" height="52" rx="6" fill="#86EFAC"/>
    <rect x="41" y="14" width="20" height="2.5" rx="1.2" fill="#fff" opacity="0.35"/>
    <rect x="41" y="20" width="14" height="2" rx="1" fill="#fff" opacity="0.2"/>
    <rect x="41" y="36" width="20" height="2" rx="1" fill="#fff" opacity="0.15"/>
  </g>

  <!-- Gold coin -->
  <circle cx="84" cy="22" r="18" fill="#FBBF24"/>
  <circle cx="84" cy="22" r="14" fill="none" stroke="#D97706" stroke-width="2"/>
  <circle cx="84" cy="22" r="8" fill="none" stroke="#D97706" stroke-width="1" opacity="0.4"/>
  <path d="M82.5 15V16.5M82.5 27.5V29M80 18.5C80 17.1 81.2 16 82.7 16H83.3C84.8 16 86 17.1 86 18.5C86 19.9 84.8 21 83.3 21H82C80.6 21 79.5 22.1 79.5 23.5C79.5 24.9 80.6 26 82 26H83C84.4 26 85.5 24.9 85.5 23.5"
    stroke="#D97706" stroke-width="1.4" stroke-linecap="round" fill="none"/>

  <!-- Wallet body -->
  <rect x="6" y="44" width="86" height="62" rx="12" fill="#1E293B"/>
  <!-- Wallet top band -->
  <path d="M6 56C6 49.4 11.4 44 18 44H80C86.6 44 92 49.4 92 56V58H6V56Z" fill="#334155"/>

  <!-- Uptrend chart line -->
  <polyline points="18,92 26,86 34,89 44,78 52,82 60,73"
    stroke="#10B981" stroke-width="2.8" fill="none"
    stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="60" cy="73" r="3" fill="#10B981"/>
  <circle cx="60" cy="73" r="1.2" fill="#fff"/>

  <!-- Decorative fintech circuit dots -->
  <circle cx="74" cy="90" r="2.2" fill="#FBBF24" opacity="0.55"/>
  <circle cx="82" cy="82" r="1.8" fill="#FBBF24" opacity="0.4"/>
  <line x1="74" y1="90" x2="82" y2="82" stroke="#FBBF24" stroke-width="0.9" opacity="0.35"/>
  <circle cx="86" cy="94" r="1.2" fill="#FBBF24" opacity="0.3"/>
  <line x1="74" y1="90" x2="86" y2="94" stroke="#FBBF24" stroke-width="0.6" opacity="0.2"/>
</svg>`;
}

const assetsDir = path.join(__dirname, "..", "assets");

const targets = [
  { name: "icon.png",          size: 1024, bg: "#0A0A0A",    adaptive: false },
  { name: "adaptive-icon.png", size: 1024, bg: "transparent", adaptive: true  },
  { name: "splash-icon.png",   size: 1024, bg: "#0A0A0A",    adaptive: false },
  { name: "favicon.png",       size: 48,   bg: "#0A0A0A",    adaptive: false },
];

for (const { name, size, bg, adaptive } of targets) {
  const svg = buildSVG(size, bg, adaptive);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  const png = resvg.render().asPng();
  const outPath = path.join(assetsDir, name);
  fs.writeFileSync(outPath, png);
  console.log(`✅ ${name} — ${size}x${size} — ${(png.length / 1024).toFixed(1)} KB`);
}

console.log("\nAll icons generated successfully!");
