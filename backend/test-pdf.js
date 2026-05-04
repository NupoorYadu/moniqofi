/**
 * Run:  node test-pdf.js "C:\path\to\phonepe.pdf"
 */
const fs   = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const file = process.argv[2];
if (!file) { console.error("Usage: node test-pdf.js <path-to-pdf>"); process.exit(1); }

const buf = fs.readFileSync(path.resolve(file));

pdfParse(buf).then((data) => {
  const text = data.text;
  console.log("\n=== BASIC INFO ===");
  console.log("Pages:", data.numpages);
  console.log("Total chars:", text.length);

  console.log("\n=== FIRST 2000 CHARS (raw) ===");
  console.log(JSON.stringify(text.slice(0, 2000)));

  console.log("\n=== LINES (first 60) ===");
  text.split("\n").slice(0, 60).forEach((l, i) => {
    console.log(`[${String(i).padStart(3)}] ${JSON.stringify(l)}`);
  });
}).catch((e) => {
  console.error("pdf-parse error:", e.message);
});
