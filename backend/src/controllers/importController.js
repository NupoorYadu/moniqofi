const pool = require("../config/db");
const multer = require("multer");

// ─── Multer: memory storage (no disk writes) ───────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "text/csv"
      || file.originalname.endsWith(".csv")
      || file.mimetype === "application/vnd.ms-excel"
      || file.mimetype === "text/plain";
    cb(ok ? null : new Error("Only CSV files are supported"), ok);
  },
});
exports.uploadMiddleware = upload.single("file");

// ─── Tiny robust CSV row parser (handles quoted fields) ────────────────────
function parseCSVLine(line) {
  const cells = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (!inQ && (c === "," || c === "\t" || c === ";")) { cells.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

function parseCSV(raw) {
  const lines = raw.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  return lines.map(parseCSVLine);
}

// ─── Normalize string for comparison ───────────────────────────────────────
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ─── Bank profile detection ────────────────────────────────────────────────
// Maps bank → { date, description, debit, credit, balance } column name patterns
const BANK_PROFILES = [
  {
    bank: "HDFC Bank",
    detect: (h) => h.some((c) => norm(c).includes("narration") && h.some((c2) => norm(c2).includes("debitamount"))),
    cols: { date: ["date"], desc: ["narration"], debit: ["debitamount","debit"], credit: ["creditamount","credit"], balance: ["closingbalance","balance"] },
  },
  {
    bank: "SBI",
    detect: (h) => h.some((c) => norm(c).includes("withdrawalamt") || norm(c).includes("withdrawal")),
    cols: { date: ["txndate","date"], desc: ["description","particulars"], debit: ["withdrawalamt","withdrawal","debit"], credit: ["depositamt","deposit","credit"], balance: ["closingbalance","balance"] },
  },
  {
    bank: "ICICI Bank",
    detect: (h) => h.some((c) => norm(c).includes("transactiondate") || norm(c).includes("valuedate")) && h.some((c) => norm(c).includes("debit")),
    cols: { date: ["transactiondate","date"], desc: ["description","remarks"], debit: ["debit","withdrawalamount"], credit: ["credit","depositamount"], balance: ["balance"] },
  },
  {
    bank: "Axis Bank",
    detect: (h) => h.some((c) => norm(c).includes("trandate") || norm(c).includes("tran date")),
    cols: { date: ["trandate","tran date","date"], desc: ["particulars","narration","description"], debit: ["debit","withdrawal"], credit: ["credit","deposit"], balance: ["balance"] },
  },
  {
    bank: "Kotak Bank",
    detect: (h) => h.some((c) => norm(c).includes("kotак") || (norm(c).includes("txndate") && h.some((c2) => norm(c2).includes("chq")))),
    cols: { date: ["txndate","date"], desc: ["description","narration"], debit: ["debit"], credit: ["credit"], balance: ["balance"] },
  },
  // Generic fallback — handles most banks
  {
    bank: "Generic Bank",
    detect: () => true,
    cols: { date: ["date","txndate","transactiondate","valuedate","trandate"], desc: ["description","narration","particulars","remarks","details"], debit: ["debit","withdrawal","withdrawalamt","debitamount"], credit: ["credit","deposit","depositamt","creditamount"], balance: ["balance","closingbalance","availablebalance"] },
  },
];

function detectBank(headers) {
  const normalizedHeaders = headers.map(norm);
  return BANK_PROFILES.find((p) => p.detect(normalizedHeaders)) || BANK_PROFILES[BANK_PROFILES.length - 1];
}

// ─── Column index finder ───────────────────────────────────────────────────
function colIdx(headers, patterns) {
  const nh = headers.map(norm);
  for (const pat of patterns) {
    const idx = nh.findIndex((h) => h.includes(pat));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ─── Amount cleaner ────────────────────────────────────────────────────────
function cleanAmount(raw) {
  if (!raw) return 0;
  const num = parseFloat(String(raw).replace(/[₹,\s]/g, ""));
  return isNaN(num) ? 0 : Math.abs(num);
}

// ─── Date parser ───────────────────────────────────────────────────────────
function parseDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  // DD/MM/YYYY or DD-MM-YYYY (Indian bank format)
  const dm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dm) {
    const [, d, m, y] = dm;
    const year = y.length === 2 ? "20" + y : y;
    return new Date(`${year}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
  }
  // Already ISO
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// ─── Auto-categorizer ──────────────────────────────────────────────────────
const CATEGORY_RULES = [
  // ─ Income / Credits ─
  { cats: ["Income"],       kws: ["salary","salario","stipend","payroll","paycheck","income","freelance","rent received","dividend","interest credit","maturity","bonus received"] },
  // -─ Food ─
  { cats: ["Food"],         kws: ["swiggy","zomato","uber eats","blinkit","grofer","bigbasket","dunzo","domino","pizza","mcdonald","kfc","subway","burger","restaurant","cafe","food","snack","grocery","zepto","instamart","jiomart","mamaearth","haldiram"] },
  // ─ Transport ─
  { cats: ["Transport"],    kws: ["uber","ola","rapido","metro","irctc","railway","train","flight","indigo","airindia","spicejet","bus","petrol","diesel","fuel","fastag","toll","cab","auto","rickshaw","yulu","zoomcar","meru"] },
  // ─ Shopping ─
  { cats: ["Shopping"],     kws: ["amazon","flipkart","myntra","ajio","nykaa","meesho","snapdeal","shopify","shopclues","reliance","d-mart","dmart","westside","shoppers stop","lifestyle","pantaloon","lenskart","pepperfry","urban ladder"] },
  // ─ Bills & Utilities ─
  { cats: ["Bills"],        kws: ["bsnl","jio","airtel","vi","vodafone","idea","recharge","electricity","bescom","msedcl","tata power","gas","lpg","cylinder","water bill","broadband","wifi","ott","netflix","hotstar","prime video","disney","youtube premium","spotify","maintenance","society"] },
  // ─ Health ─
  { cats: ["Health"],       kws: ["pharmacy","medplus","netmeds","1mg","apollo","fortis","hospital","clinic","doctor","medicine","lab","diagnostic","health","fitness","gym","cult.fit","yoga"] },
  // ─ Entertainment ─
  { cats: ["Entertainment"],kws: ["bookmyshow","pvr","inox","cinema","movie","concert","gaming","steam","playstore","appstore","event"] },
  // ─ Education ─
  { cats: ["Education"],    kws: ["udemy","coursera","byju","unacademy","vedantu","tuition","college fee","school fee","university","exam fee","edtech","skillshare","books","stationery"] },
  // ─ EMI / Loans ─
  { cats: ["EMI"],          kws: ["emi","loan","hdfc bank emi","icici bank emi","bajaj","home loan","car loan","personal loan","navi","kreditbee","stashfin"] },
  // ─ UPI / Transfers ─
  { cats: ["Transfer"],     kws: ["upi","neft","rtgs","imps","transfer","sent to","received from","trf","cr by","dr to","account transfer","wallet"] },
  // ─ Investments ─
  { cats: ["Investment"],   kws: ["mutual fund","mf","sip","zerodha","groww","upstox","kuvera","smallcase","demat","ipo","nse","bse","stk buy","stk sell","gold","ppf","nps","rd ","fd ","recurring deposit","fixed deposit"] },
  // ─ Insurance ─
  { cats: ["Insurance"],    kws: ["lic","insurance","premium","policybazaar","star health","max life","hdfc life","term plan"] },
];

function categorize(description) {
  const lower = (description || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.kws.some((kw) => lower.includes(kw))) return rule.cats[0];
  }
  return "Other";
}

// ─── Parse rows from CSV using detected bank profile ──────────────────────
function parseRows(rows, headers, profile) {
  const dateI   = colIdx(headers, profile.cols.date);
  const descI   = colIdx(headers, profile.cols.desc);
  const debitI  = colIdx(headers, profile.cols.debit);
  const creditI = colIdx(headers, profile.cols.credit);

  const parsed = [];
  for (const row of rows) {
    if (row.length < 2 || row.every((c) => !c)) continue;

    const rawDate   = dateI  >= 0 ? row[dateI]   : "";
    const rawDesc   = descI  >= 0 ? row[descI]   : row.join(" ");
    const rawDebit  = debitI >= 0 ? row[debitI]  : "0";
    const rawCredit = creditI >= 0 ? row[creditI] : "0";

    const debit  = cleanAmount(rawDebit);
    const credit = cleanAmount(rawCredit);

    // Skip rows where both debit and credit are 0 (total rows, etc.)
    if (debit === 0 && credit === 0) continue;

    const amount = debit > 0 ? debit : credit;
    const type   = debit > 0 ? "expense" : "income";
    const title  = String(rawDesc).trim().substring(0, 100) || "Imported Transaction";
    const date   = parseDate(rawDate);
    const category = categorize(title);

    parsed.push({ title, amount, type, category, date: date ? date.toISOString() : null, raw: { date: rawDate, desc: rawDesc, debit: rawDebit, credit: rawCredit } });
  }
  return parsed;
}

// ─── Controller: Preview ──────────────────────────────────────────────────
// POST /api/transactions/import/preview
// Parses the CSV and returns rows — doesn't save anything yet
exports.previewImport = async (req, res) => {
  try {
    const buf = req.file?.buffer;
    if (!buf) return res.status(400).json({ message: "No file uploaded" });

    // Try UTF-8 first, fall back to latin1
    let text;
    try { text = buf.toString("utf8"); }
    catch { text = buf.toString("latin1"); }

    // Strip BOM if present
    text = text.replace(/^\uFEFF/, "");

    const allRows = parseCSV(text);
    if (allRows.length < 2) return res.status(400).json({ message: "CSV appears empty or has only one row" });

    // Find the header row — skip preamble lines (common in SBI/HDFC exports)
    let headerIdx = 0;
    const knownHeaderKeywords = ["date","txn","narration","description","debit","credit","withdrawal","deposit","amount","particulars"];
    for (let i = 0; i < Math.min(allRows.length, 15); i++) {
      const rowNorm = allRows[i].map(norm).join(" ");
      if (knownHeaderKeywords.some((kw) => rowNorm.includes(kw))) {
        headerIdx = i;
        break;
      }
    }

    const headers  = allRows[headerIdx];
    const dataRows = allRows.slice(headerIdx + 1);
    const profile  = detectBank(headers);
    const parsed   = parseRows(dataRows, headers, profile);

    if (parsed.length === 0) {
      return res.status(400).json({ message: "No valid transactions found. Check that your CSV has Date, Description, and Debit/Credit columns." });
    }

    res.json({
      bank:         profile.bank,
      total:        parsed.length,
      headers,
      transactions: parsed,
    });
  } catch (err) {
    console.error("Import preview error:", err);
    res.status(500).json({ message: "Failed to parse CSV: " + err.message });
  }
};

// ─── Controller: Confirm ──────────────────────────────────────────────────
// POST /api/transactions/import/confirm
// Accepts the parsed rows and saves them to the DB
exports.confirmImport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: "No transactions provided" });
    }

    if (transactions.length > 1000) {
      return res.status(400).json({ message: "Maximum 1000 transactions per import" });
    }

    let saved = 0;
    let skipped = 0;

    for (const txn of transactions) {
      const { title, amount, type, category, date } = txn;
      if (!title || !amount || !["income","expense"].includes(type)) { skipped++; continue; }
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) { skipped++; continue; }

      try {
        await pool.query(
          `INSERT INTO transactions (user_id, title, amount, type, category, source, created_at)
           VALUES ($1, $2, $3, $4, $5, 'import', $6)`,
          [userId, String(title).substring(0, 100), amt, type, category || "Other",
           date ? new Date(date) : new Date()]
        );
        saved++;
      } catch (e) {
        // Skip duplicates or any bad rows
        skipped++;
      }
    }

    res.json({ message: `Imported ${saved} transactions successfully`, saved, skipped });
  } catch (err) {
    console.error("Import confirm error:", err);
    res.status(500).json({ message: "Import failed: " + err.message });
  }
};
