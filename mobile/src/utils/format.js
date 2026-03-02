/**
 * Format number as Indian currency (₹)
 * e.g., 150000 → "₹1,50,000"
 */
export function formatINR(n) {
  if (n == null || isNaN(n)) return "₹0";
  const num = Math.round(Number(n));
  const isNegative = num < 0;
  const abs = Math.abs(num);
  return (isNegative ? "-₹" : "₹") + abs.toLocaleString("en-IN");
}

/**
 * Short currency format
 * e.g., 15000000 → "₹1.5 Cr", 150000 → "₹1.5L", 1500 → "₹1.5K"
 */
export function formatShort(n) {
  if (n == null || isNaN(n)) return "₹0";
  const num = Math.round(Number(n));
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (abs >= 10000000) return sign + "₹" + (abs / 10000000).toFixed(1) + " Cr";
  if (abs >= 100000) return sign + "₹" + (abs / 100000).toFixed(1) + "L";
  if (abs >= 1000) return sign + "₹" + (abs / 1000).toFixed(1) + "K";
  return sign + "₹" + abs;
}

/**
 * Format a date string to DD/MM/YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN");
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
